import { useRef, type DragEvent, type ChangeEvent } from "react";
import { isImageFile } from "../lib/image";

type UploaderProps = {
  onFile: (file: File) => void;
};

export function Uploader({ onFile }: UploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function takeFile(file: File | undefined) {
    if (file && isImageFile(file)) {
      onFile(file);
    }
  }

  function onDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    takeFile(event.dataTransfer.files[0]);
  }

  function onChange(event: ChangeEvent<HTMLInputElement>) {
    takeFile(event.target.files?.[0]);
    event.target.value = "";
  }

  return (
    <section
      className="uploader"
      onDragOver={(event) => event.preventDefault()}
      onDrop={onDrop}
    >
      <div className="uploader-card">
        <p className="eyebrow">Enquadro</p>
        <h1>Enquadre a foto no azulejo e imprima em A4</h1>
        <p className="lede">
          Carregue a foto — inclusive no formato story — escolha o tamanho,
          ajuste o enquadramento e imprima na medida certa, sem perder qualidade.
        </p>
        <button type="button" className="btn btn-primary" onClick={() => inputRef.current?.click()}>
          Carregar foto
        </button>
        <p className="hint">ou arraste a imagem para esta página</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={onChange}
        />
      </div>
    </section>
  );
}
