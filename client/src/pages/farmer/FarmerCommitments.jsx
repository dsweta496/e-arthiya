import { useEffect, useState } from "react";
import { getFarmerCommitments } from "../../api/farmerApi";
const fmt = v => new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(Number(v || 0));
const date = v => v ? new Date(v).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const label = v => String(v || "unknown").replaceAll("_", " ").replace(/^./, c => c.toUpperCase());
function FarmerCommitments() { const [items, setItems] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(""); useEffect(() => { (async () => { try {
    const r = await getFarmerCommitments();
    setItems(Array.isArray(r?.data) ? r.data : []);
}
catch (e) {
    setError(e.message || "Unable to load commitments.");
}
finally {
    setLoading(false);
} })(); }, []); return <div className="space-y-7"><header><p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">Trade</p><h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Commitments</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Track buyer commitments connected to your produce and see their deposit and settlement state.</p></header>{error && <Alert>{error}</Alert>}<div className="grid gap-4 sm:grid-cols-3"><Stat label="Total" value={items.length}/><Stat label="Active" value={items.filter(x => ["created", "pending_deposit", "confirmed", "active"].includes(x.status)).length}/><Stat label="Settled" value={items.filter(x => x.status === "settled" || x.status === "fulfilled").length}/></div><section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">{loading ? <Loading /> : items.length === 0 ? <Empty /> : <div className="divide-y divide-slate-100">{items.map(c => <div key={c._id} className="p-5 sm:p-6"><div className="grid gap-5 lg:grid-cols-[1.2fr_.8fr_.8fr_.8fr] lg:items-center"><div><div className="flex flex-wrap items-center gap-2"><h2 className="font-bold text-slate-900">{c.lot?.crop || c.supplyIntent?.crop || "Produce commitment"}</h2><span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-700">{label(c.status)}</span></div><p className="mt-1 text-xs text-slate-400">Buyer: {c.buyer?.name || c.externalBuyerName || "External buyer"} · Source: {label(c.source)}</p></div><Detail title="Quantity" value={`${fmt(c.quantity)} ${c.unit}`}/><Detail title="Agreed price" value={`₹${fmt(c.agreedPrice)} / ${c.unit}`}/><Detail title="Deposit" value={`${fmt(c.depositPercentage)}% · ₹${fmt(c.depositAmount)}`}/></div><div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500"><span>Created {date(c.createdAt)}</span><span>Window ends {date(c.commitmentWindowEndsAt)}</span>{c.settlement?.settledAt && <span>Settled {date(c.settlement.settledAt)}</span>}</div></div>)}</div>}</section></div>; }
function Detail({ title, value }) { return <div><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{title}</p><p className="mt-1 text-sm font-semibold text-slate-700">{value}</p></div>; }
;
function Stat({ label, value }) { return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-2 text-2xl font-bold text-slate-950">{value}</p></div>; }
;
function Alert({ children }) { return <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{children}</div>; }
;
function Loading() { return <div className="px-6 py-12 text-center text-sm text-slate-400">Loading commitments…</div>; }
;
function Empty() { return <div className="px-6 py-12 text-center text-sm text-slate-400">No commitments are linked to your supply yet.</div>; }
export default FarmerCommitments;
