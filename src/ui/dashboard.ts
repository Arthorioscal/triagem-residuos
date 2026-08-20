import { BINS, resolveClass } from "../config";
import type { SessionState } from "../core/store";
import type { ClassSpec, LogEntry, Prediction, TriggerState } from "../types";

const el = <T extends HTMLElement>(id: string): T => {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Elemento #${id} não existe no index.html`);
  return node as T;
};

/** Todo o desenho da interface fica aqui; a lógica não conhece o DOM. */
export class Dashboard {
  private readonly status = el("status");
  private readonly bars = el<HTMLUListElement>("bars");
  private readonly overlayLabel = el("overlay-label");
  private readonly overlayConf = el("overlay-conf");
  private readonly flash = el("flash");
  private readonly streak = el("streak");
  private readonly armedChip = el("armed");
  private readonly bins = el("bins");
  private readonly totals = el("totals");
  private readonly log = el<HTMLOListElement>("log");
  private readonly actionCard = el("action-card");
  private readonly actionTitle = el("action-title");
  private readonly actionDetail = el("action-detail");
  private readonly fps = el("fps");

  constructor() {
    this.renderBins();
  }

  setStreakTarget(value: number): void {
    el("streak-target").textContent = String(value);
  }

  setStatus(text: string, kind: "loading" | "ok" | "error" | "paused"): void {
    this.status.textContent = text;
    this.status.className = `status status--${kind}`;
  }

  setFps(value: number): void {
    this.fps.textContent = `${value.toFixed(1)} fps de inferência`;
  }

  /** Barras de confiança de todas as classes, atualizadas a cada quadro. */
  renderPredictions(predictions: Prediction[], top: Prediction): void {
    if (this.bars.childElementCount !== predictions.length) {
      this.bars.innerHTML = predictions
        .map((p, i) => {
          const spec = resolveClass(p.className);
          return `<li data-i="${i}">
            <div class="bar-head">
              <span class="dot" style="background:${spec.color}"></span>
              <span class="bar-name">${escapeHtml(p.className)}</span>
              <span class="bar-val">0%</span>
            </div>
            <div class="bar-track"><div class="bar-fill" style="background:${spec.color}"></div></div>
          </li>`;
        })
        .join("");
    }

    predictions.forEach((p, i) => {
      const row = this.bars.children[i] as HTMLElement | undefined;
      if (!row) return;
      const pct = p.probability * 100;
      row.querySelector<HTMLElement>(".bar-val")!.textContent = `${pct.toFixed(1)}%`;
      row.querySelector<HTMLElement>(".bar-fill")!.style.width = `${pct.toFixed(2)}%`;
      row.classList.toggle("is-top", p.className === top.className);
    });

    const spec = resolveClass(top.className);
    this.overlayLabel.textContent = top.className;
    this.overlayLabel.style.color = spec.color;
    this.overlayConf.textContent = `${(top.probability * 100).toFixed(1)}%`;
  }

  renderTrigger(state: TriggerState, target: number): void {
    this.streak.textContent = String(Math.min(state.streak, target));
    this.armedChip.textContent = state.armed ? "pronto" : "aguardando cena vazia";
    this.armedChip.className = `chip ${state.armed ? "chip--ok" : "chip--wait"}`;
  }

  /** Destaca a lixeira certa e anima a tampa abrindo (o "atuador"). */
  highlightBin(spec: ClassSpec): void {
    this.bins.querySelectorAll(".bin").forEach((node) => node.classList.remove("is-active"));
    const card = this.bins.querySelector<HTMLElement>(`.bin[data-id="${spec.id}"]`);
    if (!card) return;
    card.classList.add("is-active");
    card.classList.remove("is-open");
    void card.offsetWidth; // reinicia a animação da tampa
    card.classList.add("is-open");
    window.setTimeout(() => card.classList.remove("is-open"), 2200);
  }

  flashScreen(color: string): void {
    this.flash.style.background = color;
    this.flash.classList.remove("is-on");
    void this.flash.offsetWidth;
    this.flash.classList.add("is-on");
  }

  renderAction(spec: ClassSpec, confidence: number, total: number): void {
    this.actionCard.className = "action-card action-card--fired";
    this.actionCard.style.borderColor = spec.color;
    this.actionTitle.textContent = `${spec.display} → ${spec.bin}`;
    this.actionDetail.textContent =
      `${spec.instruction} · confiança ${(confidence * 100).toFixed(1)}% · ` +
      `item nº ${total} da sessão`;
  }

  renderSession(state: SessionState): void {
    this.totals.innerHTML = BINS.map((spec) => {
      const count = state.counts[spec.id as "reciclavel" | "organico" | "rejeito"];
      return `<div class="total">
        <span class="total-num" style="color:${spec.color}">${count}</span>
        <span class="total-label">${spec.display}</span>
      </div>`;
    }).join("");

    this.log.innerHTML = state.log.length
      ? state.log.map((entry) => this.logRow(entry)).join("")
      : `<li class="hint">Sem registros nesta sessão.</li>`;
  }

  private logRow(entry: LogEntry): string {
    const spec = resolveClass(entry.display);
    const time = new Date(entry.at).toLocaleTimeString("pt-BR");
    return `<li>
      <span class="dot" style="background:${spec.color}"></span>
      <span class="log-class">${escapeHtml(entry.display)}</span>
      <span class="log-conf">${(entry.confidence * 100).toFixed(0)}%</span>
      <span class="log-time">${time}</span>
    </li>`;
  }

  private renderBins(): void {
    this.bins.innerHTML = BINS.map(
      (spec) => `<div class="bin" data-id="${spec.id}" style="--bin:${spec.color}">
        <div class="bin-lid"></div>
        <div class="bin-body">
          <strong>${spec.display}</strong>
          <span>${spec.bin}</span>
          <em>${spec.examples}</em>
        </div>
      </div>`
    ).join("");
  }
}

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!
  );
}
