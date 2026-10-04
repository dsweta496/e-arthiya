import { useEffect, useMemo, useState } from "react";
import {
  extractRecords,
  formatNumber,
  getArthiyaCommitments,
} from "../../api/arthiyaApi";

function ArthiyaDeals() {
  const [commitments, setCommitments] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const response = await getArthiyaCommitments(
          filter === "all" ? {} : { status: filter }
        );
        setCommitments(extractRecords(response));
      } catch (requestError) {
        setError(requestError.message || "Unable to load deals.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [filter]);

  const totalValue = useMemo(
    () => commitments.reduce((sum, item) => sum + Number(item.agreedPrice || 0) * Number(item.quantity || 0), 0),
    [commitments]
  );

  return (
    <div className="space-y-7">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">Deals</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Protected trade commitments</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
          Track commitments connected to supply facilitated through your Arthiya workspace.
        </p>
      </header>

      {error && <ErrorBox message={error} />}

      <section className="grid gap-4 sm:grid-cols-3">
        <Stat label="Deals" value={commitments.length} />
        <Stat label="Active" value={commitments.filter((item) => ["created", "pending_deposit", "confirmed", "active"].includes(item.status)).length} />
        <Stat label="Indicative value" value={`₹${formatNumber(totalValue)}`} />
      </section>

      <div className="flex flex-wrap gap-2">
        {["all", "created", "pending_deposit", "confirmed", "active", "settled", "cancelled"].map((value) => (
          <button key={value} onClick={() => setFilter(value)} className={`rounded-full px-4 py-2 text-sm font-semibold ${filter === value ? "bg-emerald-900 text-white" : "border border-slate-200 bg-white text-slate-600"}`}>
            {value.replaceAll("_", " ")}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading deals...</p>
      ) : commitments.length === 0 ? (
        <Empty text="No commitments connected to your facilitated supply." />
      ) : (
        <div className="space-y-3">
          {commitments.map((commitment) => (
            <article key={commitment._id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-bold text-slate-950">{commitment.lot?.crop || commitment.supplyPool?.crop || "Trade"}</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Buyer: {commitment.buyer?.name || commitment.externalBuyerName || "External buyer"}
                  </p>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-800">{commitment.status}</span>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-4">
                <Detail label="Quantity" value={`${formatNumber(commitment.quantity)} ${commitment.unit}`} />
                <Detail label="Agreed price" value={`₹${formatNumber(commitment.agreedPrice)}`} />
                <Detail label="Deposit" value={`₹${formatNumber(commitment.depositAmount)}`} />
                <Detail label="Source" value={commitment.source?.replaceAll("_", " ") || "—"} />
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p><p className="mt-2 text-2xl font-bold text-slate-950">{value}</p></div>;
}

function Detail({ label, value }) {
  return <div><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p><p className="mt-1 text-sm font-semibold text-slate-700">{value}</p></div>;
}

function Empty({ text }) {
  return <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-sm text-slate-500">{text}</div>;
}

function ErrorBox({ message }) {
  return <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{message}</div>;
}

export default ArthiyaDeals;
