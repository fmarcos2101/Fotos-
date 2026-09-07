import { useEffect, useMemo, useState } from "react";
import { CropEditor } from "./components/CropEditor";
import { SheetPreview } from "./components/SheetPreview";
import { SizePicker } from "./components/SizePicker";
import { Uploader } from "./components/Uploader";
import { BACKGROUND_LABELS, type Background } from "./lib/draw";
import { downloadPdf, downloadPng, printCanvas, renderSheet, renderTile } from "./lib/export";
import { defaultView, frameFromView, type FitMode, type View } from "./lib/frame";
import { loadPhoto } from "./lib/image";
import { layoutSheet, qualityLabel, type LayoutMode } from "./lib/layout";
import { CUSTOM_SIZE_ID, PRESET_SIZES, sizeAspect } from "./lib/sizes";
import { cmToMm, cropDpi } from "./lib/units";

type Photo = {
  file: File;
  image: ImageBitmap;
};

export default function App() {
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [sizeId, setSizeId] = useState(PRESET_SIZES[0].id);
  const [widthCm, setWidthCm] = useState(10);
  const [heightCm, setHeightCm] = useState(10);
  const [view, setView] = useState<View | null>(null);
  const [fit, setFit] = useState<FitMode>("contain");
  const [background, setBackground] = useState<Background>("white");
  const [mode, setMode] = useState<LayoutMode>("fill");
  const [showGuides, setShowGuides] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const aspect = sizeAspect({ widthCm, heightCm });
  const sizeLabel = `${formatCm(widthCm)} × ${formatCm(heightCm)} cm`;

  useEffect(() => {
    if (!photo) return;
    setView(defaultView(photo.image.width, photo.image.height));
  }, [fit, photo]);

  const layout = useMemo(
    () => layoutSheet(cmToMm(widthCm), cmToMm(heightCm), mode),
    [widthCm, heightCm, mode],
  );

  const frame =
    photo && view
      ? frameFromView(photo.image.width, photo.image.height, aspect, fit, view)
      : null;

  const dpi = frame && layout.tiles[0] ? cropDpi(frame.w, layout.tiles[0].w) : 0;
  const quality = qualityLabel(dpi);

  async function handleFile(file: File) {
    setError(null);
    try {
      const image = await loadPhoto(file);
      setPhoto({ file, image });
      setView(defaultView(image.width, image.height));
    } catch {
      setError("Não foi possível ler essa imagem. Tente JPG, PNG ou WebP.");
    }
  }

  function handleSelect(id: string, nextWidth: number, nextHeight: number) {
    setSizeId(id);
    if (id !== CUSTOM_SIZE_ID) {
      setWidthCm(nextWidth);
      setHeightCm(nextHeight);
    }
  }

  function handleCustom(nextWidth: number, nextHeight: number) {
    setWidthCm(clampSize(nextWidth, 1, 21));
    setHeightCm(clampSize(nextHeight, 1, 29.7));
  }

  async function withExport(label: string, action: () => void | Promise<void>) {
    setBusy(label);
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao gerar o arquivo.");
    } finally {
      setBusy(null);
    }
  }

  function handlePrint() {
    if (!photo || !frame) return;
    withExport("Preparando impressão…", () => {
      printCanvas(renderSheet(photo.image, frame, layout, background, showGuides));
    });
  }

  function handlePdf() {
    if (!photo || !frame) return;
    withExport("Gerando PDF…", () =>
      downloadPdf(
        renderSheet(photo.image, frame, layout, background, showGuides),
        `azulejo-${slug(sizeLabel)}.pdf`,
      ),
    );
  }

  function handlePng() {
    if (!photo || !frame) return;
    withExport("Gerando PNG…", () => {
      downloadPng(
        renderTile(photo.image, frame, cmToMm(widthCm), cmToMm(heightCm), background),
        `azulejo-${slug(sizeLabel)}.png`,
      );
    });
  }

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <p className="brand">Enquadro</p>
          <p className="brand-sub">Fotos para azulejos</p>
        </div>
        {photo ? (
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => document.getElementById("replace-input")?.click()}
          >
            Trocar foto
          </button>
        ) : null}
        <input
          id="replace-input"
          type="file"
          accept="image/*"
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) handleFile(file);
            event.target.value = "";
          }}
        />
      </header>

      {!photo || !view || !frame ? (
        <Uploader onFile={handleFile} />
      ) : (
        <main className="workspace">
          <CropEditor
            image={photo.image}
            view={view}
            aspect={aspect}
            mode={fit}
            background={background}
            sizeLabel={sizeLabel}
            onViewChange={setView}
          />

          <aside className="sidebar">
            <div className="sidebar-scroll">
              <section className="panel">
                <h2>Ajuste da foto</h2>
                <div className="mode-row">
                  <button
                    type="button"
                    className={fit === "contain" ? "chip chip-active" : "chip"}
                    onClick={() => setFit("contain")}
                  >
                    Foto inteira
                  </button>
                  <button
                    type="button"
                    className={fit === "cover" ? "chip chip-active" : "chip"}
                    onClick={() => setFit("cover")}
                  >
                    Cortar
                  </button>
                </div>
                <p className="hint">
                  {fit === "contain"
                    ? "A foto entra completa, sem cortar nada. O espaço que sobra recebe o fundo escolhido."
                    : "A foto preenche o azulejo inteiro e as bordas que sobram são cortadas."}
                </p>
                {fit === "contain" ? (
                  <div className="mode-row bg-row">
                    {(Object.keys(BACKGROUND_LABELS) as Background[]).map((option) => (
                      <button
                        key={option}
                        type="button"
                        className={background === option ? "chip chip-active" : "chip"}
                        onClick={() => setBackground(option)}
                      >
                        {BACKGROUND_LABELS[option]}
                      </button>
                    ))}
                  </div>
                ) : null}
              </section>

              <SizePicker
                selectedId={sizeId}
                widthCm={widthCm}
                heightCm={heightCm}
                onSelect={handleSelect}
                onCustomChange={handleCustom}
              />

              <section className="panel">
                <h2>Folha A4</h2>
                <div className="mode-row">
                  <button
                    type="button"
                    className={mode === "one" ? "chip chip-active" : "chip"}
                    onClick={() => setMode("one")}
                  >
                    1 no centro
                  </button>
                  <button
                    type="button"
                    className={mode === "fill" ? "chip chip-active" : "chip"}
                    onClick={() => setMode("fill")}
                  >
                    Máximo por folha
                  </button>
                </div>
                <label className="check">
                  <input
                    type="checkbox"
                    checked={showGuides}
                    onChange={(event) => setShowGuides(event.target.checked)}
                  />
                  Marcas de corte
                </label>
                <div className="sheet-box">
                  <SheetPreview
                    image={photo.image}
                    frame={frame}
                    layout={layout}
                    background={background}
                    showGuides={showGuides}
                  />
                </div>
                <p className="sheet-meta">
                  {layout.tiles.length} {layout.tiles.length === 1 ? "azulejo" : "azulejos"} ·{" "}
                  {sizeLabel}
                  {layout.fits ? "" : " · não cabe na folha"}
                </p>
                <p className={`quality quality-${quality.tone}`}>
                  {Math.round(dpi)} DPI · {quality.label}
                </p>
              </section>
            </div>

            <section className="panel actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={handlePrint}
                disabled={Boolean(busy) || !layout.fits}
              >
                Imprimir A4
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handlePdf}
                disabled={Boolean(busy) || !layout.fits}
              >
                Baixar PDF
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handlePng}
                disabled={Boolean(busy)}
              >
                Baixar PNG do azulejo
              </button>
              {busy ? <p className="hint">{busy}</p> : null}
            </section>
          </aside>
        </main>
      )}

      {error ? <p className="toast">{error}</p> : null}
    </div>
  );
}

function formatCm(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1).replace(".", ",");
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^\d×xcm]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

function clampSize(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
}
