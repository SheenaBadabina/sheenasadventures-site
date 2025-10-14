/*  Desert Drop — Gem Stack
    SIMPLIFIED WORKING VERSION
    All core features, no fancy effects
    ----------------------------------------------------- */

/* ========== Asset paths ========== */
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

/* ========== DOM Elements ========== */
const canvas = document.getElementById('gameCanvas');
const ctx = canvas ? canvas.getContext('2d') : null;

const dom = {
  play: document.querySelector('[data-game="play"]'),
  pause: document.querySelector('[data-game="pause"]'),
  restart: document.querySelector('[data-game="restart"]'),
  mute: document.querySelector('[data-audio="mute"]'),
  score: document.querySelector('[data-ui="score"]'),
  level: document.querySelector('[data-ui="level"]'),
  best: document.querySelector('[data-ui="best"]'),
  left: document.querySelector('[data-control="left"]'),
  right: document.querySelector('[data-control="right"]'),
  down: document.querySelector('[data-control="down"]'),
  drop: document.querySelector('[data-control="drop"]'),
  rotate: document.querySelector('[data-control="rotate"]')
};

/* ========== Game State ========== */
const Game = {
  running: false,
  paused: false,
  over: false,
  score: 0,
  level: 1,
  lines: 0,
  best: parseInt(localStorage.getItem('gemstack_best') || '0'),
  
  // Grid
  cols: 8,
  rows: 16,
  grid: [],
  
  // Active column
  activeCol: null,
  colX: 3,
  
  // Timing
  dropTimer: 0,
  dropSpeed: 2000, // SLOWER - 2 seconds per drop
  lastTime: 0,
  
  // Rotation mode
  rotationMode: 'vertical' // 'vertical' or 'horizontal'
};

/* ========== Audio Manager ========== */
class AudioManager {
  constructor() {
    this.sounds = {};
    this.bgMusic = null;
    this.enabled = true;
  }
  
  async load(key, src) {
    try {
      const audio = new Audio(src);
      audio.preload = 'auto';
      
      if (key === 'bg') {
        audio.loop = true;
        this.bgMusic = audio;
      }
      
      this.sounds[key] = audio;
      await audio.load();
    } catch (err) {
      console.warn(`Could not load ${key}:`, err);
    }
  }
  
  play(key) {
    if (!this.enabled || !this.sounds[key]) return;
    const audio = this.sounds[key];
    audio.currentTime = 0;
    audio.play().catch(() => {});
  }
  
  playBg() {
    if (!this.enabled || !this.bgMusic) return;
    this.bgMusic.play().catch(() => {});
  }
  
  stopBg() {
    if (this.bgMusic) {
      this.bgMusic.pause();
      this.bgMusic.currentTime = 0;
    }
  }
  
  toggleMute() {
    this.enabled = !this.enabled;
    
    if (this.bgMusic) {
      if (this.enabled && Game.running && !Game.paused) {
        this.bgMusic.play().catch(() => {});
      } else {
        this.bgMusic.pause();
      }
    }
    
    return this.enabled;
  }
}

const audio = new AudioManager();

/* ========== Image Loading ========== */
const images = {
  sprites: null,
  bg: null,
  loaded: false,
  bgLoaded: false
};

async function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/* ========== Grid Functions ========== */
function initGrid() {
  Game.grid = [];
  for (let r = 0; r < Game.rows; r++) {
    Game.grid[r] = [];
    for (let c = 0; c < Game.cols; c++) {
      Game.grid[r][c] = -1;
    }
  }
}

function spawnColumn() {
  Game.activeCol = [
    Math.floor(Math.random() * 9),
    Math.floor(Math.random() * 9),
    Math.floor(Math.random() * 9)
  ];
  Game.colX = Math.floor(Game.cols / 2); // Start in middle (column 4)
  Game.dropTimer = 0; // Reset timer
}

function canPlace() {
  if (Game.colX < 0 || Game.colX >= Game.cols) return false;
  
  for (let i = 0; i < 3; i++) {
    if (Game.grid[i][Game.colX] !== -1) return false;
  }
  
  return true;
}

