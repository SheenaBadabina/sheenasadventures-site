/* /static/js/site.js
   Global site script for Sheena’s Adventures
   - Mobile hamburger + focus handling
   - “Latest Blog” auto-fetch from /blog/index.html (DB&WH smart-latest pattern)
   - Logo triple-click easter egg → /fun/gem-stack.html
   - Optional logo shimmer (respect prefers-reduced-motion)
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

  // Basic focus trap when open
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
  Expected structure (from Style Guide):
      <a class="card story-card" href="/blog/slug.html">
        <img src="/assets/images/slug.png" alt="…" loading="lazy">
        <h3>Title</h3>
        <p>Teaser</p>
      </a>
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
        <img src="${imgSrc}" alt="${imgAlt}" loading="lazy">
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

/* ========== Logo Triple-Click Easter Egg ========== */
(function logoEasterEgg() {
  const logo = document.querySelector('.brand');
  if (!logo) return;
  let clicks = 0;
  let t;

  function reset() { clicks = 0; clearTimeout(t); }

  logo.addEventListener('click', () => {
    clicks += 1;
    clearTimeout(t);
    if (clicks >= 3) {
      reset();
      window.location.href = '/fun/gem-stack.html';
      return;
    }
    t = setTimeout(reset, 700); // triple within 700ms
  });
})();

/* ========== Optional: Subtle Logo Shimmer (respects reduced motion) ========== */
(function logoShimmer() {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;
  const logo = document.querySelector('.brand');
  if (!logo) return;

  // Create a lightweight shimmer using a background gradient sweep
  let shimmering = false;
  function runShimmer() {
    if (shimmering) return;
    shimmering = true;
    logo.style.position = 'relative';
    const span = document.createElement('span');
    span.setAttribute('aria-hidden', 'true');
    span.style.position = 'absolute';
    span.style.top = 0;
    span.style.left = '-150%';
    span.style.width = '150%';
    span.style.height = '100%';
    span.style.pointerEvents = 'none';
    span.style.background = 'linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.18) 20%, transparent 40%)';
    span.style.transform = 'skewX(-10deg)';
    span.style.filter = 'blur(0.5px)';
    span.style.transition = 'left 900ms ease';
    logo.appendChild(span);
    requestAnimationFrame(() => {
      span.style.left = '100%';
    });
    setTimeout(() => {
      span.remove();
      shimmering = false;
    }, 1000);
  }

  // Fire occasionally (not annoying)
  setInterval(runShimmer, 15000 + Math.random() * 7000);
})();
