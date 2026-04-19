import { useRef, useState, useEffect, useCallback } from "react";
import { Camera, X, RotateCcw, Sparkles } from "lucide-react";

interface Props {
  mode: "problem" | "code";
  onResult: (text: string) => void;
}

type Step = "idle" | "preview" | "captured" | "parsing" | "error";

// iOS non-Safari (Chrome, Firefox, Edge on iOS) blocks getUserMedia via WebKit
// entitlement restrictions. Any browser without the API also falls back.
function detectInputMethod(): "stream" | "file" {
  if (typeof navigator === "undefined") return "file";
  if (!navigator.mediaDevices?.getUserMedia) return "file";
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as unknown as Record<string, unknown>).MSStream;
  const isSafariOnIOS = isIOS && /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
  return isIOS && !isSafariOnIOS ? "file" : "stream";
}

function resizeToBase64(source: HTMLVideoElement | HTMLImageElement, maxDim = 1024, quality = 0.85): { dataUrl: string; base64: string } {
  const w = "videoWidth" in source ? source.videoWidth : source.naturalWidth;
  const h = "videoHeight" in source ? source.videoHeight : source.naturalHeight;
  const scale = Math.min(1, maxDim / Math.max(w, h));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  canvas.getContext("2d")!.drawImage(source, 0, 0, canvas.width, canvas.height);
  const dataUrl = canvas.toDataURL("image/jpeg", quality);
  return { dataUrl, base64: dataUrl.split(",")[1] };
}

export function CameraCapture({ mode, onResult }: Props) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [capturedSrc, setCapturedSrc] = useState("");
  const [capturedBase64, setCapturedBase64] = useState("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputMethod = useRef(detectInputMethod());

  // ── Stream path ─────────────────────────────────────────────────────────────
  const startStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setStep("preview");
    } catch {
      // Gracefully fall back to file input if getUserMedia fails at runtime
      // (e.g. Android browser that reports support but then denies)
      inputMethod.current = "file";
      fileInputRef.current?.click();
      setOpen(false);
    }
  }, []);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    if (open && inputMethod.current === "stream") startStream();
    return () => stopStream();
  }, [open, startStream, stopStream]);

  function captureFrame() {
    if (!videoRef.current) return;
    const { dataUrl, base64 } = resizeToBase64(videoRef.current);
    setCapturedSrc(dataUrl);
    setCapturedBase64(base64);
    stopStream();
    setStep("captured");
  }

  function retakeStream() {
    setCapturedSrc("");
    setCapturedBase64("");
    setStep("idle");
    startStream();
  }

  // ── File input path (iOS Chrome, Android fallback) ───────────────────────────
  function handleOpen() {
    setStep("idle");
    setCapturedSrc("");
    setCapturedBase64("");
    setErrorMsg("");
    if (inputMethod.current === "file") {
      fileInputRef.current?.click();
    } else {
      setOpen(true);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      const { dataUrl, base64 } = resizeToBase64(img);
      URL.revokeObjectURL(objectUrl);
      setCapturedSrc(dataUrl);
      setCapturedBase64(base64);
      setStep("captured");
      setOpen(true);
      // Reset input so the same file can be re-selected on retake
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    img.src = objectUrl;
  }

  function retakeFile() {
    setCapturedSrc("");
    setCapturedBase64("");
    setStep("idle");
    setOpen(false);
    setTimeout(() => fileInputRef.current?.click(), 50);
  }

  // ── Shared ────────────────────────────────────────────────────────────────────
  function handleClose() {
    stopStream();
    setOpen(false);
    setStep("idle");
  }

  async function parse() {
    setStep("parsing");
    try {
      const res = await fetch("/api/parse-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: capturedBase64, mimeType: "image/jpeg", mode }),
      });
      if (res.status === 429) throw new Error("Rate limit reached — max 10 parses per hour.");
      if (!res.ok) throw new Error(await res.text());
      const { text } = (await res.json()) as { text: string };
      onResult(text);
      handleClose();
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Parse failed — try again.");
      setStep("error");
    }
  }

  const isFile = inputMethod.current === "file";
  const label = mode === "problem" ? "problem statement" : "code";

  const stepLabel: Record<Step, string> = {
    idle:     "Starting camera…",
    preview:  "Point at the content, then capture.",
    captured: "Looks good? Parse it, or retake.",
    parsing:  "Sending to Claude…",
    error:    "Something went wrong.",
  };

  return (
    <>
      {/* Hidden file input — used by both iOS path and Android fallback */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

      <button
        type="button"
        onClick={handleOpen}
        title={`Capture ${label} from camera`}
        className="flex items-center gap-1 px-2 py-1 text-xs text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors"
      >
        <Camera size={13} /> Capture
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
              <div>
                <p className="font-semibold text-gray-900 text-sm">Capture {label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{stepLabel[step]}</p>
              </div>
              <button onClick={handleClose} className="text-gray-400 hover:text-gray-700">
                <X size={18} />
              </button>
            </div>

            {/* Viewfinder / preview */}
            <div className="relative bg-black aspect-video">
              {!isFile && (step === "preview" || step === "idle") && (
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              )}
              {step === "captured" && capturedSrc && (
                <img src={capturedSrc} alt="captured" className="w-full h-full object-cover" />
              )}
              {step === "parsing" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white">
                  <Sparkles size={28} className="animate-pulse text-indigo-400" />
                  <p className="text-sm">Parsing with Claude…</p>
                </div>
              )}
              {step === "error" && (
                <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-red-300 text-sm">
                  {errorMsg}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-gray-100">
              {!isFile && step === "preview" && (
                <button
                  onClick={captureFrame}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <Camera size={14} /> Capture
                </button>
              )}
              {step === "captured" && (
                <>
                  <button
                    onClick={isFile ? retakeFile : retakeStream}
                    className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <RotateCcw size={13} /> Retake
                  </button>
                  <button
                    onClick={parse}
                    className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    <Sparkles size={14} /> Parse with Claude
                  </button>
                </>
              )}
              {step === "error" && (
                <button
                  onClick={isFile ? retakeFile : retakeStream}
                  className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition-colors"
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
