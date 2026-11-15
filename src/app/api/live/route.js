import fs from "node:fs";
import path from "node:path";
import { fetchLive } from "@/lib/live";

// Last 7 days of fire detections over India, straight from NASA FIRMS.
// Cached for 30 minutes; if NASA can't be reached we serve the snapshot
// saved by `npm run data` so the page never comes up empty.
export const revalidate = 1800;

export async function GET() {
  try {
    const data = await fetchLive();
    if (data.points.length) return Response.json({ ...data, source: "live" });
    throw new Error("no points");
  } catch (e) {
    const snap = path.join(process.cwd(), "public", "data", "live-snapshot.json");
    if (fs.existsSync(snap)) return Response.json({ ...JSON.parse(fs.readFileSync(snap, "utf8")), source: "snapshot", error: String(e.message || e) });
    return Response.json({ points: [], feeds: {}, source: "none", error: String(e.message || e) }, { status: 503 });
  }
}
