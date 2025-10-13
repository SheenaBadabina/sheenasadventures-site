# Homepage Guide — Sheena’s Adventures

Authoritative reference for `/index.html` structure, logic, and asset usage.  
This file defines exactly how the homepage functions and what files it depends on.

---

## CORE FILE PATHS

```
/index.html
/blog/index.html
/about.html
/work-with-me.html
/contact.html
/fun/gem-stack.html
/terms.html
/static/js/site.js
/static/styles.css
```

---

## PURPOSE

The homepage is the visual and functional anchor of **Sheena’s Adventures**, highlighting real Utah desert adventures, latest blog updates, and the Gem Stack mini-game.

---

## TOP-DOWN STRUCTURE

### 1. `<head>`
- Title: “Sheena’s Adventures | Authentic Utah Adventures”
- Meta description: “Real rockhounding. Real stories. Brand-safe filmmaking from the Utah desert.”
- Favicon: `/assets/sheenas-adventures-favicon-logo.png`
- Stylesheet: `/static/styles.css`
- Script: `/static/js/site.js`
- Responsive `<meta viewport>` tag required.

### 2. Header
- Logo: `/assets/logosheenas-adventures-logo-bubble-braids.png`
- Mobile hamburger; no animation.
- Links (in order):
  - Home → `/`
  - Blog → `/blog/`
  - Work With Me → `/work-with-me.html`
  - About → `/about.html`
  - Contact → `/contact.html`

### 3. Hero Section
- Displays one banner image chosen via date logic (see “Rotation System” below).
- Headline: “Authentic Utah Adventures”
- Subtext: “Real rockhounding. Real stories. Brand-safe filmmaking from the desert.”
- Buttons:
  - “Sponsor an Adventure” → `/work-with-me.html`
  - “Watch on YouTube” → `https://www.youtube.com/@SheenasAdventures`

### 4. From the Blog
- Pulls the first card from `/blog/index.html`.
- If it fails to load: fallback text “Could not load the latest blog.”

### 5. Gem Stack Promo
- Image: `/assets/sheenas-adventures-game-gem-stack-thumb.png`
- Text: “Play Gem Stack — Our chill, shiny desert mini-game.”
- CTA: “Play Now” → `/fun/gem-stack.html`

### 6. Footer
- © year auto-injected by `/static/js/site.js`
- Links:
  - Terms of Use → `/terms.html`
  - Privacy Policy → `/privacy.html` (when added)
- No newsletter or social icons.

---

## ROTATION SYSTEM

### Seasonal banners
```
/assets/sheenas-adventures-banner-spring-yucca-bloom-utah.png
/assets/sheenas-adventures-banner-summer-sunset-utah.png
/assets/sheenas-adventures-banner-autumn-canyon-hues-utah.png
/assets/sheenas-adventures-banner-winter-snow-desert-utah.png
```

### Evergreen banners
```
/assets/sheenas-adventures-banner-landscape-canyon-utah.png
/assets/sheenas-adventures-banner-rockhounding-agate-utah.png
/assets/sheenas-adventures-banner-lifestyle-utah-desert.png
```

### Fallback
```
/assets/sheenas-adventures-utah-desert-background.png
```

### Logic
- **Seasonal rotation** based on month:
  - Winter: Dec–Feb → winter-snow-desert
  - Spring: Mar–May → spring-yucca-bloom
  - Summer: Jun–Aug → summer-sunset
  - Autumn: Sep–Nov → autumn-canyon-hues
- **Day-based alternation:**
  - Odd days → seasonal banner
  - Even days → random evergreen banner
- **No animations:** static image only per visit.

---

## IMAGE INVENTORY
```
/assets/logosheenas-adventures-logo-bubble-braids.png
/assets/sheenas-adventures-favicon-logo.png
/assets/sheenas-adventures-game-gem-stack-thumb.png
/assets/sheenas-adventures-banner-spring-yucca-bloom-utah.png
/assets/sheenas-adventures-banner-summer-sunset-utah.png
/assets/sheenas-adventures-banner-autumn-canyon-hues-utah.png
/assets/sheenas-adventures-banner-winter-snow-desert-utah.png
/assets/sheenas-adventures-banner-landscape-canyon-utah.png
/assets/sheenas-adventures-banner-rockhounding-agate-utah.png
/assets/sheenas-adventures-banner-lifestyle-utah-desert.png
/assets/sheenas-adventures-utah-desert-background.png
```

---

## BEHAVIORAL RULES
- No gallery.
- No “Aurora Bench.”
- No newsletter signup.
- No animations or particles.
- Minimal JS only: header toggle, © year, blog fetch, banner logic.

---

## MAINTENANCE
- Keep all image filenames lowercase and hyphenated.
- Add or replace seasonal banners quarterly.
- Commit updates with message:
  ```
  update(homepage): adjust seasonal banner rotation
  ```
- Review `/static/js/site.js` when changing rotation logic.

---

_End of Homepage Guide_
