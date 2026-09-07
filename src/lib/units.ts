export const A4_WIDTH_MM = 210;
export const A4_HEIGHT_MM = 297;
export const PRINT_DPI = 300;
export const MM_PER_INCH = 25.4;

export function mmToPx(mm: number, dpi = PRINT_DPI): number {
  return Math.round((mm / MM_PER_INCH) * dpi);
}

export function cmToMm(cm: number): number {
  return cm * 10;
}

export function cropDpi(sourcePx: number, sizeMm: number): number {
  if (sizeMm <= 0) return 0;
  return sourcePx / (sizeMm / MM_PER_INCH);
}

export function clamp(value: number, min: number, max: number): number {
  if (max < min) return min;
  return Math.min(max, Math.max(min, value));
}
