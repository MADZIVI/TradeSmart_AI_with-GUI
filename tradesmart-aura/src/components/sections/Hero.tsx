import { motion } from "motion/react";
import AppleButton from "../AppleButton";
import { gradientStyle } from "../../lib/gradientStyle";

export default function Hero() {
  return (
    <section className="relative z-10 pt-16 md:pt-28 pb-20 text-center flex flex-col items-center px-6">
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="text-4xl md:text-7xl font-semibold tracking-tight leading-[0.9]"
      >
        <span className="block text-white">Your trade-in.</span>
        <span className="block animate-shiny" style={gradientStyle}>
          Revitalized
        </span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="mt-8 text-white/60 max-w-md text-base leading-[1.5]"
      >
        TradeSmart AI is the premier valuation platform for the modern
        dealership. It leverages powerful AI to assess, price, and explain
        every trade-in with total clarity.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="mt-8 flex flex-col items-center gap-3"
      >
        <AppleButton />
        <span className="text-xs text-white/40">
          Download for Intel / Apple Silicon
        </span>
      </motion.div>
    </section>
  );
}
