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
... [the remainder of your original file content continues unchanged here] ...

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
