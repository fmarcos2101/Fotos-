import { useEffect, useRef } from "react";
import type { CropRect } from "../lib/crop";
import type { SheetLayout } from "../lib/layout";

type SheetPreviewProps = {
  image: ImageBitmap;
  crop: CropRect;
  layout: SheetLayout;
  showGuides: boolean;
};

export function SheetPreview({ image, crop, layout, showGuides }: SheetPreviewProps) {
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
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    for (const tile of layout.tiles) {
      const x = tile.x * sx;
      const y = tile.y * sy;
      const w = tile.w * sx;
      const h = tile.h * sy;
      ctx.drawImage(image, crop.x, crop.y, crop.w, crop.h, x, y, w, h);
      ctx.strokeStyle = "rgba(28, 25, 22, 0.28)";
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);

      if (showGuides) {
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
  }, [image, crop, layout, showGuides]);

  return <canvas ref={canvasRef} className="sheet-canvas" />;
}
