import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getFarmerDemand,
  getFarmerDemandMatches,
  getFarmerLots,
  getFarmerSupplyIntents,
  getFarmerAllocations,
  createFarmerOffer,
} from "../../api/farmerApi";
import { getStoredUser } from "../../api/authApi";

const fmt = (value) => new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(Number(value || 0));
const date = (value) => value ? new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

// Hide requests whose required-by calendar date is before today. Parse date-only
// values as local calendar dates to avoid UTC timezone shifts.
const hasPassedRequiredBy = (value) => {
  if (!value) return false;

  const raw = String(value);
  const dateOnly = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const requiredDate = dateOnly
    ? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]))
    : new Date(value);

  if (Number.isNaN(requiredDate.getTime())) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  requiredDate.setHours(0, 0, 0, 0);
  return requiredDate < today;
};
const statusLabel = (status) => ({ proposed: "Awaiting buyer", reserved: "Accepted · slot reserved", committed: "Committed", fulfilled: "Fulfilled", rejected: "Rejected", cancelled: "Cancelled", released: "Released" }[status] || status || "Unknown");
const firstNumber = (...values) => {
  const found = values.find(
    (value) =>
      value !== undefined &&
      value !== null &&
      value !== "" &&
      Number.isFinite(Number(value)),
  );

  return found === undefined ? 0 : Number(found);
};

const currentAllocated = (item) => {
  // Prefer the explicit aggregate field when the API provides it.
  if (item.allocatedQuantity !== undefined && item.allocatedQuantity !== null && item.allocatedQuantity !== "") {
    return Math.max(0, Number(item.allocatedQuantity) || 0);
  }

  // A remaining-quantity field is a useful fallback when no aggregate exists.
  const remaining = [item.remainingQuantity, item.quantityRemaining].find(
    (value) => value !== undefined && value !== null && value !== "" && Number.isFinite(Number(value)),
  );

  if (remaining !== undefined) {
    return Math.max(0, Number(item.quantity || 0) - Number(remaining));
  }

  // Fall back to whichever single aggregate-like field is available.
  return Math.max(
    0,
    firstNumber(
      item.matchedQuantity,
      item.reservedQuantity,
      item.fulfilledQuantity,
      item.quantityFulfilled,
    ),
  );
};

const remainingQuantity = (item) => {
  const direct = [item.remainingQuantity, item.quantityRemaining].find(
    (value) => value !== undefined && value !== null && value !== "" && Number.isFinite(Number(value)),
  );

  return Math.max(
    0,
    direct !== undefined
      ? Number(direct)
      : Number(item.quantity || 0) - currentAllocated(item),
  );
};

const demandStatus = (item) => {
  const requested = Math.max(0, Number(item.quantity || 0));
  const allocated = currentAllocated(item);

  if (requested > 0 && allocated >= requested) return "fulfilled";
  if (allocated > 0) return "partially_fulfilled";
  return "open";
};

const demandStatusLabel = (item) =>
  demandStatus(item) === "partially_fulfilled"
    ? "Partially fulfilled"
    : demandStatus(item) === "fulfilled"
      ? "Fulfilled"
      : "Open request";

const statusClass = (status) => ({ proposed: "border-amber-200 bg-amber-50 text-amber-800", reserved: "border-emerald-200 bg-emerald-50 text-emerald-800", committed: "border-emerald-200 bg-emerald-50 text-emerald-800", fulfilled: "border-sky-200 bg-sky-50 text-sky-800", rejected: "border-rose-200 bg-rose-50 text-rose-800", cancelled: "border-slate-200 bg-slate-100 text-slate-600", released: "border-slate-200 bg-slate-100 text-slate-600" }[status] || "border-slate-200 bg-slate-50 text-slate-700");

