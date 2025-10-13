# Sheena's Adventures — Game Build Specification

**Project:** Desert Drop — Gem Stack  
**Purpose:** Define the design, structure, and implementation plan for the official Sheena's Adventures web game.  
**Version:** 2.2 (Polished with Juice Effects)  
**Last Updated:** October 2025

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
Fast, intuitive, beautiful, and accessible. Designed for casual visitors who may not normally play games but are drawn in by the Sheena's Adventures brand.

**Visual Identity:**  
- Clean desert palette: sandstone, agate, and twilight hues.
- Minimalist UI integrated with Sheena's Adventures aesthetic.
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
- Base: 100 points for a 3-match
- +50 points per additional gem in that match
- Combo multiplier: +10% per chain after first

**Difficulty:**  
- Level increases after every 10 clears.
- Speed and number of gem colors rise progressively.

---

## ACCESSIBILITY

- Touch controls ≥ 48px height (56px for sustained play).
- Keyboard support for desktop (arrows + space).
- Desktop users: on-screen controls hidden, keyboard-only.
- High-contrast mode toggle support.
- Screen reader labels and proper ARIA attributes.
- Reduced motion support for animations.

---

## FILE STRUCTURE

```
/fun/
  ├─ gem-stack.html          ← main page
  ├─ gem-stack.css           ← responsive layout
  ├─ gem-stack.js            ← gameplay logic
  └─ GameBuild.md            ← this file
/assets/
  ├─ background-loop.mp3
  ├─ gem-match.mp3
  ├─ line-clear.mp3
  ├─ level-up.mp3
  ├─ game-over.mp3
  ├─ pop.mp3                 ← optional
  ├─ gem-sprites.png
  ├─ level-badges.png
  ├─ ui-icons.png
  ├─ background-sky-canyon.png
  ├─ sheenas-adventures-game-gem-stack-thumb.png
  └─ sheenas-adventures-game-gem-stack-screenshot.png
```

---

## PAGE LAYOUT WIREFRAME (MOBILE-FIRST)

```
+-------------------------------------------------+
| [Logo] [☰]                                      |
|-------------------------------------------------|
|     DESERT DROP — GEM STACK                     |
|     [Play] [Mute]                               |
|-------------------------------------------------|
|   Score: 002350   Level: 3   Best: 008120       |
|-------------------------------------------------|
|   ┌─────────────────────────────────┐           |
|   │  [Canvas game area]             │           |
|   │  Falling gem columns here       │           |
|   └─────────────────────────────────┘           |
|-------------------------------------------------|
|     [⬅️]  [↻]  [➡️]                              |
|       [▼]    [⤓]      (touch controls)          |
|-------------------------------------------------|
|   ▼ How to Play (expandable)                    |
+-------------------------------------------------+
```

---

## RESPONSIVENESS

- **Mobile:** 100% width, centered game area, touch controls visible.
- **Tablet:** Scales up proportionally; adds space for sidebars.
- **Desktop (≥720px):** 
  - Hides touch controls (keyboard only).
  - Canvas max-width 600px.
  - Header arranged horizontally.

---

## TECHNICAL STACK

**HTML5 Canvas** — core rendering and collision logic.  
**JavaScript (Vanilla)** — game loop, input, and animation.  
**CSS3** — layout and animation transitions.  
**LocalStorage** — save high score and preferences.  
**No backend dependencies** — plays offline once cached.

---

## FEATURE LIST

### **Core Gameplay:**
- ✅ Gravity cascade system
- ✅ Combo multiplier (10% per chain)
- ✅ Local high score persistence
- ✅ Mute toggle
- ✅ Responsive UI buttons
- ✅ Touch + keyboard control
- ✅ Desktop: keyboard-only mode
- ✅ Mobile: on-screen touch controls

### **Polish & Juice Effects:**
- ✅ **Match flash** - Gems flash white before clearing
- ✅ **Screen shake** - Dramatic shake on game over
- ✅ **Particle effects** - Golden sparkles burst from cleared gems
- ✅ **Chain display** - "2x CHAIN!" text appears during combos
- ✅ **Ghost preview** - Faint outline shows where column will land
- ✅ **Button feedback** - Buttons "squish" when pressed for tactile feel

---

## PERFORMANCE OPTIMIZATION

- `requestAnimationFrame()` for main loop.
- Lightweight image compression.
- Lazy-load assets after splash screen.
- Target 60fps mobile performance.
- Sub-pixel sprite rendering for smooth visuals.

---

## AUDIO SYSTEM

**Files (in `/assets/`):**

| Filename | Role | Duration | Loop | Default Volume |
|-----------|------|----------|------|----------------|
| background-loop.mp3 | ambient desert rhythm | 30 s | ✅ | 0.3 |
| gem-match.mp3 | click + sparkle | 0.5 s | ❌ | 0.9 |
| line-clear.mp3 | whoosh / chime | 0.8 s | ❌ | 0.9 |
| level-up.mp3 | rising arpeggio | 1.2 s | ❌ | 1.0 |
| game-over.mp3 | soft descending tone | 1.5 s | ❌ | 0.8 |
| pop.mp3 | optional pop effect | 0.3 s | ❌ | 0.8 |

