// Build the site's data from NASA FIRMS.
//
//   node scripts/build-data.mjs [rawDir]
//
// rawDir holds the yearly India country files from FIRMS
// (https://firms.modaps.eosdis.nasa.gov/data/country/<product>/<year>/<product>_<year>_India.csv)
// for product in modis, viirs-snpp, viirs-jpss1 and years 2018–2025.
// Every figure on the site is derived here (or in the browser) from those files;
// nothing is hand-entered except labels.
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const RAW = process.argv[2] || process.env.FIRMS_RAW || path.join(ROOT, "raw");
const OUT = path.join(ROOT, "public", "data");
const LIB = path.join(ROOT, "src", "lib");
fs.mkdirSync(OUT, { recursive: true });

const YEARS = [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];
const PRODUCTS = [
  { key: "modis", file: "modis", label: "MODIS", sat: "Terra + Aqua", pixel: 1000 },
  { key: "snpp", file: "viirs-snpp", label: "VIIRS · Suomi NPP", sat: "Suomi NPP", pixel: 375 },
  { key: "noaa20", file: "viirs-jpss1", label: "VIIRS · NOAA-20", sat: "NOAA-20", pixel: 375 },
];

// ───────────────────────── State lookup raster ─────────────────────────
// Scanline-fill every state polygon into a 0.025° raster over India so each
// detection gets its state with one array read.
const geo = JSON.parse(fs.readFileSync(path.join(HERE, "geo_context.json"), "utf8"));
const STATES = geo.states.map((s, i) => ({ id: i + 1, name: s.n, g: s.g })).sort((a, b) => a.name.localeCompare(b.name));
STATES.forEach((s, i) => (s.id = i + 1));
const RES = 0.025, LAT0 = 6, LAT1 = 37.6, LON0 = 68, LON1 = 97.6;
const W = Math.round((LON1 - LON0) / RES), H = Math.round((LAT1 - LAT0) / RES);
const raster = new Uint8Array(W * H);

function polys(g) {
  return g.type === "Polygon" ? [g.coordinates] : g.type === "MultiPolygon" ? g.coordinates : [];
}
for (const s of STATES) {
  for (const poly of polys(s.g)) {
    let minY = Infinity, maxY = -Infinity;
    for (const ring of poly) for (const [, y] of ring) (minY = Math.min(minY, y)), (maxY = Math.max(maxY, y));
    const r0 = Math.max(0, Math.floor((minY - LAT0) / RES)), r1 = Math.min(H - 1, Math.ceil((maxY - LAT0) / RES));
    for (let r = r0; r <= r1; r++) {
      const y = LAT0 + (r + 0.5) * RES;
      const xs = [];
      for (const ring of poly)
        for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
          const [x1, y1] = ring[i], [x2, y2] = ring[j];
          if (y1 > y !== y2 > y) xs.push(x1 + ((y - y1) / (y2 - y1)) * (x2 - x1));
        }
      xs.sort((a, b) => a - b);
      for (let k = 0; k + 1 < xs.length; k += 2) {
        const c0 = Math.max(0, Math.ceil((xs[k] - LON0) / RES - 0.5)), c1 = Math.min(W - 1, Math.floor((xs[k + 1] - LON0) / RES - 0.5));
        for (let c = c0; c <= c1; c++) raster[r * W + c] = s.id;
      }
    }
  }
}
// Coastal / border points can land just outside the simplified outlines:
// give them the nearest state within ~10 km.
function stateAt(lat, lon) {
  const r = Math.floor((lat - LAT0) / RES), c = Math.floor((lon - LON0) / RES);
  if (r < 0 || c < 0 || r >= H || c >= W) return 0;
  const v = raster[r * W + c];
  if (v) return v;
  for (let d = 1; d <= 4; d++)
    for (let dr = -d; dr <= d; dr++)
      for (let dc = -d; dc <= d; dc++) {
        const rr = r + dr, cc = c + dc;
        if (rr >= 0 && cc >= 0 && rr < H && cc < W && raster[rr * W + cc]) return raster[rr * W + cc];
      }
  return 0;
}
fs.writeFileSync(path.join(LIB, "state-raster.bin"), Buffer.from(raster));
fs.writeFileSync(
  path.join(LIB, "state-raster.json"),
  JSON.stringify({ res: RES, lat0: LAT0, lon0: LON0, w: W, h: H, states: STATES.map((s) => ({ id: s.id, name: s.name })) })
);

