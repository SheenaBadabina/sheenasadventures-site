/*  Desert Drop — Gem Stack
    BUGS FIXED: Audio loop, hard drop, soft drop, mute
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
  pause:  $('[data-game="pause"]'),
  restart: $('[data-game="restart"]'),
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

/* ========== Audio Manager (FIXED LOOPING) ========== */
class GameAudio {
  constructor() {
    this.sounds = {};
    this.enabled = true;
    this.bgMusic = null;
  }

  async load(key, src) {
    try {
      const audio = new Audio(src);
      audio.preload = "auto";
      
      // FIX: Add loop property for background music
      if (key === "bg") {
        audio.loop = true;
        this.bgMusic = audio;
      }
      
      this.sounds[key] = audio;
      await audio.load();
      console.log(`✅ Loaded: ${key}`);
    } catch (err) {
      console.warn(`⚠️ Could not load ${key}:`, err);
    }
  }

  play(key) {
    if (!this.enabled || !this.sounds[key]) return;
    const audio = this.sounds[key];
    audio.currentTime = 0;
    audio.play().catch(e => console.warn(`Play failed for ${key}:`, e));
  }

  playBg() {
    if (!this.enabled || !this.bgMusic) return;
    this.bgMusic.play().catch(e => console.warn("BG play failed:", e));
  }

  stopBg() {
    if (this.bgMusic) {
      this.bgMusic.pause();
      this.bgMusic.currentTime = 0;
    }
  }

  toggleMute() {
    this.enabled = !this.enabled;
    
    // FIX: Actually mute/unmute the background music
    if (this.bgMusic) {
      if (this.enabled) {
        this.bgMusic.play().catch(() => {});
      } else {
        this.bgMusic.pause();
      }
    }
    
    console.log("Audio enabled:", this.enabled);
    return this.enabled;
  }
}

const audio = new GameAudio();

/* ========== Game State ========== */
const Game = {
  running: false,
  paused: false,
  over: false,
  score: 0,
  level: 1,
  bestScore: parseInt(localStorage.getItem("gemstack_best") || "0", 10),
  lastTime: 0,
  dropTimer: 0,
  dropInterval: 1000,
  grid: [],
  cols: 8,
  rows: 16,
  cellSize: 0,
  activeCol: null,
  nextGems: [],
};

/* ========== Sprite Loading ========== */
const sprites = { loaded: false };

function loadSprites() {
  const img = new Image();
  img.onload = () => {
    sprites.sheet = img;
    sprites.loaded = true;
    console.log("✅ Sprites loaded");
  };
  img.onerror = () => console.error("❌ Failed to load sprites");
  img.src = ASSETS.images.sprites;
}

function drawGem(type, x, y, size) {
  if (!sprites.loaded) return;
  const CELL = 256;
  const col = type % 3;
  const row = Math.floor(type / 3);
  ctx.drawImage(
    sprites.sheet,
    col * CELL, row * CELL, CELL, CELL,
    x, y, size, size
  );
}

/* ========== Grid Functions ========== */
function initGrid() {
  Game.grid = Array(Game.rows).fill(null).map(() => Array(Game.cols).fill(-1));
}

function canPlace(col, gems) {
  for (let i = 0; i < 3; i++) {
    if (Game.grid[i][col] !== -1) return false;
  }
  return true;
}

function placeGems(col, gems) {
  for (let r = 0; r < 3; r++) {
    Game.grid[r][col] = gems[r];
  }
  applyGravity();
  checkMatches();
}

function applyGravity() {
  for (let c = 0; c < Game.cols; c++) {
    let writeRow = Game.rows - 1;
    for (let r = Game.rows - 1; r >= 0; r--) {
      if (Game.grid[r][c] !== -1) {
        if (r !== writeRow) {
          Game.grid[writeRow][c] = Game.grid[r][c];
          Game.grid[r][c] = -1;
        }
        writeRow--;
      }
    }
  }
}

