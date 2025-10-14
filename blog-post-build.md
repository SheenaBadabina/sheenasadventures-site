# Blog Post Build Guide
## Sheena's Adventures - Blog Post Template

This guide explains how to create new blog posts for sheenasadventures.com using the established template.

---

## File Structure

```
sheenasadventures.com/
├── blog/
│   ├── index.html                    # Blog index page
│   ├── pigeon-blood-agate.html       # Example blog post
│   └── [new-post-slug].html          # New blog posts
├── assets/
│   └── prose/
│       └── 2025-10-12-pigeon-blood-agate.txt  # Blog content files
└── static/
    ├── styles.css                    # Global styles
    └── js/
        └── site.js                   # Global scripts
```

---

## Creating a New Blog Post

### Step 1: Create the Content File

1. Create a new `.txt` file in `/assets/prose/`
2. Name it with date format: `YYYY-MM-DD-post-slug.txt`
3. Write your content with paragraphs separated by blank lines

**Example:** `/assets/prose/2025-10-15-crystal-hunting-moab.txt`

```
This was an incredible day in the desert. The sun was setting over the red rocks as I searched for crystals.

I found three beautiful specimens near the canyon rim. Each one was unique and told a story of millions of years of geological history.

The drive home was peaceful. I reflected on how these adventures always teach me something new about myself and the land.
```

### Step 2: Create the HTML File

1. Copy the template below
2. Save it as `/blog/[post-slug].html`
3. Update the metadata sections

**Template:**

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>[POST TITLE] • Sheena's Adventures</title>
  <meta name="description" content="[POST DESCRIPTION]" />
  
  <link rel="icon" type="image/png" href="/assets/sheenas-adventures-favicon-logo.png" />
  <link rel="preload" href="/assets/prose/[DATE-SLUG].txt" as="fetch" crossorigin="anonymous" />
  <link rel="stylesheet" href="/static/styles.css" />
  <script src="/static/js/site.js" defer></script>

  <meta property="og:type" content="article" />
  <meta property="og:title" content="[POST TITLE]" />
  <meta property="og:description" content="[POST DESCRIPTION]" />
  <meta property="og:url" content="https://sheenasadventures.com/blog/[post-slug].html" />
  <meta name="twitter:card" content="summary_large_image" />
</head>

<body class="page-blog-post">

  <!-- Header with Navigation -->
  <header class="site-header">
    <div class="header-inner">
      <a href="/" class="brand">
        <img src="/assets/logosheenas-adventures-logo-bubble-braids.png" alt="Sheena's Adventures" height="48" width="48" />
      </a>
      <button class="hamburger" aria-label="Menu">☰</button>
      <nav class="site-nav" data-collapsible>
        <a href="/">Home</a>
        <a href="/blog/">Blog</a>
        <a href="/work-with-me.html">Work With Me</a>
        <a href="/about.html">About</a>
        <a href="/contact.html">Contact</a>
      </nav>
    </div>
  </header>

  <!-- Hero Banner for Blog Post -->
  <div class="post-hero">
    <img src="/assets/[BANNER-IMAGE].png" alt="Utah desert landscape" class="post-hero-bg" />
    <div class="post-hero-content">
      <div class="post-breadcrumb">
        <a href="/blog/">← Back to Blog</a>
      </div>
      <h1 class="post-hero-title">[POST TITLE]</h1>
      <div class="post-meta">
        <time datetime="[YYYY-MM-DD]">[Month DD, YYYY]</time>
        <span aria-hidden="true">•</span>
        <span>By Sheena</span>
      </div>
    </div>
  </div>

  <!-- Blog Post Content -->
  <main class="post-main">
    <article class="post-article">
      <section id="post-body" class="post-prose">
        <noscript>
          <p class="error-message">Please enable JavaScript to view this post.</p>
        </noscript>
      </section>
    </article>

    <!-- Call to Action -->
    <aside class="post-cta">
      <h3>Enjoyed this story?</h3>
      <p>Follow along for more rockhounding adventures, desert discoveries, and real stories from the Utah backcountry.</p>
      <div class="cta-buttons">
        <a href="https://www.youtube.com/@SheenasAdventures" target="_blank" rel="noopener" class="btn">Watch on YouTube</a>
        <a href="/blog/" class="btn secondary">More Blog Posts</a>
      </div>
    </aside>
  </main>

  <!-- Footer -->
  <footer class="site-footer">
    <p>
      © <span id="y">2025</span> Sheena's Adventures •
      <a href="/terms.html">Terms</a> •
      <a href="/privacy.html">Privacy</a>
    </p>
  </footer>

  <!-- Load Blog Content -->
  <script>
    (async function loadProse() {
      const target = document.getElementById('post-body');
      const src = '/assets/prose/[DATE-SLUG].txt';

      try {
        const res = await fetch(src, { cache: 'no-store' });
        if (!res.ok) throw new Error('Fetch failed: ' + res.status);
        const raw = await res.text();

        const blocks = raw
          .replace(/\r\n/g, '\n')
          .trim()
          .split(/\n\s*\n/g);

        const html = blocks
          .map(p => `<p>${escapeHtml(p).replace(/\n/g, '<br>')}</p>`)
          .join('\n');

        target.innerHTML = html;
      } catch (err) {
        console.error(err);
        target.innerHTML = `
          <div class="error-message">
            <p>Sorry, I couldn't load this post right now.</p>
            <p><small>Looking for: <code>${src}</code></small></p>
          </div>
        `;
      }

      function escapeHtml(str) {
        return str
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
      }
    })();
  </script>

