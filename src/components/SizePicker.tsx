import { CUSTOM_SIZE_ID, PRESET_SIZES } from "../lib/sizes";

type SizePickerProps = {
  selectedId: string;
  widthCm: number;
  heightCm: number;
  onSelect: (id: string, widthCm: number, heightCm: number) => void;
  onCustomChange: (widthCm: number, heightCm: number) => void;
};

export function SizePicker({
  selectedId,
  widthCm,
  heightCm,
  onSelect,
  onCustomChange,
}: SizePickerProps) {
  return (
    <section className="panel">
      <h2>Tamanho do azulejo</h2>
      <div className="size-grid">
        {PRESET_SIZES.map((size) => (
          <button
            key={size.id}
            type="button"
            className={selectedId === size.id ? "chip chip-active" : "chip"}
            onClick={() => onSelect(size.id, size.widthCm, size.heightCm)}
          >
            {size.label}
          </button>
        ))}
        <button
          type="button"
          className={selectedId === CUSTOM_SIZE_ID ? "chip chip-active" : "chip"}
          onClick={() => onSelect(CUSTOM_SIZE_ID, widthCm, heightCm)}
        >
          Personalizado
        </button>
      </div>
      {selectedId === CUSTOM_SIZE_ID ? (
        <div className="custom-size">
          <label>
            Largura (cm)
            <input
              type="number"
              min={1}
              max={21}
              step={0.5}
              value={widthCm}
              onChange={(event) => onCustomChange(Number(event.target.value), heightCm)}
            />
          </label>
          <label>
            Altura (cm)
            <input
              type="number"
              min={1}
              max={29.7}
              step={0.5}
              value={heightCm}
              onChange={(event) => onCustomChange(widthCm, Number(event.target.value))}
            />
          </label>
        </div>
      ) : null}
    </section>
  );
}
