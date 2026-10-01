import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import heroImage from "../assets/hero-market.jpg";

function Dashboard() {
  return (
    <div className="min-h-screen bg-slate-50 text-emerald-950">
      <Navbar />

      <main className="relative isolate min-h-[calc(100vh-68px)] overflow-hidden">
        <div
          className="absolute inset-0 -z-20 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-white via-white/95 to-white/45" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-slate-50/95 via-transparent to-white/10" />

        <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-10 lg:py-14">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-800/70">
              E-ARTHIYA MARKETPLACE
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.045em] sm:text-5xl lg:text-6xl">
              One marketplace.
              <span className="block text-emerald-800">Every role connected.</span>
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              Choose how you participate and follow the same supply → demand → pool → auction journey.
            </p>
          </div>

          <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <RoleCard
              icon="🌾"
              title="Farmer"
              text="List produce, choose spot or preorder supply, and join pooled demand."
              to="/farmer"
            />
            <RoleCard
              icon="◫"
              title="Buyer"
              text="Post what you need, discover supply and track your matched quantity."
              to="/buyer"
            />
            <RoleCard
              icon="◎"
              title="FPO / Arthiya"
              text="Aggregate farmer supply, coordinate pools and support buyer fulfilment."
              to="/aggregator"
            />
          </div>

          <div className="mt-6 flex flex-wrap gap-3 text-xs font-medium text-slate-500">
            <span className="rounded-full border border-white/80 bg-white/75 px-3 py-2 backdrop-blur">
              Spot + future supply
            </span>
            <span className="rounded-full border border-white/80 bg-white/75 px-3 py-2 backdrop-blur">
              Multi-farmer aggregation
            </span>
            <span className="rounded-full border border-white/80 bg-white/75 px-3 py-2 backdrop-blur">
              Protected commitments
            </span>
          </div>
        </section>
      </main>
    </div>
  );
}

function RoleCard({ icon, title, text, to }) {
  return (
    <Link
      to={to}
      className="group min-h-[275px] rounded-[1.5rem] border border-white/80 bg-white/90 p-7 text-left shadow-lg shadow-slate-900/5 backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:bg-white hover:shadow-xl"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-xl">
        {icon}
      </div>
      <h2 className="mt-7 text-2xl font-semibold tracking-tight">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-500">{text}</p>
      <div className="mt-6 text-sm font-semibold text-emerald-800 transition group-hover:translate-x-1">
        Continue →
      </div>
    </Link>
  );
}

export default Dashboard;
