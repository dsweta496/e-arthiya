import { useEffect, useMemo, useState } from "react";
import {
  closeFarmerAuction,
  createExternalOffer,
  createFarmerAuction,
  getAuctionBlockchainProofs,
  getAuctionBids,
  getAuctionExternalOffers,
  getFarmerAllocations,
  getFarmerAuctions,
  getFarmerLots,
  selectExternalOffer,
  updateFarmerAuction,
} from "../../api/farmerApi";

const formatNumber = (value) => new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(Number(value || 0));
const formatDateTime = (value) => value ? new Date(value).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";
const getRecords = (response) => Array.isArray(response?.data) ? response.data : [];
const idOf = (value) => String(value?._id || value?.id || value || "");
const activeAllocationStatuses = new Set(["proposed", "reserved", "committed", "fulfilled"]);

function FarmerAuctions({ user = null }) {
  const farmerId = user?.id || user?._id;
  const [lots, setLots] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [busy, setBusy] = useState("");
  const [offers, setOffers] = useState({});
  const [offerForm, setOfferForm] = useState({});
  const [detailAuction, setDetailAuction] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [bids, setBids] = useState([]);
  const [proofs, setProofs] = useState([]);
  const [proofExplorer, setProofExplorer] = useState("https://sepolia.etherscan.io/tx/");
  const [editForm, setEditForm] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [form, setForm] = useState({ lot: "", startTime: "", endTime: "", startingPrice: "" });

  const load = async () => {
    if (!farmerId) return;
    setLoading(true);
    setError("");
    try {
      const [lotsResponse, auctionsResponse, allocationResponse] = await Promise.all([
        getFarmerLots(farmerId),
        getFarmerAuctions(farmerId),
        getFarmerAllocations(farmerId),
      ]);
      setLots(getRecords(lotsResponse));
      setAuctions(getRecords(auctionsResponse));
      setAllocations(getRecords(allocationResponse));
    } catch (requestError) {
      setError(requestError.message || "Unable to load auctions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [farmerId]);

  const auctionableLots = useMemo(() => {
    return lots.filter((lot) => {
      if (lot.status !== "available") return false;
      const alreadyAuctioned = auctions.some((auction) => idOf(auction.lot) === idOf(lot));
      const hasAllocation = allocations.some((allocation) =>
        allocation.sourceType === "lot" && idOf(allocation.sourceId) === idOf(lot) && activeAllocationStatuses.has(String(allocation.status || "").toLowerCase())
      );
      return !alreadyAuctioned && !hasAllocation;
    });
  }, [lots, auctions, allocations]);

  const handleCreate = async (event) => {
    event.preventDefault();
    setBusy("create"); setError(""); setMessage("");
    try {
      await createFarmerAuction({ lot: form.lot, startTime: new Date(form.startTime).toISOString(), endTime: new Date(form.endTime).toISOString(), startingPrice: Number(form.startingPrice) });
      setMessage("Auction created. Blockchain proof may take a little longer to confirm.");
      setForm({ lot: "", startTime: "", endTime: "", startingPrice: "" });
      setShowCreate(false);
      await load();
    } catch (requestError) {
      setError(requestError.message || "Could not create auction.");
    } finally { setBusy(""); }
  };

  const handleClose = async (auction, result) => {
    setBusy(auction._id); setError(""); setMessage("");
    try {
      await closeFarmerAuction(auction._id, result);
      setMessage("Auction closed successfully. Its blockchain proof will show the current anchor status.");
      await load();
      if (detailAuction?._id === auction._id) await openDetails(auction);
    } catch (requestError) { setError(requestError.message || "Could not close auction."); }
    finally { setBusy(""); }
  };

  const loadOffers = async (auctionId) => {
    try {
      const response = await getAuctionExternalOffers(auctionId);
      setOffers((current) => ({ ...current, [auctionId]: getRecords(response) }));
    } catch (requestError) { setError(requestError.message || "Could not load offers."); }
  };

  const openDetails = async (auction) => {
    setDetailAuction(auction); setDetailLoading(true); setError(""); setBids([]); setProofs([]);
    try {
      const [bidResponse, offerResponse, proofResponse] = await Promise.all([
        getAuctionBids(auction._id),
        getAuctionExternalOffers(auction._id),
        getAuctionBlockchainProofs(auction._id),
      ]);
      setBids(getRecords(bidResponse));
      const loadedOffers = getRecords(offerResponse);
      setOffers((current) => ({ ...current, [auction._id]: loadedOffers }));
      setProofs(getRecords(proofResponse));
      if (proofResponse?.explorerBaseUrl) setProofExplorer(proofResponse.explorerBaseUrl);
    } catch (requestError) {
      setError(requestError.message || "Could not load auction details.");
    } finally { setDetailLoading(false); }
  };

  const updateOfferForm = (auctionId, field, value) => setOfferForm((current) => ({ ...current, [auctionId]: { ...(current[auctionId] || {}), [field]: value } }));

  const handleSubmitOffer = async (auction) => {
    const currentOffer = offerForm[auction._id] || {};
    if (!currentOffer.name || !currentOffer.amount) { setError("Buyer name and offer amount are required."); return; }
    setBusy(`offer-${auction._id}`); setError("");
    try {
      await createExternalOffer(auction._id, { offeredAmount: Number(currentOffer.amount), buyerName: currentOffer.name, buyerPhone: currentOffer.phone || "", submittedByFarmer: farmerId });
      setMessage("External offer recorded. Blockchain proof status is available in auction details.");
      setOfferForm((current) => ({ ...current, [auction._id]: {} }));
      await loadOffers(auction._id);
    } catch (requestError) { setError(requestError.message || "Could not record offer."); }
    finally { setBusy(""); }
  };

  const handleSelectOffer = async (auction, offer) => {
    setBusy(`select-${auction._id}`); setError("");
    try {
      await selectExternalOffer(auction._id, offer._id);
      setMessage("External offer selected.");
      await loadOffers(auction._id); await load();
    } catch (requestError) { setError(requestError.message || "Could not select offer."); }
    finally { setBusy(""); }
  };

  const canEditAuction = (auction) => auction.status === "open" && !bids.length && !(offers[auction._id] || []).length;
  const beginEdit = (auction) => setEditForm({ auctionId: auction._id, startTime: toDateTimeLocal(auction.startTime), endTime: toDateTimeLocal(auction.endTime), startingPrice: String(auction.startingPrice ?? "") });
  const saveEdit = async (event) => {
    event.preventDefault();
    if (!editForm) return;
    setSavingEdit(true); setError(""); setMessage("");
    try {
      await updateFarmerAuction(editForm.auctionId, { startTime: new Date(editForm.startTime).toISOString(), endTime: new Date(editForm.endTime).toISOString(), startingPrice: Number(editForm.startingPrice) });
      setMessage("Auction schedule updated. Check the blockchain proof for its anchor status.");
      setEditForm(null); await load();
      const current = auctions.find((item) => item._id === editForm.auctionId);
      if (current) await openDetails({ ...current, startTime: editForm.startTime, endTime: editForm.endTime, startingPrice: Number(editForm.startingPrice) });
    } catch (requestError) { setError(requestError.message || "Could not update auction schedule."); }
    finally { setSavingEdit(false); }
  };

  return <div className="space-y-7">
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">Farmer workspace</p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Auctions</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Put eligible produce into competitive bidding, compare external offers, and inspect auction history and blockchain proofs.</p>
      </div>
      <button type="button" onClick={() => setShowCreate((current) => !current)} className="rounded-xl bg-emerald-900 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-950">+ Create auction</button>
    </header>

    {error && <Alert>{error}</Alert>}
    {message && <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</div>}

    {showCreate && <form onSubmit={handleCreate} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-bold text-slate-950">New auction</h2><p className="mt-1 text-xs text-slate-500">Lots with pending proposals or active allocations are excluded to prevent double-selling.</p></div><button type="button" onClick={() => setShowCreate(false)} className="text-sm font-semibold text-slate-500">Cancel</button></div>
      {auctionableLots.length === 0 ? <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">No eligible lots. A lot must be available, not already auctioned, and have no proposed or active allocations.</p> : <>
        <div className="mt-4 grid gap-4 md:grid-cols-4">
          <Select label="Lot" value={form.lot} onChange={(value) => setForm((current) => ({ ...current, lot: value }))} options={auctionableLots.map((lot) => ({ value: lot._id, label: `${lot.crop} · ${formatNumber(lot.quantity)} ${lot.unit}` }))}/>
          <Input label="Starts" type="datetime-local" value={form.startTime} onChange={(value) => setForm((current) => ({ ...current, startTime: value }))}/>
          <Input label="Ends" type="datetime-local" value={form.endTime} onChange={(value) => setForm((current) => ({ ...current, endTime: value }))}/>
          <Input label="Starting price / unit" type="number" min="0" step="0.01" value={form.startingPrice} onChange={(value) => setForm((current) => ({ ...current, startingPrice: value }))}/>
        </div>
        <button type="submit" disabled={busy === "create" || !form.lot || !form.startTime || !form.endTime || form.startingPrice === ""} className="mt-5 rounded-xl bg-emerald-900 px-5 py-2.5 text-xs font-bold text-white disabled:opacity-50">{busy === "create" ? "Creating…" : "Create auction"}</button>
      </>}
    </form>}

    <section className="space-y-4">
      {loading ? <Loading/> : auctions.length === 0 ? <Empty/> : auctions.map((auction) => <AuctionCard key={auction._id} auction={auction} busy={busy === auction._id} offers={offers[auction._id]} onLoadOffers={loadOffers} offerForm={offerForm[auction._id] || {}} onOfferChange={(field, value) => updateOfferForm(auction._id, field, value)} onSubmitOffer={handleSubmitOffer} onSelectOffer={handleSelectOffer} onDetails={openDetails} onEdit={beginEdit}/>) }
    </section>

    {detailAuction && <AuctionDetailsDialog auction={detailAuction} loading={detailLoading} bids={bids} offers={offers[detailAuction._id] || []} proofs={proofs} proofExplorer={proofExplorer} onClose={() => setDetailAuction(null)} onEdit={() => beginEdit(detailAuction)} onCloseAuction={handleClose} busy={busy} canEdit={canEditAuction(detailAuction)} />}

    {editForm && <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/55 p-3 backdrop-blur-sm" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !savingEdit) setEditForm(null); }}><form role="dialog" aria-modal="true" className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-2xl sm:p-6" onSubmit={saveEdit}>
      <h2 className="text-xl font-bold text-slate-950">Edit auction schedule</h2><p className="mt-1 text-sm text-slate-500">Only auctions with no platform bids or external offers can be rescheduled. For an expired auction, set the end time to a future date to extend it.</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2"><Input label="Starts" type="datetime-local" value={editForm.startTime} onChange={(value) => setEditForm((current) => ({ ...current, startTime: value }))}/><Input label="Ends / extend until" type="datetime-local" value={editForm.endTime} onChange={(value) => setEditForm((current) => ({ ...current, endTime: value }))}/><Input label="Starting price / unit" type="number" min="0" step="0.01" value={editForm.startingPrice} onChange={(value) => setEditForm((current) => ({ ...current, startingPrice: value }))}/></div>
      <div className="mt-5 flex justify-end gap-3"><button type="button" disabled={savingEdit} onClick={() => setEditForm(null)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600">Cancel</button><button type="submit" disabled={savingEdit} className="rounded-xl bg-emerald-900 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">{savingEdit ? "Saving…" : "Save schedule"}</button></div>
    </form></div>}
  </div>;
}

function AuctionCard({ auction, busy, offers, onLoadOffers, offerForm, onOfferChange, onSubmitOffer, onSelectOffer, onDetails, onEdit }) {
  const lot = auction.lot || {};
  const isOpen = auction.status === "open";
  const expired = isOpen && new Date(auction.endTime).getTime() <= Date.now();
  return <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div><div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-bold text-slate-950">{lot.crop || "Produce lot"}</h2><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${expired ? "bg-amber-50 text-amber-800" : "bg-emerald-50 text-emerald-700"}`}>{expired ? "ended · no close recorded" : auction.status?.replaceAll("_", " ") || "unknown"}</span></div>
        <p className="mt-1 text-xs text-slate-400">{lot.quantity ? `${formatNumber(lot.quantity)} ${lot.unit}` : "Quantity unavailable"} · {formatDateTime(auction.startTime)} → {formatDateTime(auction.endTime)}</p>
      </div><div className="text-left lg:text-right"><p className="text-xs text-slate-400">Current highest bid</p><p className="text-xl font-bold text-emerald-800">₹{formatNumber(auction.currentHighestBid)}</p></div>
    </div>
    <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"><button type="button" onClick={() => onDetails(auction)} className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-bold text-emerald-900">View auction details & proof</button><button type="button" onClick={() => onLoadOffers(auction._id)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700">{offers ? "Refresh external offers" : "View external offers"}</button>{isOpen && <button type="button" onClick={() => onDetails(auction)} disabled={busy} className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 disabled:opacity-40">View details / edit if eligible</button>}</div>
    {isOpen && <div className="mt-3 grid gap-3 sm:grid-cols-2"><button type="button" onClick={() => onDetails(auction)} disabled={!auction.highestBid || expired || busy} className="rounded-xl bg-emerald-900 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-40">Review bids / close with winner</button><button type="button" onClick={() => onDetails(auction)} disabled={!auction.selectedExternalOffer || expired || busy} className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-bold text-amber-800 disabled:opacity-40">Review offers / close with external offer</button></div>}
    {offers && <div className="mt-5 rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-400">External offers</p>{offers.length === 0 ? <p className="mt-2 text-sm text-slate-500">No external offers recorded.</p> : <div className="mt-3 space-y-2">{offers.map((offer) => <div key={offer._id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-3"><div><p className="text-sm font-bold text-slate-800">{offer.buyerName}</p><p className="text-xs text-slate-400">{offer.buyerPhone || "No phone"} · {offer.status}</p></div><div className="flex items-center gap-2"><b className="text-emerald-800">₹{formatNumber(offer.offeredAmount)}</b>{isOpen && offer.status === "recorded" && <button type="button" onClick={() => onSelectOffer(auction, offer)} className="rounded-lg bg-emerald-900 px-3 py-2 text-[11px] font-bold text-white">Select</button>}</div></div>)}</div>}</div>}
    {isOpen && <div className="mt-4 grid gap-2 md:grid-cols-3"><input placeholder="Buyer name" value={offerForm.name || ""} onChange={(event) => onOfferChange("name", event.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-xs"/><input placeholder="Phone (optional)" value={offerForm.phone || ""} onChange={(event) => onOfferChange("phone", event.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-xs"/><div className="flex gap-2"><input placeholder="Offer amount" type="number" min="0.01" step="0.01" value={offerForm.amount || ""} onChange={(event) => onOfferChange("amount", event.target.value)} className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs"/><button type="button" onClick={() => onSubmitOffer(auction)} className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white">Record</button></div></div>}
  </article>;
}

function AuctionDetailsDialog({ auction, loading, bids, offers, proofs, proofExplorer, onClose, onEdit, onCloseAuction, busy, canEdit }) {
  const [confirmResult, setConfirmResult] = useState("");
  const lot = auction.lot || {};
  const isOpen = auction.status === "open";
  const expired = isOpen && new Date(auction.endTime).getTime() <= Date.now();
  return <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/55 p-3 backdrop-blur-sm" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section role="dialog" aria-modal="true" aria-labelledby="auction-details-title" className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
    <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-100 bg-white p-5"><div><p className="text-xs font-bold uppercase tracking-[0.15em] text-emerald-700">Auction record</p><h2 id="auction-details-title" className="mt-1 text-xl font-bold text-slate-950">{lot.crop || "Produce auction"}</h2><p className="mt-1 text-xs text-slate-500">{formatDateTime(auction.startTime)} – {formatDateTime(auction.endTime)}</p></div><button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600">Close</button></header>
    <div className="space-y-6 p-5">
      {loading ? <p className="py-8 text-center text-sm text-slate-500">Loading bids, offers and blockchain proof…</p> : <>
        <section><div className="flex items-center justify-between gap-3"><h3 className="font-bold text-slate-900">Platform bids</h3><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">{bids.length}</span></div>{bids.length === 0 ? <p className="mt-3 rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">No platform bids were recorded.</p> : <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200"><table className="w-full min-w-[480px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Buyer</th><th className="px-4 py-3">Bid</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Placed</th></tr></thead><tbody>{bids.map((bid) => <tr key={bid._id} className="border-t border-slate-100"><td className="px-4 py-3 font-semibold text-slate-800">{bid.buyer?.name || "Buyer"}</td><td className="px-4 py-3 font-bold text-emerald-800">₹{formatNumber(bid.amount)}</td><td className="px-4 py-3">{bid.status}</td><td className="px-4 py-3 text-slate-500">{formatDateTime(bid.createdAt)}</td></tr>)}</tbody></table></div>}</section>
        <section><div className="flex items-center justify-between gap-3"><h3 className="font-bold text-slate-900">External offers</h3><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">{offers.length}</span></div>{offers.length === 0 ? <p className="mt-3 rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">No external offers were recorded.</p> : <div className="mt-3 space-y-2">{offers.map((offer) => <div key={offer._id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-3"><div><p className="font-semibold text-slate-800">{offer.buyerName}</p><p className="text-xs text-slate-500">{offer.status} · {formatDateTime(offer.createdAt)}</p></div><b className="text-emerald-800">₹{formatNumber(offer.offeredAmount)}</b></div>)}</div>}</section>
        <section><div className="flex items-center justify-between gap-3"><h3 className="font-bold text-slate-900">Blockchain proof</h3><span className="text-xs text-slate-500">Sepolia testnet</span></div><p className="mt-1 text-xs leading-5 text-slate-500">Auction creation, closure and cancellation have blockchain anchor events in the current backend. Schedule edits are currently recorded in MongoDB only. Individual bids are also stored in MongoDB and are not independently anchored on-chain.</p>{proofs.length === 0 ? <p className="mt-3 rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">No blockchain anchor record was found for this auction yet.</p> : <div className="mt-3 space-y-2">{proofs.map((proof) => <div key={proof._id} className="rounded-xl border border-slate-200 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-semibold text-slate-900">{proof.eventType?.replaceAll("_", " ")}</p><ProofStatus status={proof.status}/></div><p className="mt-1 text-xs text-slate-500">Recorded {formatDateTime(proof.createdAt)}{proof.network ? ` · ${proof.network}` : ""}{proof.blockNumber ? ` · Block ${proof.blockNumber}` : ""}</p>{proof.transactionHash && <a className="mt-2 inline-block break-all text-xs font-semibold text-emerald-800 underline" href={`${proofExplorer}${proof.transactionHash}`} target="_blank" rel="noreferrer">View transaction: {proof.transactionHash}</a>}{proof.status === "failed" && <p className="mt-2 text-xs text-rose-700">Anchor failed. An administrator may need to retry it.</p>}</div>)}</div>}</section>
        {isOpen && <section className="border-t border-slate-100 pt-4"><h3 className="font-bold text-slate-900">Auction actions</h3>{canEdit && <button type="button" onClick={onEdit} className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-bold text-emerald-900">Edit / extend schedule</button>}{expired && bids.length === 0 && offers.length === 0 && <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">This auction has passed its end time without bids or offers. Extend the end date to reopen the opportunity.</p>}
          {bids.length > 0 && <button type="button" onClick={() => setConfirmResult("platform_winner")} disabled={expired || busy === auction._id} className="mt-3 mr-2 rounded-xl bg-emerald-900 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-40">Close with platform winner</button>}
          {offers.some((offer) => offer.status === "selected") && <button type="button" onClick={() => setConfirmResult("external_offer")} disabled={expired || busy === auction._id} className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-bold text-amber-900 disabled:opacity-40">Close with selected external offer</button>}
        </section>}
      </>}
    </div>
    {confirmResult && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4"><div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl"><h3 className="font-bold text-slate-900">Confirm auction closure</h3><p className="mt-2 text-sm text-slate-500">This will close the auction using the {confirmResult === "platform_winner" ? "highest platform bid" : "selected external offer"}.</p><div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setConfirmResult("")} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">Cancel</button><button type="button" onClick={async () => { await onCloseAuction(auction, confirmResult); setConfirmResult(""); onClose(); }} className="rounded-xl bg-emerald-900 px-3 py-2 text-sm font-bold text-white">Confirm close</button></div></div></div>}
  </section></div>;
}

function ProofStatus({ status }) {
  const classes = status === "anchored" ? "bg-emerald-50 text-emerald-800" : status === "failed" ? "bg-rose-50 text-rose-800" : "bg-amber-50 text-amber-800";
  return <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${classes}`}>{status || "pending"}</span>;
}
function toDateTimeLocal(value) { if (!value) return ""; const date = new Date(value); const offset = date.getTimezoneOffset(); return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16); }
function Input({ label, value, onChange, type = "text", min, max, step }) { return <label className="block"><span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</span><input required type={type} min={min} max={max} step={step} value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-400"/></label>; }
function Select({ label, value, onChange, options }) { return <label className="block"><span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</span><select required value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"><option value="">Choose…</option>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>; }
function Alert({ children }) { return <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{children}</div>; }
function Loading() { return <div className="rounded-3xl border border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-400">Loading auctions…</div>; }
function Empty() { return <div className="rounded-3xl border border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-400">No auctions yet. Create one from an eligible available lot.</div>; }
export default FarmerAuctions;