// ───────────────────────── Aggregation ─────────────────────────
const DAY = 86400000;
const T0 = Date.UTC(2018, 0, 1);
const NDAYS = Math.round((Date.UTC(2026, 0, 1) - T0) / DAY);
const NMONTHS = YEARS.length * 12;
const NS = STATES.length + 1; // index 0 = unassigned

const agg = {};
for (const p of PRODUCTS)
  agg[p.key] = {
    day: new Uint32Array(NDAYS),
    dayN: new Uint32Array(NDAYS), // night-time detections
    frpDay: new Float64Array(NDAYS),
    stateMonth: Array.from({ length: NS }, () => new Uint32Array(NMONTHS)),
    stateFrp: new Float64Array(NS),
    grid: new Map(), // "lat|lon" → Uint32Array(YEARS) yearly counts
    gridMoy: new Map(), // "lat|lon" → Uint32Array(12) month-of-year totals
    frpHist: new Uint32Array(40), // log10 FRP bins, 0.1 width from -1 to 3
    types: new Uint32Array(4),
    conf: {},
    total: 0,
    kept: 0,
  };

function cellKey(lat, lon) {
  const a = Math.floor(lat / 0.25) * 0.25 + 0.125, b = Math.floor(lon / 0.25) * 0.25 + 0.125;
  return a.toFixed(3) + "|" + b.toFixed(3);
}

async function readFile(p, year) {
  const f = path.join(RAW, `${p.file}_${year}_India.csv`);
  if (!fs.existsSync(f)) {
    console.warn("  missing", path.basename(f));
    return;
  }
  const A = agg[p.key];
  const rl = readline.createInterface({ input: fs.createReadStream(f), crlfDelay: Infinity });
  let idx = null;
  for await (const line of rl) {
    if (!idx) {
      const h = line.split(",");
      idx = Object.fromEntries(h.map((k, i) => [k, i]));
      continue;
    }
    const v = line.split(",");
    A.total++;
    const type = +v[idx.type];
    if (type >= 0 && type < 4) A.types[type]++;
    // Keep vegetation / presumed fires only (type 0). Type 2 = static land
    // sources (factories, gas flares) that burn all year; 1 = volcano; 3 = offshore.
    if (type !== 0) continue;
    const lat = +v[idx.latitude], lon = +v[idx.longitude];
    const t = Date.parse(v[idx.acq_date] + "T00:00:00Z");
    const d = Math.round((t - T0) / DAY);
    if (d < 0 || d >= NDAYS) continue;
    A.kept++;
    const frp = +v[idx.frp] || 0;
    const dn = v[idx.daynight];
    A.day[d]++;
    if (dn === "N") A.dayN[d]++;
    A.frpDay[d] += frp;
    const dt = new Date(t);
    const m = (dt.getUTCFullYear() - 2018) * 12 + dt.getUTCMonth();
    const s = stateAt(lat, lon);
    A.stateMonth[s][m]++;
    A.stateFrp[s] += frp;
    const k = cellKey(lat, lon);
    let g = A.grid.get(k);
    if (!g) A.grid.set(k, (g = new Uint32Array(YEARS.length)));
    g[dt.getUTCFullYear() - 2018]++;
    let gm = A.gridMoy.get(k);
    if (!gm) A.gridMoy.set(k, (gm = new Uint32Array(12)));
    gm[dt.getUTCMonth()]++;
    const hb = Math.max(0, Math.min(39, Math.floor((Math.log10(Math.max(frp, 0.1)) + 1) * 10)));
    A.frpHist[hb]++;
    const c = v[idx.confidence];
    const ck = p.key === "modis" ? (+c >= 80 ? "high" : +c >= 30 ? "nominal" : "low") : c === "h" ? "high" : c === "n" ? "nominal" : "low";
    A.conf[ck] = (A.conf[ck] || 0) + 1;
  }
}

