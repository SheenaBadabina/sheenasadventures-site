/*  Desert Drop — Gem Stack
    PHASE 1: Fullscreen + Pause/Restart
    ----------------------------------------------------- */

/* ========== Asset paths ========== */
const ASSETS = {
  images: {
    sprites: "/assets/gem-sprites.png",
    badges:  "/assets/level-badges.png",
    ui:      "/assets/ui-icons.png",
    bg:      "/assets/background-sky-canyon.png"
  },
  audio: {
    bg:       "/assets/background-loop.mp3",
    match:    "/assets/gem-match.mp3",
    line:     "/assets/line-clear.mp3",
    lvl:      "/assets/level-up.mp3",
    over:     "/assets/game-over.mp3",
    popOpt:   "/assets/pop.mp3"
  }
};

/* ========== DOM hookups ========== */
const $ = (sel) => document.querySelector(sel);

const el = {
  canvas: $("#gameCanvas"),
  play:   $("#playBtn"),
  pause:  $("#pauseBtn"),
  restart: $("#restartBtn"),
  mute:   $("#muteBtn"),
  score:  $('[data-ui="score"]'),
  level:  $('[data-ui="level"]'),
  best:   $('[data-ui="best"]'),
  left:   $('[data-control="left"]'),
  right:  $('[data-control="right"]'),
  down:   $('[data-control="down"]'),
  drop:   $('[data-control="drop"]'),
  rotate: $('[data-control="rotate"]'),
};

const ctx = el.canvas ? el.canvas.getContext("2d") : null;

/* ========== Game constants ========== */
const GRID_COLS = 8;
const GRID_ROWS = 16;
const COLORS = 6;
const MAX_COLORS = 9;
const CELL_SPRITE_MAP = [0,1,2,3,4,5,6,7,8];
const SPRITE_SHEET_SIZE = 1024;
const SPRITE_CELL = 1024 / 3;
const GRAVITY_BASE = 0.7;
const FAST_DROP_MULT = 0.15;
const HARD_DROP_BONUS = 5;
const MATCH_BASE = 100;
const MATCH_EXTRA = 50;
const CLEAR_PER_LEVEL = 10;
const SCORE_DIGITS = 6;

/* ========== Helpers ========== */
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const randInt = (n) => (Math.random() * n) | 0;
const rand = (min, max) => Math.random() * (max - min) + min;
const pad = (n, d=6) => String(n).padStart(d, "0");
const now = () => performance.now();

/* ========== Storage ========== */
const storage = {
  get best() { return +(localStorage.getItem("gem:best") || 0); },
  set best(v){ localStorage.setItem("gem:best", String(v)); }
};

/* ========== Audio ========== */
class GameAudio {
  constructor() {
    this.enabled = true;
    this.sounds = {};
    this.bg = null;
  }
  async load() {
    const loadOne = (key, src, loop=false, volume=1) => new Promise((res) => {
      const a = new Audio();
      a.src = src;
      a.loop = loop;
      a.preload = "auto";
      a.volume = volume;
      a.addEventListener("canplaythrough", () => res({ key, audio:a }), { once:true });
      a.addEventListener("error", () => res({ key, audio: null }), { once:true });
    });

    const items = await Promise.all([
      loadOne("bg",   ASSETS.audio.bg,  true, 0.30),
      loadOne("match",ASSETS.audio.match,false,0.9),
      loadOne("line", ASSETS.audio.line, false,0.9),
      loadOne("lvl",  ASSETS.audio.lvl,  false,1.0),
      loadOne("over", ASSETS.audio.over, false,0.8),
      loadOne("pop",  ASSETS.audio.popOpt,false,0.8)
    ]);

    for (const { key, audio } of items) {
      if (key === "bg") this.bg = audio;
      else if (audio) this.sounds[key] = audio;
    }
  }
  userGestureStart() {
    if (this.bg && this.enabled) {
      this.bg.currentTime = 0;
      this.bg.play().catch(()=>{});
    }
  }
  toggleMute() {
    this.enabled = !this.enabled;
    if (this.bg) this.bg.volume = this.enabled ? 0.30 : 0;
    for (const k in this.sounds) if (this.sounds[k]) this.sounds[k].volume = this.enabled ? 0.9 : 0;
    return this.enabled;
  }
  play(name) {
    if (!this.enabled) return;
    const a = name === "bg" ? this.bg : this.sounds[name];
    if (!a) return;
    try { a.currentTime = 0; a.play(); } catch {}
  }
  stopAll() {
    if (this.bg) { try { this.bg.pause(); } catch {} }
  }
}

