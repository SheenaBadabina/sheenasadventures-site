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
```
/fun/
├─ gem-stack.html          ← main page
├─ gem-stack.css           ← responsive layout
├─ gem-stack.js            ← gameplay logic
├─ assets/
│  ├─ gem-sprites.png      ← all gem colors/shapes
│  ├─ ui-icons.svg         ← pause/sound/retry icons
│  ├─ background.jpg       ← desert canyon background
│  └─ sfx/
│     ├─ pop.mp3
│     ├─ combo.mp3
│     └─ levelup.mp3
/assets/images/
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

## HOMEPAGE INTEGRATION
- CTA: “Play Desert Drop — Gem Stack” → `/fun/gem-stack.html`  
- Logo Easter Egg: triple-click logo → open game page.  
- Open Graph image: `/assets/images/sheenas-adventures-game-gem-stack-screenshot.png`  
- SEO title: *Play Desert Drop — Gem Stack | Sheena’s Adventures*  
- Description: *Match gems, chase combos, and keep the desert glowing.*  

---

## DEPLOYMENT NOTES
- Game hosted within main static build.  
- No additional Cloudflare Functions required.  
- `/fun/` excluded from blog JSON system.  
- Future version may cache via service worker for offline play.  

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
