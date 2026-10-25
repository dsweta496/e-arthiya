import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../../api/api";
import {
  cancelBuyerRequirement,
  getBuyerAllocations,
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

const readable = (value) => String(value || "—").replaceAll("_", " ");

function getRows(response, keys = ["data", "allocations"]) {
  for (const key of keys) {
    if (Array.isArray(response?.[key])) return response[key];
  }
  return Array.isArray(response) ? response : [];
}

function getSourceName(source) {
  return source?.crop || source?.name || "Crop details";
}

export default function BuyerRequirements() {
  const [requirements, setRequirements] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [proposalRequirement, setProposalRequirement] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [proposalLoading, setProposalLoading] = useState(false);
  const [proposalBusy, setProposalBusy] = useState("");
  const [proposalError, setProposalError] = useState("");

  const [cropDetails, setCropDetails] = useState(null);
  const [cropLoading, setCropLoading] = useState(false);
  const [cropError, setCropError] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getBuyerRequirements();
      setRequirements(getRows(response));
    } catch (err) {
      setError(err.message || "Unable to load requirements.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(() => {
    const filtered =
      filter === "all"
        ? requirements
        : requirements.filter((item) => item.status === filter);

    return [...filtered].sort((a, b) => {
      const aTime = new Date(a.createdAt || 0).getTime();
      const bTime = new Date(b.createdAt || 0).getTime();
      return aTime - bTime || String(a._id).localeCompare(String(b._id));
    });
  }, [requirements, filter]);

  async function cancel(id) {
    if (!window.confirm("Cancel this procurement requirement?")) return;

    try {
      setBusy(id);
      setError("");
      await cancelBuyerRequirement(id);
      setMessage("Requirement cancelled.");
      await load();
    } catch (err) {
      setError(err.message || "Unable to cancel requirement.");
    } finally {
      setBusy("");
    }
  }

  async function openProposals(requirement) {
    setProposalRequirement(requirement);
    setProposals([]);
    setProposalError("");
    setProposalLoading(true);

    try {
      const response = await getBuyerAllocations({
        procurementRequest: requirement._id,
      });

      const all = getRows(response, ["allocations", "data"]);

      setProposals(
        all.filter(
          (allocation) =>
            String(
              allocation.procurementRequest?._id ||
              allocation.procurementRequest
            ) === String(requirement._id)
        )
      );
    } catch (err) {
      setProposalError(
        err.message || "Unable to load allocation requests."
      );
    } finally {
      setProposalLoading(false);
    }
  }

  async function decideProposal(proposal, decision) {
    const actionLabel = decision === "accept-offer" ? "accept" : "reject";

    if (
      !window.confirm(
        `Are you sure you want to ${actionLabel} this farmer's proposal?`
      )
    ) {
      return;
    }

    try {
      setProposalBusy(proposal._id);
      setProposalError("");
      setError("");

      const response = await apiRequest(
        `/allocations/${proposal._id}/${decision}`,
        { method: "PATCH" }
      );

      setMessage(
        response?.message ||
        (decision === "accept-offer"
          ? "Farmer proposal accepted."
          : "Farmer proposal rejected.")
      );

      // Refresh pending proposals after the decision.
      const updated = await getBuyerAllocations({
        procurementRequest: proposalRequirement._id,
        status: "proposed",
      });

      setProposals(
        getRows(updated, ["allocations", "data"]).filter(
          (item) =>
            item.status === "proposed" &&
            item.initiatedBy === "farmer" &&
            String(
              item.procurementRequest?._id || item.procurementRequest
            ) === String(proposalRequirement._id)
        )
      );

      await load();
    } catch (err) {
      setProposalError(err.message || `Unable to ${actionLabel} proposal.`);
    } finally {
      setProposalBusy("");
    }
  }

  async function openCropDetails(proposal) {
    setCropDetails({ proposal, source: null });
    setCropError("");
    setCropLoading(true);

    try {
      const endpoint =
        proposal.sourceType === "lot"
          ? `/lots/${proposal.sourceId}`
          : `/supply-intents/${proposal.sourceId}`;

      const response = await apiRequest(endpoint);
      const source =
        response?.data ||
        response?.lot ||
        response?.supplyIntent ||
        response;

      setCropDetails({ proposal, source });
    } catch (err) {
      setCropError(err.message || "Unable to load crop details.");
    } finally {
      setCropLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">
            Buyer workspace
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-950">
            My requirements
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            View every requirement from oldest to newest, review
            farmer-initiated proposals, and manage your sourcing needs.
          </p>
        </div>

        <Link
          to="/buyer/requirements/add"
          className="inline-flex items-center justify-center rounded-xl bg-emerald-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
        >
          + Post requirement
        </Link>
      </header>

      {message && (
        <div
          role="status"
          className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
        >
          {message}
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {[
          "all",
          "open",
          "partially_fulfilled",
          "fulfilled",
          "cancelled",
          "reserved",
        ].map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setFilter(item)}
            className={`rounded-full px-4 py-2 text-sm font-semibold capitalize transition ${filter === item
              ? "bg-emerald-900 text-white"
              : "border border-slate-200 bg-white text-slate-600 hover:border-emerald-300"
              }`}
          >
            {item === "all" ? "All" : readable(item)}
          </button>
        ))}
      </div>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="p-8 text-sm text-slate-500">
            Loading requirements…
          </div>
        ) : visible.length === 0 ? (
          <div className="p-10 text-center">
            <p className="font-semibold text-slate-800">
              No requirements in this view
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Post a requirement to start sourcing produce from farmers.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {visible.map((item) => (
              <article key={item._id} className="p-5 sm:p-6">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-bold text-slate-950">
                        {item.crop}
                      </h2>

                      {item.variety && (
                        <span className="text-sm text-slate-500">
                          · {item.variety}
                        </span>
                      )}

                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold capitalize text-slate-600">
                        {readable(item.status)}
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-slate-700">
                      {item.quantity} {item.unit} ·{" "}
                      {readable(item.demandType)} demand
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Created {date(item.createdAt)} · Available from{" "}
                      {date(item.availabilityFrom)} · Required by{" "}
                      {date(item.requiredBy)}
                    </p>

                    {item.qualityRequirement && (
                      <p className="mt-2 text-sm text-slate-600">
                        Quality: {item.qualityRequirement}
                      </p>
                    )}

                    {item.location && (
                      <p className="mt-1 text-sm text-slate-500">
                        Location:{" "}
                        {[
                          item.location.village,
                          item.location.district,
                          item.location.state,
                        ]
                          .filter(Boolean)
                          .join(", ") || "—"}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 xl:max-w-[430px] xl:justify-end">
                    <button
                      type="button"
                      onClick={() => openProposals(item)}
                      className="rounded-xl border border-emerald-800 px-4 py-2.5 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-50"
                    >
                      Open all proposals
                    </button>

                    {!["cancelled", "fulfilled", "reserved"].includes(
                      item.status
                    ) && (
                        <button
                          type="button"
                          disabled={busy === item._id}
                          onClick={() => cancel(item._id)}
                          className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-red-200 hover:text-red-700 disabled:opacity-50"
                        >
                          {busy === item._id ? "Cancelling…" : "Cancel"}
                        </button>
                      )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {proposalRequirement && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 sm:p-6"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setProposalRequirement(null);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="proposals-title"
            className="max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl"
          >
            <header className="flex items-start justify-between gap-4 border-b border-slate-100 p-5 sm:p-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-emerald-700">
                  Farmer proposals
                </p>

                <h2
                  id="proposals-title"
                  className="mt-1 text-xl font-bold text-slate-950"
                >
                  {proposalRequirement.crop}
                  {proposalRequirement.variety
                    ? ` · ${proposalRequirement.variety}`
                    : ""}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Requirement: {proposalRequirement.quantity}{" "}
                  {proposalRequirement.unit} · Required by{" "}
                  {date(proposalRequirement.requiredBy)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setProposalRequirement(null)}
                aria-label="Close proposals"
                className="rounded-full border border-slate-200 px-3 py-1.5 text-lg text-slate-500 hover:bg-slate-50"
              >
                ×
              </button>
            </header>

            <div className="max-h-[calc(90vh-100px)] overflow-y-auto p-5 sm:p-6">
              {proposalError && (
                <div
                  role="alert"
                  className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                >
                  {proposalError}
                </div>
              )}

              {proposalLoading ? (
                <p className="py-10 text-center text-sm text-slate-500">
                  Loading farmer proposals…
                </p>
              ) : proposals.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center">
                  <p className="font-semibold text-slate-800">
                    No pending farmer proposals
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Farmer-initiated proposals for this requirement will
                    appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {proposals.map((proposal) => (
                    <article
                      key={proposal._id}
                      className="rounded-2xl border border-slate-200 p-4 sm:p-5"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-bold text-slate-950">
                              {proposal.farmer?.name || "Farmer"}
                            </h3>

                            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold capitalize text-amber-800">
                              {readable(proposal.status)}
                            </span>
                          </div>

                          <p className="mt-2 text-sm text-slate-700">
                            Offered:{" "}
                            <strong>
                              {proposal.allocatedQuantity} {proposal.unit}
                            </strong>
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            Submitted {date(proposal.createdAt)} · Source:{" "}
                            {proposal.sourceType === "lot"
                              ? "Current crop listing"
                              : "Future supply"}
                          </p>

                          {proposal.farmer?.location && (
                            <p className="mt-1 text-sm text-slate-500">
                              Farmer location:{" "}
                              {typeof proposal.farmer.location === "string"
                                ? proposal.farmer.location
                                : [
                                  proposal.farmer.location.village,
                                  proposal.farmer.location.district,
                                  proposal.farmer.location.state,
                                ]
                                  .filter(Boolean)
                                  .join(", ") || "—"}
                            </p>
                          )}

                          <button
                            type="button"
                            onClick={() => openCropDetails(proposal)}
                            className="mt-3 text-sm font-semibold text-emerald-800 underline decoration-emerald-300 underline-offset-4 hover:text-emerald-950"
                          >
                            View crop details & images
                          </button>
                        </div>

                        {proposal.status === "proposed" ? (
                          <div className="flex shrink-0 flex-wrap gap-2">
                            <button
                              type="button"
                              disabled={proposalBusy === proposal._id}
                              onClick={() => decideProposal(proposal, "accept-offer")}
                              className="rounded-xl bg-emerald-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
                            >
                              {proposalBusy === proposal._id ? "Saving…" : "Accept"}
                            </button>

                            <button
                              type="button"
                              disabled={proposalBusy === proposal._id}
                              onClick={() => decideProposal(proposal, "reject")}
                              className="rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="inline-flex rounded-full bg-amber-50 px-3 py-2 text-sm font-semibold capitalize text-amber-800">
                            {readable(proposal.status)}
                          </span>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      {cropDetails && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 p-3 sm:p-6"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setCropDetails(null);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="crop-details-title"
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl"
          >
            <header className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white/95 p-4 backdrop-blur sm:p-5">
              <h2
                id="crop-details-title"
                className="text-lg font-bold text-slate-950"
              >
                Crop details & images
              </h2>

              <button
                type="button"
                onClick={() => setCropDetails(null)}
                aria-label="Close crop details"
                className="rounded-full border border-slate-200 px-3 py-1.5 text-lg text-slate-500 hover:bg-slate-50"
              >
                ×
              </button>
            </header>

            <div className="p-5 sm:p-6">
              {cropLoading ? (
                <p className="py-10 text-center text-sm text-slate-500">
                  Loading crop details…
                </p>
              ) : cropError ? (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                >
                  {cropError}
                </div>
              ) : cropDetails.source ? (
                <>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Detail
                      label="Crop"
                      value={getSourceName(cropDetails.source)}
                    />

                    <Detail
                      label="Variety"
                      value={cropDetails.source.variety || "—"}
                    />

                    <Detail
                      label="Available quantity"
                      value={`${cropDetails.source.quantity ?? cropDetails.source.expectedQuantity ?? "—"} ${cropDetails.source.unit || ""}`}
                    />

                    <Detail
                      label="Supply type"
                      value={readable(
                        cropDetails.source.supplyType ||
                        cropDetails.proposal.sourceType
                      )}
                    />

                    <Detail
                      label="Expected price"
                      value={
                        cropDetails.source.expectedPrice != null
                          ? `₹${Number(
                            cropDetails.source.expectedPrice
                          ).toLocaleString("en-IN")}`
                          : "Not specified"
                      }
                    />

                    <Detail
                      label="Quality"
                      value={
                        cropDetails.source.qualityGrade ||
                        cropDetails.source.qualityExpectation ||
                        "—"
                      }
                    />

                    <Detail
                      label="Harvest / available from"
                      value={date(
                        cropDetails.source.harvestDate ||
                        cropDetails.source.expectedHarvestDate ||
                        cropDetails.source.availableFrom
                      )}
                    />

                    <Detail
                      label="Location"
                      value={
                        [
                          cropDetails.source.location?.village,
                          cropDetails.source.location?.district,
                          cropDetails.source.location?.state,
                        ]
                          .filter(Boolean)
                          .join(", ") || "—"
                      }
                    />
                  </div>

                  {Array.isArray(cropDetails.source.images) &&
                    cropDetails.source.images.length > 0 ? (
                    <div className="mt-5">
                      <h3 className="mb-3 text-sm font-bold text-slate-800">
                        Crop images
                      </h3>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {cropDetails.source.images.map((image, index) => (
                          <a
                            key={`${image}-${index}`}
                            href={image}
                            target="_blank"
                            rel="noreferrer"
                            className="block overflow-hidden rounded-2xl border border-slate-200 bg-slate-50"
                            title="Open full-size image in a new tab"
                          >
                            <img
                              src={image}
                              alt={`${getSourceName(cropDetails.source)} ${index + 1}`}
                              className="h-52 w-full object-cover"
                              loading="lazy"
                            />
                          </a>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                      No crop images are attached to this supply source.
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm text-slate-500">
                  Crop details are unavailable.
                </p>
              )}
            </div>
          </section>
        </div>
      )}
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