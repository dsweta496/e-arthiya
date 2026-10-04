import { useEffect, useMemo, useState } from "react";
import {
  extractRecords,
  formatDate,
  formatNumber,
  getArthiyaFarmerSupply,
  getArthiyaSupplyIntents,
} from "../../api/arthiyaApi";

function ArthiyaSupply() {
  const [lots, setLots] = useState([]);
  const [intents, setIntents] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [lotResponse, intentResponse] = await Promise.all([
          getArthiyaFarmerSupply(),
          getArthiyaSupplyIntents(),
        ]);
        setLots(extractRecords(lotResponse));
        setIntents(extractRecords(intentResponse));
      } catch (requestError) {
        setError(requestError.message || "Unable to load network supply.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const records = useMemo(() => {
    const spot = lots.map((lot) => ({
      id: lot._id,
      crop: lot.crop,
      variety: lot.variety,
      farmer: lot.farmer?.name || "Farmer",
      quantity: lot.quantity,
      unit: lot.unit,
      type: "Spot",
      status: lot.status,
      date: lot.availableFrom,
      image: lot.images?.[0],
    }));

    const future = intents.map((intent) => ({
      id: intent._id,
      crop: intent.crop,
      variety: intent.variety,
      farmer: intent.farmer?.name || "Farmer",
      quantity: intent.expectedQuantity,
      unit: intent.unit,
      type: "Future",
      status: intent.status,
      date: intent.expectedHarvestDate,
      image: null,
    }));

    return [...spot, ...future];
  }, [lots, intents]);

  const filtered = records.filter((record) => {
    if (filter === "spot") return record.type === "Spot";
    if (filter === "future") return record.type === "Future";
    if (filter === "available") return record.status === "available";
    return true;
  });

  return (
    <div className="space-y-7">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">
          Supply
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
          Network supply
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
          Review spot and future supply that can be coordinated for market demand.
        </p>
      </header>

      {error && <ErrorBox message={error} />}

      <div className="flex flex-wrap gap-2">
        {[
          ["all", "All"],
          ["available", "Available"],
          ["spot", "Spot"],
          ["future", "Future"],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              filter === value
                ? "bg-emerald-900 text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:border-emerald-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          <p className="text-sm text-slate-500">Loading supply...</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-slate-500">No supply records found.</p>
        ) : (
          filtered.map((record) => (
            <article key={`${record.type}-${record.id}`} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              {record.image ? (
                <img src={record.image} alt={record.crop} className="h-44 w-full object-cover" />
              ) : (
                <div className="flex h-44 items-center justify-center bg-emerald-50 text-4xl">🌾</div>
              )}
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-bold text-slate-950">{record.crop}</h2>
                    <p className="mt-1 text-xs text-slate-500">{record.variety || "No variety specified"}</p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase text-emerald-800">
                    {record.type}
                  </span>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                  <Detail label="Farmer" value={record.farmer} />
                  <Detail label="Quantity" value={`${formatNumber(record.quantity)} ${record.unit}`} />
                  <Detail label="Status" value={record.status} />
                  <Detail label="Date" value={formatDate(record.date)} />
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 font-semibold text-slate-700">{value}</p>
    </div>
  );
}

function ErrorBox({ message }) {
  return <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{message}</div>;
}

export default ArthiyaSupply;
