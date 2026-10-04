import { useEffect, useState } from "react";
import { getBuyerMatches, getBuyerRequirements, runBuyerMatching } from "../../api/buyerApi";

const date = (value) => value ? new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "—";

export default function BuyerMatches() {
  const [requirements, setRequirements] = useState([]);
  const [selected, setSelected] = useState("");
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    getBuyerRequirements()
      .then((response) => {
        const data = Array.isArray(response?.data) ? response.data : [];
        setRequirements(data);
        if (data[0]?._id) setSelected(data[0]._id);
      })
      .catch((err) => setError(err.message || "Unable to load requirements."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selected) return;
    setError("");
    getBuyerMatches(selected)
      .then((response) => setMatches(Array.isArray(response?.matches) ? response.matches : []))
      .catch((err) => setError(err.message || "Unable to load matches."));
  }, [selected]);

  async function run() {
    if (!selected) return;
    try {
      setWorking(true);
      setError("");
      const response = await runBuyerMatching(selected);
      setMessage(response?.message || "Matching completed.");
      const refreshed = await getBuyerMatches(selected);
      setMatches(Array.isArray(refreshed?.matches) ? refreshed.matches : []);
    } catch (err) {
      setError(err.message || "Unable to run matching.");
    } finally {
      setWorking(false);
    }
  }

  const selectedRequirement = requirements.find((item) => item._id === selected);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">Smart matching</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-950">Matched supply</h1>
        <p className="mt-2 text-sm text-slate-500">Preview farmer supply that can satisfy one of your procurement requirements.</p>
      </header>

      {message && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{message}</div>}
      {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
          <label className="block flex-1"><span className="mb-2 block text-xs font-bold text-slate-600">Requirement</span><select value={selected} onChange={(e) => setSelected(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">{loading ? <option>Loading…</option> : requirements.map((item) => <option key={item._id} value={item._id}>{item.crop} · {item.quantity} {item.unit} · {item.status}</option>)}</select></label>
          <button disabled={!selected || working} onClick={run} className="rounded-xl bg-emerald-900 px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{working ? "Matching…" : "Run matching"}</button>
        </div>
        {selectedRequirement && <p className="mt-4 text-xs text-slate-500">Required by {date(selectedRequirement.requiredBy)} · {selectedRequirement.demandType} demand</p>}
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {matches.length === 0 ? <div className="md:col-span-2 xl:col-span-3 rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">No matching supply is currently available for this requirement.</div> : matches.map((match, index) => (
          <article key={`${match.sourceId}-${index}`} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-emerald-700">{match.sourceType.replaceAll("_", " ")}</p><h2 className="mt-2 text-base font-bold text-slate-950">Available source</h2></div><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-800">Match</span></div>
            <div className="mt-5 grid grid-cols-2 gap-3"><Info label="Available" value={`${match.availableQuantity} ${match.unit}`} /><Info label="Available from" value={date(match.availableFrom)} /></div>
            <p className="mt-4 text-xs text-slate-400">Farmer ID: {String(match.farmer || "—")}</p>
          </article>
        ))}
      </section>
    </div>
  );
}

function Info({ label, value }) { return <div className="rounded-xl bg-slate-50 p-3"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 text-sm font-bold text-slate-900">{value}</p></div>; }