</body>
</html>
```

### Step 3: Update the Blog Index

Add the new post to `/blog/index.html` **at the top** of the blog grid:

```html
<article class="blog-card">
  <div class="blog-card-content">
    <h2 class="blog-card-title">[POST TITLE]</h2>
    <a href="/blog/[post-slug].html" class="blog-read-btn">Read Now</a>
  </div>
</article>
```

---

## Customization Options

### Banner Images

Available banner images in `/assets/`:
- `sheenas-adventures-banner-spring-yucca-bloom-utah.png`
- `sheenas-adventures-banner-summer-sunset-utah.png`
- `sheenas-adventures-banner-autumn-canyon-hues-utah.png`
- `sheenas-adventures-banner-winter-snow-desert-utah.png`
- `sheenas-adventures-banner-rockhounding-agate-utah.png`
- `sheenas-adventures-banner-landscape-canyon-utah.png`
- `sheenas-adventures-banner-lifestyle-utah-desert.png`

Choose the image that best fits your post's theme.

### Metadata Fields to Update

Replace these placeholders in the template:

| Placeholder | Example | Description |
|-------------|---------|-------------|
| `[POST TITLE]` | `Crystal Hunting Near Moab` | Post title |
| `[POST DESCRIPTION]` | `An afternoon searching for crystals...` | Brief summary (150-160 chars) |
| `[DATE-SLUG]` | `2025-10-15-crystal-hunting-moab` | Filename of .txt content |
| `[post-slug]` | `crystal-hunting-moab` | URL-friendly post identifier |
| `[YYYY-MM-DD]` | `2025-10-15` | ISO date format |
| `[Month DD, YYYY]` | `October 15, 2025` | Human-readable date |
| `[BANNER-IMAGE]` | `sheenas-adventures-banner-rockhounding-agate-utah` | Banner filename (no extension) |

---

## Content Writing Guidelines

### Text File Format

- **Paragraphs:** Separate with blank lines
- **Line breaks:** Use single line breaks within paragraphs for natural flow
- **No HTML:** Pure text only - HTML tags will be escaped
- **Special characters:** Use plain text (', ", -, etc.)

### Example Content Structure

```
Opening paragraph that hooks the reader and sets the scene.

Middle paragraphs that tell the story, share details, and build narrative.

More paragraphs continuing the adventure or explanation.

Closing paragraph that wraps up and leaves the reader satisfied.
```

---

## Deployment Checklist

- [ ] Created `.txt` content file in `/assets/prose/`
- [ ] Created `.html` blog post in `/blog/`
- [ ] Updated all metadata placeholders
- [ ] Selected appropriate banner image
- [ ] Added post to `/blog/index.html` (at the top of the grid)
- [ ] Tested locally (if possible)
- [ ] Committed to GitHub
- [ ] Deployed to Cloudflare
- [ ] Verified post loads correctly on live site
- [ ] Checked mobile responsiveness

---

## Quick Reference: Complete Example

**Content file:** `/assets/prose/2025-10-15-finding-topaz.txt`

```
The morning started with a dusty drive down a remote BLM road. I was hunting for topaz crystals that supposedly littered this area.

After two hours of searching, I found my first specimen. It was small but perfectly formed, catching the sunlight like a tiny prism.

By sunset, I had collected five beautiful pieces. Each one a reminder that patience and persistence pay off in the desert.
```

**HTML file:** `/blog/finding-topaz.html`

Replace placeholders:
- Title: "Finding Topaz in the Utah Desert"
- Date: "2025-10-15" / "October 15, 2025"
- Banner: `sheenas-adventures-banner-summer-sunset-utah.png`
- Content path: `/assets/prose/2025-10-15-finding-topaz.txt`

**Blog index entry:**

```html
<article class="blog-card">
  <div class="blog-card-content">
    <h2 class="blog-card-title">Finding Topaz in the Utah Desert</h2>
    <a href="/blog/finding-topaz.html" class="blog-read-btn">Read Now</a>
  </div>
</article>
```

---

## Troubleshooting

### Post content not loading
- Check the file path in the script matches the actual .txt file location
- Verify the .txt file is in `/assets/prose/`
- Check browser console for errors

### Styling looks wrong
- Ensure `/static/styles.css` is up to date
- Verify `class="page-blog-post"` is on the `<body>` tag
- Clear browser cache

### Banner image not showing
- Verify image filename is correct (check spelling)
- Make sure image is in `/assets/` directory
- Check that file extension is `.png`

### Post not appearing on blog index
- Make sure it's added to the **top** of the grid (first article)
- Verify HTML structure matches other posts
- Clear Cloudflare cache after deploying

---

## CSS Dependencies

The blog post template relies on these CSS classes (already in `/static/styles.css`):

- `.page-blog-post` - Body wrapper
- `.post-hero` - Hero banner section
- `.post-hero-bg` - Background image
- `.post-hero-content` - Hero content overlay
- `.post-breadcrumb` - Back to blog link
- `.post-hero-title` - Main title
- `.post-meta` - Date and author info
- `.post-main` - Main content wrapper
- `.post-article` - Article card
- `.post-prose` - Content styling
- `.post-cta` - Call-to-action section

All styles are already included in the main stylesheet.

---

## Notes

- The homepage automatically fetches the **first** blog post from `/blog/index.html`
- Keep blog posts at the top of the index for the latest to appear on homepage
- Banner images should be 1920x1080px or similar widescreen ratio
- Content files should be UTF-8 encoded text files
- JavaScript is required for content loading (graceful degradation with noscript message)

---

**Last Updated:** October 2025  
**Template Version:** 1.0  
**Maintained By:** Sheena's Adventures Development Team
