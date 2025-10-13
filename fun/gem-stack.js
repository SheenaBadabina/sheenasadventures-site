/*  Desert Drop — Gem Stack
    POLISHED Production Build with Juice Effects
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
  play:   $('[data-game="play"]'),
  mute:   $('[data-audio="mute"]'),
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
    this.vy += 0.15; // gravity
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

/* ========== Flash effect for matching gems ========== */
const flashCells = new Set();
let flashTimer = 0;
const FLASH_DURATION = 0.1; // seconds

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
  // Ghost preview: find where this column will land
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
  flashingCells: null, // Stores cells to clear after flash
  flashTime: 0,
  chainCount: 0,

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
    this.flashingCells = null;
    this.flashTime = 0;
    particles.length = 0;
    flashCells.clear();
    flashTimer = 0;
    chainDisplay.active = false;
    shakeAmount = 0;
    drawAll();
    updateHUD();
  },

  tick(dt) {
    if (!this.running || this.over) return;

    // Handle flash timing
    if (this.flashingCells) {
      flashTimer += dt / 1000;
      if (flashTimer >= FLASH_DURATION) {
        // Clear the flashing cells
        this.flashingCells.forEach(key => {
          const [x, y] = key.split(",").map(Number);
          this.grid.set(x, y, -1);
          flashCells.delete(key);
        });
        this.grid.collapse();
        
        // Check for new matches (cascade)
        const nextMatches = this.grid.findMatches();
        if (nextMatches.size > 0) {
          // Cascade detected - show chain!
          if (!this.chainCount) this.chainCount = 1;
          this.chainCount++;
          showChain(this.chainCount);
          
          // Set up next flash
          this.flashingCells = nextMatches;
          flashTimer = 0;
          nextMatches.forEach(key => {
            flashCells.add(key);
            const [x, y] = key.split(",").map(Number);
            const ox = ((CANVAS_W - CELL * GRID_COLS) / 2) | 0;
            const oy = ((CANVAS_H - CELL * GRID_ROWS) / 2) | 0;
            spawnParticles(ox + x * CELL + CELL / 2, oy + y * CELL + CELL / 2, 6);
          });
          // Update score for cascade
          const cleared = nextMatches.size;
          const extra = Math.max(0, cleared - 3);
          this.score += MATCH_BASE + extra * MATCH_EXTRA;
          this.score += Math.floor(this.score * 0.10); // Chain bonus
          audio.play(cleared >= 4 ? "line" : "match");
          updateHUD();
        } else {
          // No more matches, spawn next piece
          this.flashingCells = null;
          this.chainCount = 0;
          flashTimer = 0;
          this.current = new FallingColumn(this.colorsAvail, this.grid.cols);
        }
        return;
      }
      return; // Don't fall while flashing
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
        
        // Check for matches
        const toClear = this.grid.findMatches();
        if (toClear.size > 0) {
          // Start flash
          this.flashingCells = toClear;
          this.chainCount = 0; // Reset chain counter
          flashTimer = 0;
          
          // Flash effect and particles
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
          // No matches, spawn next piece immediately
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
    shake(20); // Big shake on game over
    audio.play("over");
    audio.stopAll();
    if (this.score > this.best) {
      this.best = this.score;
      storage.best = this.best;
    }
    updateHUD();
    audio.play("pop");
  }
};

/* ========== Input ========== */
function bindInputs() {
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
  el.left  && el.left.addEventListener("click",  () => tryMove(-1));
  el.right && el.right.addEventListener("click", () => tryMove(1));
  el.down  && el.down.addEventListener("mousedown", () => Game.softDrop = true);
  el.down  && el.down.addEventListener("mouseup",   () => Game.softDrop = false);
  el.down  && el.down.addEventListener("touchstart", () => Game.softDrop = true);
  el.down  && el.down.addEventListener("touchend",   () => Game.softDrop = false);
  el.rotate&& el.rotate.addEventListener("click", () => tryRotate());
  el.drop  && el.drop.addEventListener("click",   () => hardDrop());

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
  const test = [...Game.current.order];
  Game.current.rotate();
  for (let i = 0; i < 3; i++) {
    const y = Game.current.y + i;
    const x = Game.current.x;
    if (y >= 0 && Game.grid.get(x, y) !== -1) {
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
  if (cells > 0) Game.score += HARD_DROP_BONUS * cells;
  updateHUD();
}

/* ========== Rendering ========== */
let CANVAS_W = 640, CANVAS_H = 960, CELL;

function resizeCanvas() {
  if (!el.canvas) return;
  const maxW = el.canvas.clientWidth || window.innerWidth;
  const maxH = el.canvas.clientHeight || window.innerHeight * 0.6;
  const targetW = Math.min(maxW, 720);
  const targetH = Math.min(maxH, Math.floor(targetW * 1.5));
  el.canvas.width = CANVAS_W = targetW | 0;
  el.canvas.height = CANVAS_H = targetH | 0;
  CELL = Math.floor(Math.min(CANVAS_W / GRID_COLS, CANVAS_H / GRID_ROWS));
  drawAll();
}

function drawAll() {
  if (!ctx) return;

  ctx.save();
  
  // Apply shake
  if (shakeAmount > 0) {
    ctx.translate(
      rand(-shakeAmount, shakeAmount),
      rand(-shakeAmount, shakeAmount)
    );
    shakeAmount *= shakeDecay;
    if (shakeAmount < 0.1) shakeAmount = 0;
  }

  // Background
  if (images.bg) {
    const iw = images.bg.width, ih = images.bg.height;
    const s = Math.max(CANVAS_W / iw, CANVAS_H / ih);
    const sw = iw * s, sh = ih * s;
    ctx.drawImage(images.bg, (CANVAS_W - sw) / 2, (CANVAS_H - sh) / 2, sw, sh);
  } else {
    ctx.fillStyle = "#0F1419";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  }

  // Board
  const ox = ((CANVAS_W - CELL * GRID_COLS) / 2) | 0;
  const oy = ((CANVAS_H - CELL * GRID_ROWS) / 2) | 0;

  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.fillRect(ox, oy, CELL * GRID_COLS, CELL * GRID_ROWS);

  // Ghost preview
  if (Game.current && Game.running && !Game.over) {
    const ghostY = Game.current.getGhostY(Game.grid);
    if (ghostY !== Game.current.y) {
      ctx.globalAlpha = 0.2;
      for (let i = 0; i < 3; i++) {
        const y = ghostY + i;
        if (y < 0) continue;
        drawGem(ox + Game.current.x * CELL, oy + y * CELL, CELL, Game.current.order[i]);
      }
      ctx.globalAlpha = 1.0;
    }
  }

  // Placed gems
  for (let y = 0; y < GRID_ROWS; y++) {
    for (let x = 0; x < GRID_COLS; x++) {
      const c = Game.grid.get(x, y);
      if (c >= 0) {
        const key = `${x},${y}`;
        if (flashCells.has(key)) {
          // Flash white
          ctx.save();
          ctx.globalAlpha = 0.8;
          ctx.fillStyle = "white";
          ctx.fillRect(ox + x * CELL, oy + y * CELL, CELL, CELL);
          ctx.restore();
        } else {
          drawGem(ox + x * CELL, oy + y * CELL, CELL, c);
        }
      }
    }
  }

  // Falling column
  if (Game.current && Game.running && !Game.over) {
    for (let i = 0; i < 3; i++) {
      const y = Game.current.y + i;
      if (y < 0) continue;
      drawGem(ox + Game.current.x * CELL, oy + y * CELL, CELL, Game.current.order[i]);
    }
  }

  // Grid lines
  ctx.strokeStyle = "rgba(255,255,255,0.04)";
  ctx.lineWidth = 1;
  for (let x = 0; x <= GRID_COLS; x++) {
    ctx.beginPath();
    ctx.moveTo(ox + x * CELL + 0.5, oy + 0.5);
    ctx.lineTo(ox + x * CELL + 0.5, oy + GRID_ROWS * CELL + 0.5);
    ctx.stroke();
  }
  for (let y = 0; y <= GRID_ROWS; y++) {
    ctx.beginPath();
    ctx.moveTo(ox + 0.5, oy + y * CELL + 0.5);
    ctx.lineTo(ox + GRID_COLS * CELL + 0.5, oy + y * CELL + 0.5);
    ctx.stroke();
  }

  ctx.restore();

  // Particles (drawn after restore so shake doesn't affect them)
  for (let i = particles.length - 1; i >= 0; i--) {
    if (!particles[i].update()) {
      particles.splice(i, 1);
    } else {
      particles[i].draw(ctx);
    }
  }

  // Chain display
  if (chainDisplay.active) {
    chainDisplay.time += 0.016; // ~60fps
    const progress = chainDisplay.time / chainDisplay.maxTime;
    if (progress >= 1) {
      chainDisplay.active = false;
    } else {
      ctx.save();
      ctx.globalAlpha = 1 - progress;
      ctx.fillStyle = "#FFD700";
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 3;
      ctx.font = "bold 32px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const y = CANVAS_H * 0.3 - progress * 30;
      ctx.strokeText(chainDisplay.text, CANVAS_W / 2, y);
      ctx.fillText(chainDisplay.text, CANVAS_W / 2, y);
      ctx.restore();
    }
  }
}

function drawGem(px, py, size, colorIndex) {
  const idx = CELL_SPRITE_MAP[colorIndex % CELL_SPRITE_MAP.length];
  const sx = (idx % 3) * SPRITE_CELL;
  const sy = Math.floor(idx / 3) * SPRITE_CELL;

  const pad = Math.floor(size * 0.08);
  const w = size - pad * 2, h = size - pad * 2;

  if (images.sprites) {
    ctx.drawImage(images.sprites, sx, sy, SPRITE_CELL, SPRITE_CELL, px + pad, py + pad, w, h);
  } else {
    const palette = ["#3bd06a", "#ff5a4e", "#7a5cff", "#4fc3ff", "#ff4747", "#3dd4d8", "#ffc934", "#6adb62", "#41a1ff"];
    ctx.fillStyle = palette[colorIndex % palette.length];
    ctx.fillRect(px + pad, py + pad, w, h);
  }
}

/* ========== HUD ========== */
function updateHUD() {
  if (el.score) el.score.textContent = pad(Game.score, SCORE_DIGITS);
  if (el.level) el.level.textContent = String(Game.level);
  if (el.best) el.best.textContent = pad(Math.max(Game.best, storage.best), SCORE_DIGITS);
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

  try {
    const [sprites, badges, ui, bg] = await Promise.all([
      loadImage(ASSETS.images.sprites).catch(() => null),
      loadImage(ASSETS.images.badges).catch(() => null),
      loadImage(ASSETS.images.ui).catch(() => null),
      loadImage(ASSETS.images.bg).catch(() => null),
    ]);
    images.sprites = sprites;
    images.badges = badges;
    images.ui = ui;
    images.bg = bg;
  } catch { }

  await audio.load();

  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);
  bindInputs();
  updateHUD();
  rafId = requestAnimationFrame(loop);
}

document.addEventListener("DOMContentLoaded", boot);
