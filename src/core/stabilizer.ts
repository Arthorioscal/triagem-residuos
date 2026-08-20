import { CONFIG, resolveClass } from "../config";
import type { Prediction, TriggerState } from "../types";

export interface StabilizerResult extends TriggerState {
  /** Preenchido apenas no quadro em que a ação deve disparar. */
  confirmed: Prediction | null;
}

/**
 * Decide QUANDO uma predição vira ação. Três travas, cada uma resolvendo um
 * problema real do vídeo ao vivo:
 *
 * 1. **Limiar** — descarta predição de baixa confiança (é instável e faz a
 *    interface piscar entre classes).
 * 2. **Streak** — exige N quadros seguidos da mesma classe, então um quadro
 *    borrado no meio do movimento não conta como detecção.
 * 3. **Rearme** — depois de disparar, o gatilho só volta a armar quando a cena
 *    esvazia (classe neutra ou confiança baixa). Sem isso, um único objeto
 *    parado na frente da câmera seria contado dezenas de vezes.
 */
export class Stabilizer {
  private candidate: string | null = null;
  private streak = 0;
  private armed = true;
  private lastFireAt = 0;

  constructor(private threshold: number = CONFIG.confidenceThreshold) {}

  setThreshold(value: number): void {
    this.threshold = value;
  }

  reset(): void {
    this.candidate = null;
    this.streak = 0;
    this.armed = true;
  }

  push(top: Prediction, now: number): StabilizerResult {
    const spec = resolveClass(top.className);
    const confident = top.probability >= this.threshold;

    // Cena vazia (ou incerta) rearma o gatilho para o próximo objeto.
    if (!confident || spec.neutral) {
      this.candidate = null;
      this.streak = 0;
      this.armed = true;
      return this.snapshot(null);
    }

    if (this.candidate === top.className) this.streak += 1;
    else {
      this.candidate = top.className;
      this.streak = 1;
    }

    const stable = this.streak >= CONFIG.stableFrames;
    const cooled = now - this.lastFireAt >= CONFIG.cooldownMs;

    if (stable && cooled && this.armed) {
      this.armed = false;
      this.streak = 0;
      this.lastFireAt = now;
      return this.snapshot(top);
    }

    return this.snapshot(null);
  }

  private snapshot(confirmed: Prediction | null): StabilizerResult {
    return { streak: this.streak, armed: this.armed, candidate: this.candidate, confirmed };
  }
}
