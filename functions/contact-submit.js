// ...after verify.success check
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
  // show the real reason instead of crashing (no more 1101)
  return new Response(JSON.stringify({ ok:false, emailError: String(err) }),
    { status: 500, headers: { "Content-Type": "application/json" } });
}

return Response.redirect(new URL("/contact.html?sent=1", request.url), 303);
