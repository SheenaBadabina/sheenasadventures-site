/* 
  Sheena’s Adventures — Desert Drop: Gem Stack
  File: /fun/gem-stack.js
  Purpose: Audio system + event bindings scaffold (mobile-first, no libs)

  What this provides:
  - Preloads all MP3s (background, gem-match, line-clear, level-up, game-over)
  - Respects browser autoplay policies (starts bg music after first user gesture)
  - Centralized play helpers with volume control and mute toggle
  - Clean event hooks: onMatch(), onLineClear(), onLevelUp(), onGameOver()
  - Minimal “Game” stub showing where to call audio events

  Requirements:
  - Place MP3s in /assets/sounds/ with exact names:
      background-loop.mp3
      gem-match.mp3
      line-clear.mp3
      level-up.mp3
      game-over.mp3
*/

(function () {
  "use strict";

  // ---------------------------------------------------------------------------
  // Utility
  // ---------------------------------------------------------------------------
  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

  // ---------------------------------------------------------------------------
  // Audio Manager
  // ---------------------------------------------------------------------------
  class GameAudio {
    constructor() {
      // File paths (exact per repo plan)
      this.paths = {
        bg: "/assets/sounds/background-loop.mp3",
        match: "/assets/sounds/gem-match.mp3",
        clear: "/assets/sounds/line-clear.mp3",
        level: "/assets/sounds/level-up.mp3",
        over: "/assets/sounds/game-over.mp3",
      };

      // Buffers & nodes
      this.ctx = null;
      this.buffers = new Map();
      this.bgSource = null;
      this.bgGain = null;
      this.fxGain = null;

      // State
      this.ready = false;
      this.muted = false;
      this.bgVolume = 0.3;
      this.fxVolume = 0.8;

      // Gesture gate for autoplay policies
      this._userInteracted = false;
      this._pendingBgStart = false;

      // Bindings
      this.onUserGesture = this.onUserGesture.bind(this);
      this.resumeIfSuspended = this.resumeIfSuspended.bind(this);
    }

    async init() {
      if (!window.AudioContext && !window.webkitAudioContext) {
        console.warn("[Audio] Web Audio API not supported.");
        return;
      }
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();

      // Master gain nodes
      this.bgGain = this.ctx.createGain();
      this.fxGain = this.ctx.createGain();
      this.bgGain.gain.value = this.muted ? 0 : this.bgVolume;
      this.fxGain.gain.value = this.muted ? 0 : this.fxVolume;
      this.bgGain.connect(this.ctx.destination);
      this.fxGain.connect(this.ctx.destination);

      // Preload all sounds
      await Promise.all([
        this._load("bg", this.paths.bg),
        this._load("match", this.paths.match),
        this._load("clear", this.paths.clear),
        this._load("level", this.paths.level),
        this._load("over", this.paths.over),
      ]);

      // Listen for first user gesture to allow playback
      ["pointerdown", "keydown", "touchstart"].forEach((evt) =>
        window.addEventListener(evt, this.onUserGesture, { passive: true, once: true })
      );

      this.ready = true;
      console.log("[Audio] Ready.");
    }

    async _load(key, url) {
      const res = await fetch(url, { cache: "force-cache" });
      const arrayBuf = await res.arrayBuffer();
      const audioBuf = await this.ctx.decodeAudioData(arrayBuf);
      this.buffers.set(key, audioBuf);
    }

    resumeIfSuspended() {
      if (this.ctx && this.ctx.state === "suspended") {
        return this.ctx.resume();
      }
      return Promise.resolve();
    }

    onUserGesture() {
      this._userInteracted = true;
      this.resumeIfSuspended().then(() => {
        if (this._pendingBgStart) {
          this._pendingBgStart = false;
          this.startBackground();
        }
      });
    }

    // -----------------------
    // Background loop control
    // -----------------------
    startBackground() {
      if (!this.ready) return;
      if (!this._userInteracted) {
        // Defer until gesture
        this._pendingBgStart = true;
        return;
      }
      this.stopBackground();

      const src = this.ctx.createBufferSource();
      src.buffer = this.buffers.get("bg");
      src.loop = true;
      src.connect(this.bgGain);
      src.start(0);
      this.bgSource = src;
    }

    stopBackground() {
      if (this.bgSource) {
        try {
          this.bgSource.stop();
        } catch {}
        this.bgSource.disconnect();
        this.bgSource = null;
      }
    }

    setBgVolume(v) {
      this.bgVolume = clamp(v, 0, 1);
      if (!this.muted && this.bgGain) this.bgGain.gain.value = this.bgVolume;
    }

    setFxVolume(v) {
      this.fxVolume = clamp(v, 0, 1);
      if (!this.muted && this.fxGain) this.fxGain.gain.value = this.fxVolume;
    }

    mute() {
      this.muted = true;
      if (this.bgGain) this.bgGain.gain.value = 0;
      if (this.fxGain) this.fxGain.gain.value = 0;
    }

    unmute() {
      this.muted = false;
      if (this.bgGain) this.bgGain.gain.value = this.bgVolume;
      if (this.fxGain) this.fxGain.gain.value = this.fxVolume;
    }

    toggleMute() {
      this.muted ? this.unmute() : this.mute();
      return this.muted;
    }

    // -----------------------
    // One-shot FX helpers
    // -----------------------
    _playOne(key, rate = 1.0) {
      if (!this.ready || this.muted) return;
      const buf = this.buffers.get(key);
      if (!buf) return;

      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      src.playbackRate.value = rate;

      const gain = this.ctx.createGain();
      gain.gain.value = this.fxVolume;

      src.connect(gain).connect(this.fxGain);
      src.start(0);

      // GC cleanup when finished
      src.addEventListener("ended", () => {
        try {
          src.disconnect();
          gain.disconnect();
        } catch {}
      });
    }

    playMatch() {
      this._playOne("match", 1.0);
    }

    playLineClear() {
      this._playOne("clear", 1.0);
    }

    playLevelUp() {
      this._playOne("level", 1.0);
    }

    playGameOver() {
      // Stop BG, then play over
      this.stopBackground();
      this._playOne("over", 1.0);
    }
  }

  // Singleton instance for the game to use
  const audio = new GameAudio();
  window.GameAudio = audio; // expose for debugging & UI hooks

  // ---------------------------------------------------------------------------
  // Minimal Game Stub (where to call audio)
  // ---------------------------------------------------------------------------
  const Game = {
    started: false,
    level: 1,
    score: 0,

    async init() {
      await audio.init();
      // Attach your UI buttons here (mute, pause, etc.)
      const muteBtn = document.querySelector("[data-audio='mute']");
      if (muteBtn) {
        muteBtn.addEventListener("click", () => {
          const muted = audio.toggleMute();
          muteBtn.setAttribute("aria-pressed", String(muted));
        });
      }

      // Start after a user gesture; call Game.start() from your Play button.
      console.log("[Game] Init complete.");
    },

    start() {
      if (this.started) return;
      this.started = true;
      audio.startBackground();

      // TODO: start game loop, spawn first piece, etc.
      console.log("[Game] Started.");
    },

    // Event hooks to call from your gameplay logic:
    onMatch() {
      audio.playMatch();
      // scoring updates here…
    },

    onLineClear() {
      audio.playLineClear();
      // scoring + cascade logic here…
    },

    onLevelUp() {
      this.level++;
      audio.playLevelUp();
      // speed/logic adjustments here…
    },

    onGameOver() {
      audio.playGameOver();
      this.started = false;
      // show overlay UI…
    },
  };

  // Auto-init on DOM ready. You’ll call Game.start() from your Play button.
  document.addEventListener("DOMContentLoaded", () => {
    Game.init();
    // Example hook: document.querySelector("[data-game='play']").addEventListener("click", () => Game.start());
  });
})();
