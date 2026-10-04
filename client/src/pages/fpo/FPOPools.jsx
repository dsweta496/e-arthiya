import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getSupplyPools } from "../../api/fpoApi";

function FPOPools({ user = null }) {
  const [pools, setPools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getSupplyPools({ aggregator: user?.id || user?._id })
      .then((response) => setPools(response?.data || []))
      .catch((err) => setError(err.message || "Unable to load supply pools."))
      .finally(() => setLoading(false));
  }, [user?.id, user?._id]);

  return (
    <Page title="Supply pools" subtitle="Manage aggregated farmer supply grouped for collective market opportunities.">
      <div className="flex justify-end">
        <Link to="/fpo/pools/create" className="rounded-xl bg-emerald-900 px-4 py-3 text-sm font-bold text-white">
          + Create supply pool
        </Link>
      </div>

      {error && <Alert>{error}</Alert>}

      {loading ? (
        <Empty text="Loading pools..." />
      ) : pools.length ? (
        <div className="grid gap-5 md:grid-cols-2">
          {pools.map((pool) => (
            <article key={pool._id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-950">{pool.crop}</h2>
                  <p className="mt-1 text-xs text-slate-500">{pool.variety || "Standard variety"}</p>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold capitalize text-emerald-800">
                  {(pool.status || "").replaceAll("_", " ")}
                </span>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <Metric label="Total quantity" value={`${pool.totalQuantity} ${pool.unit}`} />
                <Metric label="Farmers" value={pool.contributors?.length || 0} />
              </div>

              <div className="mt-5 border-t border-slate-100 pt-4 text-xs text-slate-500">
                {formatDate(pool.availabilityFrom)} → {formatDate(pool.availabilityUntil)}
              </div>

              {pool.procurementRequests?.length ? (
                <p className="mt-3 text-xs font-semibold text-emerald-700">
                  Linked buyer requirements: {pool.procurementRequests.length}
                </p>
              ) : (
                <p className="mt-3 text-xs text-slate-400">No buyer requirement linked yet.</p>
              )}
            </article>
          ))}
        </div>
      ) : (
        <Empty text="No pools have been created by this FPO yet." />
      )}
    </Page>
  );
}

function Page({ title, subtitle, children }) { return <div className="space-y-6"><header><p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">FPO workspace</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{title}</h1><p className="mt-2 text-sm text-slate-500">{subtitle}</p></header>{children}</div>; }
function Metric({ label, value }) { return <div className="rounded-2xl bg-slate-50 p-3"><p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 font-bold text-slate-900">{value}</p></div>; }
function Alert({ children }) { return <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{children}</div>; }
function Empty({ text }) { return <div className="rounded-3xl border border-slate-200 bg-white px-5 py-14 text-center text-sm text-slate-500 shadow-sm">{text}</div>; }
function formatDate(value) { if (!value) return "—"; return new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); }

export default FPOPools;
