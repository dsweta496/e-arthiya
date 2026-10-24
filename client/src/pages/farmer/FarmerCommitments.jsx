import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getFarmerCommitments,
  getCommitmentBlockchainAnchors,
  getAuctionBlockchainProofs,
  approveFarmerCommitment,
  getFarmerLots,
  getFarmerSupplyIntents,
  getFarmerAuctions,
  getFarmerAllocations,
  createCommitmentFromReservedSupply,
} from "../../api/farmerApi";

const arr = (r) => Array.isArray(r?.data) ? r.data : Array.isArray(r?.allocations) ? r.allocations : Array.isArray(r) ? r : [];
const idOf = (v) => String(v?._id || v || "");
const money = (v) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(Number(v || 0));
const qty = (v) => new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(Number(v || 0));
const date = (v) => v ? new Date(v).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const title = (v) => String(v || "unknown").replaceAll("_", " ").replace(/^./, (c) => c.toUpperCase());
const ACTIVE = new Set(["created", "pending_deposit", "pending_farmer_approval"]);
const FINAL = new Set(["confirmed", "active", "fulfilled", "settled", "cancelled", "defaulted", "reallocated", "spot_rerouted", "flash_sale"]);

export default function FarmerCommitments({ user = null }) {
  const farmerId = user?.id || user?._id || user?.user?._id;
  const [items, setItems] = useState([]);
  const [reservedSources, setReservedSources] = useState([]);
  const [tab, setTab] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState("");
  const [receiptDialog, setReceiptDialog] = useState(null);
  const [receiptPrice, setReceiptPrice] = useState("");
  const [externalBuyerName, setExternalBuyerName] = useState("");
  const [proofFor, setProofFor] = useState(null);
  const [proofs, setProofs] = useState([]);
  const [proofLoading, setProofLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [commitRes, lotsRes, intentsRes, auctionsRes, allocationsRes] = await Promise.all([
        getFarmerCommitments(),
        getFarmerLots(farmerId).catch(() => []),
        getFarmerSupplyIntents(farmerId).catch(() => []),
        getFarmerAuctions(farmerId).catch(() => []),
        getFarmerAllocations(farmerId).catch(() => []),
      ]);
      const commitments = arr(commitRes);
      const lots = arr(lotsRes);
      const intents = arr(intentsRes);
      const auctions = arr(auctionsRes);
      const allocations = arr(allocationsRes);
      setItems(commitments);

      const committedLotIds = new Set(commitments.map((c) => idOf(c.lot)).filter(Boolean));
      const committedIntentIds = new Set(commitments.map((c) => idOf(c.supplyIntent)).filter(Boolean));
      const reservedLots = lots.filter((x) => x.status === "reserved" && !committedLotIds.has(idOf(x._id))).map((x) => ({ ...x, sourceType: "lot", sourceId: x._id, quantity: x.quantity, sourceLabel: "Reserved spot supply" }));
      const reservedIntents = intents.filter((x) => x.status === "reserved" && !committedIntentIds.has(idOf(x._id))).map((x) => ({ ...x, sourceType: "supply_intent", sourceId: x._id, quantity: x.expectedQuantity, sourceLabel: "Reserved future intent" }));
      const allReserved = [...reservedLots, ...reservedIntents].map((source) => {
        const auction = auctions.find((a) => idOf(a.lot) === idOf(source._id) && ["closed_platform_winner", "closed_external_offer"].includes(a.status));
        const allocation = allocations.find((a) => idOf(a.sourceId) === idOf(source._id) && a.sourceType === source.sourceType && a.status === "reserved");
        let suggestedPrice = Number(source.expectedPrice || 0);
        let auctionId = "";
        if (auction) {
          auctionId = auction._id;
          suggestedPrice = Number(auction.status === "closed_external_offer" ? auction.selectedExternalOffer?.offeredAmount : auction.highestBid?.amount || auction.currentHighestBid || suggestedPrice);
        }
        return { ...source, auctionId, auction, allocation, suggestedPrice };
      });
      setReservedSources(allReserved);
    } catch (e) {
      setError(e?.message || "Unable to load commitments and reserved supply.");
    } finally { setLoading(false); }
  }, [farmerId]);

  useEffect(() => { refresh(); }, [refresh]);

  const pendingItems = useMemo(() => items.filter((x) => ACTIVE.has(x.status)), [items]);
  const historyItems = useMemo(() => items.filter((x) => !ACTIVE.has(x.status) || FINAL.has(x.status)), [items]);

  // Reserved lots/intents without a commitment are displayed inline in Pending commitments.
  const pendingDisplayItems = useMemo(
    () => [
      ...pendingItems.map((item) => ({ ...item, _displayType: "commitment" })),
      ...reservedSources.map((source) => ({ ...source, _displayType: "reserved_source" })),
    ],
    [pendingItems, reservedSources]
  );
  const shownCommitments = tab === "pending" ? pendingDisplayItems : historyItems;

  function openReceipt(source) {
    setReceiptDialog(source);
    setReceiptPrice(String(source.suggestedPrice ?? source.agreedPrice ?? ""));
    setExternalBuyerName(source.auction?.selectedExternalOffer?.buyerName || source.externalBuyerName || source.buyer?.name || "");
    setError(""); setNotice("");
  }

  async function recordReceivedAndCreate() {
    if (!receiptDialog) return;

    // Existing commitment records must never create a duplicate commitment.
    // They can only be farmer-approved once the backend says the deposit was received.
    if (receiptDialog._displayType === "commitment") {
      if (receiptDialog.status !== "pending_farmer_approval") {
        setError(
          receiptDialog.status === "pending_deposit"
            ? "The buyer's deposit has not yet been recorded by the backend. This page cannot mark a payment as received or create a duplicate commitment."
            : "This commitment already exists and is not awaiting farmer approval. No duplicate commitment was created."
        );
        return;
      }
      setBusy(idOf(receiptDialog)); setError(""); setNotice("");
      try {
        const response = await approveFarmerCommitment(receiptDialog._id);
        setNotice(response?.message || "Payment stage confirmed and commitment approved.");
        setReceiptDialog(null);
        await refresh();
      } catch (e) { setError(e?.message || "Unable to approve this commitment."); }
      finally { setBusy(""); }
      return;
    }

    const price = Number(receiptPrice);
    if (!Number.isFinite(price) || price <= 0) { setError("Enter the agreed price per unit before creating the commitment."); return; }
    if (!receiptDialog.auction && !receiptDialog.allocation && !externalBuyerName.trim()) {
      setError("Enter the buyer name for this reserved supply."); return;
    }
    setBusy(idOf(receiptDialog._id)); setError(""); setNotice("");
    try {
      const response = await createCommitmentFromReservedSupply({
        sourceType: receiptDialog.sourceType,
        sourceId: receiptDialog.sourceId,
        auctionId: receiptDialog.auctionId || undefined,
        agreedPrice: price,
        externalBuyerName: externalBuyerName.trim() || undefined,
        paymentReceived: true,
      });
      setNotice(response?.message || "Commitment created from the reserved supply record.");
      setReceiptDialog(null);
      await refresh();
    } catch (e) { setError(e?.message || "Could not create the commitment."); }
    finally { setBusy(""); }
  }

  async function openProof(record, proofType = "commitment") {
    const selected = { ...record, _proofType: proofType };
    setProofFor(selected); setProofs([]); setProofLoading(true); setError("");
    try {
      const response = proofType === "auction"
        ? await getAuctionBlockchainProofs(record.auctionId || record._id)
        : await getCommitmentBlockchainAnchors(record._id);
      setProofs(arr(response));
    } catch (e) {
      setProofs([]);
      setError(e?.message || `Could not retrieve ${proofType} blockchain proof.`);
    } finally { setProofLoading(false); }
  }

  return <div className="space-y-7 text-slate-900">
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Trade workspace</p><h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Commitments</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Reserved supply, payment receipt declaration and your purchase commitment history.</p></div>
      <button onClick={refresh} disabled={loading} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold shadow-sm disabled:opacity-50">{loading ? "Refreshing…" : "Refresh"}</button>
    </header>
    {error && <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}<button className="ml-3 font-bold underline" onClick={() => setError("")}>Dismiss</button></div>}
    {notice && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}<button className="ml-3 font-bold underline" onClick={() => setNotice("")}>Dismiss</button></div>}
    <div className="grid gap-4 sm:grid-cols-3"><Stat label="All commitments & reserved supply" value={items.length + reservedSources.length}/><Stat label="Pending commitments" value={pendingDisplayItems.length}/><Stat label="History records" value={historyItems.length}/></div>

    <section className="space-y-4"><h2 className="text-xl font-bold">Commitment records</h2><div className="flex gap-2 rounded-2xl border border-slate-200 bg-slate-100 p-1.5"><button onClick={() => setTab("pending")} className={`flex-1 rounded-xl px-4 py-3 text-sm font-bold ${tab === "pending" ? "bg-emerald-900 text-white shadow" : "text-slate-600 hover:bg-white"}`}>Pending commitments <span className="ml-1 rounded-full bg-white/15 px-2 py-0.5 text-xs">{pendingDisplayItems.length}</span></button><button onClick={() => setTab("history")} className={`flex-1 rounded-xl px-4 py-3 text-sm font-bold ${tab === "history" ? "bg-emerald-900 text-white shadow" : "text-slate-600 hover:bg-white"}`}>Committed history <span className="ml-1 rounded-full bg-white px-2 py-0.5 text-xs text-slate-700">{historyItems.length}</span></button></div>
      {!loading && shownCommitments.length === 0 ? <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center"><p className="font-bold">{tab === "pending" ? "No pending commitments" : "No commitment history yet"}</p><p className="mt-1 text-sm text-slate-500">Reserved supply, accepted proposals and existing pending commitments appear here. Unaccepted proposals are excluded.</p></div> : <div className="space-y-4">{shownCommitments.map((c) => {
        if (c._displayType === "reserved_source") {
          const reservedQty = Number(c.allocation?.allocatedQuantity ?? c.quantity ?? 0);
          const total = Number(c.suggestedPrice || 0) * reservedQty;
          const deposit = total * 0.5;
          return (
            <article key={`reserved-${c.sourceType}-${c._id}`} className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
              <div className="grid gap-5 lg:grid-cols-[1.2fr_.7fr_.8fr_.8fr]">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-bold">{c.crop || "Produce"}</h3>
                    <Pill tone="green">Reserved</Pill>
                    <Pill>{c.sourceLabel}</Pill>
                    {c.auction && <Pill tone="violet">Closed auction</Pill>}
                    {c.allocation && <Pill tone="violet">Accepted proposal</Pill>}
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{c.variety || "Standard variety"} · {c.location?.district || c.location?.village || c.location?.state || "Location not set"}</p>
                  <p className="mt-2 text-xs text-slate-400">
                    {c.auction ? `Auction closed ${date(c.auction.updatedAt || c.auction.endTime)}` : "Reserved supply awaiting commitment"}
                  </p>
                </div>
                <Detail label="Reserved quantity · your share" value={`${qty(reservedQty)} ${c.unit || "quintal"}`} />
                <Detail label="Agreed / suggested price" value={c.suggestedPrice ? `${money(c.suggestedPrice)} / ${c.unit || "unit"}` : "Set in dialog"} />
                <Detail label="50% deposit" value={c.suggestedPrice ? money(deposit) : "Calculated after price entry"} />
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
                {c.auctionId && <button onClick={() => openProof(c, "auction")} className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-900 hover:border-emerald-400">
                  View auction blockchain proof
                </button>}
                <button onClick={() => openReceipt(c)} className="rounded-xl bg-emerald-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-800">
                  Validate payment received
                </button>
                <span className="text-xs text-slate-400">Total value: {c.suggestedPrice ? money(total) : "Set price to calculate"}</span>
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-400">The button opens the payment-received declaration and commitment-creation dialog.</p>
            </article>
          );
        }
        const crop = c.lot?.crop || c.supplyIntent?.crop || c.supplyPool?.crop || "Produce commitment"; const total = Number(c.agreedPrice || 0) * Number(c.quantity || 0); const deposit = Number(c.depositAmount ?? total * Number(c.depositPercentage ?? 50) / 100); return <article key={c._id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="grid gap-5 lg:grid-cols-[1.2fr_.7fr_.8fr_.8fr]"><div><div className="flex flex-wrap items-center gap-2"><h3 className="text-lg font-bold">{crop}</h3><Pill tone={c.status === "confirmed" || c.status === "settled" ? "green" : "amber"}>{title(c.status)}</Pill>{c.supplyPool && <Pill tone="violet">Aggregated deal · your share</Pill>}</div><p className="mt-1 text-xs text-slate-500">{c.buyer?.name || c.externalBuyerName || "Buyer not specified"} · {title(c.source)}</p><p className="mt-2 text-xs text-slate-400">Created {date(c.createdAt)} · Window ends {date(c.commitmentWindowEndsAt)}</p></div><Detail label="Your quantity" value={`${qty(c.quantity)} ${c.unit || ""}`}/><Detail label="Agreed price" value={`${money(c.agreedPrice)} / ${c.unit || "unit"}`}/><Detail label="50% deposit" value={money(deposit)}/></div><div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4"><button onClick={() => openProof(c)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold hover:border-emerald-400">View blockchain proof</button>{ACTIVE.has(c.status) && <button disabled={!!busy} onClick={() => openReceipt({ ...c, _displayType: "commitment" })} className="rounded-xl bg-emerald-900 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">{busy === idOf(c) ? "Processing…" : c.status === "pending_farmer_approval" ? "Payment received · confirm commitment" : "Validate payment received"}</button>}<span className="text-xs text-slate-400">Total value: {money(total)}</span></div></article>; })}</div>}
    </section>

    {receiptDialog && <Modal title={receiptDialog._displayType === "commitment" ? "Validate payment received" : "Confirm payment received & create commitment"} onClose={() => setReceiptDialog(null)}><div className="space-y-4"><div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4"><div className="flex flex-wrap items-center gap-2"><h3 className="text-lg font-bold">{receiptDialog.lot?.crop || receiptDialog.supplyIntent?.crop || receiptDialog.supplyPool?.crop || receiptDialog.crop || "Produce"}</h3><Pill tone="green">{receiptDialog._displayType === "commitment" ? title(receiptDialog.status) : "Reserved"}</Pill></div><p className="mt-1 text-sm text-slate-600">{receiptDialog.sourceLabel || receiptDialog.source || "Reserved supply"} · {qty(receiptDialog.allocation?.allocatedQuantity ?? receiptDialog.quantity)} {receiptDialog.unit || "quintal"}</p>{receiptDialog.auction && <p className="mt-1 text-xs text-slate-500">Auction closed: {title(receiptDialog.auction.status)}</p>}</div>{receiptDialog._displayType !== "commitment" ? <><label className="block text-sm font-semibold text-slate-700">Agreed price per {receiptDialog.unit || "unit"} (₹)<input type="number" min="0.01" step="0.01" value={receiptPrice} onChange={(e) => setReceiptPrice(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-3 outline-none focus:border-emerald-500" placeholder="Enter agreed price"/></label>{!receiptDialog.auction && !receiptDialog.allocation && <label className="block text-sm font-semibold text-slate-700">Buyer name<input value={externalBuyerName} onChange={(e) => setExternalBuyerName(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-3 outline-none focus:border-emerald-500" placeholder="Buyer / trader name"/></label>}</> : <p className="text-sm text-slate-600">Existing commitment: {money(receiptDialog.agreedPrice)} per {receiptDialog.unit || "unit"}. Total value: {money(Number(receiptDialog.agreedPrice || 0) * Number(receiptDialog.quantity || 0))}. Required 50% deposit: {money(receiptDialog.depositAmount ?? Number(receiptDialog.agreedPrice || 0) * Number(receiptDialog.quantity || 0) * .5)}.</p>}<div className="rounded-xl bg-amber-50 p-3 text-sm leading-6 text-amber-900"><b>Important:</b> this is a manual MVP declaration, not a payment gateway or bank verification. For an existing commitment, approval is allowed only after the backend has moved it to <code>pending_farmer_approval</code>. The page will not create a duplicate commitment.</div>{receiptDialog._displayType !== "commitment" && <p className="text-sm text-slate-600">Total: <b>{money(Number(receiptPrice || 0) * Number((receiptDialog.allocation?.allocatedQuantity ?? receiptDialog.quantity) || 0))}</b> · 50% deposit: <b>{money(Number(receiptPrice || 0) * Number((receiptDialog.allocation?.allocatedQuantity ?? receiptDialog.quantity) || 0) * .5)}</b></p>}<div className="flex justify-end gap-2"><button onClick={() => setReceiptDialog(null)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold">Cancel</button><button disabled={!!busy || (receiptDialog._displayType === "commitment" && receiptDialog.status !== "pending_farmer_approval")} onClick={recordReceivedAndCreate} className="rounded-xl bg-emerald-900 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">{busy ? "Processing…" : receiptDialog._displayType === "commitment" ? "Payment received · confirm commitment" : "Payment received — create commitment"}</button></div></div></Modal>}
    {proofFor && <Modal title={proofFor._proofType === "auction" ? "Auction blockchain anchor details" : "Commitment blockchain anchor details"} onClose={() => setProofFor(null)}><p className="mb-4 break-all text-xs text-slate-500">{proofFor._proofType === "auction" ? "Auction ID" : "Commitment ID"}: {proofFor._proofType === "auction" ? (proofFor.auctionId || proofFor._id) : proofFor._id}</p>{proofFor._proofType === "auction" && <p className="mb-4 text-sm text-slate-600">This proof belongs to the closed auction outcome. It is separate from any purchase commitment created from the auction.</p>}{proofLoading ? <p className="py-5 text-sm text-slate-400">Loading anchor details…</p> : proofs.length ? <div className="space-y-3">{proofs.map((p, i) => <div key={p._id || p.eventId || i} className="rounded-xl border border-slate-200 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><b>{title(p.eventType)}</b><Pill tone={p.status === "anchored" ? "green" : p.status === "failed" ? "amber" : "slate"}>{title(p.status || "recorded")}</Pill></div><p className="mt-1 text-xs text-slate-500">Network: {p.network || "Sepolia testnet"} · Block: {p.blockNumber ?? "Pending"}</p><p className="mt-1 break-all font-mono text-xs">{p.transactionHash || "Transaction hash not available yet"}</p>{p.transactionHash && <a className="mt-3 inline-block break-all text-sm font-semibold text-emerald-800 underline" href={`https://sepolia.etherscan.io/tx/${p.transactionHash}`} target="_blank" rel="noreferrer">View transaction on Etherscan ↗</a>}{p.status === "failed" && <p className="mt-2 text-xs text-rose-600">The anchor failed. No confirmed on-chain proof is available for this event.</p>}</div>)}</div> : <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">{proofFor._proofType === "auction" ? "No blockchain anchor record was returned for this auction yet. The auction may still have a pending/failed anchor, or the lookup may not include the expected record." : "No blockchain anchor record was returned for this commitment yet. The backend commitment-creation path should be checked to confirm it creates and exposes the anchor."}</p>}<div className="mt-5 flex justify-end"><button onClick={() => setProofFor(null)} className="rounded-xl bg-emerald-900 px-4 py-2 text-sm font-bold text-white">Close</button></div></Modal>}
  </div>;
}

function Stat({ label, value }) { return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-2 text-2xl font-bold">{value}</p></div>; }
function Detail({ label, value }) { return <div><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 text-sm font-semibold text-slate-700">{value}</p></div>; }
function Pill({ children, tone = "slate" }) { const styles = { green: "bg-emerald-50 text-emerald-800", amber: "bg-amber-50 text-amber-800", violet: "bg-violet-50 text-violet-700", slate: "bg-slate-100 text-slate-600" }; return <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${styles[tone] || styles.slate}`}>{children}</span>; }
function Modal({ title: heading, onClose, children }) { return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}><section role="dialog" aria-modal="true" aria-label={heading} className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl sm:p-6"><div className="mb-4 flex items-start justify-between gap-3"><h2 className="text-xl font-bold">{heading}</h2><button onClick={onClose} aria-label="Close dialog" className="rounded-lg px-2 py-1 text-xl text-slate-400 hover:bg-slate-100">×</button></div>{children}</section></div>; }
