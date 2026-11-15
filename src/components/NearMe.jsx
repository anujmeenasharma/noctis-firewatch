"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useData, fmt, fmt1, km, timeAgo, MONTHS_LONG, stateMonthProfile, PRODUCTS } from "@/lib/data";
import { useLive } from "@/lib/useLive";
import { CITIES } from "@/lib/cities";
import IndiaMap from "./IndiaMap";
import Section from "./Section";
import { ist } from "./LiveMap";

const LEVELS = [
  {
    key: "clear",
    label: "No fires nearby",
    tone: "text-leaf",
    bg: "bg-leaf/10 border-leaf/30",
    say: "Satellites have not detected any fire within this distance in the last 24 hours.",
    todo: ["Nothing to do right now.", "Smoke can still travel hundreds of km — if the air smells of smoke, check today's air quality."],
  },
  {
    key: "low",
    label: "A few fires nearby",
    tone: "text-amber",
    bg: "bg-amber/10 border-amber/30",
    say: "Up to ten fires were detected around you in the last 24 hours. You may notice some smoke.",
    todo: [
      "Check today's air quality index (AQI) before exercising outdoors.",
      "If you see a fire spreading towards homes or forest, call 112 (India's emergency number).",
    ],
  },
  {
    key: "moderate",
    label: "Many fires nearby",
    tone: "text-flame",
    bg: "bg-flame/10 border-flame/30",
    say: "Between 11 and 60 fires were detected around you in the last 24 hours — smoke is likely.",
    todo: [
      "Limit long outdoor activity, especially for children, older people and anyone with asthma or heart disease.",
      "Keep windows closed when smoke is visible; use an air purifier if you have one.",
      "Keep inhalers and regular medicines within reach.",
    ],
  },
  {
    key: "high",
    label: "Very high fire activity",
    tone: "text-ember",
    bg: "bg-ember/10 border-ember/30",
    say: "More than 60 fires were detected around you in the last 24 hours — expect heavy smoke and poor air.",
    todo: [
      "Avoid outdoor exercise. Wear a well-fitted N95 / FFP2 mask if you must be outside for long.",
      "Stay indoors with windows and doors closed; run an air purifier if available.",
      "See a doctor if you have chest pain, breathlessness or a persistent cough.",
      "Report a fire that threatens people or property on 112.",
    ],
  },
];
const levelFor = (n) => (n === 0 ? LEVELS[0] : n <= 10 ? LEVELS[1] : n <= 60 ? LEVELS[2] : LEVELS[3]);

function bearing(lat1, lon1, lat2, lon2) {
  const toR = Math.PI / 180;
  const y = Math.sin((lon2 - lon1) * toR) * Math.cos(lat2 * toR);
  const x = Math.cos(lat1 * toR) * Math.sin(lat2 * toR) - Math.sin(lat1 * toR) * Math.cos(lat2 * toR) * Math.cos((lon2 - lon1) * toR);
  const deg = (Math.atan2(y, x) / toR + 360) % 360;
  return ["north", "north-east", "east", "south-east", "south", "south-west", "west", "north-west"][Math.round(deg / 45) % 8];
}

