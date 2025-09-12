import { sendEmail } from "./_lib-email.js";

export const onRequestPost = async (context) => {
  const { request, env } = context;
  const formData = await request.formData();

  // Turnstile verify
  const token = formData.get("cf-turnstile-response");
  const ip = request.headers.get("CF-Connecting-IP");
  const verifyRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: new URLSearchParams({
      secret: env.TURNSTILE_SECRET_KEY,
      response: token,
      remoteip: ip
    })
  });
  const verify = await verifyRes.json();
  if (!verify.success) return new Response("Verification failed", { status: 400 });

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
  return Response.redirect(new URL("/contact.html?sent=1", request.url), 303);
};
