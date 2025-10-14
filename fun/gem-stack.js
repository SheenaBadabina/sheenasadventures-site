/*  Desert Drop — Gem Stack - FINAL WORKING VERSION
    All bugs fixed: Audio loop, drop buttons, mute, background display
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

const dom = {
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
  toggleRotation: $('[data-control="toggle-rotation"]')
};

const ctx = dom.canvas ? dom.canvas.getContext("2d") : null;

/* ========== Constants ========== */
const COLS = 9;  // Changed to 9 for true center
const ROWS = 15;
const SPRITE_SIZE = 1024 / 3;  // 341.33px per gem
const GEM_TYPES = 9;

/* ========== Game State ========== */
const Game = {
  grid: [],
  column: null,
  colX: 0,
  running: false,
  paused: false,
  score: 0,
  level: 1,
  best: 0,
  dropTimer: 0,
  dropInterval: 2000,
  lastTime: 0,
  rotationMode: 'vertical'  // 'vertical' or 'horizontal'
};

/* ========== Images ========== */
const images = {
  sprites: null,
  badges: null,
  ui: null,
  bg: null
};

function loadSprites() {
  console.log("Loading sprites...");
  
  images.sprites = new Image();
  images.sprites.src = ASSETS.images.sprites;
  images.sprites.onload = () => {
    console.log("✅ Gem sprites loaded");
    draw();
  };
  
  images.bg = new Image();
  images.bg.src = ASSETS.images.bg;
  images.bg.onload = () => {
    console.log("✅ Background loaded");
    draw();
  };
  
  images.badges = new Image();
  images.badges.src = ASSETS.images.badges;
  images.badges.onload = () => console.log("✅ Badges loaded");
  
  images.ui = new Image();
  images.ui.src = ASSETS.images.ui;
  images.ui.onload = () => console.log("✅ UI icons loaded");
}

/* ========== Audio Manager ========== */
const audio = {
  sounds: {},
  muted: false,
  
  async load(key, src) {
    const sound = new Audio(src);
    sound.preload = "auto";
    
    // CRITICAL: Set loop for background music
    if (key === "bg") {
      sound.loop = true;
    }
    
    this.sounds[key] = sound;
  },
  
  play(key) {
    if (this.muted || !this.sounds[key]) return;
    const sound = this.sounds[key];
    sound.currentTime = 0;
    sound.play().catch(e => console.log("Audio play failed:", e));
  },
  
  toggleMute() {
    this.muted = !this.muted;
    
    // Pause or resume background music
    if (this.sounds.bg) {
      if (this.muted) {
        this.sounds.bg.pause();
      } else if (Game.running && !Game.paused) {
        this.sounds.bg.play().catch(e => console.log("BG play failed:", e));
      }
    }
    
    return !this.muted;
  }
};

/* ========== Grid Functions ========== */
function initGrid() {
  Game.grid = Array(ROWS).fill(null).map(() => Array(COLS).fill(0));
}

function spawnColumn() {
  Game.column = [
    Math.floor(Math.random() * GEM_TYPES) + 1,
    Math.floor(Math.random() * GEM_TYPES) + 1,
    Math.floor(Math.random() * GEM_TYPES) + 1
  ];
  Game.colX = 4;  // True center of 9 columns (0-8)
  console.log("Spawned at column:", Game.colX, "of", COLS);
}

function canPlace(col) {
  if (col < 0 || col >= COLS) return false;
  return Game.grid[0][col] === 0 && Game.grid[1][col] === 0 && Game.grid[2][col] === 0;
}

function placeColumn() {
  if (!Game.column) return;
  
  for (let i = 0; i < 3; i++) {
    Game.grid[i][Game.colX] = Game.column[i];
  }
  
  applyGravity();
  checkMatches();
  
  Game.column = null;
  Game.dropTimer = 0;
  
  if (canPlace(3)) {
    spawnColumn();
  } else {
    gameOver();
  }
}

