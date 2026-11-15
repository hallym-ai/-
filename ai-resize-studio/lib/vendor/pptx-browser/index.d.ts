export class PptxRenderer {
  slideCount: number;
  load(file: File | Blob | ArrayBuffer): Promise<void>;
  loadEmbeddedFonts(): Promise<unknown>;
  renderSlide(index: number, canvas: HTMLCanvasElement, width?: number): Promise<void>;
  destroy(): void;
}
