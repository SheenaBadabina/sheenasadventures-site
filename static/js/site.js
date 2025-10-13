/* /static/js/site.js
   Global script for sheenasadventures.com
   - Mobile hamburger + focus handling
   - Smart "Latest Blog" (lazy fetch of first .story-card)
   - Seasonal banner loader (+ rotation)
   - Ken Burns banner motion
   - Desert dust particles on hero
   - CTA sparkles
   - Scroll reveal
   - Logo triple-click Easter egg
   - Footer year injection
*/

/* ========== Helpers ========== */
const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ========== Footer Year ========== */
(() => { 
  const y = $('#y'); 
  if (y) y.textContent = new Date().getFullYear(); 
})();

/* ========== Hamburger Menu & Focus Mgmt ========== */
(() => {
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

  btn.addEventListener('click', () => (body.classList.contains(openClass) ? closeMenu() : openMenu()));
  document.addEventListener('keydown', (e) => { 
    if (e.key === 'Escape' && body.classList.contains(openClass)) closeMenu(); 
  });

  // Focus trap when open
  document.addEventListener('keydown', (e) => {
    if (!body.classList.contains(openClass) || e.key !== 'Tab') return;
    const focusables = $$(focusableSelectors, nav);
    if (!focusables.length) return;
    const first = focusables[0], last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) { 
      e.preventDefault(); 
      last.focus(); 
    }
    else if (!e.shiftKey && document.activeElement === last) { 
      e.preventDefault(); 
      first.focus(); 
    }
  });
})();

