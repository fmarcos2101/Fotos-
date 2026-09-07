import { placeImage, type Rect } from "./frame";

export type Background = "white" | "black" | "blur";

export const BACKGROUND_LABELS: Record<Background, string> = {
  white: "Branco",
  black: "Preto",
  blur: "Desfoque",
};

const SOLID_COLORS: Record<string, string> = {
  white: "#ffffff",
  black: "#000000",
};

/**
 * Paints the framed photo into `dest`, filling whatever the photo does not
 * cover. Works for both fit modes: the frame decides how much of the photo is
 * visible, and anything outside `dest` is clipped away.
 */
export function drawFramed(
  ctx: CanvasRenderingContext2D,
  image: CanvasImageSource,
  imageWidth: number,
  imageHeight: number,
  frame: Rect,
  dest: Rect,
  background: Background,
): void {
  const placed = placeImage(imageWidth, imageHeight, frame, dest);

  ctx.save();
  ctx.beginPath();
  ctx.rect(dest.x, dest.y, dest.w, dest.h);
  ctx.clip();

  const covers =
    placed.x <= dest.x &&
    placed.y <= dest.y &&
    placed.x + placed.w >= dest.x + dest.w &&
    placed.y + placed.h >= dest.y + dest.h;

  if (!covers) {
    if (background === "blur") {
      drawBlurredFill(ctx, image, imageWidth, imageHeight, dest);
    } else {
      ctx.fillStyle = SOLID_COLORS[background] ?? "#ffffff";
      ctx.fillRect(dest.x, dest.y, dest.w, dest.h);
    }
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(image, placed.x, placed.y, placed.w, placed.h);
  ctx.restore();
}

function drawBlurredFill(
  ctx: CanvasRenderingContext2D,
  image: CanvasImageSource,
  imageWidth: number,
  imageHeight: number,
  dest: Rect,
): void {
  const scale = Math.max(dest.w / imageWidth, dest.h / imageHeight) * 1.25;
  const w = imageWidth * scale;
  const h = imageHeight * scale;

  ctx.save();
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(dest.x, dest.y, dest.w, dest.h);
  ctx.filter = `blur(${Math.max(2, dest.w * 0.05)}px)`;
  ctx.drawImage(
    image,
    dest.x + (dest.w - w) / 2,
    dest.y + (dest.h - h) / 2,
    w,
    h,
  );
  ctx.restore();
}
