import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, RefreshCw, Check, X, Upload } from 'lucide-react';

interface Props {
  label: string;
  onCapture: (file: File) => void;
}

const BLUR_THRESHOLD = 60; // Laplacian variance threshold (tuned for 720p)

const computeBlurScore = (ctx: CanvasRenderingContext2D, w: number, h: number): number => {
  // Sample a centered patch to keep it fast
  const sw = Math.min(320, w);
  const sh = Math.min(200, h);
  const sx = Math.floor((w - sw) / 2);
  const sy = Math.floor((h - sh) / 2);
  const img = ctx.getImageData(sx, sy, sw, sh);
  const data = img.data;
  // Convert to grayscale Float32
  const gray = new Float32Array(sw * sh);
  for (let i = 0, j = 0; i < data.length; i += 4, j++) {
    gray[j] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }
  // 3x3 Laplacian
  let sum = 0;
  let sumSq = 0;
  let count = 0;
  for (let y = 1; y < sh - 1; y++) {
    for (let x = 1; x < sw - 1; x++) {
      const i = y * sw + x;
      const v =
        -gray[i - sw - 1] - gray[i - sw] - gray[i - sw + 1] -
        gray[i - 1] + 8 * gray[i] - gray[i + 1] -
        gray[i + sw - 1] - gray[i + sw] - gray[i + sw + 1];
      sum += v;
      sumSq += v * v;
      count++;
    }
  }
  const mean = sum / count;
  const variance = sumSq / count - mean * mean;
  return variance;
};

const SmartAadhaarCapture: React.FC<Props> = ({ label, onCapture }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [open, setOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [error, setError] = useState<string>('');
  const [busy, setBusy] = useState(false);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setOpen(true);
    } catch (err) {
      console.warn('Camera unavailable, falling back to file input.');
      setOpen(false);
      fileInputRef.current?.click();
    }
  }, []);

  useEffect(() => () => stopStream(), [stopStream]);

  const captureFrame = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    setBusy(true);
    setError('');
    try {
      const w = video.videoWidth;
      const h = video.videoHeight;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, w, h);

      const score = computeBlurScore(ctx, w, h);
      if (score < BLUR_THRESHOLD) {
        setError('Image not clear. Please retake.');
        setBusy(false);
        return;
      }

      // Crop to guide rectangle (CR80 aspect ~1.586:1) — center of frame, 85% width
      const cropW = Math.floor(w * 0.85);
      const cropH = Math.floor(cropW / 1.586);
      const cx = Math.floor((w - cropW) / 2);
      const cy = Math.floor((h - cropH) / 2);
      const out = document.createElement('canvas');
      out.width = cropW;
      out.height = cropH;
      out.getContext('2d')!.drawImage(canvas, cx, cy, cropW, cropH, 0, 0, cropW, cropH);

      const blob: Blob = await new Promise((resolve) =>
        out.toBlob((b) => resolve(b!), 'image/jpeg', 0.9)
      );
      const file = new File([blob], `aadhaar_${Date.now()}.jpg`, { type: 'image/jpeg' });
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      setPendingFile(file);
      stopStream();
    } finally {
      setBusy(false);
    }
  }, [stopStream]);

  const accept = () => {
    if (pendingFile) onCapture(pendingFile);
    cleanup();
  };

  const retake = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl('');
    setPendingFile(null);
    setError('');
    startCamera();
  };

  const cleanup = () => {
    stopStream();
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl('');
    setPendingFile(null);
    setError('');
    setOpen(false);
  };

  const handleFallbackFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) onCapture(f);
    e.target.value = '';
  };

  return (
    <>
      <Button type="button" onClick={startCamera} variant="outline" className="w-full">
        <Camera className="w-4 h-4 mr-2" />
        {label}
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFallbackFile}
        className="hidden"
      />

      {open && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-2xl">
            <div className="text-white text-center mb-3 font-medium">{label}</div>

            {!previewUrl ? (
              <div className="relative w-full aspect-[4/3] bg-black rounded-xl overflow-hidden">
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className="absolute inset-0 w-full h-full object-cover"
                />
                {/* Guide overlay */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div
                    className="border-2 border-primary rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.55)] relative"
                    style={{ width: '85%', aspectRatio: '1.586 / 1' }}
                  >
                    {/* Corner brackets */}
                    <span className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl" />
                    <span className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr" />
                    <span className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl" />
                    <span className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br" />
                    {/* Scan line */}
                    <div className="absolute inset-x-2 top-0 h-0.5 bg-primary/80 animate-[scan_2s_ease-in-out_infinite]" />
                  </div>
                </div>
                <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-3 py-1 rounded-full">
                  Align Aadhaar inside the frame
                </div>
              </div>
            ) : (
              <div className="relative w-full bg-black rounded-xl overflow-hidden">
                <img src={previewUrl} alt="Captured" className="w-full" />
              </div>
            )}

            {error && (
              <div className="mt-3 text-center text-sm text-destructive bg-destructive/10 border border-destructive/40 rounded-lg py-2 px-3">
                {error}
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              {!previewUrl ? (
                <>
                  <Button onClick={captureFrame} disabled={busy} size="lg" className="rounded-full">
                    <Camera className="w-5 h-5 mr-2" />
                    {busy ? 'Checking…' : 'Capture'}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      cleanup();
                      fileInputRef.current?.click();
                    }}
                  >
                    <Upload className="w-4 h-4 mr-2" /> Upload Instead
                  </Button>
                  <Button type="button" variant="ghost" onClick={cleanup} className="text-white hover:bg-white/10">
                    <X className="w-4 h-4 mr-2" /> Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button onClick={accept} size="lg" className="rounded-full">
                    <Check className="w-5 h-5 mr-2" /> Use Photo
                  </Button>
                  <Button type="button" variant="secondary" onClick={retake}>
                    <RefreshCw className="w-4 h-4 mr-2" /> Retake
                  </Button>
                  <Button type="button" variant="ghost" onClick={cleanup} className="text-white hover:bg-white/10">
                    <X className="w-4 h-4 mr-2" /> Cancel
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SmartAadhaarCapture;
