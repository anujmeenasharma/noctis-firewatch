const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/[]<>_-+*#";
const running = new WeakMap();

/**
 * Write `text` into `el` with a decode effect: characters cycle through random
 * glyphs and lock in left to right. Calling it again on the same element
 * cancels the previous run, so it is safe to fire rapidly.
 */
export function decode(el, text, duration = 0.6) {
  if (!el) return;
  cancelAnimationFrame(running.get(el));
  if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    el.textContent = text;
    return;
  }
  const chars = [...text];
  const t0 = performance.now();
  const total = duration * 1000;
  const tick = (now) => {
    const p = Math.min(1, (now - t0) / total);
    const locked = Math.floor(p * chars.length);
    let out = "";
    for (let i = 0; i < chars.length; i++) {
      const c = chars[i];
      if (i < locked || c === " ") out += c;
      else if (i < locked + 6) out += GLYPHS[(Math.random() * GLYPHS.length) | 0];
      else out += " ";
    }
    el.textContent = out;
    if (p < 1) running.set(el, requestAnimationFrame(tick));
    else el.textContent = text;
  };
  running.set(el, requestAnimationFrame(tick));
}
