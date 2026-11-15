import Link from "next/link";
import Copy from "./motion/Copy";
import { ROUTES } from "@/lib/routes";

/**
 * Page body for one topic: number + label, big title, plain-language intro,
 * the content, then a link on to the next page.
 */
export default function Section({ id, num, label, title, lead, children, className = "", aside }) {
  const i = ROUTES.findIndex((r) => r.id === id);
  const next = ROUTES[(i + 1) % ROUTES.length];
  return (
    <section id={id} className={`pb-[clamp(3rem,8vh,6rem)] pt-[clamp(6.5rem,14vh,9rem)] ${className}`}>
      <div className="wrap">
        <div className="grid grid-cols-12 gap-x-8 gap-y-6">
          <div className="col-span-12 lg:col-span-7">
            <p className="eyebrow">
              <span className="text-ember">{num}</span> — {label}
            </p>
            <Copy animateOnScroll={false} delay={0.1}>
              <h1 className="h-section mt-4">{title}</h1>
            </Copy>
          </div>
          <div className="col-span-12 self-end lg:col-span-5">
            {lead && (
              <Copy animateOnScroll={false} delay={0.25}>
                <p className="lead max-w-[46ch]">{lead}</p>
              </Copy>
            )}
            {aside}
          </div>
        </div>
        <div className="mt-[clamp(2rem,5vh,3.5rem)]">{children}</div>

        {i >= 0 && (
          <Link
            href={next.href}
            className="group mt-[clamp(3rem,8vh,5rem)] flex items-center justify-between gap-6 border-t border-edge pt-8"
          >
            <span>
              <span className="eyebrow">Next · {next.label}</span>
              <span className="mt-2 block text-[clamp(1.4rem,3vw,2.4rem)] font-medium tracking-[-0.035em] transition-colors group-hover:text-ember">
                {next.question}
              </span>
            </span>
            <span className="text-3xl text-stone transition-transform duration-500 group-hover:translate-x-1 group-hover:text-ember">→</span>
          </Link>
        )}
      </div>
    </section>
  );
}
