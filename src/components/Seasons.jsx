"use client";
import { useEffect, useMemo, useState } from "react";
import * as d3 from "d3";
import { useData, fmt, MONTHS, MONTHS_LONG, stateMonthProfile, sum } from "@/lib/data";
import IndiaMap from "./IndiaMap";
import Section from "./Section";

// What a peak in a given month usually means in India (plain language).
export function seasonNote(peak) {
  if (peak === 9 || peak === 10) return "Peaks in Oct–Nov, right after the rice harvest — typical of crop-stubble burning before the wheat is sown.";
  if (peak === 3 || peak === 4) return "Peaks in Apr–May, after the wheat harvest and in the hottest, driest weeks — farm burning and forest fires overlap.";
  if (peak >= 1 && peak <= 2) return "Peaks in Feb–Mar, the dry season for many forests — mostly forest and grassland fires, often lit to clear land.";
  if (peak === 11 || peak === 0) return "Peaks in Dec–Jan — winter burning of residue and scrub.";
  return "Peaks in the monsoon months — fire is unusual then, so these are often small or industrial heat sources.";
}

const fire = d3.scaleSequential(d3.interpolateRgbBasis(["#16181d", "#4a1d12", "#a8321a", "#ff5a2c", "#ffb547", "#fff1c9"]));

