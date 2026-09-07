import { useEffect, useRef, type PointerEvent, type WheelEvent } from "react";
import { drawFramed, type Background } from "../lib/draw";
import {
  defaultView,
  frameFromView,
  panView,
  zoomView,
  type FitMode,
  type Rect,
  type View,
} from "../lib/frame";
import { clamp } from "../lib/units";

type CropEditorProps = {
  image: ImageBitmap;
  view: View;
  aspect: number;
  mode: FitMode;
  background: Background;
  sizeLabel: string;
  onViewChange: (view: View) => void;
};

const FRAME_PADDING = 0.08;

function destRect(width: number, height: number, aspect: number): Rect {
  const pad = Math.min(width, height) * FRAME_PADDING;
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

export function CropEditor({
  image,
  view,
  aspect,
  mode,
  background,
  sizeLabel,
  onViewChange,
}: CropEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewRef = useRef(view);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ distance: number; view: View } | null>(null);

  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

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

      const dest = destRect(cssW, cssH, aspect);
      const frame = frameFromView(image.width, image.height, aspect, mode, viewRef.current);

      ctx.save();
      ctx.globalAlpha = 0.28;
      ctx.imageSmoothingEnabled = true;
      const scale = dest.w / frame.w;
      ctx.drawImage(
        image,
        dest.x - frame.x * scale,
        dest.y - frame.y * scale,
        image.width * scale,
        image.height * scale,
      );
      ctx.restore();

      drawFramed(ctx, image, image.width, image.height, frame, dest, background);

      ctx.strokeStyle = "#fff6ec";
      ctx.lineWidth = 2;
      ctx.strokeRect(dest.x + 1, dest.y + 1, dest.w - 2, dest.h - 2);

      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = "rgba(255, 246, 236, 0.4)";
      ctx.strokeRect(dest.x + dest.w / 3, dest.y, dest.w / 3, dest.h);
      ctx.strokeRect(dest.x, dest.y + dest.h / 3, dest.w, dest.h / 3);
      ctx.setLineDash([]);

      ctx.font = "600 13px Outfit, sans-serif";
      ctx.fillStyle = "#fff6ec";
      ctx.textAlign = "center";
      ctx.fillText(sizeLabel, dest.x + dest.w / 2, dest.y - 12);
    }

    paint();
    const observer = new ResizeObserver(paint);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [image, view, aspect, mode, background, sizeLabel]);

  function imageScale(): number {
    const canvas = canvasRef.current;
    if (!canvas) return 1;
    const dest = destRect(canvas.clientWidth, canvas.clientHeight, aspect);
    const frame = frameFromView(image.width, image.height, aspect, mode, viewRef.current);
    return dest.w / frame.w;
  }

  function onPointerDown(event: PointerEvent<HTMLCanvasElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = {
        distance: Math.hypot(a.x - b.x, a.y - b.y),
        view: viewRef.current,
      };
    }
  }

  function onPointerMove(event: PointerEvent<HTMLCanvasElement>) {
    const previous = pointers.current.get(event.pointerId);
    if (!previous) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (pointers.current.size === 2 && pinch.current) {
      const [a, b] = [...pointers.current.values()];
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      const factor = clamp(distance / pinch.current.distance, 0.2, 8);
      onViewChange(
        zoomView(pinch.current.view, image.width, image.height, aspect, mode, factor),
      );
      return;
    }

    const scale = imageScale();
    onViewChange(
      panView(
        viewRef.current,
        image.width,
        image.height,
        aspect,
        mode,
        (previous.x - event.clientX) / scale,
        (previous.y - event.clientY) / scale,
      ),
    );
  }

  function onPointerUp(event: PointerEvent<HTMLCanvasElement>) {
    pointers.current.delete(event.pointerId);
    if (pointers.current.size < 2) {
      pinch.current = null;
    }
  }

  function onWheel(event: WheelEvent<HTMLCanvasElement>) {
    event.preventDefault();
    const factor = event.deltaY < 0 ? 1.08 : 1 / 1.08;
    onViewChange(
      zoomView(viewRef.current, image.width, image.height, aspect, mode, factor),
    );
  }

  const hint =
    mode === "contain"
      ? "A foto inteira cabe no azulejo · role para dar mais margem"
      : "Arraste para escolher o corte · role para ampliar";

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
        <span>{hint}</span>
        <div className="crop-actions">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => onViewChange(defaultView(image.width, image.height))}
          >
            Recentrar
          </button>
        </div>
      </div>
    </div>
  );
}
