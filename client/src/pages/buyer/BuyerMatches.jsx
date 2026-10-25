import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "../../api/api";
import {
  getBuyerAllocations,
  getBuyerMatches,
  getBuyerRequirements,
} from "../../api/buyerApi";

const date = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const fmt = (value) =>
  new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const rowsFrom = (response, keys) => {
  for (const key of keys) {
    if (Array.isArray(response?.[key])) return response[key];
  }
  return Array.isArray(response) ? response : [];
};

const consumingStatuses = ["reserved", "committed", "fulfilled"];

const statusLabel = (status) =>
  String(status || "unknown").replaceAll("_", " ");

function allocationQuantity(items, statuses) {
  return items
    .filter((item) => statuses.includes(item.status))
    .reduce((total, item) => total + Number(item.allocatedQuantity || 0), 0);
}

export default function BuyerMatches() {
  const [requirements, setRequirements] = useState([]);
  const [allocationsByRequirement, setAllocationsByRequirement] = useState({});
  const [matchesByRequirement, setMatchesByRequirement] = useState({});
  const [checkedMatches, setCheckedMatches] = useState({});
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState("");
  const [sending, setSending] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [cropModal, setCropModal] = useState(null);
  const [cropLoading, setCropLoading] = useState(false);
  const [cropError, setCropError] = useState("");
  const [offerModal, setOfferModal] = useState(null);
  const [offerQuantity, setOfferQuantity] = useState("");
  const [offerError, setOfferError] = useState("");

  const loadAllocations = useCallback(async (requirementId) => {
    if (!requirementId) return [];
    const response = await getBuyerAllocations({
      procurementRequest: requirementId,
    });
    const items = rowsFrom(response, ["allocations", "data"]).filter(
      (item) =>
        String(item.procurementRequest?._id || item.procurementRequest) ===
        String(requirementId)
    );
    setAllocationsByRequirement((current) => ({
      ...current,
      [requirementId]: items,
    }));
    return items;
  }, []);

  const loadRequirements = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getBuyerRequirements();
      const all = rowsFrom(response, ["data", "requests", "procurementRequests"]);
      // Only open requirements whose deadline has not passed are candidates.
      // Keep the deadline date itself available through the end of that day.
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const openRequirements = all
        .filter((item) => ["open", "partially_fulfilled"].includes(item.status))
        .filter((item) => {
          if (!item.requiredBy) return true;
          const deadline = new Date(item.requiredBy);
          if (Number.isNaN(deadline.getTime())) return true;
          deadline.setHours(0, 0, 0, 0);
          return deadline >= today;
        })
        .sort(
          (a, b) =>
            new Date(a.createdAt || 0).getTime() -
            new Date(b.createdAt || 0).getTime()
        );

      const allocationResults = await Promise.all(
        openRequirements.map(async (item) => {
          try {
            const result = await getBuyerAllocations({
              procurementRequest: item._id,
            });
            const items = rowsFrom(result, ["allocations", "data"]).filter(
              (allocation) =>
                String(
                  allocation.procurementRequest?._id ||
                    allocation.procurementRequest
                ) === String(item._id)
            );
            return [item._id, items];
          } catch {
            return [item._id, []];
          }
        })
      );

      const allocationsMap = Object.fromEntries(allocationResults);
      setAllocationsByRequirement(allocationsMap);

      // Hide requirements with no remaining quantity after both accepted
      // allocations and pending proposals are accounted for.
      const availableRequirements = openRequirements.filter((item) => {
        const allocations = allocationsMap[item._id] || [];
        const allocated = allocationQuantity(allocations, consumingStatuses);
        const proposed = allocationQuantity(allocations, ["proposed"]);
        return Number(item.quantity || 0) - allocated - proposed > 0;
      });
      setRequirements(availableRequirements);
    } catch (err) {
      setError(err.message || "Unable to load requirements.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRequirements();
  }, [loadRequirements]);

  async function checkMatching(requirement) {
    const id = requirement._id;
    try {
      setChecking(id);
      setError("");
      setMessage("");
      const response = await getBuyerMatches(id);
      setMatchesByRequirement((current) => ({
        ...current,
        [id]: rowsFrom(response, ["matches"]),
      }));
      setCheckedMatches((current) => ({ ...current, [id]: true }));
    } catch (err) {
      setError(err.message || `Unable to check matching supply for ${requirement.crop}.`);
    } finally {
      setChecking("");
    }
  }

  async function viewCropDetails(match) {
    setCropModal({ match, source: null });
    setCropError("");
    setCropLoading(true);
    try {
      const endpoint =
        match.sourceType === "lot"
          ? `/lots/${match.sourceId}`
          : `/supply-intents/${match.sourceId}`;
      const response = await apiRequest(endpoint);
      const source =
        response?.data || response?.lot || response?.supplyIntent || response;
      setCropModal({ match, source });
    } catch (err) {
      setCropError(err.message || "Unable to load crop details.");
    } finally {
      setCropLoading(false);
    }
  }

  function openOffer(requirement, match, remainingQuantity) {
    setOfferModal({ requirement, match, remainingQuantity });
    setOfferError("");
    const maximum = Math.min(
      Number(match.availableQuantity || 0),
      remainingQuantity
    );
    setOfferQuantity(maximum > 0 ? String(maximum) : "");
  }

  async function sendProposal(event) {
    event.preventDefault();
    if (!offerModal) return;

    const { requirement, match, remainingQuantity } = offerModal;
    const quantity = Number(offerQuantity);
    const maxQuantity = Math.min(
      Number(match.availableQuantity || 0),
      remainingQuantity
    );

    if (!Number.isFinite(quantity) || quantity <= 0) {
      setOfferError("Enter a quantity greater than zero.");
      return;
    }
    if (quantity > maxQuantity) {
      setOfferError(`You can propose up to ${fmt(maxQuantity)} ${match.unit}.`);
      return;
    }
    if (!match.farmer) {
      setOfferError("The farmer information is missing for this supply.");
      return;
    }

    const key = `${requirement._id}:${match.sourceType}:${match.sourceId}`;
    try {
      setSending(key);
      setOfferError("");
      setError("");
      await apiRequest("/allocations", {
        method: "POST",
        body: JSON.stringify({
          procurementRequestId: requirement._id,
          farmerId: match.farmer._id || match.farmer,
          sourceType: match.sourceType,
          sourceId: match.sourceId,
          quantity,
          unit: match.unit,
        }),
      });
      setMessage("Proposal sent to the farmer. The quantity will be reserved only after the farmer approves it.");
      setOfferModal(null);
      await loadAllocations(requirement._id);
    } catch (err) {
      setOfferError(err.message || "Unable to send the proposal.");
    } finally {
      setSending("");
    }
  }

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-8 text-sm text-slate-500">
        Loading buyer requirements…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">
            Smart matching
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">Matched supply</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            Review each buyer requirement, check compatible farmer supply, and send a proposal for the farmer to review.
          </p>
        </div>
        <button
          type="button"
          onClick={loadRequirements}
          className="self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 sm:self-auto"
        >
          Refresh requirements
        </button>
      </header>

      {message && (
        <div role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          {message}
        </div>
      )}
      {error && (
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {requirements.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <h2 className="text-lg font-bold text-slate-900">No open requirements</h2>
          <p className="mt-2 text-sm text-slate-500">
            Open or partially fulfilled buyer requirements will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {requirements.map((requirement) => {
            const id = requirement._id;
            const allocations = allocationsByRequirement[id] || [];
            const allocated = allocationQuantity(allocations, consumingStatuses);
            const proposed = allocationQuantity(allocations, ["proposed"]);
            const remaining = Math.max(
              0,
              Number(requirement.quantity || 0) - allocated - proposed
            );
            const checked = Boolean(checkedMatches[id]);
            const allMatches = matchesByRequirement[id] || [];
            const existingSources = new Set(
              allocations
                .filter((item) =>
                  ["proposed", ...consumingStatuses].includes(item.status)
                )
                .map((item) => `${item.sourceType}:${item.sourceId}`)
            );
            const matches = allMatches.filter(
              (match) => !existingSources.has(`${match.sourceType}:${match.sourceId}`)
            );

            return (
              <article key={id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="grid gap-5 lg:grid-cols-[1.15fr_1fr]">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-bold text-slate-950">
                        {requirement.crop || "Crop"}
                        {requirement.variety ? ` · ${requirement.variety}` : ""}
                      </h2>
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold capitalize text-emerald-800">
                        {statusLabel(requirement.status)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-500">
                      {requirement.buyer?.name || requirement.buyerName
                        ? `Buyer: ${requirement.buyer?.name || requirement.buyerName} · `
                        : ""}
                      {requirement.demandType || "spot"} demand
                    </p>
                    {requirement.description && (
                      <p className="mt-3 text-sm leading-6 text-slate-600">
                        {requirement.description}
                      </p>
                    )}
                    <div className="mt-5 flex flex-wrap gap-3 text-sm">
                      <span className="rounded-lg bg-slate-50 px-3 py-2 text-slate-600">
                        Required by <strong className="text-slate-900">{date(requirement.requiredBy)}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <Metric label="Requested quantity" value={`${fmt(requirement.quantity)} ${requirement.unit || ""}`} />
                    <Metric label="Currently allocated" value={`${fmt(allocated)} ${requirement.unit || ""}`} />
                    <Metric label="Remaining quantity" value={`${fmt(remaining)} ${requirement.unit || ""}`} />
                    <div className="sm:col-span-3">
                      <button
                        type="button"
                        disabled={checking === id || remaining <= 0}
                        onClick={() => checkMatching(requirement)}
                        className="w-full rounded-xl bg-emerald-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                      >
                        {checking === id ? "Checking…" : "Check match"}
                      </button>
                      {remaining <= 0 && (
                        <p className="mt-2 text-xs text-slate-500">
                          This requirement has no remaining quantity available for new proposals.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {checked && (
                  <section className="mt-6 border-t border-slate-100 pt-5">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-base font-bold text-slate-950">Compatible supply</h3>
                      <span className="text-xs text-slate-500">
                        {matches.length} available option{matches.length === 1 ? "" : "s"}
                      </span>
                    </div>
                    {matches.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
                        No new compatible supply is available for this requirement right now. You can check again later.
                      </div>
                    ) : (
                      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {matches.map((match) => {
                          const matchKey = `${id}:${match.sourceType}:${match.sourceId}`;
                          return (
                            <div key={matchKey} className="rounded-2xl border border-slate-200 p-4">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                                    {match.sourceType === "lot" ? "Spot supply" : "Future supply"}
                                  </p>
                                  <h4 className="mt-1 font-bold text-slate-950">
                                    {match.crop || requirement.crop}
                                    {match.variety ? ` · ${match.variety}` : ""}
                                  </h4>
                                </div>
                                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                                  Compatible
                                </span>
                              </div>
                              <p className="mt-2 text-sm text-slate-500">
                                Farmer: {match.farmer?.name || match.farmerName || "Farmer listing"}
                              </p>
                              <div className="mt-4 grid grid-cols-2 gap-3">
                                <Metric label="Available" value={`${fmt(match.availableQuantity)} ${match.unit || ""}`} />
                                <Metric label="Available from" value={date(match.availableFrom)} />
                              </div>
                              <div className="mt-4 flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => viewCropDetails(match)}
                                  className="rounded-xl border border-emerald-800 px-3 py-2 text-sm font-semibold text-emerald-900 hover:bg-emerald-50"
                                >
                                  View crop details
                                </button>
                                <button
                                  type="button"
                                  disabled={remaining <= 0 || Number(match.availableQuantity || 0) <= 0}
                                  onClick={() => openOffer(requirement, match, remaining)}
                                  className="rounded-xl bg-emerald-900 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  Send proposal
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </section>
                )}

                <section className="mt-6 border-t border-slate-100 pt-5">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-base font-bold text-slate-950">
                      Your proposals to farmers
                    </h3>
                    <span className="text-xs text-slate-500">
                      {allocations.length} proposal{allocations.length === 1 ? "" : "s"} / allocation record{allocations.length === 1 ? "" : "s"}
                    </span>
                  </div>
                  {allocations.length === 0 ? (
                    <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                      You haven’t sent a proposal for this requirement yet.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {allocations.map((item) => (
                        <div key={item._id} className="flex flex-col gap-2 rounded-2xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="font-semibold text-slate-900">
                              {fmt(item.allocatedQuantity)} {item.unit || requirement.unit || ""}
                              {item.sourceType ? ` · ${item.sourceType === "lot" ? "Spot supply" : "Future supply"}` : ""}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              Farmer: {item.farmer?.name || item.farmerName || "Farmer"} · Sent {date(item.createdAt)}
                            </p>
                          </div>
                          <span className={`w-fit rounded-full px-3 py-1 text-xs font-bold capitalize ${
                            item.status === "proposed"
                              ? "bg-amber-50 text-amber-800"
                              : ["reserved", "committed", "fulfilled"].includes(item.status)
                              ? "bg-emerald-50 text-emerald-800"
                              : "bg-slate-100 text-slate-700"
                          }`}>
                            {statusLabel(item.status)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </article>
            );
          })}
        </div>
      )}

      {cropModal && (
        <Modal title="Crop details" onClose={() => setCropModal(null)}>
          {cropLoading ? (
            <p className="py-8 text-center text-sm text-slate-500">Loading crop details…</p>
          ) : cropError ? (
            <Alert>{cropError}</Alert>
          ) : cropModal.source ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <Detail label="Crop" value={cropModal.source.crop || cropModal.match.crop || "—"} />
                <Detail label="Variety" value={cropModal.source.variety || "—"} />
                <Detail label="Quantity" value={`${fmt(cropModal.source.quantity ?? cropModal.source.expectedQuantity ?? cropModal.match.availableQuantity)} ${cropModal.source.unit || cropModal.match.unit || ""}`} />
                <Detail label="Expected price" value={cropModal.source.expectedPrice != null ? `₹${fmt(cropModal.source.expectedPrice)}` : "Not specified"} />
                <Detail label="Quality" value={cropModal.source.qualityGrade || cropModal.source.qualityExpectation || "—"} />
                <Detail label="Available / harvest date" value={date(cropModal.source.availableFrom || cropModal.source.expectedHarvestDate)} />
                <Detail label="Harvest date" value={date(cropModal.source.harvestDate)} />
                <Detail label="Location" value={[cropModal.source.location?.village, cropModal.source.location?.district, cropModal.source.location?.state].filter(Boolean).join(", ") || "—"} />
                <Detail label="Farmer" value={cropModal.source.farmer?.name || cropModal.match.farmer?.name || String(cropModal.match.farmer || "—")} />
              </div>
              {Array.isArray(cropModal.source.images) && cropModal.source.images.length > 0 ? (
                <div className="mt-5">
                  <h3 className="mb-3 text-sm font-bold text-slate-800">Crop images</h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {cropModal.source.images.map((image, index) => (
                      <a key={`${image}-${index}`} href={image} target="_blank" rel="noreferrer" className="overflow-hidden rounded-2xl border border-slate-200">
                        <img src={image} alt={`${cropModal.source.crop || "Crop"} ${index + 1}`} className="h-52 w-full object-cover" loading="lazy" />
                      </a>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No images are attached to this listing.</p>
              )}
            </>
          ) : (
            <p className="text-sm text-slate-500">Crop details are unavailable.</p>
          )}
        </Modal>
      )}

      {offerModal && (
        <Modal title="Send proposal to farmer" onClose={() => setOfferModal(null)}>
          <p className="text-sm text-slate-600">
            {offerModal.match.crop || offerModal.requirement.crop}
            {offerModal.match.variety ? ` · ${offerModal.match.variety}` : ""}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Available: {fmt(offerModal.match.availableQuantity)} {offerModal.match.unit}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Remaining requirement: {fmt(offerModal.remainingQuantity)} {offerModal.requirement.unit}
          </p>
          {offerError && <Alert>{offerError}</Alert>}
          <form onSubmit={sendProposal} className="mt-5 space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Quantity to propose ({offerModal.match.unit})
              </span>
              <input
                type="number"
                min="0.01"
                max={Math.min(Number(offerModal.match.availableQuantity || 0), offerModal.remainingQuantity)}
                step="any"
                required
                value={offerQuantity}
                onChange={(event) => setOfferQuantity(event.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-700"
              />
            </label>
            <p className="text-xs text-slate-500">
              Sending a proposal does not reserve the crop. The farmer must approve it first.
            </p>
            <div className="flex flex-wrap justify-end gap-2">
              <button type="button" onClick={() => setOfferModal(null)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600">
                Cancel
              </button>
              <button type="submit" disabled={Boolean(sending)} className="rounded-xl bg-emerald-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50">
                {sending ? "Sending…" : "Submit proposal"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-bold text-slate-900">{value}</p>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-semibold text-slate-900">
        {value}
      </p>
    </div>
  );
}

function Alert({ children }) {
  return (
    <div
      role="alert"
      className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
    >
      {children}
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 sm:p-6"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl sm:p-6"
      >
        <header className="mb-5 flex items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-slate-950">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-full border border-slate-200 px-3 py-1.5 text-lg text-slate-500 hover:bg-slate-50"
          >
            ×
          </button>
        </header>

        {children}
      </section>
    </div>
  );
}