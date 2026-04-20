import { useRef, useState, useEffect, useCallback } from "react";
import { Camera, X, RotateCcw, Sparkles } from "lucide-react";

interface Props {
  mode: "problem" | "code";
  onResult: (text: string) => void;
}

type Step = "idle" | "preview" | "captured" | "parsing" | "error";

export function CameraCapture({ mode, onResult }: Props) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [capturedSrc, setCapturedSrc] = useState("");
  const [capturedBase64, setCapturedBase64] = useState("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setStep("preview");
    } catch {
      setErrorMsg("Camera access denied. Allow camera permissions and try again.");
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

  function capture() {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const MAX_DIM = 1024;
    const scale = Math.min(1, MAX_DIM / Math.max(video.videoWidth, video.videoHeight));
    const w = Math.round(video.videoWidth * scale);
    const h = Math.round(video.videoHeight * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    canvas.getContext("2d")!.drawImage(video, 0, 0, w, h);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    const base64 = dataUrl.split(",")[1];
    setCapturedSrc(dataUrl);
    setCapturedBase64(base64);
    stopCamera();
    setStep("captured");
  }

  function retake() {
    setCapturedSrc("");
    setCapturedBase64("");
    setStep("idle");
    startCamera();
  }

  async function parse() {
    setStep("parsing");
    try {
      const res = await fetch("/api/parse-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: capturedBase64, mimeType: "image/jpeg", mode }),
      });
      if (!res.ok) {
        const ct = res.headers.get("content-type") ?? "";
        let msg = `Request failed (${res.status})`;
        if (ct.includes("application/json")) {
          const data = (await res.json().catch(() => null)) as { error?: string } | null;
          if (data?.error) msg = data.error;
        }
        throw new Error(msg);
      }
      const { text } = (await res.json()) as { text: string };
      onResult(text);
      handleClose();
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Parse failed — try again.");
      setStep("error");
    }
  }

  const label = mode === "problem" ? "problem statement" : "code";

  return (
    <>
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
                <p className="text-xs text-gray-400 mt-0.5">
                  {step === "preview" && "Point at the content, then capture."}
                  {step === "captured" && "Looks good? Parse it, or retake."}
                  {step === "parsing" && "Sending to Claude..."}
                  {step === "error" && "Something went wrong."}
                  {step === "idle" && "Starting camera..."}
                </p>
              </div>
              <button onClick={handleClose} className="text-gray-400 hover:text-gray-700">
                <X size={18} />
              </button>
            </div>

            {/* Viewfinder / preview — object-contain so the preview shows the exact frame that will be captured */}
            <div className="relative bg-black aspect-video">
              {(step === "preview" || step === "idle") && (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-contain"
                />
              )}
              {step === "captured" && capturedSrc && (
                <img src={capturedSrc} alt="captured" className="w-full h-full object-contain" />
              )}
              {step === "parsing" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white">
                  <Sparkles size={28} className="animate-pulse text-indigo-400" />
                  <p className="text-sm">Parsing with Claude...</p>
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
              {step === "preview" && (
                <button
                  onClick={capture}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <Camera size={14} /> Capture
                </button>
              )}
              {step === "captured" && (
                <>
                  <button
                    onClick={retake}
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
                  onClick={retake}
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
