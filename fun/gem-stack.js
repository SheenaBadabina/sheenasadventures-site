/* ==========================================================================
   Sheena’s Adventures — Desert Drop: Gem Stack
   File: /fun/gem-stack.js
   Purpose: Full playable game (mobile-first). Canvas render, input, audio,
            falling 3-gem column, line-matching, gravity cascades, scoring.
   Assets (must exist exactly as named):
     Images:
       /assets/images/game/gem-sprites.png     (3×3 grid, 768×768, 256px cells)
       /assets/images/game/ui-overlays.png     (3×3 grid, 768×768, 256px cells)
       /assets/images/game/level-badges.png    (3×3 grid, 768×768, 256px cells)
     Sounds:
       /assets/sounds/background-loop.mp3
       /assets/sounds/gem-match.mp3
       /assets/sounds/line-clear.mp3
       /assets/sounds/level-up.mp3
       /assets/sounds/game-over.mp3
   ========================================================================== */

(() => {
  "use strict";

  // -----------------------------
  // Config & Constants
  // -----------------------------
  const GRID_COLS = 8;         // logical board width
  const GRID_ROWS = 16;        // logical board height
  const START_SPEED_MS = 900;  // drop interval for level 1
  const SPEED_STEP = 60;       // speed up per level (ms faster)
  const MIN_SPEED_MS = 180;    // cap so it never gets impossible
  const COLORS_INITIAL = 5;    // number of gem types at level 1
  const COLORS_MAX = 7;        // eventually allow up to 7 types
  const CLEARS_PER_LEVEL = 10; // every N line-clears -> next level
  const HARD_DROP_BONUS = 2;   // per cell
  const SOFT_DROP_BONUS = 1;   // per cell
  const MATCH_BASE = 100;      // base score for a 3-match
  const MATCH_EXTRA = 50;      // per additional gem in that line
  const COMBO_MULTIPLIERS = [1, 1.5, 2, 3, 4]; // capped multiplier ladder

  // Sprite sheet layout (3x3 grid, 256px cells in 768x768 sheet)
  const SPR_W = 768, SPR_H = 768, CELL = 256;

  // Gem sprite index map (row-major 0..8)
  const GEM_MAP = [
    "green-triangle",  // 0
    "red-circle",      // 1
    "purple-hex",      // 2
    "blue-diamond",    // 3
    "red-heart",       // 4
    "cyan-teardrop",   // 5
    "yellow-square",   // 6
    "green-pentagon",  // 7
    "blue-octagon"     // 8
  ];

  // Use first 7 indices for gameplay by default
  const GEM_POOL_BY_LEVEL = (lvl) => {
    const count = Math.min(COLORS_INITIAL + Math.floor((lvl-1)/3), COLORS_MAX);
    return Array.from({length: count}, (_,i)=>i);
  };

  // Utility
  const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
  const randOf = (arr) => arr[(Math.random() * arr.length) | 0];

  // -----------------------------
  // Canvas & Render State
  // -----------------------------
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");

  // Responsive sizing: logical grid cell-to-pixel scale computed each frame
  let pxPerCell = 32; // computed from canvas size
  const boardPadding = 0.06; // % of canvas min-dimension padding

  // -----------------------------
  // Assets (Images)
  // -----------------------------
  const imgGems = new Image();
  const imgUI = new Image();
  const imgBadges = new Image();
  imgGems.src   = "/assets/images/game/gem-sprites.png";
  imgUI.src     = "/assets/images/game/ui-overlays.png";
  imgBadges.src = "/assets/images/game/level-badges.png";

  let imagesReady = false;
  Promise.all([
    new Promise(r => imgGems.onload = r),
    new Promise(r => imgUI.onload = r),
    new Promise(r => imgBadges.onload = r),
  ]).then(()=> imagesReady = true);

  // Sprite draw helper
  function drawSprite9(img, index, dx, dy, dw, dh) {
    const col = index % 3;
    const row = (index / 3) | 0;
    const sx = col * CELL;
    const sy = row * CELL;
    ctx.drawImage(img, sx, sy, CELL, CELL, dx, dy, dw, dh);
  }

  // -----------------------------
  // Audio Manager (WebAudio)
  // -----------------------------
  class GameAudio {
    constructor() {
      this.paths = {
        bg: "/assets/sounds/background-loop.mp3",
        match: "/assets/sounds/gem-match.mp3",
        clear: "/assets/sounds/line-clear.mp3",
        level: "/assets/sounds/level-up.mp3",
        over: "/assets/sounds/game-over.mp3",
      };
      this.ctx = null;
      this.buffers = new Map();
      this.bgSource = null;
      this.bgGain = null;
      this.fxGain = null;
      this.ready = false;
      this.muted = false;
      this.bgVolume = 0.3;
      this.fxVolume = 0.9;
      this._userInteracted = false;
      this._pendingBgStart = false;
      this.onGesture = this.onGesture.bind(this);
    }
    async init() {
      if (!window.AudioContext && !window.webkitAudioContext) return;
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.bgGain = this.ctx.createGain();
      this.fxGain = this.ctx.createGain();
      this.bgGain.gain.value = this.muted ? 0 : this.bgVolume;
      this.fxGain.gain.value = this.muted ? 0 : this.fxVolume;
      this.bgGain.connect(this.ctx.destination);
      this.fxGain.connect(this.ctx.destination);

      await Promise.all(Object.entries(this.paths).map(async ([k, url])=>{
        const res = await fetch(url, {cache:"force-cache"});
        const buf = await res.arrayBuffer();
        const ab = await this.ctx.decodeAudioData(buf);
        this.buffers.set(k, ab);
      }));

      ["pointerdown","keydown","touchstart"].forEach(e =>
        window.addEventListener(e, this.onGesture, {once:true, passive:true})
      );
      this.ready = true;
    }
    onGesture() {
      this._userInteracted = true;
      if (this.ctx.state === "suspended") this.ctx.resume();
      if (this._pendingBgStart) { this._pendingBgStart = false; this.startBg(); }
    }
    startBg() {
      if (!this.ready) return;
      if (!this._userInteracted) { this._pendingBgStart = true; return; }
      this.stopBg();
      const src = this.ctx.createBufferSource();
      src.buffer = this.buffers.get("bg");
      src.loop = true;
      src.connect(this.bgGain);
      src.start(0);
      this.bgSource = src;
    }
    stopBg() {
      if (this.bgSource) { try { this.bgSource.stop(); } catch {} this.bgSource.disconnect(); this.bgSource = null; }
    }
    _playOne(key, rate=1.0) {
      if (!this.ready || this.muted) return;
      const b = this.buffers.get(key); if (!b) return;
      const src = this.ctx.createBufferSource();
      src.buffer = b;
      src.playbackRate.value = rate;
      const g = this.ctx.createGain();
      g.gain.value = this.fxVolume;
      src.connect(g).connect(this.fxGain);
      src.start(0);
      src.addEventListener("ended",()=>{ try{src.disconnect();g.disconnect();}catch{} });
    }
    playMatch(){ this._playOne("match"); }
    playClear(){ this._playOne("clear"); }
    playLevel(){ this._playOne("level"); }
    playOver(){ this.stopBg(); this._playOne("over"); }
    toggleMute(){
      this.muted = !this.muted;
      if (this.bgGain) this.bgGain.gain.value = this.muted ? 0 : this.bgVolume;
      if (this.fxGain) this.fxGain.gain.value = this.muted ? 0 : this.fxVolume;
      return this.muted;
    }
  }
  const audio = new GameAudio();

  // -----------------------------
  // Game State
  // -----------------------------
  const grid = Array.from({length: GRID_ROWS}, () => Array(GRID_COLS).fill(-1)); // -1 empty, else gem index 0..6
  let level = 1;
  let score = 0;
  let best = parseInt(localStorage.getItem("sa_gem_best")||"0",10);
  let clearsThisLevel = 0;
  let running = false;
  let dropTimerMs = START_SPEED_MS;
  let dropAcc = 0; // ms accumulator
  let lastTs = 0;

  // Falling piece: a column of 3 gems with order [top, mid, bot]
  let piece = null; // { col, row (top cell), order:[g,g,g] }
  let colorPool = GEM_POOL_BY_LEVEL(level);

  // -----------------------------
  // Piece helpers
  // -----------------------------
  function newPiece() {
    colorPool = GEM_POOL_BY_LEVEL(level);
    const order = [randOf(colorPool), randOf(colorPool), randOf(colorPool)];
    const col = (GRID_COLS/2)|0;
    const row = -2; // start above board for smooth entry
    return { col, row, order };
  }
  function rotatePiece(p) {
    // top->mid->bot->top
    p.order.unshift(p.order.pop());
  }
  function canPlaceAt(p, col, row) {
    for (let i = 0; i < 3; i++) {
      const rr = row + i;
      if (rr < 0) continue; // above board is fine
      if (rr >= GRID_ROWS) return false;
      if (col < 0 || col >= GRID_COLS) return false;
      if (grid[rr][col] !== -1) return false;
    }
    return true;
  }
  function lockPiece(p) {
    for (let i = 0; i < 3; i++) {
      const rr = p.row + i;
      if (rr >= 0 && rr < GRID_ROWS) {
        grid[rr][p.col] = p.order[i];
      }
    }
  }

  // -----------------------------
  // Matching & Clearing
  // -----------------------------
  const DIRS = [
    [1,0],[0,1],[1,1],[1,-1], // horiz, vert, diag down, diag up
    [-1,0],[0,-1],[-1,-1],[-1,1]
  ];

  function findLines() {
    // Return a set of cells to clear that are in lines >= 3 in any of 4 axes
    const toClear = new Set();
    function key(r,c){ return r+"_"+c; }

    // scan each cell as a start of line in 4 primary directions (avoid double counting backwards)
    const primaryDirs = [[1,0],[0,1],[1,1],[1,-1]];
    for (let r=0;r<GRID_ROWS;r++){
      for (let c=0;c<GRID_COLS;c++){
        const v = grid[r][c];
        if (v < 0) continue;
        for (const [dx,dy] of primaryDirs){
          let run = [[r,c]];
          let rr=r+dy, cc=c+dx;
          while (rr>=0 && rr<GRID_ROWS && cc>=0 && cc<GRID_COLS && grid[rr][cc]===v){
            run.push([rr,cc]);
            rr+=dy; cc+=dx;
          }
          if (run.length >= 3) {
            for (const [rr2,cc2] of run) toClear.add(key(rr2,cc2));
          }
        }
      }
    }
    return toClear;
  }

  function applyClear(toClear) {
    if (toClear.size === 0) return 0;

    // scoring: compute by distinct lines approximated via connected segments of same value in axes.
    // Simple approach: reward based on total cleared count
    const clearedCount = toClear.size;

    // clear
    for (const cell of toClear) {
      const [r,c] = cell.split("_").map(Number);
      grid[r][c] = -1;
    }
    audio.playClear();

    // gravity: for each column, drop gems down
    for (let c=0;c<GRID_COLS;c++){
      let w = GRID_ROWS-1;
      for (let r=GRID_ROWS-1;r>=0;r--){
        if (grid[r][c] !== -1) {
          const v = grid[r][c];
          grid[r][c] = -1;
          grid[w][c] = v;
          w--;
        }
      }
    }
    return clearedCount;
  }

  function resolveCascades() {
    // Perform cascade rounds; combo multiplier scales per cascade depth
    let totalCleared = 0;
    let comboDepth = 0;
    while (true) {
      const toClear = findLines();
      if (toClear.size === 0) break;
      const cleared = applyClear(toClear);
      totalCleared += cleared;
      comboDepth++;
      // Score per cascade
      const base = MATCH_BASE + Math.max(0, cleared-3)*MATCH_EXTRA;
      const mult = COMBO_MULTIPLIERS[Math.min(comboDepth, COMBO_MULTIPLIERS.length-1)];
      score += Math.round(base * mult);
      // UX: discreet match ping for first detection
      if (comboDepth === 1) audio.playMatch();
      // Track level-ups
      clearsThisLevel += 1;
      if (clearsThisLevel >= CLEARS_PER_LEVEL) {
        clearsThisLevel = 0;
        levelUp();
      }
    }
    if (totalCleared > 0) updateHUD();
  }

  function levelUp() {
    level++;
    dropTimerMs = Math.max(MIN_SPEED_MS, START_SPEED_MS - (level-1)*SPEED_STEP);
    audio.playLevel();
  }

  // -----------------------------
  // Input
  // -----------------------------
  const btnLeft  = document.querySelector('[data-action="left"]');
  const btnRight = document.querySelector('[data-action="right"]');
  const btnRot   = document.querySelector('[data-action="rotate"]');
  const btnSoft  = document.querySelector('[data-action="soft"]');
  const btnHard  = document.querySelector('[data-action="hard"]');
  const btnPlay  = document.querySelector('[data-game="play"]');
  const btnMute  = document.querySelector('[data-audio="mute"]');

  function bindInput() {
    if (btnLeft)  btnLeft.addEventListener("click",  ()=> tryMove(-1));
    if (btnRight) btnRight.addEventListener("click",  ()=> tryMove(1));
    if (btnRot)   btnRot.addEventListener("click",    ()=> tryRotate());
    if (btnSoft)  btnSoft.addEventListener("click",   ()=> softDropOnce());
    if (btnHard)  btnHard.addEventListener("click",   ()=> hardDrop());

    window.addEventListener("keydown", (e)=>{
      if (!running) return;
      if (e.key === "ArrowLeft")  { e.preventDefault(); tryMove(-1); }
      if (e.key === "ArrowRight") { e.preventDefault(); tryMove(1); }
      if (e.key === "ArrowUp")    { e.preventDefault(); tryRotate(); }
      if (e.key === "ArrowDown")  { e.preventDefault(); softDropOnce(); }
      if (e.code === "Space")     { e.preventDefault(); hardDrop(); }
      if (e.key.toLowerCase() === "m") toggleMute();
      if (e.key.toLowerCase() === "p") pauseToggle();
    });

    if (btnPlay) btnPlay.addEventListener("click", startGame);

    if (btnMute) btnMute.addEventListener("click", toggleMute);
  }

  function toggleMute() {
    const muted = audio.toggleMute();
    if (btnMute) btnMute.setAttribute("aria-pressed", String(muted));
  }

  // -----------------------------
  // Game Loop & Actions
  // -----------------------------
  function startGame() {
    if (running) return;
    resetGame();
    running = true;
    audio.startBg();
    lastTs = performance.now();
    requestAnimationFrame(tick);
  }

  function resetGame() {
    // clear grid
    for (let r=0;r<GRID_ROWS;r++) grid[r].fill(-1);
    level = 1;
    score = 0;
    clearsThisLevel = 0;
    dropTimerMs = START_SPEED_MS;
    piece = newPiece();
    updateHUD();
  }

  function gameOver() {
    running = false;
    audio.playOver();
    best = Math.max(best, score);
    localStorage.setItem("sa_gem_best", String(best));
    updateHUD();
    // Simple overlay text
    draw();
    ctx.save();
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = "#000";
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#FFD740";
    ctx.font = Math.floor(canvas.height*0.06)+"px system-ui,Arial";
    ctx.textAlign = "center";
    ctx.fillText("Game Over — Tap Play to Retry", canvas.width/2, canvas.height/2);
    ctx.restore();
  }

  function tryMove(dx) {
    if (!piece) return;
    const nc = piece.col + dx;
    if (canPlaceAt(piece, nc, piece.row)) piece.col = nc;
  }
  function tryRotate() {
    if (!piece) return;
    // rotation always valid unless bottom would collides below board; safe to rotate because column footprint same
    rotatePiece(piece);
  }
  function softDropOnce() {
    if (!piece) return;
    if (canPlaceAt(piece, piece.col, piece.row+1)) {
      piece.row += 1;
      score += SOFT_DROP_BONUS;
      updateHUD();
    } else {
      lockAndSpawn();
    }
  }
  function hardDrop() {
    if (!piece) return;
    let steps = 0;
    while (canPlaceAt(piece, piece.col, piece.row+1)) {
      piece.row += 1;
      steps++;
    }
    score += steps * HARD_DROP_BONUS;
    updateHUD();
    lockAndSpawn();
  }

  function lockAndSpawn() {
    lockPiece(piece);
    resolveCascades();
    piece = newPiece();
    // If new piece cannot be placed -> game over
    if (!canPlaceAt(piece, piece.col, piece.row)) {
      gameOver();
    } else {
      // small match ping for successful land
      audio.playMatch();
    }
  }

  function tick(ts) {
    if (!running) return;
    const dt = ts - lastTs; lastTs = ts;
    dropAcc += dt;
    while (dropAcc >= dropTimerMs) {
      dropAcc -= dropTimerMs;
      if (canPlaceAt(piece, piece.col, piece.row+1)) {
        piece.row += 1;
      } else {
        lockAndSpawn();
        if (!running) return; // in case game over
      }
    }
    draw();
    requestAnimationFrame(tick);
  }

  // -----------------------------
  // Drawing
  // -----------------------------
  function computeScale() {
    // Fit board with padding
    const pad = Math.min(canvas.width, canvas.height) * boardPadding;
    const usableW = canvas.width - pad*2;
    const usableH = canvas.height - pad*2;
    const cellW = usableW / GRID_COLS;
    const cellH = usableH / GRID_ROWS;
    pxPerCell = Math.floor(Math.min(cellW, cellH));
    return { padX: (canvas.width - pxPerCell*GRID_COLS)/2, padY: (canvas.height - pxPerCell*GRID_ROWS)/2 };
  }

  function clearCanvas() {
    // subtle vignette
    const g = ctx.createLinearGradient(0,0,0,canvas.height);
    g.addColorStop(0,"#121821");
    g.addColorStop(1,"#0B0F12");
    ctx.fillStyle = g;
    ctx.fillRect(0,0,canvas.width,canvas.height);
  }

  function drawGrid(pad) {
    // draw landed gems
    for (let r=0;r<GRID_ROWS;r++){
      for (let c=0;c<GRID_COLS;c++){
        const v = grid[r][c];
        if (v >= 0) {
          const x = pad.padX + c*pxPerCell;
          const y = pad.padY + r*pxPerCell;
          drawSprite9(imgGems, v, x, y, pxPerCell, pxPerCell);
        }
      }
    }
  }

  function drawPiece(pad) {
    if (!piece) return;
    for (let i=0;i<3;i++){
      const rr = piece.row + i;
      const cc = piece.col;
      const v = piece.order[i];
      const x = pad.padX + cc*pxPerCell;
      const y = pad.padY + rr*pxPerCell;
      if (rr >= 0) drawSprite9(imgGems, v, x, y, pxPerCell, pxPerCell);
    }
  }

  function drawBadge(pad) {
    // show level badge at top-left of board area
    const idx = (level-1) % 9;
    const size = Math.floor(pxPerCell*1.2);
    const x = pad.padX - size - 10;
    const y = pad.padY;
    drawSprite9(imgBadges, idx, x, y, size, size);
  }

  function draw() {
    if (!imagesReady) return;
    clearCanvas();
    const pad = computeScale();

    // Board frame
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1;
    ctx.strokeRect(
      pad.padX - 0.5,
      pad.padY - 0.5,
      pxPerCell*GRID_COLS + 1,
      pxPerCell*GRID_ROWS + 1
    );
    ctx.restore();

    drawGrid(pad);
    drawPiece(pad);
    drawBadge(pad);

    // optional: faint grid lines (comment out if you want cleaner look)
    /*
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    for (let c=1;c<GRID_COLS;c++){
      const x = pad.padX + c*pxPerCell + 0.5;
      ctx.beginPath(); ctx.moveTo(x, pad.padY); ctx.lineTo(x, pad.padY + pxPerCell*GRID_ROWS); ctx.stroke();
    }
    for (let r=1;r<GRID_ROWS;r++){
      const y = pad.padY + r*pxPerCell + 0.5;
      ctx.beginPath(); ctx.moveTo(pad.padX, y); ctx.lineTo(pad.padX + pxPerCell*GRID_COLS, y); ctx.stroke();
    }
    ctx.restore();
    */
  }

  // -----------------------------
  // HUD
  // -----------------------------
  const elScore = document.getElementById("score");
  const elLevel = document.getElementById("level");
  const elBest  = document.getElementById("best");
  const srLive  = document.getElementById("sr-live");

  function pad6(n){ return (""+n).padStart(6,"0"); }
  function updateHUD(){
    if (elScore) elScore.textContent = pad6(score);
    if (elLevel) elLevel.textContent = level.toString();
    if (elBest)  elBest.textContent  = pad6(Math.max(best, score));
    if (srLive)  srLive.textContent  = `Score ${score}, Level ${level}, Best ${Math.max(best,score)}`;
  }

  // -----------------------------
  // Pause (optional future)
  // -----------------------------
  let paused = false;
  function pauseToggle(){
    paused = !paused;
    if (!paused) { lastTs = performance.now(); requestAnimationFrame(tick); }
  }

  // -----------------------------
  // Resize Handling
  // -----------------------------
  function fitToContainer() {
    // Already have aspect via CSS; for crisp canvas use devicePixelRatio scaling
    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(320, rect.width|0);
    const h = Math.max(180, rect.height|0);
    if (canvas.width !== (w*ratio) || canvas.height !== (h*ratio)) {
      canvas.width  = w * ratio;
      canvas.height = h * ratio;
      ctx.setTransform(ratio,0,0,ratio,0,0);
      draw();
    }
  }
  new ResizeObserver(fitToContainer).observe(canvas);

  // -----------------------------
  // Boot
  // -----------------------------
  async function boot() {
    await audio.init();
    bindInput();
    updateHUD();
    fitToContainer();
    draw();
  }
  document.addEventListener("DOMContentLoaded", boot);

})();
