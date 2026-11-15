"use client";
import { useMemo, useState } from "react";
import * as d3 from "d3";
import { useData, fmt, fmt1, MONTHS, MONTHS_LONG, PRODUCTS, sum } from "@/lib/data";
import Section from "./Section";

const median = (a) => d3.median(a);

/**
 * 05 — why satellites disagree, and a calculator that translates between them
 * (the "harmonization" problem from the NASA Space Apps challenge).
 */
export default function Satellites() {
  const { archive } = useData();
  const [dir, setDir] = useState("m2v"); // MODIS → VIIRS or back
  const [input, setInput] = useState(250);
  const [sid, setSid] = useState(0); // 0 = all India
  const [month, setMonth] = useState(10);

  const S = useMemo(() => {
    if (!archive) return null;
    const P = archive.daily.products;
    const n = archive.daily.days;
    const t0 = Date.parse(archive.daily.start + "T00:00:00Z");
    // Daily pairs where both products reported something.
    const pairs = [];
    const byMonth = Array.from({ length: 12 }, () => ({ m: 0, v: 0, mn: 0, vn: 0 }));
    let tm = 0, tv = 0, mDay = 0, vDay = 0, mNight = 0, vNight = 0;
    for (let i = 0; i < n; i++) {
      const m = P.modis.count[i], v = P.snpp.count[i];
      if (!m || !v) continue;
      const mo = new Date(t0 + i * 864e5).getUTCMonth();
      pairs.push({ m, v, mo });
      byMonth[mo].m += m;
      byMonth[mo].v += v;
      tm += m;
      tv += v;
      mNight += P.modis.night[i];
      vNight += P.snpp.night[i];
      mDay += m - P.modis.night[i];
      vDay += v - P.snpp.night[i];
    }
    const meta = Object.fromEntries(archive.meta.products.map((p) => [p.key, p]));
    const hist = (k) => {
      const h = meta[k].frpHist;
      const t = sum(h) || 1;
      return h.map((x) => x / t);
    };
    return {
      pairs,
      ratio: tv / tm,
      day: vDay / mDay,
      night: vNight / mNight,
      byMonth: byMonth.map((b) => b.v / (b.m || 1)),
      histM: hist("modis"),
      histV: hist("snpp"),
      tm,
      tv,
    };
  }, [archive]);

  // Calculator: monthly VIIRS/MODIS ratios for the chosen place + calendar month.
  const calc = useMemo(() => {
    if (!archive) return null;
    const st = archive.states.states;
    const pick = sid === 0 ? st : st.filter((s) => s.id === sid);
    const ratios = [];
    for (let y = 0; y < 8; y++) {
      const i = y * 12 + month;
      const m = sum(pick.map((s) => s.m.modis[i])), v = sum(pick.map((s) => s.m.snpp[i]));
      if (m >= 10 && v > 0) ratios.push(v / m);
    }
    ratios.sort(d3.ascending);
    if (!ratios.length) return { n: 0 };
    const r = median(ratios), lo = d3.quantile(ratios, 0.25), hi = d3.quantile(ratios, 0.75);
    const k = dir === "m2v" ? [r, lo, hi] : [1 / r, 1 / hi, 1 / lo];
    return { n: ratios.length, r, out: input * k[0], lo: input * k[1], hi: input * k[2] };
  }, [archive, sid, month, input, dir]);

  // Scatter of daily counts (log–log)
  const W = 520, H = 360, M = { l: 44, r: 12, t: 12, b: 34 };
  const sc = useMemo(() => {
    if (!S) return null;
    const x = d3.scaleLog().domain([1, d3.max(S.pairs, (p) => p.m)]).range([M.l, W - M.r]).nice();
    const y = d3.scaleLog().domain([1, d3.max(S.pairs, (p) => p.v)]).range([H - M.b, M.t]).nice();
    return { x, y };
  }, [S]);
  const monthColor = d3.scaleSequential(d3.interpolateRgbBasis(["#7cc0ff", "#7ed39a", "#ffb547", "#ff5a2c", "#b48cff", "#7cc0ff"])).domain([0, 12]);

  const states = archive?.states.states.filter((s) => s.id).sort((a, b) => a.name.localeCompare(b.name)) || [];

  return (
    <Section
      id="satellites"
      num="05"
      label="Why satellites disagree"
      title="Two satellites, two very different counts"
      lead="MODIS (on NASA's Terra and Aqua, since 2000) sees the ground in 1 km squares. VIIRS (on Suomi NPP and NOAA-20/21) sees 375 m squares — about seven times finer. So VIIRS catches many small fires MODIS misses. Before you compare years or places, you have to account for that."
    >
      {S && (
        <>
          {/* Pixel explainer + headline numbers */}
          <div className="grid grid-cols-12 gap-6">
            <div className="card col-span-12 p-6 md:col-span-5">
              <p className="eyebrow">Same fire, different eyes</p>
              <div className="mt-5 grid grid-cols-2 gap-5">
                {[
                  ["MODIS", "1 km square", 1, "#ffb547"],
                  ["VIIRS", "375 m squares", 3, "#ff5a2c"],
                ].map(([name, cap, n, c]) => (
                  <figure key={name}>
                    <svg viewBox="0 0 120 120" className="w-full">
                      {Array.from({ length: n * n }).map((_, i) => {
                        const s = 120 / n, cx = (i % n) * s, cy = Math.floor(i / n) * s;
                        const hit = n === 1 || (i % n === 1 && Math.floor(i / n) === 1);
                        return <rect key={i} x={cx + 1} y={cy + 1} width={s - 2} height={s - 2} rx="3" fill={hit ? c + "33" : "#1c1f25"} stroke={hit ? c : "#2c3038"} />;
                      })}
                      <circle cx="60" cy="60" r="9" fill="#ff5a2c" />
                      <circle cx="60" cy="60" r="16" fill="#ff5a2c" opacity="0.25" />
                    </svg>
                    <figcaption className="mt-2 text-sm">
                      <span className="font-medium">{name}</span> <span className="text-stone">· {cap}</span>
                    </figcaption>
                  </figure>
                ))}
              </div>
              <p className="mt-5 text-[0.95rem] leading-relaxed text-dune">
                A small fire fills a big part of one VIIRS square, so it stands out. In a MODIS square the same fire is diluted by all the cool ground
                around it and can be missed.
              </p>
            </div>

            <div className="col-span-12 grid grid-cols-2 gap-4 md:col-span-7">
              {[
                [`${fmt1(S.ratio)}×`, "more detections from VIIRS (Suomi NPP) than MODIS, same days, 2018–2025"],
                [`${fmt1(S.day)}×`, "daytime ratio"],
                [`${fmt1(S.night)}×`, "night-time ratio — VIIRS is especially better at seeing small fires at night"],
                [`${fmt(S.tv)}`, `VIIRS detections vs ${fmt(S.tm)} MODIS detections in the archive`],
              ].map(([big, small]) => (
                <div key={small} className="card p-5">
                  <p className="text-[clamp(2rem,3.4vw,3.2rem)] font-medium leading-none tracking-[-0.04em] text-ember">{big}</p>
                  <p className="mt-3 text-[0.9rem] leading-snug text-dune">{small}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Calculator */}
          <div className="card mt-6 grid grid-cols-12 gap-6 p-5 sm:p-8">
            <div className="col-span-12 lg:col-span-5">
              <p className="eyebrow text-ember">Harmonizer · try it</p>
              <h3 className="mt-3 text-[clamp(1.6rem,2.6vw,2.4rem)] font-medium leading-tight tracking-[-0.035em]">Translate a fire count from one satellite to the other</h3>
              <p className="mt-3 leading-relaxed text-dune">
                Old reports often use MODIS; newer ones use VIIRS. Enter a count, pick where and when, and we estimate what the other satellite would
                have reported — using how the two compared in that same place and month every year from 2018 to 2025.
              </p>
            </div>
            <div className="col-span-12 grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-7">
              <div className="flex gap-2 sm:col-span-2">
                <button className="chip" aria-pressed={dir === "m2v"} onClick={() => setDir("m2v")}>
                  MODIS → VIIRS
                </button>
                <button className="chip" aria-pressed={dir === "v2m"} onClick={() => setDir("v2m")}>
                  VIIRS → MODIS
                </button>
              </div>
              <label className="flex flex-col gap-2 text-sm text-dune">
                {dir === "m2v" ? "MODIS" : "VIIRS"} fire count
                <input className="field" type="number" min={0} value={input} onChange={(e) => setInput(Math.max(0, +e.target.value || 0))} />
              </label>
              <label className="flex flex-col gap-2 text-sm text-dune">
                Month
                <select className="field" value={month} onChange={(e) => setMonth(+e.target.value)}>
                  {MONTHS_LONG.map((m, i) => (
                    <option key={m} value={i}>
                      {m}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-2 text-sm text-dune sm:col-span-2">
                Where
                <select className="field" value={sid} onChange={(e) => setSid(+e.target.value)}>
                  <option value={0}>All of India</option>
                  {states.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="rounded-2xl border border-ember/30 bg-ember/10 p-5 sm:col-span-2">
                {calc?.n ? (
                  <>
                    <p className="text-sm text-dune">{dir === "m2v" ? "VIIRS (Suomi NPP)" : "MODIS"} would likely report</p>
                    <p className="mt-1 text-[clamp(2.2rem,4vw,3.4rem)] font-medium leading-none tracking-[-0.04em]">≈ {fmt(calc.out)}</p>
                    <p className="mt-2 text-sm text-dune">
                      Likely range {fmt(calc.lo)} – {fmt(calc.hi)} · typical ratio {fmt1(calc.r)}× · based on {calc.n} years of {MONTHS[month]} data
                    </p>
                  </>
                ) : (
                  <p className="text-dune">Not enough fires in this place and month to compare the two satellites. Try “All of India” or another month.</p>
                )}
              </div>
            </div>
          </div>

          {/* Evidence */}
          <div className="mt-6 grid grid-cols-12 gap-6">
            <div className="card col-span-12 p-6 lg:col-span-7">
              <p className="eyebrow">Every day 2018–2025 · MODIS vs VIIRS count</p>
              <svg viewBox={`0 0 ${W} ${H}`} className="mt-4 w-full">
                {sc.x.ticks(4).map((t) => (
                  <g key={"x" + t}>
                    <line x1={sc.x(t)} x2={sc.x(t)} y1={M.t} y2={H - M.b} stroke="#23262d" />
                    <text x={sc.x(t)} y={H - 14} fill="#8a857d" fontSize="10" textAnchor="middle">
                      {fmt(t)}
                    </text>
                  </g>
                ))}
                {sc.y.ticks(4).map((t) => (
                  <g key={"y" + t}>
                    <line x1={M.l} x2={W - M.r} y1={sc.y(t)} y2={sc.y(t)} stroke="#23262d" />
                    <text x={M.l - 6} y={sc.y(t) + 3} fill="#8a857d" fontSize="10" textAnchor="end">
                      {fmt(t)}
                    </text>
                  </g>
                ))}
                {S.pairs.map((p, i) => (
                  <circle key={i} cx={sc.x(p.m)} cy={sc.y(p.v)} r="1.6" fill={monthColor(p.mo)} opacity="0.55" />
                ))}
                {[1, S.ratio].map((k, i) => (
                  <line
                    key={k}
                    x1={sc.x(1)}
                    y1={sc.y(Math.max(1, k))}
                    x2={sc.x(sc.x.domain()[1])}
                    y2={sc.y(Math.min(sc.y.domain()[1], sc.x.domain()[1] * k))}
                    stroke={i ? "#ff5a2c" : "#8a857d"}
                    strokeDasharray={i ? "" : "4 4"}
                    strokeWidth="1.2"
                  />
                ))}
                <text x={W - M.r} y={H - 2} fill="#8a857d" fontSize="10" textAnchor="end">
                  MODIS detections per day →
                </text>
                <text x={4} y={10} fill="#8a857d" fontSize="10">
                  ↑ VIIRS per day
                </text>
              </svg>
              <p className="mt-3 text-sm text-stone">
                Each dot is one day, coloured by month. Dashed line = equal counts. Orange line = the overall {fmt1(S.ratio)}× ratio. The dots sit well
                above the dashed line almost every day.
              </p>
            </div>

            <div className="col-span-12 flex flex-col gap-6 lg:col-span-5">
              <div className="card p-6">
                <p className="eyebrow">The gap changes through the year</p>
                <div className="mt-4 flex h-32 items-end gap-1">
                  {S.byMonth.map((r, i) => (
                    <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                      <span className="mono !text-[0.55rem] text-dune">{fmt1(r)}</span>
                      <div className="w-full rounded-t bg-ember/80" style={{ height: `${(r / Math.max(...S.byMonth)) * 80}%` }} />
                      <span className="mono !text-[0.55rem] text-stone">{MONTHS[i][0]}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-sm text-stone">VIIRS ÷ MODIS by month. One fixed conversion factor would be wrong for part of the year.</p>
              </div>
              <div className="card p-6">
                <p className="eyebrow">VIIRS sees weaker fires</p>
                <div className="mt-4 flex h-28 items-end gap-[2px]">
                  {S.histV.slice(0, 32).map((v, i) => {
                    const top = Math.max(...S.histV, ...S.histM);
                    return (
                      <div key={i} className="flex h-full flex-1 items-end gap-[1px]">
                        <div className="flex-1 rounded-t-sm bg-amber" style={{ height: `${(S.histM[i] / top) * 100}%` }} />
                        <div className="flex-1 rounded-t-sm bg-ember" style={{ height: `${(v / top) * 100}%` }} />
                      </div>
                    );
                  })}
                </div>
                <div className="mono mt-2 flex justify-between text-stone">
                  <span>0.1 MW</span>
                  <span>Fire strength (FRP) →</span>
                  <span>~500 MW</span>
                </div>
                <p className="mt-3 text-sm text-stone">
                  <span className="text-ember">Red</span> = share of VIIRS detections at each strength; <span className="text-amber">yellow</span> = MODIS.
                  VIIRS has many more weak fires; MODIS mostly records the bigger ones.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </Section>
  );
}
