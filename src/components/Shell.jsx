"use client";
import { useEffect, useRef } from "react";
import { ReactLenis } from "lenis/react";
import { gsap } from "@/lib/gsap";
import Nav from "./Nav";
import Footer from "./Footer";
import { usePathname } from "next/navigation";
import { useLenis } from "lenis/react";
import { DataProvider } from "@/lib/data";

export default function Shell({ children }) {
  const lenisRef = useRef(null);
  useEffect(() => {
    const update = (t) => lenisRef.current?.lenis?.raf(t * 1000);
    gsap.ticker.add(update);
    gsap.ticker.lagSmoothing(0);
    return () => gsap.ticker.remove(update);
  }, []);
  return (
    <ReactLenis root ref={lenisRef} options={{ autoRaf: false, lerp: 0.12, smoothWheel: true }}>
      <DataProvider>
        <Nav />
        <ScrollReset />
        <main className="min-h-[70svh]">{children}</main>
        <Footer />
      </DataProvider>
    </ReactLenis>
  );
}

// Start every page at the top (Lenis keeps its own scroll position).
function ScrollReset() {
  const pathname = usePathname();
  const lenis = useLenis();
  useEffect(() => {
    lenis?.scrollTo(0, { immediate: true, force: true });
    window.scrollTo(0, 0);
  }, [pathname, lenis]);
  return null;
}
