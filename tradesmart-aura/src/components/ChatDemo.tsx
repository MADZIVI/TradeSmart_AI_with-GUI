import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, animate } from "motion/react";

// Points at the local Flask backend (see tradesmart-backend/README.md).
// In the one-click build (npm run build), Flask serves this file itself,
// so the API is on the same origin - use a relative "" base. In
// `npm run dev` (import.meta.env.DEV), Vite serves the frontend on its own
// port (5173) so it needs the full localhost:5000 URL instead. Override
// either way with VITE_API_BASE_URL in a .env file if needed.
const API_BASE =
  import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? "http://localhost:5000" : "");

type Msg = { from: "bot" | "user"; text: string };
type VehicleResult = { brand: string; model: string; label: string };
type Step = "vehicle" | "details" | "deposit" | "contact" | "loading" | "done" | "error";

type EstimateResponse = {
  sessionId: number;
  valuation: {
    point_estimate: number;
    estimated_low: number;
    estimated_high: number;
    model_used: string;
    model_r2: number;
    spec_source: "exact_model" | "brand_average" | "global_average";
    out_of_range: boolean;
    out_of_range_reason: string | null;
  };
  disclaimer: string;
  dbWarning?: string;
};

// Only asks for, and only uses, what the model was actually trained on
// (make/model/year/mileage) - no condition/damage questions. See
// tradesmart-backend/README.md for why.
const TOTAL_STEPS = 4;
const STEP_ORDER: Step[] = ["vehicle", "details", "deposit", "contact"];

function TypingDots() {
  return (
    <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm liquid-glass px-5 py-4">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="size-2 rounded-full bg-white/50"
          animate={{ opacity: [0.25, 1, 0.25], y: [0, -3, 0] }}
          transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </div>
  );
}

function ConfidenceRing({ value }: { value: number }) {
  const ref = useRef<SVGCircleElement>(null);
  const circumference = 2 * Math.PI * 32;

  useEffect(() => {
    if (!ref.current) return;
    const controls = animate(circumference, circumference * (1 - value / 100), {
      duration: 1.3,
      delay: 0.15,
      ease: [0.2, 0.8, 0.2, 1],
      onUpdate: (v) => ref.current?.setAttribute("stroke-dashoffset", String(v)),
    });
    return () => controls.stop();
  }, [value, circumference]);

  return (
    <svg viewBox="0 0 80 80" className="size-20 shrink-0">
      <g transform="rotate(-90 40 40)">
        <circle cx="40" cy="40" r="32" fill="none" strokeWidth="7" className="stroke-white/15" />
        <circle
          ref={ref}
          cx="40"
          cy="40"
          r="32"
          fill="none"
          strokeWidth="7"
          strokeLinecap="round"
          className="stroke-white"
          strokeDasharray={circumference}
          strokeDashoffset={circumference}
        />
      </g>
    </svg>
  );
}

