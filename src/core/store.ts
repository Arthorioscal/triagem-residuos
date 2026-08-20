import { CONFIG } from "../config";
import type { BinId, LogEntry } from "../types";

export interface SessionState {
  counts: Record<BinId, number>;
  log: LogEntry[];
}

const EMPTY: SessionState = {
  counts: { reciclavel: 0, organico: 0, rejeito: 0 },
  log: [],
};

type Listener = (state: SessionState) => void;

/**
 * Estado da triagem. Persiste em localStorage para que a contagem sobreviva a
 * um reload — é o "registro" que a ação automatizada grava.
 */
export class SessionStore {
  private state: SessionState = load();
  private listeners = new Set<Listener>();

  get snapshot(): SessionState {
    return this.state;
  }

  get total(): number {
    return Object.values(this.state.counts).reduce((a, b) => a + b, 0);
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  record(entry: LogEntry): void {
    this.state = {
      counts: { ...this.state.counts, [entry.binId]: this.state.counts[entry.binId] + 1 },
      log: [entry, ...this.state.log].slice(0, 100),
    };
    this.commit();
  }

  reset(): void {
    this.state = { counts: { ...EMPTY.counts }, log: [] };
    this.commit();
  }

  toCsv(): string {
    const rows = this.state.log.map((e) =>
      [new Date(e.at).toISOString(), e.binId, e.display, e.confidence.toFixed(4)].join(",")
    );
    return ["data_hora,classe_id,classe,confianca", ...rows.reverse()].join("\n");
  }

  private commit(): void {
    try {
      localStorage.setItem(CONFIG.storageKey, JSON.stringify(this.state));
    } catch {
      // Modo privado / storage cheio: seguir sem persistir não quebra a demo.
    }
    this.listeners.forEach((l) => l(this.state));
  }
}

function load(): SessionState {
  try {
    const raw = localStorage.getItem(CONFIG.storageKey);
    if (!raw) return { counts: { ...EMPTY.counts }, log: [] };
    const parsed = JSON.parse(raw) as Partial<SessionState>;
    return {
      counts: { ...EMPTY.counts, ...parsed.counts },
      log: Array.isArray(parsed.log) ? parsed.log : [],
    };
  } catch {
    return { counts: { ...EMPTY.counts }, log: [] };
  }
}
