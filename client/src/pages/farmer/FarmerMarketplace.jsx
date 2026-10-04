import { useEffect, useState } from "react";
import { getFarmerMarketplaceLots } from "../../api/farmerApi";
const fmt = (v) => new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(Number(v || 0));
const date = (v) => v ? new Date(v).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "—";
function FarmerMarketplace() {
    const [lots, setLots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    useEffect(() => { (async () => { try {
        const r = await getFarmerMarketplaceLots();
        setLots(Array.isArray(r?.data) ? r.data : []);
    }
    catch (e) {
        setError(e.message || "Unable to load marketplace.");
    }
    finally {
        setLoading(false);
    } })(); }, []);
    const available = lots.filter(x => x.status === "available").filter(x => !search || `${x.crop} ${x.variety || ""} ${x.location?.district || ""}`.toLowerCase().includes(search.toLowerCase()));
    return <div className="space-y-7"><header><p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">Farmer marketplace</p><h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Live market supply</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">See what is currently listed across the platform and compare your own supply with the market.</p></header>
 {error && <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
 <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search crop or location…" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-400"/></div>
 {loading ? <div className="rounded-3xl border border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-400">Loading marketplace…</div> : available.length === 0 ? <div className="rounded-3xl border border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-400">No available spot lots found.</div> : <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{available.map(lot => <article key={lot._id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">{lot.images?.[0] ? <img src={lot.images[0]} alt={lot.crop} className="h-44 w-full object-cover"/> : <div className="flex h-44 items-center justify-center bg-emerald-50 text-5xl">🌾</div>}<div className="p-5"><div className="flex items-start justify-between gap-3"><div><h2 className="text-lg font-bold text-slate-950">{lot.crop}</h2><p className="mt-1 text-xs text-slate-400">{lot.variety || "Standard variety"}</p></div><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">Available</span></div><div className="mt-5 grid grid-cols-2 gap-4"><Detail title="Quantity" value={`${fmt(lot.quantity)} ${lot.unit}`}/><Detail title="Expected price" value={lot.expectedPrice ? `₹${fmt(lot.expectedPrice)}/${lot.unit}` : "—"}/><Detail title="Location" value={lot.location?.district || lot.location?.state || "—"}/><Detail title="Available" value={date(lot.availableFrom)}/></div><p className="mt-4 text-xs text-slate-400">Farmer: {lot.farmer?.name || "Platform farmer"}</p></div></article>)}</div>}
 </div>;
}
function Detail({ title, value }) { return <div><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{title}</p><p className="mt-1 text-sm font-semibold text-slate-700">{value}</p></div>; }
export default FarmerMarketplace;
