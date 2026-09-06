export type TileSize = {
  id: string;
  label: string;
  widthCm: number;
  heightCm: number;
};

export const PRESET_SIZES: TileSize[] = [
  { id: "10x10", label: "10 × 10 cm", widthCm: 10, heightCm: 10 },
  { id: "15x15", label: "15 × 15 cm", widthCm: 15, heightCm: 15 },
  { id: "20x20", label: "20 × 20 cm", widthCm: 20, heightCm: 20 },
  { id: "10x15", label: "10 × 15 cm", widthCm: 10, heightCm: 15 },
  { id: "15x20", label: "15 × 20 cm", widthCm: 15, heightCm: 20 },
];

export const CUSTOM_SIZE_ID = "custom";

export function sizeAspect(size: Pick<TileSize, "widthCm" | "heightCm">): number {
  return size.widthCm / size.heightCm;
}

export function isCustomSize(id: string): boolean {
  return id === CUSTOM_SIZE_ID;
}
