import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getFarmerCommitments,
  getCommitmentBlockchainAnchors,
  approveFarmerCommitment,
} from "../../api/farmerApi";

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const qty = (value) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(
    Number(value || 0)
  );

const date = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const title = (value) =>
  String(value || "unknown")
    .replaceAll("_", " ")
    .replace(/^./, (character) => character.toUpperCase());

const ACTIVE = new Set([
  "created",
  "pending_deposit",
  "pending_farmer_approval",
]);
const FINAL = new Set([
  "settled",
  "fulfilled",
  "cancelled",
  "defaulted",
  "reallocated",
  "spot_rerouted",
  "flash_sale",
]);

export default function FarmerCommitments() {
  const [items, setItems] = useState([]);
  const [tab, setTab] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [paymentCheck, setPaymentCheck] = useState(null);
  const [proofFor, setProofFor] = useState(null);
  const [proofs, setProofs] = useState([]);
  const [proofLoading, setProofLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getFarmerCommitments();
      setItems(Array.isArray(response?.data) ? response.data : []);
    } catch (requestError) {
      setError(requestError?.message || "Unable to load commitments.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const pendingItems = useMemo(
    () => items.filter((item) => ACTIVE.has(item.status)),
    [items]
  );
  const historyItems = useMemo(
    () => items.filter((item) => !ACTIVE.has(item.status) || FINAL.has(item.status)),
    [items]
  );

  const shownCommitments = tab === "pending" ? pendingItems : historyItems;
  const activeCount = pendingItems.length;
  const historyCount = historyItems.length;

  async function confirmPaymentAndCommit(commitment) {
    // The backend only permits farmer approval after the buyer's deposit has
    // moved the commitment into pending_farmer_approval. Never fake a payment.
    if (commitment.status !== "pending_farmer_approval") {
      setPaymentCheck({
        ...commitment,
        noticeOnly: true,
      });
      return;
    }

    setBusy(commitment._id);
    setError("");
    try {
      await approveFarmerCommitment(commitment._id);
      setPaymentCheck(null);
      await refresh();
    } catch (requestError) {
      setError(requestError?.message || "Unable to confirm this commitment.");
    } finally {
      setBusy("");
    }
  }

  async function openProof(commitment) {
    setProofFor(commitment);
    setProofs([]);
    setProofLoading(true);
    try {
      const response = await getCommitmentBlockchainAnchors(commitment._id);
      setProofs(Array.isArray(response?.data) ? response.data : []);
    } catch (requestError) {
      setProofs([]);
      setError(
        requestError?.message || "Could not retrieve blockchain proof details."
      );
    } finally {
      setProofLoading(false);
    }
  }

  return (
    <div className="space-y-7 text-slate-900">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
            Trade workspace
          </p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Commitments
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Review purchase commitments, verify the deposit stage, and keep
            track of your transaction history.
          </p>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:border-emerald-300 disabled:opacity-50"
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </header>

      {error && (
        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="All commitments" value={items.length} />
        <Stat label="Pending actions" value={activeCount} />
        <Stat label="History records" value={historyCount} />
      </div>

      <div className="flex gap-2 rounded-2xl border border-slate-200 bg-slate-100 p-1.5">
        <button
          onClick={() => setTab("pending")}
          className={`flex-1 rounded-xl px-4 py-3 text-sm font-bold transition ${
            tab === "pending"
              ? "bg-emerald-900 text-white shadow"
              : "text-slate-600 hover:bg-white"
          }`}
        >
          Pending commitments{" "}
          <span
            className={`ml-1 rounded-full px-2 py-0.5 text-xs ${
              tab === "pending" ? "bg-white/15" : "bg-white"
            }`}
          >
            {activeCount}
          </span>
        </button>
        <button
          onClick={() => setTab("history")}
          className={`flex-1 rounded-xl px-4 py-3 text-sm font-bold transition ${
            tab === "history"
              ? "bg-emerald-900 text-white shadow"
              : "text-slate-600 hover:bg-white"
          }`}
        >
          Committed history{" "}
          <span
            className={`ml-1 rounded-full px-2 py-0.5 text-xs ${
              tab === "history" ? "bg-white/15" : "bg-white"
            }`}
          >
            {historyCount}
          </span>
        </button>
      </div>

      {loading ? (
        <div className="rounded-3xl border border-slate-200 bg-white px-6 py-14 text-center text-sm text-slate-400">
          Loading your commitments…
        </div>
      ) : (
        <div className="space-y-4">
          {shownCommitments.map((commitment) => {
            const crop =
              commitment.lot?.crop ||
              commitment.supplyIntent?.crop ||
              commitment.supplyPool?.crop ||
              "Produce commitment";
            const canConfirm = commitment.status === "pending_farmer_approval";
            const total =
              Number(commitment.agreedPrice || 0) *
              Number(commitment.quantity || 0);
            const deposit = Number(
              commitment.depositAmount ??
                (total * Number(commitment.depositPercentage ?? 50)) / 100
            );

            return (
              <article
                key={`commitment-${commitment._id}`}
                className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
              >
                <div className="grid gap-5 lg:grid-cols-[1.2fr_.7fr_.8fr_.8fr]">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-bold">{crop}</h2>
                      <Status value={commitment.status} />
                      {commitment.supplyPool && (
                        <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-bold text-violet-700">
                          Aggregated deal · your share
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {commitment.buyer?.name
                        ? `Buyer: ${commitment.buyer.name}`
                        : commitment.externalBuyerName || "External buyer"}{" "}
                      · {title(commitment.source)}
                    </p>
                    <p className="mt-2 text-xs text-slate-400">
                      Created {date(commitment.createdAt)} · Window ends{" "}
                      {date(commitment.commitmentWindowEndsAt)}
                    </p>
                  </div>
                  <Detail
                    label="Your quantity"
                    value={`${qty(commitment.quantity)} ${commitment.unit || ""}`}
                  />
                  <Detail
                    label="Agreed price"
                    value={`${money(commitment.agreedPrice)} / ${commitment.unit || "unit"}`}
                  />
                  <Detail label="50% deposit" value={money(deposit)} />
                </div>

                {commitment.status === "pending_deposit" && (
                  <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    Waiting for the buyer's security deposit. You can open the
                    payment-status window to review this stage; this page does
                    not collect or independently verify money.
                  </p>
                )}
                {commitment.status === "created" && (
                  <p className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    This commitment has not reached the farmer-approval stage
                    yet.
                  </p>
                )}

                <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
                  <button
                    onClick={() => openProof(commitment)}
                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-emerald-400 hover:text-emerald-800"
                  >
                    View blockchain proof
                  </button>
                  <button
                    disabled={!!busy}
                    onClick={() => setPaymentCheck(commitment)}
                    className="rounded-xl bg-emerald-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-50"
                  >
                    {busy === commitment._id
                      ? "Confirming…"
                      : canConfirm
                        ? "Review payment & confirm commitment"
                        : "Check payment status"}
                  </button>
                  <span className="text-xs text-slate-400">
                    Total value: {money(total)}
                  </span>
                </div>
              </article>
            );
          })}

          {!shownCommitments.length && (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800">
                ✓
              </div>
              <h2 className="font-bold">
                {tab === "pending" ? "No pending commitments" : "No history yet"}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {tab === "pending"
                  ? "Buyer proposals and uncommitted allocations are not shown here. Purchase commitments will appear once created."
                  : "Completed and closed commitment records will appear here."}
              </p>
            </div>
          )}
        </div>
      )}

      {paymentCheck && (
        <Modal
          title={
            paymentCheck.status === "pending_farmer_approval"
              ? "Confirm payment & commitment"
              : "Payment status"
          }
          onClose={() => setPaymentCheck(null)}
        >
          <div className="space-y-4">
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-emerald-800">
                Commitment details
              </p>
              <p className="mt-2 text-lg font-bold text-slate-900">
                {paymentCheck.lot?.crop ||
                  paymentCheck.supplyIntent?.crop ||
                  paymentCheck.supplyPool?.crop ||
                  "Produce commitment"}
              </p>
              <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-slate-500">Quantity</p>
                  <p className="mt-1 font-semibold">
                    {qty(paymentCheck.quantity)} {paymentCheck.unit || ""}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Agreed price</p>
                  <p className="mt-1 font-semibold">
                    {money(paymentCheck.agreedPrice)} / {paymentCheck.unit || "unit"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">50% security deposit</p>
                  <p className="mt-1 font-semibold">
                    {money(
                      paymentCheck.depositAmount ??
                        (Number(paymentCheck.agreedPrice || 0) *
                          Number(paymentCheck.quantity || 0) *
                          Number(paymentCheck.depositPercentage ?? 50)) /
                          100
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Current status</p>
                  <div className="mt-1">
                    <Status value={paymentCheck.status} />
                  </div>
                </div>
              </div>
            </div>

            {paymentCheck.status === "pending_farmer_approval" ? (
              <>
                <p className="text-sm leading-6 text-slate-600">
                  Confirm only if the buyer's 50% security deposit is shown as
                  received in your transaction records. Continuing asks the
                  backend to approve this commitment; it does not initiate a
                  payment or verify a bank transfer.
                </p>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setPaymentCheck(null)}
                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={!!busy}
                    onClick={() => confirmPaymentAndCommit(paymentCheck)}
                    className="rounded-xl bg-emerald-900 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
                  >
                    {busy === paymentCheck._id
                      ? "Confirming…"
                      : "Confirm deposit received & commit"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm leading-6 text-slate-600">
                  {paymentCheck.status === "pending_deposit"
                    ? "The commitment is waiting for the buyer's deposit. This screen is only a status confirmation; it cannot mark a payment as received."
                    : "This commitment is not currently awaiting farmer approval. No payment or commitment status has been changed."}
                </p>
                <div className="flex justify-end">
                  <button
                    onClick={() => setPaymentCheck(null)}
                    className="rounded-xl bg-emerald-900 px-4 py-2.5 text-sm font-bold text-white"
                  >
                    Close
                  </button>
                </div>
              </>
            )}
          </div>
        </Modal>
      )}

      {proofFor && (
        <Modal title="Blockchain proof" onClose={() => setProofFor(null)}>
          <p className="mb-4 text-sm text-slate-500">
            Commitment reference:{" "}
            <span className="break-all font-mono">{proofFor._id}</span>
          </p>
          {proofLoading ? (
            <p className="py-6 text-center text-sm text-slate-400">
              Loading proof details…
            </p>
          ) : proofs.length ? (
            <div className="space-y-3">
              {proofs.map((proof) => (
                <div
                  key={proof._id || proof.eventId}
                  className="rounded-2xl border border-slate-200 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <b>{title(proof.eventType)}</b>
                    <Status value={proof.status} />
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    Network: {proof.network || "Not specified"} · Block:{" "}
                    {proof.blockNumber ?? "Pending"}
                  </p>
                  <p className="mt-1 break-all font-mono text-xs text-slate-600">
                    {proof.transactionHash || "No transaction hash available yet."}
                  </p>
                  {proof.transactionHash && (
                    <a
                      className="mt-3 inline-block text-sm font-bold text-emerald-800 underline"
                      href={`https://sepolia.etherscan.io/tx/${proof.transactionHash}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View on Etherscan ↗
                    </a>
                  )}
                  {proof.status === "failed" && (
                    <p className="mt-2 text-xs text-rose-600">
                      Anchor failed; no confirmed on-chain proof is available
                      for this event.
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500">
              No blockchain anchor is available for this commitment yet.
            </div>
          )}
          <div className="mt-5 flex justify-end">
            <button
              onClick={() => setProofFor(null)}
              className="rounded-xl bg-emerald-900 px-4 py-2 text-sm font-bold text-white"
            >
              Close
            </button>
          </div>
        </Modal>
      )}
    </div>
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

function Status({ value }) {
  const status = String(value || "unknown");
  const green = [
    "confirmed",
    "active",
    "settled",
    "fulfilled",
    "reserved",
    "committed",
  ].includes(status);
  const red = ["rejected", "cancelled", "defaulted", "failed"].includes(status);

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
        green
          ? "bg-emerald-50 text-emerald-800"
          : red
            ? "bg-rose-50 text-rose-700"
            : "bg-amber-50 text-amber-800"
      }`}
    >
      {title(status)}
    </span>
  );
}

function Modal({ title: heading, onClose, children }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={heading}
        className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl sm:p-6"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 className="text-xl font-bold">{heading}</h2>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-lg px-2 py-1 text-xl text-slate-400 hover:bg-slate-100"
          >
            ×
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
