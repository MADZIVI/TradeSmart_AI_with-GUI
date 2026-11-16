import { motion } from "motion/react";

const LOGOS = [
  "AutoTrader",
  "MotorHub",
  "DriveWorks",
  "TradeLine",
  "FleetOS",
  "CarZar",
  "RoadWise",
  "AutoNation Labs",
];

export default function LogoCloud() {
  return (
    <section className="relative z-10 max-w-6xl mx-auto px-6 py-16 md:py-20">
      <p className="text-center text-xs uppercase tracking-widest text-white/40">
        Trusted by forward-thinking dealerships
      </p>
      <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-6">
        {LOGOS.map((name, i) => (
          <motion.span
            key={name}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05, duration: 0.5 }}
            className="text-sm font-semibold tracking-tight text-white/50 hover:text-white text-center transition-colors"
          >
            {name}
          </motion.span>
        ))}
      </div>
    </section>
  );
}
