/**
 * A short "error" beep made with the Web Audio API (no sound files needed).
 * Only plays when the user turned Sound on in Settings.
 */
let audio: AudioContext | null = null;

export function errorBeep(): void {
  try {
    audio ??= new AudioContext();
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.frequency.value = 220;
    gain.gain.value = 0.05;
    osc.connect(gain).connect(audio.destination);
    osc.start();
    osc.stop(audio.currentTime + 0.08);
  } catch {
    // Sound is optional; ignore browsers that block it.
  }
}
