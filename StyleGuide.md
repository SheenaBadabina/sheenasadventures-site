# Sheena’s Adventures — Complete Style Guide

This document defines how we build, theme, and maintain **sheenasadventures.com**. It is the single source of truth for structure, assets, filenames, blog and legal workflows, forms, functions, and deployment.

---

## SITE IDENTITY

**Name:** Sheena’s Adventures  
**Purpose:** Authentic Utah adventures with real rockhounding, field education, and brand partnerships.  
**Logo:** /assets/logo-sheena.png  
**Banner:** /assets/banner-sheena.png  
**Current Domains:**  
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
├─ work-with-me.html  
├─ about.html  
├─ contact.html  
├─ blog/  
│  ├─ index.html  
│  ├─ 2025-09-28-opalized-wood-yellow-cat-road.html  
│  ├─ meet-the-desert-dreamer.html  
│  └─ utah-desert-field-guide.html  
├─ assets/  
│  ├─ images/ (hero, gallery, blog covers)  
│  ├─ posts.json  (authoritative list of blog posts; newest first)  
│  └─ legal/  
│     ├─ privacy-policy.txt  
│     └─ terms-of-use.txt
├─ static/  
│  ├─ styles.css   (global CSS)  
│  └─ js/  
│     └─ site.js   (global JS: menu toggle, latest-post feature, toasts)
├─ functions/  
│  ├─ contact-submit.js  
│  ├─ sponsor-submit.js  
│  └─ _lib-email.js
└─ StyleGuide.md

Notes:
- Existing pages that already work stay put. This guide standardizes naming and behavior going forward.
- If an asset already lives elsewhere (e.g., legacy `/assets/*.png`), keep it, but migrate new art into `/assets/images/`.

---

## DESIGN SYSTEM

**Philosophy:**  
Real, legible, mobile-first. Clean, breathable layouts with desert-inspired imagery and clear hierarchy.

**Color Tokens (CSS Custom Properties):**  
Define these in `:root` and use everywhere.

- `--color-accent` — primary accent (teal family) — `#00BFA5`  
- `--color-bg` — page background — `#0B0F12`  
- `--color-surface` — cards/sections — `#0F1419`  
- `--color-text` — primary text — `#D9E1E8`  
- `--color-muted` — secondary text — `#92A1AD`  
- `--ring` — focus ring color — `#00BFA5`

**Typography:**  
- UI: `system-ui, Inter, Roboto, Arial, sans-serif`  
- Body size: 16px; line-height: 1.7  
- Headings: clamp for mobile-first scale  
- One `<h1>` per page; subsections use `<h2>`/`<h3>` as needed

**Layout:**  
- Max readable width: 720–960px depending on context  
- Rounded corners: 10–12px  
- Grid: single column on phones; two columns ≥ 720px when appropriate  
- Tap targets ≥ 44px height; spacing on a 4/8px scale

**Imagery:**  
- `max-width:100%; height:auto; display:block;`  
- Use `object-fit:cover` for hero/feature banners  
- Provide descriptive `alt` text for every image

---

## BANNER SYSTEM

**Purpose:**  
Defines consistent creative standards for homepage and rotating banners used across *Sheena’s Adventures*.

**Structure & Location:**  
All banner images live in:  
/assets/images/banners/

**Image Specs:**  
- **Resolution:** 3840×2160 (4K landscape)  
- **File type:** `.png`  
- **Compression:** lossless for clarity, ≤ 3 MB recommended  
- **Safe zones:** avoid placing critical elements or text within 10% of the image edges  
- **Usage:** banners auto-rotate or appear seasonally

**Naming Convention (SEO / AEO / GEO Optimized):**
    sheenas-adventures-banner-[theme]-[subject]-utah

**Examples:**
    sheenas-adventures-banner-spring-yucca-bloom-utah  
    sheenas-adventures-banner-summer-sunset-utah  
    sheenas-adventures-banner-autumn-canyon-hues-utah  
    sheenas-adventures-banner-winter-snow-desert-utah  
    sheenas-adventures-banner-lifestyle-utah-desert  
    sheenas-adventures-banner-rockhounding-agate-utah  
    sheenas-adventures-banner-landscape-canyon-utah

