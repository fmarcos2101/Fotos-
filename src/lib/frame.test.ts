import { describe, expect, it } from "vitest";
import {
  clampView,
  containFrame,
  coverFrame,
  defaultView,
  frameFromView,
  panView,
  placeImage,
  zoomView,
} from "./frame";
import { cropDpi } from "./units";

const STORY_W = 1080;
const STORY_H = 1920;

describe("containFrame", () => {
  it("cabe a story 9:16 inteira num azulejo quadrado", () => {
    const frame = containFrame(STORY_W, STORY_H, 1);
    expect(frame.w).toBeCloseTo(1920);
    expect(frame.h).toBeCloseTo(1920);
    expect(frame.x).toBeCloseTo(-420);
    expect(frame.y).toBeCloseTo(0);
  });

  it("mantém a foto inteira dentro do quadro em qualquer proporção", () => {
    for (const aspect of [1, 10 / 15, 15 / 20, 2]) {
      const frame = containFrame(STORY_W, STORY_H, aspect);
      expect(frame.x).toBeLessThanOrEqual(0);
      expect(frame.y).toBeLessThanOrEqual(0);
      expect(frame.x + frame.w).toBeGreaterThanOrEqual(STORY_W);
      expect(frame.y + frame.h).toBeGreaterThanOrEqual(STORY_H);
      expect(frame.w / frame.h).toBeCloseTo(aspect, 6);
    }
  });
});

describe("coverFrame", () => {
  it("corta a story para preencher o quadrado", () => {
    const frame = coverFrame(STORY_W, STORY_H, 1);
    expect(frame.w).toBeCloseTo(1080);
    expect(frame.h).toBeCloseTo(1080);
    expect(frame.y).toBeCloseTo(420);
  });
});

describe("frameFromView", () => {
  it("no modo foto inteira o padrão não corta nada", () => {
    const view = defaultView(STORY_W, STORY_H);
    const frame = frameFromView(STORY_W, STORY_H, 1, "contain", view);
    expect(frame).toEqual(containFrame(STORY_W, STORY_H, 1));
  });

  it("no modo foto inteira nem o arrasto nem o zoom cortam a foto", () => {
    let view = defaultView(STORY_W, STORY_H);
    view = panView(view, STORY_W, STORY_H, 1, "contain", 900, -1200);
    view = zoomView(view, STORY_W, STORY_H, 1, "contain", 4);
    const frame = frameFromView(STORY_W, STORY_H, 1, "contain", view);
    expect(frame.x).toBeLessThanOrEqual(0);
    expect(frame.y).toBeLessThanOrEqual(0);
    expect(frame.x + frame.w).toBeGreaterThanOrEqual(STORY_W);
    expect(frame.y + frame.h).toBeGreaterThanOrEqual(STORY_H);
  });

  it("dar zoom para fora aumenta a margem em volta da foto", () => {
    const view = zoomView(defaultView(STORY_W, STORY_H), STORY_W, STORY_H, 1, "contain", 0.5);
    const frame = frameFromView(STORY_W, STORY_H, 1, "contain", view);
    expect(frame.w).toBeCloseTo(3840);
    expect(frame.x + frame.w / 2).toBeCloseTo(STORY_W / 2);
  });

  it("no modo cortar o quadro fica dentro da foto", () => {
    let view = zoomView(defaultView(STORY_W, STORY_H), STORY_W, STORY_H, 1, "cover", 2);
    view = panView(view, STORY_W, STORY_H, 1, "cover", -5000, 5000);
    const frame = frameFromView(STORY_W, STORY_H, 1, "cover", view);
    expect(frame.x).toBeGreaterThanOrEqual(0);
    expect(frame.y).toBeGreaterThanOrEqual(0);
    expect(frame.x + frame.w).toBeLessThanOrEqual(STORY_W);
    expect(frame.y + frame.h).toBeLessThanOrEqual(STORY_H);
  });
});

describe("clampView", () => {
  it("respeita os limites de zoom de cada modo", () => {
    const view = defaultView(STORY_W, STORY_H);
    expect(clampView({ ...view, zoom: 9 }, STORY_W, STORY_H, 1, "cover").zoom).toBe(8);
    expect(clampView({ ...view, zoom: 0.4 }, STORY_W, STORY_H, 1, "cover").zoom).toBe(1);
    expect(clampView({ ...view, zoom: 3 }, STORY_W, STORY_H, 1, "contain").zoom).toBe(1);
    expect(clampView({ ...view, zoom: 0.05 }, STORY_W, STORY_H, 1, "contain").zoom).toBeCloseTo(1 / 3);
  });
});

describe("placeImage", () => {
  it("centraliza a foto no azulejo com margem igual dos dois lados", () => {
    const frame = containFrame(STORY_W, STORY_H, 1);
    const dest = { x: 0, y: 0, w: 1181, h: 1181 };
    const placed = placeImage(STORY_W, STORY_H, frame, dest);
    expect(placed.h).toBeCloseTo(1181);
    expect(placed.w).toBeCloseTo(1181 * (STORY_W / STORY_H));
    expect(placed.x).toBeCloseTo((1181 - placed.w) / 2);
    expect(placed.y).toBeCloseTo(0);
  });
});

describe("resolução no modo foto inteira", () => {
  it("uma story de 1080px em 10 cm mantém DPI alto porque nada é ampliado", () => {
    const frame = containFrame(STORY_W, STORY_H, 1);
    expect(cropDpi(frame.w, 100)).toBeCloseTo(487.7, 1);
  });
});
