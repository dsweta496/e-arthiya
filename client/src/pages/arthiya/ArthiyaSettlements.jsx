import { useEffect, useMemo, useState } from "react";
import {
  extractRecords,
  formatDate,
  formatNumber,
  getArthiyaPayments,
} from "../../api/arthiyaApi";

function ArthiyaSettlements() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const response = await getArthiyaPayments();
        setPayments(extractRecords(response));
      } catch (requestError) {
        setError(requestError.message || "Unable to load settlement records.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const completedValue = useMemo(
    () => payments.filter((payment) => payment.status === "completed").reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
    [payments]
  );

  return (
    <div className="space-y-7">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">Settlements</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Trade settlement records</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
          Review payment transactions associated with commitments facilitated through your Arthiya network.
        </p>
      </header>

      {error && <ErrorBox message={error} />}

      <section className="grid gap-4 sm:grid-cols-3">
        <Stat label="Transactions" value={payments.length} />
        <Stat label="Completed" value={payments.filter((payment) => payment.status === "completed").length} />
        <Stat label="Completed value" value={`₹${formatNumber(completedValue)}`} />
      </section>

      {loading ? (
        <p className="text-sm text-slate-500">Loading settlements...</p>
      ) : payments.length === 0 ? (
        <Empty text="No settlement transactions are linked to your facilitated trades yet." />
      ) : (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          {payments.map((payment) => (
            <div key={payment._id} className="grid gap-3 border-b border-slate-100 px-5 py-5 last:border-0 md:grid-cols-[1.4fr_1fr_1fr_1fr] md:items-center">
              <div>
                <p className="font-bold text-slate-950">{payment.type?.replaceAll("_", " ") || "Payment"}</p>
                <p className="mt-1 text-xs text-slate-500">{payment.transactionReference || "No reference"}</p>
              </div>
              <Detail label="Amount" value={`₹${formatNumber(payment.amount)}`} />
              <Detail label="Status" value={payment.status} />
              <Detail label="Date" value={formatDate(payment.paidAt || payment.createdAt)} />
            </div>
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

export default ArthiyaSettlements;