**Behavior:**  
- Preload all MP3s on init; start background loop after first user gesture.
- Bind events from gameplay:
  - `onMatch()` → gem-match
  - `onLineClear()` → line-clear
  - `onLevelUp()` → level-up
  - `onGameOver()` → stop bg + game-over + pop (optional)
- UI: `[data-audio="mute"]` toggles global mute.

---

## SPRITE SHEETS — SPECS & MAPPING (CANONICAL)

**IMPORTANT: AI-Generated Images**  
All sprite sheets were created using AI image generation. Actual dimensions are **1024×1024** pixels, not 768×768 as originally planned.

**Shared Rules**  
- Sheet size: **1024×1024 px**, transparent background
- Grid: **3 columns × 3 rows** (total 9 cells)
- Cell size: **341.333×341.333 px** (1024 ÷ 3)
- Coordinate origin: top-left of sheet
- Cell coordinates (fractional values for precision):
  - Row 1: (0, 0), (341.33, 0), (682.67, 0)
  - Row 2: (0, 341.33), (341.33, 341.33), (682.67, 341.33)
  - Row 3: (0, 682.67), (341.33, 682.67), (682.67, 682.67)
- Indexing convention (row-major): indices **0..8** map left→right, top→bottom.

**File Locations**  
- `/assets/gem-sprites.png`
- `/assets/level-badges.png`
- `/assets/ui-icons.png`

### 1) GEM SPRITES — `/assets/gem-sprites.png`

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
- Single-frame sprites; renderer slices by fractional coordinates.
- JavaScript uses `SPRITE_CELL = 1024 / 3` for sub-pixel precision.

### 2) LEVEL BADGES — `/assets/level-badges.png`

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

### 3) UI ICONS (BUTTON ICONS) — `/assets/ui-icons.png`

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

```
Index: 0   1      2      3     4       5        6     7        8
Gems:  tri circle hex    dia   heart   tear     sq    pent     oct
Badge: tea amber  red    blue  purple  green    gold  black    silver
UI:    ply pause  sound  mute  refresh rotate   left  down     right
```

---

## CORE JAVASCRIPT MODULES

**gem-stack.js**  
- Audio preloading & playback (`GameAudio` class).
- Gesture-safe autoplay (background loop).
- Event hooks: `onMatch()`, `onLineClear()`, `onLevelUp()`, `onGameOver()`.
- Mute toggle via `[data-audio="mute"]`.
- Canvas init & scaling (mobile-first).
- Sprite sheet slicing with fractional coordinates.
- Input (touch + keyboard).
- Game loop timing with `requestAnimationFrame()`.
- Grid state, collision, matching, scoring.

---

## UI & LAYOUT

**gem-stack.html**  
- Contains a `<canvas id="gameCanvas">` inside `.canvas-shell` wrapper.
- Overlay buttons using data attributes.
- `data-game="play"` for Play; `data-audio="mute"` for Mute.
- `data-control="left|right|down|drop|rotate"` for on-screen controls.
- `.pill` class for HUD display (score/level/best).

**gem-stack.css**  
- Canvas in `.canvas-shell` with 16:9-ish aspect, max 600px on desktop.
- Buttons sized ≥48px mobile, ≥56px for sustained controls.
- 3-column grid for touch controls:
  - Row 1: Left, Rotate, Right
  - Row 2: Soft Drop (col 1), Hard Drop (col 3) — centered layout
- Desktop (≥720px): hides `.controls.on-screen`, keyboard-only mode.

---

## HTML/CSS CLASS STRUCTURE

**Key Classes:**
- `.game-wrap` — Main container (max-width 960px)
- `.game-title` — H1 title styling
- `.btn` — Primary button style
- `.btn.secondary` — Secondary button variant (mute)
- `.canvas-shell` — Canvas wrapper with aspect ratio
- `.pill` — HUD badge styling
- `.ctrl` — On-screen control buttons
- `.controls.on-screen` — Touch control container (hidden on desktop)
- `.controls.primary` — Primary button group (Play/Mute)

---

## HOMEPAGE INTEGRATION

- CTA: "Play Desert Drop — Gem Stack" → `/fun/gem-stack.html`
- Logo Easter Egg: triple-click logo → open game page.
- Open Graph image: `/assets/sheenas-adventures-game-gem-stack-screenshot.png`
- SEO title: *Play Desert Drop — Gem Stack | Sheena's Adventures*
- Description: *Match gems, chase combos, and keep the desert glowing.*

---

## DEPLOYMENT NOTES