function placeColumn() {
  for (let i = 0; i < 3; i++) {
    Game.grid[i][Game.colX] = Game.activeCol[i];
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
    let count = 1;
    let type = Game.grid[r][0];
    
    for (let c = 1; c < Game.cols; c++) {
      if (Game.grid[r][c] === type && type !== -1) {
        count++;
      } else {
        if (count >= 3) {
          for (let i = 0; i < count; i++) {
            matched.add(`${r},${c - 1 - i}`);
          }
        }
        count = 1;
        type = Game.grid[r][c];
      }
    }
    
    if (count >= 3) {
      for (let i = 0; i < count; i++) {
        matched.add(`${r},${Game.cols - 1 - i}`);
      }
    }
  }
  
  // Vertical
  for (let c = 0; c < Game.cols; c++) {
    let count = 1;
    let type = Game.grid[0][c];
    
    for (let r = 1; r < Game.rows; r++) {
      if (Game.grid[r][c] === type && type !== -1) {
        count++;
      } else {
        if (count >= 3) {
          for (let i = 0; i < count; i++) {
            matched.add(`${r - 1 - i},${c}`);
          }
        }
        count = 1;
        type = Game.grid[r][c];
      }
    }
    
    if (count >= 3) {
      for (let i = 0; i < count; i++) {
        matched.add(`${Game.rows - 1 - i},${c}`);
      }
    }
  }
  
  // Diagonal (optional but included)
  // Top-left to bottom-right
  for (let startR = 0; startR < Game.rows; startR++) {
    for (let startC = 0; startC < Game.cols; startC++) {
      let count = 1;
      let type = Game.grid[startR][startC];
      
      for (let offset = 1; startR + offset < Game.rows && startC + offset < Game.cols; offset++) {
        if (Game.grid[startR + offset][startC + offset] === type && type !== -1) {
          count++;
        } else {
          break;
        }
      }
      
      if (count >= 3) {
        for (let i = 0; i < count; i++) {
          matched.add(`${startR + i},${startC + i}`);
        }
      }
    }
  }
  
  // Top-right to bottom-left
  for (let startR = 0; startR < Game.rows; startR++) {
    for (let startC = Game.cols - 1; startC >= 0; startC--) {
      let count = 1;
      let type = Game.grid[startR][startC];
      
      for (let offset = 1; startR + offset < Game.rows && startC - offset >= 0; offset++) {
        if (Game.grid[startR + offset][startC - offset] === type && type !== -1) {
          count++;
        } else {
          break;
        }
      }
      
      if (count >= 3) {
        for (let i = 0; i < count; i++) {
          matched.add(`${startR + i},${startC - i}`);
        }
      }
    }
  }
  
  // Clear matches
  if (matched.size > 0) {
    matched.forEach(pos => {
      const [r, c] = pos.split(',').map(Number);
      Game.grid[r][c] = -1;
    });
    
    Game.score += matched.size * 10;
    Game.lines += Math.floor(matched.size / 3);
    
    // Level up every 10 lines
    const newLevel = Math.floor(Game.lines / 10) + 1;
    if (newLevel > Game.level) {
      Game.level = newLevel;
      Game.dropSpeed = Math.max(200, 1000 - (Game.level - 1) * 100);
      audio.play('lvl');
    }
    
    audio.play('match');
    
    setTimeout(() => {
      applyGravity();
      checkMatches();
    }, 150);
  }
  
  updateUI();
}

/* ========== Input Handlers ========== */
function moveLeft() {
  if (!Game.running || Game.paused || Game.over || !Game.activeCol) return;
  if (Game.colX > 0) Game.colX--;
}

function moveRight() {
  if (!Game.running || Game.paused || Game.over || !Game.activeCol) return;
  if (Game.colX < Game.cols - 1) Game.colX++;
}

function rotateColumn() {
  if (!Game.running || Game.paused || Game.over || !Game.activeCol) return;
  
  if (Game.rotationMode === 'vertical') {
    // Rotate vertically (bottom goes to top)
    const temp = Game.activeCol[2];
    Game.activeCol[2] = Game.activeCol[1];
    Game.activeCol[1] = Game.activeCol[0];
    Game.activeCol[0] = temp;
  } else {
    // Rotate horizontally (swap positions)
    const temp = Game.activeCol[0];
    Game.activeCol[0] = Game.activeCol[1];
    Game.activeCol[1] = Game.activeCol[2];
    Game.activeCol[2] = temp;
  }
}

function toggleRotation() {
  Game.rotationMode = Game.rotationMode === 'vertical' ? 'horizontal' : 'vertical';
  // Show feedback (optional)
  console.log('Rotation mode:', Game.rotationMode);
}