export default function FarmerDemand({ opportunities = false }) {
  const user = getStoredUser();
  const farmerId = user?._id || user?.id;
  const [items, setItems] = useState([]);
  const [lots, setLots] = useState([]);
  const [intents, setIntents] = useState([]);
  const [proposals, setProposals] = useState({});
  const [matches, setMatches] = useState({});
  const [checkedMatches, setCheckedMatches] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyKey, setBusyKey] = useState("");
  const [offerFor, setOfferFor] = useState(null);
  const [offerSource, setOfferSource] = useState("");
  const [offerQuantity, setOfferQuantity] = useState("");
  const [notice, setNotice] = useState("");

  const sources = useMemo(() => [
    ...lots.filter((lot) => lot.status === "available").map((lot) => ({ ...lot, sourceType: "lot", sourceId: lot._id, sourceLabel: "Spot supply", availableDate: lot.availableFrom, availableQuantity: lot.quantity })),
    ...intents.filter((intent) => intent.status === "available").map((intent) => ({ ...intent, sourceType: "supply_intent", sourceId: intent._id, sourceLabel: "Future intent", availableDate: intent.expectedHarvestDate, availableQuantity: intent.quantity })),
  ], [lots, intents]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [demandRes, lotRes, intentRes] = await Promise.all([
        getFarmerDemand(),
        farmerId ? getFarmerLots(farmerId) : Promise.resolve({ lots: [] }),
        farmerId ? getFarmerSupplyIntents(farmerId) : Promise.resolve({ supplyIntents: [] }),
      ]);
      const demandItems = Array.isArray(demandRes?.data) ? demandRes.data : Array.isArray(demandRes?.requests) ? demandRes.requests : Array.isArray(demandRes?.procurementRequests) ? demandRes.procurementRequests : [];
      const openItems = demandItems.filter(
        (item) =>
          ["open", "partially_fulfilled"].includes(item.status) &&
          !hasPassedRequiredBy(item.requiredBy),
      );
      setItems(openItems);
      setLots(Array.isArray(lotRes?.lots) ? lotRes.lots : Array.isArray(lotRes?.data) ? lotRes.data : Array.isArray(lotRes) ? lotRes : []);
      setIntents(Array.isArray(intentRes?.supplyIntents) ? intentRes.supplyIntents : Array.isArray(intentRes?.data) ? intentRes.data : Array.isArray(intentRes) ? intentRes : []);
      // Matching is intentionally user-triggered: every eligible demand keeps
      // its Check match button until the farmer explicitly checks it.
      setMatches({});
      setCheckedMatches({});
      if (farmerId) {
        const pairs = await Promise.all(openItems.map(async (item) => {
          try {
            const res = await getFarmerAllocations(farmerId, { procurementRequest: item._id });
            const rows = Array.isArray(res?.allocations) ? res.allocations : Array.isArray(res?.data) ? res.data : [];
            return [item._id, rows.filter((row) => (row.initiatedBy || "buyer") === "farmer")];
          } catch { return [item._id, []]; }
        }));
        setProposals(Object.fromEntries(pairs));
      }
    } catch (e) {
      setError(e.message || "Unable to load buyer demand and your supply.");
    } finally { setLoading(false); }
  }, [farmerId]);

  useEffect(() => { load(); }, [load]);

  const inspectMatches = async (item) => {
    setBusyKey(`matches:${item._id}`); setError("");
    try {
      const res = await getFarmerDemandMatches(item._id);
      const rows = Array.isArray(res?.matches) ? res.matches : Array.isArray(res?.data?.matches) ? res.data.matches : [];
      setMatches((old) => ({ ...old, [item._id]: rows }));
      setCheckedMatches((old) => ({ ...old, [item._id]: true }));
    } catch (e) { setError(e.message || "Unable to load matching supply opportunities."); }
    finally { setBusyKey(""); }
  };

  const openOffer = (item, match = null) => {
    const defaultSource = match ? sources.find((source) => source.sourceType === match.sourceType && String(source.sourceId) === String(match.sourceId)) : null;
    setOfferFor(item);
    setOfferSource(defaultSource ? `${defaultSource.sourceType}:${defaultSource.sourceId}` : "");
    setOfferQuantity(match?.availableQuantity ? String(match.availableQuantity) : "");
    setNotice(""); setError("");
  };

  const submitOffer = async (event) => {
    event.preventDefault();
    if (!offerFor || !offerSource) { setError("Choose one of your available supply listings first."); return; }
    const source = sources.find((row) => `${row.sourceType}:${row.sourceId}` === offerSource);
    const quantity = Number(offerQuantity);
    if (!source || !Number.isFinite(quantity) || quantity <= 0) { setError("Enter a valid offer quantity."); return; }
    if (source.unit !== offerFor.unit) { setError(`This supply uses ${source.unit}; the buyer requested ${offerFor.unit}. Choose a compatible listing.`); return; }
    if (quantity > Number(source.availableQuantity || 0)) { setError("Offer quantity cannot exceed the supply quantity shown."); return; }
    setBusyKey(`offer:${offerFor._id}`); setError("");
    try {
      const res = await createFarmerOffer(offerFor._id, { sourceType: source.sourceType, sourceId: source.sourceId, quantity, unit: source.unit });
      setNotice(res?.message || "Offer sent to the buyer for review.");
      setOfferFor(null);
      await load();
    } catch (e) { setError(e.message || "Unable to send the offer."); }
    finally { setBusyKey(""); }
  };



  return <div className="space-y-7">
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">Farmer workspace</p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">{opportunities ? "Market opportunities" : "Buyer demand"}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Review open buyer requirements, compare compatible supply, and send a partial or complete offer from your own listings.</p>
          </div>
      <button onClick={load} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50">Refresh demand</button>
    </header>
    {error && <Alert>{error}</Alert>}{notice && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</div>}
    {loading ? <div className="rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center text-sm text-slate-500">Loading buyer requirements and your supply…</div> : items.length === 0 ? <div className="rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center">
          <h2 className="font-semibold text-slate-900">No open buyer requirements</h2>
          <p className="mt-2 text-sm text-slate-500">New open or partially fulfilled requests will appear here.</p>
          </div> : <div className="space-y-5">{items.map((item) => {
      const itemProposals = proposals[item._id] || [];
      const hasRejected = itemProposals.some((proposal) => proposal.status === "rejected");
      const activeOffer = itemProposals.some((proposal) => !["rejected", "cancelled", "released"].includes(proposal.status));
      const matchRows = matches[item._id];
      return <section key={item._id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="p-5 sm:p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-xl font-bold text-slate-950">{item.crop}{item.variety ? ` · ${item.variety}` : ""}</h2>
          <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">{demandStatusLabel(item)}</span>
          </div>
          <p className="mt-1 text-sm text-slate-500">Buyer: {item.buyer?.name || "Buyer account"} · {item.demandType || "Procurement request"}</p>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">A farmer-originated offer can cover part or all of the remaining demand. The buyer must accept it before it becomes a reserved slot.</p>
          </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:min-w-[520px]">
          <Metric label="Requested quantity" value={`${fmt(item.quantity)} ${item.unit}`} />
          <Metric label="Currently allocated" value={`${fmt(currentAllocated(item))} ${item.unit}`} />
          <Metric label="Remaining quantity" value={`${fmt(remainingQuantity(item))} ${item.unit}`} />
          <Metric label="Available from" value={date(item.availabilityFrom)} />
          <Metric label="Required by" value={date(item.requiredBy)} />
          </div>
          </div>
          {!hasRejected && <div className="mt-5 flex flex-wrap gap-2">
          <button disabled={busyKey === `matches:${item._id}`} onClick={() => inspectMatches(item)} className="rounded-xl border border-emerald-900 px-4 py-2.5 text-sm font-semibold text-emerald-900 hover:bg-emerald-50 disabled:opacity-50">{busyKey === `matches:${item._id}` ? "Checking matches…" : checkedMatches[item._id] ? "Check match again" : "Check match"}</button>{checkedMatches[item._id] && Array.isArray(matchRows) && matchRows.length > 0 && !activeOffer && <button onClick={() => openOffer(item)} className="rounded-xl bg-emerald-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-950">Send offer</button>}</div>}
          {hasRejected && <p className="mt-4 text-sm font-medium text-rose-700">A proposal for this demand was rejected. New matching and offer actions are disabled.</p>}
          {checkedMatches[item._id] && Array.isArray(matchRows) && matchRows.length === 0 && !hasRejected && <p className="mt-4 text-sm text-slate-500">No matching supply is available for this demand right now. You can check again after updating your supply.</p>}
          {checkedMatches[item._id] && Array.isArray(matchRows) && matchRows.length > 0 && <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between gap-3">
          <h3 className="font-semibold text-slate-900">Available supply opportunities</h3>
          <span className="text-xs text-slate-500">{matchRows.length} found</span>
          </div>
          <div className="mt-3 space-y-3">{matchRows.map((match, index) => { const source = sources.find((row) => row.sourceType === match.sourceType && String(row.sourceId) === String(match.sourceId)); return <div key={`${match.sourceType}:${match.sourceId}:${index}`} className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
          <p className="font-semibold text-slate-900">{match.crop}{match.variety ? ` · ${match.variety}` : ""}</p>
          <p className="mt-1 text-sm text-slate-500">{match.sourceType === "lot" ? "Spot supply" : "Future intent"} · {fmt(match.availableQuantity)} {match.unit} available · {date(match.availableFrom)}</p>
          </div>{!hasRejected && !activeOffer && source && <button onClick={() => openOffer(item, match)} className="rounded-xl bg-emerald-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-950">Offer this supply</button>}</div>; })}</div>
          </div>}
          <div className="mt-5 border-t border-slate-100 pt-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-semibold text-slate-900">Your proposals to this buyer</h3>
          <span className="text-xs text-slate-500">{itemProposals.length} proposal{itemProposals.length === 1 ? "" : "s"}</span>
          </div>{itemProposals.length === 0 ? <p className="mt-3 text-sm text-slate-500">You have not sent a supply offer for this demand yet.</p> : <div className="mt-3 space-y-3">{itemProposals.map((proposal) => <div key={proposal._id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold text-slate-900">{fmt(proposal.allocatedQuantity)} {proposal.unit} · {proposal.sourceType === "lot" ? "Spot supply" : "Future intent"}</p>
          <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass(proposal.status)}`}>{statusLabel(proposal.status)}</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">Sent {date(proposal.createdAt || proposal.allocatedAt)} · Reference {String(proposal._id).slice(-7)}</p>
          </div>
          </div>)}</div>}</div>
        </div>
      </section>;
    })}</div>}
    {offerFor && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !busyKey) setOfferFor(null); }}>
          <div role="dialog" aria-modal="true" aria-labelledby="farmer-offer-title" className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
          <div className="flex items-start justify-between gap-4">
          <div>
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-emerald-700">Farmer-originated offer</p>
          <h2 id="farmer-offer-title" className="mt-2 text-2xl font-bold text-slate-950">Offer supply to buyer</h2>
          <p className="mt-2 text-sm text-slate-500">{offerFor.crop}{offerFor.variety ? ` · ${offerFor.variety}` : ""} · Demand {fmt(offerFor.quantity)} {offerFor.unit}</p>
          </div>
          <button onClick={() => setOfferFor(null)} className="rounded-lg px-2 py-1 text-sm font-semibold text-slate-500 hover:bg-slate-100">Close</button>
          </div>
          <form onSubmit={submitOffer} className="mt-6 space-y-5">
          <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">Your supply listing</span>
          <select value={offerSource} onChange={(event) => { setOfferSource(event.target.value); const source = sources.find((row) => `${row.sourceType}:${row.sourceId}` === event.target.value); setOfferQuantity(source ? String(Math.min(Number(source.availableQuantity || 0), Number(offerFor.quantity || 0))) : ""); }} required className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-700"> <option value="">Choose available supply</option>{sources.filter((source) => source.unit === offerFor.unit && String(source.crop).toLowerCase() === String(offerFor.crop).toLowerCase() && (!offerFor.variety || String(source.variety || "").toLowerCase() === String(offerFor.variety).toLowerCase())).map((source) => <option key={`${source.sourceType}:${source.sourceId}`} value={`${source.sourceType}:${source.sourceId}`}>{source.sourceLabel} · {source.crop}{source.variety ? ` · ${source.variety}` : ""} · {fmt(source.availableQuantity)} {source.unit} available</option>)}</select>
          <span className="mt-1 block text-xs text-slate-500">Only your own available supply is listed. Crop, variety and unit must be compatible.</span>
          </label>
          <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">Offer quantity ({offerFor.unit})</span>
          <input type="number" min="0.01" step="any" max={sources.find((source) => `${source.sourceType}:${source.sourceId}` === offerSource)?.availableQuantity || undefined} value={offerQuantity} onChange={(event) => setOfferQuantity(event.target.value)} required className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-700"/>
          <span className="mt-1 block text-xs text-slate-500">You can offer less than the buyer requested; the buyer decides whether to accept it.</span>
          </label>
          <div className="rounded-xl bg-amber-50 p-4 text-sm leading-6 text-amber-900">Sending this offer does not reserve the supply yet. It becomes a reserved slot only after the buyer accepts it.</div>
          <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
          <button type="button" onClick={() => setOfferFor(null)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700">Cancel</button>
          <button type="submit" disabled={!!busyKey || !offerSource} className="rounded-xl bg-emerald-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-950 disabled:opacity-50">{busyKey === `offer:${offerFor._id}` ? "Sending…" : "Send offer"}</button>
          </div>
          </form>
          </div>
          </div>}
  </div>;
}
function Metric({ label, value }) { return <div className="rounded-xl bg-slate-50 px-3 py-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
          <p className="mt-1 text-sm font-semibold text-slate-800">{value}</p>
          </div>; }
function Alert({ children }) { return <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{children}</div>; }
 