const audio = new GameAudio();

/* ========== Assets ========== */
const images = {};
function loadImage(src) {
  return new Promise((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = src;
  });
}

/* ========== Visual Effects ========== */
class Particle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = rand(-2, 2);
    this.vy = rand(-4, -1);
    this.life = 1.0;
    this.decay = rand(0.015, 0.025);
    this.size = rand(2, 5);
    this.color = `hsl(${rand(40, 60)}, 100%, ${rand(60, 80)}%)`;
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.15;
    this.life -= this.decay;
    return this.life > 0;
  }
  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.life;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

const particles = [];

function spawnParticles(px, py, count = 8) {
  for (let i = 0; i < count; i++) {
    particles.push(new Particle(px, py));
  }
}

/* ========== Flash effect ========== */
const flashCells = new Set();
let flashTimer = 0;
const FLASH_DURATION = 0.1;

/* ========== Screen shake ========== */
let shakeAmount = 0;
let shakeDecay = 0;

function shake(intensity = 10) {
  shakeAmount = intensity;
  shakeDecay = 0.9;
}

/* ========== Chain display ========== */
let chainDisplay = { active: false, text: "", time: 0, maxTime: 1.5 };

function showChain(count) {
  chainDisplay = {
    active: true,
    text: `${count}x CHAIN!`,
    time: 0,
    maxTime: 1.5
  };
}

/* ========== Grid + Pieces ========== */
class Grid {
  constructor(cols, rows) {
    this.cols = cols; this.rows = rows;
    this.cells = new Array(rows).fill(0).map(()=>new Array(cols).fill(-1));
  }
  inBounds(x,y){ return x>=0 && x<this.cols && y>=0 && y<this.rows; }
  get(x,y){ return this.inBounds(x,y) ? this.cells[y][x] : -2; }
  set(x,y,v){ if(this.inBounds(x,y)) this.cells[y][x]=v; }
  clone(){ const g = new Grid(this.cols,this.rows); g.cells = this.cells.map(r=>r.slice()); return g; }
  collapse() {
    let moved = 0;
    for (let x=0;x<this.cols;x++){
      let write = this.rows-1;
      for (let y=this.rows-1;y>=0;y--){
        const v = this.cells[y][x];
        if (v >= 0) {
          if (y !== write) {
            this.cells[write][x]=v; this.cells[y][x]=-1;
            moved++;
          }
          write--;
        }
      }
    }
    return moved;
  }
  findMatches() {
    const clear = new Set();
    const dirs = [[1,0],[0,1],[1,1],[1,-1]];
    for (let y=0;y<this.rows;y++){
      for (let x=0;x<this.cols;x++){
        const c = this.get(x,y);
        if (c < 0) continue;
        for (const [dx,dy] of dirs) {
          let k=1;
          while (this.get(x+k*dx, y+k*dy) === c) k++;
          if (k>=3) {
            for (let t=0;t<k;t++) clear.add(`${x+t*dx},${y+t*dy}`);
          }
        }
      }
    }
    return clear;
  }
}

class FallingColumn {
  constructor(colorsAvail, cols) {
    this.order = [randInt(colorsAvail), randInt(colorsAvail), randInt(colorsAvail)];
    this.x = clamp((cols/2)|0, 1, cols-2);
    this.y = -2;
  }
  rotate() {
    const [a,b,c] = this.order;
    this.order = [c,a,b];
  }
  move(dx, grid) {
    const nx = clamp(this.x + dx, 0, grid.cols-1);
    for (let i=0;i<3;i++){
      const x = nx, y = this.y + i;
      if (y>=0 && grid.get(x,y) !== -1) return;
    }
    this.x = nx;
  }
  canFall(grid) {
    for (let i=2;i>=0;i--){
      const y = this.y + i + 1;
      const x = this.x;
      if (y < 0) continue;
      if (y >= grid.rows || grid.get(x,y) !== -1) return false;
    }
    return true;
  }
  step() { this.y++; }
  lockToGrid(grid) {
    for (let i=0;i<3;i++){
      const y = this.y + i;
      if (y >= 0) grid.set(this.x, y, this.order[i]);
    }
  }
  getGhostY(grid) {
    let testY = this.y;
    while (true) {
      let canFall = true;
      for (let i = 2; i >= 0; i--) {
        const y = testY + i + 1;
        const x = this.x;
        if (y < 0) continue;
        if (y >= grid.rows || grid.get(x, y) !== -1) {
          canFall = false;
          break;
        }
      }
      if (!canFall) return testY;
      testY++;
    }
  }
}

