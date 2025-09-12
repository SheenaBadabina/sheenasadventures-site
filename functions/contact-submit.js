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

  try {
    await sendEmail({ to: env.TO_EMAIL, subject, html }, env);
  } catch (err) {
    return new Response(
      JSON.stringify({ ok:false, emailError: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
