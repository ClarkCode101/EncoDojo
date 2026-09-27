/**
 * Short sounds made with the Web Audio API (no sound files needed):
 * - errorBeep: a low beep for a mistake (Settings -> "Tunog kapag nagkamali"),
 * - correctTick: a soft, high "tik" for a correct entry (Settings -> "Tunog kapag tama").
 */
let audio: AudioContext | null = null;

function tone(frequency: number, volume: number, seconds: number): void {
  try {
    audio ??= new AudioContext();
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.frequency.value = frequency;
    gain.gain.value = volume;
    osc.connect(gain).connect(audio.destination);
    osc.start();
    osc.stop(audio.currentTime + seconds);
  } catch {
    // Sound is optional; ignore browsers that block it.
  }
}

export function errorBeep(): void {
  tone(220, 0.05, 0.08);
}

export function correctTick(): void {
  tone(880, 0.025, 0.05);
}
