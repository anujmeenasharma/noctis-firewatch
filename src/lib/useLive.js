"use client";
import { useMemo } from "react";
import { useData } from "./data";

const H = 3600000;

/**
 * Live feed, shaped for the UI. Points: [lat, lon, frp, time, product, state, night, conf].
 * Windows are measured back from the newest detection (not from "now"),
 * because NASA publishes in batches a few hours after each overpass.
 */
export function useLive() {
  const { live, archive } = useData();
  return useMemo(() => {
    if (!live?.points) return null;
    const pts = live.points;
    const latest = pts.length ? pts[pts.length - 1][3] : Date.now();
    const names = Object.fromEntries((live.states || []).map((s) => [s.id, s.name]));
    const within = (hours) => pts.filter((p) => p[3] > latest - hours * H);
    const byState = (list) => {
      const m = new Map();
      for (const p of list) m.set(p[5], (m.get(p[5]) || 0) + 1);
      return [...m.entries()].map(([id, n]) => ({ id, name: names[id] || "—", n })).sort((a, b) => b.n - a.n);
    };
    // Per-day counts over the 7-day window (UTC days).
    const days = new Map();
    for (const p of pts) {
      const d = new Date(p[3]).toISOString().slice(0, 10);
      days.set(d, (days.get(d) || 0) + 1);
    }
    const d24 = within(24);
    return {
      pts,
      latest,
      names,
      feeds: live.feeds,
      source: live.source,
      fetched: live.fetched,
      last24: d24,
      byState24: byState(d24),
      byState7: byState(pts),
      within,
      byState,
      days: [...days.entries()].sort(),
      outlines: archive?.outlines,
      states: live.states || [],
    };
  }, [live, archive]);
}