function applyGravity() {
  for (let c = 0; c < COLS; c++) {
    let writeRow = ROWS - 1;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (Game.grid[r][c] !== 0) {
        Game.grid[writeRow][c] = Game.grid[r][c];
        if (writeRow !== r) Game.grid[r][c] = 0;
        writeRow--;
      }
    }
  }
}

function checkMatches() {
  const matched = new Set();
  
  // Check horizontal
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c <= COLS - 3; c++) {
      const gem = Game.grid[r][c];
      if (gem === 0) continue;
      
      let count = 1;
      while (c + count < COLS && Game.grid[r][c + count] === gem) count++;
      
      if (count >= 3) {
        for (let i = 0; i < count; i++) {
          matched.add(`${r},${c + i}`);
        }
      }
    }
  }
  
  // Check vertical
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r <= ROWS - 3; r++) {
      const gem = Game.grid[r][c];
      if (gem === 0) continue;
      
      let count = 1;
      while (r + count < ROWS && Game.grid[r + count][c] === gem) count++;
      
      if (count >= 3) {
        for (let i = 0; i < count; i++) {
          matched.add(`${r + i},${c}`);
        }
      }
    }
  }
  
  // Clear matches
  if (matched.size > 0) {
    matched.forEach(key => {
      const [r, c] = key.split(',').map(Number);
      Game.grid[r][c] = 0;
    });
    
    Game.score += matched.size * 100;
    updateUI();
    audio.play("match");
    
    setTimeout(() => {
      applyGravity();
      checkMatches();
    }, 200);
  }
}

/* ========== Controls ========== */
function moveLeft() {
  if (!Game.column || Game.paused) return;
  if (Game.colX > 0) Game.colX--;
  draw();
}

function moveRight() {
  if (!Game.column || Game.paused) return;
  if (Game.colX < COLS - 1) Game.colX++;
  draw();
}

function rotateColumn() {
  if (!Game.column || Game.paused) return;
  
  if (Game.rotationMode === 'vertical') {
    // Rotate within the column (shift gems up/down)
    Game.column.unshift(Game.column.pop());
  } else {
    // Horizontal mode - swap positions in a different pattern
    const temp = Game.column[0];
    Game.column[0] = Game.column[2];
    Game.column[2] = temp;
  }
  
  draw();
}

function toggleRotationMode() {
  Game.rotationMode = Game.rotationMode === 'vertical' ? 'horizontal' : 'vertical';
  
  // Update button text
  if (dom.toggleRotation) {
    dom.toggleRotation.textContent = Game.rotationMode === 'vertical' ? '↕️ Vert' : '↔️ Horiz';
  }
  
  console.log("🔄 Rotation mode:", Game.rotationMode);
}

function softDrop() {
  if (!Game.column || Game.paused) return;
  placeColumn();
}

function hardDrop() {
  if (!Game.column || Game.paused) return;
  placeColumn();
}

/* ========== Game Loop ========== */
function update(timestamp) {
  if (!Game.running || Game.paused) return;
  
  const delta = timestamp - Game.lastTime;
  Game.lastTime = timestamp;
  
  Game.dropTimer += delta;
  
  if (Game.dropTimer >= Game.dropInterval && Game.column) {
    placeColumn();
  }
  
  draw();
  requestAnimationFrame(update);
}

