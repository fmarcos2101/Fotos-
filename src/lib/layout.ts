import { A4_HEIGHT_MM, A4_WIDTH_MM } from "./units";

export type TileRect = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export type SheetLayout = {
  tiles: TileRect[];
  cols: number;
  rows: number;
  gapMm: number;
  fits: boolean;
  pageWidthMm: number;
  pageHeightMm: number;
};

export type LayoutMode = "one" | "fill";

const GAP_CANDIDATES = [8, 6, 4, 3, 2, 1, 0];
const MIN_EDGE_MM = 3;

function gridFits(
  cols: number,
  rows: number,
  tileW: number,
  tileH: number,
  pageW: number,
  pageH: number,
  gap: number,
): boolean {
  const gridW = cols * tileW + (cols - 1) * gap;
  const gridH = rows * tileH + (rows - 1) * gap;
  const remainW = pageW - gridW;
  const remainH = pageH - gridH;
  if (remainW < 0 || remainH < 0) return false;
  if (remainW < MIN_EDGE_MM * 2 && cols > 1) return false;
  if (remainH < MIN_EDGE_MM * 2 && rows > 1) return false;
  return true;
}

export function layoutSheet(
  tileWidthMm: number,
  tileHeightMm: number,
  mode: LayoutMode,
  pageWidthMm = A4_WIDTH_MM,
  pageHeightMm = A4_HEIGHT_MM,
): SheetLayout {
  const centered: SheetLayout = {
    tiles: [
      {
        x: (pageWidthMm - tileWidthMm) / 2,
        y: (pageHeightMm - tileHeightMm) / 2,
        w: tileWidthMm,
        h: tileHeightMm,
      },
    ],
    cols: 1,
    rows: 1,
    gapMm: 0,
    fits: tileWidthMm <= pageWidthMm && tileHeightMm <= pageHeightMm,
    pageWidthMm,
    pageHeightMm,
  };

  if (mode === "one") {
    return centered;
  }

  let best: { cols: number; rows: number; gap: number; count: number } | null =
    null;

  for (const gap of GAP_CANDIDATES) {
    const maxCols = Math.max(1, Math.floor(pageWidthMm / tileWidthMm));
    const maxRows = Math.max(1, Math.floor(pageHeightMm / tileHeightMm));
    for (let cols = maxCols; cols >= 1; cols--) {
      for (let rows = maxRows; rows >= 1; rows--) {
        if (!gridFits(cols, rows, tileWidthMm, tileHeightMm, pageWidthMm, pageHeightMm, gap)) {
          continue;
        }
        const count = cols * rows;
        if (
          !best ||
          count > best.count ||
          (count === best.count && gap > best.gap)
        ) {
          best = { cols, rows, gap, count };
        }
      }
    }
  }

  if (!best || best.count <= 1) {
    return centered;
  }

  const gridW = best.cols * tileWidthMm + (best.cols - 1) * best.gap;
  const gridH = best.rows * tileHeightMm + (best.rows - 1) * best.gap;
  const startX = (pageWidthMm - gridW) / 2;
  const startY = (pageHeightMm - gridH) / 2;
  const tiles: TileRect[] = [];

  for (let row = 0; row < best.rows; row++) {
    for (let col = 0; col < best.cols; col++) {
      tiles.push({
        x: startX + col * (tileWidthMm + best.gap),
        y: startY + row * (tileHeightMm + best.gap),
        w: tileWidthMm,
        h: tileHeightMm,
      });
    }
  }

  return {
    tiles,
    cols: best.cols,
    rows: best.rows,
    gapMm: best.gap,
    fits: true,
    pageWidthMm,
    pageHeightMm,
  };
}

export function qualityLabel(dpi: number): { label: string; tone: "good" | "ok" | "low" } {
  if (dpi >= 300) return { label: "qualidade de impressão", tone: "good" };
  if (dpi >= 200) return { label: "qualidade aceitável", tone: "ok" };
  return { label: "resolução baixa para o tamanho", tone: "low" };
}