function softDrop() {
  if (!Game.running || Game.paused || Game.over || !Game.activeCol) return;
  Game.dropTimer = Game.dropSpeed;
}

function hardDrop() {
  if (!Game.running || Game.paused || Game.over || !Game.activeCol) return;
  
  if (canPlace()) {
    placeColumn();
    
    // Check for game over
    if (!canPlace()) {
      gameOver();
    } else {
      spawnColumn();
    }
    
    Game.dropTimer = 0;
  }
}

/* ========== Game Control ========== */
function startGame() {
  try {
    console.log('Starting game...');
    
    Game.running = true;
    Game.paused = false;
    Game.over = false;
    Game.score = 0;
    Game.level = 1;
    Game.lines = 0;
    Game.dropSpeed = 2000; // Start at 2 seconds
    Game.dropTimer = 0;
    
    console.log('Initializing grid...');
    initGrid();
    
    console.log('Spawning first column...');
    spawnColumn();
    
    console.log('Updating UI...');
    updateUI();
    
    console.log('Starting audio...');
    audio.playBg();
    
    console.log('Starting game loop...');
    Game.lastTime = performance.now();
    requestAnimationFrame(gameLoop);
    
    console.log('Game started successfully!');
  } catch (error) {
    alert('Error starting game: ' + error.message);
    console.error('Game start error:', error);
  }
}

// Make functions globally accessible for onclick
window.gameStart = startGame;
window.togglePause = togglePause;
window.restartGame = restartGame;
window.moveLeft = moveLeft;
window.moveRight = moveRight;
window.rotateColumn = rotateColumn;
window.softDrop = softDrop;
window.hardDrop = hardDrop;

function togglePause() {
  if (!Game.running || Game.over) return;
  
  Game.paused = !Game.paused;
  
  if (Game.paused) {
    audio.stopBg();
  } else {
    audio.playBg();
  }
  
  updateUI();
}

function restartGame() {
  if (Game.score > Game.best) {
    Game.best = Game.score;
    localStorage.setItem('gemstack_best', Game.best.toString());
  }
  
  startGame();
}

function gameOver() {
  Game.over = true;
  audio.stopBg();
  audio.play('over');
  updateUI();
}

/* ========== Game Loop ========== */
function gameLoop(time) {
  if (!Game.running) return;
  
  const dt = time - Game.lastTime;
  Game.lastTime = time;
  
  if (!Game.paused && !Game.over && Game.activeCol) {
    Game.dropTimer += dt;
    
    if (Game.dropTimer >= Game.dropSpeed) {
      if (canPlace()) {
        placeColumn();
        
        if (!canPlace()) {
          gameOver();
        } else {
          spawnColumn();
        }
      } else {
        gameOver();
      }
      
      Game.dropTimer = 0;
    }
  }
  
  draw();
  requestAnimationFrame(gameLoop);
}

/* ========== Drawing ========== */
function draw() {
  if (!ctx) return;
  
  const cellSize = Math.floor(Math.min(
    canvas.width / Game.cols,
    canvas.height / Game.rows
  ));
  
  // Background
  if (images.bgLoaded && images.bg) {
    ctx.drawImage(images.bg, 0, 0, canvas.width, canvas.height);
  } else {
    ctx.fillStyle = '#2c4a5f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  
  // Grid gems - draw aligned to grid
  for (let r = 0; r < Game.rows; r++) {
    for (let c = 0; c < Game.cols; c++) {
      if (Game.grid[r][c] !== -1) {
        drawGem(Game.grid[r][c], Math.floor(c * cellSize), Math.floor(r * cellSize), cellSize);
      }
    }
  }
  
  // Active column - draw aligned to grid
  if (Game.activeCol && !Game.paused && !Game.over) {
    for (let i = 0; i < 3; i++) {
      drawGem(Game.activeCol[i], Math.floor(Game.colX * cellSize), Math.floor(i * cellSize), cellSize);
    }
  }
  
  // Pause overlay
  if (Game.paused) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 48px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
  }
  
  // Game over overlay
  if (Game.over) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ff4444';
    ctx.font = 'bold 48px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);
  }
}

