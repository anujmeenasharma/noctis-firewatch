"use client";
import { useMemo, useState } from "react";
import { useData, fmt, pct, PRODUCTS, sum } from "@/lib/data";
import Section from "./Section";

const YEARS = [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];
const SEASONS = [
  ["year", "Whole year", [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]],
  ["stubble", "Oct–Nov (rice stubble)", [9, 10]],
  ["spring", "Feb–May (forest & wheat)", [1, 2, 3, 4]],
];

function yearly(state, key, months) {
  const m = state.m[key];
  return YEARS.map((_, y) => sum(months.map((i) => m[y * 12 + i])));
}

/** 04 — is it getting better or worse? Year-by-year, by state and season. */
export default function Trends() {
  const { archive } = useData();
  const [season, setSeason] = useState("year");
  const [sid, setSid] = useState(null);
  const months = SEASONS.find((s) => s[0] === season)[2];

  const data = useMemo(() => {
    if (!archive) return null;
    const st = archive.states.states;
    const india = Object.fromEntries(
      ["modis", "snpp", "noaa20"].map((k) => [k, YEARS.map((_, y) => sum(st.map((s) => sum(months.map((i) => s.m[k][y * 12 + i])))))])
    );
    // Change: average of the last three years vs the first three (VIIRS Suomi NPP).
    const change = st
      .filter((s) => s.id)
      .map((s) => {
        const v = yearly(s, "snpp", months);
        const a = (v[0] + v[1] + v[2]) / 3, b = (v[5] + v[6] + v[7]) / 3;
        return { id: s.id, name: s.name, a, b, d: a ? ((b - a) / a) * 100 : null, v };
      })
      .filter((s) => s.a >= 300);
    const up = [...change].sort((x, y) => y.d - x.d).slice(0, 5);
    const down = [...change].sort((x, y) => x.d - y.d).slice(0, 5);
    return { india, change, up, down };
  }, [archive, months]);

  const states = archive?.states.states.filter((s) => s.id) || [];
  const defaultId = states.find((s) => s.name === "Punjab")?.id;
  const cur = states.find((s) => s.id === (sid ?? defaultId));
  const curV = cur ? Object.fromEntries(["modis", "snpp", "noaa20"].map((k) => [k, yearly(cur, k, months)])) : null;

  const Bars = ({ series, h = 180 }) => {
    const max = Math.max(1, ...Object.values(series).flat());
    return (
      <div className="flex items-end gap-2 sm:gap-3" style={{ height: h }}>
        {YEARS.map((y, i) => (
          <div key={y} className="flex h-full flex-1 flex-col justify-end">
            <div className="flex flex-1 items-end justify-center gap-[2px]">
              {Object.entries(series).map(([k, v]) => (
                <div
                  key={k}
                  title={`${PRODUCTS[k].short} ${y}: ${fmt(v[i])}`}
                  className="w-full max-w-[14px] rounded-t-[3px] transition-[height] duration-700"
                  style={{ height: `${(v[i] / max) * 100}%`, background: PRODUCTS[k].hex }}
                />
              ))}
            </div>
            <span className="mono mt-2 text-center !text-[0.6rem] text-stone">{String(y).slice(2)}</span>
          </div>
        ))}
      </div>
    );
  };

  const change = (v) => {
    const a = (v[0] + v[1] + v[2]) / 3, b = (v[5] + v[6] + v[7]) / 3;
    return a ? ((b - a) / a) * 100 : null;
  };

  return (
    <Section
      id="trends"
      num="04"
      label="Trends 2018–2025"
      title="Is it getting better or worse?"
      lead="Pick a season and a state. Compare the last three years (2023–25) with the first three (2018–20) to see where burning is falling — and where it's growing."
    >
      <div className="flex flex-wrap gap-2">
        {SEASONS.map(([k, l]) => (
          <button key={k} className="chip" aria-pressed={season === k} onClick={() => setSeason(k)}>
            {l}
          </button>
        ))}
      </div>

      {data && (
        <div className="mt-6 grid grid-cols-12 gap-6">
          {/* India */}
          <div className="card col-span-12 p-6 lg:col-span-6">
            <p className="eyebrow">All of India · detections per year</p>
            <p className="mt-3 text-4xl font-medium tracking-[-0.04em]">
              {pct(change(data.india.snpp))}
              <span className="ml-3 text-base font-normal text-dune">2023–25 vs 2018–20 (Suomi NPP)</span>
            </p>
            <div className="mt-8">
              <Bars series={data.india} />
            </div>
            <Legend />
          </div>

          {/* State */}
          <div className="card col-span-12 p-6 lg:col-span-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="eyebrow">Your state</p>
              <select className="field !h-10 min-w-0 flex-1 sm:max-w-[16rem]" value={cur?.id ?? ""} onChange={(e) => setSid(+e.target.value)}>
                {[...states]
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
              </select>
            </div>
            {curV && (
              <>
                <p className="mt-3 text-4xl font-medium tracking-[-0.04em]">
                  {pct(change(curV.snpp))}
                  <span className="ml-3 text-base font-normal text-dune">{cur.name}</span>
                </p>
                <div className="mt-8">
                  <Bars series={curV} />
                </div>
                <Legend />
              </>
            )}
          </div>

          {/* Movers */}
          {[
            ["Falling the most", data.down, "text-leaf"],
            ["Rising the most", data.up, "text-ember"],
          ].map(([title, list, tone]) => (
            <div key={title} className="card col-span-12 p-6 md:col-span-6">
              <p className="eyebrow">{title} · 2023–25 vs 2018–20</p>
              <ul className="mt-4 flex flex-col divide-y divide-edge">
                {list.map((s) => (
                  <li key={s.id}>
                    <button className="flex w-full items-center justify-between gap-4 py-3 text-left hover:text-ember" onClick={() => setSid(s.id)}>
                      <span>{s.name}</span>
                      <span className="flex items-center gap-4">
                        <span className="hidden text-sm text-stone sm:inline">
                          {fmt(s.a)} → {fmt(s.b)} a year
                        </span>
                        <span className={`w-16 text-right font-medium tabular-nums ${tone}`}>{pct(s.d)}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
      <p className="mt-4 text-[0.8rem] text-stone">
        States with fewer than 300 detections a year in this season are left out of the lists so tiny numbers don't look like big swings. Weather
        (rain, floods, clouds over the satellite pass) can move a single year a lot — look at the direction over several years.
      </p>
    </Section>
  );
}

function Legend() {
  return (
    <div className="mt-5 flex flex-wrap gap-4">
      {["modis", "snpp", "noaa20"].map((k) => (
        <span key={k} className="mono flex items-center gap-2 text-dune">
          <span className="dot" style={{ background: PRODUCTS[k].hex }} />
          {PRODUCTS[k].short} <span className="text-stone">({PRODUCTS[k].pixel})</span>
        </span>
      ))}
    </div>
  );
}
