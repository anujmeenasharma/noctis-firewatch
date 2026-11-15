"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useData, timeAgo } from "@/lib/data";
import { ROUTES } from "@/lib/routes";

/** Fixed top bar: brand, page links (sheet on smaller screens), live status. */
export default function Nav() {
  const { live } = useData();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [now, setNow] = useState(0);

  useEffect(() => setOpen(false), [pathname]);
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
        scrolled || open ? "border-b border-edge bg-ink/85 backdrop-blur-xl" : "bg-transparent"
      }`}
    >
      <div className="wrap flex h-16 items-center justify-between gap-6">
        <Link href="/" className="flex shrink-0 items-center gap-3">
          <span className="relative grid h-7 w-7 place-items-center rounded-full bg-ember/15">
            <span className="h-2.5 w-2.5 rounded-full bg-ember" />
          </span>
          <span className="leading-none">
            <span className="block text-[0.95rem] font-semibold tracking-[-0.02em]">NOCTIS CENTAURI</span>
            <span className="mono mt-0.5 block !text-[0.6rem] text-stone">India · NASA satellite fires</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 xl:flex">
          {ROUTES.map((r) => {
            const on = pathname === r.href;
            return (
              <Link
                key={r.href}
                href={r.href}
                aria-current={on ? "page" : undefined}
                className={`rounded-full px-3 py-2 text-[0.85rem] transition-colors ${
                  on ? "bg-panel text-bone" : "text-dune hover:bg-panel hover:text-bone"
                }`}
              >
                {r.label}
              </Link>
            );
          })}
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
        <nav className="wrap grid grid-cols-1 gap-2 pb-5 sm:grid-cols-2 xl:hidden">
          <Link href="/" className={`card flex items-baseline gap-3 px-4 py-3.5 ${pathname === "/" ? "border-ember/50" : ""}`}>
            <span className="mono text-ember">00</span>
            <span>Overview</span>
          </Link>
          {ROUTES.map((r, i) => (
            <Link key={r.href} href={r.href} className={`card flex items-baseline gap-3 px-4 py-3.5 ${pathname === r.href ? "border-ember/50" : ""}`}>
              <span className="mono text-ember">0{i + 1}</span>
              <span>
                {r.label}
                <span className="block text-sm text-stone">{r.question}</span>
              </span>
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
