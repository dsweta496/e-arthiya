import { useEffect, useState } from "react";
import { getFPODemand, getFPOMatches, runFPOMatching } from "../../api/fpoApi";

function FPODemand() {
  const [demands, setDemands] = useState([]);
  const [matches, setMatches] = useState({});
  const [busyId, setBusyId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadDemand() {
    const response = await getFPODemand();
    setDemands(response?.data || []);
  }

  useEffect(() => {
    loadDemand().catch((err) => setError(err.message || "Unable to load demand.")).finally(() => setLoading(false));
  }, []);

  async function inspectMatches(id) {
    try {
      const response = await getFPOMatches(id);
      setMatches((current) => ({ ...current, [id]: response?.matches || response?.data || [] }));
    } catch (err) {
      setError(err.message || "Unable to inspect matches.");
    }
  }

  async function runMatch(id) {
    try {
      setBusyId(id);
      await runFPOMatching(id);
      await inspectMatches(id);
    } catch (err) {
      setError(err.message || "Unable to run matching.");
    } finally {
      setBusyId("");
    }
  }

  return (
    <Page title="Buyer demand" subtitle="Review buyer requirements and identify where your farmer network can help fill them.">
      {error && <Alert>{error}</Alert>}

      {loading ? (
        <Empty text="Loading demand..." />
      ) : demands.length ? (
        <div className="space-y-4">
          {demands.map((demand) => {
            const demandMatches = matches[demand._id] || [];

            return (
              <article key={demand._id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-xl font-bold text-slate-950">{demand.crop}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {demand.quantity} {demand.unit}
                      {demand.variety ? ` · ${demand.variety}` : ""}
                      {demand.demandType ? ` · ${demand.demandType}` : ""}
                    </p>
                    <p className="mt-2 text-xs text-slate-400">
                      Buyer: {demand.buyer?.name || "Buyer"} · Required by{" "}
                      {formatDate(demand.requiredBy)}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => inspectMatches(demand._id)}
                      className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-emerald-200"
                    >
                      Preview matches
                    </button>
                    <button
                      onClick={() => runMatch(demand._id)}
                      disabled={busyId === demand._id}
                      className="rounded-xl bg-emerald-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      {busyId === demand._id ? "Matching..." : "Run matching"}
                    </button>
                  </div>
                </div>

                {matches[demand._id] && (
                  <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Compatible supply
                    </p>

                    {demandMatches.length ? (
                      <div className="mt-3 space-y-2">
                        {demandMatches.slice(0, 6).map((match, index) => (
                          <div key={match._id || index} className="flex items-center justify-between rounded-xl bg-white px-4 py-3 text-sm">
                            <span className="font-semibold text-slate-800">
                              {match.crop || match.source?.crop || "Supply"}
                            </span>
                            <span className="text-slate-500">
                              {match.quantity || match.availableQuantity || "—"} {match.unit || demand.unit}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-slate-500">No compatible supply found yet.</p>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      ) : (
        <Empty text="No buyer requirements are currently available." />
      )}
    </Page>
  );
}

function Page({ title, subtitle, children }) { return <div className="space-y-6"><header><p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">FPO workspace</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{title}</h1><p className="mt-2 text-sm text-slate-500">{subtitle}</p></header>{children}</div>; }
function Alert({ children }) { return <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{children}</div>; }
function Empty({ text }) { return <div className="rounded-3xl border border-slate-200 bg-white px-5 py-14 text-center text-sm text-slate-500 shadow-sm">{text}</div>; }
function formatDate(value) { if (!value) return "—"; return new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); }

export default FPODemand;
