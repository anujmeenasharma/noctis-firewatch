"use client";
import { useEffect, useState } from "react";
import { useData, timeAgo } from "@/lib/data";

const LINKS = [
  ["#live", "Live map"],
  ["#near", "Near me"],
  ["#seasons", "Fire seasons"],
  ["#trends", "Trends"],
  ["#satellites", "Satellites"],
  ["#solutions", "Solutions"],
  ["#data", "Data"],
];

/** Fixed top bar: brand, section links (sheet on phones) and a live status pill. */
export default function Nav() {
  const { live } = useData();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [now, setNow] = useState(0);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 60000);
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      clearInterval(id);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const latest = live?.points?.length ? live.points[live.points.length - 1][3] : null;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-500 ${
        scrolled || open ? "border-b border-edge bg-ink/80 backdrop-blur-xl" : "bg-transparent"
      }`}
    >
      <div className="wrap flex h-16 items-center justify-between gap-6">
        <a href="#top" className="flex items-center gap-3" onClick={() => setOpen(false)}>
          <span className="relative grid h-7 w-7 place-items-center rounded-full bg-ember/15">
            <span className="h-2.5 w-2.5 rounded-full bg-ember" />
          </span>
          <span className="leading-none">
            <span className="block text-[0.95rem] font-semibold tracking-[-0.02em]">NOCTIS FireWatch</span>
            <span className="mono mt-0.5 block !text-[0.6rem] text-stone">India · NASA satellite fires</span>
          </span>
        </a>

        <nav className="hidden items-center gap-1 xl:flex">
          {LINKS.map(([h, l]) => (
            <a key={h} href={h} className="rounded-full px-3 py-2 text-[0.85rem] text-dune transition-colors hover:bg-panel hover:text-bone">
              {l}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <span className="mono hidden items-center gap-2 rounded-full border border-edge px-3 py-1.5 sm:inline-flex">
            <span className="pulse relative h-2 w-2 rounded-full bg-ember text-ember" />
            {latest && now ? <>Live · last fire {timeAgo(latest, now)}</> : "Connecting to NASA…"}
          </span>
          <button className="chip xl:hidden" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
            {open ? "Close" : "Menu"}
          </button>
        </div>
      </div>

      {open && (
        <nav className="wrap grid grid-cols-2 gap-2 pb-5 xl:hidden">
          {LINKS.map(([h, l], i) => (
            <a key={h} href={h} onClick={() => setOpen(false)} className="card flex items-baseline gap-3 px-4 py-3.5">
              <span className="mono text-ember">0{i + 1}</span>
              <span>{l}</span>
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}
