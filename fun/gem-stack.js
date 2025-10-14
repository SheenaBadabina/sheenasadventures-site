/*  Desert Drop — Gem Stack
    FINAL PRODUCTION BUILD
    ----------------------------------------------------- */

console.log("🎮 Game Loading...");

/* ========== Assets ========== */
const ASSETS = {
  images: {
    sprites: "/assets/gem-sprites.png",
    bg: "/assets/background-sky-canyon.png"
  },
  audio: {
    bg: "/assets/background-loop.mp3",
    match: "/assets/gem-match.mp3",
    line: "/assets/line-clear.mp3",
    lvl: "/assets/level-up.mp3",
    over: "/assets/game-over.mp3"
  }
};

/* ========== DOM ========== */
const canvas = document.getElementById('gameCanvas');
const ctx = canvas ? canvas.getContext('2d') : null;
const playBtn = document.getElementById('playBtn');
const pauseBtn = document.getElementById('pauseBtn');
const restartBtn = document.getElementById('restartBtn');
const muteBtn = document.getElementById('muteBtn');
const scoreEl = document.querySelector('[data-ui="score"]');
const levelEl = document.querySelector('[data-ui="level"]');
const bestEl = document.querySelector('[data-ui="best"]');
const controls = {
  left: document.querySelector('[data-control="left"]'),
  right: document.querySelector('[data-control="right"]'),
  down: document.querySelector('[data-control="down"]'),
  drop: document.querySelector('[data-control="drop"]'),
  rotate: document.querySelector('[data-control="rotate"]')
};

/* ========== Constants ========== */
const GRID_COLS = 8;
const GRID_ROWS = 16;
const COLORS = 6;
const MAX_COLORS = 9;
const SPRITE_SIZE = 1024;
const SPRITE_CELL = SPRITE_SIZE / 3;
const FALL_SPEED = 0.7;
const FAST_MULT = 0.15;

/* ========== Helpers ========== */
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const rand = (n) => (Math.random() * n) | 0;
const randf = (min, max) => Math.random() * (max - min) + min;
const pad = (n, d = 6) => String(n).padStart(d, "0");
const now = () => performance.now();

/* ========== Storage ========== */
const storage = {
  get best() { return +(localStorage.getItem("gem:best") || 0); },
  set best(v) { localStorage.setItem("gem:best", String(v)); }
};

/* ========== Audio ========== */
class Audio {
  constructor() {
    this.enabled = true;
    this.sounds = {};
  }
  async load() {
    for (const [key, src] of Object.entries(ASSETS.audio)) {
      try {
        const a = new window.Audio();
        a.src = src;
        a.preload = "auto";
        this.sounds[key] = a;
      } catch (e) {
        console.warn(`Audio load failed: ${key}`);
      }
    }
  }
  play(name) {
    if (!this.enabled || !this.sounds[name]) return;
    try {
      this.sounds[name].currentTime = 0;
      this.sounds[name].play();
    } catch {}
  }
  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }
}

const audio = new Audio();

/* ========== Images ========== */
const images = {};
async function loadImages() {
  for (const [key, src] of Object.entries(ASSETS.images)) {
    try {
      const img = new Image();
      img.src = src;
      await new Promise((res, rej) => {
        img.onload = res;
        img.onerror = rej;
      });
      images[key] = img;
      console.log(`✅ Loaded: ${key}`);
    } catch {
      console.warn(`⚠️ Failed: ${key}`);
    }
  }
}

/* ========== Particles ========== */
class Particle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = randf(-2, 2);
    this.vy = randf(-4, -1);
    this.life = 1;
    this.decay = randf(0.015, 0.025);
    this.size = randf(2, 5);
    this.color = `hsl(${randf(40, 60)}, 100%, ${randf(60, 80)}%)`;
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

