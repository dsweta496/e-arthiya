import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import heroImage from "../assets/hero-market.jpg";

function AggregatorDashboard() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 text-emerald-950">
      <Navbar />

      <main>
        <section className="relative isolate overflow-hidden">
          <div
            className="absolute inset-0 -z-20 bg-cover bg-center"
            style={{ backgroundImage: `url(${heroImage})` }}
          />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-white via-white/95 to-white/35" />

          <div className="mx-auto max-w-7xl px-5 py-9 sm:px-8 lg:px-10 lg:py-12">
            <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-emerald-800/70">
                  FPO / ARTHIYA WORKSPACE
                </p>
                <h1 className="mt-2 text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
                  Aggregate supply.
                  <span className="block text-emerald-800">Unlock better matches.</span>
                </h1>
                <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
                  Coordinate multiple farmers into reliable pools that can fulfil buyer requirements.
                </p>
              </div>

              <Link
                to="/marketplace"
                className="rounded-full bg-emerald-900 px-6 py-3 text-sm font-semibold text-white shadow-lg"
              >
                Explore marketplace →
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat value="18" label="Farmers managed" />
            <Stat value="6" label="Active pools" />
            <Stat value="4" label="Buyer requirements" />
            <Stat value="92 Q" label="Coordinated supply" />
          </div>

          <section className="mt-10">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-800/70">
                ACTIVE POOLS
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                Supply you are coordinating
              </h2>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <PoolCard
                crop="Dutch Rose"
                quantity="20 Q"
                contributors="3 farmers"
                matched="100%"
                state="Matched"
                onClick={() => navigate("/pool/rose-2026")}
              />
              <PoolCard
                crop="Wheat"
                quantity="31 Q"
                contributors="5 farmers"
                matched="64%"
                state="Finding supply"
                onClick={() => navigate("/pool/wheat-2026")}
              />
            </div>
          </section>

          <section className="mt-10 rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-800/70">
              THE VALUE OF AGGREGATION
            </p>

            <div className="mt-4 grid gap-6 md:grid-cols-3">
              <Point number="01" title="Collect" text="Pool smaller farmer quantities into one reliable supply." />
              <Point number="02" title="Match" text="Connect pooled supply to buyer quantity and timing." />
              <Point number="03" title="Coordinate" text="Support fulfilment without forcing every farmer to digitize alone." />
            </div>
          </section>
        </section>
      </main>
    </div>
  );
}

function PoolCard({ crop, quantity, contributors, matched, state, onClick }) {
  return (
    <article className="rounded-[1.4rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-800">
            {state}
          </span>
          <h3 className="mt-4 text-xl font-semibold">{quantity} {crop}</h3>
          <p className="mt-1 text-sm text-slate-500">{contributors} contributing</p>
        </div>
        <p className="text-2xl font-semibold text-emerald-800">{matched}</p>
      </div>

      <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-emerald-800" style={{ width: matched }} />
      </div>

      <button onClick={onClick} className="mt-5 rounded-full border border-emerald-200 px-4 py-2.5 text-sm font-semibold text-emerald-800">
        Manage pool →
      </button>
    </article>
  );
}

function Point({ number, title, text }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-5">
      <p className="text-xs font-bold text-emerald-700">{number}</p>
      <h3 className="mt-2 font-semibold">{title}</h3>
      <p className="mt-1 text-sm leading-6 text-slate-500">{text}</p>
    </div>
  );
}

function Stat({ value, label }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
      <p className="text-2xl font-semibold text-emerald-800 sm:text-3xl">{value}</p>
      <p className="mt-1 text-xs text-slate-500 sm:text-sm">{label}</p>
    </div>
  );
}

export default AggregatorDashboard;
