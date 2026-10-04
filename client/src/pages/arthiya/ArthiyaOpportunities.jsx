import { useEffect, useMemo, useState } from "react";
import {
  extractRecords,
  formatDate,
  formatNumber,
  getArthiyaDemand,
  getArthiyaMatches,
} from "../../api/arthiyaApi";

function ArthiyaOpportunities() {
  const [requirements, setRequirements] = useState([]);
  const [matches, setMatches] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const response = await getArthiyaDemand({ status: "open" });
        const records = extractRecords(response);
        setRequirements(records);

        const entries = await Promise.all(
          records.slice(0, 10).map(async (record) => {
            try {
              const matchResponse = await getArthiyaMatches(record._id);
              return [record._id, extractRecords(matchResponse)];
            } catch {
              return [record._id, []];
            }
          })
        );

        setMatches(Object.fromEntries(entries));
      } catch (requestError) {
        setError(requestError.message || "Unable to load opportunities.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const opportunities = useMemo(
    () =>
      requirements.map((requirement) => ({
        ...requirement,
        matchCount: matches[requirement._id]?.length || 0,
      })),
    [requirements, matches]
  );

  return (
    <div className="space-y-7">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">
          Market opportunities
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
          Demand you can coordinate
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
          Compare open buyer demand with the supply available through your farmer network.
        </p>
      </header>

      {error && <ErrorBox message={error} />}

      {loading ? (
        <p className="text-sm text-slate-500">Loading opportunities...</p>
      ) : opportunities.length === 0 ? (
        <Empty text="No open opportunities found." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {opportunities.map((item) => (
            <article key={item._id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Buyer requirement</p>
                  <h2 className="mt-1 text-xl font-bold text-slate-950">
                    {item.crop}{item.variety ? ` · ${item.variety}` : ""}
                  </h2>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-800">
                  {item.matchCount} matches
                </span>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-4">
                <Detail label="Demand" value={`${formatNumber(item.quantity)} ${item.unit}`} />
                <Detail label="Type" value={item.demandType || "—"} />
                <Detail label="Required by" value={formatDate(item.requiredBy)} />
                <Detail label="Location" value={formatLocation(item.location)} />
              </div>

              <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Coordination note</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {item.matchCount > 0
                    ? "Available network supply can be reviewed for aggregation against this requirement."
                    : "No current matching records were returned; check new farmer supply later."}
                </p>
              </div>
            </article>
          ))}
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

function formatLocation(location = {}) {
  return [location.village, location.district, location.state].filter(Boolean).join(", ") || "—";
}

function Empty({ text }) {
  return <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-sm text-slate-500">{text}</div>;
}

function ErrorBox({ message }) {
  return <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{message}</div>;
}

export default ArthiyaOpportunities;
