import Link from "next/link";
import { ROUTES } from "@/lib/routes";

export default function Footer() {
  return (
    <footer className="border-t border-edge py-12">
      <div className="wrap grid gap-10 md:grid-cols-[1fr_auto]">
        <div>
          <p className="text-2xl font-medium tracking-[-0.03em]">NOCTIS CENTAURI</p>
          <p className="mt-2 max-w-[48ch] text-sm text-dune">
            Built for the NASA Space Apps Challenge — Harmonization of MODIS and VIIRS hot spots. Data courtesy of NASA FIRMS (LANCE). Exploratory,
            not an official fire record.
          </p>
        </div>
        <nav className="mono grid grid-cols-2 gap-x-8 gap-y-2.5 text-stone sm:grid-cols-4">
          <Link href="/" className="hover:text-bone">Overview</Link>
          {ROUTES.map((r) => (
            <Link key={r.href} href={r.href} className="hover:text-bone">
              {r.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
