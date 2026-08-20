import { resolveClass } from "../config";
import type { Dashboard } from "../ui/dashboard";
import type { Feedback } from "../ui/feedback";
import type { BinId, Prediction } from "../types";
import type { SessionStore } from "./store";

/**
 * A AÇÃO AUTOMATIZADA.
 *
 * Chamado exclusivamente pelo laço de inferência, quando o `Stabilizer`
 * confirma uma classe. Nenhum botão da interface chama este método — a ação é
 * consequência direta da predição do modelo.
 *
 * Uma confirmação produz, de uma vez:
 *   1. abertura da lixeira correta (atuador — tampa animada);
 *   2. bipe com timbre próprio da classe + instrução falada em pt-BR;
 *   3. flash colorido na imagem, confirmando visualmente o descarte;
 *   4. incremento do contador e registro no histórico persistido.
 */
export class ActionDispatcher {
  constructor(
    private store: SessionStore,
    private ui: Dashboard,
    private feedback: Feedback
  ) {}

  dispatch(prediction: Prediction): void {
    const spec = resolveClass(prediction.className);
    if (spec.neutral) return; // classe de fundo nunca aciona nada

    // 1. atuador
    this.ui.highlightBin(spec);

    // 2. som + voz
    this.feedback.beep(spec.toneHz);
    this.feedback.speak(`${spec.display}. ${spec.instruction}.`);

    // 3. confirmação visual
    this.ui.flashScreen(spec.color);

    // 4. registro
    this.store.record({
      at: Date.now(),
      binId: spec.id as BinId,
      display: spec.display,
      confidence: prediction.probability,
    });

    this.ui.renderAction(spec, prediction.probability, this.store.total);
    console.info(
      `[acao] ${spec.display} -> ${spec.bin} ` +
        `(confianca ${(prediction.probability * 100).toFixed(1)}%)`
    );
  }
}