/* ========== Grid ========== */
class Grid {
  constructor(cols, rows) {
    this.cols = cols;
    this.rows = rows;
    this.cells = Array(rows).fill().map(() => Array(cols).fill(-1));
  }
  get(x, y) {
    return x >= 0 && x < this.cols && y >= 0 && y < this.rows ? this.cells[y][x] : -2;
  }
  set(x, y, v) {
    if (x >= 0 && x < this.cols && y >= 0 && y < this.rows) this.cells[y][x] = v;
  }
  collapse() {
    for (let x = 0; x < this.cols; x++) {
      let write = this.rows - 1;
      for (let y = this.rows - 1; y >= 0; y--) {
        if (this.cells[y][x] >= 0) {
          if (y !== write) {
            this.cells[write][x] = this.cells[y][x];
            this.cells[y][x] = -1;
          }
          write--;
        }
      }
    }
  }
  findMatches() {
    const matches = new Set();
    const dirs = [[1, 0], [0, 1], [1, 1], [1, -1]];
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        const c = this.get(x, y);
        if (c < 0) continue;
        for (const [dx, dy] of dirs) {
          let k = 1;
          while (this.get(x + k * dx, y + k * dy) === c) k++;
          if (k >= 3) {
            for (let t = 0; t < k; t++) matches.add(`${x + t * dx},${y + t * dy}`);
          }
        }
      }
    }
    return matches;
  }
}

/* ========== Falling Piece ========== */
class FallingPiece {
  constructor(colors, cols) {
    this.gems = [rand(colors), rand(colors), rand(colors)];
    this.x = Math.floor(cols / 2);
    this.y = -2;
    this.horizontal = false; // NEW: orientation toggle
  }
  rotate() {
    const [a, b, c] = this.gems;
    this.gems = [c, a, b];
  }
  toggleOrientation() {
    this.horizontal = !this.horizontal;
  }
  move(dx, grid) {
    const nx = clamp(this.x + dx, 0, grid.cols - 1);
    if (this.horizontal) {
      // Horizontal: check 3 cells in a row
      for (let i = 0; i < 3; i++) {
        if (this.y >= 0 && grid.get(nx + i, this.y) !== -1) return;
      }
    } else {
      // Vertical: check 3 cells in a column
      for (let i = 0; i < 3; i++) {
        if (this.y + i >= 0 && grid.get(nx, this.y + i) !== -1) return;
      }
    }
    this.x = nx;
  }
  canFall(grid) {
    if (this.horizontal) {
      // Check if all 3 horizontal gems can fall
      for (let i = 0; i < 3; i++) {
        const x = this.x + i;
        const y = this.y + 1;
        if (x >= grid.cols || y >= grid.rows || (y >= 0 && grid.get(x, y) !== -1)) return false;
      }
    } else {
      // Check if bottom gem can fall
      const y = this.y + 3;
      if (y >= grid.rows || (y >= 0 && grid.get(this.x, y) !== -1)) return false;
    }
    return true;
  }
  lock(grid) {
    if (this.horizontal) {
      for (let i = 0; i < 3; i++) {
        if (this.y >= 0) grid.set(this.x + i, this.y, this.gems[i]);
      }
    } else {
      for (let i = 0; i < 3; i++) {
        if (this.y + i >= 0) grid.set(this.x, this.y + i, this.gems[i]);
      }
    }
  }
}

