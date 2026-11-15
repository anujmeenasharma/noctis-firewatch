"use client";
import React, { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, SplitText, waitForFonts, prefersReduced, isTouch } from "@/lib/gsap";

/**
 * The site-wide text reveal. Pieces rise out of a per-line mask, fading up
 * out of a blur, one after another.
 *  by="words" (default) — body copy and headings.
 *  by="chars" — big display type; letters rise with a slight stagger from the
 *               centre so the word "assembles" instead of typing left to right.
 * Wrap one element, or several (they get a wrapper div).
 */
export default function Copy({
  children,
  animateOnScroll = true,
  delay = 0,
  stagger,
  duration = 1.1,
  start = "top 88%",
  by = "words",
  from = "start",
}) {
  const ref = useRef(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || prefersReduced()) return;
      const lite = isTouch();
      const chars = by === "chars";
      const each = stagger ?? (chars ? 0.03 : 0.035);
      const blur = chars ? 18 : 12;
      let splits = [];
      let tweens = [];
      let cancelled = false;
      let done = false;

      (async () => {
        await waitForFonts();
        if (cancelled || !el.isConnected) return;
        const targets = el.hasAttribute("data-copy-wrapper") ? Array.from(el.children) : [el];

        targets.forEach((target, t) => {
          const split = SplitText.create(target, {
            type: chars ? "chars,lines" : "words,lines",
            mask: "lines",
            linesClass: "line",
            autoSplit: true,
            onSplit: (self) => {
              const pieces = chars ? self.chars : self.words;
              const shown = lite ? { yPercent: 0, opacity: 1 } : { yPercent: 0, opacity: 1, filter: "blur(0px)" };
              if (done) return void gsap.set(pieces, shown);
              gsap.set(pieces, {
                yPercent: chars ? 105 : 100,
                opacity: 0,
                ...(lite ? {} : { filter: `blur(${blur}px)` }),
              });
              const props = {
                ...shown,
                duration,
                stagger: { each, from },
                ease: "power4.out",
                delay: delay + t * each * 3,
                clearProps: lite ? "" : "filter",
                onComplete: () => {
                  if (t === targets.length - 1) done = true;
                },
              };
              const tween = animateOnScroll
                ? gsap.to(pieces, { ...props, scrollTrigger: { trigger: el, start, once: true } })
                : gsap.to(pieces, props);
              tweens[t] = tween;
              return tween;
            },
          });
          splits.push(split);
        });
      })();

      return () => {
        cancelled = true;
        tweens.forEach((tw) => {
          tw?.scrollTrigger?.kill();
          tw?.kill();
        });
        splits.forEach((s) => s.revert());
      };
    },
    { scope: ref, dependencies: [animateOnScroll, by] }
  );

  if (React.Children.count(children) === 1) return React.cloneElement(children, { ref });
  return (
    <div ref={ref} data-copy-wrapper="true">
      {children}
    </div>
  );
}