**Text & Branding Rules:**  
- Only select banners (e.g., lifestyle or rockhounding) include the phrase “Sheena’s Adventures.”  
- When used, text color: **yellow (#FFD740)** with **orange outline (#FF6F00)**.  
- Font style: smooth sans-serif, bold, clean edges, no texture.  
- Center or upper-third placement for best contrast.

**Tone & Composition:**  
- Realistic photography only — no cartoon or AI-artifact effects.  
- Natural Utah desert tones; warm highlights preferred.  
- Composition follows a clear visual hierarchy: strong subject balance and open sky space for text when applicable.

**Purpose of Rotation:**  
- Seasonal banners refresh automatically by quarter.  
- Permanent banners (lifestyle, rockhounding, landscape) stay in year-round rotation.  
- All banners complement the logo and background tone without overpowering site text.

---

## GLOBAL COMPONENTS

**Header / Navigation:**  
- Structure:
    <header class="site-header">
      <a href="/" class="brand">Sheena’s Adventures</a>
      <button class="hamburger" aria-label="Menu">☰</button>
      <nav class="site-nav" data-collapsible>
        <a href="/work-with-me.html">Work With Me</a>
        <a href="/adventures.html">Adventures</a>
        <a href="/blog/">Blog</a>
        <a href="/about.html">About</a>
        <a href="/contact.html">Contact</a>
      </nav>
    </header>
- Behavior:
    - `.hamburger` toggles `body.open` (mobile menu).  
    - Focus visible on all links/buttons.  
    - Escape key closes menu; body scroll locked when open (handled in `static/js/site.js`).

**Hero Section:**  
- Used on homepage and key landers:
    <main class="hero">
      <h1>Authentic Utah adventures. Real rockhounding. Real stories.</h1>
      <p>Brand-safe filmmaking from the desert.</p>
      <p>
        <a class="btn" href="/work-with-me.html">Work With Me</a>
        <a class="btn secondary" href="https://www.youtube.com/@sheenasadventures" target="_blank" rel="noopener">Watch on YouTube</a>
      </p>
    </main>

**Cards & Grid:**  
- `.grid` wraps `.card` items with consistent gutters and padding.  
- Cards contain a heading, short text, and an optional `.text-link` or `.btn`.

**Buttons & Links:**  
- `.btn` for primary actions (accent background, dark text).  
- `.btn.secondary` for outlined/ghost variant.  
- `.text-link` for inline calls (“Read →”), with underline on hover and focus ring.

**Footer:**  
- Standard legal line and key links:
    <footer class="site-footer">
      <p>© <span id="y"></span> Sheena’s Adventures •
        <a href="https://www.youtube.com/@sheenasadventures" target="_blank" rel="noopener">YouTube</a> •
        <a href="/contact.html">Contact</a>
      </p>
    </footer>

---

## BLOG WORKFLOW — HTML PAGES, JSON AS SOURCE OF TRUTH

**Rule:**  
Blog posts are HTML files in `/blog/`. A JSON index at `/assets/posts.json` is the **source of truth** for homepage features and the blog index listing order (newest first).

**Files per Post:**  
- HTML page: `/blog/<slug>.html`  
- Cover image: `/assets/images/<slug>.png` (or `.jpg`)  
- Entry in `/assets/posts.json`

**Post HTML Essentials:**  
- `<title>`, `<meta name="description">`  
- A hero image (`<figure>`) with a descriptive `alt`  
- Accessible heading structure (`<h1>` then sections with `<h2>`/`<h3>`)  
- “Back to Blog” link at end

**posts.json Schema (ordered newest → oldest):**
    [
      {
        "title": "Opalized Wood on Yellow Cat Road",
        "slug": "2025-09-28-opalized-wood-yellow-cat-road",
        "date": "2025-09-28",
        "description": "Sometimes the desert's greatest gifts come disguised as something ordinary.",
        "image": "/assets/images/opalized-wood-yellow-cat-road.png",
        "link": "/blog/2025-09-28-opalized-wood-yellow-cat-road.html",
        "youtube": "https://www.youtube.com/@sheenasadventures",
        "tags": ["opalized-wood","yellow-cat","field-notes"]
      }
    ]

Notes:
- Put the newest post at index `0`.  
- `slug` should match the filename (without `.html`).  
- `description` is the teaser used on cards.

---

## BLOG INDEX PAGE

The index at `/blog/` renders a grid of cards. Prefer generating the list from `/assets/posts.json` for consistency.

**Card Markup (when hardcoded or server-rendered):**
    <a class="card story-card" href="/blog/2025-09-28-opalized-wood-yellow-cat-road.html">
      <img src="/assets/images/opalized-wood-yellow-cat-road.png" alt="Opalized wood with preserved bark textures" loading="lazy">
      <h3>Opalized Wood on Yellow Cat Road</h3>
      <p>Sometimes the desert's greatest gifts come disguised as something ordinary.</p>
    </a>

**JSON-Driven (preferred) in `static/js/site.js`:**
- Fetch `/assets/posts.json` (no-store).  
- Build the grid from the array.  
- Ensure keyboard focus and ARIA label on each card.

---

## HOMEPAGE — LATEST BLOG FEATURE

The homepage features the newest blog (DB&WH “smart latest item” pattern, adapted):

**Flow:**  
- Script fetches `/assets/posts.json`.  
- Picks `posts[0]`.  
- Renders image, title, teaser, and “Read Now” button into `#latestBlog`.

**Example container (HTML):**
    <section class="latest">
      <h2>Latest Blog</h2>
      <div id="latestBlog" class="card"><p>Loading latest blog…</p></div>
    </section>

**Resilience:**  
- On failure, show a friendly fallback (“Could not load the latest blog”).  
- Keep the section lightweight and non-blocking.

---

## LEGAL PAGES — IMMUTABLE TEXT

All legal copy is stored as raw `.txt` in `/assets/legal/`.

**Files:**
    /assets/legal/privacy-policy.txt
    /assets/legal/terms-of-use.txt

**Loading pattern (inside each legal HTML page):**
    fetch('/assets/legal/terms-of-use.txt', { cache: 'no-store' })
      .then(r => r.text())
      .then(t => { document.getElementById('legal').textContent = t; });

Displayed inside:
    <pre id="legal"></pre>

No scripts modify or sanitize legal text dynamically.

---

## FORMS & FUNCTIONS

**Forms:**  
- `/contact.html` → `/functions/contact-submit`  
- `/work-with-me.html` → `/functions/sponsor-submit`  
- Turnstile widget inline:
    <div class="cf-turnstile" data-sitekey="YOUR_TURNSTILE_SITE_KEY"></div>

**Functions:**  
- Cloudflare Pages Functions with `onRequestPost`  
- Verify Turnstile via `TURNSTILE_SECRET_KEY`  
- Send email via Resend using `_lib-email.js` helper  
- Env vars:
    - `RESEND_API_KEY` (Secret)  
    - `TURNSTILE_SECRET_KEY` (Secret)  
    - `TO_EMAIL` (Plain or Secret)  
    - `FROM_EMAIL` (Plain or Secret)

**Success behavior:**  
- Redirect with `?sent=1` and render a teal toast.

---

## NEWSLETTER SIGNUP SYSTEM

**Purpose:**  
Collect newsletter subscribers directly into an internal database before syncing with Mailchimp or any external service. This ensures brand transparency and future flexibility.

**Architecture:**  
- **Frontend:**  
    - Simple form on homepage and/or footer.  
    - Fields: `name` (optional), `email` (required).  
    - Submits via POST to `/functions/subscribe.js`.  

- **Backend:**  
    - Cloudflare Pages Function `/functions/subscribe.js`.  
    - Validates and sanitizes input.  
    - Writes to D1 table `newsletter_signups` with columns:  
          id (UUID)  
          name (TEXT, nullable)  
          email (TEXT, unique)  
          created_at (TIMESTAMP)  
          source_page (TEXT)  
    - Sends confirmation email via Resend using `_lib-email.js`.  

- **Confirmation Email:**  
    - Sent from `Sheena’s Adventures <contact@sheenasadventures.com>`.  
    - Subject: “Welcome to Sheena’s Adventures 🌵”  
    - Body (plaintext): short thank-you and unsubscribe instructions.  
    - Triggered only after successful DB insert.  

- **Future Integration:**  
    - A scheduled Cloudflare Worker (cron) will batch-sync new signups to Mailchimp via API.  
    - This process will be invisible to users; only disclosed in `/assets/legal/privacy-policy.txt`.  
    - Newsletter sending handled by Mailchimp until TEALStudio internal sender is ready.

- **Frontend Behavior:**  
    - On success → teal toast: “Welcome aboard! You’ll hear from Sheena soon.”  
    - On error → muted toast: “Couldn’t subscribe right now. Please try again later.”  
    - Prevent duplicate emails and show client-side validation.

**Environment Variables:**  
    - `RESEND_API_KEY` (Secret)  
    - `TO_EMAIL` (Plain or Secret — confirmation destination)  
    - `FROM_EMAIL` (Plain or Secret — set to contact@sheenasadventures.com)

**Accessibility:**  
    - Labels and ARIA roles for form fields.  
    - Focus state on button.  
    - Success/failure messages announced via `aria-live`.

**Data Privacy:**  
    - Emails stored securely in D1; no public API exposure.  
    - Sync and deletion follow GDPR-style best practices.  
    - Privacy policy mentions Mailchimp and Resend integrations.

**File Summary:**  
    - `/functions/subscribe.js` — handles signup POST.  
    - `/functions/_lib-email.js` — handles sending via Resend.  
    - `/static/js/site.js` — optional front-end validation helper.

---

## CSS GUIDELINES

All global styles live in `/static/styles.css`. Keep page-local CSS to layout glue only.

**Minimum global rules to include:**
- Base resets (box-sizing, image responsiveness)  
- Color tokens in `:root` (see Design System)  
- Header/nav (mobile-first; `.hamburger` + `body.open`)  
- `.hero`, `.grid`, `.card`, `.btn`, `.text-link`, `.site-footer`  
- Focus styles:
    :focus-visible { outline: 2px solid var(--ring); outline-offset: 2px; }

**Toast (success/fail):**
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
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to   { opacity: 1; transform: none; }
    }

