# Sheena’s Adventures — Complete Style Guide

This document defines how we build, theme, and maintain **sheenasadventures.com**.  
It is the authoritative reference for structure, visuals, interactivity, and deployment.  
Everything here reflects the live production environment.

---

## SITE IDENTITY

**Name:** Sheena’s Adventures  
**Purpose:** Authentic Utah adventures with real rockhounding, field education, and interactive storytelling.  
**Logo:** /assets/logo-sheena.png  
**Banner:** /assets/banner-sheena.png  
**Domains:**  
- Primary: sheenasadventures.com  
- Preview: *.pages.dev

**External Links:**  
- YouTube (long-form adventures)  
- Instagram / Shorts (optional)

---

## REPOSITORY STRUCTURE

/
├─ index.html  
├─ adventures.html  
├─ game.html  
├─ work-with-me.html  
├─ about.html  
├─ contact.html  
├─ blog/  
│  ├─ index.html  
│  ├─ 2025-09-28-opalized-wood-yellow-cat-road.html  
│  ├─ meet-the-desert-dreamer.html  
│  └─ utah-desert-field-guide.html  
├─ assets/  
│  ├─ (All images, banners, logos, hero art, and covers)  
│  ├─ privacy-policy.txt  
│  └─ terms-of-use.txt  
├─ static/  
│  ├─ styles.css  
│  └─ js/  
│     └─ site.js  
├─ functions/  
│  ├─ contact-submit.js  
│  ├─ sponsor-submit.js  
│  └─ _lib-email.js  
└─ StyleGuide.md

Notes:
- No subfolders inside `/assets/`. Everything lives at a single level.  
- JSON blog fetch removed.  
- No newsletter or email collection.

---

## DESIGN SYSTEM

**Philosophy:**  
Real, breathable, mobile-first. Desert realism meets clarity.

**Color Tokens (in `:root`):**
- `--color-accent`: `#00BFA5`  
- `--color-bg`: `#0B0F12`  
- `--color-surface`: `#0F1419`  
- `--color-text`: `#D9E1E8`  
- `--color-muted`: `#92A1AD`  
- `--ring`: `#00BFA5`

**Typography:**  
- `system-ui, Inter, Roboto, Arial, sans-serif`  
- Base size 16px; line-height 1.7  
- One `<h1>` per page; `<h2>/<h3>` nested correctly.

**Layout:**  
- Max readable width 720–960px  
- Rounded corners 10–12px  
- Single column on phones; two columns ≥ 720px  
- Tap targets ≥ 44px tall; spacing 4/8px scale.

---

## ROTATING BANNER SYSTEM

**Location:** `/assets/`

**Purpose:** Seasonal and lifestyle banners cycle automatically via lightweight JS.

**Specs:**  
- Resolution 3840×2160 (4K landscape)  
- Format `.png` ≤ 3 MB  
- Safe margins: 10% on all sides for text/subjects  
- No cartoon effects; Utah-realistic photography

**Naming:**  
    sheenas-adventures-banner-[theme]-[subject]-utah

**Examples:**  
    sheenas-adventures-banner-spring-yucca-bloom-utah  
    sheenas-adventures-banner-summer-sunset-utah  
    sheenas-adventures-banner-autumn-canyon-utah  
    sheenas-adventures-banner-winter-desert-utah  
    sheenas-adventures-banner-lifestyle-rockhounding-utah  

**JS Behavior:**  
- `site.js` cycles banners every 15 s with fade transitions.  
- Quarter-based rotation by default; manual override possible via data attributes.  

**Text Branding:**  
- Only select lifestyle banners show “Sheena’s Adventures.”  
- Text color: yellow #FFD740 with orange #FF6F00 outline.  
- Centered or top-third alignment.

---

## GLOBAL COMPONENTS

**Header / Navigation:**  
    <header class="site-header">
      <a href="/" class="brand">Sheena’s Adventures</a>
      <button class="hamburger" aria-label="Menu">☰</button>
      <nav class="site-nav" data-collapsible>
        <a href="/adventures.html">Adventures</a>
        <a href="/game.html">Game</a>
        <a href="/blog/">Blog</a>
        <a href="/about.html">About</a>
        <a href="/work-with-me.html">Work With Me</a>
        <a href="/contact.html">Contact</a>
      </nav>
    </header>

