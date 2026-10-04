import { useEffect, useState } from "react";
import { getFarmerDemand, getFarmerDemandMatches } from "../../api/farmerApi";
const fmt = (v) => new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(Number(v || 0));
const date = (v) => v ? new Date(v).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
function FarmerDemand({ opportunities = false }) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [matches, setMatches] = useState({});
    useEffect(() => { (async () => { try {
        setLoading(true);
        const res = await getFarmerDemand({ status: "open" });
        setItems(Array.isArray(res?.data) ? res.data : []);
    }
    catch (e) {
        setError(e.message || "Unable to load buyer demand.");
    }
    finally {
        setLoading(false);
    } })(); }, []);
    const showMatches = async (id) => { try {
        const res = await getFarmerDemandMatches(id);
        setMatches(x => ({ ...x, [id]: res?.matches || [] }));
    }
    catch (e) {
        setError(e.message || "Unable to check matching supply.");
    } };
    return <div className="space-y-7">
    <header><p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">Farmer workspace</p><h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">{opportunities ? "Market opportunities" : "Buyer demand"}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">See live buyer requirements and check whether your supply can participate in the match.</p></header>
    {error && <Alert>{error}</Alert>}
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      {loading ? <Loading /> : items.length === 0 ? <Empty /> : <div className="divide-y divide-slate-100">{items.map(item => <div key={item._id} className="p-5 sm:p-6">
        <div className="grid gap-5 lg:grid-cols-[1.2fr_.8fr_.8fr_.8fr_auto] lg:items-center"><div><h2 className="font-bold text-slate-900">{item.crop}{item.variety ? ` · ${item.variety}` : ""}</h2><p className="mt-1 text-xs text-slate-400">Buyer: {item.buyer?.name || "Platform buyer"} · {item.demandType || "—"}</p></div><Detail title="Demand" value={`${fmt(item.quantity)} ${item.unit}`}/><Detail title="Available from" value={date(item.availabilityFrom)}/><Detail title="Required by" value={date(item.requiredBy)}/><button onClick={() => showMatches(item._id)} className="rounded-xl bg-emerald-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-950">Check match</button></div>
        {matches[item._id] && <div className="mt-5 rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-400">Current platform matches</p>{matches[item._id].length === 0 ? <p className="mt-2 text-sm text-slate-500">No currently available supply match found.</p> : <div className="mt-2 space-y-2">{matches[item._id].map((m, i) => <div key={i} className="flex flex-wrap justify-between gap-2 text-sm"><span>{m.sourceType} · {fmt(m.availableQuantity)} {m.unit}</span><span className="font-semibold text-emerald-800">{m.farmer === item.buyer ? "" : "Available"}</span></div>)}</div>}</div>}
      </div>)}</div>}
    </section>
  </div>;
}
function Detail({ title, value }) { return <div><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{title}</p><p className="mt-1 text-sm font-semibold text-slate-700">{value}</p></div>; }
function Alert({ children }) { return <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{children}</div>; }
function Loading() { return <div className="px-6 py-12 text-center text-sm text-slate-400">Loading buyer demand…</div>; }
function Empty() { return <div className="px-6 py-12 text-center text-sm text-slate-400">There are no open buyer requirements right now.</div>; }
export default FarmerDemand;