/* ========== Rendering ========== */
function draw() {
  if (!ctx || !dom.canvas) return;
  
  const cw = dom.canvas.width;
  const ch = dom.canvas.height;
  
  // Draw background
  if (images.bg && images.bg.complete) {
    ctx.drawImage(images.bg, 0, 0, cw, ch);
  } else {
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, cw, ch);
  }
  
  // Calculate cell size
  const gridWidth = cw * 0.8;
  const cellSize = gridWidth / COLS;
  const gridHeight = cellSize * ROWS;
  const offsetX = (cw - gridWidth) / 2;
  const offsetY = (ch - gridHeight) / 2;
  
  // Draw grid
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const x = offsetX + c * cellSize;
      const y = offsetY + r * cellSize;
      
      const gem = Game.grid[r][c];
      
      if (gem > 0 && images.sprites && images.sprites.complete) {
        const gemIndex = gem - 1;
        const sx = (gemIndex % 3) * SPRITE_SIZE;
        const sy = Math.floor(gemIndex / 3) * SPRITE_SIZE;
        
        ctx.drawImage(
          images.sprites,
          sx, sy, SPRITE_SIZE, SPRITE_SIZE,
          x, y, cellSize, cellSize
        );
      }
    }
  }
  
  // Draw active column
  if (Game.column) {
    for (let i = 0; i < 3; i++) {
      const x = offsetX + Game.colX * cellSize;
      const y = offsetY + i * cellSize;
      const gem = Game.column[i];
      
      if (gem > 0 && images.sprites && images.sprites.complete) {
        const gemIndex = gem - 1;
        const sx = (gemIndex % 3) * SPRITE_SIZE;
        const sy = Math.floor(gemIndex / 3) * SPRITE_SIZE;
        
        ctx.globalAlpha = 0.8;
        ctx.drawImage(
          images.sprites,
          sx, sy, SPRITE_SIZE, SPRITE_SIZE,
          x, y, cellSize, cellSize
        );
        ctx.globalAlpha = 1.0;
      }
    }
  }
}

/* ========== UI Updates ========== */
function updateUI() {
  if (dom.score) dom.score.textContent = String(Game.score).padStart(6, "0");
  if (dom.level) dom.level.textContent = Game.level;
  if (dom.best) dom.best.textContent = String(Game.best).padStart(6, "0");
}

/* ========== Game State Functions ========== */
function startGame() {
  console.log("🎮 Starting game...");
  
  Game.running = true;
  Game.paused = false;
  Game.score = 0;
  Game.level = 1;
  Game.dropTimer = 0;
  Game.lastTime = performance.now();
  
  initGrid();
  spawnColumn();
  updateUI();
  
  // Start background music
  if (audio.sounds.bg && !audio.muted) {
    audio.sounds.bg.play().catch(e => console.log("BG music failed:", e));
  }
  
  requestAnimationFrame(update);
  console.log("✅ Game started!");
}

function togglePause() {
  console.log("Toggle pause clicked!");
  Game.paused = !Game.paused;
  
  if (Game.paused) {
    console.log("Game paused");
    if (audio.sounds.bg) audio.sounds.bg.pause();
    if (dom.pause) dom.pause.textContent = "▶️ Resume";
  } else {
    console.log("Game resumed");
    if (audio.sounds.bg && !audio.muted) {
      audio.sounds.bg.play().catch(e => console.log("BG resume failed:", e));
    }
    if (dom.pause) dom.pause.textContent = "⏸️ Pause";
    Game.lastTime = performance.now();
    requestAnimationFrame(update);
  }
}

function restartGame() {
  if (audio.sounds.bg) audio.sounds.bg.pause();
  
  Game.running = false;
  Game.paused = false;
  draw();
}

function gameOver() {
  console.log("💀 Game Over!");
  
  Game.running = false;
  
  if (Game.score > Game.best) {
    Game.best = Game.score;
    updateUI();
  }
  
  audio.play("over");
  
  if (audio.sounds.bg) audio.sounds.bg.pause();
}