Behavior:
- Mobile menu toggles `body.open`.  
- ESC closes; focus trapped; scroll locked.  
- Accessible focus outlines via `:focus-visible`.

---

## GAME FRAMEWORK & ANIMATION SYSTEM

**Purpose:**  
Bring adventure interactivity to life — short desert quests, geological puzzles, or exploration mini-scenes.

**Page:** `/game.html`

**Architecture:**  
- Pure front-end (no backend, no email collection).  
- JS-driven state machine for simple choices and transitions.  
- JSON removed; uses inline `<script type="application/x-game">` or direct JS objects.

**Animation Engine:**  
- Vanilla JS + CSS animations; lightweight (no libraries).  
- Parallax and fade transitions between sections.  
- Optional GSAP-style easing if added later.

**Example Structure:**  
    <section id="scene1" class="scene active">
      <img src="/assets/scene1-sunrise.png" alt="Desert sunrise">
      <button data-next="scene2">Explore the ridge →</button>
    </section>

    <section id="scene2" class="scene">
      <img src="/assets/scene2-rocks.png" alt="Rocks and fossils">
      <button data-next="scene3">Continue</button>
    </section>

`site.js` handles:
- Scene switching via `data-next` attributes.  
- Fade in/out transitions and sound triggers.  
- Optional ambient soundtrack hooks.

---

## BLOG SYSTEM — HTML-FIRST

**Rule:**  
Blog posts are pure HTML files in `/blog/`.  
Homepage and index dynamically use the *top blog block* from `/blog/index.html` as “latest.”

**How it works:**  
- `site.js` fetches `/blog/index.html`.  
- Extracts first `.story-card`.  
- Injects into `#latestBlog` on homepage.

**Post Requirements:**  
- Filename slug-based (`YYYY-MM-DD-title.html`).  
- Hero image `/assets/<slug>.png`.  
- `<title>` and `<meta name="description">`.  
- Alt text on hero image.  
- “Back to Blog” link.

---

## LEGAL TEXTS

**Files:**  
- /assets/privacy-policy.txt  
- /assets/terms-of-use.txt  

Each page loads text directly:
    fetch('/assets/privacy-policy.txt')
      .then(r => r.text())
      .then(t => document.getElementById('legal').textContent = t);

Displayed inside `<pre id="legal"></pre>`.  
Immutable — no client editing.

---

## CSS & JS

**Global CSS:** `/static/styles.css`  
- Color tokens  
- Header/nav styles  
- Hero, cards, toasts  
- Focus outlines  
- Animation helpers (`.fade-in`, `.fade-out`, `.parallax`)

**Global JS:** `/static/js/site.js`  
Handles:
- Nav toggle  
- Banner rotation  
- Game state transitions  
- Blog “latest” fetch  
- Toasts

**Toast Example:**  
    #toast {
      background: rgba(0,191,165,0.20);
      border: 1px solid #00BFA5;
      color: #00E7CC;
      padding: 1rem;
      border-radius: 10px;
      text-align: center;
      font-weight: 500;
      box-shadow: 0 0 10px rgba(0,191,165,0.30);
      animation: fadeIn .6s ease-out;
    }

---

## DEPLOYMENT

**Cloudflare Pages**  
- Project: `sheenas-adventures`  
- Build: static (no build command)  
- Output: `/`  
- Functions auto-detected in `/functions/`  

**Domains:**  
- sheenasadventures.com (live)  
- *.pages.dev (staging)  

---

## MAINTENANCE RULES

- Commit full files with clear, descriptive messages.  
- Avoid inline CSS/JS; keep global in `/static/`.  
- Use kebab-case filenames.  
- Test mobile responsiveness before deploy.  
- Update banner set quarterly.  
- Verify animations load smoothly before publishing.

---

## SUMMARY

This Style Guide defines the modern Sheena’s Adventures site:
- No forms or newsletter logic  
- All assets in `/assets/`  
- Rotating banners  
- Animated game and parallax framework  
- HTML-first blog system  
- Lightweight, accessible, mobile-first foundation

---

## CODE BLOCK GENERATION INSTRUCTIONS

When exporting or updating this file, wrap the **entire document** in one quadruple-backtick code block labeled `markdown`:

    \````markdown
    (full style guide)
    \````

Do not nest triple backticks inside; use indentation for inner code.
