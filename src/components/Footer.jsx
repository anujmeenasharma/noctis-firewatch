export default function Footer() {
  return (
    <footer className="border-t border-edge py-12">
      <div className="wrap flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <p className="text-2xl font-medium tracking-[-0.03em]">NOCTIS FireWatch</p>
          <p className="mt-2 max-w-[48ch] text-sm text-dune">
            Built by team NOCTIS CENTAURI for the NASA Space Apps Challenge — Harmonization of MODIS and VIIRS hot spots. Data courtesy of NASA FIRMS
            (LANCE). Exploratory, not an official fire record.
          </p>
        </div>
        <div className="mono flex flex-wrap gap-4 text-stone">
          <a href="#live" className="hover:text-bone">Live map</a>
          <a href="#near" className="hover:text-bone">Near me</a>
          <a href="#solutions" className="hover:text-bone">Solutions</a>
          <a href="#data" className="hover:text-bone">Data</a>
          <a href="#top" className="hover:text-bone">Back to top ↑</a>
        </div>
      </div>
    </footer>
  );
}
