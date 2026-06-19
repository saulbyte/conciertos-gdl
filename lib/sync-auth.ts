export function authorizeSyncRequest(request: Request) {
  const syncSecret = process.env.SYNC_SECRET;
  const requestSecret =
    request.headers.get("x-sync-secret") ??
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (!syncSecret) {
    return Response.json(
      { error: "SYNC_SECRET is not configured" },
      { status: 500 },
    );
  }

  if (requestSecret !== syncSecret) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}