/* ========== Event Listeners ========== */
function setupEvents() {
  console.log("Setting up event listeners...");
  
  // Game controls
  if (dom.play) {
    dom.play.addEventListener("click", startGame);
    console.log("✅ Play button wired");
  }
  
  if (dom.pause) {
    dom.pause.addEventListener("click", togglePause);
    console.log("✅ Pause button wired");
  }
  
  if (dom.restart) {
    dom.restart.addEventListener("click", restartGame);
    console.log("✅ Restart button wired");
  }
  
  // Mute button
  if (dom.mute) {
    dom.mute.addEventListener("click", () => {
      const enabled = audio.toggleMute();
      dom.mute.textContent = enabled ? "🔇 Mute" : "🔊 Unmute";
    });
    console.log("✅ Mute button wired");
  }
  
  // Touch controls - PREVENT DEFAULT to stop long-press slowdown
  if (dom.left) {
    dom.left.addEventListener("click", (e) => {
      e.preventDefault();
      moveLeft();
    });
    // Prevent context menu on long press
    dom.left.addEventListener("contextmenu", (e) => e.preventDefault());
    console.log("✅ Left button wired");
  }
  
  if (dom.right) {
    dom.right.addEventListener("click", (e) => {
      e.preventDefault();
      moveRight();
    });
    dom.right.addEventListener("contextmenu", (e) => e.preventDefault());
    console.log("✅ Right button wired");
  }
  
  if (dom.rotate) {
    dom.rotate.addEventListener("click", (e) => {
      e.preventDefault();
      rotateColumn();
    });
    dom.rotate.addEventListener("contextmenu", (e) => e.preventDefault());
    console.log("✅ Rotate button wired");
  }
  
  if (dom.toggleRotation) {
    dom.toggleRotation.addEventListener("click", (e) => {
      e.preventDefault();
      toggleRotationMode();
    });
    dom.toggleRotation.addEventListener("contextmenu", (e) => e.preventDefault());
    console.log("✅ Toggle rotation button wired");
  }
  
  if (dom.down) {
    dom.down.addEventListener("click", (e) => {
      e.preventDefault();
      softDrop();
    });
    dom.down.addEventListener("contextmenu", (e) => e.preventDefault());
    console.log("✅ Soft drop button wired");
  }
  
  if (dom.drop) {
    dom.drop.addEventListener("click", (e) => {
      e.preventDefault();
      hardDrop();
    });
    dom.drop.addEventListener("contextmenu", (e) => e.preventDefault());
    console.log("✅ Hard drop button wired");
  }
  
  // Keyboard controls
  window.addEventListener("keydown", (e) => {
    if (!Game.running) return;
    
    switch(e.key) {
      case "ArrowLeft":
        e.preventDefault();
        moveLeft();
        break;
      case "ArrowRight":
        e.preventDefault();
        moveRight();
        break;
      case "ArrowUp":
        e.preventDefault();
        rotateColumn();
        break;
      case "ArrowDown":
        e.preventDefault();
        softDrop();
        break;
      case " ":
        e.preventDefault();
        hardDrop();
        break;
      case "r":
      case "R":
        e.preventDefault();
        toggleRotationMode();
        break;
      case "p":
      case "P":
        e.preventDefault();
        togglePause();
        break;
      case "m":
      case "M":
        e.preventDefault();
        if (dom.mute) dom.mute.click();
        break;
    }
  });
  
  console.log("✅ Keyboard controls wired");
}

/* ========== Initialization ========== */
async function init() {
  console.log("🎮 Initializing Gem Stack...");
  
  // Load sprites
  loadSprites();
  
  // Load audio
  for (const [key, src] of Object.entries(ASSETS.audio)) {
    await audio.load(key, src);
  }
  console.log("✅ Audio loaded");
  
  // Canvas sizing
  if (dom.canvas) {
    function resize() {
      const rect = dom.canvas.getBoundingClientRect();
      dom.canvas.width = rect.width;
      dom.canvas.height = rect.height;
      draw();
    }
    resize();
    window.addEventListener("resize", resize);
    console.log("✅ Canvas sized");
  }
  
  // Setup events
  setupEvents();
  
  // Initialize UI
  initGrid();
  updateUI();
  
  // Draw initial state (shows background immediately)
  draw();
  
  console.log("✅ Ready to play!");
}

// Start when page loads
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
      }
