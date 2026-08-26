import { useRef, useState, useEffect, useCallback } from "react";
import { Camera, ScanText, Sparkles, Upload, X, RotateCcw } from "lucide-react";
import { apiUrl } from "../lib/api";
import { extractPdfText, ocrImage } from "../lib/localParse";

interface Props {
  mode: "problem" | "code";
  onResult: (text: string) => void;
}

type Step = "idle" | "preview" | "captured" | "parsing" | "error";
// What the parsing step is running: on-device OCR, PDF text extraction, or the
// server parse endpoint.
type Engine = "ocr" | "pdf" | "server";

const MAX_DIM = 1024;

export function CameraCapture({ mode, onResult }: Props) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("idle");
  const [engine, setEngine] = useState<Engine>("ocr");
  const [progress, setProgress] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [capturedSrc, setCapturedSrc] = useState("");
  const [capturedBase64, setCapturedBase64] = useState("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  // Mirrors `step` so the async camera startup can tell whether an upload or
  // capture already advanced the flow while getUserMedia was pending.
  const stepRef = useRef<Step>("idle");
  useEffect(() => {
    stepRef.current = step;
  }, [step]);

  const cameraSuperseded = () =>
    stepRef.current !== "idle" && stepRef.current !== "preview";

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      // An upload can race ahead of camera startup — drop the stream instead
      // of stomping the captured/parsing state back to the viewfinder.
      if (cameraSuperseded()) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setStep("preview");
    } catch {
      if (cameraSuperseded()) return;
      setErrorMsg("Camera access denied. Allow camera permissions, or upload a file instead.");
      setStep("error");
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  function handleOpen() {
    setStep("idle");
    setCapturedSrc("");
    setCapturedBase64("");
    setErrorMsg("");
    setOpen(true);
  }

  function handleClose() {
    stopCamera();
    setOpen(false);
    setStep("idle");
  }

  useEffect(() => {
    if (open) startCamera();
    return () => { if (!open) stopCamera(); };
  }, [open, startCamera, stopCamera]);

  // Normalize any drawable source to a ≤1024px JPEG, so OCR and the server
  // parse endpoint both get the same bounded payload.
  function ingest(source: HTMLVideoElement | HTMLImageElement) {
    const sw = source instanceof HTMLVideoElement ? source.videoWidth : source.naturalWidth;
    const sh = source instanceof HTMLVideoElement ? source.videoHeight : source.naturalHeight;
    const scale = Math.min(1, MAX_DIM / Math.max(sw, sh));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(sw * scale);
    canvas.height = Math.round(sh * scale);
    canvas.getContext("2d")!.drawImage(source, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    setCapturedSrc(dataUrl);
    setCapturedBase64(dataUrl.split(",")[1]);
    stopCamera();
    setStep("captured");
  }

  function capture() {
    if (videoRef.current) ingest(videoRef.current);
  }

  function retake() {
    setCapturedSrc("");
    setCapturedBase64("");
    setStep("idle");
    startCamera();
  }

  function fail(message: string) {
    setErrorMsg(message);
    setStep("error");
  }

  async function handleFile(file: File) {
    if (file.type === "application/pdf" || /\.pdf$/i.test(file.name)) {
      setEngine("pdf");
      setProgress("");
      setStep("parsing");
      stopCamera();
      try {
        const text = await extractPdfText(await file.arrayBuffer(), (page, total) =>
          setProgress(`${page}/${total} pages`)
        );
        if (!text) return fail("No text layer found in this PDF — try a screenshot of it instead.");
        onResult(text);
        handleClose();
      } catch {
        fail("Couldn't read that PDF — try a different file.");
      }
      return;
    }
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("bad image"));
        img.src = url;
      });
      ingest(img);
    } catch {
      fail("Couldn't read that file — upload an image or a PDF.");
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  // On-device OCR — free, nothing leaves the browser.
  async function extractText() {
    setEngine("ocr");
    setProgress("");
    setStep("parsing");
    try {
      const text = await ocrImage(capturedSrc, (pct) => setProgress(`${pct}%`));
      if (text.length < 8) {
        return fail("Couldn't find readable text — retake closer, or try Parse.");
      }
      onResult(text);
      handleClose();
    } catch {
      fail("On-device OCR failed to load — check your connection or try Parse.");
    }
  }

  // Server-side AI parse — cleaner output for photos, but rate-limited.
  async function parse() {
    setEngine("server");
    setProgress("");
    setStep("parsing");
    try {
      const res = await fetch(apiUrl("/api/parse-image"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ image: capturedBase64, mimeType: "image/jpeg", mode }),
      });
      if (res.status === 429) throw new Error("Rate limit reached — max 10 parses per hour. Extract text runs on-device with no limit.");
      if (!res.ok) throw new Error(await res.text());
      const { text } = await res.json() as { text: string };
      onResult(text);
      handleClose();
    } catch (e) {
      fail(e instanceof Error ? e.message : "Parse failed — try again.");
    }
  }

  const label = mode === "problem" ? "problem statement" : "code";
  const parsingMessage =
    engine === "ocr"
      ? `Reading text on-device… ${progress}`
      : engine === "pdf"
        ? `Extracting PDF text… ${progress}`
        : "Parsing…";

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        title={`Capture ${label} from camera or file`}
        className="flex items-center gap-1 px-2 py-1 text-xs text-cyan-600 border border-cyan-500/30 rounded-none hover:bg-cyan-50 transition-colors"
      >
        <Camera size={13} /> Capture
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-white/95 backdrop-blur-2xl border border-slate-900/10 rounded-none shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-900/5">
              <div>
                <p className="font-semibold text-slate-900 text-sm">Capture {label}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {step === "preview" && "Point at the content and capture, or upload an image/PDF."}
                  {step === "captured" && "Extract text on-device (free), or Parse for cleaner output."}
                  {step === "parsing" && parsingMessage}
                  {step === "error" && "Something went wrong."}
                  {step === "idle" && "Starting camera..."}
                </p>
              </div>
              <button onClick={handleClose} className="text-slate-500 hover:text-slate-900">
                <X size={18} />
              </button>
            </div>

            {/* Viewfinder / preview */}
            <div className="relative bg-black aspect-video">
              {(step === "preview" || step === "idle") && (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              )}
              {step === "captured" && capturedSrc && (
                <img src={capturedSrc} alt="captured" className="w-full h-full object-cover" />
              )}
              {step === "parsing" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white">
                  {engine === "server" ? (
                    <Sparkles size={28} className="animate-pulse text-cyan-600" />
                  ) : (
                    <ScanText size={28} className="animate-pulse text-cyan-600" />
                  )}
                  <p className="text-sm">{parsingMessage}</p>
                </div>
              )}
              {step === "error" && (
                <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-red-700 text-sm">
                  {errorMsg}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-slate-900/5">
              <input
                ref={fileRef}
                type="file"
                accept="image/*,application/pdf,.pdf"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.target.value = "";
                  if (f) void handleFile(f);
                }}
              />
              {step !== "parsing" && (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-2 border border-slate-900/10 text-slate-700 text-sm rounded-none hover:bg-slate-900/5 transition-colors mr-auto"
                >
                  <Upload size={13} /> Upload
                </button>
              )}
              {step === "preview" && (
                <button
                  onClick={capture}
                  className="flex items-center gap-1.5 px-4 py-2 bg-cyan-600 text-white text-sm font-semibold rounded-none hover:bg-cyan-700 transition-colors"
                >
                  <Camera size={14} /> Capture
                </button>
              )}
              {step === "captured" && (
                <>
                  <button
                    onClick={retake}
                    className="flex items-center gap-1.5 px-3 py-2 border border-slate-900/10 text-slate-700 text-sm rounded-none hover:bg-slate-900/5 transition-colors"
                  >
                    <RotateCcw size={13} /> Retake
                  </button>
                  <button
                    onClick={extractText}
                    className="flex items-center gap-1.5 px-4 py-2 bg-cyan-600 text-white text-sm font-semibold rounded-none hover:bg-cyan-700 transition-colors"
                  >
                    <ScanText size={14} /> Extract text
                  </button>
                  <button
                    onClick={parse}
                    className="flex items-center gap-1.5 px-3 py-2 border border-cyan-500/30 text-cyan-700 text-sm rounded-none hover:bg-cyan-50 transition-colors"
                  >
                    <Sparkles size={13} /> Parse
                  </button>
                </>
              )}
              {step === "error" && (
                <button
                  onClick={retake}
                  className="flex items-center gap-1.5 px-3 py-2 border border-slate-900/10 text-slate-700 text-sm rounded-none hover:bg-slate-900/5 transition-colors"
                >
                  <RotateCcw size={13} /> Try again
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
