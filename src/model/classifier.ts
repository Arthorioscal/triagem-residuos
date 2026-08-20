import * as tmImage from "@teachablemachine/image";
import { CONFIG } from "../config";
import type { Prediction } from "../types";

/** Contrato mínimo que o laço de inferência precisa (ver `MockClassifier`). */
export interface ImageClassifier {
  load(): Promise<void>;
  readonly labels: string[];
  predict(source: HTMLVideoElement): Promise<Prediction[]>;
}

/**
 * Envelopa o modelo exportado do Teachable Machine (formato TensorFlow.js).
 * A inferência acontece inteira no navegador — não há back-end.
 */
export class Classifier implements ImageClassifier {
  private model: tmImage.CustomMobileNet | null = null;

  async load(basePath = CONFIG.modelPath): Promise<void> {
    const base = new URL(basePath, document.baseURI).href;
    try {
      this.model = await tmImage.load(`${base}model.json`, `${base}metadata.json`);
    } catch (cause) {
      throw new Error(
        `Não foi possível carregar o modelo em "${base}". ` +
          "Confira se model.json, metadata.json e weights.bin estão em public/model/ " +
          "(veja public/model/README.md). Para testar a interface sem o modelo, " +
          "abra a página com ?demo=1.",
        { cause }
      );
    }
  }

  get labels(): string[] {
    return this.model?.getClassLabels() ?? [];
  }

  /** Probabilidade de TODAS as classes, para o quadro atual do vídeo. */
  async predict(source: HTMLVideoElement): Promise<Prediction[]> {
    if (!this.model) throw new Error("Modelo ainda não carregado.");
    return this.model.predict(source, CONFIG.mirror);
  }

  dispose(): void {
    this.model?.dispose();
    this.model = null;
  }
}

/** Maior probabilidade da lista. */
export function topPrediction(predictions: Prediction[]): Prediction {
  return predictions.reduce(
    (best, p) => (p.probability > best.probability ? p : best),
    predictions[0] ?? { className: "—", probability: 0 }
  );
}
