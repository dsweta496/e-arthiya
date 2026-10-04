import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  getFPOCommitments,
  getFPOFarmers,
  getFPOFarmerSupply,
  getFPODemand,
  getSupplyPools,
  getFPOSettlements,
} from "../../api/fpoApi";

function FPODashboard({ user = null }) {
  const [farmers, setFarmers] = useState([]);
  const [supply, setSupply] = useState([]);
  const [demand, setDemand] = useState([]);
  const [pools, setPools] = useState([]);
  const [commitments, setCommitments] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        const [
          farmerResponse,
          supplyResponse,
          demandResponse,
          poolResponse,
          commitmentResponse,
          settlementResponse,
        ] = await Promise.all([
          getFPOFarmers(),
          getFPOFarmerSupply(),
          getFPODemand(),
          getSupplyPools({ aggregator: user?.id || user?._id }),
          getFPOCommitments(),
          getFPOSettlements(),
        ]);

        setFarmers(records(farmerResponse));
        setSupply(records(supplyResponse));
        setDemand(records(demandResponse));
        setPools(records(poolResponse));
        setCommitments(records(commitmentResponse));
        setSettlements(records(settlementResponse));
      } catch (requestError) {
        setError(requestError.message || "Unable to load the FPO dashboard.");
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [user?.id, user?._id]);

  const availableQuantity = useMemo(
    () =>
      supply
        .filter((item) => item.status === "available")
        .reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    [supply]
  );

  const activePools = pools.filter(
    (pool) => !["cancelled", "fulfilled"].includes(pool.status)
  );

  const openDemand = demand.filter(
    (item) => !["cancelled", "fulfilled"].includes(item.status)
  );

  const activeDeals = commitments.filter(
    (item) => !["cancelled", "fulfilled"].includes(item.status)
  );

  const completedSettlementValue = settlements
    .filter((item) => item.status === "completed")
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  return (
    <div className="space-y-7">
      <section className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">
              FPO workspace
            </span>
          </div>

          <h1 className="text-3xl font-bold tracking-[-0.045em] text-slate-950 sm:text-4xl">
            {user?.name || "Your FPO"}.
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
            Coordinate your farmer network, aggregate compatible supply and
            connect collective produce with buyer demand.
          </p>
        </div>

        <Link
          to="/fpo/pools/create"
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
          label="Farmers connected"
          value={loading ? "—" : farmers.length}
          unit="farmers"
          detail="Registered farmer accounts"
        />
        <StatCard
          label="Available supply"
          value={loading ? "—" : formatNumber(availableQuantity)}
          unit="units"
          detail="Currently available farmer supply"
        />
        <StatCard
          label="Open demand"
          value={loading ? "—" : openDemand.length}
          unit="requests"
          detail="Buyer requirements"
        />
        <StatCard
          label="Active pools"
          value={loading ? "—" : activePools.length}
          unit="pools"
          detail={`${activeDeals.length} active commitments`}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <Panel
          title="Active supply pools"
          eyebrow="Aggregation"
          action="/fpo/pools"
          actionLabel="View all →"
        >
          {activePools.length ? (
            <div className="divide-y divide-slate-100">
              {activePools.slice(0, 5).map((pool) => (
                <Link
                  key={pool._id}
                  to={`/fpo/pools?id=${pool._id}`}
                  className="block px-5 py-4 transition hover:bg-slate-50 sm:px-6"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {pool.crop}
                        {pool.variety ? ` · ${pool.variety}` : ""}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {pool.contributors?.length || 0} farmers ·{" "}
                        {formatNumber(pool.totalQuantity)} {pool.unit}
                      </p>
                    </div>

                    <StatusBadge status={pool.status} />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <Empty text="No supply pools have been created yet." />
          )}
        </Panel>

        <Panel
          title="Buyer demand"
          eyebrow="Demand"
          action="/fpo/demand"
          actionLabel="Explore demand →"
        >
          {openDemand.length ? (
            <div className="space-y-3 p-5 sm:p-6">
              {openDemand.slice(0, 4).map((item) => (
                <Link
                  key={item._id}
                  to={`/fpo/demand?id=${item._id}`}
                  className="block rounded-2xl border border-slate-200 p-4 transition hover:border-emerald-200 hover:bg-emerald-50/40"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {item.crop}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {formatNumber(item.quantity)} {item.unit}
                        {item.demandType ? ` · ${item.demandType}` : ""}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-emerald-800">
                      Match →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <Empty text="No open buyer demand right now." />
          )}
        </Panel>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Panel title="Farmer network" eyebrow="Organization">
          {farmers.length ? (
            <div className="divide-y divide-slate-100">
              {farmers.slice(0, 5).map((farmer) => (
                <div
                  key={farmer._id}
                  className="flex items-center justify-between px-5 py-4 sm:px-6"
                >
                  <div>
                    <p className="font-semibold text-slate-900">
                      {farmer.name}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {locationText(farmer.location)}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-emerald-700">
                    {farmer.verificationStatus || "verified"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <Empty text="No farmer accounts found." />
          )}
        </Panel>

        <Panel title="Settlement snapshot" eyebrow="Trade">
          <div className="p-5 sm:p-6">
            <div className="grid grid-cols-2 gap-3">
              <Metric
                label="Completed value"
                value={`₹${formatNumber(completedSettlementValue)}`}
              />
              <Metric
                label="Transactions"
                value={settlements.length}
              />
            </div>

            <Link
              to="/fpo/settlements"
              className="mt-5 block rounded-xl bg-emerald-900 px-4 py-3 text-center text-sm font-bold text-white transition hover:bg-emerald-950"
            >
              Open settlements
            </Link>
          </div>
        </Panel>
      </section>
    </div>
  );
}

function Panel({ title, eyebrow, action, actionLabel, children }) {
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

        {action && (
          <Link
            to={action}
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

function StatCard({ label, value, unit, detail }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
        {label}
      </p>
      <div className="mt-4 flex items-baseline gap-1.5">
        <span className="text-2xl font-bold text-slate-950">{value}</span>
        {unit && <span className="text-xs font-semibold text-slate-400">{unit}</span>}
      </div>
      <p className="mt-1 text-xs text-slate-500">{detail}</p>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-bold text-slate-950">{value}</p>
    </div>
  );
}

function StatusBadge({ status }) {
  return (
    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold capitalize text-emerald-800">
      {(status || "unknown").replaceAll("_", " ")}
    </span>
  );
}

function Empty({ text }) {
  return <div className="px-5 py-10 text-center text-sm text-slate-500">{text}</div>;
}

function records(response) {
  return response?.data || response?.users || response?.allocations || [];
}

function locationText(location) {
  if (!location) return "Location not provided";
  return [location.village, location.district, location.state].filter(Boolean).join(", ");
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

export default FPODashboard;