/* ========== Game ========== */
const Game = {
  running: false,
  paused: false,
  over: false,
  grid: new Grid(GRID_COLS, GRID_ROWS),
  piece: null,
  lastTick: 0,
  fallDelay: FALL_SPEED,
  fastDrop: false,
  score: 0,
  best: storage.best,
  level: 1,
  clears: 0,
  colors: COLORS,
  
  reset() {
    this.running = true;
    this.paused = false;
    this.over = false;
    this.grid = new Grid(GRID_COLS, GRID_ROWS);
    this.piece = new FallingPiece(this.colors, GRID_COLS);
    this.lastTick = now();
    this.score = 0;
    this.level = 1;
    this.clears = 0;
    this.colors = COLORS;
    particles.length = 0;
    updateUI();
    updateButtons();
  },
  
  tick(dt) {
    if (!this.running || this.over || this.paused) return;
    
    const speed = this.fallDelay * 1000 * (this.fastDrop ? FAST_MULT : 1);
    if (dt >= speed) {
      if (this.piece.canFall(this.grid)) {
        this.piece.y++;
      } else {
        this.piece.lock(this.grid);
        if (this.piece.y < 0) {
          this.gameOver();
          return;
        }
        
        // Check matches
        const matches = this.grid.findMatches();
        if (matches.size > 0) {
          matches.forEach(key => {
            const [x, y] = key.split(',').map(Number);
            this.grid.set(x, y, -1);
            // Spawn particles
            const px = ox + x * CELL + CELL / 2;
            const py = oy + y * CELL + CELL / 2;
            for (let i = 0; i < 6; i++) particles.push(new Particle(px, py));
          });
          this.grid.collapse();
          this.score += 100 * matches.size;
          this.clears++;
          if (this.clears >= 10) {
            this.level++;
            this.clears = 0;
            this.fallDelay *= 0.9;
            this.colors = Math.min(this.colors + 1, MAX_COLORS);
            audio.play('lvl');
          }
          audio.play('match');
          updateUI();
        }
        
        this.piece = new FallingPiece(this.colors, GRID_COLS);
      }
      this.lastTick = now();
    }
  },
  
  gameOver() {
    this.over = true;
    this.running = false;
    if (this.score > this.best) {
      this.best = this.score;
      storage.best = this.best;
    }
    audio.play('over');
    updateUI();
    updateButtons();
  },
  
  togglePause() {
    if (!this.running || this.over) return;
    this.paused = !this.paused;
    pauseBtn.textContent = this.paused ? '▶️ Resume' : '⏸️ Pause';
  }
};

/* ========== Rendering ========== */
let CANVAS_W = 640, CANVAS_H = 960, CELL = 40;
let ox = 0, oy = 0;

function resize() {
  if (!canvas) return;
  const maxW = window.innerWidth;
  const maxH = window.innerHeight * 0.7;
  CANVAS_W = Math.min(maxW, 600);
  CANVAS_H = Math.min(maxH, 900);
  canvas.width = CANVAS_W;
  canvas.height = CANVAS_H;
  CELL = Math.floor(Math.min(CANVAS_W / GRID_COLS, CANVAS_H / GRID_ROWS));
  ox = Math.floor((CANVAS_W - CELL * GRID_COLS) / 2);
  oy = Math.floor((CANVAS_H - CELL * GRID_ROWS) / 2);
}

function draw() {
  if (!ctx) return;
  
  // Background
  if (images.bg) {
    const s = Math.max(CANVAS_W / images.bg.width, CANVAS_H / images.bg.height);
    ctx.drawImage(images.bg, 0, 0, images.bg.width * s, images.bg.height * s);
  } else {
    ctx.fillStyle = '#1a2332';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  }
  
  // Board background
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(ox, oy, CELL * GRID_COLS, CELL * GRID_ROWS);
  
  // Grid
  for (let y = 0; y < GRID_ROWS; y++) {
    for (let x = 0; x < GRID_COLS; x++) {
      const c = Game.grid.get(x, y);
      if (c >= 0) drawGem(ox + x * CELL, oy + y * CELL, CELL, c);
    }
  }
  
  // Falling piece
  if (Game.piece && Game.running && !Game.over) {
    if (Game.piece.horizontal) {
      for (let i = 0; i < 3; i++) {
        const x = Game.piece.x + i;
        const y = Game.piece.y;
        if (y >= 0 && x < GRID_COLS) drawGem(ox + x * CELL, oy + y * CELL, CELL, Game.piece.gems[i]);
      }
    } else {
      for (let i = 0; i < 3; i++) {
        const y = Game.piece.y + i;
        if (y >= 0) drawGem(ox + Game.piece.x * CELL, oy + y * CELL, CELL, Game.piece.gems[i]);
      }
    }
  }
  
  // Particles
  for (let i = particles.length - 1; i >= 0; i--) {
    if (!particles[i].update()) {
      particles.splice(i, 1);
    } else {
      particles[i].draw(ctx);
    }
  }
  
  // Paused overlay
  if (Game.paused) {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', CANVAS_W / 2, CANVAS_H / 2);
  }
}

