"use client";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { CustomEase } from "gsap/CustomEase";

if (typeof window !== "undefined" && !gsap.core.globals().ScrollTrigger) {
  gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase);
  CustomEase.create("hop", "0.9, 0, 0.1, 1");
}

export const waitForFonts = async () => {
  try {
    await document.fonts.ready;
  } catch (_) {}
  await new Promise((r) => setTimeout(r, 40));
};

export const prefersReduced = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Touch devices keep the motion but skip blur filters (costly on mobile GPUs).
export const isTouch = () =>
  typeof window !== "undefined" && window.matchMedia("(hover: none) and (pointer: coarse)").matches;

export { gsap, ScrollTrigger, SplitText, CustomEase };
