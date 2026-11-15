"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useData, fmt, fmt1, PRODUCTS } from "@/lib/data";
import { useLive } from "@/lib/useLive";
import IndiaMap from "./IndiaMap";
import Section from "./Section";

const WINDOWS = [
  [24, "Last 24 h"],
  [72, "3 days"],
  [168, "7 days"],
];
const CONF = { h: "High", n: "Nominal", l: "Low" };

export const ist = (ms) =>
  new Date(ms).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

/** 01 — the live map: last 24 h / 3 / 7 days, filter by satellite, tap a state. */
export default function LiveMap() {
  const { archive } = useData();
  const L = useLive();
  const [hours, setHours] = useState(24);
  const [off, setOff] = useState({});
  const [state, setState] = useState(null);

  const list = useMemo(() => (L ? L.within(hours).filter((p) => !off[p[4]]) : []), [L, hours, off]);
  const points = useMemo(
    () =>
      list.map((p) => ({
        lat: p[0],
        lon: p[1],
        color: PRODUCTS[p[4]]?.hex,
        r: 1 + Math.min(3.2, Math.sqrt(p[2]) / 4),
        alpha: state == null || p[5] === state ? 0.8 : 0.18,
        data: p,
      })),
    [list, state]
  );
  const ranking = useMemo(() => (L ? L.byState(list) : []), [L, list]);
  const feeds = L ? Object.entries(L.feeds || {}) : [];

  // Detail for the selected state
  const detail = useMemo(() => {
    if (state == null || !L) return null;
    const pts = list.filter((p) => p[5] === state);
    const strongest = pts.reduce((m, p) => (p[2] > (m?.[2] ?? -1) ? p : m), null);
    const night = pts.filter((p) => p[6]).length;
    const perDay = new Map();
    for (const p of L.pts.filter((q) => q[5] === state && !off[q[4]])) {
      const d = new Date(p[3]).toISOString().slice(5, 10);
      perDay.set(d, (perDay.get(d) || 0) + 1);
    }
    const days = [...perDay.entries()].sort();
    const rank = ranking.findIndex((r) => r.id === state) + 1;
    return { pts, strongest, night, days, rank, name: L.names[state] };
  }, [state, list, L, off, ranking]);

  const maxDay = detail ? Math.max(1, ...detail.days.map((d) => d[1])) : 1;
  const maxRank = ranking[0]?.n || 1;

  return (
    <Section
      id="live"
      num="01"
      label="Live fire map"
      title="Every fire spotted from space this week"
      lead="Each glowing dot is a hot spot a satellite detected. Bigger, brighter dots are stronger fires. Tap a state to see what's happening there."
    >
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        {WINDOWS.map(([h, l]) => (
          <button key={h} className="chip" aria-pressed={hours === h} onClick={() => setHours(h)}>
            {l}
          </button>
        ))}
        <span className="mx-1 hidden h-5 w-px bg-edge sm:block" />
        {feeds.map(([k, f]) => (
          <button
            key={k}
            className="chip"
            disabled={!f.count}
            aria-pressed={!off[k] && !!f.count}
            onClick={() => setOff((o) => ({ ...o, [k]: !o[k] }))}
            title={f.count ? "" : "NASA's feed for this satellite is empty right now"}
            style={!f.count ? { opacity: 0.4, cursor: "not-allowed" } : undefined}
          >
            <span className="dot" style={{ background: PRODUCTS[k]?.hex }} />
            {PRODUCTS[k]?.short} · {f.count ? fmt(f.count) : "no data"}
          </button>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-12 gap-6">
        <div className="card relative col-span-12 overflow-hidden p-2 sm:p-4 lg:col-span-8">
          {archive && L ? (
            <IndiaMap
              outlines={archive.outlines}
              points={points}
              selected={state}
              onSelect={setState}
              aspect={1}
              tooltip={(p) => (
                <div>
                  <p className="font-medium">{L.names[p[5]]}</p>
                  <p className="mono mt-1 text-stone">{ist(p[3])} IST · {p[6] ? "night" : "day"}</p>
                  <p className="mt-1 text-dune">
                    {PRODUCTS[p[4]]?.short} · strength {fmt1(p[2])} MW · {CONF[p[7]] || p[7]} confidence
                  </p>
                </div>
              )}
            />
          ) : (
            <div className="grid aspect-square place-items-center text-stone">Loading live NASA data…</div>
          )}
          <p className="mono absolute bottom-3 left-4 text-stone">
            {fmt(list.length)} detections shown {L?.source === "snapshot" ? "· saved copy (NASA unreachable)" : ""}
          </p>
        </div>

        {/* Side panel */}
        <div className="col-span-12 lg:col-span-4">
          <div className="mb-3 flex items-center gap-2">
            <select className="field w-full" value={state ?? ""} onChange={(e) => setState(e.target.value === "" ? null : +e.target.value)}>
              <option value="">All of India</option>
              {(L?.states || archive?.outlines.features.map((f) => ({ id: f.id, name: f.properties.name })) || [])
                .slice()
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
            </select>
          </div>

          {detail ? (
            <div className="card p-5">
              <p className="eyebrow">{WINDOWS.find((w) => w[0] === hours)[1]}</p>
              <h3 className="mt-2 text-2xl font-medium tracking-[-0.03em]">{detail.name}</h3>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <p className="text-3xl font-medium tabular-nums">{fmt(detail.pts.length)}</p>
                  <p className="text-sm text-stone">detections</p>
                </div>
                <div>
                  <p className="text-3xl font-medium tabular-nums">{detail.rank ? `#${detail.rank}` : "—"}</p>
                  <p className="text-sm text-stone">in India right now</p>
                </div>
                <div>
                  <p className="text-xl font-medium tabular-nums">{fmt(detail.night)}</p>
                  <p className="text-sm text-stone">seen at night</p>
                </div>
                <div>
                  <p className="text-xl font-medium tabular-nums">{detail.strongest ? `${fmt1(detail.strongest[2])} MW` : "—"}</p>
                  <p className="text-sm text-stone">strongest fire</p>
                </div>
              </div>
              <p className="eyebrow mt-6">Detections per day (UTC)</p>
              <div className="mt-3 flex h-28 items-end gap-1.5">
                {detail.days.map(([d, n]) => (
                  <div key={d} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                    <span className="mono !text-[0.6rem] text-dune">{n}</span>
                    <div className="w-full rounded-t bg-ember/80" style={{ height: `${(n / maxDay) * 80}%` }} />
                    <span className="mono !text-[0.58rem] text-stone">{d.slice(3)}</span>
                  </div>
                ))}
              </div>
              <Link href="/near-me" className="btn btn-ghost mt-6 w-full">
                Check a place in {detail.name} →
              </Link>
            </div>
          ) : (
            <div className="card p-5">
              <p className="eyebrow">Most detections · {WINDOWS.find((w) => w[0] === hours)[1]}</p>
              <ol className="mt-4 flex flex-col gap-2.5">
                {ranking.slice(0, 10).map((r, i) => (
                  <li key={r.id}>
                    <button onClick={() => setState(r.id)} className="group w-full text-left">
                      <div className="flex items-baseline justify-between gap-3 text-sm">
                        <span>
                          <span className="mono mr-2 text-stone">{String(i + 1).padStart(2, "0")}</span>
                          <span className="group-hover:text-ember">{r.name}</span>
                        </span>
                        <span className="tabular-nums text-dune">{fmt(r.n)}</span>
                      </div>
                      <div className="mt-1.5 h-1.5 rounded-full bg-edge">
                        <div className="h-full rounded-full bg-gradient-to-r from-amber to-ember" style={{ width: `${(r.n / maxRank) * 100}%` }} />
                      </div>
                    </button>
                  </li>
                ))}
                {!ranking.length && <li className="text-stone">Loading…</li>}
              </ol>
              <p className="mt-5 text-[0.8rem] text-stone">Tap a state on the map or in this list for its details.</p>
            </div>
          )}
        </div>
      </div>
    </Section>
  );
}
