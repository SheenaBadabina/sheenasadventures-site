/* static/js/site.js
   Global UI behaviors for sheenasadventures.com
   - Mobile menu toggle
   - Smart Latest Blog (scrape first card from /blog/)
   - Easter egg: triple-click brand -> /fun/gem-stack.html
*/

(function () {
  // ---------------------------
  // Helpers
  // ---------------------------
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // ---------------------------
  // Mobile menu toggle
  // ---------------------------
  const body = document.body;
  const hamburger = $('.hamburger');
  const nav = $('.site-nav');

  if (hamburger && nav) {
    const toggleMenu = () => {
      body.classList.toggle('open');
      const open = body.classList.contains('open');
      hamburger.setAttribute('aria-expanded', String(open));
      if (open) nav.querySelector('a')?.focus();
    };

    hamburger.addEventListener('click', toggleMenu);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && body.classList.contains('open')) {
        body.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
        hamburger.focus();
      }
    });

    // Close when clicking a nav link (mobile)
    $$('.site-nav a').forEach(a =>
      a.addEventListener('click', () => {
        if (body.classList.contains('open')) {
          body.classList.remove('open');
          hamburger.setAttribute('aria-expanded', 'false');
        }
      })
    );
  }

  // ---------------------------
  // Smart Latest Blog (no JSON)
  // Reads first .card.story-card from /blog/index.html
  // and mirrors it into #latestBlog
  // ---------------------------
  const latestHost = $('#latestBlog');
  if (latestHost) {
    fetch('/blog/index.html', { cache: 'no-store' })
      .then(r => r.ok ? r.text() : Promise.reject(r.status))
      .then(html => {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const firstCard = doc.querySelector('.card.story-card');
        if (!firstCard) throw new Error('No blog card found');

        // Clone with its first image eager-loaded
        const card = firstCard.cloneNode(true);
        const img = card.querySelector('img');
        if (img) {
          img.loading = 'eager';
          img.decoding = 'async';
        }
        latestHost.innerHTML = '';
        latestHost.appendChild(card);
      })
      .catch(() => {
        latestHost.innerHTML = '<p>Could not load the latest blog.</p>';
      });
  }

  // ---------------------------
  // Easter egg: triple-click brand -> game
  // - 3 clicks within 600ms on .brand
  // - Navigates to /fun/gem-stack.html?egg=1
  // ---------------------------
  const brand = $('.brand');
  if (brand) {
    let clicks = 0;
    let timer = null;

    const reset = () => { clicks = 0; clearTimeout(timer); timer = null; };

    brand.addEventListener('click', (e) => {
      clicks += 1;

      if (clicks === 1) {
        // start window
        timer = setTimeout(reset, 600);
      }

      if (clicks === 3) {
        reset();
        // Respect regular link behavior if user long-presses or opens in new tab
        e.preventDefault();
        window.location.href = '/fun/gem-stack.html?egg=1';
      }
    });
  }
})();
