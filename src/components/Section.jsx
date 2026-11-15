import Copy from "./motion/Copy";

/** Shared section header: number + label, big title, plain-language intro. */
export default function Section({ id, num, label, title, lead, children, className = "", aside }) {
  return (
    <section id={id} className={`scroll-mt-20 border-t border-edge py-[clamp(4rem,10vh,8rem)] ${className}`}>
      <div className="wrap">
        <div className="grid grid-cols-12 gap-x-8 gap-y-6">
          <div className="col-span-12 lg:col-span-7">
            <p className="eyebrow">
              <span className="text-ember">{num}</span> — {label}
            </p>
            <Copy>
              <h2 className="h-section mt-4">{title}</h2>
            </Copy>
          </div>
          <div className="col-span-12 self-end lg:col-span-5">
            {lead && (
              <Copy delay={0.1}>
                <p className="lead max-w-[46ch]">{lead}</p>
              </Copy>
            )}
            {aside}
          </div>
        </div>
        <div className="mt-[clamp(2rem,5vh,3.5rem)]">{children}</div>
      </div>
    </section>
  );
}
