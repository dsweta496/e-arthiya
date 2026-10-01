import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

function BuyerDashboard() {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);

  const demands = [
    { crop: "Wheat", quantity: "39 Q", window: "8 months", matched: "72%", status: "Partially matched" },
    { crop: "Tomato", quantity: "50 Q", window: "12 days", matched: "44%", status: "Open" },
  ];

  function saveDemand(e) {
    e.preventDefault();
    localStorage.setItem("eArthiyaDemoDemand", "created");
    setShowForm(false);
  }

  return (
    <div className="min-h-screen bg-slate-50 text-emerald-950">
      <Navbar />

      <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
        <section className="rounded-[1.75rem] bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-800 p-6 text-white shadow-xl sm:p-8 lg:p-10">
          <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-emerald-200/80">
                BUYER WORKSPACE
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl lg:text-5xl">
                Tell the market what you need.
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-white/70 sm:text-base">
                Post immediate or future requirements and let aggregated supply meet your demand.
              </p>
            </div>

            <button
              onClick={() => setShowForm(true)}
              className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-emerald-900"
            >
              + Post demand
            </button>
          </div>
        </section>

        <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat value="2" label="Open requirements" />
          <Stat value="89 Q" label="Total demand" />
          <Stat value="58%" label="Average matched" />
          <Stat value="1" label="Pool ready" />
        </section>

        <section className="mt-10">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-800/70">
                MY PROCUREMENT
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                Requirements
              </h2>
            </div>
            <Link to="/marketplace" className="hidden text-sm font-semibold text-emerald-800 sm:block">
              Browse supply →
            </Link>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {demands.map((demand) => (
              <DemandCard
                key={demand.crop}
                {...demand}
                onView={() => navigate("/pool/rose-2026")}
              />
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-800/70">
            RECOMMENDED MATCH
          </p>
          <div className="mt-3 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-xl font-semibold">20 Q Dutch Rose supply pool</h3>
              <p className="mt-1 text-sm text-slate-500">
                Three farmers can collectively fulfil the current requirement.
              </p>
            </div>
            <button
              onClick={() => navigate("/pool/rose-2026")}
              className="rounded-full bg-emerald-900 px-5 py-2.5 text-sm font-semibold text-white"
            >
              Review match →
            </button>
          </div>
        </section>
      </main>

      {showForm && (
        <Modal title="Post procurement requirement" onClose={() => setShowForm(false)}>
          <form onSubmit={saveDemand} className="space-y-4">
            <Field label="Crop" placeholder="e.g. Wheat" />
            <Field label="Variety (optional)" placeholder="e.g. Sharbati" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Quantity" placeholder="e.g. 39" />
              <Select label="Unit" options={["quintal", "kg", "tonne"]} />
            </div>
            <Select label="Demand type" options={["spot", "forward"]} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Available from" type="date" />
              <Field label="Required by" type="date" />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowForm(false)} className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold">
                Cancel
              </button>
              <button className="rounded-full bg-emerald-900 px-5 py-2.5 text-sm font-semibold text-white">
                Publish requirement
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function DemandCard({ crop, quantity, window, matched, status, onView }) {
  return (
    <article className="rounded-[1.4rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-800">
            {status}
          </span>
          <h3 className="mt-4 text-xl font-semibold">{quantity} {crop}</h3>
          <p className="mt-1 text-sm text-slate-500">Required within {window}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-semibold text-emerald-800">{matched}</p>
          <p className="text-[10px] text-slate-400">matched</p>
        </div>
      </div>

      <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-emerald-800" style={{ width: matched }} />
      </div>

      <button onClick={onView} className="mt-5 rounded-full border border-emerald-200 px-4 py-2.5 text-sm font-semibold text-emerald-800">
        See matching pool →
      </button>
    </article>
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

function Field({ label, placeholder, type = "text" }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-slate-600">{label}</span>
      <input type={type} placeholder={placeholder} className="w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-emerald-500" />
    </label>
  );
}

function Select({ label, options }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-slate-600">{label}</span>
      <select className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none focus:border-emerald-500">
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
    </label>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-emerald-950/30 p-5 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-[1.5rem] bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button onClick={onClose} className="text-xl text-slate-400">×</button>
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}

export default BuyerDashboard;