function checkMatches() {
  const matched = new Set();
  
  // Horizontal
  for (let r = 0; r < Game.rows; r++) {
    let count = 1, type = Game.grid[r][0];
    for (let c = 1; c < Game.cols; c++) {
      if (Game.grid[r][c] === type && type !== -1) {
        count++;
      } else {
        if (count >= 3) {
          for (let i = 0; i < count; i++) matched.add(`${r},${c - 1 - i}`);
        }
        count = 1;
        type = Game.grid[r][c];
      }
    }
    if (count >= 3) {
      for (let i = 0; i < count; i++) matched.add(`${r},${Game.cols - 1 - i}`);
    }
  }
  
  // Vertical
  for (let c = 0; c < Game.cols; c++) {
    let count = 1, type = Game.grid[0][c];
    for (let r = 1; r < Game.rows; r++) {
      if (Game.grid[r][c] === type && type !== -1) {
        count++;
      } else {
        if (count >= 3) {
          for (let i = 0; i < count; i++) matched.add(`${r - 1 - i},${c}`);
        }
        count = 1;
        type = Game.grid[r][c];
      }
    }
    if (count >= 3) {
      for (let i = 0; i < count; i++) matched.add(`${Game.rows - 1 - i},${c}`);
    }
  }
  
  if (matched.size > 0) {
    matched.forEach(pos => {
      const [r, c] = pos.split(",").map(Number);
      Game.grid[r][c] = -1;
    });
    Game.score += matched.size * 10;
    audio.play("match");
    setTimeout(() => {
      applyGravity();
      checkMatches();
    }, 200);
  }
}

function spawnColumn() {
  Game.activeCol = {
    x: 3,
    gems: [
      Math.floor(Math.random() * 9),
      Math.floor(Math.random() * 9),
      Math.floor(Math.random() * 9)
    ]
  };
}

/* ========== Input Handlers (FIXED HARD/SOFT DROP) ========== */
function moveLeft() {
  if (Game.activeCol && Game.activeCol.x > 0) {
    Game.activeCol.x--;
  }
}

function moveRight() {
  if (Game.activeCol && Game.activeCol.x < Game.cols - 1) {
    Game.activeCol.x++;
  }
}

function rotateGems() {
  if (Game.activeCol) {
    const temp = Game.activeCol.gems[0];
    Game.activeCol.gems[0] = Game.activeCol.gems[1];
    Game.activeCol.gems[1] = Game.activeCol.gems[2];
    Game.activeCol.gems[2] = temp;
  }
}

// FIX: Soft drop function
function softDrop() {
  if (Game.activeCol && !Game.paused && !Game.over) {
    Game.dropTimer = Game.dropInterval; // Force immediate drop
  }
}

// FIX: Hard drop function
function hardDrop() {
  if (Game.activeCol && !Game.paused && !Game.over) {
    const col = Game.activeCol.x;
    if (canPlace(col, Game.activeCol.gems)) {
      placeGems(col, Game.activeCol.gems);
      spawnColumn();
      Game.dropTimer = 0;
    }
  }
}

/* ========== Game Loop ========== */
function update(time) {
  if (!Game.running) return;
  
  const dt = time - Game.lastTime;
  Game.lastTime = time;
  
  if (!Game.paused && !Game.over && Game.activeCol) {
    Game.dropTimer += dt;
    
    if (Game.dropTimer >= Game.dropInterval) {
      const col = Game.activeCol.x;
      if (canPlace(col, Game.activeCol.gems)) {
        placeGems(col, Game.activeCol.gems);
        spawnColumn();
      } else {
        Game.over = true;
        audio.stopBg();
        audio.play("over");
        updateUI();
      }
      Game.dropTimer = 0;
    }
  }
  
  draw();
  requestAnimationFrame(update);
}

