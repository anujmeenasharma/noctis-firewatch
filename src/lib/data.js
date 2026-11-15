"use client";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

/**
 * Loads everything once and shares it:
 *  - archive (2018–2025, built from NASA FIRMS by scripts/build-data.mjs)
 *  - live    (last 7 days, /api/live → NASA FIRMS near real-time feeds)
 */
const Ctx = createContext(null);

export const PRODUCTS = {
  modis: { label: "MODIS", short: "MODIS", sat: "Terra + Aqua", pixel: "1 km", color: "var(--c-modis)", hex: "#ffb547" },
  snpp: { label: "VIIRS · Suomi NPP", short: "Suomi NPP", sat: "Suomi NPP", pixel: "375 m", color: "var(--c-snpp)", hex: "#ff5a2c" },
  noaa20: { label: "VIIRS · NOAA-20", short: "NOAA-20", sat: "NOAA-20", pixel: "375 m", color: "var(--c-noaa20)", hex: "#ff4d7d" },
  noaa21: { label: "VIIRS · NOAA-21", short: "NOAA-21", sat: "NOAA-21", pixel: "375 m", color: "var(--c-noaa21)", hex: "#b48cff" },
};

export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export const fmt = (n) => (n == null || Number.isNaN(n) ? "—" : Math.round(n).toLocaleString("en-IN"));
export const fmt1 = (n) => (n == null || Number.isNaN(n) ? "—" : (Math.round(n * 10) / 10).toLocaleString("en-IN"));
export const pct = (n) => (n == null || !Number.isFinite(n) ? "—" : `${n > 0 ? "+" : ""}${Math.round(n)}%`);

export function timeAgo(ms, now = Date.now()) {
  const m = Math.max(0, Math.round((now - ms) / 60000));
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 48) return `${h} hr ago`;
  return `${Math.round(h / 24)} days ago`;
}

// Great-circle distance in km.
export function km(lat1, lon1, lat2, lon2) {
  const R = 6371, toR = Math.PI / 180;
  const dLat = (lat2 - lat1) * toR, dLon = (lon2 - lon1) * toR;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * toR) * Math.cos(lat2 * toR) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function DataProvider({ children }) {
  const [archive, setArchive] = useState(null);
  const [live, setLive] = useState(null);
  const [liveError, setLiveError] = useState(null);

  useEffect(() => {
    let off = false;
    // meta.json is always fetched fresh; its build time versions the other
    // (cacheable) files, so a data rebuild reaches visitors immediately.
    fetch("/data/meta.json", { cache: "no-store" })
      .then((r) => r.json())
      .then((meta) => {
        const v = encodeURIComponent(meta.generated);
        return Promise.all(["daily", "states", "outlines", "grid"].map((n) => fetch(`/data/${n}.json?v=${v}`).then((r) => r.json()))).then(
          ([daily, states, outlines, grid]) => !off && setArchive({ meta, daily, states, outlines, grid })
        );
      });
    const loadLive = () =>
      fetch("/api/live")
        .then((r) => r.json())
        .then((d) => !off && setLive(d))
        .catch((e) => !off && setLiveError(String(e)));
    loadLive();
    const id = setInterval(loadLive, 30 * 60 * 1000); // NASA refreshes every few hours
    return () => {
      off = true;
      clearInterval(id);
    };
  }, []);

  const value = useMemo(() => ({ archive, live, liveError }), [archive, live, liveError]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useData = () => useContext(Ctx);

// ── Archive helpers ──
export function stateYearTotals(state, key) {
  const m = state.m[key];
  return Array.from({ length: m.length / 12 }, (_, y) => m.slice(y * 12, y * 12 + 12).reduce((a, b) => a + b, 0));
}
export function stateMonthProfile(state, key) {
  // Average detections per calendar month across all archive years.
  const m = state.m[key];
  const years = m.length / 12;
  return Array.from({ length: 12 }, (_, i) => {
    let s = 0;
    for (let y = 0; y < years; y++) s += m[y * 12 + i];
    return s / years;
  });
}
export const sum = (a) => a.reduce((x, y) => x + y, 0);
