import { clamp } from "./units";

export type CropRect = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export function coverCrop(
  imageWidth: number,
  imageHeight: number,
  aspect: number,
): CropRect {
  if (imageWidth <= 0 || imageHeight <= 0 || aspect <= 0) {
    return { x: 0, y: 0, w: imageWidth, h: imageHeight };
  }

  const imageAspect = imageWidth / imageHeight;
  if (imageAspect > aspect) {
    const h = imageHeight;
    const w = h * aspect;
    return { x: (imageWidth - w) / 2, y: 0, w, h };
  }

  const w = imageWidth;
  const h = w / aspect;
  return { x: 0, y: (imageHeight - h) / 2, w, h };
}

export function clampCrop(
  crop: CropRect,
  imageWidth: number,
  imageHeight: number,
): CropRect {
  const w = clamp(crop.w, 1, imageWidth);
  const h = clamp(crop.h, 1, imageHeight);
  return {
    x: clamp(crop.x, 0, Math.max(0, imageWidth - w)),
    y: clamp(crop.y, 0, Math.max(0, imageHeight - h)),
    w,
    h,
  };
}

export function moveCrop(
  crop: CropRect,
  imageWidth: number,
  imageHeight: number,
  dx: number,
  dy: number,
): CropRect {
  return clampCrop(
    { ...crop, x: crop.x + dx, y: crop.y + dy },
    imageWidth,
    imageHeight,
  );
}

export function zoomCrop(
  crop: CropRect,
  imageWidth: number,
  imageHeight: number,
  factor: number,
  originX = crop.x + crop.w / 2,
  originY = crop.y + crop.h / 2,
): CropRect {
  const nextW = crop.w / factor;
  const nextH = crop.h / factor;
  const cover = coverCrop(imageWidth, imageHeight, crop.w / crop.h);
  const w = clamp(nextW, 1, cover.w);
  const h = clamp(nextH, 1, cover.h);
  const relX = crop.w === 0 ? 0.5 : (originX - crop.x) / crop.w;
  const relY = crop.h === 0 ? 0.5 : (originY - crop.y) / crop.h;
  return clampCrop(
    {
      x: originX - relX * w,
      y: originY - relY * h,
      w,
      h,
    },
    imageWidth,
    imageHeight,
  );
}

export function retargetCrop(
  crop: CropRect,
  imageWidth: number,
  imageHeight: number,
  aspect: number,
): CropRect {
  const cx = crop.x + crop.w / 2;
  const cy = crop.y + crop.h / 2;
  const cover = coverCrop(imageWidth, imageHeight, aspect);
  const area = crop.w * crop.h;
  let w = Math.sqrt(area * aspect);
  let h = w / aspect;
  if (w > cover.w || h > cover.h) {
    w = cover.w;
    h = cover.h;
  }
  return clampCrop({ x: cx - w / 2, y: cy - h / 2, w, h }, imageWidth, imageHeight);
}

export function cropFromView(
  imageWidth: number,
  imageHeight: number,
  frame: CropRect,
  imageLeft: number,
  imageTop: number,
  drawWidth: number,
  drawHeight: number,
): CropRect {
  const scaleX = imageWidth / drawWidth;
  const scaleY = imageHeight / drawHeight;
  return clampCrop(
    {
      x: (frame.x - imageLeft) * scaleX,
      y: (frame.y - imageTop) * scaleY,
      w: frame.w * scaleX,
      h: frame.h * scaleY,
    },
    imageWidth,
    imageHeight,
  );
}