- Hosted within main static build (Cloudflare Pages).
- No additional Cloudflare Functions required.
- `/fun/` excluded from blog JSON system.
- Optional future: service worker for offline play.

---

## VALIDATION CHECKLIST

- [x] Asset filenames exactly match this spec.
- [x] Sprite sheets are **1024×1024 px** (3×3 grid, 341.33 px cells).
- [x] MP3s uploaded to `/assets/` with durations listed above.
- [x] Mobile tap targets ≥ 48–56 px.
- [x] Background loop is seamless (no pop/click).
- [x] Desktop hides touch controls (keyboard-only).
- [x] JavaScript uses `SPRITE_CELL = 1024 / 3` for precision.
- [x] HTML uses `.pill` class for HUD items.
- [x] Canvas wrapped in `.canvas-shell` div.

---

## TESTING CHECKLIST

After deployment, verify:

1. **Visual:**
   - [ ] Canvas displays with desert background
   - [ ] Gems render correctly (no distortion/gaps)
   - [ ] HUD shows score/level/best in pill badges
   - [ ] Buttons have proper sizing and spacing

2. **Functionality:**
   - [ ] Click Play → game starts
   - [ ] Background music plays after Play click
   - [ ] Keyboard controls work (arrows + space)
   - [ ] Touch controls work on mobile (visible)
   - [ ] Touch controls hidden on desktop
   - [ ] Mute button toggles audio
   - [ ] Gems fall and can be moved/rotated
   - [ ] Matching 3+ gems clears them
   - [ ] Gravity makes gems fall after clears
   - [ ] Chains increase score with 10% bonus
   - [ ] Level increases every 10 clears
   - [ ] Game over when stack reaches top
   - [ ] High score persists in localStorage

3. **Responsive:**
   - [ ] Mobile layout (vertical, controls visible)
   - [ ] Desktop layout (horizontal header, no touch controls)
   - [ ] Canvas scales properly on different screens

4. **Browser Console:**
   - [ ] No 404 errors on assets
   - [ ] No JavaScript errors
   - [ ] Audio loads successfully (check network tab)

---

## TROUBLESHOOTING

### Sprites don't render:
- Verify files are in `/assets/` directory
- Check file names match exactly (case-sensitive on some servers)
- Look for 404 errors in browser console (F12)
- Ensure images are actually 1024×1024 px

### No audio:
- Must click Play button first (browser autoplay policy)
- Check mute button isn't activated
- Verify audio files uploaded to `/assets/`
- Some browsers block autoplay — user gesture required

### Controls don't work:
- Verify JavaScript loaded (check console)
- Ensure clicked Play to start game
- Try keyboard controls (arrows + space)
- Check data attributes match between HTML/JS

### Layout broken:
- Clear browser cache (Ctrl+Shift+R / Cmd+Shift+R)
- Verify CSS file loaded properly
- Check for conflicting global site styles
- Ensure `.canvas-shell` wrapper exists in HTML

---

## CHANGELOG

**v2.2 (October 2025) — Polished Production Release** ✨
- ✨ Added match flash effect (gems flash white before clearing)
- ✨ Added screen shake on game over
- ✨ Added particle sparkles when gems clear (golden burst)
- ✨ Added chain counter display ("2x CHAIN!" text)
- ✨ Added ghost preview (shows where column will land)
- ✨ Improved button feedback (squish animation on press)
- ✨ Enhanced visual polish and game feel

**v2.1 (October 2025) — Production Release**
- ✅ Fixed sprite dimensions: 1024×1024 (was 768×768)
- ✅ Updated sprite cell calculation: 341.33px (was 256px)
- ✅ Fixed HTML/CSS class mismatches
- ✅ Added `.canvas-shell` wrapper
- ✅ Restructured touch controls (3-col grid, 2 rows)
- ✅ Desktop: hide touch controls, keyboard-only
- ✅ Improved button states and visual feedback
- ✅ Updated documentation to match implementation

**v2.0 (October 2025) — Initial Corrections**
- Corrected AI-generated sprite specifications
- Fixed asset path references
- Aligned HTML/CSS class names

**v1.0 (October 2025) — Initial Draft**
- Original specification created

---

## NOTES FOR FUTURE DEVELOPMENT

**Potential Enhancements:**
- Power-ups (Shimmer Gem, Canyon Bomb, Fossil Blocker)
- Particle effects on matches
- Animated level-up transitions
- Leaderboard integration
- Color-blind mode with distinct shapes
- Progressive Web App (PWA) support
- Touch gesture improvements (swipe to move)

**Known Limitations:**
- No online multiplayer
- No mobile app version (web-only)
- LocalStorage only (no cloud sync)
- Single game mode

---

## CREDITS

**Design & Development:** Sheena's Adventures  
**Assets:** AI-generated sprites and images  
**Inspiration:** Classic Columns/Tetris mechanics  
**Music & SFX:** Custom audio (to be created)

---

**END OF SPECIFICATION**
