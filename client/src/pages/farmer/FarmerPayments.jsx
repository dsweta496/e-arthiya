import { useEffect, useState } from "react";
import { getFarmerPayments } from "../../api/farmerApi";
const fmt = v => new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(Number(v || 0));
const date = v => v ? new Date(v).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
function FarmerPayments() { const [items, setItems] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(""); useEffect(() => { (async () => { try {
    const r = await getFarmerPayments();
    setItems(Array.isArray(r?.data) ? r.data : []);
}
catch (e) {
    setError(e.message || "Unable to load payments.");
}
finally {
    setLoading(false);
} })(); }, []); const total = items.filter(x => x.status === "completed").reduce((s, x) => s + Number(x.amount || 0), 0); return <div className="space-y-7"><header><p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">Trade</p><h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Payments</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">View payment transactions linked to commitments on your produce.</p></header>{error && <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}<div className="grid gap-4 sm:grid-cols-3"><Stat label="Transactions" value={items.length}/><Stat label="Completed value" value={`₹${fmt(total)}`}/><Stat label="Completed" value={items.filter(x => x.status === "completed").length}/></div><section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">{loading ? <div className="px-6 py-12 text-center text-sm text-slate-400">Loading payments…</div> : items.length === 0 ? <div className="px-6 py-12 text-center text-sm text-slate-400">No payment transactions are linked to your supply yet.</div> : <div className="divide-y divide-slate-100">{items.map(p => <div key={p._id} className="grid gap-4 p-5 md:grid-cols-[1fr_.8fr_.8fr_.8fr] md:items-center"><div><p className="font-bold text-slate-900">{p.type?.replaceAll("_", " ")}</p><p className="mt-1 text-xs text-slate-400">{p.payer?.name || "Buyer"} · {p.transactionReference || "No reference"}</p></div><Detail title="Amount" value={`₹${fmt(p.amount)} ${p.currency || "INR"}`}/><Detail title="Status" value={p.status}/><Detail title="Paid" value={date(p.paidAt || p.createdAt)}/></div>)}</div>}</section></div>; }
function Detail({ title, value }) { return <div><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{title}</p><p className="mt-1 text-sm font-semibold text-slate-700">{value}</p></div>; }
;
function Stat({ label, value }) { return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-2 text-2xl font-bold text-slate-950">{value}</p></div>; }
;
export default FarmerPayments;
