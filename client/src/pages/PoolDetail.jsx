import { Link, useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";

function PoolDetail() {
  const { poolId } = useParams();
  const navigate = useNavigate();

  const isWheat = poolId?.startsWith("wheat");
  const crop = isWheat ? "Wheat" : "Dutch Rose";
  const demand = isWheat ? "39 Q" : "20 Q";
  const supplied = isWheat ? "25 Q" : "20 Q";
  const matched = isWheat ? "64%" : "100%";

  return (
    <div className="min-h-screen bg-slate-50 text-emerald-950">
      <Navbar />

      <main>
        <section className="relative isolate overflow-hidden">
          <div className="absolute inset-0 -z-20 bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-800" />

          <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
            <Link to="/marketplace" className="text-sm font-medium text-emerald-100/80 hover:text-white">
              ← Back to marketplace
            </Link>

            <div className="mt-7 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-emerald-200/70">
                  SUPPLY POOL · {poolId}
                </p>

                <h1 className="mt-2 text-4xl font-semibold tracking-[-0.045em] text-white sm:text-5xl">
                  {crop} supply pool
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65 sm:text-base">
                  Multiple farmer contributions combined to satisfy one buyer requirement.
                </p>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/10 px-5 py-4 backdrop-blur-md">
                <p className="text-xs text-white/60">Pool status</p>
                <p className="mt-1 text-lg font-semibold text-white">
                  {matched === "100%" ? "Ready for commitment" : "Partially fulfilled"}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10">
          <div className="grid gap-4 sm:grid-cols-3">
            <Stat value={supplied} label="Pooled supply" />
            <Stat value={demand} label="Buyer demand" />
            <Stat value={matched} label="Demand matched" />
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
            <section className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-800/70">
                    CONTRIBUTIONS
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold">Farmers in this pool</h2>
                </div>
                <span className="text-sm font-semibold text-emerald-800">3 contributors</span>
              </div>

              <div className="mt-5 divide-y divide-slate-100">
                <Contributor name="Ramesh Kumar" location="Haryana" quantity="6 Q" />
                <Contributor name="Suresh Yadav" location="Uttar Pradesh" quantity="7 Q" />
                <Contributor name="Anita Devi" location="Uttar Pradesh" quantity="7 Q" />
              </div>
            </section>

            <section className="rounded-[1.5rem] border border-emerald-100 bg-emerald-50 p-6">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-800/70">
                BUYER REQUIREMENT
              </p>
              <h2 className="mt-2 text-2xl font-semibold">{demand} {crop}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Buyer requirement can be fulfilled collectively rather than by one farmer alone.
              </p>

              <div className="mt-5 rounded-2xl bg-white p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Match progress</span>
                  <span className="font-semibold text-emerald-800">{matched}</span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-emerald-800" style={{ width: matched }} />
                </div>
              </div>
            </section>
          </div>

          <section className="mt-6 rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-800/70">
                  NEXT STAGE
                </p>
                <h2 className="mt-2 text-2xl font-semibold">Auction & protected commitment</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  Once the pool is ready, the buyer can proceed through the auction/selection flow and create a protected commitment.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => navigate("/marketplace")}
                  className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold"
                >
                  Browse more supply
                </button>

                <button
                  onClick={() => localStorage.setItem("eArthiyaDemoCommitment", "started")}
                  className="rounded-full bg-emerald-900 px-5 py-2.5 text-sm font-semibold text-white"
                >
                  Start commitment →
                </button>
              </div>
            </div>
          </section>
        </section>
      </main>
    </div>
  );
}

function Contributor({ name, location, quantity }) {
  return (
    <div className="flex items-center justify-between py-4">
      <div>
        <p className="font-semibold">{name}</p>
        <p className="mt-1 text-xs text-slate-500">{location}</p>
      </div>
      <span className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold">{quantity}</span>
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

export default PoolDetail;
