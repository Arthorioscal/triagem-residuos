import type { ImageClassifier } from "./classifier";
import type { Prediction } from "../types";

const LABELS = ["Reciclável", "Orgânico", "Rejeito", "Nada"];

/**
 * Modelo falso, usado só com `?demo=1` na URL.
 *
 * Serve para conferir interface, gatilho e ação automatizada ANTES de o modelo
 * real estar treinado (e para gravar o GIF do README sem depender de objetos na
 * mesa). Ele alterna entre "cena vazia" e um resíduo sorteado, com o mesmo
 * formato de saída do Teachable Machine.
 */
export class MockClassifier implements ImageClassifier {
  private tick = 0;
  private current = 0;

  async load(): Promise<void> {
    console.warn("[demo] modelo SIMULADO ativo — não é o Teachable Machine.");
  }

  get labels(): string[] {
    return LABELS;
  }

  async predict(): Promise<Prediction[]> {
    // ~2 s mostrando um resíduo, ~1,5 s de cena vazia, e troca de classe.
    const phase = Math.floor(this.tick / 20) % 2;
    if (phase === 0 && this.tick % 20 === 0) this.current = this.tick % 3;
    this.tick += 1;

    const winner = phase === 0 ? this.current : 3;
    const scores = LABELS.map((_, i) => (i === winner ? 0.9 + Math.random() * 0.08 : Math.random() * 0.05));
    const sum = scores.reduce((a, b) => a + b, 0);

    return LABELS.map((className, i) => ({ className, probability: scores[i] / sum }));
  }
}
