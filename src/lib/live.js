import fs from "node:fs";
import path from "node:path";

// Live (near real-time) fire detections from NASA FIRMS — the public 7-day
// South Asia files, refreshed by NASA every few hours. We keep only points
// that fall inside India (state lookup raster built by scripts/build-data.mjs).
const BASE = "https://firms.modaps.eosdis.nasa.gov/data/active_fire";
export const FEEDS = [
  { key: "noaa20", label: "VIIRS · NOAA-20", url: `${BASE}/noaa-20-viirs-c2/csv/J1_VIIRS_C2_South_Asia_7d.csv` },
  { key: "noaa21", label: "VIIRS · NOAA-21", url: `${BASE}/noaa-21-viirs-c2/csv/J2_VIIRS_C2_South_Asia_7d.csv` },
  { key: "snpp", label: "VIIRS · Suomi NPP", url: `${BASE}/suomi-npp-viirs-c2/csv/SUOMI_VIIRS_C2_South_Asia_7d.csv` },
  { key: "modis", label: "MODIS", url: `${BASE}/modis-c6.1/csv/MODIS_C6_1_South_Asia_7d.csv` },
];

let lookup;
function getLookup() {
  if (lookup) return lookup;
  const dir = path.join(process.cwd(), "src", "lib");
  const meta = JSON.parse(fs.readFileSync(path.join(dir, "state-raster.json"), "utf8"));
  const raster = new Uint8Array(fs.readFileSync(path.join(dir, "state-raster.bin")));
  lookup = { ...meta, raster };
  return lookup;
}

export function stateAt(lat, lon) {
  const L = getLookup();
  const r = Math.floor((lat - L.lat0) / L.res), c = Math.floor((lon - L.lon0) / L.res);
  if (r < 0 || c < 0 || r >= L.h || c >= L.w) return 0;
  const v = L.raster[r * L.w + c];
  if (v) return v;
  for (let d = 1; d <= 4; d++)
    for (let dr = -d; dr <= d; dr++)
      for (let dc = -d; dc <= d; dc++) {
        const rr = r + dr, cc = c + dc;
        if (rr >= 0 && cc >= 0 && rr < L.h && cc < L.w && L.raster[rr * L.w + cc]) return L.raster[rr * L.w + cc];
      }
  return 0;
}

export function stateNames() {
  return getLookup().states;
}

function parse(csv, key) {
  const lines = csv.trim().split("\n");
  const head = lines.shift().split(",");
  const ix = Object.fromEntries(head.map((h, i) => [h.trim(), i]));
  const out = [];
  for (const line of lines) {
    const v = line.split(",");
    const lat = +v[ix.latitude], lon = +v[ix.longitude];
    const s = stateAt(lat, lon);
    if (!s) continue;
    const t = v[ix.acq_time].padStart(4, "0");
    const when = Date.parse(`${v[ix.acq_date]}T${t.slice(0, 2)}:${t.slice(2)}:00Z`);
    const conf = v[ix.confidence];
    // [lat, lon, frp, time (ms), product, state id, night?, confidence]
    out.push([
      Math.round(lat * 1e4) / 1e4,
      Math.round(lon * 1e4) / 1e4,
      Math.round((+v[ix.frp] || 0) * 10) / 10,
      when,
      key,
      s,
      v[ix.daynight] === "N" ? 1 : 0,
      key === "modis" ? (+conf >= 80 ? "h" : +conf >= 30 ? "n" : "l") : conf,
    ]);
  }
  return out;
}

export async function fetchLive() {
  const results = await Promise.allSettled(
    FEEDS.map(async (f) => {
      const r = await fetch(f.url, { next: { revalidate: 1800 }, headers: { "User-Agent": "noctis-centauri" } });
      if (!r.ok) throw new Error(`${f.key} ${r.status}`);
      return { key: f.key, points: parse(await r.text(), f.key) };
    })
  );
  const feeds = {};
  const points = [];
  results.forEach((r, i) => {
    const k = FEEDS[i].key;
    if (r.status === "fulfilled") {
      feeds[k] = { ok: true, count: r.value.points.length };
      points.push(...r.value.points);
    } else feeds[k] = { ok: false, count: 0, error: String(r.reason?.message || r.reason) };
  });
  points.sort((a, b) => a[3] - b[3]);
  return { fetched: new Date().toISOString(), feeds, points, states: stateNames() };
}
