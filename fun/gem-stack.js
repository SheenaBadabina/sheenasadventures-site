/*  Desert Drop — Gem Stack
    Full working build (asset paths flattened to /assets)
    ----------------------------------------------------- */

/* ========== Asset paths (flat /assets) ========== */
const ASSETS = {
  images: {
    sprites: "/assets/gem-sprites.png",        // 3x3 grid, 768x768
    badges:  "/assets/level-badges.png",       // 3x3 grid, 768x768
    ui:      "/assets/ui-icons.png",           // 3x3 grid, 768x768 (not strictly required by JS)
    bg:      "/assets/background-sky-canyon.png"
  },
  audio: {
    bg:       "/assets/background-loop.mp3",
    match:    "/assets/gem-match.mp3",
    line:     "/assets/line-clear.mp3",
    lvl:      "/assets/level-up.mp3",
    over:     "/assets/game-over.mp3",
    popOpt:   "/assets/pop.mp3" // optional; handled if missing
  }
};

/* ========== DOM hookups (defensive: won't crash if absent) ========== */
const $ = (sel) => document.querySelector(sel);

const el = {
  canvas: $("#gameCanvas"),
  play:   document.querySelector('[data-game="play"]'),
  mute:   document.querySelector('[data-audio="mute"]'),
  score:  document.querySelector('[data-ui="score"]'),
  level:  document.querySelector('[data-ui="level"]'),
  best:   document.querySelector('[data-ui="best"]'),
  // on-screen controls (optional)
  left:   document.querySelector('[data-control="left"]'),
  right:  document.querySelector('[data-control="right"]'),
  down:   document.querySelector('[data-control="down"]'),
  drop:   document.querySelector('[data-control="drop"]'),
  rotate: document.querySelector('[data-control="rotate"]'),
};

const ctx = el.canvas ? el.canvas.getContext("2d") : null;

/* ========== Game constants ========== */
const GRID_COLS = 8;
const GRID_ROWS = 16;
const COLORS = 6;              // number of gem colors available at level 1 (will increase)
const MAX_COLORS = 8;          // cap for higher levels
const CELL_SPRITE_MAP = [0,1,2,3,4,5,6,7,8]; // indices into 3x3 sprite sheet; we’ll mod by available colors
const SPRITE_SHEET_SIZE = 768;
const SPRITE_CELL = 256;       // 768 / 3
const GRAVITY_BASE = 0.7;      // seconds per step at level 1 (will speed up)
const FAST_DROP_MULT = 0.15;   // soft drop speed multiplier
const HARD_DROP_BONUS = 5;     // points per cell hard-dropped
const MATCH_BASE = 100;
const MATCH_EXTRA = 50;
const CLEAR_PER_LEVEL = 10;    // clears required to level up
const SCORE_DIGITS = 6;

/* ========== Helpers ========== */
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const randInt = (n) => (Math.random() * n) | 0;
const pad = (n, d=6) => String(n).padStart(d, "0");
const now = () => performance.now();