function CountUp({ to, prefix = "" }: { to: number; prefix?: string }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const controls = animate(0, to, {
      duration: 1.5,
      ease: [0.2, 0.8, 0.2, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [to]);
  return (
    <span>
      {prefix}
      {display.toLocaleString()}
    </span>
  );
}

// --- Per-step input widgets --------------------------------------------

function VehicleStep({
  query,
  setQuery,
  results,
  onPick,
}: {
  query: string;
  setQuery: (v: string) => void;
  results: VehicleResult[];
  onPick: (v: VehicleResult) => void;
}) {
  return (
    <div className="relative">
      {results.length > 0 && (
        <div className="absolute bottom-full mb-2 left-0 right-0 max-h-56 overflow-y-auto rounded-xl liquid-glass p-2">
          {results.map((v) => (
            <button
              key={v.label}
              onClick={() => onPick(v)}
              className="block w-full truncate rounded-lg px-3 py-2 text-left text-sm text-white/80 hover:bg-white/10"
            >
              {v.label}
            </button>
          ))}
        </div>
      )}
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Start typing, e.g. Volkswagen Polo"
        className="w-full rounded-full liquid-glass px-5 py-3 text-left text-sm text-white placeholder:text-white/40 outline-none"
      />
    </div>
  );
}

function DetailsStep({ onSubmit }: { onSubmit: (year: string, mileage: string) => void }) {
  const [year, setYear] = useState("");
  const [mileage, setMileage] = useState("");
  const ready = year.trim() !== "" && mileage.trim() !== "";
  return (
    <div className="flex items-center gap-3">
      <input
        autoFocus
        value={year}
        onChange={(e) => setYear(e.target.value)}
        placeholder="Year, e.g. 2019"
        inputMode="numeric"
        className="w-44 rounded-full liquid-glass px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none"
      />
      <input
        value={mileage}
        onChange={(e) => setMileage(e.target.value)}
        placeholder="Mileage in km"
        inputMode="numeric"
        onKeyDown={(e) => e.key === "Enter" && ready && onSubmit(year, mileage)}
        className="flex-1 rounded-full liquid-glass px-5 py-3 text-sm text-white placeholder:text-white/40 outline-none"
      />
      <button
        onClick={() => ready && onSubmit(year, mileage)}
        disabled={!ready}
        className="shrink-0 rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition-transform hover:scale-105 active:scale-95 disabled:opacity-40"
      >
        Send
      </button>
    </div>
  );
}

function DepositStep({ onSubmit }: { onSubmit: (amount: number | null) => void }) {
  const [amount, setAmount] = useState("");
  return (
    <div className="flex items-center gap-3">
      <input
        autoFocus
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Amount in Rand (optional)"
        inputMode="numeric"
        onKeyDown={(e) => e.key === "Enter" && onSubmit(amount ? Number(amount) : null)}
        className="flex-1 rounded-full liquid-glass px-5 py-3 text-sm text-white placeholder:text-white/40 outline-none"
      />
      <button onClick={() => onSubmit(null)} className="shrink-0 rounded-full liquid-glass px-5 py-3 text-sm font-medium text-white/70 hover:text-white">
        Skip
      </button>
      <button
        onClick={() => amount && onSubmit(Number(amount))}
        disabled={!amount}
        className="shrink-0 rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition-transform hover:scale-105 active:scale-95 disabled:opacity-40"
      >
        Add
      </button>
    </div>
  );
}

function ContactStep({ onSubmit }: { onSubmit: (info: { fullName: string; contactNumber: string; email: string; popiaConsent: boolean }) => void }) {
  const [fullName, setFullName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [email, setEmail] = useState("");
  const [popiaConsent, setPopiaConsent] = useState(false);
  const ready = fullName.trim() !== "";

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center gap-3">
        <input
          autoFocus
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Your name"
          className="flex-1 rounded-full liquid-glass px-5 py-3 text-sm text-white placeholder:text-white/40 outline-none"
        />
        <button
          onClick={() => ready && onSubmit({ fullName, contactNumber, email, popiaConsent })}
          disabled={!ready}
          className="shrink-0 rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition-transform hover:scale-105 active:scale-95 disabled:opacity-40"
        >
          Get my estimate
        </button>
      </div>
      <label className="flex items-center gap-2 pl-2 text-xs text-white/50">
        <input type="checkbox" checked={popiaConsent} onChange={(e) => setPopiaConsent(e.target.checked)} className="size-3.5" />
        I consent to my contact details being stored (POPIA) - optional, only affects whether the fields below are saved
      </label>
      {popiaConsent && (
        <div className="flex items-center gap-3">
          <input
            value={contactNumber}
            onChange={(e) => setContactNumber(e.target.value)}
            placeholder="Phone (optional)"
            className="flex-1 rounded-full liquid-glass px-4 py-2.5 text-sm text-white placeholder:text-white/40 outline-none"
          />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email (optional)"
            className="flex-1 rounded-full liquid-glass px-4 py-2.5 text-sm text-white placeholder:text-white/40 outline-none"
          />
        </div>
      )}
    </div>
  );
}

// --- Main component -------------------------------------------------------

export default function ChatDemo() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [step, setStep] = useState<Step>("vehicle");
  const [result, setResult] = useState<EstimateResponse | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const [vehicleQuery, setVehicleQuery] = useState("");
  const [vehicleResults, setVehicleResults] = useState<VehicleResult[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleResult | null>(null);
  const [vehicleYear, setVehicleYear] = useState("");
  const [vehicleMileage, setVehicleMileage] = useState("");
  const [depositAmount, setDepositAmount] = useState<number | null>(null);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    // The result card can be taller than this pane. Scroll to its TOP
    // (not the container's bottom) so the price is visible immediately,
    // instead of being scrolled past.
    if (step === "done" && cardRef.current) {
      const offset = cardRef.current.offsetTop - container.offsetTop;
      container.scrollTo({ top: Math.max(offset - 12, 0), behavior: "smooth" });
    } else {
      container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
    }
  }, [messages, step]);

  useEffect(() => {
    setMessages([
      {
        from: "bot",
        text: "Hi! Let's get an estimate for your trade-in. Start typing your vehicle's make and model below.",
      },
    ]);
  }, []);

  // Debounced vehicle search
  useEffect(() => {
    if (step !== "vehicle" || !vehicleQuery.trim()) {
      setVehicleResults([]);
      return;
    }
    const handle = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/vehicles/search?q=${encodeURIComponent(vehicleQuery)}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setVehicleResults(data.results ?? []);
      } catch {
        setVehicleResults([]);
      }
    }, 250);
    return () => clearTimeout(handle);
  }, [vehicleQuery, step]);

  function pushBot(text: string) {
    setMessages((m) => [...m, { from: "bot", text }]);
  }
  function pushUser(text: string) {
    setMessages((m) => [...m, { from: "user", text }]);
  }

  function pickVehicle(v: VehicleResult) {
    setSelectedVehicle(v);
    pushUser(v.label);
    setVehicleResults([]);
    setVehicleQuery("");
    setStep("details");
    setTimeout(() => pushBot("Thanks. What year is it, and roughly how many kilometres has it done?"), 300);
  }

  function submitDetails(year: string, mileage: string) {
    setVehicleYear(year);
    setVehicleMileage(mileage);
    pushUser(`${year} - ${Number(mileage).toLocaleString()} km`);
    setStep("deposit");
    setTimeout(() => pushBot("Would you like to add a cash deposit toward another vehicle? Enter an amount, or skip."), 300);
  }

  function submitDeposit(amount: number | null) {
    setDepositAmount(amount);
    pushUser(amount ? `R${amount.toLocaleString()} deposit` : "No deposit");
    setStep("contact");
    setTimeout(
      () => pushBot("Last thing - what's your name? Contact details are optional and only stored if you consent (POPIA)."),
      300
    );
  }

  async function submitContact(info: { fullName: string; contactNumber: string; email: string; popiaConsent: boolean }) {
    pushUser(info.fullName);
    setStep("loading");

    try {
      const res = await fetch(`${API_BASE}/api/valuation/estimate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: info,
          vehicle: {
            brand: selectedVehicle?.brand,
            model: selectedVehicle?.model,
            year: vehicleYear,
            mileage: vehicleMileage,
          },
          depositAmount,
        }),
      });
      let data: EstimateResponse & { error?: string };
      try {
        data = await res.json();
      } catch {
        // The backend returned something that isn't JSON (an HTML error
        // page, usually). Give a message that actually points at the fix
        // instead of a raw parsing error.
        throw new Error(
          `The backend hit an unexpected error (HTTP ${res.status}). Check the black backend terminal window for the details.`
        );
      }
      if (!res.ok) throw new Error(data.error || "The backend rejected the request.");

      pushBot(
        `Thanks - based on this, your estimated trade-in value is R${data.valuation.estimated_low.toLocaleString()}-R${data.valuation.estimated_high.toLocaleString()}. A consultant will confirm the final figure with you shortly.`
      );
      setResult(data);
      setStep("done");
    } catch (err) {
      setErrorText(
        err instanceof Error && err.message !== "Failed to fetch"
          ? err.message
          : `Couldn't reach the TradeSmart AI backend at ${API_BASE || window.location.origin}. Make sure it's running locally (see tradesmart-backend/README.md) and try again.`
      );
      setStep("error");
    }
  }

  function restart() {
    setMessages([
      {
        from: "bot",
        text: "Hi! Let's get an estimate for your trade-in. Start typing your vehicle's make and model below.",
      },
    ]);
    setStep("vehicle");
    setResult(null);
    setErrorText(null);
    setVehicleQuery("");
    setVehicleResults([]);
    setSelectedVehicle(null);
    setVehicleYear("");
    setVehicleMileage("");
    setDepositAmount(null);
  }

  const activeIndex = step === "loading" || step === "done" || step === "error" ? STEP_ORDER.length - 1 : STEP_ORDER.indexOf(step);
  const progressStep = Math.min(activeIndex + 1, TOTAL_STEPS);
  const progressPct = step === "done" ? 100 : Math.round((progressStep / TOTAL_STEPS) * 100);

  const factors: string[] = [];
  if (result) {
    factors.push(result.valuation.model_used);
    if (result.valuation.spec_source === "exact_model") factors.push("Exact model spec match");
    else if (result.valuation.spec_source === "brand_average") factors.push("Estimated from brand average (exact trim not in database)");
    else factors.push("Estimated from overall market average");
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, delay: 0.2, ease: "easeOut" }}
      className="liquid-glass w-full max-w-2xl rounded-3xl overflow-hidden text-white/70"
    >
      <div className="flex items-center gap-3 border-b border-white/10 px-7 py-5">
        <div className="flex-1 min-w-0 text-left">
          <div className="text-lg font-medium leading-none text-white">TradeSmart AI</div>
          <div className="mt-2 flex items-center gap-2 text-sm opacity-60">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/60" />
              <span className="relative inline-flex size-2 rounded-full bg-white" />
            </span>
            {step === "loading" ? "Analyzing in real-time" : "Live - real model, real database"}
          </div>
        </div>
      </div>

      <div className="px-7 pt-4">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <motion.div
            className="h-full rounded-full bg-white"
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
          />
        </div>
        <div className="mt-2 flex justify-between text-xs opacity-50">
          <span>Step {progressStep} of {TOTAL_STEPS}</span>
          <span>{progressPct}%</span>
        </div>
      </div>

      <div ref={scrollRef} className="flex max-h-[440px] min-h-[400px] flex-col gap-4 overflow-y-auto px-7 py-6 text-left">
        <AnimatePresence initial={false}>
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
              className={`flex shrink-0 ${m.from === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={
                  m.from === "bot"
                    ? "max-w-[80%] rounded-2xl rounded-bl-sm liquid-glass px-5 py-3.5 text-base leading-relaxed text-white/80"
                    : "max-w-[80%] rounded-2xl rounded-br-sm bg-white text-black px-5 py-3.5 text-base leading-relaxed font-medium"
                }
              >
                {m.text}
              </div>
            </motion.div>
          ))}

          {step === "loading" && (
            <motion.div key="typing" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex shrink-0 justify-start">
              <TypingDots />
            </motion.div>
          )}

          {step === "error" && errorText && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-[85%] rounded-2xl rounded-bl-sm bg-red-500/15 border border-red-400/30 px-5 py-3.5 text-sm text-red-200"
            >
              {errorText}
            </motion.div>
          )}

          {step === "done" && result && (
            <motion.div
              key="card"
              ref={cardRef}
              initial={{ opacity: 0, scale: 0.94, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
              className="liquid-glass rounded-xl p-7 shrink-0"
            >
              {result.valuation.out_of_range && (
                <div className="mb-5 rounded-lg bg-red-500/15 border border-red-400/30 px-3.5 py-2.5 text-xs leading-relaxed text-red-200">
                  <span className="font-semibold">Low confidence: </span>
                  {result.valuation.out_of_range_reason}
                </div>
              )}
              <div className="text-xs font-medium uppercase tracking-wider opacity-50">Estimated trade-in value</div>
              <div className="mt-2 text-4xl font-medium tracking-tight text-white">
                <CountUp to={result.valuation.point_estimate} prefix="R" />
                <span className="text-white/50 text-lg font-normal">
                  {" "}
                  range R{result.valuation.estimated_low.toLocaleString()}-R{result.valuation.estimated_high.toLocaleString()}
                </span>
              </div>
              <div className="mt-6 flex items-center gap-5">
                <ConfidenceRing value={Math.round(result.valuation.model_r2 * 100)} />
                <div className="text-sm opacity-60">
                  <span className="font-medium text-white">{Math.round(result.valuation.model_r2 * 100)}% </span>
                  model accuracy (test-set R²){result.valuation.out_of_range && " - doesn't apply to this vehicle, see above"}
                  <br />
                  {result.sessionId != null ? `Session #${result.sessionId} - sent to consultant` : "Not saved to database - see note above"}
                </div>
              </div>
              <div className="mt-6 flex flex-wrap gap-2">
                {factors.map((f, i) => (
                  <motion.span
                    key={f}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + i * 0.08, duration: 0.35 }}
                    className="rounded-full liquid-glass px-3.5 py-1.5 text-sm font-medium text-white/80"
                  >
                    {f}
                  </motion.span>
                ))}
              </div>
              <p className="mt-5 text-xs leading-relaxed opacity-50">{result.disclaimer}</p>
              {result.dbWarning && (
                <p className="mt-3 rounded-lg bg-amber-500/15 border border-amber-400/30 px-3.5 py-2.5 text-xs leading-relaxed text-amber-200">
                  {result.dbWarning}
                </p>
              )}
              <button
                onClick={restart}
                className="mt-6 w-full rounded-lg bg-white py-3.5 text-base font-medium text-black transition-transform hover:-translate-y-0.5 active:translate-y-0"
              >
                Start a new estimate
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {step !== "loading" && step !== "done" && (
        <div className="border-t border-white/10 px-6 py-4">
          {step === "vehicle" && (
            <VehicleStep query={vehicleQuery} setQuery={setVehicleQuery} results={vehicleResults} onPick={pickVehicle} />
          )}
          {step === "details" && <DetailsStep onSubmit={submitDetails} />}
          {step === "deposit" && <DepositStep onSubmit={submitDeposit} />}
          {step === "contact" && <ContactStep onSubmit={submitContact} />}
          {step === "error" && (
            <button onClick={() => setStep("contact")} className="w-full rounded-full bg-white py-3 text-sm font-medium text-black">
              Try again
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}
