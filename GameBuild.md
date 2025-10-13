# Sheena’s Adventures — Game Build Specification  
**Project:** Desert Drop — Gem Stack  
**Purpose:** Define the design, structure, and implementation plan for the official Sheena’s Adventures web game.  
**Version:** 1.0  

---

## OVERVIEW
**Game Title:** Desert Drop — Gem Stack  
**Location:** `/fun/gem-stack.html`  
**Objective:** Create a lightweight, mobile-first HTML5 game inspired by Columns/Tetris mechanics with a Utah desert gem aesthetic.  
**Playtime:** 2–5 minutes per session.  
**Platforms:** Web (mobile + desktop).  

---

## DESIGN PRINCIPLES
**Philosophy:**  
Fast, intuitive, beautiful, and accessible. Designed for casual visitors who may not normally play games but are drawn in by the Sheena’s Adventures brand.  

**Visual Identity:**  
- Clean desert palette: sandstone, agate, and twilight hues.  
- Minimalist UI integrated with Sheena’s Adventures aesthetic.  
- Consistent typography and rounded corners to match site style.  
- Realistic gem reflections; subtle sparkle animations on clears.  

---

## GAMEPLAY SUMMARY
**Core Loop:**  
1. A column of three gems falls from the top.  
2. Player can reorder the gems vertically and slide the column left or right.  
3. When three or more same-colored gems align (horizontal, vertical, or diagonal), they clear.  
4. Gravity cascades remaining gems downward, possibly chaining new clears.  
5. The game speeds up gradually; player loses when the stack reaches the top.  

**Scoring:**  
    Base: 100 points for a 3-match  
    +50 points per additional gem in that match  
    Combo multiplier: ×1.5, ×2.0, etc.  

**Difficulty:**  
- Level increases after every 10 clears.  
- Speed and number of gem colors rise progressively.  

**Power-ups:**  
    Shimmer Gem — clears all of its color.  
    Canyon Bomb — clears a 3×3 area.  
    Fossil Blocker — solid rock that clears only when adjacent gems explode.  

---

## ACCESSIBILITY
- Touch controls ≥ 44px height.  
- Keyboard support for desktop (arrows + space).  
- Color-blind mode replaces colors with distinct shapes.  
- High-contrast mode toggle.  
- Screen reader labels and `aria-live` for score announcements.  

---

## FILE STRUCTURE
    /fun/
      ├─ gem-stack.html          ← main page
      ├─ gem-stack.css           ← responsive layout
      ├─ gem-stack.js            ← audio + event hooks (and later, core gameplay)
      └─ GameBuild.md
    /assets/
      ├─ images/
      │   └─ game/
      │        ├─ gem-sprites.png        ← 3×3 grid (gems)
      │        ├─ ui-overlays.png        ← 3×3 grid (icons)
      │        └─ level-badges.png       ← 3×3 grid (badges)
      └─ sounds/
           ├─ background-loop.mp3
           ├─ gem-match.mp3
           ├─ line-clear.mp3
           ├─ level-up.mp3
           └─ game-over.mp3
    /assets/images/
      ├─ sheenas-adventures-game-gem-stack-thumb.png
      └─ sheenas-adventures-game-gem-stack-screenshot.png

---

## PAGE LAYOUT WIREFRAME (MOBILE-FIRST)
```
+-------------------------------------------------+
| [Logo] [☰]                                      |
|-------------------------------------------------|
|     DESERT DROP — GEM STACK                     |
|     [Play] [Settings] [How to Play]             |
|-------------------------------------------------|
|   [Canvas game area 16:9 ratio]                 |
|   Falling gem columns animate here              |
|-------------------------------------------------|
|   Score: 002350   Level: 3   Best: 008120       |
|-------------------------------------------------|
|   [⬅️] [🔄] [➡️] [⬇️] [⏬]   (touch controls)    |
|-------------------------------------------------|
|   Pause | Sound | Color Mode | Retry            |
+-------------------------------------------------+
```

---

## RESPONSIVENESS
- **Mobile:** 100% width, centered game area, touch controls visible.  
- **Tablet:** scales up proportionally; adds space for sidebars.  
- **Desktop:** keyboard control activation; game centered up to 960px wide.  

---

## TECHNICAL STACK
**HTML5 Canvas** — core rendering and collision logic.  
**JavaScript (Vanilla)** — game loop, input, and animation.  
**CSS3** — layout and animation transitions.  
**LocalStorage** — save high score and preferences.  
**No backend dependencies** — plays offline once cached.  

---

## FEATURE LIST
- Gravity cascade system  
- Combo multiplier  
- Local high score  
- Pause overlay  
- Mute toggle  
- Color-blind shapes toggle  
- Responsive UI buttons  
- Touch + keyboard control  

---

## PERFORMANCE OPTIMIZATION
- Sprite pooling (reuse instead of recreate).  
- `requestAnimationFrame()` for main loop.  
- Lightweight image compression.  
- Lazy-load assets after splash screen.  
- Target 60fps mobile performance.  

---

## AUDIO SYSTEM
**Files (in `/assets/sounds/`):**
| Filename | Role | Duration | Loop | Default Volume |
|-----------|------|----------|------|----------------|
| background-loop.mp3 | ambient desert rhythm | 30 s | ✅ | 0.3 |
| gem-match.mp3 | click + sparkle | 0.5 s | ❌ | 0.9 |
| line-clear.mp3 | whoosh / chime | 0.8 s | ❌ | 0.9 |
| level-up.mp3 | rising arpeggio | 1.2 s | ❌ | 1.0 |
| game-over.mp3 | soft descending tone | 1.5 s | ❌ | 0.8 |

