import { motion } from "motion/react";
import SectionEyebrow from "../SectionEyebrow";
import ChatDemo from "../ChatDemo";

export default function LiveDemoWindow() {
  return (
    <section className="relative z-10 max-w-6xl mx-auto px-6 py-16 md:py-24">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ delay: 1.1, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="relative rounded-2xl overflow-hidden border border-white/10 bg-[#0e1014]/90 backdrop-blur-2xl"
      >
        <div className="relative flex items-center h-10 px-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
            <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
            <span className="w-3 h-3 rounded-full bg-[#28c840]" />
          </div>
          <span className="absolute left-1/2 -translate-x-1/2 text-xs text-white/50">
            TradeSmart AI — Live Demo
          </span>
        </div>

        <div className="grid md:grid-cols-2 gap-10 items-center p-8 md:p-14 min-h-[520px]">
          <div>
            <SectionEyebrow label="Live Demo" tag="Interactive" />
            <h2 className="mt-5 text-3xl md:text-4xl font-semibold tracking-tight leading-[1.05]">
              Watch a real valuation happen.
            </h2>
            <p className="mt-6 text-white/60 text-base leading-[1.6] max-w-md">
              This is the actual TradeSmart AI assistant your customers will
              talk to. Answer a few quick questions about the vehicle and
              watch it produce a confident, explainable trade-in estimate in
              seconds.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-white/60">
              <li>— No login required to try it</li>
              <li>— Explains every factor behind the number</li>
              <li>— Hands off straight to your sales team</li>
            </ul>
          </div>

          <div className="flex justify-center md:justify-end">
            <ChatDemo />
          </div>
        </div>
      </motion.div>
    </section>
  );
}
