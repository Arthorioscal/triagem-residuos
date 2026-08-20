/**
 * Feedback sensorial da ação: um bipe com timbre próprio por tipo de resíduo
 * e a instrução falada em português. É o que faz a triagem funcionar sem a
 * pessoa precisar olhar para a tela.
 */
export class Feedback {
  private ctx: AudioContext | null = null;

  /** O navegador só libera áudio depois de uma interação do usuário. */
  unlock(): void {
    if (this.ctx) return;
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (Ctor) this.ctx = new Ctor();
  }

  beep(hz: number, ms = 180): void {
    this.unlock();
    if (!this.ctx || hz <= 0) return;
    void this.ctx.resume();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.value = hz;
    // Envelope curto: sem isso o corte do oscilador estala.
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.25, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + ms / 1000);

    osc.connect(gain).connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + ms / 1000);
  }

  speak(text: string): void {
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "pt-BR";
    utterance.rate = 1.05;
    synth.speak(utterance);
  }
}
