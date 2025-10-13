/* /static/js/site.js
   Global script for sheenasadventures.com
   - Mobile hamburger + focus handling
   - Smart "Latest Blog" (scrape first card from /blog/index.html)
   - Seasonal banner loader (+ optional within-season rotation with crossfade)
   - Logo triple-click Easter egg -> /fun/gem-stack.html
   - Footer year injection
*/

/* ========== Helpers ========== */
const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/* ========== Footer Year ========== */
(function setYear() {
  const el = $('#y');
  if (el) el.textContent = new Date().getFullYear();
})();

/* ========== Hamburger Menu & Focus Mgmt ========== */
(function mobileNav() {
  const body = document.body;
  const btn  = $('.hamburger');
  const nav  = $('.site-nav[data-collapsible]');
  if (!btn || !nav) return;

  const openClass = 'open';

  const focusableSelectors = [
    'a[href]', 'button:not([disabled])', 'input:not([disabled])',
    '[tabindex]:not([tabindex="-1"])', 'select:not([disabled])'
  ].join(',');

  function openMenu() {
    body.classList.add(openClass);
    body.style.overflow = 'hidden';
    nav.setAttribute('aria-expanded', 'true');
    const first = $(focusableSelectors, nav);
    if (first) first.focus({ preventScroll: true });
  }

  function closeMenu() {
    body.classList.remove(openClass);
    body.style.overflow = '';
    nav.setAttribute('aria-expanded', 'false');
    btn.focus({ preventScroll: true });
  }

  function toggleMenu() {
    if (body.classList.contains(openClass)) closeMenu();
    else openMenu();
  }

  btn.addEventListener('click', toggleMenu);

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && body.classList.contains(openClass)) {
      e.preventDefault();
      closeMenu();
    }
  });

  // Focus trap when open
  document.addEventListener('keydown', (e) => {
    if (!body.classList.contains(openClass) || e.key !== 'Tab') return;
    const focusables = $$(focusableSelectors, nav);
    if (!focusables.length) return;
    const first = focusables[0];
    const last  = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  });
})();

/* ========== Latest Blog: Smart Fetch from /blog/index.html ========== */
/*
  Pattern: fetch /blog/index.html, parse the FIRST <a class="card story-card">…</a>
  This matches your DB&WH "smart latest" workflow (no JSON maintenance).
*/
(async function renderLatestBlog() {
  const mount = $('#latestBlog');
  if (!mount) return;
  try {
    const res = await fetch('/blog/index.html', { cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const html = await res.text();

    const doc = new DOMParser().parseFromString(html, 'text/html');
    const card = doc.querySelector('a.card.story-card');
    if (!card) throw new Error('No story-card found on /blog/index.html');

    const href = card.getAttribute('href') || '#';
    const img  = card.querySelector('img');
    const h3   = card.querySelector('h3');
    const p    = card.querySelector('p');

    const imgSrc = img?.getAttribute('src') || '/assets/logo-sheena.png';
    const imgAlt = img?.getAttribute('alt') || (h3?.textContent?.trim() || 'Latest blog');
    const title  = h3?.textContent?.trim() || 'Latest Blog';
    const desc   = p?.textContent?.trim() || '';

    mount.innerHTML = `
      <a class="card story-card" href="${href}">
        <img src="${imgSrc}" alt="${imgAlt}" loading="lazy" decoding="async">
        <div class="pad">
          <h3>${title}</h3>
          <p>${desc}</p>
          <span class="text-link">Read now →</span>
        </div>
      </a>
    `;
  } catch (err) {
    mount.innerHTML = `<div class="pad"><p class="meta">Could not load the latest blog.</p></div>`;
  }
})();

/* ========== Seasonal Banner Loader (+ optional rotation) ========== */
/*
  Everything lives flat in /assets. Map seasons to arrays of filenames.
  If you add multiple images per season, we crossfade through them.
  If prefers-reduced-motion is set, we show the first image only.
*/
(function seasonalBanner() {
  const el = $('#bannerHero');
  if (!el) return;

  // Edit these names if your exact filenames differ.
  const BANNERS = {
    spring: [
      'sheenas-adventures-banner-spring-yucca-bloom-utah.png'
    ],
    summer: [
      'sheenas-adventures-banner-summer-sunset-utah.png'
    ],
    autumn: [
      'sheenas-adventures-banner-autumn-canyon-hues-utah.png'
    ],
    winter: [
      'sheenas-adventures-banner-winter-snow-desert-utah.png'
    ]
  };

  function getSeason(d = new Date()) {
    const m = d.getMonth(); // 0..11
    if (m <= 1 || m === 11) return 'winter'; // Dec–Feb
    if (m >= 2 && m <= 4)   return 'spring'; // Mar–May
    if (m >= 5 && m <= 7)   return 'summer'; // Jun–Aug
    return 'autumn';                          // Sep–Nov
  }

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const season = getSeason();
  const list = (BANNERS[season] || []).map(name => `/assets/${name}`);
  if (!list.length) return;

  // Preload
  list.forEach(src => { const i = new Image(); i.src = src; });

  // Set first image
  el.src = list[0];

  // Optional rotation within season (only if >1 and motion allowed)
  if (prefersReduced || list.length < 2) return;

  let idx = 0;
  const intervalMs = 6500;

  // Ensure crossfade styles exist (one-time injection)
  if (!document.getElementById('heroFadeStyles')) {
    const css = document.createElement('style');
    css.id = 'heroFadeStyles';
    css.textContent = `
      #bannerHero { transition: opacity 900ms ease; opacity: 1; }
      .fade-out { opacity: 0; }
    `;
    document.head.appendChild(css);
  }

  setInterval(() => {
    idx = (idx + 1) % list.length;
    // Fade out -> swap -> fade in
    el.classList.add('fade-out');
    setTimeout(() => {
      el.src = list[idx];
      el.classList.remove('fade-out');
    }, 300);
  }, intervalMs);
})();

/* ========== Logo Triple-Click Easter Egg ========== */
(function logoEasterEgg() {
  const logo = document.querySelector('.brand');
  if (!logo) return;
  let clicks = 0;
  let t;
  function reset() { clicks = 0; clearTimeout(t); }
  logo.addEventListener('click', (e) => {
    clicks += 1;
    clearTimeout(t);
    if (clicks >= 3) {
      reset();
      e.preventDefault();
      window.location.href = '/fun/gem-stack.html?egg=1';
      return;
    }
    t = setTimeout(reset, 700);
  });
})();
