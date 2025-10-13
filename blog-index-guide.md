# Blog Index Guide

**File:** `blog/index.html`  
**Branch:** `main`  
**Purpose:** Defines the official layout and structure for the Sheena’s Adventures blog index page.

---

## Overview
This page serves as the **titles-only** index for all blog posts.  
No thumbnails, summaries, or excerpts are displayed.  
It is clean, mobile-first, and fully styled by existing site-wide CSS and JavaScript.

---

## Included Files & Assets
- **Logo:** `/assets/logosheenas-adventures-logo-bubble-braids.png`  
- **Favicon:** `/assets/sheenas-adventures-favicon-logo.png`  
- **Banner:** `/assets/sheenas-adventures-banner-lifestyle-utah-desert.png`  
- **Styles:** `/static/styles.css`  
- **Script:** `/static/js/site.js`

---

## Page Structure

### `<head>`
- Sets document metadata and favicon.
- Links to `static/styles.css`.
- Defers the global script `static/js/site.js`.

### `<body class="page-blog">`
Contains four main sections:

1. **Header**
   - Displays the site logo in the **top-right corner**.
   - Logo links to the homepage (`/`).
   - Uses `.site-header` and `.site-logo` classes.

2. **Main Content**
   - Title: `<h1 class="page-title">Blog</h1>`
   - Navigation list of blog posts:
     - `<ul class="blog-list">`
     - Each post is represented by a single `<li><a></a></li>` item.
     - Posts are manually ordered; the first item is the “latest blog” for global script logic.

3. **Footer**
   - Contains copyright.
   - The footer year is injected dynamically by `site.js`.

4. **Banner**
   - The background banner (`/assets/sheenas-adventures-banner-lifestyle-utah-desert.png`) is handled **via CSS**, not HTML.

---

## Blog Order (Current)

1. `/blog/pigeon-blood-agate.html`  
2. `/blog/2025-09-28-opalized-wood-yellow-cat-road.html`  
3. `/blog/utah-desert-field-guide.html`  
4. `/blog/meet-the-desert-dreamer.html`

---

## Behavior Notes
- The global JavaScript reads the **first blog link** on this page to display the “Latest Blog” across the site.
- All layout, animations, and interactions come from `static/js/site.js` and `static/styles.css`.
- No inline styles or additional markup should be added to this file.
- Keep the structure simple and consistent for future posts.

---

**Edit link:**  
[Edit `blog/index.html` on GitHub](https://github.com/SheenaBadabina/sheenasadventures-site/edit/main/blog/index.html)
