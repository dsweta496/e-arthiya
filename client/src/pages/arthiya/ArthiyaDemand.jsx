import { useEffect, useState } from "react";
import {
  extractRecords,
  formatDate,
  formatNumber,
  getArthiyaDemand,
  getArthiyaMatches,
  runArthiyaMatching,
} from "../../api/arthiyaApi";

function ArthiyaDemand() {
  const [requirements, setRequirements] = useState([]);
  const [matches, setMatches] = useState({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");

  const loadDemand = async () => {
    try {
      setLoading(true);
      const response = await getArthiyaDemand({ status: "open" });
      setRequirements(extractRecords(response));
    } catch (requestError) {
      setError(requestError.message || "Unable to load buyer demand.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDemand();
  }, []);

  async function inspectMatches(id) {
    try {
      setBusyId(id);
      const response = await getArthiyaMatches(id);
      setMatches((current) => ({
        ...current,
        [id]: extractRecords(response),
      }));
    } catch (requestError) {
      setError(requestError.message || "Unable to inspect matches.");
    } finally {
      setBusyId("");
    }
  }

  async function runMatch(id) {
    try {
      setBusyId(id);
      const response = await runArthiyaMatching(id);
      setMatches((current) => ({
        ...current,
        [id]: extractRecords(response),
      }));
      await loadDemand();
    } catch (requestError) {
      setError(requestError.message || "Unable to run matching.");
    } finally {
      setBusyId("");
    }
  }

  return (
    <div className="space-y-7">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">
          Demand
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
          Buyer requirements
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
          Discover open buyer demand and run matching against the farmer network.
        </p>
      </header>

      {error && <ErrorBox message={error} />}

      {loading ? (
        <p className="text-sm text-slate-500">Loading buyer demand...</p>
      ) : requirements.length === 0 ? (
        <Empty text="No open buyer requirements right now." />
      ) : (
        <div className="space-y-4">
          {requirements.map((requirement) => {
            const requirementMatches = matches[requirement._id];
            const isBusy = busyId === requirement._id;

            return (
              <article key={requirement._id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-bold text-slate-950">{requirement.crop}</h2>
                      {requirement.variety && <span className="text-sm text-slate-500">· {requirement.variety}</span>}
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase text-emerald-800">
                        {requirement.demandType}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-500">
                      Buyer: {requirement.buyer?.name || "Buyer"}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => inspectMatches(requirement._id)}
                      className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-emerald-200 disabled:opacity-50"
                    >
                      {isBusy ? "Loading..." : "Preview matches"}
                    </button>
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => runMatch(requirement._id)}
                      className="rounded-xl bg-emerald-900 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-950 disabled:opacity-50"
                    >
                      Run matching
                    </button>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-4">
                  <Detail label="Quantity" value={`${formatNumber(requirement.quantity)} ${requirement.unit}`} />
                  <Detail label="Available from" value={formatDate(requirement.availabilityFrom)} />
                  <Detail label="Required by" value={formatDate(requirement.requiredBy)} />
                  <Detail label="Quality" value={requirement.qualityRequirement || "—"} />
                </div>

                {requirementMatches && (
                  <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-emerald-950">Matching supply</p>
                      <span className="text-xs font-bold text-emerald-800">{requirementMatches.length} matches</span>
                    </div>
                    <div className="mt-3 space-y-2">
                      {requirementMatches.slice(0, 5).map((match, index) => (
                        <div key={match._id || match.sourceId || index} className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-sm">
                          <span className="font-semibold text-slate-700">{match.crop || match.source?.crop || "Supply"}</span>
                          <span className="text-slate-500">
                            {formatNumber(match.availableQuantity || match.allocatedQuantity || match.quantity || 0)} {match.unit || requirement.unit}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-700">{value}</p>
    </div>
  );
}

function Empty({ text }) {
  return <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-sm text-slate-500">{text}</div>;
}

function ErrorBox({ message }) {
  return <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{message}</div>;
}

export default ArthiyaDemand;