for (const p of PRODUCTS)
  for (const y of YEARS) {
    process.stdout.write(`reading ${p.file} ${y}…`);
    const t = Date.now();
    await readFile(p, y);
    console.log(` ${((Date.now() - t) / 1000).toFixed(1)}s`);
  }

// ───────────────────────── Write outputs ─────────────────────────
const r1 = (x) => Math.round(x * 10) / 10;

// Daily series (one array per product; index 0 = 2018-01-01).
fs.writeFileSync(
  path.join(OUT, "daily.json"),
  JSON.stringify({
    start: "2018-01-01",
    days: NDAYS,
    products: Object.fromEntries(
      PRODUCTS.map((p) => [p.key, { count: [...agg[p.key].day], night: [...agg[p.key].dayN], frp: [...agg[p.key].frpDay].map(Math.round) }])
    ),
  })
);

// States: monthly counts per product, 2018-01 … 2025-12.
fs.writeFileSync(
  path.join(OUT, "states.json"),
  JSON.stringify({
    months: NMONTHS,
    start: "2018-01",
    states: [{ id: 0, name: "Unassigned (coast / border)" }, ...STATES.map((s) => ({ id: s.id, name: s.name }))].map((s) => ({
      ...s,
      m: Object.fromEntries(PRODUCTS.map((p) => [p.key, [...agg[p.key].stateMonth[s.id]]])),
      frp: Object.fromEntries(PRODUCTS.map((p) => [p.key, Math.round(agg[p.key].stateFrp[s.id])])),
    })),
  })
);

// 0.25° grid: yearly counts + month-of-year totals for each product.
const keys = new Set();
for (const p of PRODUCTS) for (const k of agg[p.key].grid.keys()) keys.add(k);
const cells = [...keys].map((k) => k.split("|").map(Number));
fs.writeFileSync(
  path.join(OUT, "grid.json"),
  JSON.stringify({
    res: 0.25,
    years: YEARS,
    cells,
    year: Object.fromEntries(PRODUCTS.map((p) => [p.key, [...keys].map((k) => [...(agg[p.key].grid.get(k) || new Uint32Array(YEARS.length))])])),
    moy: Object.fromEntries(PRODUCTS.map((p) => [p.key, [...keys].map((k) => [...(agg[p.key].gridMoy.get(k) || new Uint32Array(12))])])),
  })
);

// Map outlines (states only, already simplified upstream) + product facts.
fs.writeFileSync(path.join(OUT, "outlines.json"), JSON.stringify({ type: "FeatureCollection", features: STATES.map((s) => ({ type: "Feature", id: s.id, properties: { name: s.name }, geometry: s.g })) }));

fs.writeFileSync(
  path.join(OUT, "meta.json"),
  JSON.stringify(
    {
      generated: new Date().toISOString(),
      years: YEARS,
      source: "NASA FIRMS country archive (India), MODIS C6.1 and VIIRS 375 m C2",
      products: PRODUCTS.map((p) => ({
        key: p.key,
        label: p.label,
        sat: p.sat,
        pixel: p.pixel,
        rows: agg[p.key].total,
        kept: agg[p.key].kept,
        types: [...agg[p.key].types],
        confidence: agg[p.key].conf,
        frpHist: [...agg[p.key].frpHist],
      })),
    },
    null,
    1
  )
);

for (const f of fs.readdirSync(OUT)) console.log(f.padEnd(16), (fs.statSync(path.join(OUT, f)).size / 1024).toFixed(0) + " KB");
for (const p of PRODUCTS) console.log(p.key, "rows", agg[p.key].total, "kept", agg[p.key].kept, "unassigned", agg[p.key].stateMonth[0].reduce((a, b) => a + b, 0));

// Save a copy of the live 7-day feed so the site still has recent fires to
// show if NASA's servers can't be reached at request time.
try {
  const { fetchLive } = await import("../src/lib/live.js");
  const live = await fetchLive();
  fs.writeFileSync(path.join(OUT, "live-snapshot.json"), JSON.stringify(live));
  console.log("live snapshot:", live.points.length, "points", live.fetched);
} catch (e) {
  console.warn("live snapshot skipped:", e.message);
}
