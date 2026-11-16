import { useState } from "react";
import { Check } from "lucide-react";

type Plan = {
  tier: string;
  monthly: string;
  yearly: string;
  desc: string;
  features: string[];
  pro?: boolean;
};

const PLANS: Plan[] = [
  {
    tier: "Free",
    monthly: "Free",
    yearly: "Free",
    desc: "For independent dealers taking their first steps with TradeSmart AI.",
    features: [
      "Up to 3 trade-in valuations per month",
      "Standard condition scoring",
      "Basic dealer dashboard",
      "Email support",
      "Access via web and mobile app",
    ],
  },
  {
    tier: "Standard",
    monthly: "$9,99/m",
    yearly: "$99,99/y",
    desc: "For independent dealers who need more volume and flexibility.",
    features: [
      "Up to 50 valuations per month",
      "Photo-based damage detection",
      "Team collaboration (up to 5 members)",
      "Priority support",
      "Access to premium pricing data",
    ],
  },
  {
    tier: "Pro",
    monthly: "$19,99/m",
    yearly: "$199,99/y",
    desc: "For dealership groups and franchises managing high trade-in volume.",
    features: [
      "Unlimited valuations",
      "Advanced AI condition + market pricing",
      "Unlimited team members",
      "CRM & DMS integrations",
      "Dedicated account manager",
    ],
    pro: true,
  },
];

export default function Pricing() {
  const [yearly, setYearly] = useState(false);

  return (
    <section className="c3-pricing-section">
      <svg width="0" height="0" style={{ position: "absolute" }}>
        <filter id="c3-noise">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.5"
            numOctaves={2}
            stitchTiles="stitch"
          />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.075" />
          </feComponentTransfer>
          <feComposite in2="SourceGraphic" operator="in" result="noise" />
          <feBlend in="SourceGraphic" in2="noise" mode="overlay" />
        </filter>
      </svg>

      <div className="c3-watermark-container">
        <div className="c3-watermark-main">
          <span className="c3-watermark-line-1">Your trade-in.</span>
          <span className="c3-watermark-line-2">Revitalized</span>
        </div>
      </div>

      <div className="c3-grid">
        {PLANS.map((plan) => (
          <div
            key={plan.tier}
            className={`c3-card ${plan.pro ? "c3-card-pro" : ""}`}
          >
            <div className="c3-tier-small">{plan.tier}</div>
            <div className="c3-tier-large">
              {plan.tier === "Free" ? "Free" : yearly ? plan.yearly : plan.monthly}
            </div>
            <div className="c3-desc">{plan.desc}</div>
            <ul className="c3-list">
              {plan.features.map((f) => (
                <li key={f}>
                  <span className="c3-check">
                    <Check className="w-3.5 h-3.5 text-white" />
                  </span>
                  {f}
                </li>
              ))}
            </ul>
            <button className="c3-btn">Choose Plan</button>
          </div>
        ))}
      </div>

      <div className="c3-toggle-wrap">
        <span className="text-white text-sm">Yearly</span>
        <button
          className={`c3-toggle ${yearly ? "active" : ""}`}
          onClick={() => setYearly((y) => !y)}
          aria-label="Toggle yearly pricing"
        >
          <span className="c3-toggle-knob" />
        </button>
      </div>
    </section>
  );
}
