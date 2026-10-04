import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  extractRecords,
  formatNumber,
  getArthiyaCommitments,
  getArthiyaDemand,
  getArthiyaFarmerSupply,
  getArthiyaSupplyPools,
} from "../../api/arthiyaApi";

function ArthiyaDashboard({ user = null }) {
  const [lots, setLots] = useState([]);
  const [demand, setDemand] = useState([]);
  const [pools, setPools] = useState([]);
  const [commitments, setCommitments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const [lotResponse, demandResponse, poolResponse, commitmentResponse] =
        await Promise.all([
          getArthiyaFarmerSupply({ status: "available" }),
          getArthiyaDemand({ status: "open" }),
          getArthiyaSupplyPools(),
          getArthiyaCommitments(),
        ]);

      setLots(extractRecords(lotResponse));
      setDemand(extractRecords(demandResponse));
      setPools(extractRecords(poolResponse));
      setCommitments(extractRecords(commitmentResponse));
    } catch (requestError) {
      setError(requestError.message || "Unable to load the Arthiya workspace.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const farmerIds = useMemo(() => {
    return new Set(
      lots
        .map((lot) => lot.farmer?._id || lot.farmer)
        .filter(Boolean)
        .map(String)
    );
  }, [lots]);

  const totalSupply = useMemo(
    () => lots.reduce((sum, lot) => sum + Number(lot.quantity || 0), 0),
    [lots]
  );

  const activeDeals = commitments.filter((item) =>
    ["created", "pending_deposit", "confirmed", "active"].includes(item.status)
  ).length;

  const opportunities = demand.length;

  return (
    <div className="space-y-7">
      <section className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">
              Arthiya workspace
            </span>
          </div>

          <h1 className="text-3xl font-bold tracking-[-0.045em] text-slate-950 sm:text-4xl">
            {user?.name || "Your workspace"}.
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
            Connect your farmer network with buyer demand, aggregate supply and
            coordinate protected trades from one workspace.
          </p>
        </div>

        <Link
          to="/arthiya/pools/create"
          className="inline-flex w-fit items-center gap-2 rounded-xl bg-emerald-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-950"
        >
          + Create supply pool
        </Link>
      </section>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Farmer network"
          value={farmerIds.size}
          unit="farmers"
          detail="Farmers represented in available supply"
        />
        <StatCard
          label="Available supply"
          value={formatNumber(totalSupply)}
          unit="units"
          detail="Available produce in the network"
        />
        <StatCard
          label="Market opportunities"
          value={opportunities}
          unit="open"
          detail="Buyer requirements to explore"
        />
        <StatCard
          label="Active deals"
          value={activeDeals}
          unit="deals"
          detail="Protected commitments in progress"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.8fr)]">
        <Panel
          eyebrow="MARKET OPPORTUNITIES"
          title="Buyer demand"
          actionLabel="View all →"
          actionPath="/arthiya/opportunities"
        >
          {loading ? (
            <EmptyState text="Loading buyer opportunities..." />
          ) : demand.length === 0 ? (
            <EmptyState text="No open buyer requirements right now." />
          ) : (
            <div className="divide-y divide-slate-100">
              {demand.slice(0, 5).map((item) => (
                <div key={item._id} className="px-5 py-4 sm:px-6">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-bold text-slate-950">
                        {item.crop}
                        {item.variety ? ` · ${item.variety}` : ""}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {formatNumber(item.quantity)} {item.unit} · {item.demandType || "demand"}
                      </p>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-800">
                      {item.status || "open"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <div className="rounded-3xl border border-emerald-900 bg-emerald-950 p-6 text-white shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-300">
            NETWORK SNAPSHOT
          </p>
          <h2 className="mt-2 text-xl font-bold">Ready to aggregate</h2>
          <p className="mt-3 text-sm leading-6 text-emerald-100/75">
            Use available farmer supply to build pools that can satisfy buyer
            requirements collectively.
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-2xl font-bold">{farmerIds.size}</p>
              <p className="mt-1 text-xs text-emerald-100/60">Farmers</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-2xl font-bold">{pools.length}</p>
              <p className="mt-1 text-xs text-emerald-100/60">Your pools</p>
            </div>
          </div>

          <Link
            to="/arthiya/farmers"
            className="mt-5 flex items-center justify-center rounded-xl bg-white px-4 py-3 text-sm font-bold text-emerald-950 transition hover:bg-emerald-50"
          >
            View farmer network →
          </Link>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Panel
          eyebrow="SUPPLY POOLS"
          title="Your latest pools"
          actionLabel="Manage pools →"
          actionPath="/arthiya/pools"
        >
          {pools.length === 0 ? (
            <EmptyState text="No supply pools created yet." />
          ) : (
            <div className="divide-y divide-slate-100">
              {pools.slice(0, 4).map((pool) => (
                <div key={pool._id} className="px-5 py-4 sm:px-6">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-bold text-slate-950">{pool.crop}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {formatNumber(pool.totalQuantity)} {pool.unit} · {pool.contributors?.length || 0} contributors
                      </p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-700">
                      {pool.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel
          eyebrow="TRADE"
          title="Recent deals"
          actionLabel="View deals →"
          actionPath="/arthiya/deals"
        >
          {commitments.length === 0 ? (
            <EmptyState text="No commitments connected to your facilitated supply yet." />
          ) : (
            <div className="divide-y divide-slate-100">
              {commitments.slice(0, 4).map((commitment) => (
                <div key={commitment._id} className="px-5 py-4 sm:px-6">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-bold text-slate-950">
                        {commitment.lot?.crop || commitment.supplyPool?.crop || "Trade"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {formatNumber(commitment.quantity)} {commitment.unit} · ₹{formatNumber(commitment.agreedPrice)}
                      </p>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-800">
                      {commitment.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </section>
    </div>
  );
}

function StatCard({ label, value, unit, detail }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
          •
        </span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
          Live
        </span>
      </div>
      <div className="mt-5 flex items-baseline gap-1.5">
        <span className="text-2xl font-bold tracking-tight text-slate-950">
          {value}
        </span>
        <span className="text-xs font-semibold text-slate-400">{unit}</span>
      </div>
      <p className="mt-1 text-sm font-semibold text-slate-700">{label}</p>
      <p className="mt-1 text-xs text-slate-400">{detail}</p>
    </div>
  );
}

function Panel({ eyebrow, title, actionLabel, actionPath, children }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-start justify-between border-b border-slate-100 px-5 py-5 sm:px-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
            {eyebrow}
          </p>
          <h2 className="mt-1 text-lg font-bold tracking-tight text-slate-950">
            {title}
          </h2>
        </div>
        {actionPath && (
          <Link
            to={actionPath}
            className="text-xs font-bold text-emerald-800 hover:text-emerald-950"
          >
            {actionLabel}
          </Link>
        )}
      </div>
      {children}
    </div>
  );
}

function EmptyState({ text }) {
  return <div className="px-5 py-8 text-sm text-slate-500 sm:px-6">{text}</div>;
}

export default ArthiyaDashboard;
