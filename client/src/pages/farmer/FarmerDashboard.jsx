import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getFarmerLots, getFarmerSupplyIntents, getFarmerDemand, getFarmerCommitments, getFarmerPayments, } from "../../api/farmerApi";
function records(response) {
    return Array.isArray(response?.data) ? response.data : [];
}
function FarmerDashboard({ user = null }) {
    const farmerId = user?.id || user?._id;
    const name = user?.name?.split(" ")[0] || "Farmer";
    const [lots, setLots] = useState([]);
    const [intents, setIntents] = useState([]);
    const [demand, setDemand] = useState([]);
    const [commitments, setCommitments] = useState([]);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    useEffect(() => {
        if (!farmerId)
            return;
        const load = async () => {
            setLoading(true);
            setError("");
            try {
                const [lotsRes, intentsRes, demandRes, commitmentsRes, paymentsRes] = await Promise.all([
                    getFarmerLots(farmerId),
                    getFarmerSupplyIntents(farmerId),
                    getFarmerDemand({ status: "open" }),
                    getFarmerCommitments(),
                    getFarmerPayments(),
                ]);
                setLots(records(lotsRes));
                setIntents(records(intentsRes));
                setDemand(records(demandRes));
                setCommitments(records(commitmentsRes));
                setPayments(records(paymentsRes));
            }
            catch (err) {
                setError(err.message || "Unable to load your dashboard.");
            }
            finally {
                setLoading(false);
            }
        };
        load();
    }, [farmerId]);
    const available = useMemo(() => lots.filter((lot) => lot.status === "available").reduce((sum, lot) => sum + Number(lot.quantity || 0), 0), [lots]);
    const marketValue = useMemo(() => lots.filter((lot) => lot.status === "available").reduce((sum, lot) => sum + Number(lot.quantity || 0) * Number(lot.expectedPrice || 0), 0), [lots]);
    const activeCommitments = commitments.filter((item) => ["created", "pending_deposit", "confirmed", "active"].includes(item.status)).length;
    const recentSupply = [
        ...lots.map((lot) => ({ ...lot, kind: "Spot", quantity: lot.quantity, date: lot.availableFrom || lot.createdAt })),
        ...intents.map((intent) => ({ ...intent, kind: "Future", quantity: intent.expectedQuantity, date: intent.expectedHarvestDate })),
    ].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)).slice(0, 5);
    return (<div className="space-y-7">
      <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">Farmer workspace</p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Good morning, {name}.</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
            Your live supply, buyer demand, commitments and payments — all in one place.
          </p>
        </div>
        <Link to="/farmer/supply/add" className="inline-flex w-fit rounded-xl bg-emerald-900 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-950">
          + Add supply
        </Link>
      </header>

      {error && <Alert>{error}</Alert>}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Available supply" value={loading ? "—" : `${fmt(available)} q`} detail="Ready for buyer matching"/>
        <Stat label="Open buyer demand" value={loading ? "—" : demand.length} detail="Requirements currently open"/>
        <Stat label="Active commitments" value={loading ? "—" : activeCommitments} detail="Deals linked to your supply"/>
        <Stat label="Listed market value" value={loading ? "—" : money(marketValue)} detail="Available spot supply"/>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.4fr_.8fr]">
        <Card title="Your latest supply" action={<Link to="/farmer/supply" className="text-xs font-bold text-emerald-800">View all →</Link>}>
          {loading ? <Loading /> : recentSupply.length === 0 ? <Empty text="No supply listed yet." link="/farmer/supply/add"/> : (<div className="divide-y divide-slate-100">
              {recentSupply.map((item) => (<div key={`${item.kind}-${item._id}`} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2"><b className="text-sm text-slate-900">{item.crop}</b><Badge>{item.kind}</Badge></div>
                    <p className="mt-1 text-xs text-slate-400">{fmt(item.quantity)} {item.unit} · {item.location?.district || "Location not set"}</p>
                  </div>
                  <div className="text-left sm:text-right"><p className="text-xs font-semibold text-slate-700">{statusLabel(item.status)}</p><p className="mt-1 text-[11px] text-slate-400">{date(item.date)}</p></div>
                </div>))}
            </div>)}
        </Card>

        <div className="space-y-6">
          <Card title="Buyer demand" action={<Link to="/farmer/demand" className="text-xs font-bold text-emerald-800">Explore →</Link>}>
            {demand.slice(0, 4).map((item) => (<div key={item._id} className="border-b border-slate-100 px-5 py-3 last:border-0"><p className="text-sm font-bold text-slate-900">{item.crop}</p><p className="mt-1 text-xs text-slate-400">{fmt(item.quantity)} {item.unit} · needed by {date(item.requiredBy)}</p></div>))}
            {!loading && demand.length === 0 && <p className="px-5 py-6 text-sm text-slate-400">No open buyer demand right now.</p>}
          </Card>
          <Card title="Trade snapshot">
            <div className="grid grid-cols-2 gap-3 px-5 pb-5">
              <Mini label="Commitments" value={commitments.length}/>
              <Mini label="Payments linked" value={payments.length}/>
            </div>
          </Card>
        </div>
      </section>
    </div>);
}
function Card({ title, action, children }) { return <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><h2 className="text-sm font-bold text-slate-950">{title}</h2>{action}</div>{children}</section>; }
function Stat({ label, value, detail }) { return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-3 text-2xl font-bold text-slate-950">{value}</p><p className="mt-1 text-xs text-slate-400">{detail}</p></div>; }
function Mini({ label, value }) { return <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs text-slate-400">{label}</p><p className="mt-1 text-xl font-bold text-slate-950">{value}</p></div>; }
function Badge({ children }) { return <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">{children}</span>; }
function Alert({ children }) { return <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{children}</div>; }
function Loading() { return <div className="px-5 py-10 text-center text-sm text-slate-400">Loading your workspace…</div>; }
function Empty({ text, link }) { return <div className="px-5 py-10 text-center"><p className="text-sm font-semibold text-slate-700">{text}</p><Link to={link} className="mt-3 inline-flex rounded-xl bg-emerald-900 px-4 py-2 text-xs font-bold text-white">Add supply</Link></div>; }
function fmt(value) { return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(Number(value || 0)); }
function money(value) { return Number(value || 0) > 0 ? `₹${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(value)}` : "₹0"; }
function date(value) { if (!value)
    return "—"; return new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); }
function statusLabel(status) { return String(status || "unknown").replaceAll("_", " ").replace(/^./, (c) => c.toUpperCase()); }
export default FarmerDashboard;
