import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  cancelBuyerRequirement,
  getBuyerRequirements,
  runBuyerMatching,
} from "../../api/buyerApi";

const date = (value) => value ? new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

function rows(response) {
  return Array.isArray(response?.data) ? response.data : [];
}

export default function BuyerRequirements() {
  const [requirements, setRequirements] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    try {
      setLoading(true);
      const response = await getBuyerRequirements();
      setRequirements(rows(response));
    } catch (err) {
      setError(err.message || "Unable to load requirements.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const visible = useMemo(
    () => filter === "all" ? requirements : requirements.filter((item) => item.status === filter),
    [requirements, filter]
  );

  async function match(id) {
    try {
      setBusy(id);
      setError("");
      setMessage("");
      const response = await runBuyerMatching(id);
      setMessage(response?.message || "Matching completed.");
      await load();
    } catch (err) {
      setError(err.message || "Unable to run matching.");
    } finally {
      setBusy("");
    }
  }

  async function cancel(id) {
    if (!window.confirm("Cancel this procurement requirement?")) return;
    try {
      setBusy(id);
      await cancelBuyerRequirement(id);
      await load();
    } catch (err) {
      setError(err.message || "Unable to cancel requirement.");
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">Buyer workspace</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">My requirements</h1>
          <p className="mt-2 text-sm text-slate-500">Manage the produce you are sourcing and run matching against available supply.</p>
        </div>
        <Link to="/buyer/requirements/add" className="rounded-xl bg-emerald-900 px-5 py-3 text-sm font-semibold text-white">+ Post requirement</Link>
      </header>

      {message && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{message}</div>}
      {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      <div className="flex flex-wrap gap-2">
        {["all", "open", "partially_fulfilled", "fulfilled", "cancelled"].map((item) => (
          <button key={item} onClick={() => setFilter(item)} className={`rounded-full px-4 py-2 text-xs font-bold capitalize ${filter === item ? "bg-emerald-900 text-white" : "bg-white text-slate-600 border border-slate-200"}`}>
            {item.replaceAll("_", " ")}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        {loading ? <div className="p-8 text-sm text-slate-500">Loading requirements…</div> : visible.length === 0 ? <div className="p-10 text-center text-sm text-slate-500">No requirements in this view.</div> : (
          <div className="divide-y divide-slate-100">
            {visible.map((item) => (
              <div key={item._id} className="p-5 sm:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-bold text-slate-950">{item.crop}</h2>
                      {item.variety && <span className="text-xs text-slate-500">· {item.variety}</span>}
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold capitalize text-slate-600">{String(item.status).replaceAll("_", " ")}</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{item.quantity} {item.unit} · {item.demandType} demand</p>
                    <p className="mt-1 text-xs text-slate-400">Available from {date(item.availabilityFrom)} · Required by {date(item.requiredBy)}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {!["cancelled", "fulfilled"].includes(item.status) && <button disabled={busy === item._id} onClick={() => match(item._id)} className="rounded-xl bg-emerald-900 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50">{busy === item._id ? "Working…" : "Run matching"}</button>}
                    {!['cancelled', 'fulfilled'].includes(item.status) && <button disabled={busy === item._id} onClick={() => cancel(item._id)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 disabled:opacity-50">Cancel</button>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
