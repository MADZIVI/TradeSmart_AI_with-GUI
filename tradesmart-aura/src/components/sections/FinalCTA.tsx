import { motion } from "motion/react";
import { ChevronRight } from "lucide-react";
import AppleButton from "../AppleButton";

export default function FinalCTA() {
  return (
    <section className="relative z-10 max-w-6xl mx-auto px-6 py-20 md:py-32">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="liquid-glass relative overflow-hidden rounded-3xl px-8 py-16 md:py-24 text-center"
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(600px circle at 50% 0%, rgba(255,255,255,0.15), transparent 70%)",
            opacity: 0.3,
          }}
        />

        <div className="relative">
          <h2 className="text-4xl md:text-6xl font-semibold tracking-tight leading-[1.02]">
            Skip the guesswork.
            <br /> Know the value.
          </h2>
          <p className="mt-6 text-white/60 max-w-md mx-auto text-sm leading-[1.6]">
            Join dealerships across the country who treat trade-in valuation
            like a science — not a guessing game.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <AppleButton label="Download TradeSmart AI" />
            <button className="inline-flex items-center gap-2 rounded-full border border-white/15 text-white text-sm font-medium px-5 py-3 hover:bg-white/5 transition-colors">
              Talk to sales
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