---

## ACCESSIBILITY & SEO

- One `<h1>` per page; logical heading order  
- Descriptive `alt` on every image  
- Visible focus outlines on all interactive elements  
- Color contrast meets WCAG AA  
- Each page has `<title>` and `<meta name="description">`  
- Use `aria-current="page"` on active nav item  
- Consider `<time datetime="YYYY-MM-DD">` on blog cards

---

## DEPLOYMENT

**Cloudflare Pages**  
- Project: `sheenas-adventures`  
- Build command: none (static HTML)  
- Output directory: `/`  
- Functions auto-detected from `/functions/`

**Custom Domain:**  
- Add `sheenasadventures.com` under Pages → Custom Domains  
- Keep `.pages.dev` as staging  
- DNS managed automatically after linking

---

## NEW BLOG CHECKLIST

1. Create `/blog/<slug>.html` (title, description, hero image, content).  
2. Add cover image to `/assets/images/<slug>.png`.  
3. Prepend a new object to `/assets/posts.json` (newest at index 0).  
4. Verify link and image paths.  
5. Confirm homepage “Latest Blog” renders correctly.  
6. Confirm `/blog/` index lists it (JSON-driven or manual card).  
7. Test forms if the post links to contact/sponsor CTAs.  
8. Deploy and smoke test on mobile.

