import { useEffect, useMemo, useState } from "react";
import {
  getFarmerLots, getFarmerSupplyIntents, createFarmerLot,
  createFarmerSupplyIntent, updateFarmerLot, updateFarmerSupplyIntent,
  getFarmerAllocations,
} from "../../api/farmerApi";
import { uploadProduceImages } from "../../lib/storage";
import { apiRequest } from "../../api/api";

const fmt = (v) => new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(Number(v || 0));
const date = (v) => v ? new Date(v).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "Not set";
const label = (v) => String(v || "unknown").replaceAll("_", " ").replace(/^./, (c) => c.toUpperCase());
const inputClass = "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50";
const emptyForm = { crop: "", variety: "", quantity: "", unit: "quintal", expectedPrice: "", harvestDate: "", state: "", district: "", village: "", qualityGrade: "", qualityExpectation: "" };
const normalize = (r) => Array.isArray(r?.data) ? r.data : Array.isArray(r?.allocations) ? r.allocations : Array.isArray(r) ? r : [];

export default function FarmerSupply({ user = null }) {
  const farmerId = user?.id || user?._id;
  const [lots, setLots] = useState([]);
  const [intents, setIntents] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("spot");
  const [modal, setModal] = useState(null); // { kind: spot|future, item?: record }
  const [form, setForm] = useState(emptyForm);
  const [images, setImages] = useState([]);
  const [retainedImages, setRetainedImages] = useState([]);
  const [saving, setSaving] = useState(false);
  const [selectedProposalSource, setSelectedProposalSource] = useState(null);
  const [proposalDialog, setProposalDialog] = useState(null);
  const [proposalBusy, setProposalBusy] = useState(false);
  const [proposalError, setProposalError] = useState("");

  const load = async () => {
    if (!farmerId) { setLoading(false); setError("Your account could not be identified. Please sign in again."); return; }
    setLoading(true); setError("");
    try {
      const [lotRes, intentRes, allocationRes] = await Promise.all([
        getFarmerLots(farmerId),
        getFarmerSupplyIntents(farmerId),
        getFarmerAllocations(farmerId).catch(() => []),
      ]);
      setLots(normalize(lotRes));
      setIntents(normalize(intentRes));
      setAllocations(normalize(allocationRes));
    } catch (e) { setError(e.message || "Unable to load your supply records."); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [farmerId]);

  const spotRecords = useMemo(() => lots.filter((x) => !["cancelled", "deleted"].includes(x.status)), [lots]);
  const futureRecords = useMemo(() => intents.filter((x) => !["cancelled", "deleted"].includes(x.status)), [intents]);
  const searchMatch = (x) => `${x.crop || ""} ${x.variety || ""} ${x.location?.district || ""} ${x.location?.village || ""}`.toLowerCase().includes(search.trim().toLowerCase());

  const openCreate = (kind) => {
    setForm({ ...emptyForm });
    setImages([]);
    setRetainedImages([]);
    setError("");
    setNotice("");
    setModal({ kind });
  };
  const openEdit = (kind, item) => {
    setForm({ ...emptyForm, crop: item.crop || "", variety: item.variety || "", quantity: String(kind === "spot" ? item.quantity ?? "" : item.expectedQuantity ?? ""), unit: item.unit || "quintal", expectedPrice: String(item.expectedPrice ?? ""), harvestDate: (kind === "spot" ? item.availableFrom || item.harvestDate : item.expectedHarvestDate) ? new Date(kind === "spot" ? item.availableFrom || item.harvestDate : item.expectedHarvestDate).toISOString().slice(0, 10) : "", state: item.location?.state || "", district: item.location?.district || "", village: item.location?.village || "", qualityGrade: item.qualityGrade || "", qualityExpectation: item.qualityExpectation || "" });
    setImages([]);
    setRetainedImages((Array.isArray(item.images) ? item.images : []).map((image) => ({ raw: image, url: getImageUrl(image) })).filter((image) => image.url));
    setError("");
    setNotice("");
    setModal({ kind, item });
  };
  const change = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  const save = async (e) => {
    e.preventDefault(); setError(""); setNotice("");
    if (!farmerId) return setError("Your account could not be identified. Please sign in again.");
    if (!form.crop.trim() || !form.quantity || Number(form.quantity) <= 0 || !form.state.trim() || !form.district.trim() || !form.village.trim()) return setError("Complete the crop, positive quantity, state, district and village fields.");
    if (modal.kind === "spot" && (!form.expectedPrice || Number(form.expectedPrice) < 0)) return setError("Enter an expected price for spot supply.");
    if (modal.kind === "future" && !form.harvestDate) return setError("Choose the expected harvest date for future supply.");
    setSaving(true);
    try {
      const isEdit = Boolean(modal.item);
      let payload;
      if (modal.kind === "spot") {
        let imageUrls = retainedImages.map((image) => image.raw);
        if (images.length) {
          imageUrls = [...imageUrls, ...(await uploadProduceImages(images, farmerId))];
        }
        payload = { farmer: farmerId, crop: form.crop.trim(), variety: form.variety.trim() || undefined, quantity: Number(form.quantity), unit: form.unit, expectedPrice: Number(form.expectedPrice), harvestDate: form.harvestDate || undefined, availableFrom: form.harvestDate || undefined, qualityGrade: form.qualityGrade.trim() || undefined, location: { state: form.state.trim(), district: form.district.trim(), village: form.village.trim() }, images: imageUrls, aggregatorType: modal.item?.aggregatorType || "direct" };
        if (isEdit) await updateFarmerLot(modal.item._id, payload); else await createFarmerLot(payload);
      } else {
        payload = { farmer: farmerId, crop: form.crop.trim(), variety: form.variety.trim() || undefined, expectedQuantity: Number(form.quantity), unit: form.unit, expectedHarvestDate: form.harvestDate, supplyType: "preorder", qualityExpectation: form.qualityExpectation.trim() || undefined, location: { state: form.state.trim(), district: form.district.trim(), village: form.village.trim() }, aggregatorType: modal.item?.aggregatorType || "direct" };
        if (isEdit) await updateFarmerSupplyIntent(modal.item._id, payload); else await createFarmerSupplyIntent(payload);
      }
      setModal(null);
      setImages([]);
      setRetainedImages([]);
      setNotice(`${modal.kind === "spot" ? "Spot supply" : "Future intent"} ${isEdit ? "updated" : "created"} successfully.`); await load();
    } catch (e2) { setError(e2.message || "The backend could not save this record."); }
    finally { setSaving(false); }
  };

  const submitProposalDecision = async () => {
    if (!proposalDialog?.proposal?._id) { setProposalError("This proposal has no allocation ID, so it cannot be updated."); return; }
    setProposalBusy(true); setProposalError("");
    try {
      const action = proposalDialog.action === "approve" ? "approve" : "reject";
      await apiRequest(`/allocations/${proposalDialog.proposal._id}/${action}`, { method: "PATCH" });
      setNotice(action === "approve" ? "Buyer proposal approved; its quantity is now reserved. The purchase commitment is not yet confirmed." : "Buyer proposal rejected.");
      setProposalDialog(null);
      await load();
    } catch (e) { setProposalError(e.message || "The backend could not update this proposal."); }
    finally { setProposalBusy(false); }
  };

  return <div className="space-y-8 pb-8">
    <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Farmer workspace</p><h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">My supply</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Manage produce available now and planned harvests separately.</p></div>
      <div className="flex flex-wrap gap-2"><button onClick={() => openCreate("future")} className="rounded-xl border border-emerald-800 px-4 py-3 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-50">+ Future intent</button><button onClick={() => openCreate("spot")} className="rounded-xl bg-emerald-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-950">+ Add spot supply</button></div>
    </header>
    {error && !modal && <Alert type="error" text={error} />}{notice && <Alert text={notice} />}
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Stat label="Spot supply records" value={spotRecords.length}/><Stat label="Future intents" value={futureRecords.length}/><Stat label="Available now" value={spotRecords.filter((x) => x.status === "available").length}/><Stat label="Reserved or committed" value={[...spotRecords, ...futureRecords].filter((x) => ["reserved", "committed", "in_auction"].includes(x.status)).length}/></div>

    {/* Search stays above the full-width supply switch. */}
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <label htmlFor="supply-search" className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Search crop</label>
      <div className="relative">
        <SearchMark />
        <input id="supply-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search crop, variety or location…" className={`${inputClass} pl-10`} />
      </div>
    </section>

    {/* Full-width segmented tabs */}
    <section className="space-y-5">
      <div role="tablist" aria-label="Supply type" className="grid w-full grid-cols-2 rounded-2xl border border-slate-200 bg-slate-100 p-1.5 shadow-inner">
        <button id="spot-tab" role="tab" aria-selected={activeTab === "spot"} aria-controls="spot-panel" onClick={() => setActiveTab("spot")} className={`flex min-h-14 items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-bold transition sm:text-base ${activeTab === "spot" ? "bg-emerald-900 text-white shadow-md" : "text-slate-600 hover:bg-white hover:text-emerald-900"}`}>
          <span>Spot supply</span><span className={`rounded-full px-2 py-0.5 text-xs ${activeTab === "spot" ? "bg-white/15 text-white" : "bg-white text-slate-500"}`}>{spotRecords.length}</span>
        </button>
        <button id="future-tab" role="tab" aria-selected={activeTab === "future"} aria-controls="future-panel" onClick={() => setActiveTab("future")} className={`flex min-h-14 items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-bold transition sm:text-base ${activeTab === "future" ? "bg-emerald-900 text-white shadow-md" : "text-slate-600 hover:bg-white hover:text-emerald-900"}`}>
          <span>Future intent</span><span className={`rounded-full px-2 py-0.5 text-xs ${activeTab === "future" ? "bg-white/15 text-white" : "bg-white text-slate-500"}`}>{futureRecords.length}</span>
        </button>
      </div>

      {activeTab === "spot" ? <section id="spot-panel" role="tabpanel" aria-labelledby="spot-tab" className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">Available produce</p><h2 className="mt-1 text-2xl font-bold text-slate-950">Active spot supply</h2><p className="mt-1 text-sm text-slate-500">Photo-led listings for produce available now.</p></div><button onClick={() => openCreate("spot")} className="w-fit rounded-xl bg-emerald-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-950">+ Add spot supply</button></div>
        {loading ? <Loading /> : spotRecords.filter(searchMatch).length === 0 ? <Empty title="No active spot supply found" detail="Add a produce lot with quantity, price and availability to list it here." action="Add spot supply" onClick={() => openCreate("spot")} /> : <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{spotRecords.filter(searchMatch).map((item) => <SpotCard key={item._id} item={item} onEdit={() => openEdit("spot", item)} onViewProposals={() => setSelectedProposalSource({ sourceType: "lot", item })} proposalCount={getBuyerProposalsForSource(allocations, "lot", item).length} />)}</div>}
      </section> : <section id="future-panel" role="tabpanel" aria-labelledby="future-tab" className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-700">Planned harvest</p><h2 className="mt-1 text-2xl font-bold text-slate-950">Future supply intents</h2><p className="mt-1 text-sm text-slate-500">A text-first view of crops expected after harvest, without listing photos.</p></div><button onClick={() => openCreate("future")} className="w-fit rounded-xl border border-emerald-800 px-4 py-2.5 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-50">+ Create future intent</button></div>
        {loading ? <Loading /> : futureRecords.filter(searchMatch).length === 0 ? <Empty title="No future intents found" detail="Create an intent to tell buyers what you expect to harvest and when." action="Create future intent" onClick={() => openCreate("future")} /> : <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="hidden grid-cols-[1.3fr_.7fr_.8fr_.7fr_auto] gap-4 border-b border-slate-100 bg-slate-50 px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 md:grid"><span>Crop / location</span><span>Expected quantity</span><span>Harvest date</span><span>Status</span><span>Action</span></div><div className="divide-y divide-slate-100">{futureRecords.filter(searchMatch).map((item) => <FutureRow key={item._id} item={item} onEdit={() => openEdit("future", item)} onViewProposals={() => setSelectedProposalSource({ sourceType: "supply_intent", item })} proposalCount={getBuyerProposalsForSource(allocations, "supply_intent", item).length} />)}</div></div>}
      </section>}
    </section>

    {selectedProposalSource && <BuyerProposalsDialog
      source={selectedProposalSource.item}
      sourceType={selectedProposalSource.sourceType}
      proposals={getBuyerProposalsForSource(allocations, selectedProposalSource.sourceType, selectedProposalSource.item)}
      busy={proposalBusy}
      onClose={() => setSelectedProposalSource(null)}
      onDecision={(proposal, action) => { setProposalError(""); setProposalDialog({ proposal, action }); }}
    />}

    {proposalDialog && <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm" role="presentation">
      <section role="dialog" aria-modal="true" aria-labelledby="proposal-decision-title" className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">Buyer-proposed allocation</p>
        <h2 id="proposal-decision-title" className="mt-2 text-xl font-bold text-slate-950">{proposalDialog.action === "approve" ? "Approve this proposal?" : "Reject this proposal?"}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">{proposalDialog.action === "approve" ? "Approval moves this allocation from proposed to reserved, subject to backend validation. It does not confirm the purchase commitment or payment." : "Rejecting declines this buyer's proposal. The rejected proposal remains in the history."}</p>
        <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm">
          <p className="font-semibold text-slate-900">{proposalDialog.proposal?.crop || proposalDialog.proposal?.sourceId?.crop || "Selected supply proposal"}</p>
          <p className="mt-1 text-slate-600">Proposed quantity: {fmt(proposalDialog.proposal?.allocatedQuantity ?? proposalDialog.proposal?.quantity)} {proposalDialog.proposal?.unit || "units"}</p>
          <p className="mt-1 text-slate-500">Current status: {label(proposalDialog.proposal?.status)}</p>
        </div>
        {proposalError && <div className="mt-4"><Alert type="error" text={proposalError} /></div>}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={() => { if (!proposalBusy) { setProposalDialog(null); setProposalError(""); } }} disabled={proposalBusy} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 disabled:opacity-50">Cancel</button>
          <button type="button" onClick={submitProposalDecision} disabled={proposalBusy} className={`rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 ${proposalDialog.action === "approve" ? "bg-emerald-800 hover:bg-emerald-900" : "bg-rose-700 hover:bg-rose-800"}`}>{proposalBusy ? "Submitting…" : proposalDialog.action === "approve" ? "Confirm approval" : "Confirm rejection"}</button>
        </div>
      </section>
    </div>}
    {modal && <SupplyModal modal={modal} form={form} change={change} images={images} setImages={setImages} retainedImages={retainedImages} setRetainedImages={setRetainedImages} saving={saving} error={error} onClose={() => { if (!saving) { setModal(null); setError(""); } }} onSubmit={save} />}
  </div>;
}

function SpotCard({ item, onEdit, onViewProposals, proposalCount = 0 }) {
  const photos = Array.isArray(item.images) ? item.images : [];
  const imageUrl = getImageUrl(photos[0]);
  const canEdit = ["available", "draft"].includes(item.status);

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative h-44 overflow-hidden bg-gradient-to-br from-emerald-50 via-slate-50 to-lime-50">
        {imageUrl ? (
          <img src={imageUrl} alt={`${item.crop} produce`} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-emerald-900/60">
            <svg width="42" height="42" viewBox="0 0 48 48" fill="none" aria-hidden="true">
              <path d="M8 34 18 23l7 7 6-6 9 10v4H8v-4Z" stroke="currentColor" strokeWidth="1.7" />
              <circle cx="17" cy="15" r="4" stroke="currentColor" strokeWidth="1.7" />
              <path d="M25 11c5-5 11-3 12-2-1 7-6 11-12 9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
            <span className="text-xs font-semibold">Produce photo not added</span>
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-800 shadow-sm">Spot supply</span>
        <span className="absolute right-3 top-3 rounded-full bg-slate-950/75 px-3 py-1 text-[10px] font-semibold text-white">{label(item.status)}</span>
      </div>
      <div className="space-y-4 p-4">
        <div>
          <h3 className="text-lg font-bold text-slate-950">{item.crop || "Unnamed crop"}</h3>
          <p className="mt-1 text-xs text-slate-500">{item.variety || "Standard variety"} · {[item.location?.village, item.location?.district].filter(Boolean).join(", ") || "Location not set"}</p>
        </div>
        <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3">
          <div><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Quantity</p><p className="mt-1 text-sm font-bold text-slate-800">{fmt(item.quantity)} {item.unit || "units"}</p></div>
          <div><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Expected price</p><p className="mt-1 text-sm font-bold text-slate-800">₹{fmt(item.expectedPrice)} <span className="text-xs font-medium text-slate-500">/ {item.unit || "unit"}</span></p></div>
        </div>
        <div className="flex items-center justify-between gap-3">
          <div><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Available from</p><p className="mt-1 text-xs font-semibold text-slate-700">{date(item.availableFrom || item.harvestDate)}</p></div>
          <button onClick={onEdit} disabled={!canEdit} title={!canEdit ? "Editing is disabled after reservation or commitment" : "Edit listing"} className="rounded-xl border border-emerald-200 px-3.5 py-2 text-xs font-bold text-emerald-900 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-40">{canEdit ? "View / edit" : "View only"}</button>
        </div>
        <button type="button" onClick={onViewProposals} className="flex w-full items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-sm font-bold text-emerald-900 transition hover:border-emerald-400 hover:bg-emerald-100 focus:outline-none focus:ring-4 focus:ring-emerald-100">
          <span>View buyer proposals</span>
          <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-emerald-800">{proposalCount}</span>
        </button>
      </div>
    </article>
  );
}

function getBuyerProposalsForSource(allocations, sourceType, source) {
  const sourceId = String(source?._id || source?.id || "");
  if (!sourceId) return [];

  return allocations
    .filter((allocation) =>
      (allocation?.initiatedBy || "buyer") === "buyer" &&
      String(allocation?.sourceType || "").toLowerCase() === sourceType &&
      String(allocation?.sourceId?._id || allocation?.sourceId || "") === sourceId
    )
    .sort((a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0));
}

function BuyerProposalsDialog({ source, sourceType, proposals, busy, onClose, onDecision }) {
  const isFutureIntent = sourceType === "supply_intent";
  const sourceLabel = isFutureIntent ? "Future intent" : "Spot supply";
  const sourceQuantity = isFutureIntent ? source?.expectedQuantity : source?.quantity;
  const sourceDate = isFutureIntent ? source?.expectedHarvestDate : source?.availableFrom || source?.harvestDate;
  const statusClass = (status) => {
    const value = String(status || "unknown").toLowerCase();
    if (["reserved", "committed", "fulfilled"].includes(value)) return "bg-emerald-50 text-emerald-800";
    if (["rejected", "cancelled", "released"].includes(value)) return "bg-rose-50 text-rose-700";
    return "bg-amber-50 text-amber-800";
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/55 p-3 backdrop-blur-sm sm:p-5" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="buyer-proposals-title" className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-slate-100 p-5 sm:p-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">{sourceLabel} · Buyer proposals</p>
            <h2 id="buyer-proposals-title" className="mt-1 text-xl font-bold text-slate-950 sm:text-2xl">{source?.crop || "Selected supply"}{source?.variety ? ` · ${source.variety}` : ""}</h2>
            <p className="mt-1 text-sm text-slate-500">{fmt(sourceQuantity)} {source?.unit || "units"} {isFutureIntent ? "expected" : "listed"}{sourceDate ? ` · ${isFutureIntent ? "Harvest" : "Available from"} ${date(sourceDate)}` : ""} · {proposals.length} proposal{proposals.length === 1 ? "" : "s"}</p>
          </div>
          <button type="button" onClick={onClose} disabled={busy} aria-label="Close buyer proposals" className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50">Close</button>
        </header>

        <div className="max-h-[calc(90vh-100px)] space-y-3 overflow-y-auto p-4 sm:p-6">
          {proposals.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 px-5 py-10 text-center">
              <p className="font-semibold text-slate-800">No buyer proposals for this {isFutureIntent ? "future intent" : "spot listing"} yet</p>
              <p className="mt-1 text-sm text-slate-500">Proposals linked to this exact {isFutureIntent ? "planned harvest" : "spot listing"} will appear here, including their status history.</p>
            </div>
          ) : proposals.map((proposal) => {
            const request = proposal?.procurementRequest && typeof proposal.procurementRequest === "object" ? proposal.procurementRequest : null;
            const status = String(proposal?.status || "proposed").toLowerCase();
            return (
              <article key={proposal?._id || `${proposal?.createdAt}-${proposal?.allocatedQuantity}`} className="rounded-xl border border-slate-200 p-4 sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Buyer demand</p>
                    <h3 className="mt-1 font-bold text-slate-950">{request?.crop || source?.crop || "Procurement request"}{request?.variety ? ` · ${request.variety}` : ""}</h3>
                    <p className="mt-1 text-sm text-slate-600">Proposed quantity: <strong>{fmt(proposal?.allocatedQuantity ?? proposal?.quantity)} {proposal?.unit || source?.unit || "units"}</strong></p>
                    <p className="mt-1 text-xs text-slate-500">Buyer request: {request ? `${fmt(request.quantity)} ${request.unit || proposal.unit || "units"}` : "Details unavailable"}{request?.requiredBy ? ` · Required by ${date(request.requiredBy)}` : ""}</p>
                    {proposal?.createdAt && <p className="mt-1 text-xs text-slate-400">Submitted {date(proposal.createdAt)}</p>}
                  </div>
                  <span className={`inline-flex w-fit shrink-0 rounded-full px-3 py-1.5 text-xs font-bold ${statusClass(status)}`}>{label(status)}</span>
                </div>
                {status === "proposed" && proposal?._id && <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                  <button type="button" disabled={busy} onClick={() => onDecision(proposal, "approve")} className="rounded-lg bg-emerald-800 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-50">Approve & reserve</button>
                  <button type="button" disabled={busy} onClick={() => onDecision(proposal, "reject")} className="rounded-lg border border-rose-200 px-4 py-2.5 text-xs font-bold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50">Reject proposal</button>
                </div>}
                {status === "reserved" && <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-xs leading-5 text-emerald-800">Quantity reserved. The purchase commitment is a separate step.</p>}
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function FutureRow({ item, onEdit, onViewProposals, proposalCount = 0 }) {
  const canEdit = ["available", "draft", "pending"].includes(item.status);

  return (
    <div className="grid gap-3 px-4 py-4 sm:px-5 md:grid-cols-[1.3fr_.7fr_.8fr_.7fr_auto] md:items-center md:gap-4">
      <div>
        <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-amber-500"/><h3 className="font-bold text-slate-900">{item.crop || "Unnamed crop"}</h3></div>
        <p className="mt-1 text-xs text-slate-500">{item.variety || "Variety not specified"} · {[item.location?.village, item.location?.district, item.location?.state].filter(Boolean).join(", ") || "Location not set"}</p>
      </div>
      <div><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 md:hidden">Expected quantity</p><p className="text-sm font-semibold text-slate-700">{fmt(item.expectedQuantity)} {item.unit || "units"}</p></div>
      <div><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 md:hidden">Expected harvest</p><p className="text-sm font-semibold text-slate-700">{date(item.expectedHarvestDate)}</p></div>
      <div><span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${["reserved", "committed", "fulfilled"].includes(String(item.status || "").toLowerCase()) ? "bg-emerald-50 text-emerald-800" : ["cancelled", "converted"].includes(String(item.status || "").toLowerCase()) ? "bg-slate-100 text-slate-600" : "bg-amber-50 text-amber-800"}`}>{label(item.status)}</span></div>
      <div className="flex flex-wrap gap-2 md:flex-col md:items-stretch">
        <button onClick={onEdit} disabled={!canEdit} title={!canEdit ? "Editing is disabled for this status" : "View or edit future intent"} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-900 disabled:cursor-not-allowed disabled:opacity-40">{canEdit ? "View / edit" : "View only"}</button>
        <button type="button" onClick={onViewProposals} className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-900 transition hover:border-emerald-400 hover:bg-emerald-100 focus:outline-none focus:ring-4 focus:ring-emerald-100">
          <span>View proposals</span><span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-emerald-800">{proposalCount}</span>
        </button>
      </div>
    </div>
  );
}
function getImageUrl(image) {
  if (typeof image === "string") return image;
  return image?.url || image?.publicUrl || image?.public_url || image?.src || "";
}

function SupplyModal({
  modal,
  form,
  change,
  images,
  setImages,
  retainedImages,
  setRetainedImages,
  saving,
  error,
  onClose,
  onSubmit,
}) {
  const spot = modal.kind === "spot";
  const edit = Boolean(modal.item);
  const [previews, setPreviews] = useState([]);
  const totalImageCount = retainedImages.length + images.length;
  const remainingSlots = Math.max(0, 5 - totalImageCount);

  useEffect(() => {
    const urls = images.map((file) => URL.createObjectURL(file));
    setPreviews(urls);
    return () => urls.forEach(URL.revokeObjectURL);
  }, [images]);

  const pickImages = (event) => {
    const selectedFiles = Array.from(event.target.files || []);
    const validImages = selectedFiles.filter((file) => file.type.startsWith("image/"));
    const filesToAdd = validImages.slice(0, remainingSlots);

    if (filesToAdd.length !== selectedFiles.length) {
      // The preview count and the 5-image limit are visible to the user.
    }

    setImages((current) => [...current, ...filesToAdd].slice(0, 5 - retainedImages.length));
    event.target.value = "";
  };

  const removeExistingImage = (indexToRemove) => {
    setRetainedImages((current) => current.filter((_, index) => index !== indexToRemove));
  };

  const removeNewImage = (indexToRemove) => {
    setImages((current) => current.filter((_, index) => index !== indexToRemove));
  };

  const field = (name, title, options = {}) => (
    <label className="block space-y-1.5" key={name}>
      <span className="text-xs font-semibold text-slate-600">
        {title}{options.required ? " *" : ""}
      </span>
      {options.select ? (
        <select
          name={name}
          value={form[name]}
          onChange={change}
          required={options.required}
          className={inputClass}
        >
          {options.select.map(([value, text]) => (
            <option key={value} value={value}>{text}</option>
          ))}
        </select>
      ) : (
        <input
          name={name}
          type={options.type || "text"}
          min={options.min}
          step={options.step}
          value={form[name]}
          onChange={change}
          placeholder={options.placeholder || ""}
          required={options.required}
          className={inputClass}
        />
      )}
    </label>
  );

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-3 backdrop-blur-sm sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="supply-modal-title"
    >
      <div className="max-h-[94vh] w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4 sm:px-7">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700">
              {spot ? "Active spot supply" : "Future harvest"}
            </p>
            <h2 id="supply-modal-title" className="mt-1 text-xl font-bold text-slate-950">
              {edit ? "View / edit supply" : spot ? "Add spot supply" : "Create future intent"}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {spot
                ? "List produce available now, including optional photos."
                : "Plan an upcoming harvest. Future intents are kept photo-free."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100"
            aria-label="Close form"
          >
            Close
          </button>
        </div>

        <form onSubmit={onSubmit} className="max-h-[calc(94vh-80px)] space-y-5 overflow-y-auto px-5 py-5 sm:px-7">
          <div className="grid gap-4 sm:grid-cols-2">
            {field("crop", "Crop name", { required: true, placeholder: "e.g. Tomato" })}
            {field("variety", "Variety", { placeholder: "e.g. Hybrid" })}
            {field("quantity", spot ? "Available quantity" : "Expected quantity", {
              type: "number", min: "0.01", step: "0.01", required: true,
            })}
            {field("unit", "Unit", {
              required: true,
              select: [["quintal", "Quintal"], ["kg", "Kilogram"], ["tonne", "Tonne"]],
            })}
            {spot && field("expectedPrice", "Expected price per unit (₹)", {
              type: "number", min: "0", step: "0.01", required: true,
            })}
            {field("harvestDate", spot ? "Availability / harvest date" : "Expected harvest date", {
              type: "date", required: !spot,
            })}
            {field("state", "State", { required: true })}
            {field("district", "District", { required: true })}
            {field("village", "Village", { required: true })}
            {spot
              ? field("qualityGrade", "Quality grade", { placeholder: "e.g. A grade" })
              : field("qualityExpectation", "Quality expectation", { placeholder: "Describe expected quality" })}
          </div>

          {spot && (
            <section className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/50 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Produce photos</h3>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Keep, remove or add photos below. Up to 5 images total; these appear on spot supply cards only.
                  </p>
                </div>
                <label className={`inline-flex w-fit items-center rounded-xl border border-emerald-200 bg-white px-3 py-2 text-xs font-bold text-emerald-900 ${remainingSlots ? "cursor-pointer hover:bg-emerald-50" : "cursor-not-allowed opacity-50"}`}>
                  {remainingSlots > 0 ? "Add images" : "Image limit reached"}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    disabled={remainingSlots === 0}
                    onChange={pickImages}
                    className="hidden"
                  />
                </label>
              </div>

              {totalImageCount > 0 ? (
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
                  {retainedImages.map((image, index) => (
                    <div key={`existing-${image.url}-${index}`} className="group relative">
                      <div className="aspect-square overflow-hidden rounded-xl border border-slate-200 bg-white">
                        <img src={image.url} alt={`Existing produce ${index + 1}`} className="h-full w-full object-cover" />
                      </div>
                      <span className="mt-1.5 block truncate text-[10px] font-medium text-slate-500">Existing photo</span>
                      <button
                        type="button"
                        onClick={() => removeExistingImage(index)}
                        disabled={saving}
                        aria-label={`Remove existing photo ${index + 1}`}
                        title="Remove this photo when saving"
                        className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-lg leading-none text-slate-700 shadow-sm transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                      >
                        ×
                      </button>
                    </div>
                  ))}

                  {previews.map((src, index) => (
                    <div key={`new-${src}`} className="group relative">
                      <div className="aspect-square overflow-hidden rounded-xl border border-emerald-200 bg-white">
                        <img src={src} alt={`New produce photo ${index + 1}`} className="h-full w-full object-cover" />
                      </div>
                      <span className="mt-1.5 block truncate text-[10px] font-medium text-emerald-800">New photo</span>
                      <button
                        type="button"
                        onClick={() => removeNewImage(index)}
                        disabled={saving}
                        aria-label={`Remove new photo ${index + 1}`}
                        title="Remove this selected photo"
                        className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-lg leading-none text-slate-700 shadow-sm transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-6 text-center">
                  <p className="text-sm font-semibold text-slate-700">No photos added</p>
                  <p className="mt-1 text-xs text-slate-500">Choose images to make this listing easier for buyers to recognise.</p>
                </div>
              )}
              <p className="mt-3 text-right text-xs font-medium text-slate-500">
                {totalImageCount} of 5 images selected
              </p>
            </section>
          )}

          {!spot && (
            <div className="rounded-xl bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-900">
              Future supply intents do not use photos or spot pricing. Add the expected harvest date so buyers can plan ahead.
            </div>
          )}

          {error && <Alert type="error" text={error} />}

          <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-emerald-900 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-950 disabled:opacity-60"
            >
              {saving ? "Saving…" : edit ? "Save changes" : spot ? "Create spot listing" : "Create future intent"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
function Stat({ label, value }) { return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">{label}</p><p className="mt-2 text-2xl font-bold tracking-tight text-slate-950">{value}</p></div>; }
function Alert({ text, type = "success" }) { return <div className={`rounded-xl border px-4 py-3 text-sm ${type === "error" ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>{text}</div>; }
function Loading() { return <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500">Loading supply records…</div>; }
function Empty({ title, detail, action, onClick }) { return <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center"><h3 className="font-bold text-slate-800">{title}</h3><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{detail}</p><button onClick={onClick} className="mt-4 rounded-xl bg-emerald-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-950">{action}</button></div>; }

function SearchMark() { return <svg className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8" stroke="currentColor" strokeWidth="1.8"/><path d="m16 16 4.2 4.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>; }
