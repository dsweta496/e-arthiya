import { useEffect, useState } from "react";
import { getBuyerPayments } from "../../api/buyerApi";

const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

export default function BuyerPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getBuyerPayments()
      .then((response) => setPayments(Array.isArray(response?.data) ? response.data : []))
      .catch((err) => setError(err.message || "Unable to load payments."))
      .finally(() => setLoading(false));
  }, []);

  return <div className="space-y-6"><header><p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">Trade finance</p><h1 className="mt-2 text-3xl font-bold text-slate-950">Payments</h1><p className="mt-2 text-sm text-slate-500">Track your security deposits and other buyer-side transactions.</p></header>{error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}<div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">{loading ? <div className="p-8 text-sm text-slate-500">Loading payments…</div> : payments.length === 0 ? <div className="p-10 text-center text-sm text-slate-500">No payment transactions yet.</div> : <div className="divide-y divide-slate-100">{payments.map((payment) => <div key={payment._id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-bold capitalize text-slate-900">{String(payment.type).replaceAll("_", " ")}</p><p className="mt-1 text-xs text-slate-500">{payment.transactionReference || "No reference"} · {new Date(payment.createdAt).toLocaleString("en-IN")}</p></div><div className="text-left sm:text-right"><p className="text-sm font-bold text-slate-900">{money(payment.amount)}</p><span className="mt-1 inline-block rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold capitalize text-emerald-800">{payment.status}</span></div></div>)}</div>}</div></div>;
}
