"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import { useData, fmt, timeAgo, PRODUCTS } from "@/lib/data";
import { useLive } from "@/lib/useLive";
import IndiaMap from "./IndiaMap";
import Copy from "./motion/Copy";

function CountUp({ value, className = "" }) {
  const ref = useRef(null);
  const v = useRef({ n: 0 });
  useEffect(() => {
    if (value == null) return;
    gsap.to(v.current, {
      n: value,
      duration: 1.6,
      ease: "power3.out",
      onUpdate: () => ref.current && (ref.current.textContent = fmt(v.current.n)),
    });
  }, [value]);
  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      {value == null ? "—" : "0"}
    </span>
  );
}

/**
 * Opening screen: the one question most people have — "where is it burning
 * right now?" — answered with live numbers and a glowing map of the last 24 h.
 */
export default function Hero() {
  const { archive } = useData();
  const L = useLive();
  const root = useRef(null);
  const [now, setNow] = useState(0);
  useEffect(() => setNow(Date.now()), [L]);

  const points = useMemo(
    () =>
      (L?.last24 || []).map((p) => ({
        lat: p[0],
        lon: p[1],
        color: PRODUCTS[p[4]]?.hex || "#ff5a2c",
        r: 1 + Math.min(3, Math.sqrt(p[2]) / 4),
        alpha: 0.7,
      })),
    [L]
  );

  useGSAP(
    () => {
      gsap.fromTo(
        ".h-in",
        { y: 24, opacity: 0, filter: "blur(10px)" },
        { y: 0, opacity: 1, filter: "blur(0px)", duration: 1, stagger: 0.08, delay: 0.4, ease: "power3.out", clearProps: "filter" }
      );
      gsap.fromTo(".h-map", { opacity: 0, scale: 0.98 }, { opacity: 1, scale: 1, duration: 1.6, delay: 0.2, ease: "power2.out" });
    },
    { scope: root }
  );

  const top = L?.byState24?.[0];
  const sats = L ? Object.entries(L.feeds || {}).filter(([, f]) => f.ok && f.count) : [];

  return (
    <section id="top" ref={root} className="relative overflow-hidden pt-24 lg:min-h-svh">
      {/* warm glow */}
      <div className="pointer-events-none absolute -right-40 top-10 h-[60vw] w-[60vw] rounded-full bg-ember/10 blur-[120px]" />

      <div className="wrap relative grid grid-cols-12 items-center gap-x-8 gap-y-10 pb-16">
        <div className="col-span-12 lg:col-span-6">
          <p className="h-in eyebrow flex flex-wrap items-center gap-2">
            <span className="pulse relative h-2 w-2 rounded-full bg-ember text-ember" />
            Live from NASA satellites
            {L && now ? <span className="text-dune">· newest fire seen {timeAgo(L.latest, now)}</span> : null}
          </p>
          <Copy animateOnScroll={false} delay={0.2} stagger={0.05}>
            <h1 className="h-display mt-5 text-[clamp(2.9rem,7.2vw,7rem)]">Where is India burning right now?</h1>
          </Copy>
          <p className="h-in lead mt-6 max-w-[42ch]">
            Satellites pass over India several times a day and spot fires from space — crop stubble, forest fires, grassland. This site turns
            that raw NASA data into answers anyone can use: what's burning today, when your state's fire season comes, and what you can do
            about the smoke.
          </p>
          <div className="h-in mt-8 flex flex-wrap gap-3">
            <Link href="/near-me" className="btn btn-fire">
              Is there fire near me? <span aria-hidden>→</span>
            </Link>
            <Link href="/live-map" className="btn btn-ghost">
              Open the live map
            </Link>
          </div>

          {/* Live numbers */}
          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
            {[
              ["Fire detections, last 24 h", <CountUp key="a" value={L?.last24.length} />],
              ["Last 7 days", <CountUp key="b" value={L?.pts.length} />],
              ["Most active state (24 h)", top ? <span key="c">{top.name}</span> : "—"],
              ["Satellites reporting", L ? <span key="d">{sats.length}</span> : "—"],
            ].map(([label, val]) => (
              <div key={label} className="h-in card px-4 py-4">
                <p className="text-[clamp(1.4rem,2.2vw,2rem)] font-medium leading-tight tracking-[-0.03em]">{val}</p>
                <p className="mt-1.5 text-[0.8rem] leading-snug text-stone">{label}</p>
              </div>
            ))}
          </div>
          <p className="h-in mt-3 text-[0.78rem] text-stone">
            A “detection” is one hot spot seen by one satellite pass. The same fire can be seen by several satellites, so detections are not
            the same as separate fires.
          </p>
        </div>

        <div className="h-map col-span-12 lg:col-span-6">
          <div className="relative">
            {archive && <IndiaMap outlines={archive.outlines} points={points} aspect={1.05} />}
            {!archive && <div className="aspect-[1/1.05] w-full animate-pulse rounded-3xl bg-panel" />}
            <div className="absolute bottom-2 left-2 flex flex-wrap gap-x-4 gap-y-1">
              <span className="mono text-stone">Last 24 h of detections</span>
              {sats.map(([k]) => (
                <span key={k} className="mono flex items-center gap-1.5 text-dune">
                  <span className="dot" style={{ background: PRODUCTS[k]?.hex }} />
                  {PRODUCTS[k]?.short}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
