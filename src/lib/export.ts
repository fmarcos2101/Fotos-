import { drawFramed, type Background } from "./draw";
import type { Rect } from "./frame";
import type { SheetLayout } from "./layout";
import { A4_HEIGHT_MM, A4_WIDTH_MM, mmToPx, PRINT_DPI } from "./units";

function drawCropMarks(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  const mark = mmToPx(3);
  const gap = mmToPx(1.2);
  ctx.save();
  ctx.strokeStyle = "#1c1916";
  ctx.lineWidth = Math.max(1, mmToPx(0.15));
  ctx.beginPath();

  ctx.moveTo(x - mark, y - gap);
  ctx.lineTo(x - gap, y - gap);
  ctx.lineTo(x - gap, y - mark);

  ctx.moveTo(x + w + mark, y - gap);
  ctx.lineTo(x + w + gap, y - gap);
  ctx.lineTo(x + w + gap, y - mark);

  ctx.moveTo(x - mark, y + h + gap);
  ctx.lineTo(x - gap, y + h + gap);
  ctx.lineTo(x - gap, y + h + mark);

  ctx.moveTo(x + w + mark, y + h + gap);
  ctx.lineTo(x + w + gap, y + h + gap);
  ctx.lineTo(x + w + gap, y + h + mark);

  ctx.stroke();
  ctx.restore();
}

export function renderSheet(
  image: ImageBitmap,
  frame: Rect,
  layout: SheetLayout,
  background: Background,
  showGuides: boolean,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = mmToPx(layout.pageWidthMm);
  canvas.height = mmToPx(layout.pageHeightMm);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Não foi possível criar o canvas de impressão.");
  }

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (const tile of layout.tiles) {
    const dest = {
      x: mmToPx(tile.x),
      y: mmToPx(tile.y),
      w: mmToPx(tile.w),
      h: mmToPx(tile.h),
    };
    drawFramed(ctx, image, image.width, image.height, frame, dest, background);
    if (showGuides) {
      drawCropMarks(ctx, dest.x, dest.y, dest.w, dest.h);
    }
  }

  return canvas;
}

export function renderTile(
  image: ImageBitmap,
  frame: Rect,
  widthMm: number,
  heightMm: number,
  background: Background,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = mmToPx(widthMm);
  canvas.height = mmToPx(heightMm);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Não foi possível criar o canvas do azulejo.");
  }
  drawFramed(
    ctx,
    image,
    image.width,
    image.height,
    frame,
    { x: 0, y: 0, w: canvas.width, h: canvas.height },
    background,
  );
  return canvas;
}

function canvasToJpeg(canvas: HTMLCanvasElement, quality = 0.95): string {
  return canvas.toDataURL("image/jpeg", quality);
}

export async function downloadPdf(canvas: HTMLCanvasElement, filename: string): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({
    orientation: canvas.width >= canvas.height ? "landscape" : "portrait",
    unit: "mm",
    format: [A4_WIDTH_MM, A4_HEIGHT_MM],
    compress: true,
  });
  pdf.addImage(
    canvasToJpeg(canvas),
    "JPEG",
    0,
    0,
    A4_WIDTH_MM,
    A4_HEIGHT_MM,
    undefined,
    "FAST",
  );
  pdf.save(filename);
}

export function downloadPng(canvas: HTMLCanvasElement, filename: string): void {
  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = filename;
  link.click();
}

export function printCanvas(canvas: HTMLCanvasElement): void {
  const url = canvasToJpeg(canvas);
  const popup = window.open("", "_blank");
  if (!popup) {
    throw new Error("O navegador bloqueou a janela de impressão.");
  }

  popup.document.open();
  popup.document.write(`<!doctype html>
<html>
  <head>
    <title>Imprimir azulejo</title>
    <style>
      @page { size: A4; margin: 0; }
      html, body { margin: 0; padding: 0; background: #fff; }
      img { width: 210mm; height: 297mm; display: block; }
    </style>
  </head>
  <body>
    <img src="${url}" alt="Folha A4" />
    <script>
      const img = document.querySelector("img");
      img.onload = () => { window.focus(); window.print(); };
    <\/script>
  </body>
</html>`);
  popup.document.close();
}

export const EXPORT_DPI = PRINT_DPI;
