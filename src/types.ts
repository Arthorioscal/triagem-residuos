/** Uma predição crua devolvida pelo modelo do Teachable Machine. */
export interface Prediction {
  /** Nome da classe exatamente como foi escrito no Teachable Machine. */
  className: string;
  /** Confiança de 0 a 1. */
  probability: number;
}

/** Identificador interno de cada lixeira do sistema. */
export type BinId = "reciclavel" | "organico" | "rejeito";

/**
 * Configuração de uma classe treinada. `neutral: true` marca a classe de
 * fundo ("Nada"): ela nunca dispara ação, só serve para rearmar o gatilho.
 */
export interface ClassSpec {
  id: BinId | "neutro";
  /** Nome curto exibido na interface. */
  display: string;
  neutral: boolean;
  /** Nome da lixeira, no padrão CONAMA 275/2001. */
  bin: string;
  /** Cor da lixeira (também usada nas barras de confiança). */
  color: string;
  /** Frase falada/exibida quando a ação dispara. */
  instruction: string;
  /** Frequência do bipe de confirmação, em Hz — um som por tipo de resíduo. */
  toneHz: number;
  examples: string;
}

/** Um item efetivamente triado (uma ação que já aconteceu). */
export interface LogEntry {
  at: number;
  binId: BinId;
  display: string;
  confidence: number;
}

/** Estado do gatilho, exposto para a interface mostrar o que está acontecendo. */
export interface TriggerState {
  streak: number;
  armed: boolean;
  candidate: string | null;
}
