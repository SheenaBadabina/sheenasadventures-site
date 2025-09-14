export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // ---- 1. GET settings from KV ----
    if (url.pathname === "/api/settings" && request.method === "GET") {
      const settings = await env.VIBESCRIPT_SETTINGS.get("site", { type: "json" });
      return new Response(JSON.stringify(settings || {}), {
        headers: { "Content-Type": "application/json" }
      });
    }

    // ---- 2. SAVE settings to KV ----
    if (url.pathname === "/api/settings" && request.method === "POST") {
      const data = await request.json();
      await env.VIBESCRIPT_SETTINGS.put("site", JSON.stringify(data));
      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    // ---- 3. GET projects from KV ----
    if (url.pathname === "/api/projects" && request.method === "GET") {
      const list = await env.VIBESCRIPT_PROJECTS.list();
      const projects = [];
      for (const key of list.keys) {
        const value = await env.VIBESCRIPT_PROJECTS.get(key.name, { type: "json" });
        if (value) {
          projects.push({ id: key.name, ...value });
        }
      }
      return new Response(JSON.stringify(projects), {
        headers: { "Content-Type": "application/json" }
      });
    }

    // ---- 4. SAVE project to KV ----
    if (url.pathname === "/api/projects" && request.method === "POST") {
      const data = await request.json();
      const id = crypto.randomUUID();
      await env.VIBESCRIPT_PROJECTS.put(id, JSON.stringify(data));
      return new Response(JSON.stringify({ success: true, id }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    // ---- 5. DELETE project from KV ----
    if (url.pathname.startsWith("/api/projects/") && request.method === "DELETE") {
      const id = url.pathname.split("/").pop();
      await env.VIBESCRIPT_PROJECTS.delete(id);
      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    // ---- 6. Default route: Serve UI ----
    return new Response(
      `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>VibeScript Demo</title>
        <style>
          body {
            font-family: sans-serif;
            background: linear-gradient(to bottom, #0f0c29, #302b63, #24243e);
            color: white;
            margin: 0; padding: 0;
          }
          .container {
            max-width: 600px; margin: 3rem auto; padding: 1rem;
          }
          h1 { color: #7c3aed; }
          .btn {
            display: inline-block; margin: 1rem 0; padding: 0.75rem 1.25rem;
            background: #7c3aed; color: white; border-radius: 6px;
            text-decoration: none;
          }
          .feature {
            background: rgba(255,255,255,0.1); padding: 1rem; margin: 0.5rem 0;
            border-radius: 6px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>VibeScript Demo</h1>
          <p>Turn one idea into momentum.</p>
          <a href="/edit" class="btn">Edit Site</a>
          <div class="feature">
            <strong>Fast</strong><br>Launch a clean page in minutes.
          </div>
          <div class="feature">
            <strong>Flexible</strong><br>Tweak colors, copy, and layout.
          </div>
          <div class="feature">
            <strong>Hosted</strong><br>Served on Cloudflare’s global edge.
          </div>
        </div>
      </body>
      </html>`,
      { headers: { "Content-Type": "text/html" } }
    );
  }
};
