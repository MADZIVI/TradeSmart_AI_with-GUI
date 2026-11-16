const TESTIMONIALS = [
  {
    quote:
      "TradeSmart AI gave our floor staff four hours of their week back. It reads like a valuation from the future.",
    name: "Parker Wilf",
    role: "Group Sales Manager",
    company: "MOTORHUB",
  },
  {
    quote:
      "The instant re-quote alone has changed how we handle walk-ins. I can't imagine going back to manual appraisals.",
    name: "Andrew von Rosenbach",
    role: "Senior Operations Manager",
    company: "DRIVEWORKS",
  },
  {
    quote:
      "Valuations that actually understand condition. Our team stopped dreading trade-in negotiations.",
    name: "Mathies Christensen",
    role: "Dealership Manager",
    company: "TRADELINE",
  },
];

export default function Testimonials() {
  return (
    <section className="relative z-10 max-w-6xl mx-auto px-6 py-20 md:py-28 border-t border-white/10">
      <div className="grid md:grid-cols-3 gap-6">
        {TESTIMONIALS.map((t) => (
          <figure key={t.name} className="liquid-glass rounded-2xl p-6">
            <blockquote className="text-sm text-white/80 leading-[1.6]">
              &ldquo;{t.quote}&rdquo;
            </blockquote>
            <figcaption className="mt-6 pt-5 border-t border-white/10">
              <div className="text-sm font-semibold">{t.name}</div>
              <div className="text-xs text-white/50">{t.role}</div>
              <div className="text-xs text-white font-semibold tracking-wide uppercase mt-1">
                {t.company}
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
