import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import heroImage from "../assets/hero-market.jpg";

function FarmerDashboard() {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);

  const supplies = [
    { crop: "Wheat", variety: "Sharbati", quantity: "20 Q", type: "Spot", status: "Available" },
    { crop: "Roses", variety: "Dutch Rose", quantity: "12 Q", type: "Preorder", status: "Pool-ready" },
    { crop: "Tomato", variety: "Hybrid", quantity: "8 Q", type: "Spot", status: "Available" },
  ];

  function saveSupply(e) {
    e.preventDefault();
    localStorage.setItem("eArthiyaDemoSupply", "created");
    setShowForm(false);
  }

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
                  FARMER WORKSPACE
                </p>
                <h1 className="mt-2 text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
                  Your produce,{" "}
                  <span className="text-emerald-800">your market.</span>
                </h1>
                <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
                  List what you have today or commit future production to a buyer requirement.
                </p>
              </div>

              <button
                onClick={() => setShowForm(true)}
                className="rounded-full bg-emerald-900 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/15 transition hover:-translate-y-0.5 hover:bg-emerald-950"
              >
                + Add supply
              </button>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat value="3" label="Active supplies" />
            <Stat value="40 Q" label="Listed quantity" />
            <Stat value="1" label="Pool contribution" />
            <Stat value="₹86K" label="Indicative value" />
          </div>

          <div className="mt-10 flex items-end justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-800/70">
                MY SUPPLY
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                Produce on the marketplace
              </h2>
            </div>
            <Link to="/marketplace" className="hidden text-sm font-semibold text-emerald-800 sm:block">
              Browse marketplace →
            </Link>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {supplies.map((supply) => (
              <SupplyCard
                key={`${supply.crop}-${supply.variety}`}
                {...supply}
                onPool={() => navigate("/pool/rose-2026")}
              />
            ))}
          </div>

          <div className="mt-10 rounded-[1.5rem] border border-emerald-100 bg-emerald-50/80 p-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-800/70">
              MATCHING OPPORTUNITY
            </p>
            <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="text-xl font-semibold">Buyer demand for 20 Q of Dutch Rose</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Your 12 Q preorder can contribute to a multi-farmer pool.
                </p>
              </div>
              <button
                onClick={() => navigate("/pool/rose-2026")}
                className="rounded-full bg-emerald-900 px-5 py-2.5 text-sm font-semibold text-white"
              >
                View pool →
              </button>
            </div>
          </div>
        </section>
      </main>

      {showForm && (
        <Modal title="Add supply" onClose={() => setShowForm(false)}>
          <form onSubmit={saveSupply} className="space-y-4">
            <Field label="Crop" placeholder="e.g. Wheat" />
            <Field label="Variety" placeholder="e.g. Sharbati" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Quantity" placeholder="e.g. 20" />
              <Select label="Unit" options={["quintal", "kg", "tonne"]} />
            </div>
            <Select label="Supply type" options={["spot", "preorder"]} />
            <Field label="Available from" type="date" />
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowForm(false)} className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold">
                Cancel
              </button>
              <button className="rounded-full bg-emerald-900 px-5 py-2.5 text-sm font-semibold text-white">
                Save supply
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function SupplyCard({ crop, variety, quantity, type, status, onPool }) {
  return (
    <article className="rounded-[1.35rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-800">
            {type}
          </span>
          <h3 className="mt-4 text-xl font-semibold">{crop}</h3>
          <p className="mt-1 text-sm text-slate-500">{variety}</p>
        </div>
        <span className="text-2xl">🌾</span>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <Info label="Quantity" value={quantity} />
        <Info label="Status" value={status} />
      </div>

      <button onClick={onPool} className="mt-5 w-full rounded-full border border-emerald-200 py-2.5 text-sm font-semibold text-emerald-800">
        Explore matching pool →
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

function Info({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-xs font-semibold text-slate-700">{value}</p>
    </div>
  );
}

function Field({ label, placeholder, type = "text" }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-slate-600">{label}</span>
      <input type={type} placeholder={placeholder} className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none focus:border-emerald-500" />
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

export default FarmerDashboard;
