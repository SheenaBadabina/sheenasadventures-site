# Sheena’s Adventures — Static Site (Cloudflare Pages)

This repo hosts a simple, low-maintenance website with:
- Static pages (Home, Work With Me, Adventures, About, Contact)
- Sponsor intake form (Cloudflare Turnstile, email via Resend)
- Contact form
- Lightweight Blog listing posts from `/blog` folder
- Optional Decap CMS scaffolding (parked for later)

## Quick Start
1. Create a new GitHub repo and push these files.
2. In Cloudflare Pages, create a project connected to this repo.
3. In Cloudflare Pages → Settings → **Environment Variables**, add:
   - `TURNSTILE_SECRET_KEY` (from Cloudflare Turnstile)
   - `RESEND_API_KEY` (from Resend)
   - `FROM_EMAIL` (e.g., `Sheena <no-reply@sheenasadventures.com>`, configured in Resend)
   - `TO_EMAIL` (e.g., `sheenasadventures369@gmail.com`)
4. In your HTML, replace `YOUR_TURNSTILE_SITE_KEY` with your Turnstile **site key**.
5. Deploy. Test `/work-with-me.html` and `/contact.html` forms.

## Stripe Invoices (case-by-case)
- Approve sponsor → create invoice in Stripe → Stripe emails them a pay link (or copy the link into your email).

## Blog
- Add Markdown files to `/blog`, e.g., `2025-09-10-yellow-cat-road.md`.
- Edit `/blog/index.html` OWNER/REPO/BRANCH placeholders to your repo values.

## Admin
- Visit `/admin/` for quick GitHub links to create/edit posts and upload images.

---

**Made for Sheena — “It’s all about the journey, not the destination.”**
