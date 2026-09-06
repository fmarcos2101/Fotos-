import { useEffect, useRef, type PointerEvent, type WheelEvent } from "react";
import type { CropRect } from "../lib/crop";
import { clampCrop, coverCrop, moveCrop, zoomCrop } from "../lib/crop";
import { clamp } from "../lib/units";

type CropEditorProps = {
  image: ImageBitmap;
  crop: CropRect;
  aspect: number;
  sizeLabel: string;
  onCropChange: (crop: CropRect) => void;
};

export function CropEditor({ image, crop, aspect, sizeLabel, onCropChange }: CropEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cropRef = useRef(crop);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ distance: number; crop: CropRect } | null>(null);

  useEffect(() => {
    cropRef.current = crop;
  }, [crop]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function frameRect(width: number, height: number) {
      const pad = Math.min(width, height) * 0.08;
      const maxW = width - pad * 2;
      const maxH = height - pad * 2;
      let w = maxW;
      let h = w / aspect;
      if (h > maxH) {
        h = maxH;
        w = h * aspect;
      }
      return { x: (width - w) / 2, y: (height - h) / 2, w, h };
    }

    function imagePlacement(width: number, height: number, nextCrop: CropRect) {
      const frame = frameRect(width, height);
      const scale = frame.w / nextCrop.w;
      return {
        frame,
        left: frame.x - nextCrop.x * scale,
        top: frame.y - nextCrop.y * scale,
        drawW: image.width * scale,
        drawH: image.height * scale,
      };
    }

    function paint() {
      const surface = canvasRef.current;
      if (!surface) return;
      const dpr = window.devicePixelRatio || 1;
      const cssW = surface.clientWidth;
      const cssH = surface.clientHeight;
      surface.width = Math.round(cssW * dpr);
      surface.height = Math.round(cssH * dpr);
      const ctx = surface.getContext("2d");
      if (!ctx) return;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = "#1c1916";
      ctx.fillRect(0, 0, cssW, cssH);

      const nextCrop = cropRef.current;
      const { frame, left, top, drawW, drawH } = imagePlacement(cssW, cssH, nextCrop);

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(image, left, top, drawW, drawH);

      ctx.save();
      ctx.fillStyle = "rgba(14, 11, 9, 0.52)";
      ctx.beginPath();
      ctx.rect(0, 0, cssW, cssH);
      ctx.rect(frame.x, frame.y, frame.w, frame.h);
      ctx.fill("evenodd");
      ctx.restore();

      ctx.strokeStyle = "#fff6ec";
      ctx.lineWidth = 2;
      ctx.strokeRect(frame.x + 1, frame.y + 1, frame.w - 2, frame.h - 2);

      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = "rgba(255, 246, 236, 0.45)";
      ctx.strokeRect(frame.x + frame.w / 3, frame.y, frame.w / 3, frame.h);
      ctx.strokeRect(frame.x, frame.y + frame.h / 3, frame.w, frame.h / 3);
      ctx.setLineDash([]);

      ctx.font = "600 13px Outfit, sans-serif";
      ctx.fillStyle = "#fff6ec";
      ctx.textAlign = "center";
      ctx.fillText(sizeLabel, frame.x + frame.w / 2, frame.y - 12);
    }

    paint();
    const observer = new ResizeObserver(paint);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [image, crop, aspect, sizeLabel]);

  function viewToImage(clientX: number, clientY: number) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const bounds = canvas.getBoundingClientRect();
    const x = clientX - bounds.left;
    const y = clientY - bounds.top;
    const pad = Math.min(canvas.clientWidth, canvas.clientHeight) * 0.08;
    const maxW = canvas.clientWidth - pad * 2;
    const maxH = canvas.clientHeight - pad * 2;
    let w = maxW;
    let h = w / aspect;
    if (h > maxH) {
      h = maxH;
      w = h * aspect;
    }
    const frame = {
      x: (canvas.clientWidth - w) / 2,
      y: (canvas.clientHeight - h) / 2,
      w,
      h,
    };
    const scale = frame.w / cropRef.current.w;
    const left = frame.x - cropRef.current.x * scale;
    const top = frame.y - cropRef.current.y * scale;
    return {
      x: (x - left) / scale,
      y: (y - top) / scale,
    };
  }

  function onPointerDown(event: PointerEvent<HTMLCanvasElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      pinch.current = { distance, crop: cropRef.current };
    }
  }

  function onPointerMove(event: PointerEvent<HTMLCanvasElement>) {
    const previous = pointers.current.get(event.pointerId);
    if (!previous) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (pointers.current.size === 2 && pinch.current) {
      const [a, b] = [...pointers.current.values()];
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      const factor = distance / pinch.current.distance;
      onCropChange(
        zoomCrop(pinch.current.crop, image.width, image.height, clamp(factor, 0.25, 8)),
      );
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const pad = Math.min(canvas.clientWidth, canvas.clientHeight) * 0.08;
    const maxW = canvas.clientWidth - pad * 2;
    const maxH = canvas.clientHeight - pad * 2;
    let frameW = maxW;
    let frameH = frameW / aspect;
    if (frameH > maxH) {
      frameH = maxH;
      frameW = frameH * aspect;
    }
    const scale = frameW / cropRef.current.w;
    const dx = (previous.x - event.clientX) / scale;
    const dy = (previous.y - event.clientY) / scale;
    onCropChange(moveCrop(cropRef.current, image.width, image.height, dx, dy));
  }

  function onPointerUp(event: PointerEvent<HTMLCanvasElement>) {
    pointers.current.delete(event.pointerId);
    if (pointers.current.size < 2) {
      pinch.current = null;
    }
  }

  function onWheel(event: WheelEvent<HTMLCanvasElement>) {
    event.preventDefault();
    const origin = viewToImage(event.clientX, event.clientY);
    const factor = event.deltaY < 0 ? 1.08 : 1 / 1.08;
    onCropChange(zoomCrop(cropRef.current, image.width, image.height, factor, origin.x, origin.y));
  }

  function resetCrop() {
    onCropChange(coverCrop(image.width, image.height, aspect));
  }

  function fitWidth() {
    const cover = coverCrop(image.width, image.height, aspect);
    onCropChange(clampCrop({ x: 0, y: crop.y, w: cover.w, h: cover.h }, image.width, image.height));
  }

  return (
    <div className="crop-wrap">
      <canvas
        ref={canvasRef}
        className="crop-canvas"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
      />
      <div className="crop-help">
        <span>Arraste para enquadrar · role para ampliar</span>
        <div className="crop-actions">
          <button type="button" className="btn btn-ghost" onClick={resetCrop}>
            Recentrar
          </button>
          <button type="button" className="btn btn-ghost" onClick={fitWidth}>
            Usar a largura
          </button>
        </div>
      </div>
    </div>
  );
}
