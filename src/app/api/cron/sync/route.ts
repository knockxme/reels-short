import { isCronAuthorized } from "@/lib/cron";
import { purgeOldTrash } from "@/lib/trash";

/*
 * Housekeeping: permanently deletes anything left in the admin trash longer than 30 days.
 * (Titles are single videos, so there are no playlists of episodes to pull in any more.)
 * Call daily from cron: curl -H "Authorization: Bearer $CRON_SECRET" https://yoursite.com/api/cron/sync
 */
export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return new Response("Unauthorized", { status: 401 });
  }
  const purged = await purgeOldTrash();
  return Response.json({ purgedFromTrash: purged });
}