function drawGem(type, x, y, size) {
  if (!images.loaded || !images.sprites) {
    // Fallback colors
    const colors = ['#4CAF50', '#F44336', '#9C27B0', '#2196F3', '#E91E63', 
                   '#00BCD4', '#FFEB3B', '#FF9800', '#3F51B5'];
    ctx.fillStyle = colors[type] || '#999';
    ctx.fillRect(x + 2, y + 2, size - 4, size - 4);
    return;
  }
  
  // CORRECT: 1024×1024 sprite sheet with 341.33px cells
  const SPRITE_CELL = 1024 / 3; // = 341.333...
  const col = type % 3;
  const row = Math.floor(type / 3);
  
  ctx.drawImage(
    images.sprites,
    col * SPRITE_CELL, row * SPRITE_CELL, SPRITE_CELL, SPRITE_CELL,
    x, y, size, size
  );
}

/* ========== UI Updates ========== */
function updateUI() {
  if (dom.score) dom.score.textContent = Game.score.toString().padStart(6, '0');
  if (dom.level) dom.level.textContent = Game.level;
  if (dom.best) dom.best.textContent = Game.best.toString().padStart(6, '0');
  
  if (dom.play) dom.play.style.display = (!Game.running || Game.over) ? 'inline-flex' : 'none';
  if (dom.pause) {
    dom.pause.style.display = (Game.running && !Game.over) ? 'inline-flex' : 'none';
    dom.pause.textContent = Game.paused ? '▶️ Resume' : '⏸️ Pause';
  }
  if (dom.restart) dom.restart.style.display = (Game.running || Game.over) ? 'inline-flex' : 'none';
}

/* ========== Event Listeners ========== */
function setupEvents() {
  // Game controls
  if (dom.play) dom.play.addEventListener('click', startGame);
  if (dom.pause) dom.pause.addEventListener('click', togglePause);
  if (dom.restart) dom.restart.addEventListener('click', restartGame);
  
  // Mute
  if (dom.mute) {
    dom.mute.addEventListener('click', () => {
      const enabled = audio.toggleMute();
      dom.mute.textContent = enabled ? '🔇 Mute' : '🔊 Unmute';
    });
  }
  
  // Touch controls
  if (dom.left) dom.left.addEventListener('click', moveLeft);
  if (dom.right) dom.right.addEventListener('click', moveRight);
  if (dom.rotate) dom.rotate.addEventListener('click', rotateColumn);
  if (dom.down) dom.down.addEventListener('click', softDrop);
  if (dom.drop) dom.drop.addEventListener('click', hardDrop);
  
  // Keyboard
  document.addEventListener('keydown', (e) => {
    if (!Game.running || Game.paused || Game.over) {
      if (e.key === 'p' || e.key === 'P') togglePause();
      return;
    }
    
    switch(e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        moveLeft();
        break;
      case 'ArrowRight':
        e.preventDefault();
        moveRight();
        break;
      case 'ArrowUp':
        e.preventDefault();
        rotateColumn();
        break;
      case 'ArrowDown':
        e.preventDefault();
        softDrop();
        break;
      case ' ':
        e.preventDefault();
        hardDrop();
        break;
      case 'r':
      case 'R':
        e.preventDefault();
        toggleRotation();
        break;
      case 'p':
      case 'P':
        e.preventDefault();
        togglePause();
        break;
      case 'm':
      case 'M':
        e.preventDefault();
        audio.toggleMute();
        break;
    }
  });
  
  // Hamburger menu
  const hamburger = document.querySelector('.hamburger');
  if (hamburger) {
    hamburger.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      document.body.classList.toggle('menu-open');
    });
    
    document.querySelectorAll('.site-nav a').forEach(link => {
      link.addEventListener('click', () => {
        document.body.classList.remove('menu-open');
      });
    });
  }
}

/* ========== Canvas Resize ========== */
function resizeCanvas() {
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;
  draw();
}

/* ========== Initialization ========== */
async function init() {
  if (!ctx) {
    console.error('Canvas not found!');
    return;
  }
  
  // Load images
  try {
    images.sprites = await loadImage(ASSETS.images.sprites);
    images.loaded = true;
  } catch (e) {
    console.warn('Sprites failed to load, using fallback colors');
  }
  
  try {
    images.bg = await loadImage(ASSETS.images.bg);
    images.bgLoaded = true;
  } catch (e) {
    console.warn('Background failed to load, using fallback color');
  }
  
  // Load audio
  for (const [key, src] of Object.entries(ASSETS.audio)) {
    await audio.load(key, src);
  }
  
  // Setup
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  setupEvents();
  updateUI();
  draw();
  
  // Footer year
  const yearEl = document.getElementById('y');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
            }
