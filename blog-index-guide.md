# Blog Index Guide

**File:** `blog/index.html`  
**Branch:** `main`  
**Purpose:** Defines the official layout and structure for the Sheena’s Adventures blog index page.

---

## Overview
This page serves as the **titles-only grid** for all blog posts.  
Each post appears as a simple card with a title and “Read Now” link—no thumbnails or summaries.  
The layout is clean, mobile-first, and fully styled by the global CSS and JavaScript files.

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
   - Navigation menu includes Home, Blog, Work With Me, About, and Contact.

2. **Main Content**
   - Includes a page title and subtitle.
   - Uses a `<div class="blog-grid">` container with individual blog cards.
   - Each card is an `<article class="blog-card">` containing:
     - `<h2 class="blog-card-title">[Blog Title]</h2>`
     - `<a href="/blog/[slug].html" class="blog-read-btn">Read Now</a>`
   - Posts are manually ordered; the **first card** is always the newest post.

3. **Footer**
   - Displays copyright.
   - The year is automatically injected by `site.js`.

4. **Banner**
   - The background banner image is handled **via CSS**, not HTML.

---

## Blog Order (Current)

1. `/blog/desert-drop-gem-stack.html`  
2. `/blog/pigeon-blood-agate.html`  
3. `/blog/2025-09-28-opalized-wood-yellow-cat-road.html`  
4. `/blog/utah-desert-field-guide.html`  
5. `/blog/meet-the-desert-dreamer.html`

---

## Behavior Notes
- The global JavaScript reads the **first blog card** to identify and feature the “Latest Blog” elsewhere on the site.
- All styling and interactivity come from `static/js/site.js` and `static/styles.css`.
- No inline styles or extra markup should ever be added.
- Maintain the minimal grid structure for every update.
- Always place new blog cards **at the top** of the grid to keep the homepage in sync.

---

**Edit link:**  
[Edit `blog/index.html` on GitHub](https://github.com/SheenaBadabina/sheenasadventures-site/edit/main/blog/index.html)
