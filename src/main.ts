import { CONFIG } from "./config";
import { ActionDispatcher } from "./core/actions";
import { Stabilizer } from "./core/stabilizer";
import { SessionStore } from "./core/store";
import { Classifier, topPrediction, type ImageClassifier } from "./model/classifier";
import { MockClassifier } from "./model/mockClassifier";
import { startWebcam, stopWebcam } from "./model/webcam";
import { Dashboard } from "./ui/dashboard";
import { Feedback } from "./ui/feedback";

const video = document.getElementById("webcam") as HTMLVideoElement;
const toggleBtn = document.getElementById("btn-toggle") as HTMLButtonElement;
const thresholdInput = document.getElementById("thr") as HTMLInputElement;
const thresholdOut = document.getElementById("thr-out") as HTMLOutputElement;
const csvBtn = document.getElementById("btn-csv") as HTMLButtonElement;
const resetBtn = document.getElementById("btn-reset") as HTMLButtonElement;

const ui = new Dashboard();
const store = new SessionStore();
const feedback = new Feedback();
/** `?demo=1` troca o modelo real por um simulado — ver mockClassifier.ts. */
const demoMode = new URLSearchParams(location.search).has("demo");
const classifier: ImageClassifier = demoMode ? new MockClassifier() : new Classifier();
const stabilizer = new Stabilizer();
const actions = new ActionDispatcher(store, ui, feedback);

let running = false;
let loopTimer = 0;
let lastFrameAt = 0;

store.subscribe((state) => ui.renderSession(state));
ui.setStreakTarget(CONFIG.stableFrames);

const liveLabel = () =>
  demoMode ? "MODO DEMONSTRAÇÃO — modelo simulado" : "Classificando ao vivo";

/** Um passo do laço: captura -> predição -> gatilho -> (talvez) ação. */
async function step(): Promise<void> {
  if (!running) return;

  const predictions = await classifier.predict(video);
  const top = topPrediction(predictions);
  ui.renderPredictions(predictions, top);

  const now = performance.now();
  const result = stabilizer.push(top, now);
  ui.renderTrigger(result, CONFIG.stableFrames);

  // >>> aqui a predição vira ação, sem intervenção do usuário <<<
  if (result.confirmed) actions.dispatch(result.confirmed);

  if (lastFrameAt) ui.setFps(1000 / (now - lastFrameAt));
  lastFrameAt = now;

  loopTimer = window.setTimeout(() => void step(), 1000 / CONFIG.inferenceFps);
}

function start(): void {
  if (running) return;
  running = true;
  lastFrameAt = 0;
  stabilizer.reset();
  toggleBtn.textContent = "Pausar";
  ui.setStatus(liveLabel(), "ok");
  void step();
}

function pause(): void {
  running = false;
  window.clearTimeout(loopTimer);
  toggleBtn.textContent = "Retomar";
  ui.setStatus("Pausado", "paused");
}

toggleBtn.addEventListener("click", () => {
  feedback.unlock(); // o navegador libera o áudio no primeiro clique
  running ? pause() : start();
});

thresholdInput.addEventListener("input", () => {
  const pct = Number(thresholdInput.value);
  thresholdOut.textContent = `${pct}%`;
  stabilizer.setThreshold(pct / 100);
});

csvBtn.addEventListener("click", () => {
  const blob = new Blob([store.toCsv()], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "triagem-residuos.csv";
  link.click();
  URL.revokeObjectURL(url);
});

resetBtn.addEventListener("click", () => {
  store.reset();
  ui.setStatus(running ? liveLabel() : "Pausado", running ? "ok" : "paused");
});

/**
 * Encerra o laço e devolve a câmera ao sistema. Precisa rodar em toda saída:
 * sem isso a webcam fica retida e o navegador abre um stream novo a cada
 * recarga (é o que fazia a luz da câmera piscar durante o desenvolvimento).
 */
function teardown(): void {
  running = false;
  window.clearTimeout(loopTimer);
  stopWebcam(video);
}

window.addEventListener("pagehide", teardown);
import.meta.hot?.dispose(teardown);

async function boot(): Promise<void> {
  try {
    // O modelo é carregado ANTES da câmera de propósito: se ele estiver
    // faltando, a webcam nunca é ligada — nada de acender a luz da câmera e
    // pedir permissão para depois falhar.
    ui.setStatus(demoMode ? "Carregando modelo simulado…" : "Carregando modelo…", "loading");
    await classifier.load();
    console.info("[modelo] classes treinadas:", classifier.labels.join(", "));

    ui.setStatus("Pedindo acesso à webcam…", "loading");
    try {
      await startWebcam(video);
    } catch (error) {
      // Sem webcam o modo demonstração ainda roda (o modelo simulado não lê o
      // vídeo). Já o modelo real depende da imagem, então aí o erro sobe.
      if (!demoMode) throw error;
      console.warn("[demo] seguindo sem webcam:", error);
    }

    thresholdInput.value = String(Math.round(CONFIG.confidenceThreshold * 100));
    thresholdOut.textContent = `${thresholdInput.value}%`;
    stabilizer.setThreshold(CONFIG.confidenceThreshold);

    start();
  } catch (error) {
    teardown(); // qualquer falha libera o dispositivo em vez de deixá-lo preso
    const message = error instanceof Error ? error.message : String(error);
    ui.setStatus(message, "error");
    console.error(error);
  }
}

void boot();
