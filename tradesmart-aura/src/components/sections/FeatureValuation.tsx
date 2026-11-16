import { motion } from "motion/react";
import SectionEyebrow from "../SectionEyebrow";

const CHIPS = [
  "Auto-condition scoring",
  "Instant re-quote",
  "Photo damage detection",
  "One-tap dealer handoff",
];

const SUBCARDS = [
  {
    label: "Priority",
    count: 4,
    color: "#ffffff",
    items: ["Sophia Chen — Polo trade-in", "David Lim — deposit signoff"],
  },
  {
    label: "Follow-up",
    count: 7,
    color: "#e5e5e5",
    items: ["Marcus — VW Golf re-quote", "Consultant — customer callback"],
  },
  {
    label: "Updates",
    count: 18,
    color: "#a3a3a3",
    items: ["System — valuation model updated", "CRM — lead synced"],
  },
  {
    label: "Archived",
    count: 13,
    color: "#525252",
    items: ["Completed deals · Expired quotes · Receipts"],
  },
];

export default function FeatureValuation() {
  return (
    <section className="relative z-10 max-w-6xl mx-auto px-6 py-20 md:py-28">
      <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-start">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
        >
          <SectionEyebrow label="Valuation" tag="AI-native" />
          <h2 className="mt-5 text-3xl md:text-5xl font-semibold tracking-tight leading-[1.02]">
            Price every trade-in
            <br /> in a single pass.
          </h2>
          <p className="mt-6 text-white/60 text-base leading-[1.6] max-w-md">
            TradeSmart AI reads every vehicle detail, understands condition,
            and routes accurate pricing straight to your team. Focus on
            closing the deal — the rest handles itself.
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            {CHIPS.map((chip) => (
              <span
                key={chip}
                className="text-xs text-white/70 px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.03]"
              >
                {chip}
              </span>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="liquid-glass rounded-2xl p-5"
        >
          <div className="text-xs text-white/50 mb-4">
            Today · 42 trade-ins valued
          </div>
          <div className="space-y-3">
            {SUBCARDS.map((card) => (
              <div key={card.label} className="liquid-glass rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span
                    className="text-sm font-medium"
                    style={{ color: card.color }}
                  >
                    {card.label}
                  </span>
                  <span className="text-xs text-white/40">{card.count}</span>
                </div>
                <div className="text-xs text-white/50 space-y-1">
                  {card.items.map((item) => (
                    <div key={item}>{item}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
