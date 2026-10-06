// WhatsApp Web Web-Audio Synthesizer
// Generates accurate WhatsApp sounds without external MP3 dependencies

class SoundEngine {
  private ctx: AudioContext | null = null;
  private callOscillator: OscillatorNode | null = null;
  private isRinging: boolean = false;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Authentic WhatsApp message sent "pop" sound
  playSent() {
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch {
      // Audio autoplay policy fallback
    }
  }

  // WhatsApp incoming message chime (two gentle harmonic marimba-like tones)
  playReceived() {
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      // Tone 1
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now); // D5
      gain1.gain.setValueAtTime(0.25, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.15);

      // Tone 2 (higher note)
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.12); // A5
      gain2.gain.setValueAtTime(0.22, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.35);
    } catch {
      // Audio fallback
    }
  }

  // WhatsApp outgoing call ringing simulator
  startRinging() {
    try {
      this.initCtx();
      if (!this.ctx || this.isRinging) return;
      this.isRinging = true;

      const loopTone = () => {
        if (!this.isRinging || !this.ctx) return;
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(480, now);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.2, now + 0.1);
        gain.gain.setValueAtTime(0.2, now + 1.2);
        gain.gain.linearRampToValueAtTime(0.001, now + 1.4);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 1.4);

        if (this.isRinging) {
          setTimeout(loopTone, 3000);
        }
      };

      loopTone();
    } catch {
      // Fallback
    }
  }

  stopRinging() {
    this.isRinging = false;
    if (this.callOscillator) {
      try {
        this.callOscillator.stop();
        this.callOscillator.disconnect();
      } catch {}
      this.callOscillator = null;
    }
  }
}

export const sound = new SoundEngine();
