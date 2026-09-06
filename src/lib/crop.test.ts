import { describe, expect, it } from "vitest";
import { clampCrop, coverCrop, moveCrop, retargetCrop, zoomCrop } from "./crop";

describe("coverCrop", () => {
  it("corta um story 9:16 para um quadrado usando a largura inteira", () => {
    const crop = coverCrop(1080, 1920, 1);
    expect(crop.w).toBeCloseTo(1080);
    expect(crop.h).toBeCloseTo(1080);
    expect(crop.x).toBeCloseTo(0);
    expect(crop.y).toBeCloseTo(420);
  });

  it("corta uma paisagem para 10x15 (2:3)", () => {
    const crop = coverCrop(4000, 2250, 10 / 15);
    expect(crop.w / crop.h).toBeCloseTo(10 / 15);
    expect(crop.h).toBeCloseTo(2250);
    expect(crop.x).toBeGreaterThan(0);
  });
});

describe("moveCrop", () => {
  it("não deixa o recorte sair da imagem", () => {
    const crop = { x: 0, y: 420, w: 1080, h: 1080 };
    const moved = moveCrop(crop, 1080, 1920, -50, -500);
    expect(moved.x).toBe(0);
    expect(moved.y).toBe(0);
  });
});

describe("zoomCrop", () => {
  it("amplia sem ultrapassar o recorte máximo de cobertura", () => {
    const cover = coverCrop(1080, 1920, 1);
    const zoomedOut = zoomCrop(cover, 1080, 1920, 0.5);
    expect(zoomedOut.w).toBeCloseTo(cover.w);
    const zoomedIn = zoomCrop(cover, 1080, 1920, 2);
    expect(zoomedIn.w).toBeCloseTo(540);
    expect(zoomedIn.h).toBeCloseTo(540);
  });
});

describe("retargetCrop", () => {
  it("muda o aspecto e mantém o centro possível", () => {
    const square = coverCrop(1080, 1920, 1);
    const portrait = retargetCrop(square, 1080, 1920, 10 / 15);
    expect(portrait.w / portrait.h).toBeCloseTo(10 / 15, 3);
    expect(portrait.x).toBeGreaterThanOrEqual(0);
    expect(portrait.y + portrait.h).toBeLessThanOrEqual(1920);
  });
});

describe("clampCrop", () => {
  it("corrige recortes inválidos", () => {
    const crop = clampCrop({ x: -20, y: 3000, w: 5000, h: 10 }, 1080, 1920);
    expect(crop.x).toBe(0);
    expect(crop.w).toBe(1080);
    expect(crop.y).toBeGreaterThanOrEqual(0);
    expect(crop.y + crop.h).toBeLessThanOrEqual(1920);
  });
});