/* ========== Storage (best score) ========== */
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
      a.addEventListener("error", () => {
        // optional pop may 404 — just resolve with null
        res({ key, audio: null });
      }, { once:true });
    });

    const items = await Promise.all([
      loadOne("bg",   ASSETS.audio.bg,  true, 0.30),
      loadOne("match",ASSETS.audio.match,false,0.9),
      loadOne("line", ASSETS.audio.line, false,0.9),
      loadOne("lvl",  ASSETS.audio.lvl,  false,1.0),
      loadOne("over", ASSETS.audio.over, false,0.8),
      loadOne("pop",  ASSETS.audio.popOpt,false,0.8) // optional
    ]);

    for (const { key, audio } of items) {
      if (key === "bg") this.bg = audio;
      else if (audio) this.sounds[key] = audio;
    }
  }
  userGestureStart() {
    // must be called by Play button (user gesture) before autoplays
    if (this.bg && this.enabled) {
      this.bg.currentTime = 0;
      this.bg.play().catch(()=>{});
    }
  }
  toggleMute() {
    this.enabled = !this.enabled;
    const vol = this.enabled ? 1 : 0;
    if (this.bg) this.bg.volume = this.enabled ? 0.30 : 0;
    for (const k in this.sounds) if (this.sounds[k]) this.sounds[k].volume = vol;
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

/* ========== Assets (images) ========== */
const images = {};
function loadImage(src) {
  return new Promise((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = src;
  });
}

/* ========== Grid + Pieces ========== */
class Grid {
  constructor(cols, rows) {
    this.cols = cols; this.rows = rows;
    this.cells = new Array(rows).fill(0).map(()=>new Array(cols).fill(-1)); // -1 empty, else color index
  }
  inBounds(x,y){ return x>=0 && x<this.cols && y>=0 && y<this.rows; }
  get(x,y){ return this.inBounds(x,y) ? this.cells[y][x] : -2; }
  set(x,y,v){ if(this.inBounds(x,y)) this.cells[y][x]=v; }
  clone(){ const g = new Grid(this.cols,this.rows); g.cells = this.cells.map(r=>r.slice()); return g; }
  collapse() {
    // gravity; return # cells moved for animation feel (and potential soft points)
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
    // returns a Set of coordinates "x,y" to clear; looks for >=3 in lines (4 dirs)
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
  // vertical column of 3 gems; state includes top-left (x,y = grid coords of top gem)
  constructor(colorsAvail, cols) {
    this.order = [randInt(colorsAvail), randInt(colorsAvail), randInt(colorsAvail)];
    this.x = clamp((cols/2)|0, 1, cols-2);
    this.y = -2; // start above board
  }
  rotate() {
    // reorder vertically (cycle down)
    const [a,b,c] = this.order;
    this.order = [c,a,b];
  }
  move(dx, grid) {
    const nx = clamp(this.x + dx, 0, grid.cols-1);
    // check collision at current y..y+2
    for (let i=0;i<3;i++){
      const x = nx, y = this.y + i;
      if (y>=0 && grid.get(x,y) !== -1) return; // blocked
    }
    this.x = nx;
  }
  canFall(grid) {
    for (let i=2;i>=0;i--){
      const y = this.y + i + 1;
      const x = this.x;
      if (y < 0) continue; // above board is fine
      if (y >= grid.rows || grid.get(x,y) !== -1) return false;
    }
    return true;
  }
  step() { this.y++; }
  lockToGrid(grid) {
    // place the three gems; if above board → game over will be checked outside
    for (let i=0;i<3;i++){
      const y = this.y + i;
      if (y >= 0) grid.set(this.x, y, this.order[i]);
    }
  }
}

/* ========== Game State ========== */
const Game = {
  running: false,
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

  reset() {
    this.running = true;
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
    drawAll();
    updateHUD();
  },

  tick(dt) {
    if (!this.running || this.over) return;

    const stepTime = this.fallDelay * 1000 * (this.softDrop ? FAST_DROP_MULT : 1);
    if (dt >= stepTime) {
      // try fall
      if (this.current.canFall(this.grid)) {
        this.current.step();
      } else {
        // lock; if any part above top row → game over
        this.current.lockToGrid(this.grid);
        if (this.current.y < 0) {
          this.gameOver();
          return;
        }
        // resolve clears + cascades
        let totalCleared = 0;
        let chains = 0;
        while (true) {
          const toClear = this.grid.findMatches();
          if (toClear.size === 0) break;
          // count+clear
          toClear.forEach(key => {
            const [x,y] = key.split(",").map(Number);
            this.grid.set(x,y,-1);
          });
          const cleared = toClear.size;
          totalCleared += cleared;
          chains++;
          // scoring
          const extra = Math.max(0, cleared - 3);
          this.score += MATCH_BASE + extra * MATCH_EXTRA;
          if (chains > 1) {
            // light combo bonus: 10% per chain after first
            this.score += Math.floor(this.score * 0.10);
          }
          audio.play(cleared >= 4 ? "line" : "match");
          // gravity collapse
          this.grid.collapse();
        }
        if (totalCleared > 0) {
          this.clearsThisLevel += 1;
          if (this.clearsThisLevel >= CLEAR_PER_LEVEL) this.levelUp();
        }
        // spawn next
        this.current = new FallingColumn(this.colorsAvail, this.grid.cols);
      }
      this.lastTick = now();
    }
  },

  levelUp() {
    this.level++;
    this.clearsThisLevel = 0;
    // speed up (clamp so it never gets silly-fast)
    this.fallDelay = Math.max(0.18, this.fallDelay * 0.90);
    // gradually add colors up to MAX_COLORS
    this.colorsAvail = clamp(COLORS + Math.floor((this.level-1)/2), COLORS, MAX_COLORS);
    audio.play("lvl");
    updateHUD();
  },

  gameOver() {
    this.over = true;
    this.running = false;
    audio.play("over");
    audio.stopAll();
    // update best
    if (this.score > this.best) {
      this.best = this.score;
      storage.best = this.best;
    }
    updateHUD();
    // small pop if available
    audio.play("pop");
  }
};

/* ========== Input ========== */
function bindInputs() {
  // Buttons
  if (el.play) {
    el.play.addEventListener("click", () => {
      audio.userGestureStart();
      Game.reset();
    });
  }
  if (el.mute) {
    el.mute.addEventListener("click", () => {
      const on = audio.toggleMute();
      el.mute.setAttribute("aria-pressed", on ? "false" : "true");
    });
  }
  // Touch controls (optional)
  el.left  && el.left.addEventListener("click",  () => tryMove(-1));
  el.right && el.right.addEventListener("click", () => tryMove(1));
  el.down  && el.down.addEventListener("mousedown", () => Game.softDrop = true);
  el.down  && el.down.addEventListener("mouseup",   () => Game.softDrop = false);
  el.rotate&& el.rotate.addEventListener("click", () => tryRotate());
  el.drop  && el.drop.addEventListener("click",   () => hardDrop());

  // Keyboard
  window.addEventListener("keydown", (e) => {
    if (!Game.running || Game.over) return;
    switch (e.key) {
      case "ArrowLeft":  tryMove(-1); break;
      case "ArrowRight": tryMove(1); break;
      case "ArrowDown":  Game.softDrop = true; break;
      case " ":          e.preventDefault(); hardDrop(); break;
      case "ArrowUp":    tryRotate(); break;
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
  // simple rotate always allowed if space free; check collision
  const test = [...Game.current.order];
  Game.current.rotate();
  // if rotate causes collision with solid cell, revert
  for (let i=0;i<3;i++){
    const y = Game.current.y + i;
    const x = Game.current.x;
    if (y>=0 && Game.grid.get(x,y) !== -1) {
      Game.current.order = test;
      return;
    }
  }
}
function hardDrop() {
  if (!Game.current) return;
  let cells = 0;
  while (Game.current.canFall(Game.grid)) {
    Game.current.step();
    cells++;
  }
  if (cells>0) Game.score += HARD_DROP_BONUS * cells;
  updateHUD();
}

/* ========== Rendering ========== */
let CANVAS_W = 640, CANVAS_H = 960, CELL;
function resizeCanvas() {
  if (!el.canvas) return;
  const maxW = el.canvas.clientWidth || window.innerWidth;
  const maxH = el.canvas.clientHeight || window.innerHeight * 0.6;
  // keep 9:16-ish aspect but fit parent
  const targetW = Math.min(maxW, 720);
  const targetH = Math.min(maxH, Math.floor(targetW * 1.5));
  el.canvas.width = CANVAS_W = targetW|0;
  el.canvas.height= CANVAS_H = targetH|0;
  CELL = Math.floor(Math.min(CANVAS_W/GRID_COLS, CANVAS_H/GRID_ROWS));
  drawAll();
}

function drawAll() {
  if (!ctx) return;
  // background
  if (images.bg) {
    // cover
    const iw = images.bg.width, ih = images.bg.height;
    const s = Math.max(CANVAS_W/iw, CANVAS_H/ih);
    const sw = iw*s, sh = ih*s;
    ctx.drawImage(images.bg, (CANVAS_W-sw)/2, (CANVAS_H-sh)/2, sw, sh);
  } else {
    ctx.fillStyle = "#0F1419";
    ctx.fillRect(0,0,CANVAS_W,CANVAS_H);
  }

  // board letterbox
  const ox = ((CANVAS_W - CELL*GRID_COLS)/2)|0;
  const oy = ((CANVAS_H - CELL*GRID_ROWS)/2)|0;

  // grid background
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.fillRect(ox, oy, CELL*GRID_COLS, CELL*GRID_ROWS);

  // draw placed gems
  for (let y=0;y<GRID_ROWS;y++){
    for (let x=0;x<GRID_COLS;x++){
      const c = Game.grid.get(x,y);
      if (c >= 0) drawGem(ox + x*CELL, oy + y*CELL, CELL, c);
    }
  }

  // draw falling column
  if (Game.current) {
    for (let i=0;i<3;i++){
      const y = Game.current.y + i;
      if (y < 0) continue;
      drawGem(ox + Game.current.x*CELL, oy + y*CELL, CELL, Game.current.order[i]);
    }
  }

  // grid overlay lines
  ctx.strokeStyle = "rgba(255,255,255,0.04)";
  ctx.lineWidth = 1;
  for (let x=0;x<=GRID_COLS;x++){
    ctx.beginPath();
    ctx.moveTo(ox + x*CELL + 0.5, oy + 0.5);
    ctx.lineTo(ox + x*CELL + 0.5, oy + GRID_ROWS*CELL + 0.5);
    ctx.stroke();
  }
  for (let y=0;y<=GRID_ROWS;y++){
    ctx.beginPath();
    ctx.moveTo(ox + 0.5, oy + y*CELL + 0.5);
    ctx.lineTo(ox + GRID_COLS*CELL + 0.5, oy + y*CELL + 0.5);
    ctx.stroke();
  }
}

function drawGem(px, py, size, colorIndex) {
  // sprite sheet is 3x3; choose frame via index % 9 to stay in range
  const idx = CELL_SPRITE_MAP[colorIndex % CELL_SPRITE_MAP.length];
  const sx = (idx % 3) * SPRITE_CELL;
  const sy = Math.floor(idx / 3) * SPRITE_CELL;

  // fit with small padding so it looks nice
  const pad = Math.floor(size * 0.08);
  const w = size - pad*2, h = size - pad*2;

  if (images.sprites) {
    ctx.drawImage(images.sprites, sx, sy, SPRITE_CELL, SPRITE_CELL, px+pad, py+pad, w, h);
  } else {
    // fallback: colored squares
    const palette = ["#3bd06a","#ff5a4e","#7a5cff","#4fc3ff","#ff4747","#3dd4d8","#ffc934","#6adb62","#41a1ff"];
    ctx.fillStyle = palette[colorIndex % palette.length];
    ctx.fillRect(px+pad, py+pad, w, h);
  }
}

/* ========== HUD ========== */
function updateHUD() {
  if (el.score) el.score.textContent = pad(Game.score, SCORE_DIGITS);
  if (el.level) el.level.textContent = String(Game.level);
  if (el.best)  el.best.textContent  = pad(Math.max(Game.best, storage.best), SCORE_DIGITS);
}

/* ========== Main loop ========== */
let rafId = 0;
function loop(t) {
  if (!Game.lastTick) Game.lastTick = t;
  const dt = t - Game.lastTick;
  Game.tick(dt);
  drawAll();
  rafId = requestAnimationFrame(loop);
}

/* ========== Boot ========== */
async function boot() {
  if (!ctx) return;

  // Load images + audio (do not block UI; show immediately)
  try {
    const [sprites, badges, ui, bg] = await Promise.all([
      loadImage(ASSETS.images.sprites).catch(()=>null),
      loadImage(ASSETS.images.badges).catch(()=>null),
      loadImage(ASSETS.images.ui).catch(()=>null),
      loadImage(ASSETS.images.bg).catch(()=>null),
    ]);
    images.sprites = sprites;
    images.badges = badges;
    images.ui = ui;
    images.bg = bg;
  } catch {}

  await audio.load();

  // sizing + loop
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);
  bindInputs();
  updateHUD();
  rafId = requestAnimationFrame(loop);
}

document.addEventListener("DOMContentLoaded", boot);
```0