/* ========== Game State ========== */
const Game = {
  running: false,
  paused: false,
  over: false,
  grid: new Grid(GRID_COLS, GRID_ROWS),
  current: null,
  lastTick: 0,
  fallDelay: GRAVITY_BASE,
  softDrop: false,
  score: 0,
  best: storage.best,
  level: 1,
  clearsThisLevel: 0,
  colorsAvail: COLORS,
  flashingCells: null,
  flashTime: 0,
  chainCount: 0,

  reset() {
    this.running = true;
    this.paused = false;
    this.over = false;
    this.grid = new Grid(GRID_COLS, GRID_ROWS);
    this.current = new FallingColumn(this.colorsAvail, this.grid.cols);
    this.lastTick = now();
    this.fallDelay = GRAVITY_BASE;
    this.softDrop = false;
    this.score = 0;
    this.level = 1;
    this.clearsThisLevel = 0;
    this.colorsAvail = COLORS;
    this.flashingCells = null;
    this.flashTime = 0;
    this.chainCount = 0;
    particles.length = 0;
    flashCells.clear();
    flashTimer = 0;
    chainDisplay.active = false;
    shakeAmount = 0;
    updateButtonVisibility();
    drawAll();
    updateHUD();
  },

  togglePause() {
    if (!this.running || this.over) return;
    this.paused = !this.paused;
    if (el.pause) {
      el.pause.textContent = this.paused ? "▶️ Resume" : "⏸️ Pause";
    }
  },

  tick(dt) {
    if (!this.running || this.over || this.paused) return;

    if (this.flashingCells) {
      flashTimer += dt / 1000;
      if (flashTimer >= FLASH_DURATION) {
        this.flashingCells.forEach(key => {
          const [x, y] = key.split(",").map(Number);
          this.grid.set(x, y, -1);
          flashCells.delete(key);
        });
        this.grid.collapse();
        
        const nextMatches = this.grid.findMatches();
        if (nextMatches.size > 0) {
          if (!this.chainCount) this.chainCount = 1;
          this.chainCount++;
          showChain(this.chainCount);
          
          this.flashingCells = nextMatches;
          flashTimer = 0;
          nextMatches.forEach(key => {
            flashCells.add(key);
            const [x, y] = key.split(",").map(Number);
            const ox = ((CANVAS_W - CELL * GRID_COLS) / 2) | 0;
            const oy = ((CANVAS_H - CELL * GRID_ROWS) / 2) | 0;
            spawnParticles(ox + x * CELL + CELL / 2, oy + y * CELL + CELL / 2, 6);
          });
          const cleared = nextMatches.size;
          const extra = Math.max(0, cleared - 3);
          this.score += MATCH_BASE + extra * MATCH_EXTRA;
          this.score += Math.floor(this.score * 0.10);
          audio.play(cleared >= 4 ? "line" : "match");
          updateHUD();
        } else {
          this.flashingCells = null;
          this.chainCount = 0;
          flashTimer = 0;
          this.current = new FallingColumn(this.colorsAvail, this.grid.cols);
        }
        return;
      }
      return;
    }

    const stepTime = this.fallDelay * 1000 * (this.softDrop ? FAST_DROP_MULT : 1);
    if (dt >= stepTime) {
      if (this.current.canFall(this.grid)) {
        this.current.step();
      } else {
        this.current.lockToGrid(this.grid);
        if (this.current.y < 0) {
          this.gameOver();
          return;
        }
        
        const toClear = this.grid.findMatches();
        if (toClear.size > 0) {
          this.flashingCells = toClear;
          this.chainCount = 0;
          flashTimer = 0;
          
          toClear.forEach(key => {
            flashCells.add(key);
            const [x, y] = key.split(",").map(Number);
            const ox = ((CANVAS_W - CELL * GRID_COLS) / 2) | 0;
            const oy = ((CANVAS_H - CELL * GRID_ROWS) / 2) | 0;
            spawnParticles(ox + x * CELL + CELL / 2, oy + y * CELL + CELL / 2, 6);
          });
          
          const cleared = toClear.size;
          const extra = Math.max(0, cleared - 3);
          this.score += MATCH_BASE + extra * MATCH_EXTRA;
          this.clearsThisLevel += 1;
          
          if (this.clearsThisLevel >= CLEAR_PER_LEVEL) this.levelUp();
          audio.play(cleared >= 4 ? "line" : "match");
          updateHUD();
        } else {
          this.current = new FallingColumn(this.colorsAvail, this.grid.cols);
        }
      }
      this.lastTick = now();
    }
  },

  levelUp() {
    this.level++;
    this.clearsThisLevel = 0;
    this.fallDelay = Math.max(0.18, this.fallDelay * 0.90);
    this.colorsAvail = clamp(COLORS + Math.floor((this.level - 1) / 2), COLORS, MAX_COLORS);
    audio.play("lvl");
    updateHUD();
  },

  gameOver() {
    this.over = true;
    this.running = false;
    shake(20);
    audio.play("over");
    audio.stopAll();
    if (this.score > this.best) {
      this.best = this.score;
      storage.best = this.best;
    }
    updateHUD();
    updateButtonVisibility();
    audio.play("pop");
  }
};

