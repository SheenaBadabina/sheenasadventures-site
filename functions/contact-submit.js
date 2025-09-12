  const verify = await verifyRes.json();
  if (!verify.success) {
    // TEMP: show why it failed
    return new Response(
      JSON.stringify({ ok:false, reason: verify["error-codes"] || verify }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
