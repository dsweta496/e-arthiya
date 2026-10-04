import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  extractRecords,
  formatDate,
  formatNumber,
  getArthiyaSupplyPools,
} from "../../api/arthiyaApi";

function ArthiyaPools() {
  const [pools, setPools] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPools = async () => {
    try {
      setLoading(true);
      const response = await getArthiyaSupplyPools(
        filter === "all" ? {} : { status: filter }
      );
      setPools(extractRecords(response));
    } catch (requestError) {
      setError(requestError.message || "Unable to load supply pools.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPools();
  }, [filter]);

  return (
    <div className="space-y-7">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">Supply pools</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Aggregated supply</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
            Combine farmer contributions into a single supply pool for buyer demand.
          </p>
        </div>
        <Link
          to="/arthiya/pools/create"
          className="rounded-xl bg-emerald-900 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-950"
        >
          + Create pool
        </Link>
      </header>

      {error && <ErrorBox message={error} />}

      <div className="flex flex-wrap gap-2">
        {[
          ["all", "All"],
          ["forming", "Forming"],
          ["ready", "Ready"],
          ["committed", "Committed"],
          ["fulfilled", "Fulfilled"],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              filter === value ? "bg-emerald-900 text-white" : "border border-slate-200 bg-white text-slate-600"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading pools...</p>
      ) : pools.length === 0 ? (
        <Empty text="No pools found." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {pools.map((pool) => (
            <article key={pool._id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Pool</p>
                  <h2 className="mt-1 text-xl font-bold text-slate-950">{pool.crop}</h2>
                  <p className="mt-1 text-sm text-slate-500">{pool.variety || "No variety specified"}</p>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-800">{pool.status}</span>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-4">
                <Detail label="Total quantity" value={`${formatNumber(pool.totalQuantity)} ${pool.unit}`} />
                <Detail label="Contributors" value={pool.contributors?.length || 0} />
                <Detail label="From" value={formatDate(pool.availabilityFrom)} />
                <Detail label="Until" value={formatDate(pool.availabilityUntil)} />
              </div>

              <div className="mt-5 border-t border-slate-100 pt-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Contributors</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(pool.contributors || []).map((contributor, index) => (
                    <span key={`${contributor.farmer?._id || contributor.farmer}-${index}`} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                      {contributor.farmer?.name || "Farmer"} · {formatNumber(contributor.quantity)} {pool.unit}
                    </span>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-700">{value}</p>
    </div>
  );
}

function Empty({ text }) {
  return <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-sm text-slate-500">{text}</div>;
}

function ErrorBox({ message }) {
  return <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{message}</div>;
}

export default ArthiyaPools;
