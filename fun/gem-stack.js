/*  Desert Drop — Gem Stack
    MINIMAL TEST VERSION - Proves JavaScript works
    ----------------------------------------------------- */

console.log("🎮 GAME SCRIPT LOADED!");

// Get elements
const canvas = document.getElementById('gameCanvas');
const ctx = canvas ? canvas.getContext('2d') : null;

const playBtn = document.getElementById('playBtn');
const pauseBtn = document.getElementById('pauseBtn');
const restartBtn = document.getElementById('restartBtn');
const muteBtn = document.getElementById('muteBtn');

console.log("Canvas:", canvas);
console.log("Context:", ctx);
console.log("Play button:", playBtn);

// Test: Draw something immediately to prove canvas works
if (ctx) {
  console.log("✅ Canvas context OK - Drawing test pattern");
  
  // Fill with gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, '#4a90e2');
  gradient.addColorStop(1, '#e67e22');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw text
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 32px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('CANVAS WORKS!', canvas.width / 2, canvas.height / 2);
  ctx.font = '20px sans-serif';
  ctx.fillText('Click Play to start', canvas.width / 2, canvas.height / 2 + 40);
  
  console.log("✅ Test pattern drawn");
} else {
  console.error("❌ NO CANVAS CONTEXT!");
  alert("Canvas failed to initialize!");
}

// Simple game state
let gameRunning = false;
let score = 0;

// Resize canvas to fit screen
function resizeCanvas() {
  if (!canvas) return;
  const container = canvas.parentElement;
  const maxW = container.clientWidth || window.innerWidth;
  const maxH = window.innerHeight * 0.6;
  
  canvas.width = Math.min(maxW, 600);
  canvas.height = Math.min(maxH, 900);
  
  console.log(`Canvas resized: ${canvas.width}×${canvas.height}`);
  
  // Redraw after resize
  if (ctx && !gameRunning) {
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#4a90e2');
    gradient.addColorStop(1, '#e67e22');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('CANVAS WORKS!', canvas.width / 2, canvas.height / 2);
    ctx.font = '20px sans-serif';
    ctx.fillText('Click Play to start', canvas.width / 2, canvas.height / 2 + 40);
  }
}

// Draw game (simplified)
function draw() {
  if (!ctx) return;
  
  // Clear
  ctx.fillStyle = '#1a2332';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw score
  ctx.fillStyle = '#00BFA5';
  ctx.font = 'bold 48px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`Score: ${score}`, canvas.width / 2, 100);
  
  // Draw a bouncing ball (proof of animation)
  const time = Date.now() / 1000;
  const x = canvas.width / 2 + Math.sin(time * 2) * 100;
  const y = canvas.height / 2 + Math.cos(time * 3) * 80;
  
  ctx.fillStyle = '#e74c3c';
  ctx.beginPath();
  ctx.arc(x, y, 30, 0, Math.PI * 2);
  ctx.fill();
  
  // Draw text
  ctx.fillStyle = '#ffffff';
  ctx.font = '24px sans-serif';
  ctx.fillText('GAME RUNNING!', canvas.width / 2, canvas.height - 100);
  ctx.font = '18px sans-serif';
  ctx.fillText('(This is a test animation)', canvas.width / 2, canvas.height - 60);
}

// Game loop
function gameLoop() {
  if (gameRunning) {
    draw();
    score++;
    requestAnimationFrame(gameLoop);
  }
}

// Button handlers
if (playBtn) {
  playBtn.addEventListener('click', () => {
    console.log("▶️ PLAY CLICKED!");
    gameRunning = true;
    score = 0;
    
    // Update buttons
    playBtn.style.display = 'none';
    if (pauseBtn) pauseBtn.style.display = 'inline-flex';
    if (restartBtn) restartBtn.style.display = 'inline-flex';
    
    // Hide header/footer
    document.body.classList.add('playing');
    
    // Start loop
    gameLoop();
    
    console.log("✅ Game started!");
  });
} else {
  console.error("❌ Play button not found!");
}

if (pauseBtn) {
  pauseBtn.addEventListener('click', () => {
    console.log("⏸️ PAUSE CLICKED!");
    gameRunning = !gameRunning;
    pauseBtn.textContent = gameRunning ? '⏸️ Pause' : '▶️ Resume';
    if (gameRunning) gameLoop();
  });
}

if (restartBtn) {
  restartBtn.addEventListener('click', () => {
    console.log("🔄 RESTART CLICKED!");
    gameRunning = false;
    score = 0;
    
    // Reset buttons
    playBtn.style.display = 'inline-flex';
    if (pauseBtn) pauseBtn.style.display = 'none';
    if (restartBtn) restartBtn.style.display = 'none';
    
    document.body.classList.remove('playing');
    
    // Redraw start screen
    resizeCanvas();
  });
}

if (muteBtn) {
  muteBtn.addEventListener('click', () => {
    console.log("🔇 MUTE CLICKED!");
    const currentText = muteBtn.textContent;
    muteBtn.textContent = currentText.includes('Mute') ? '🔊 Unmute' : '🔇 Mute';
  });
}

// Initialize
window.addEventListener('resize', resizeCanvas);
window.addEventListener('load', () => {
  console.log("🚀 Page loaded, initializing...");
  resizeCanvas();
});

// Run resize immediately
resizeCanvas();

console.log("✅ Script complete - waiting for user interaction");
