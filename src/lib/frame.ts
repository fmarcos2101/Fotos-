import { clamp } from "./units";

export type Rect = {
  x: number;
  y: number;
  w: number;
  h: number;
};

/**
 * "contain" fits the whole photo inside the tile and pads the leftover area.
 * "cover" fills the tile and crops whatever falls outside.
 */
export type FitMode = "contain" | "cover";

/** Frame center and zoom, in image pixels. The frame may extend past the photo. */
export type View = {
  zoom: number;
  cx: number;
  cy: number;
};

export const MAX_COVER_ZOOM = 8;
export const MIN_CONTAIN_ZOOM = 1 / 3;

export function containFrame(
  imageWidth: number,
  imageHeight: number,
  aspect: number,
): Rect {
  if (imageWidth <= 0 || imageHeight <= 0 || aspect <= 0) {
    return { x: 0, y: 0, w: imageWidth, h: imageHeight };
  }

  const imageAspect = imageWidth / imageHeight;
  if (imageAspect > aspect) {
    const w = imageWidth;
    const h = w / aspect;
    return { x: 0, y: (imageHeight - h) / 2, w, h };
  }

  const h = imageHeight;
  const w = h * aspect;
  return { x: (imageWidth - w) / 2, y: 0, w, h };
}

export function coverFrame(
  imageWidth: number,
  imageHeight: number,
  aspect: number,
): Rect {
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

export function baseFrame(
  imageWidth: number,
  imageHeight: number,
  aspect: number,
  mode: FitMode,
): Rect {
  return mode === "contain"
    ? containFrame(imageWidth, imageHeight, aspect)
    : coverFrame(imageWidth, imageHeight, aspect);
}

export function defaultView(imageWidth: number, imageHeight: number): View {
  return { zoom: 1, cx: imageWidth / 2, cy: imageHeight / 2 };
}

export function zoomRange(mode: FitMode): { min: number; max: number } {
  return mode === "contain"
    ? { min: MIN_CONTAIN_ZOOM, max: 1 }
    : { min: 1, max: MAX_COVER_ZOOM };
}

/**
 * In "contain" the frame must keep the whole photo inside it, in "cover" the
 * frame must stay inside the photo. Both reduce to clamping the frame center.
 */
export function clampView(
  view: View,
  imageWidth: number,
  imageHeight: number,
  aspect: number,
  mode: FitMode,
): View {
  const range = zoomRange(mode);
  const zoom = clamp(view.zoom, range.min, range.max);
  const base = baseFrame(imageWidth, imageHeight, aspect, mode);
  const w = base.w / zoom;
  const h = base.h / zoom;

  const xBounds = [w / 2, imageWidth - w / 2];
  const yBounds = [h / 2, imageHeight - h / 2];

  return {
    zoom,
    cx: clamp(view.cx, Math.min(...xBounds), Math.max(...xBounds)),
    cy: clamp(view.cy, Math.min(...yBounds), Math.max(...yBounds)),
  };
}

export function frameFromView(
  imageWidth: number,
  imageHeight: number,
  aspect: number,
  mode: FitMode,
  view: View,
): Rect {
  const safe = clampView(view, imageWidth, imageHeight, aspect, mode);
  const base = baseFrame(imageWidth, imageHeight, aspect, mode);
  const w = base.w / safe.zoom;
  const h = base.h / safe.zoom;
  return { x: safe.cx - w / 2, y: safe.cy - h / 2, w, h };
}

export function panView(
  view: View,
  imageWidth: number,
  imageHeight: number,
  aspect: number,
  mode: FitMode,
  dx: number,
  dy: number,
): View {
  return clampView(
    { ...view, cx: view.cx + dx, cy: view.cy + dy },
    imageWidth,
    imageHeight,
    aspect,
    mode,
  );
}

export function zoomView(
  view: View,
  imageWidth: number,
  imageHeight: number,
  aspect: number,
  mode: FitMode,
  factor: number,
): View {
  return clampView(
    { ...view, zoom: view.zoom * factor },
    imageWidth,
    imageHeight,
    aspect,
    mode,
  );
}

/** Where the photo lands when a frame is painted into a destination box. */
export function placeImage(
  imageWidth: number,
  imageHeight: number,
  frame: Rect,
  dest: Rect,
): Rect {
  const scale = dest.w / frame.w;
  return {
    x: dest.x - frame.x * scale,
    y: dest.y - frame.y * scale,
    w: imageWidth * scale,
    h: imageHeight * scale,
  };
}
