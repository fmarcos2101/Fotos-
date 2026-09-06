import { describe, expect, it } from "vitest";
import { layoutSheet, qualityLabel } from "./layout";
import { A4_HEIGHT_MM, A4_WIDTH_MM, cropDpi, mmToPx } from "./units";

describe("layoutSheet", () => {
  it("coloca um 10x10 no centro da A4", () => {
    const layout = layoutSheet(100, 100, "one");
    expect(layout.tiles).toHaveLength(1);
    expect(layout.tiles[0].x).toBeCloseTo((A4_WIDTH_MM - 100) / 2);
    expect(layout.tiles[0].y).toBeCloseTo((A4_HEIGHT_MM - 100) / 2);
    expect(layout.fits).toBe(true);
  });

  it("cabe 4 azulejos de 10x10 em uma A4", () => {
    const layout = layoutSheet(100, 100, "fill");
    expect(layout.tiles).toHaveLength(4);
    expect(layout.cols).toBe(2);
    expect(layout.rows).toBe(2);
    expect(layout.fits).toBe(true);
    for (const tile of layout.tiles) {
      expect(tile.x).toBeGreaterThanOrEqual(0);
      expect(tile.y).toBeGreaterThanOrEqual(0);
      expect(tile.x + tile.w).toBeLessThanOrEqual(A4_WIDTH_MM);
      expect(tile.y + tile.h).toBeLessThanOrEqual(A4_HEIGHT_MM);
    }
  });

  it("cabe 2 azulejos de 10x15 lado a lado", () => {
    const layout = layoutSheet(100, 150, "fill");
    expect(layout.tiles).toHaveLength(2);
    expect(layout.cols).toBe(2);
    expect(layout.rows).toBe(1);
  });

  it("não tenta colocar dois 20x20 na mesma folha", () => {
    const layout = layoutSheet(200, 200, "fill");
    expect(layout.tiles).toHaveLength(1);
    expect(layout.fits).toBe(true);
  });

  it("marca quando o azulejo é maior que a A4", () => {
    const layout = layoutSheet(250, 250, "one");
    expect(layout.fits).toBe(false);
  });
});

describe("units and quality", () => {
  it("converte 10 cm em 1181 px a 300 DPI", () => {
    expect(mmToPx(100)).toBe(1181);
  });

  it("classifica a qualidade pela resolução efetiva", () => {
    expect(qualityLabel(320).tone).toBe("good");
    expect(qualityLabel(220).tone).toBe("ok");
    expect(qualityLabel(120).tone).toBe("low");
    expect(cropDpi(1080, 100)).toBeCloseTo(274.32, 1);
  });
});