/** 02 — "Is there fire near me?": a place + a radius → plain-language answer and what to do. */
export default function NearMe() {
  const { archive } = useData();
  const L = useLive();
  const [place, setPlace] = useState({ name: "Delhi", lat: 28.61, lon: 77.21 });
  const [radius, setRadius] = useState(100);
  const [geoErr, setGeoErr] = useState(null);

  const res = useMemo(() => {
    if (!L) return null;
    const near = [];
    for (const p of L.pts) {
      const d = km(place.lat, place.lon, p[0], p[1]);
      if (d <= radius) near.push({ p, d });
    }
    const n24 = near.filter((x) => x.p[3] > L.latest - 24 * 3600000);
    const nearest = near.reduce((m, x) => (!m || x.d < m.d ? x : m), null);
    const strongest = near.reduce((m, x) => (!m || x.p[2] > m.p[2] ? x : m), null);
    // Which state is this place in? Use the nearest fire's state if there is one, else nothing.
    return { near, n24, nearest, strongest };
  }, [L, place, radius]);

  // Seasonal context: is this normally a fire month here? (closest state by archive grid)
  const season = useMemo(() => {
    if (!archive || !res) return null;
    const sid = res.nearest?.p[5];
    if (!sid) return null;
    const st = archive.states.states.find((s) => s.id === sid);
    if (!st) return null;
    const prof = stateMonthProfile(st, "snpp");
    const m = new Date(L.latest).getUTCMonth();
    const peak = prof.indexOf(Math.max(...prof));
    const share = prof[m] / (prof.reduce((a, b) => a + b, 0) || 1);
    return { name: st.name, month: MONTHS_LONG[m], peak: MONTHS_LONG[peak], isPeak: share >= 0.12, avg: prof[m] };
  }, [archive, res, L]);

  const level = res ? levelFor(res.n24.length) : null;
  // Everything this week, faint, for context — fires inside the circle bright.
  const points = useMemo(
    () => [
      ...(L?.pts || []).map((p) => ({ lat: p[0], lon: p[1], color: "#ff8a3d", r: 1, alpha: 0.12 })),
      ...(res?.near || []).map(({ p }) => ({
        lat: p[0],
        lon: p[1],
        color: PRODUCTS[p[4]]?.hex,
        r: 1.4 + Math.min(3, Math.sqrt(p[2]) / 4),
        alpha: p[3] > (L?.latest || 0) - 24 * 3600000 ? 0.95 : 0.35,
        data: p,
      })),
    ],
    [res, L]
  );

  const useMyLocation = () => {
    setGeoErr(null);
    if (!navigator.geolocation) return setGeoErr("Location isn't available in this browser.");
    navigator.geolocation.getCurrentPosition(
      (pos) => setPlace({ name: "Your location", lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => setGeoErr("Location permission was blocked — pick a city or tap the map instead."),
      { timeout: 10000 }
    );
  };

  return (
    <Section
      id="near"
      num="02"
      label="Near me"
      title="Is there fire near me?"
      lead="Pick your city, use your location, or tap the map. We count the fires satellites found around that point and tell you what it means for you."
    >
      <div className="grid grid-cols-12 gap-6">
        {/* Inputs + map */}
        <div className="col-span-12 lg:col-span-7">
          <div className="card p-4 sm:p-5">
            <div className="flex flex-wrap gap-2">
              <select
                className="field min-w-0 flex-1"
                value={CITIES.find((c) => c[0] === place.name) ? place.name : ""}
                onChange={(e) => {
                  const c = CITIES.find((x) => x[0] === e.target.value);
                  if (c) setPlace({ name: c[0], lat: c[1], lon: c[2] });
                }}
              >
                <option value="" disabled>
                  {place.name === "Your location" ? "Your location" : "Pick a place on the map"}
                </option>
                {CITIES.map((c) => (
                  <option key={c[0]} value={c[0]}>
                    {c[0]}
                  </option>
                ))}
              </select>
              <button className="btn btn-ghost !h-[2.9rem]" onClick={useMyLocation}>
                ◎ Use my location
              </button>
            </div>
            {geoErr && <p className="mt-2 text-sm text-amber">{geoErr}</p>}
            <label className="mt-5 block">
              <span className="flex justify-between text-sm text-dune">
                <span>Search distance</span>
                <span className="tabular-nums text-bone">{radius} km</span>
              </span>
              <input type="range" min={10} max={300} step={10} value={radius} onChange={(e) => setRadius(+e.target.value)} className="mt-2 w-full" />
            </label>
          </div>
          <div className="card mt-4 p-2 sm:p-4">
            {archive && (
              <IndiaMap
                outlines={archive.outlines}
                points={points}
                marker={{ ...place, radiusKm: radius }}
                onPick={(lat, lon) => setPlace({ name: "Point on map", lat: Math.round(lat * 100) / 100, lon: Math.round(lon * 100) / 100 })}
                tooltip={(p) => (
                  <div>
                    <p className="font-medium">{fmt1(km(place.lat, place.lon, p[0], p[1]))} km away</p>
                    <p className="mono mt-1 text-stone">{ist(p[3])} IST</p>
                    <p className="mt-1 text-dune">
                      {PRODUCTS[p[4]]?.short} · {fmt1(p[2])} MW
                    </p>
                  </div>
                )}
                aspect={0.9}
              />
            )}
            <p className="mono px-2 pb-1 text-stone">Tap anywhere on the map to move the search point. Bright = last 24 h, faded = earlier this week.</p>
          </div>
        </div>

        {/* Answer */}
        <div className="col-span-12 lg:col-span-5">
          {res && level ? (
            <div className="flex flex-col gap-4">
              <div className={`rounded-[18px] border p-6 ${level.bg}`}>
                <p className="eyebrow">
                  {place.name} · within {radius} km
                </p>
                <p className={`mt-3 text-[clamp(1.8rem,3vw,2.6rem)] font-medium leading-none tracking-[-0.035em] ${level.tone}`}>{level.label}</p>
                <p className="mt-3 text-dune">{level.say}</p>
                <div className="mt-5 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-3xl font-medium tabular-nums">{fmt(res.n24.length)}</p>
                    <p className="text-sm text-stone">detections, last 24 h</p>
                  </div>
                  <div>
                    <p className="text-3xl font-medium tabular-nums">{fmt(res.near.length)}</p>
                    <p className="text-sm text-stone">detections, last 7 days</p>
                  </div>
                </div>
                {res.nearest && (
                  <p className="mt-5 border-t border-white/10 pt-4 text-sm text-dune">
                    Nearest: <span className="text-bone">{fmt1(res.nearest.d)} km {bearing(place.lat, place.lon, res.nearest.p[0], res.nearest.p[1])}</span>, seen {ist(res.nearest.p[3])} IST.
                  </p>
                )}
              </div>

              <div className="card p-6">
                <p className="eyebrow">What to do</p>
                <ul className="mt-4 flex flex-col gap-3">
                  {level.todo.map((t) => (
                    <li key={t} className="flex gap-3 text-[0.95rem] leading-relaxed">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-ember" />
                      {t}
                    </li>
                  ))}
                </ul>
                <div className="mt-5 flex flex-wrap gap-2">
                  <a className="chip" href="https://airquality.cpcb.gov.in/AQI_India/" target="_blank" rel="noreferrer">
                    Check live AQI (CPCB) ↗
                  </a>
                  <a className="chip" href="tel:112">
                    Emergency · 112
                  </a>
                </div>
              </div>

              {season && (
                <div className="card p-6">
                  <p className="eyebrow">Is this normal for {season.name}?</p>
                  <p className="mt-3 leading-relaxed text-dune">
                    {season.isPeak ? (
                      <>
                        <span className="text-bone">Yes — {season.month} is one of {season.name}'s main fire months.</span> Over 2018–2025 the state averaged{" "}
                        {fmt(season.avg)} detections in {season.month} (Suomi NPP). Its peak month is {season.peak}.
                      </>
                    ) : (
                      <>
                        <span className="text-bone">{season.month} is usually a quiet month for {season.name}</span> (about {fmt(season.avg)} detections on average,
                        2018–2025). Its fire season peaks in {season.peak}.
                      </>
                    )}
                  </p>
                  <Link href="/fire-seasons" className="mt-4 inline-block text-sm text-ember hover:underline">
                    See every state's fire calendar →
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="card grid h-60 place-items-center text-stone">Loading live NASA data…</div>
          )}
        </div>
      </div>
    </Section>
  );
}
