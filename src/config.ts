import type { ClassSpec } from "./types";

/**
 * Parâmetros do gatilho. Todos foram escolhidos para evitar falso positivo:
 * a ação só acontece quando a mesma classe se mantém acima do limiar por
 * vários quadros seguidos.
 */
export const CONFIG = {
  /** Pasta em `public/` com model.json + metadata.json + weights.bin. */
  modelPath: "model/",
  /** Confiança mínima para a predição ser considerada válida (0–1). */
  confidenceThreshold: 0.85,
  /** Quadros consecutivos com a mesma classe antes de disparar a ação. */
  stableFrames: 8,
  /** Tempo mínimo entre duas ações, em ms. */
  cooldownMs: 2000,
  /** Quadros de inferência por segundo (não precisa ser 60 — economiza CPU). */
  inferenceFps: 10,
  /** Espelhar a imagem da webcam (mais natural para quem está na frente). */
  mirror: true,
  storageKey: "ecotriagem:sessao:v1",
} as const;

/**
 * Mapa "classe treinada -> o que o sistema faz".
 * As chaves são os rótulos do Teachable Machine já normalizados
 * (minúsculas, sem acento e sem espaço) — ver `normalizeLabel`.
 *
 * Se vocês nomearem as classes com outro texto, basta acrescentar o apelido
 * em `ALIASES` abaixo; não é preciso mexer em mais nada.
 */
export const CLASSES: Record<string, ClassSpec> = {
  reciclavel: {
    id: "reciclavel",
    display: "Reciclável",
    neutral: false,
    bin: "Lixeira AZUL",
    color: "#3b82f6",
    instruction: "Descarte na lixeira azul",
    toneHz: 880,
    examples: "garrafa PET, lata, papel, embalagem plástica",
  },
  organico: {
    id: "organico",
    display: "Orgânico",
    neutral: false,
    bin: "Lixeira MARROM",
    color: "#a16207",
    instruction: "Descarte na lixeira marrom",
    toneHz: 587,
    examples: "casca de fruta, restos de comida, borra de café",
  },
  rejeito: {
    id: "rejeito",
    display: "Rejeito",
    neutral: false,
    bin: "Lixeira CINZA",
    color: "#6b7280",
    instruction: "Descarte na lixeira cinza",
    toneHz: 392,
    examples: "papel higiênico, esponja, absorvente, isopor sujo",
  },
  nada: {
    id: "neutro",
    display: "Nada",
    neutral: true,
    bin: "—",
    color: "#475569",
    instruction: "Nenhuma ação",
    toneHz: 0,
    examples: "cena vazia, fundo, mão sem objeto",
  },
};

/** Rótulos alternativos aceitos para cada classe. */
const ALIASES: Record<string, string> = {
  reciclavel: "reciclavel",
  reciclaveis: "reciclavel",
  reciclagem: "reciclavel",
  organico: "organico",
  organicos: "organico",
  rejeito: "rejeito",
  rejeitos: "rejeito",
  naoreciclavel: "rejeito",
  nada: "nada",
  neutro: "nada",
  fundo: "nada",
  vazio: "nada",
  background: "nada",
  none: "nada",
};

/** "Recicláveis " -> "reciclaveis" */
export function normalizeLabel(label: string): string {
  return label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

/**
 * Resolve o rótulo do modelo para a configuração da classe.
 * Rótulo desconhecido é tratado como neutro — assim um modelo com classes
 * extras nunca dispara uma ação errada.
 */
export function resolveClass(label: string): ClassSpec {
  const key = ALIASES[normalizeLabel(label)];
  const spec = key ? CLASSES[key] : undefined;
  return spec ?? { ...CLASSES.nada, display: label };
}

/** Lixeiras que aparecem no painel de ação e no dashboard. */
export const BINS = [CLASSES.reciclavel, CLASSES.organico, CLASSES.rejeito];