/* ========== Latest Blog: Lightweight Lazy Fetch ========== */
(() => {
  const mount = $('#latestBlog');
  if (!mount) return;

  function renderError() {
    mount.innerHTML = `<div class="pad"><p class="meta">Could not load the latest blog. <button id="retryBlog" class="btn secondary" style="margin-top:0.5rem;">Retry</button></p></div>`;
    const retry = $('#retryBlog');
    if (retry) retry.addEventListener('click', () => {
      mount.innerHTML = '<p class="meta">Loading latest blog...</p>';
      if ('requestIdleCallback' in window) {
        requestIdleCallback(loadBlog, { timeout: 1500 });
      } else {
        setTimeout(loadBlog, 400);
      }
    });
  }

  async function loadBlog() {
    try {
      const res = await fetch('/blog/index.html', { cache: 'no-cache' });
      if (!res.ok) throw new Error('HTTP ' + res.status);

      const html = await res.text();
      
      // Try to match the NEW blog card structure
      let match = html.match(/<article[^>]*class=["'][^"']*blog-card[^"']*["'][^>]*>[\s\S]*?<a[^>]+href=["']([^"']+)["'][^>]*>[\s\S]*?<h2[^>]*>([\s\S]*?)<\/h2>[\s\S]*?<\/article>/i);
      
      // Fallback: try old structure if new one doesn't exist
      if (!match) {
        match = html.match(/<li[^>]*class=["'][^"']*blog-item[^"']*["'][^>]*>[\s\S]*?<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>[\s\S]*?<\/li>/i);
      }
      
      if (!match) throw new Error('No blog post found');
      
      const url = match[1];
      const title = match[2].replace(/<[^>]*>/g, '').trim();
      
      // Create a nice card display
      mount.innerHTML = `
        <a href="${url}" class="story-card" style="text-decoration: none; color: inherit; display: block;">
          <h3 style="margin: 1.5rem 1.5rem 0.75rem; font-size: 1.4rem; font-weight: 700; color: var(--color-text);">${title}</h3>
          <p style="margin: 0 1.5rem 1rem; color: var(--color-muted);">Latest blog post</p>
          <span class="text-link" style="margin: 0 1.5rem 1.5rem; display: inline-block;">Read More →</span>
        </a>
      `;
    } catch (err) {
      console.error('Blog fetch error:', err);
      renderError();
    }
  }

  if ('requestIdleCallback' in window) {
    requestIdleCallback(loadBlog, { timeout: 1500 });
  } else {
    window.addEventListener('DOMContentLoaded', () => setTimeout(loadBlog, 400));
  }
})();

/* ========== Seasonal Banner Loader (+ optional rotation) ========== */
(() => {
  const el = $('#bannerHero');
  if (!el) return;

  const BANNERS = {
    spring: ['sheenas-adventures-banner-spring-yucca-bloom-utah.png'],
    summer: ['sheenas-adventures-banner-summer-sunset-utah.png'],
    autumn: ['sheenas-adventures-banner-autumn-canyon-hues-utah.png'],
    winter: ['sheenas-adventures-banner-winter-snow-desert-utah.png']
  };

  function getSeason(d = new Date()) {
    const m = d.getMonth();
    if (m <= 1 || m === 11) return 'winter';
    if (m >= 2 && m <= 4)   return 'spring';
    if (m >= 5 && m <= 7)   return 'summer';
    return 'autumn';
  }

  const season = getSeason();
  const list = (BANNERS[season] || []).map(name => `/assets/${name}`);
  if (!list.length) return;

  // Preload images
  list.forEach(src => { 
    const i = new Image(); 
    i.src = src; 
  });

  // Inject styles if not already present
  if (!document.getElementById('fxStyles')) {
    const css = document.createElement('style');
    css.id = 'fxStyles';
    css.textContent = `
      #bannerHero { 
        width: 100%; 
        height: 100%; 
        object-fit: cover; 
        display: block; 
        transition: opacity 900ms ease; 
        opacity: 1; 
      }
      .fade-out { opacity: 0; }
      .cta-sparkle { 
        position: absolute; 
        pointer-events: none; 
        top: 0; 
        left: 0; 
        width: 8px; 
        height: 8px; 
        border-radius: 50%; 
        filter: blur(0.2px); 
        opacity: 0; 
        transition: opacity 300ms ease, transform 900ms ease; 
      }
      .reveal { 
        opacity: 0; 
        transform: translateY(10px); 
        transition: opacity 600ms ease, transform 600ms ease; 
      }
      .revealed { 
        opacity: 1; 
        transform: none; 
      }
    `;
    document.head.appendChild(css);
  }

  el.src = list[0];

  // Rotate through multiple banners if available
  if (!prefersReduced && list.length > 1) {
    let idx = 0;
    setInterval(() => {
      idx = (idx + 1) % list.length;
      el.classList.add('fade-out');
      setTimeout(() => { 
        el.src = list[idx]; 
        el.classList.remove('fade-out'); 
      }, 300);
    }, 6500);
  }

  // Ken Burns slow zoom effect
  if (!prefersReduced) {
    let t0 = performance.now();
    const amp = 0.03;
    function loop(t) {
      const s = 1 + (Math.sin((t - t0) / 8000) * amp + amp);
      el.style.transform = `scale(${s})`;
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }
})();

/* ========== Desert Dust Particles over Hero ========== */
(() => {
  const host = $('.hero-banner');
  const canvas = $('#sandParticles');
  if (!host || !canvas) return;
  const ctx = canvas.getContext('2d', { alpha: true });

  function resize() {
    const rect = host.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  const PARTICLE_COUNT = prefersReduced ? 0 : 28;
  const parts = [];
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    parts.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.3 + 0.4,
      a: Math.random() * 0.25 + 0.1,
      vx: Math.random() * 0.06 + 0.02,
      vy: Math.random() * 0.03 + 0.01
    });
  }

  function step() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    parts.forEach(p => {
      p.x += p.vx; 
      p.y += p.vy;
      if (p.x > canvas.width) p.x = -2;
      if (p.y > canvas.height) p.y = -2;
      ctx.globalAlpha = p.a;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    });
    requestAnimationFrame(step);
  }
  if (PARTICLE_COUNT > 0) requestAnimationFrame(step);
})();

/* ========== CTA Sparkles ========== */
(() => {
  if (prefersReduced) return;
  const ctas = $$('.btn');
  if (!ctas.length) return;

  function sparkle(el) {
    const span = document.createElement('span');
    span.className = 'cta-sparkle';
    span.style.left = Math.random() * (el.offsetWidth - 8) + 'px';
    span.style.top = Math.random() * (el.offsetHeight - 8) + 'px';
    span.style.background = 'radial-gradient(circle, rgba(255,255,255,0.9), rgba(255,255,255,0))';
    el.style.position = 'relative';
    el.appendChild(span);
    requestAnimationFrame(() => {
      span.style.opacity = '1';
      span.style.transform = 'scale(1.8)';
    });
    setTimeout(() => { span.style.opacity = '0'; }, 700);
    setTimeout(() => { span.remove(); }, 1050);
  }

  function schedule(el) {
    const delay = 12000 + Math.random() * 8000;
    setTimeout(() => { 
      sparkle(el); 
      schedule(el); 
    }, delay);
  }
  ctas.forEach(schedule);
})();

/* ========== Scroll Reveal ========== */
(() => {
  if (prefersReduced) {
    $$('.reveal').forEach(el => el.classList.add('revealed'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { 
      if (e.isIntersecting) { 
        e.target.classList.add('revealed'); 
        io.unobserve(e.target); 
      } 
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });
  $$('.reveal').forEach(el => io.observe(el));
})();

/* ========== Logo Triple-Click Easter Egg ========== */
(() => {
  const logo = document.querySelector('.brand');
  if (!logo) return;
  let clicks = 0, t;
  function reset(){ 
    clicks = 0; 
    clearTimeout(t); 
  }
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
