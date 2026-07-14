// Keep-alive target. Deliberately does NOT touch the database:
// pinging keeps the Render instance awake without burning Neon
// compute hours (Neon wakes in ~1s when a real query arrives).
export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ ok: true });
}
