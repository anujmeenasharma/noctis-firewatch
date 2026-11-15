"use client";
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import Link from "next/link";
import { ROUTES } from "@/lib/routes";

const QS = ROUTES.map((r) => [r.href, r.question, r.blurb]);

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
        <p className="eyebrow">Start with your question — each one opens its own page</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {QS.map(([href, q, a], i) => (
            <Link key={href} href={href} className="q-card card group flex items-start justify-between gap-4 p-5 transition-colors hover:border-ember/50">
              <span>
                <span className="mono text-ember">{String(i + 1).padStart(2, "0")}</span>
                <span className="mt-2 block text-lg font-medium leading-snug tracking-[-0.02em]">{q}</span>
                <span className="mt-1.5 block text-sm leading-relaxed text-dune">{a}</span>
              </span>
              <span className="mt-6 text-xl text-stone transition-transform duration-500 group-hover:translate-x-1 group-hover:text-ember">→</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
