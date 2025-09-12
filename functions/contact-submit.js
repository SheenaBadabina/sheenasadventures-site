import { sendEmail } from "./_lib-email.js";

export const onRequestPost = async ({ request, env }) => {
  try {
    const formData = await request.formData();

    // Turnstile
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
      return json({ ok:false, stage:"turnstile", reason: verify["error-codes"] || verify }, 400);
    }

    // Dry-run switch: set DRY_RUN_EMAIL=1 in Variables to skip email
    if (env.DRY_RUN_EMAIL === "1") {
      return redirectOK(request);
    }

    // Email
    const data = Object.fromEntries([...formData.entries()]);
    const subject = `Site Contact: ${data.name || "Unknown"} (${data.email || ""})`;
    const html = `
      <h2>New Contact Message</h2>
      <ul>
        <li><b>Name:</b> ${escapeHtml(data.name || "")}</li>
        <li><b>Email:</b> ${escapeHtml(data.email || "")}</li>
        <li><b>Message:</b> ${escapeHtml(data.message || "")}</li>
      </ul>`;

    try {
      await sendEmail({ to: env.TO_EMAIL, subject, html }, env);
    } catch (emailErr) {
      // Surface the exact Resend error instead of crashing (1101)
      return json({ ok:false, stage:"email", emailError: String(emailErr) }, 500);
    }

    return redirectOK(request);
  } catch (err) {
    // Absolute final safety net: no more 1101s
    return json({ ok:false, stage:"unexpected", error: String(err) }, 500);
  }
};

function redirectOK(request) {
  return Response.redirect(new URL("/contact.html?sent=1", request.url), 303);
}
function json(obj, status=200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
function escapeHtml(s){return s.replace(/[&<>"']/g,c=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));}
