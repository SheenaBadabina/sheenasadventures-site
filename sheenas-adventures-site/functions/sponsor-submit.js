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
  const subject = `Sponsorship Request: ${data.company || "Unknown"} (${data.email || "no email"})`;
  const html = `
    <h2>New Sponsorship Inquiry</h2>
    <ul>
      <li><b>Company:</b> ${data.company || ""}</li>
      <li><b>Contact:</b> ${data.contact || ""}</li>
      <li><b>Email:</b> ${data.email || ""}</li>
      <li><b>Website:</b> ${data.website || ""}</li>
      <li><b>Socials:</b> ${data.socials || ""}</li>
      <li><b>Product/Service:</b> ${data.product || ""}</li>
      <li><b>Why Fit:</b> ${data.fit || ""}</li>
      <li><b>Promo Types:</b> ${Array.isArray(data.promo) ? data.promo.join(", ") : data.promo || ""}</li>
      <li><b>Timeline:</b> ${data.timeline || ""}</li>
      <li><b>Budget:</b> ${data.budget || ""}</li>
      <li><b>Deliverables:</b> ${Array.isArray(data.deliverables) ? data.deliverables.join(", ") : data.deliverables || ""}</li>
      <li><b>Access:</b> ${Array.isArray(data.access) ? data.access.join(", ") : data.access || ""}</li>
      <li><b>Talking Points:</b> ${data.talking_points || ""}</li>
      <li><b>Do NOT say:</b> ${data.notsay || ""}</li>
    </ul>
  `;

  await sendEmail({ to: env.TO_EMAIL, subject, html }, env);

  // Optional: store JSON in KV (bind a KV namespace named SPONSORS_KV)
  if (env.SPONSORS_KV) {
    const id = `sponsor:${Date.now()}:${crypto.randomUUID()}`;
    await env.SPONSORS_KV.put(id, JSON.stringify(data, null, 2));
  }

  return Response.redirect(new URL("/work-with-me.html?sent=1", request.url), 303);
};
