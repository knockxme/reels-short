export function GET() {
  const key = process.env.INDEXNOW_KEY;
  return key ? new Response(key, { headers: { "Content-Type": "text/plain" } }) : new Response("Not found", { status: 404 });
}
