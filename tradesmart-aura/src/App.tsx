import { useEffect, useRef } from "react";
import Navbar from "./components/sections/Navbar";
import Hero from "./components/sections/Hero";
import MenuBarStrip from "./components/sections/MenuBarStrip";
import LiveDemoWindow from "./components/sections/LiveDemoWindow";
import FeatureValuation from "./components/sections/FeatureValuation";
import LogoCloud from "./components/sections/LogoCloud";
import Testimonials from "./components/sections/Testimonials";
import Pricing from "./components/sections/Pricing";
import FinalCTA from "./components/sections/FinalCTA";
import heroPoster from "./assets/hero.png";

function App() {
  const videoRef = useRef<HTMLVideoElement>(null);

  // The background video is decorative only (it's muted, pointer-events-none,
  // and just ambience behind the glass UI). Keeping it running while this
  // tab isn't even visible wastes GPU decode for no visible benefit, and on
  // laptops with weaker/shared graphics that can visibly slow down whatever
  // *other* tab the person actually switched to. Pausing/resuming on
  // visibility change keeps the effect but stops burning GPU in the
  // background.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const handleVisibility = () => {
      if (document.hidden) video.pause();
      else video.play().catch(() => {});
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#0c0c0c] text-white">
      <svg width="0" height="0" style={{ position: "absolute" }}>
        <filter id="c3-noise">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9"
            numOctaves={2}
            stitchTiles="stitch"
          />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.35 0"
          />
          <feComposite in2="SourceGraphic" operator="in" result="noise" />
          <feBlend in="SourceGraphic" in2="noise" mode="multiply" />
        </filter>
      </svg>

      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-[#0c0c0c]">
        {/* Ambient gradient sits behind the video at all times, so the page
            never shows a blank/black hero while the video is still loading
            (or on the rare device where it can't play at all). */}
        <div className="ambient-bg" />
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          poster={heroPoster}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        >
          {/* Local files, built with the app (see tradesmart-aura/public) -
              no external network dependency, so the hero paints immediately
              instead of waiting on a remote CDN. */}
          <source src="./background.mp4" type="video/mp4" />
          <source src="./background.webm" type="video/webm" />
        </video>
      </div>

      <div className="hidden md:block pointer-events-none fixed inset-y-0 left-1/2 -translate-x-[calc(50%+36rem)] w-px bg-white/10 z-[5]" />
      <div className="hidden md:block pointer-events-none fixed inset-y-0 left-1/2 translate-x-[calc(-50%+36rem)] w-px bg-white/10 z-[5]" />

      <Navbar />
      <Hero />
      <MenuBarStrip />
      <LiveDemoWindow />
      <FeatureValuation />
      <LogoCloud />
      <Testimonials />
      <Pricing />
      <FinalCTA />
    </div>
  );
}

export default App;
