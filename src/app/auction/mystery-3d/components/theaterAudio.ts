// Web Audio API Audio Synthesizer cho Nhà Hát Đấu Giá 3D (Không cần file mp3 ngoài)
class TheaterSoundEngine {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  private initCtx() {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // 1. Tiếng trống dồn dập (Drum Roll) trước khi NPC bước ra
  playDrumRoll() {
    if (!this.enabled) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const duration = 2.5;
      const bufferSize = ctx.sampleRate * duration;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      // Tạo tiếng noise trống snare dồn dập
      for (let i = 0; i < bufferSize; i++) {
        const t = i / ctx.sampleRate;
        const envelope = Math.pow(t / duration, 1.5);
        const hit = Math.sin(t * 120 * Math.PI * 2) * 0.3;
        const noise = (Math.random() * 2 - 1) * 0.7;
        data[i] = (hit + noise) * envelope * 0.35;
      }

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

      source.connect(gain);
      gain.connect(ctx.destination);
      source.start();
    } catch {}
  }

  // 2. Tiếng nhạc Fanfare khi mở khăn nhung lộ vật phẩm (Reveal)
  playRevealFanfare() {
    if (!this.enabled) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const notes = [261.63, 329.63, 392.0, 523.25, 659.25, 783.99]; // C - E - G - C - E - G
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);

        gain.gain.setValueAtTime(0.01, ctx.currentTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + idx * 0.08 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.5);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.08);
        osc.stop(ctx.currentTime + idx * 0.08 + 0.5);
      });
    } catch {}
  }

  // 3. Tiếng giơ bảng đấu giá (Paddle Raise Ding)
  playPaddleDing() {
    if (!this.enabled) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
      osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.08); // A6

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {}
  }

  // 4. Tiếng gõ búa chốt giá của NPC Host (Gavel Knock)
  playGavelBang() {
    if (!this.enabled) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      [0, 0.28, 0.56].forEach((delay) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(140, ctx.currentTime + delay);
        osc.frequency.exponentialRampToValueAtTime(45, ctx.currentTime + delay + 0.09);

        gain.gain.setValueAtTime(0.35, ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + delay + 0.15);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + 0.15);
      });
    } catch {}
  }

  // 5. Tiếng vỗ tay của khán giả (Crowd Applause)
  playCrowdApplause() {
    if (!this.enabled) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const duration = 2.0;
      const bufferSize = ctx.sampleRate * duration;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        // Tiếng lộp bộp vỗ tay ngẫu nhiên
        const rand = Math.random() * 2 - 1;
        const envelope = Math.sin((i / bufferSize) * Math.PI);
        data[i] = rand * envelope * 0.2;
      }

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(1200, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.3, ctx.currentTime);

      source.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      source.start();
    } catch {}
  }
}

export const theaterAudio = new TheaterSoundEngine();