function drawGem(px, py, size, colorIdx) {
  const pad = Math.floor(size * 0.1);
  const w = size - pad * 2;
  const h = size - pad * 2;
  
  if (images.sprites) {
    const idx = colorIdx % 9;
    const sx = (idx % 3) * SPRITE_CELL;
    const sy = Math.floor(idx / 3) * SPRITE_CELL;
    ctx.drawImage(images.sprites, sx, sy, SPRITE_CELL, SPRITE_CELL, px + pad, py + pad, w, h);
  } else {
    const colors = ['#3bd06a', '#ff5a4e', '#7a5cff', '#4fc3ff', '#ff4747', '#3dd4d8', '#ffc934', '#6adb62', '#41a1ff'];
    ctx.fillStyle = colors[colorIdx % colors.length];
    ctx.fillRect(px + pad, py + pad, w, h);
  }
}

/* ========== UI ========== */
function updateUI() {
  if (scoreEl) scoreEl.textContent = pad(Game.score);
  if (levelEl) levelEl.textContent = String(Game.level);
  if (bestEl) bestEl.textContent = pad(Math.max(Game.best, storage.best));
}

function updateButtons() {
  if (playBtn) playBtn.style.display = (!Game.running || Game.over) ? 'inline-flex' : 'none';
  if (pauseBtn) pauseBtn.style.display = (Game.running && !Game.over) ? 'inline-flex' : 'none';
  if (restartBtn) restartBtn.style.display = (Game.running || Game.over) ? 'inline-flex' : 'none';
  document.body.classList.toggle('playing', Game.running && !Game.over);
}

/* ========== Input ========== */
function bindInput() {
  if (playBtn) playBtn.onclick = () => {
    audio.play('bg');
    Game.reset();
  };
  if (pauseBtn) pauseBtn.onclick = () => Game.togglePause();
  if (restartBtn) restartBtn.onclick = () => Game.reset();
  if (muteBtn) {
    muteBtn.onclick = () => {
      const on = audio.toggle();
      muteBtn.textContent = on ? '🔇 Mute' : '🔊 Unmute';
    };
    muteBtn.textContent = '🔇 Mute';
  }
  
  if (controls.left) controls.left.onclick = () => Game.piece && Game.piece.move(-1, Game.grid);
  if (controls.right) controls.right.onclick = () => Game.piece && Game.piece.move(1, Game.grid);
  if (controls.rotate) controls.rotate.onclick = () => {
    if (Game.piece) {
      // Toggle between rotate gems and flip orientation
      if (Math.random() > 0.5) Game.piece.rotate();
      else Game.piece.toggleOrientation();
    }
  };
  if (controls.down) {
    controls.down.onmousedown = () => Game.fastDrop = true;
    controls.down.onmouseup = () => Game.fastDrop = false;
    controls.down.ontouchstart = (e) => { e.preventDefault(); Game.fastDrop = true; };
    controls.down.ontouchend = (e) => { e.preventDefault(); Game.fastDrop = false; };
  }
  
  window.addEventListener('keydown', (e) => {
    if (!Game.running || Game.over || Game.paused) return;
    if (e.key === 'ArrowLeft') Game.piece && Game.piece.move(-1, Game.grid);
    if (e.key === 'ArrowRight') Game.piece && Game.piece.move(1, Game.grid);
    if (e.key === 'ArrowUp') Game.piece && Game.piece.rotate();
    if (e.key === 'ArrowDown') Game.fastDrop = true;
    if (e.key === ' ') { e.preventDefault(); Game.piece && Game.piece.toggleOrientation(); }
  });
  
  window.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowDown') Game.fastDrop = false;
    if (e.key === 'p' || e.key === 'P') Game.togglePause();
  });
}

/* ========== Loop ========== */
function loop(t) {
  if (!Game.lastTick) Game.lastTick = t;
  Game.tick(t - Game.lastTick);
  draw();
  requestAnimationFrame(loop);
}

/* ========== Init ========== */
async function init() {
  console.log("🚀 Initializing...");
  await loadImages();
  await audio.load();
  resize();
  window.addEventListener('resize', resize);
  bindInput();
  updateUI();
  updateButtons();
  requestAnimationFrame(loop);
  console.log("✅ Game ready!");
}

window.addEventListener('load', init);
