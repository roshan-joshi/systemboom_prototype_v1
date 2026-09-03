"use client";

/**
 * Cosmos ambient audio — lightweight HTMLAudioElement lifecycle.
 *
 * Behavior: attempt gentle autoplay; if the browser blocks it, wait
 * silently for the first user interaction (no nagging UI). Mute is
 * persisted and never overridden. Tab hidden → pause; visible → resume
 * (unless muted). All starts/stops fade.
 */

const SRC = "/audio/systemboom-cosmos-ambient.wav";
const STORAGE_KEY = "sb-sound";
const FADE_IN_MS = 1200;
const FADE_OUT_MS = 900;

export function storedMuted(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "muted";
  } catch {
    return false;
  }
}

export class CosmosAmbience {
  private audio: HTMLAudioElement | null = null;
  private fadeTimer: ReturnType<typeof setInterval> | null = null;
  private interactionArmed = false;
  private disposed = false;
  private baseVolume: number;
  muted: boolean;

  constructor(baseVolume: number, muted: boolean) {
    this.baseVolume = baseVolume;
    this.muted = muted;
  }

  start() {
    if (this.audio || this.disposed) return;
    const audio = new Audio(SRC);
    audio.loop = true;
    audio.volume = 0;
    audio.preload = "auto";
    this.audio = audio;
    if (process.env.NODE_ENV !== "production") {
      (window as unknown as { __SB_AMBIENCE?: HTMLAudioElement }).__SB_AMBIENCE = audio;
    }
    document.addEventListener("visibilitychange", this.onVisibility);
    if (this.muted) return;
    audio
      .play()
      .then(() => this.fadeTo(this.baseVolume, FADE_IN_MS))
      .catch(() => this.armInteraction());
  }

  /** Browser blocked autoplay — begin on the first real user gesture. */
  private armInteraction() {
    if (this.interactionArmed || this.disposed) return;
    this.interactionArmed = true;
    const begin = () => {
      removeAll();
      if (this.disposed || this.muted || !this.audio) return;
      this.audio
        .play()
        .then(() => this.fadeTo(this.baseVolume, FADE_IN_MS))
        .catch(() => {
          /* still blocked — stay silent, never nag */
        });
    };
    const opts = { once: true, capture: true } as const;
    const removeAll = () => {
      window.removeEventListener("pointerdown", begin, opts);
      window.removeEventListener("keydown", begin, opts);
      window.removeEventListener("touchstart", begin, opts);
    };
    window.addEventListener("pointerdown", begin, opts);
    window.addEventListener("keydown", begin, opts);
    window.addEventListener("touchstart", begin, opts);
  }

  private fadeTo(target: number, ms: number, then?: () => void) {
    const audio = this.audio;
    if (!audio) return;
    if (this.fadeTimer) clearInterval(this.fadeTimer);
    const stepMs = 50;
    const steps = Math.max(1, Math.round(ms / stepMs));
    const delta = (target - audio.volume) / steps;
    let n = 0;
    this.fadeTimer = setInterval(() => {
      n += 1;
      audio.volume = Math.min(1, Math.max(0, audio.volume + delta));
      if (n >= steps) {
        audio.volume = target;
        if (this.fadeTimer) clearInterval(this.fadeTimer);
        this.fadeTimer = null;
        then?.();
      }
    }, stepMs);
  }

  private ducked = false;

  /** Map handoff: the Cosmos recedes, so its ambience recedes too. */
  setDucked(ducked: boolean) {
    this.ducked = ducked;
    const audio = this.audio;
    if (!audio || this.muted || audio.paused) return;
    this.fadeTo(this.baseVolume * (ducked ? 0.3 : 1), 900);
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    try {
      localStorage.setItem(STORAGE_KEY, muted ? "muted" : "on");
    } catch {
      /* private mode */
    }
    const audio = this.audio;
    if (!audio) return;
    if (muted) {
      this.fadeTo(0, FADE_OUT_MS, () => audio.pause());
    } else {
      audio
        .play()
        .then(() =>
          this.fadeTo(this.baseVolume * (this.ducked ? 0.3 : 1), FADE_IN_MS),
        )
        .catch(() => this.armInteraction());
    }
  }

  private onVisibility = () => {
    const audio = this.audio;
    if (!audio || this.disposed) return;
    if (document.hidden) {
      if (!audio.paused) audio.pause();
    } else if (!this.muted) {
      audio.play().then(() => this.fadeTo(this.baseVolume, FADE_IN_MS)).catch(() => {});
    }
  };

  dispose() {
    this.disposed = true;
    document.removeEventListener("visibilitychange", this.onVisibility);
    const audio = this.audio;
    if (!audio) return;
    this.fadeTo(0, 600, () => {
      audio.pause();
      audio.src = "";
    });
    // Safety: hard stop even if the fade timer is interrupted mid-unmount.
    setTimeout(() => {
      audio.pause();
      audio.src = "";
    }, 800);
    this.audio = null;
  }
}
