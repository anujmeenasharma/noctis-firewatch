"use client";
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";

const QS = [
  ["#near", "Is there fire near me?", "Check any place in India against today's satellite passes."],
  ["#live", "Where is it burning today?", "Live map of every detection this week, state by state."],
  ["#seasons", "When is fire season in my state?", "Eight years of data turned into a month-by-month calendar."],
  ["#trends", "Is it getting better or worse?", "2018 → 2025, for India, your state and each season."],
  ["#satellites", "Why do the numbers not match?", "Two satellites count very differently — and a calculator to convert."],
  ["#solutions", "What can I actually do?", "Practical steps for farmers, families and officials."],
];

/** Question-first navigation right under the hero. */
export default function Questions() {
  const root = useRef(null);
  useGSAP(
    () => {
      gsap.fromTo(
        ".q-card",
        { y: 30, opacity: 0, filter: "blur(10px)" },
        { y: 0, opacity: 1, filter: "blur(0px)", duration: 0.9, stagger: 0.06, ease: "power3.out", clearProps: "filter", scrollTrigger: { trigger: root.current, start: "top 85%", once: true } }
      );
    },
    { scope: root }
  );
  return (
    <section ref={root} className="pb-[clamp(3rem,8vh,6rem)]">
      <div className="wrap">
        <p className="eyebrow">Start with your question</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {QS.map(([href, q, a], i) => (
            <a key={href} href={href} className="q-card card group flex items-start justify-between gap-4 p-5 transition-colors hover:border-ember/50">
              <span>
                <span className="mono text-ember">{String(i + 1).padStart(2, "0")}</span>
                <span className="mt-2 block text-lg font-medium leading-snug tracking-[-0.02em]">{q}</span>
                <span className="mt-1.5 block text-sm leading-relaxed text-dune">{a}</span>
              </span>
              <span className="mt-6 text-xl text-stone transition-transform duration-500 group-hover:translate-x-1 group-hover:text-ember">→</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