/** 03 — when does each state burn? Calendar heatmap + month-by-month map. */
export default function Seasons() {
  const { archive } = useData();
  const [prod, setProd] = useState("snpp");
  const [mode, setMode] = useState("size"); // size | timing
  const [sort, setSort] = useState("total");
  const [sel, setSel] = useState(null);
  const [month, setMonth] = useState(new Date().getMonth());
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setMonth((m) => (m + 1) % 12), 900);
    return () => clearInterval(id);
  }, [playing]);

  const rows = useMemo(() => {
    if (!archive) return [];
    const r = archive.states.states
      .filter((s) => s.id !== 0)
      .map((s) => {
        const prof = stateMonthProfile(s, prod);
        const total = sum(prof);
        return { id: s.id, name: s.name, prof, total, peak: prof.indexOf(Math.max(...prof)) };
      })
      .filter((s) => s.total >= 1);
    if (sort === "total") r.sort((a, b) => b.total - a.total);
    if (sort === "peak") r.sort((a, b) => ((a.peak + 3) % 12) - ((b.peak + 3) % 12) || b.total - a.total);
    if (sort === "name") r.sort((a, b) => a.name.localeCompare(b.name));
    return r;
  }, [archive, prod, sort]);

  const gmax = useMemo(() => Math.max(1, ...rows.flatMap((r) => r.prof)), [rows]);
  const color = (v, row) => {
    if (!v) return "#16181d";
    if (mode === "timing") return fire(Math.min(1, v / Math.max(...row.prof)));
    return fire(Math.min(1, Math.log1p(v) / Math.log1p(gmax)));
  };

  const detail = rows.find((r) => r.id === sel) || rows[0];

  // Map of the chosen calendar month (all years summed, 0.25° cells).
  const cells = useMemo(() => {
    if (!archive) return null;
    const g = archive.grid;
    const vals = g.moy[prod].map((m) => m[month] / g.years.length);
    const max = d3.quantile(vals.filter((v) => v > 0).sort(d3.ascending), 0.995) || 1;
    return g.cells
      .map(([lat, lon], i) => ({ lat, lon, v: vals[i] }))
      .filter((c) => c.v > 0)
      .map((c) => ({ ...c, color: fire(0.08 + 0.92 * Math.pow(Math.min(1, Math.log1p(c.v) / Math.log1p(max)), 1.8)) }));
  }, [archive, prod, month]);

  const monthTotal = useMemo(() => (rows.length ? sum(rows.map((r) => r.prof[month])) : 0), [rows, month]);
  const monthTop = useMemo(() => [...rows].sort((a, b) => b.prof[month] - a.prof[month]).slice(0, 3), [rows, month]);

  return (
    <Section
      id="seasons"
      num="03"
      label="Fire seasons"
      title="Every state has a fire calendar"
      lead="Fires in India aren't random — they follow harvests and dry seasons. Eight years of satellite data (2018–2025) show exactly when each state burns."
    >
      {/* Month map */}
      <div className="grid grid-cols-12 gap-6">
        <div className="card col-span-12 p-2 sm:p-4 lg:col-span-7">
          {archive && <IndiaMap outlines={archive.outlines} cells={cells} cellSize={archive.grid.res} aspect={1} glow={false} />}
        </div>
        <div className="col-span-12 flex flex-col justify-between gap-6 lg:col-span-5">
          <div>
            <p className="eyebrow">Where fires happen in</p>
            <p className="mt-2 text-[clamp(2.6rem,5vw,4.5rem)] font-medium leading-none tracking-[-0.05em]">{MONTHS_LONG[month]}</p>
            <p className="lead mt-4">
              On average about <span className="text-bone">{fmt(monthTotal)}</span> fire detections a year fall in {MONTHS_LONG[month]}. Most come from{" "}
              {monthTop.map((t, i) => (
                <span key={t.id}>
                  <button className="text-bone underline decoration-ember/60 underline-offset-4 hover:text-ember" onClick={() => setSel(t.id)}>
                    {t.name}
                  </button>
                  {i < monthTop.length - 2 ? ", " : i === monthTop.length - 2 ? " and " : "."}
                </span>
              ))}
            </p>
          </div>
          <div>
            <div className="flex items-center gap-3">
              <button className="btn btn-ghost !h-10 !px-4" onClick={() => setPlaying((p) => !p)}>
                {playing ? "❚❚ Pause" : "▶ Play the year"}
              </button>
              <span className="mono text-stone">or drag</span>
            </div>
            <input type="range" min={0} max={11} value={month} onChange={(e) => (setPlaying(false), setMonth(+e.target.value))} className="mt-4 w-full" />
            <div className="mono mt-1 flex justify-between text-stone">
              {MONTHS.map((m, i) => (
                <button key={m} onClick={() => (setPlaying(false), setMonth(i))} className={i === month ? "text-ember" : ""}>
                  {m[0]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="mt-14 flex flex-wrap items-center gap-2">
        <span className="eyebrow mr-2">Colour by</span>
        <button className="chip" aria-pressed={mode === "size"} onClick={() => setMode("size")}>
          How many fires
        </button>
        <button className="chip" aria-pressed={mode === "timing"} onClick={() => setMode("timing")}>
          Each state's peak
        </button>
        <span className="eyebrow ml-3 mr-2">Sort</span>
        {[
          ["total", "Most fires"],
          ["peak", "Season"],
          ["name", "A–Z"],
        ].map(([k, l]) => (
          <button key={k} className="chip" aria-pressed={sort === k} onClick={() => setSort(k)}>
            {l}
          </button>
        ))}
        <span className="eyebrow ml-3 mr-2">Satellite</span>
        {[
          ["snpp", "VIIRS (375 m)"],
          ["modis", "MODIS (1 km)"],
        ].map(([k, l]) => (
          <button key={k} className="chip" aria-pressed={prod === k} onClick={() => setProd(k)}>
            {l}
          </button>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-12 gap-6">
        <div className="card col-span-12 min-w-0 overflow-x-auto p-4 sm:p-5 lg:col-span-8">
          <div className="min-w-[560px]">
            <div className="grid grid-cols-[minmax(8rem,11rem)_repeat(12,1fr)] gap-[3px]">
              <span />
              {MONTHS.map((m, i) => (
                <span key={m} className={`mono pb-1 text-center !text-[0.6rem] ${i === month ? "text-ember" : "text-stone"}`}>
                  {m}
                </span>
              ))}
              {rows.map((r) => (
                <div key={r.id} className="contents">
                  <button
                    onClick={() => setSel(r.id)}
                    className={`truncate pr-2 text-left text-[0.8rem] ${detail?.id === r.id ? "text-ember" : "text-dune hover:text-bone"}`}
                  >
                    {r.name}
                  </button>
                  {r.prof.map((v, i) => (
                    <button
                      key={i}
                      onClick={() => (setSel(r.id), setMonth(i))}
                      title={`${r.name}, ${MONTHS_LONG[i]}: ~${fmt(v)} detections a year`}
                      className={`h-6 rounded-[4px] transition-transform hover:scale-110 ${detail?.id === r.id ? "ring-1 ring-ember/50" : ""}`}
                      style={{ background: color(v, r) }}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {detail && (
          <div className="card col-span-12 p-6 lg:col-span-4 lg:self-start">
            <p className="eyebrow">Fire calendar</p>
            <h3 className="mt-2 text-3xl font-medium tracking-[-0.035em]">{detail.name}</h3>
            <p className="mt-2 text-dune">
              About <span className="text-bone">{fmt(detail.total)}</span> detections a year · peak in{" "}
              <span className="text-bone">{MONTHS_LONG[detail.peak]}</span>
            </p>
            <div className="mt-6 flex h-36 items-end gap-1">
              {detail.prof.map((v, i) => (
                <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                  <div
                    className="w-full rounded-t"
                    style={{ height: `${(v / Math.max(...detail.prof)) * 100}%`, background: i === detail.peak ? "#ff5a2c" : "#5a2a1a" }}
                  />
                  <span className={`mono !text-[0.58rem] ${i === detail.peak ? "text-ember" : "text-stone"}`}>{MONTHS[i][0]}</span>
                </div>
              ))}
            </div>
            <p className="mt-6 leading-relaxed text-dune">{seasonNote(detail.peak)}</p>
          </div>
        )}
      </div>
      <p className="mt-4 text-[0.8rem] text-stone">
        Average detections per calendar month, 2018–2025, from NASA FIRMS. Only vegetation fires are counted — factories and gas flares that glow all
        year are removed.
      </p>
    </Section>
  );
}
