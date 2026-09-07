import { useEffect, useRef } from "react";
import { drawFramed, type Background } from "../lib/draw";
import type { Rect } from "../lib/frame";
import type { SheetLayout } from "../lib/layout";

type SheetPreviewProps = {
  image: ImageBitmap;
  frame: Rect;
  layout: SheetLayout;
  background: Background;
  showGuides: boolean;
};

export function SheetPreview({
  image,
  frame,
  layout,
  background,
  showGuides,
}: SheetPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const cssW = canvas.clientWidth;
    const cssH = cssW * (layout.pageHeightMm / layout.pageWidthMm);
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    canvas.style.height = `${cssH}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "#fffdf8";
    ctx.fillRect(0, 0, cssW, cssH);

    const sx = cssW / layout.pageWidthMm;
    const sy = cssH / layout.pageHeightMm;

    for (const tile of layout.tiles) {
      const dest = {
        x: tile.x * sx,
        y: tile.y * sy,
        w: tile.w * sx,
        h: tile.h * sy,
      };
      drawFramed(ctx, image, image.width, image.height, frame, dest, background);

      ctx.strokeStyle = "rgba(28, 25, 22, 0.28)";
      ctx.lineWidth = 1;
      ctx.strokeRect(dest.x + 0.5, dest.y + 0.5, dest.w - 1, dest.h - 1);

      if (showGuides) {
        const { x, y, w, h } = dest;
        ctx.strokeStyle = "rgba(28, 25, 22, 0.45)";
        ctx.beginPath();
        ctx.moveTo(x - 6, y);
        ctx.lineTo(x, y);
        ctx.lineTo(x, y - 6);
        ctx.moveTo(x + w + 6, y);
        ctx.lineTo(x + w, y);
        ctx.lineTo(x + w, y - 6);
        ctx.moveTo(x - 6, y + h);
        ctx.lineTo(x, y + h);
        ctx.lineTo(x, y + h + 6);
        ctx.moveTo(x + w + 6, y + h);
        ctx.lineTo(x + w, y + h);
        ctx.lineTo(x + w, y + h + 6);
        ctx.stroke();
      }
    }
  }, [image, frame, layout, background, showGuides]);

  return <canvas ref={canvasRef} className="sheet-canvas" />;
}
