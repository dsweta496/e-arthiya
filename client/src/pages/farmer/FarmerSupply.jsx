import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getFarmerLots, getFarmerSupplyIntents, cancelFarmerLot, cancelFarmerSupplyIntent, updateFarmerLot, updateFarmerSupplyIntent, } from "../../api/farmerApi";
const normalize = (response) => Array.isArray(response?.data) ? response.data : [];
const fmt = (v) => new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(Number(v || 0));
const date = (v) => v ? new Date(v).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const label = (v) => String(v || "unknown").replaceAll("_", " ").replace(/^./, (c) => c.toUpperCase());
function FarmerSupply({ user = null }) {
    const farmerId = user?.id || user?._id;
    const [lots, setLots] = useState([]);
    const [intents, setIntents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all");
    const [busyId, setBusyId] = useState("");
    const load = async () => {
        if (!farmerId)
            return;
        setLoading(true);
        setError("");
        try {
            const [lotsRes, intentsRes] = await Promise.all([getFarmerLots(farmerId), getFarmerSupplyIntents(farmerId)]);
            setLots(normalize(lotsRes));
            setIntents(normalize(intentsRes));
        }
        catch (err) {
            setError(err.message || "Unable to load your supply.");
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => { load(); }, [farmerId]);
    const records = useMemo(() => [
        ...lots.map((lot) => ({ ...lot, source: "lot", type: "Spot", quantity: lot.quantity, availability: lot.availableFrom || lot.harvestDate, price: lot.expectedPrice })),
        ...intents.map((intent) => ({ ...intent, source: "intent", type: "Future", quantity: intent.expectedQuantity, availability: intent.expectedHarvestDate, price: null })),
    ], [lots, intents]);
    const filtered = records.filter((item) => {
        const q = search.trim().toLowerCase();
        const matchesSearch = !q || `${item.crop} ${item.variety || ""} ${item.location?.district || ""}`.toLowerCase().includes(q);
        if (!matchesSearch)
            return false;
        if (filter === "available")
            return item.status === "available";
        if (filter === "committed")
            return ["committed", "reserved", "in_auction"].includes(item.status);
        if (filter === "future")
            return item.source === "intent";
        if (filter === "cancelled")
            return item.status === "cancelled";
        return true;
    });
    const act = async (item, status = "cancelled") => {
        setBusyId(item._id);
        setError("");
        try {
            if (item.source === "lot")
                await updateFarmerLot(item._id, { status });
            else
                await updateFarmerSupplyIntent(item._id, { status });
            await load();
        }
        catch (err) {
            setError(err.message || "Could not update this supply.");
        }
        finally {
            setBusyId("");
        }
    };
    return (<div className="space-y-7">
      <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div><p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">Farmer workspace</p><h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">My supply</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Manage live spot lots and future supply commitments from one place.</p></div>
        <Link to="/farmer/supply/add" className="inline-flex w-fit rounded-xl bg-emerald-900 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-950">+ Add supply</Link>
      </header>

      {error && <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Total records" value={records.length}/>
        <Stat label="Available" value={records.filter((x) => x.status === "available").length}/>
        <Stat label="Future supply" value={intents.length}/>
        <Stat label="Committed / reserved" value={records.filter((x) => ["committed", "reserved", "in_auction"].includes(x.status)).length}/>
      </div>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center lg:justify-between">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search crop, variety or location…" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-400 lg:max-w-sm"/>
          <div className="flex flex-wrap gap-2">{[["all", "All"], ["available", "Available"], ["future", "Future"], ["committed", "Committed"], ["cancelled", "Cancelled"]].map(([value, text]) => <button key={value} onClick={() => setFilter(value)} className={`rounded-xl px-3 py-2 text-xs font-bold ${filter === value ? "bg-emerald-900 text-white" : "bg-slate-100 text-slate-500"}`}>{text}</button>)}</div>
        </div>

        {loading ? <div className="px-6 py-12 text-center text-sm text-slate-400">Loading your supply…</div> : filtered.length === 0 ? <div className="px-6 py-12 text-center text-sm text-slate-400">No supply records match this view.</div> : (<div className="divide-y divide-slate-100">
            {filtered.map((item) => <SupplyRow key={`${item.source}-${item._id}`} item={item} busy={busyId === item._id} onAction={act}/>)}
          </div>)}
      </section>
    </div>);
}
function SupplyRow({ item, busy, onAction }) {
    const canCancel = ["available", "draft"].includes(item.status);
    const canRestore = item.status === "cancelled";
    return <div className="p-5 sm:p-6"><div className="grid gap-5 lg:grid-cols-[1.4fr_.8fr_.8fr_.8fr_auto] lg:items-center">
    <div><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold text-slate-900">{item.crop}</h3><Badge>{item.type}</Badge><Badge muted>{label(item.status)}</Badge></div><p className="mt-1 text-xs text-slate-400">{item.variety || "No variety specified"} · {item.location?.village || item.location?.district || "Location not set"}</p></div>
    <Detail title="Quantity" value={`${fmt(item.quantity)} ${item.unit}`}/>
    <Detail title={item.source === "intent" ? "Expected harvest" : "Available from"} value={date(item.availability)}/>
    <Detail title="Price" value={item.price ? `₹${fmt(item.price)} / ${item.unit}` : "Not set"}/>
    <div className="flex gap-2">{canCancel && <button disabled={busy} onClick={() => onAction(item)} className="rounded-xl border border-red-100 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50">{busy ? "…" : "Cancel"}</button>}{canRestore && <button disabled={busy} onClick={() => onAction(item, "available")} className="rounded-xl bg-emerald-900 px-3 py-2 text-xs font-bold text-white">Restore</button>}</div>
  </div></div>;
}
function Detail({ title, value }) { return <div><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{title}</p><p className="mt-1 text-sm font-semibold text-slate-700">{value}</p></div>; }
function Stat({ label, value }) { return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-2 text-2xl font-bold text-slate-950">{value}</p></div>; }
function Badge({ children, muted }) { return <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${muted ? "bg-slate-100 text-slate-600" : "bg-emerald-50 text-emerald-700"}`}>{children}</span>; }
export default FarmerSupply;
