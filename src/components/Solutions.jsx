"use client";
import { useState } from "react";
import Section from "./Section";

const SRC = {
  drishti: ["Drishti IAS — Stubble burning in India (2025)", "https://www.drishtiias.com/daily-updates/daily-news-analysis/stubble-burning-in-india/print_manually"],
  bkap: ["Bhartiya Krishi Anusandhan Patrika — review of crop-residue technologies (2025)", "https://arccjournals.com/journal/bhartiya-krishi-anusandhan-patrika/BKAP837"],
  fsi: ["Forest Survey of India — forest fire alerts portal", "https://fsiforestfire.gov.in"],
  cpcb: ["CPCB — live Air Quality Index (AQI) for India", "https://airquality.cpcb.gov.in/AQI_India/"],
  health: ["The Logical Indian — staying safe in high-pollution days", "https://thelogicalindian.com/delhi-breathes-toxic-air-again-aqi-climbs-above-300-heres-how-to-stay-safe-amid-rising-pollution"],
  firms: ["NASA FIRMS — important notes on fire detections", "https://firms.modaps.eosdis.nasa.gov/alerts/notes.php"],
  mongabay: ["Mongabay India — wildfires amid heat waves (2025)", "https://india.mongabay.com/2025/04/wildfires-rage-amid-dry-weather-and-heat-waves/"],
};

const GROUPS = [
  {
    key: "farmers",
    label: "Farmers",
    intro: "Burning is the cheapest, fastest way to clear rice straw before wheat sowing. These options keep the straw out of the fire.",
    items: [
      ["Sow wheat straight into the straw", "A Happy Seeder or Super Seeder cuts the straw and sows wheat through it in one pass — no burning needed. They need a powerful tractor, so most farmers rent rather than buy.", ["bkap", "drishti"]],
      ["Rent machines from a Custom Hiring Centre", "Government-supported centres rent residue machinery by the hour or acre. Book early: demand peaks in the same two weeks after harvest (late Oct to mid Nov in Punjab and Haryana).", ["bkap"]],
      ["Spray a bio-decomposer", "ICAR's Pusa decomposer is a cheap microbial spray that helps straw rot into the soil. It works best with enough time and moisture — results are mixed when the gap before sowing is short.", ["drishti", "bkap"]],
      ["Ask about faster rice varieties and staggered harvests", "Shorter-duration rice leaves more days before wheat sowing, so there is less pressure to burn.", ["bkap"]],
    ],
  },
  {
    key: "citizens",
    label: "Everyone",
    intro: "You can't stop a fire 200 km away, but you can protect yourself from the smoke and help stop fires near you.",
    items: [
      ["Check the air before you go out", "Look up today's AQI for your city. On 'Poor' days and worse, move exercise indoors.", ["cpcb"]],
      ["Use the right mask", "Cloth and surgical masks don't stop fine smoke particles. A well-fitted N95 / KN95 does.", ["health"]],
      ["Keep smoke out at home", "Close windows when smoke is visible, run an air purifier if you have one, and keep inhalers and medicines handy.", ["health"]],
      ["Report a dangerous fire", "If a fire threatens people, homes or forest, call 112 — India's single emergency number.", []],
      ["Don't add to it", "Avoid burning leaves, garbage or garden waste, especially in the winter smog season.", []],
    ],
  },
  {
    key: "officials",
    label: "Local officials",
    intro: "Satellite data is free and arrives within hours. Used well, it puts people and machines in the right place at the right time.",
    items: [
      ["Send teams where fires are today", "The live map shows detections within hours of each satellite pass. Filter to your state and work outward from the clusters.", ["firms"]],
      ["Plan before the peak, not during it", "The fire calendar shows which weeks matter most in each state. Position machinery and awareness drives a few weeks ahead.", []],
      ["Sign up for forest fire alerts", "The Forest Survey of India sends pre-fire and near-real-time alerts to registered forest staff.", ["fsi"]],
      ["Compare years fairly", "Don't compare a MODIS count with a VIIRS count. Use the same satellite for every year, or translate with the Harmonizer above.", ["firms"]],
    ],
  },
  {
    key: "students",
    label: "Students & researchers",
    intro: "Everything here is built from open NASA data you can download and check yourself.",
    items: [
      ["Download the processed data", "The daily, state and grid files behind every chart are in the Data section below.", []],
      ["Remember what a detection is", "A detection is a hot pixel at the time of a satellite pass. Clouds, smoke, canopy and the timing of passes mean some fires are missed — no detection is not proof of no fire.", ["firms"]],
      ["Treat ratios as starting points", "The VIIRS-to-MODIS ratio changes by month, place, and day vs night. Validate any correction against ground data before using it for decisions.", ["firms"]],
      ["Read about this year's forest fires", "Heat waves and dry spells push forest fire seasons earlier and longer.", ["mongabay"]],
    ],
  },
];

/** 06 — practical steps for each audience, with sources. */
export default function Solutions() {
  const [tab, setTab] = useState("farmers");
  const g = GROUPS.find((x) => x.key === tab);
  return (
    <Section
      id="solutions"
      num="06"
      label="Solutions"
      title="What can actually be done?"
      lead="Pick who you are. Each step is practical, specific and linked to where the information comes from."
    >
      <div className="flex flex-wrap gap-2">
        {GROUPS.map((x) => (
          <button key={x.key} className="chip !h-10 !px-5 !text-[0.75rem]" aria-pressed={tab === x.key} onClick={() => setTab(x.key)}>
            {x.label}
          </button>
        ))}
      </div>
      <p className="lead mt-6 max-w-[60ch]">{g.intro}</p>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {g.items.map(([title, body, srcs], i) => (
          <article key={title} className="card flex flex-col p-6">
            <span className="mono text-ember">{String(i + 1).padStart(2, "0")}</span>
            <h3 className="mt-3 text-xl font-medium tracking-[-0.025em]">{title}</h3>
            <p className="mt-2 flex-1 leading-relaxed text-dune">{body}</p>
            {srcs.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1">
                {srcs.map((s) => (
                  <a key={s} href={SRC[s][1]} target="_blank" rel="noreferrer" className="text-[0.8rem] text-stone underline decoration-edge underline-offset-4 hover:text-ember">
                    Source: {SRC[s][0]} ↗
                  </a>
                ))}
              </div>
            )}
          </article>
        ))}
      </div>
    </Section>
  );
}