/* ========== Button Visibility ========== */
function updateButtonVisibility() {
  console.log("Game state:", { running: Game.running, over: Game.over, paused: Game.paused });
  
  // Show/hide buttons based on game state
  if (el.play) {
    el.play.style.display = (!Game.running || Game.over) ? "inline-flex" : "none";
    console.log("Play button:", el.play.style.display);
  }
  
  if (el.pause) {
    el.pause.style.display = (Game.running && !Game.over) ? "inline-flex" : "none";
    console.log("Pause button:", el.pause.style.display);
  }
  
  if (el.restart) {
    el.restart.style.display = (Game.running || Game.over) ? "inline-flex" : "none";
    console.log("Restart button:", el.restart.style.display);
  }
  
  // Add/remove playing class to body
  if (Game.running && !Game.over) {
    document.body.classList.add('playing');
  } else {
    document.body.classList.remove('playing');
  }
}

/* ========== Input ========== */
function bindInputs() {
  if (el.play) {
    el.play.addEventListener("click", () => {
      audio.userGestureStart();
      Game.reset();
    });
  }

  if (el.pause) {
    el.pause.addEventListener("click", () => {
      Game.togglePause();
    });
  }

  if (el.restart) {
    el.restart.addEventListener("click", () => {
      audio.userGestureStart();
      Game.reset();
    });
  }

  if (el.mute) {
    el.mute.addEventListener("click", () => {
      const on = audio.toggleMute();
      console.log("Mute toggled, audio enabled:", on);
      // Update button text
      el.mute.textContent = on ? "🔇 Mute" : "🔊 Unmute";
      el.mute.setAttribute("aria-pressed", on ? "false" : "true");
    });
    // Set initial state
    el.mute.textContent = audio.enabled ? "🔇 Mute" : "🔊 Unmute";
  }

  el.left  && el.left.addEventListener("click",  () => tryMove(-1));
  el.right && el.right.addEventListener("click", () => tryMove(1));
  el.down  && el.down.addEventListener("mousedown", () => Game.softDrop = true);
  el.down  && el.down.addEventListener("mouseup",   () => Game.softDrop = false);
  el.down  && el.down.addEventListener("touchstart", (e) => { e.preventDefault(); Game.softDrop = true; });
  el.down  && el.down.addEventListener("touchend",   (e) => { e.preventDefault(); Game.softDrop = false; });
  el.rotate&& el.rotate.addEventListener("click", () => tryRotate());
  el.drop  && el.drop.addEventListener("click",   () => hardDrop());

  window.addEventListener("keydown", (e) => {
    if (!Game.running) return;
    if (Game.over) return;
    
    switch (e.key) {
      case "ArrowLeft":  if (!Game.paused) tryMove(-1); break;
      case "ArrowRight": if (!Game.paused) tryMove(1); break;
      case "ArrowDown":  if (!Game.paused) Game.softDrop = true; break;
      case " ":          if (!Game.paused) { e.preventDefault(); hardDrop(); } break;
      case "ArrowUp":    if (!Game.paused) tryRotate(); break;
      case "p":
      case "P":          Game.togglePause(); break;
      case "m":
      case "M":          if (el.mute) el.mute.click(); break;
    }
  });
  
  window.addEventListener("keyup", (e) => {
    if (e.key === "ArrowDown") Game.softDrop = false;
  });
}

function tryMove(dx) {
  if (!Game.current) return;
  Game.current.move(dx, Game.grid);
}

function tryRotate() {
  if (!Game.current) return;
  const test = [...Game.current.order];
  Game.current.rotate();
  for (let i = 0; i < 3; i++) {
    const y = Game.current.y + i;
    const x = Game.current.x;