**Behavior:**  
- Preload all MP3s on init; start background loop after first user gesture.  
- Bind events from gameplay:  
    - `onMatch()` → gem-match  
    - `onLineClear()` → line-clear  
    - `onLevelUp()` → level-up  
    - `onGameOver()` → stop bg + game-over  
- UI: `[data-audio="mute"]` toggles global mute.

---

## SPRITE SHEETS — SPECS & MAPPING (CANONICAL)
**Shared Rules**  
- Sheet size: **768×768 px**, transparent background  
- Grid: **3 columns × 3 rows** (total 9 cells)  
- Cell size: **256×256 px**  
- Coordinate origin: top-left of sheet  
- Cell coordinates:  
    Row 1: (0,0), (256,0), (512,0)  
    Row 2: (0,256), (256,256), (512,256)  
    Row 3: (0,512), (256,512), (512,512)  
- Indexing convention (row-major): indices **0..8** map left→right, top→bottom.

**File Locations**  
- `/assets/images/game/gem-sprites.png`  
- `/assets/images/game/level-badges.png`  
- `/assets/images/game/ui-overlays.png`

### 1) GEM SPRITES — `/assets/images/game/gem-sprites.png`
**Order (index → name):**  
0: green-triangle  
1: red-circle  
2: purple-hex  
3: blue-diamond  
4: red-heart  
5: cyan-teardrop  
6: yellow-square  
7: green-pentagon  
8: blue-octagon

**Usage notes:**  
- Single-frame sprites; renderer slices by `(col = index % 3, row = Math.floor(index / 3)) × 256`.

### 2) LEVEL BADGES — `/assets/images/game/level-badges.png`
**Order (index → color):**  
0: teal  
1: amber  
2: red  
3: blue  
4: purple  
5: green  
6: gold  
7: black  
8: silver

**Usage notes:**  
- Display near score panel; current level color is `(level - 1) % 9`.

### 3) UI OVERLAYS (BUTTON ICONS) — `/assets/images/game/ui-overlays.png`
**Order (index → icon):**  
0: play  
1: pause  
2: sound  
3: mute  
4: refresh  
5: rotate  
6: left  
7: down  
8: right

**Usage notes:**  
- Icons are white-on-transparent so we can tint via canvas or CSS overlay.  
- Minimum tap target: 48 px on mobile; scale accordingly.

**Reference Table (quick lookup)**  
    Index: 0   1      2         3          4         5            6            7              8
    Gems:  tri circle hex       diamond    heart     teardrop     square       pentagon       octagon
    Badges:teal amber  red      blue       purple    green        gold         black          silver
    UI:    play pause  sound    mute       refresh   rotate       left         down           right

---

## CORE JAVASCRIPT MODULES
**gem-stack.js**  
- Audio preloading & playback (`GameAudio` class).  
- Gesture-safe autoplay (background loop).  
- Event hooks: `onMatch()`, `onLineClear()`, `onLevelUp()`, `onGameOver()`.  
- Mute toggle via `[data-audio="mute"]`.  
- (Next pass) Canvas, input, grid state, collision, matching, scoring.

**Renderer (future extraction)**  
- Canvas init & scaling (mobile-first).  
- Sprite sheet slicing & drawing.  
- Input (touch + keyboard).  
- Game loop timing.

---

## UI & LAYOUT
**gem-stack.html**  
- Contains a centered `<canvas id="gameCanvas">`.  
- Overlay buttons using `/assets/images/game/ui-overlays.png`.  
- `data-game="play"` for Play; `data-audio="mute"` for Mute.

**gem-stack.css**  
- Canvas max-width: 100vw, max-height: 100vh.  
- Maintain 16:9 ratio with letterbox as needed.  
- Buttons sized ≥64 px, absolute overlay, safe margins ≥8%.

---

## HOMEPAGE INTEGRATION
- CTA: “Play Desert Drop — Gem Stack” → `/fun/gem-stack.html`  
- Logo Easter Egg: triple-click logo → open game page.  
- Open Graph image: `/assets/images/sheenas-adventures-game-gem-stack-screenshot.png`  
- SEO title: *Play Desert Drop — Gem Stack | Sheena’s Adventures*  
- Description: *Match gems, chase combos, and keep the desert glowing.*  

---

## DEPLOYMENT NOTES
- Hosted within main static build (Cloudflare Pages).  
- No additional Cloudflare Functions required.  
- `/fun/` excluded from blog JSON system.  
- Optional future: service worker for offline play.

---

## VALIDATION CHECKLIST
- [ ] Asset filenames exactly match this spec.  
- [ ] Sprite sheets exported at **768×768 px** (3×3 grid, 256 px cells).  
- [ ] MP3s uploaded to `/assets/sounds/` with durations listed above.  
- [ ] Mobile tap targets ≥ 44–48 px.  
- [ ] Background loop is seamless (no pop/click).  
- [ ] Color-blind and high-contrast modes function.

---

## CODE BLOCK GENERATION INSTRUCTIONS
When exporting or updating this GameBuild.md file, always wrap the **entire document** inside **one continuous quadruple-backtick code fence** so it can be copied or re-imported without breaks.  

Use this syntax:  
    \````markdown  
    (entire file content)  
    \````  

Rules:  
1. **Never** include triple-backtick fences inside.  
2. Indent code examples by four spaces.  
3. Start with `\````markdown` and end with `\```` exactly once.  
4. Keep this format for GitHub, Docs, or ChatGPT import stability.
