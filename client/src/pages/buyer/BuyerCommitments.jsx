import { useEffect, useState } from "react";
import { cancelBuyerCommitment, getBuyerCommitments, paySecurityDeposit } from "../../api/buyerApi";

const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;
const date = (value) => value ? new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

export default function BuyerCommitments() {
  const [commitments, setCommitments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    try {
      setLoading(true);
      const response = await getBuyerCommitments();
      setCommitments(Array.isArray(response?.data) ? response.data : []);
    } catch (err) {
      setError(err.message || "Unable to load commitments.");
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function deposit(id) {
    try { setBusy(id); setError(""); const response = await paySecurityDeposit(id); setMessage(response?.message || "Deposit completed."); await load(); } catch (err) { setError(err.message || "Unable to complete deposit."); } finally { setBusy(""); }
  }

  async function cancel(id) {
    if (!window.confirm("Cancel this confirmed commitment?")) return;
    try { setBusy(id); setError(""); await cancelBuyerCommitment(id); setMessage("Commitment marked for rerouting."); await load(); } catch (err) { setError(err.message || "Unable to cancel commitment."); } finally { setBusy(""); }
  }

  return <div className="space-y-6"><header><p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">Protected trade</p><h1 className="mt-2 text-3xl font-bold text-slate-950">My commitments</h1><p className="mt-2 text-sm text-slate-500">Review winning purchases, security deposits and commitment status.</p></header>{message && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{message}</div>}{error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}<div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">{loading ? <div className="p-8 text-sm text-slate-500">Loading commitments…</div> : commitments.length === 0 ? <div className="p-10 text-center text-sm text-slate-500">No purchase commitments yet.</div> : <div className="divide-y divide-slate-100">{commitments.map((item) => <div key={item._id} className="p-5 sm:p-6"><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-base font-bold text-slate-950">{item.lot?.crop || "Purchase"}</h2><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold capitalize text-slate-600">{String(item.status).replaceAll("_", " ")}</span></div><p className="mt-2 text-sm text-slate-600">{item.quantity} {item.unit} · {money(item.agreedPrice)} / unit</p><p className="mt-1 text-xs text-slate-400">Deposit: {money(item.depositAmount)} ({item.depositPercentage || 50}%) · Window ends {date(item.commitmentWindowEndsAt)}</p></div><div className="flex flex-wrap gap-2">{item.status === "pending_deposit" && <button disabled={busy === item._id} onClick={() => deposit(item._id)} className="rounded-xl bg-emerald-900 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50">{busy === item._id ? "Processing…" : `Pay ${money(item.depositAmount)}`}</button>}{item.status === "confirmed" && <button disabled={busy === item._id} onClick={() => cancel(item._id)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 disabled:opacity-50">Cancel</button>}</div></div></div>)}</div>}</div></div>;
}
