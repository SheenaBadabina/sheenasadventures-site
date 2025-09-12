import { sendEmail } from "./_lib-email.js";

export const onRequestPost = async ({ request, env }) => {
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
    // Soft fail without leaking details
    return Response.redirect(new URL("/work-with-me.html?sent=0", request.url), 303);
  }

  // ---- Gather fields ----
  const data = Object.fromEntries([...formData.entries()]);
  // checkbox groups may come through as string or multiple values – handle both
  const arr = v => Array.isArray(v) ? v : (v ? [v] : []);
  const promo = arr(data.promo).join(", ");
  const deliverables = arr(data.deliverables).join(", ");
  const access = arr(data.access).join(", ");

  const subject = `Sponsorship Request: ${data.company || "Unknown"} (${data.email || "no email"})`;
  const html = `
    <h2>New Sponsorship Inquiry</h2>
    <ul>
      <li><b>Company:</b> ${escapeHtml(data.company || "")}</li>
      <li><b>Contact:</b> ${escapeHtml(data.contact || "")}</li>
      <li><b>Email:</b> ${escapeHtml(data.email || "")}</li>
      <li><b>Website:</b> ${escapeHtml(data.website || "")}</li>
      <li><b>Socials:</b> ${escapeHtml(data.socials || "")}</li>
      <li><b>Product/Service:</b> ${escapeHtml(data.product || "")}</li>
      <li><b>Why Fit:</b> ${escapeHtml(data.fit || "")}</li>
      <li><b>Promo Types:</b> ${escapeHtml(promo)}</li>
      <li><b>Timeline:</b> ${escapeHtml(data.timeline || "")}</li>
      <li><b>Budget:</b> ${escapeHtml(data.budget || "")}</li>
      <li><b>Deliverables:</b> ${escapeHtml(deliverables)}</li>
      <li><b>Access:</b> ${escapeHtml(access)}</li>
      <li><b>Talking Points:</b> ${escapeHtml(data.talking_points || "")}</li>
      <li><b>Do NOT say:</b> ${escapeHtml(data.notsay || "")}</li>
      <li><b>Notes:</b> ${escapeHtml(data.notes || "")}</li>
    </ul>
  `;

  await sendEmail(
    { to: env.TO_EMAIL, subject, html, replyTo: data.email || "" },
    env
  );

  return Response.redirect(new URL("/work-with-me.html?sent=1", request.url), 303);
};

function escapeHtml(s){
  return s.replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
}
