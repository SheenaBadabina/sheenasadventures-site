export async function sendEmail({ to, subject, html, replyTo }, env) {
  const apiKey = env.RESEND_API_KEY;
  const from = env.FROM_EMAIL || "hello@sheenasadventures.com"; // you already set this working value

  if (!apiKey) throw new Error("Missing RESEND_API_KEY");
  if (!to) throw new Error("Missing TO_EMAIL");
  const payload = {
    from,
    to: [to],
    subject,
    html,
    ...(replyTo ? { reply_to: [replyTo] } : {})
  };

  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!r.ok) {
    const text = await r.text().catch(() => "");
    throw new Error(`Resend error ${r.status}: ${text}`);
  }
  return await r.json().catch(() => ({}));
}
