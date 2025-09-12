import { sendEmail } from "./_lib-email.js";

export const onRequestPost = async (context) => {
  const { request, env } = context;
  const formData = await request.formData();

  // ---- Turnstile server-side verification ----
  const token = formData.get("cf-turnstile-response");
  const ip = request.headers.get("CF-Connecting-IP");

  const verifyRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: new URLSearchParams({
      secret: env.TURNSTILE_SECRET_KEY || "",
      response: token || "",
      remoteip: ip || ""
    })
  });

  const verify = await verifyRes.json();
  if (!verify.success) {
    // TEMP debug so we can see exact reason in the browser while testing
    return new Response(
      JSON.stringify({ ok: false, reason: verify["error-codes"] || verify }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // ---- Compose and send email via Resend ----
  const data = Object.fromEntries([...formData.entries()]);
  const subject = `Site Contact: ${data.name || "Unknown"} (${data.email || ""})`;
  const html = `
    <h2>New Contact Message</h2>
    <ul>
      <li><b>Name:</b> ${data.name || ""}</li>
      <li><b>Email:</b> ${data.email || ""}</li>
      <li><b>Message:</b> ${data.message || ""}</li>
    </ul>
  `;

  await sendEmail({ to: env.TO_EMAIL, subject, html }, env);

  // ---- Redirect back with success flag ----
  return Response.redirect(new URL("/contact.html?sent=1", request.url), 303);
};
