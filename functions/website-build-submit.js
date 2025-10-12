// functions/website-build-submit.js
// Mirror of DBWH flow, adapted for Sheena’s Adventures.
// Uses _lib-email.js helper and Cloudflare Pages Functions API.

import { sendEmail } from "./_lib-email.js";

export const onRequestPost = async ({ request, env }) => {
  try {
    const formData = await request.formData();

    // ---- Turnstile verify ----
    const token = formData.get("cf-turnstile-response") || "";
    const ip = request.headers.get("CF-Connecting-IP") || "";
    const vRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: new URLSearchParams({
        secret: env.TURNSTILE_SECRET_KEY || "",
        response: token,
        remoteip: ip
      })
    });
    const verify = await vRes.json();
    if (!verify.success) {
      // Soft fail to the form without leaking details
      return Response.redirect(new URL("/build-a-website.html?sent=0", request.url), 303);
    }

    // ---- Gather & normalize fields ----
    const data = Object.fromEntries([...formData.entries()]);
    const arr = v => Array.isArray(v) ? v : (v ? [v] : []);
    const siteTypes = arr(data.siteType).join(", ");
    const features  = arr(data.features).join(", ");

    // ---- Compose email ----
    const subject = `Website Build Request: ${data.name || "Unknown"} (${data.email || "no email"})`;
    const html = `
      <h2>✨ New Website Build Request</h2>
      <ul>
        <li><b>Name:</b> ${escapeHtml(data.name || "")}</li>
        <li><b>Email:</b> ${escapeHtml(data.email || "")}</li>
        <li><b>Have domain?:</b> ${escapeHtml(data.haveDomain || "")}</li>
        <li><b>Domain:</b> ${escapeHtml(data.domain || "")}</li>
        <li><b>Project type:</b> ${escapeHtml(siteTypes)}</li>
        <li><b>Pages:</b> ${escapeHtml(data.pages || "")}</li>
        <li><b>Budget:</b> ${escapeHtml(data.budget || "")}</li>
        <li><b>Features:</b> ${escapeHtml(features)}</li>
        <li><b>Content readiness:</b> ${escapeHtml(data.content || "")}</li>
        <li><b>Images:</b> ${escapeHtml(data.images || "")}</li>
        <li><b>Other (type):</b> ${escapeHtml(data.siteOther || "")}</li>
        <li><b>Other (features):</b> ${escapeHtml(data.featuresOther || "")}</li>
      </ul>
      <h3>Project Summary</h3>
      <p>${escapeHtml(data.summary || "")}</p>
    `;

    await sendEmail(
      {
        to: env.TO_EMAIL || "sheenasadventures369@gmail.com",
        from: env.FROM_EMAIL || "Sheena’s Adventures <contact@sheenasadventures.com>",
        subject,
        html,
        replyTo: data.email || ""
      },
      env
    );

    return Response.redirect(new URL("/build-a-website.html?sent=1", request.url), 303);
  } catch (_err) {
    // Graceful soft-fail back to the form
    return Response.redirect(new URL("/build-a-website.html?sent=0", request.url), 303);
  }
};

function escapeHtml(s){
  return (s || "").replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[c]));
}
