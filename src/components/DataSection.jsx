"use client";
import { useData, fmt } from "@/lib/data";
import Section from "./Section";

/** 07 — where the numbers come from, how they were processed, and downloads. */
export default function DataSection() {
  const { archive, live } = useData();
  const meta = archive?.meta;
  const files = [
    ["daily.json", "Detections per day for each satellite, 2018–2025 (with night-time counts and total fire strength)."],
    ["states.json", "Detections per state per month for each satellite, 2018–2025."],
    ["grid.json", "Detections in 0.25° squares (~27 km), per year and per calendar month."],
    ["meta.json", "Record counts, confidence levels and fire-strength histograms per satellite."],
    ["live-snapshot.json", "A saved copy of the last 7 days of live detections."],
  ];
  return (
    <Section
      id="data"
      num="07"
      label="Data & method"
      title="Where every number comes from"
      lead="All figures are calculated from NASA's public fire records. Nothing is typed in by hand — rerun the build script and every chart updates."
    >
      <div className="grid grid-cols-12 gap-6">
        <div className="card col-span-12 p-6 lg:col-span-7">
          <p className="eyebrow">Sources</p>
          <ul className="mt-4 flex flex-col divide-y divide-edge">
            <li className="py-4">
              <p className="font-medium">Archive · 2018–2025</p>
              <p className="mt-1 text-dune">
                NASA FIRMS country files for India — MODIS Collection 6.1 (Terra + Aqua, 1 km) and VIIRS 375 m Collection 2 (Suomi NPP and
                NOAA-20).
              </p>
              {meta && (
                <p className="mono mt-2 text-stone">
                  {meta.products.map((p) => `${p.label}: ${fmt(p.rows)} records`).join(" · ")}
                </p>
              )}
              <a className="mt-2 inline-block text-sm text-ember hover:underline" href="https://firms.modaps.eosdis.nasa.gov/country/" target="_blank" rel="noreferrer">
                firms.modaps.eosdis.nasa.gov/country ↗
              </a>
            </li>
            <li className="py-4">
              <p className="font-medium">Live · last 7 days</p>
              <p className="mt-1 text-dune">
                NASA FIRMS near-real-time feeds for South Asia (NOAA-20, NOAA-21, Suomi NPP, MODIS), refreshed by NASA a few hours after each
                satellite pass. This site re-checks every 30 minutes.
              </p>
              {live?.fetched && (
                <p className="mono mt-2 text-stone">
                  Last fetched {new Date(live.fetched).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST ·{" "}
                  {Object.entries(live.feeds || {})
                    .map(([k, f]) => `${k}: ${f.ok ? fmt(f.count) : "unavailable"}`)
                    .join(" · ")}
                </p>
              )}
              <a className="mt-2 inline-block text-sm text-ember hover:underline" href="https://firms.modaps.eosdis.nasa.gov/active_fire/" target="_blank" rel="noreferrer">
                firms.modaps.eosdis.nasa.gov/active_fire ↗
              </a>
            </li>
            <li className="py-4">
              <p className="font-medium">State outlines</p>
              <p className="mt-1 text-dune">Natural Earth (public domain), simplified — for orientation, not legal boundaries.</p>
            </li>
          </ul>
        </div>

        <div className="card col-span-12 p-6 lg:col-span-5">
          <p className="eyebrow">How it was processed</p>
          <ol className="mt-4 flex flex-col gap-4">
            {[
              "Read every India record for each satellite and year.",
              "Kept vegetation fires only (FIRMS type 0). Factories, gas flares and other heat sources that glow all year are dropped.",
              "Placed each detection in a state by its coordinates, and in a 0.25° square.",
              "Counted detections per day, per state per month, and per square per year — for each satellite separately, never mixed.",
              "Compared MODIS and VIIRS only on days when both reported, to measure how differently they count.",
            ].map((t, i) => (
              <li key={t} className="flex gap-3 leading-relaxed text-dune">
                <span className="mono mt-1 text-ember">{i + 1}</span>
                {t}
              </li>
            ))}
          </ol>
        </div>

        <div className="card col-span-12 p-6">
          <p className="eyebrow">Download the processed data</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {files.map(([f, d]) => (
              <a key={f} href={`/data/${f}`} download className="group rounded-2xl border border-edge p-4 transition-colors hover:border-ember/60">
                <p className="mono text-bone group-hover:text-ember">{f} ↓</p>
                <p className="mt-2 text-sm text-dune">{d}</p>
              </a>
            ))}
          </div>
        </div>

        <div className="col-span-12 grid gap-4 md:grid-cols-3">
          {[
            ["Detections ≠ fires", "One fire can be seen by several satellites, or by the same one on two passes. Counts measure activity, not the number of separate fires."],
            ["No dot ≠ no fire", "Clouds, thick smoke, tree canopy, small size, or a fire that starts and ends between passes can all hide a fire from the satellite."],
            ["Not an official record", "This is an exploratory tool. For official fire data, see the Forest Survey of India and your state agencies."],
          ].map(([t, d]) => (
            <div key={t} className="rounded-2xl border border-edge p-5">
              <p className="font-medium">{t}</p>
              <p className="mt-2 text-sm leading-relaxed text-dune">{d}</p>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