---

## MAINTENANCE RULES

- Keep global CSS in `/static/styles.css` (avoid inline CSS drift).  
- Keep global JS in `/static/js/site.js`.  
- Use kebab-case filenames; no spaces or caps.  
- Commit full files with clear messages:
    feat(blog): add <slug>
    fix(nav): trap focus on mobile menu
    style(css): adjust card padding

---

## SUMMARY

Sheena’s Adventures runs as a clean static site on Cloudflare Pages. Blog content lives as HTML pages, with a JSON index (`/assets/posts.json`) powering homepage features and the blog index. Global CSS/JS ensure consistent header, nav, cards, and footer. This guide is authoritative; update it when structure or tokens change.

---

## JSON SMART UPDATE SYSTEM

The homepage and Blog Index automatically load the most recent post from `/assets/posts.json`.

**Example entry:**
    {
      "title": "Opalized Wood on Yellow Cat Road",
      "slug": "2025-09-28-opalized-wood-yellow-cat-road",
      "date": "2025-09-28",
      "description": "Sometimes the desert's greatest gifts come disguised as something ordinary.",
      "image": "/assets/images/opalized-wood-yellow-cat-road.png",
      "link": "/blog/2025-09-28-opalized-wood-yellow-cat-road.html",
      "youtube": "https://www.youtube.com/@sheenasadventures",
      "tags": ["opalized-wood","yellow-cat","field-notes"]
    }

**Homepage script responsibilities (in `/static/js/site.js`):**
- Fetch `/assets/posts.json` with `{ cache: 'no-store' }`.  
- Pick the first array item.  
- Render into `#latestBlog`:
    - image (with `alt`), title, description, “Read Now” button.  
- Handle network failure with a friendly fallback.

---

## CODE BLOCK GENERATION INSTRUCTIONS

When exporting or updating this StyleGuide.md file, always wrap the **entire document** inside **one continuous quadruple-backtick code fence** so it can be copied or re-imported without breaks.

Use this syntax:

    \````markdown
    (your entire style guide content)
    \````

Important rules:
1. **Never** include additional triple-backtick fences inside the file.  
2. For all inner examples (HTML, JS, CSS, JSON), use **four-space indentation** instead of backticks.  
3. Start the block with  
    \````markdown  
   and end it with  
    \````  
   exactly once.  
4. Keep the language identifier “markdown” after the first fence for readability.  
5. This format ensures the file can be pasted into GitHub, Docs, or ChatGPT without splitting into multiple “Copy code” boxes
