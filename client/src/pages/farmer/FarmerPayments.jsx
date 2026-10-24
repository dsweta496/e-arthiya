
import { useCallback, useEffect, useState } from "react";
import {
  getFarmerPayments,
  getFarmerCommitments,
  completeFarmerPaymentReceived,
} from "../../api/farmerApi";

const money = (v) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(v || 0));

const date = (v) =>
  v
    ? new Date(v).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "—";

export default function FarmerPayments() {
  const [tab, setTab] = useState("pending");
  const [payments, setPayments] = useState([]);
  const [commitments, setCommitments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [paymentResponse, commitmentResponse] = await Promise.all([
        getFarmerPayments(),
        getFarmerCommitments(),
      ]);

      setPayments(
        Array.isArray(paymentResponse?.data) ? paymentResponse.data : []
      );

      setCommitments(
        Array.isArray(commitmentResponse?.data)
          ? commitmentResponse.data
          : []
      );
    } catch (e) {
      setError(e.message || "Unable to load payment information.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const fulfilledPayments = payments.filter(
    (p) =>
      p.type === "settlement" &&
      p.status === "completed" &&
      p.commitment?.status === "fulfilled"
  );

  const fulfilledCommitmentIds = new Set(
    fulfilledPayments.map((p) =>
      String(p.commitment?._id || p.commitment)
    )
  );

  const pending = commitments.filter(
    (c) =>
      ["confirmed", "active"].includes(c.status) &&
      c.lot &&
      c.lot.status === "committed" &&
      !fulfilledCommitmentIds.has(String(c._id))
  );

  const complete = async (commitment) => {
    const crop = commitment.lot?.crop || "this produce";
    const accepted = window.confirm(
      `Confirm that payment has been received for ${crop}?\n\n` +
      "This creates a demo payment log and marks the produce as fulfilled. " +
      "It does not transfer or verify real money."
    );

    if (!accepted) return;

    setBusy(commitment._id);
    setError("");
    setNotice("");

    try {
      await completeFarmerPaymentReceived(commitment._id);
      setNotice(`${crop}: payment receipt logged and produce fulfilled.`);
      setTab("fulfilled");
      await load();
    } catch (e) {
      setError(e.message || "Unable to complete payment receipt.");
    } finally {
      setBusy("");
    }
  };

  const completedValue = fulfilledPayments.reduce(
    (sum, p) => sum + Number(p.amount || 0),
    0
  );

  return (
    <div className="space-y-7">
      <header>
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">
          Trade
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
          Payments
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Track committed produce, confirm payment receipt, and view the
          fulfilment log. Payment confirmations are manual demo records.
        </p>
      </header>

      {error && (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {notice && (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {notice}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Pending fulfillment" value={pending.length} />
        <Stat label="Payment logs" value={fulfilledPayments.length} />
        <Stat label="Fulfilled value" value={money(completedValue)} />
      </div>

      <div className="flex flex-wrap gap-2 border-b border-slate-200">
        <Tab
          active={tab === "pending"}
          onClick={() => setTab("pending")}
        >
          Pending Fulfillment ({pending.length})
        </Tab>
        <Tab
          active={tab === "fulfilled"}
          onClick={() => setTab("fulfilled")}
        >
          Fulfilled ({fulfilledPayments.length})
        </Tab>
      </div>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="px-6 py-12 text-center text-sm text-slate-400">
            Loading payments…
          </div>
        ) : tab === "pending" ? (
          pending.length === 0 ? (
            <Empty>
              No committed crops are waiting for payment confirmation.
            </Empty>
          ) : (
            <div className="divide-y divide-slate-100">
              {pending.map((c) => (
                <article
                  key={c._id}
                  className="grid gap-4 p-5 md:grid-cols-[1fr_.7fr_.8fr_auto] md:items-center"
                >
                  <div>
                    <h2 className="font-bold text-slate-900">
                      {c.lot?.crop || "Produce"}
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">
                      {c.lot?.variety || "Produce lot"} ·{" "}
                      {c.quantity} {c.unit}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Commitment created {date(c.createdAt)}
                    </p>
                  </div>

                  <Detail
                    label="Agreed price"
                    value={`${money(c.agreedPrice)} / ${c.unit}`}
                  />

                  <Detail
                    label="Total value"
                    value={money(
                      Number(c.agreedPrice || 0) *
                        Number(c.quantity || 0)
                    )}
                  />

                  <button
                    onClick={() => complete(c)}
                    disabled={busy === c._id}
                    className="rounded-xl bg-emerald-900 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {busy === c._id
                      ? "Recording…"
                      : "Complete Payment Received"}
                  </button>
                </article>
              ))}
            </div>
          )
        ) : fulfilledPayments.length === 0 ? (
          <Empty>
            No completed payment receipts have been logged yet.
          </Empty>
        ) : (
          <div className="divide-y divide-slate-100">
            {fulfilledPayments.map((p) => (
              <article
                key={p._id}
                className="grid gap-4 p-5 md:grid-cols-[1fr_.8fr_.8fr_.8fr] md:items-center"
              >
                <div>
                  <h2 className="font-bold text-slate-900">
                    {p.commitment?.lot?.crop || "Produce"}
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    {p.transactionReference || "Demo receipt"}
                  </p>
                </div>

                <Detail
                  label="Payment amount"
                  value={money(p.amount)}
                />

                <Detail
                  label="Status"
                  value="Fulfilled · Demo receipt"
                />

                <Detail
                  label="Recorded at"
                  value={date(p.paidAt || p.createdAt)}
                />
              </article>
            ))}
          </div>
        )}
      </section>

      <p className="text-xs leading-5 text-slate-400">
        Demo only: this confirmation records the farmer's declaration. It
        does not independently verify a transfer or move money.
      </p>
    </div>
  );
}

function Tab({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`-mb-px border-b-2 px-4 py-3 text-sm font-bold ${
        active
          ? "border-emerald-800 text-emerald-900"
          : "border-transparent text-slate-500 hover:text-slate-800"
      }`}
    >
      {children}
    </button>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-700">{value}</p>
    </div>
  );
}

function Empty({ children }) {
  return (
    <div className="px-6 py-12 text-center text-sm text-slate-400">
      {children}
    </div>
  );
}
