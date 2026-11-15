"use client";
import { useEffect, useRef } from "react";
import { ReactLenis } from "lenis/react";
import { gsap } from "@/lib/gsap";
import Nav from "./Nav";
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
        <main>{children}</main>
      </DataProvider>
    </ReactLenis>
  );
}
