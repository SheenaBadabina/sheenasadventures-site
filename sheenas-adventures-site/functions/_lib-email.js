export async function sendEmail({to, subject, html}, env) {
  // Using Resend (https://resend.com)
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: env.FROM_EMAIL,     // e.g. "Sheena <no-reply@sheenasadventures.com>"
      to: [to],
      subject,
      html
    })
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Email send failed: ${res.status} ${text}`);
  }
}
