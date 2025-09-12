export const onRequestGet = async ({ env }) => {
  const secret = env.TURNSTILE_SECRET_KEY || "";
  return new Response(
    JSON.stringify({
      hasSecret: !!secret,
      looksRight: secret.startsWith("1x"),
      preview: secret ? secret.slice(0, 3) + "…" : ""
    }),
    { headers: { "Content-Type": "application/json" } }
  );
};
