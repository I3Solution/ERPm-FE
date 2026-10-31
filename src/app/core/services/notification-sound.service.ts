import { Injectable } from '@angular/core';

/**
 * Generates crisp subtle chimes using Web Audio API synthesis without external audio files.
 */
@Injectable({ providedIn: 'root' })
export class NotificationSoundService {
  private audioContext: AudioContext | null = null;
  public isSoundEnabled = true;

  playChime(severity: string = 'INFO'): void {
    if (!this.isSoundEnabled || typeof window === 'undefined') return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      if (!this.audioContext) {
        this.audioContext = new AudioCtx();
      }

      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }

      const now = this.audioContext.currentTime;
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();

      osc.type = 'sine';
      if (severity === 'DANGER') {
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(330, now + 0.3);
      } else {
        osc.frequency.setValueAtTime(587.33, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
      }

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.audioContext.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch {
      // Web Audio API may be silently blocked before first user gesture
    }
  }
}