function draw() {
  if (!ctx) return;
  
  // Background
  ctx.fillStyle = "#1a2332";
  ctx.fillRect(0, 0, el.canvas.width, el.canvas.height);
  
  const cellSize = Math.min(
    el.canvas.width / Game.cols,
    el.canvas.height / Game.rows
  );
  Game.cellSize = cellSize;
  
  // Grid
  for (let r = 0; r < Game.rows; r++) {
    for (let c = 0; c < Game.cols; c++) {
      if (Game.grid[r][c] !== -1) {
        drawGem(Game.grid[r][c], c * cellSize, r * cellSize, cellSize);
      }
    }
  }
  
  // Active column
  if (Game.activeCol && !Game.paused && !Game.over) {
    const x = Game.activeCol.x * cellSize;
    for (let i = 0; i < 3; i++) {
      drawGem(Game.activeCol.gems[i], x, i * cellSize, cellSize);
    }
  }
  
  // Pause overlay
  if (Game.paused) {
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(0, 0, el.canvas.width, el.canvas.height);
    ctx.fillStyle = "#fff";
    ctx.font = "48px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("PAUSED", el.canvas.width / 2, el.canvas.height / 2);
  }
  
  // Game over overlay
  if (Game.over) {
    ctx.fillStyle = "rgba(0,0,0,0.8)";
    ctx.fillRect(0, 0, el.canvas.width, el.canvas.height);
    ctx.fillStyle = "#ff4444";
    ctx.font = "48px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER", el.canvas.width / 2, el.canvas.height / 2);
  }
}

/* ========== UI Updates ========== */
function updateUI() {
  if (el.score) el.score.textContent = Game.score.toString().padStart(6, "0");
  if (el.level) el.level.textContent = Game.level;
  if (el.best) el.best.textContent = Game.bestScore.toString().padStart(6, "0");
  
  if (el.play) el.play.style.display = (!Game.running || Game.over) ? "inline-flex" : "none";
  if (el.pause) el.pause.style.display = (Game.running && !Game.over) ? "inline-flex" : "none";
  if (el.restart) el.restart.style.display = (Game.running || Game.over) ? "inline-flex" : "none";
}

function startGame() {
  Game.running = true;
  Game.paused = false;
  Game.over = false;
  Game.score = 0;
  Game.level = 1;
  Game.dropTimer = 0;
  
  initGrid();
  spawnColumn();
  updateUI();
  
  audio.playBg();
  Game.lastTime = performance.now();
  requestAnimationFrame(update);
}

function togglePause() {
  if (!Game.running || Game.over) return;
  Game.paused = !Game.paused;
  if (el.pause) el.pause.textContent = Game.paused ? "▶️ Resume" : "⏸️ Pause";
}

function restartGame() {
  if (Game.score > Game.bestScore) {
    Game.bestScore = Game.score;
    localStorage.setItem("gemstack_best", Game.bestScore.toString());
  }
  startGame();
}

/* ========== Event Listeners (FIXED) ========== */
if (el.play) {
  el.play.addEventListener("click", startGame);
}

if (el.pause) {
  el.pause.addEventListener("click", togglePause);
}

if (el.restart) {
  el.restart.addEventListener("click", restartGame);
}

// FIX: Mute button with proper state update
if (el.mute) {
  el.mute.addEventListener("click", () => {
    const enabled = audio.toggleMute();
    el.mute.textContent = enabled ? "🔇 Mute" : "🔊 Unmute";
  });
}

// FIX: Touch controls with proper functions
if (el.left) el.left.addEventListener("click", moveLeft);
if (el.right) el.right.addEventListener("click", moveRight);
if (el.rotate) el.rotate.addEventListener("click", rotateGems);
if (el.down) el.down.addEventListener("click", softDrop); // FIXED
if (el.drop) el.drop.addEventListener("click", hardDrop); // FIXED

// Keyboard
document.addEventListener("keydown", (e) => {
  if (!Game.running || Game.paused || Game.over) return;
  
  switch(e.key) {
    case "ArrowLeft": moveLeft(); break;
    case "ArrowRight": moveRight(); break;
    case "ArrowUp": rotateGems(); break;
    case "ArrowDown": softDrop(); break;
    case " ": e.preventDefault(); hardDrop(); break;
    case "p": case "P": togglePause(); break;
    case "m": case "M": audio.toggleMute(); break;
  }
});

/* ========== Initialization ========== */
async function init() {
  console.log("🎮 Initializing Gem Stack...");
  
  // Load sprites
  loadSprites();
  
  // Load audio
  for (const [key, src] of Object.entries(ASSETS.audio)) {
    await audio.load(key, src);
  }
  
  // Canvas sizing
  if (el.canvas) {
    function resize() {
      const rect = el.canvas.getBoundingClientRect();
      el.canvas.width = rect.width;
      el.canvas.height = rect.height;
    }
    resize();
    window.addEventListener("resize", resize);
  }
  
  updateUI();
  console.log("✅ Ready to play!");
}

init();
