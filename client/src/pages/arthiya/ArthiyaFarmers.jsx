import { useEffect, useMemo, useState } from "react";
import {
  extractRecords,
  formatNumber,
  getArthiyaFarmerSupply,
  getArthiyaSupplyIntents,
} from "../../api/arthiyaApi";

function ArthiyaFarmers() {
  const [lots, setLots] = useState([]);
  const [intents, setIntents] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [lotResponse, intentResponse] = await Promise.all([
          getArthiyaFarmerSupply({ status: "available" }),
          getArthiyaSupplyIntents({ status: "available" }),
        ]);
        setLots(extractRecords(lotResponse));
        setIntents(extractRecords(intentResponse));
      } catch (requestError) {
        setError(requestError.message || "Unable to load the farmer network.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const farmers = useMemo(() => {
    const map = new Map();

    [...lots, ...intents].forEach((record) => {
      const farmer = record.farmer;
      const id = farmer?._id || farmer;
      if (!id) return;

      const key = String(id);
      const existing = map.get(key) || {
        id: key,
        name: farmer?.name || "Farmer",
        phone: farmer?.phone || "—",
        location: farmer?.location || record.location || {},
        quantity: 0,
        records: 0,
      };

      const quantity = Number(record.quantity ?? record.expectedQuantity ?? 0);
      existing.quantity += quantity;
      existing.records += 1;
      map.set(key, existing);
    });

    return Array.from(map.values());
  }, [lots, intents]);

  const filteredFarmers = farmers.filter((farmer) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;

    return [
      farmer.name,
      farmer.phone,
      farmer.location?.state,
      farmer.location?.district,
      farmer.location?.village,
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query));
  });

  return (
    <div className="space-y-7">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">
          Farmer network
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
          Farmers and available supply
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
          Review available farmer supply and identify contributors for buyer
          requirements and aggregation.
        </p>
      </header>

      {error && <ErrorBox message={error} />}

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search farmers by name, phone or location..."
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
        />
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="grid grid-cols-[1.4fr_1fr_1fr_0.7fr] border-b border-slate-100 bg-slate-50 px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          <span>Farmer</span>
          <span>Location</span>
          <span>Available supply</span>
          <span>Records</span>
        </div>

        {loading ? (
          <div className="px-5 py-10 text-sm text-slate-500">Loading farmer network...</div>
        ) : filteredFarmers.length === 0 ? (
          <div className="px-5 py-10 text-sm text-slate-500">No farmers match your search.</div>
        ) : (
          filteredFarmers.map((farmer) => (
            <div
              key={farmer.id}
              className="grid grid-cols-1 gap-3 border-b border-slate-100 px-5 py-5 last:border-0 md:grid-cols-[1.4fr_1fr_1fr_0.7fr] md:items-center"
            >
              <div>
                <p className="font-bold text-slate-950">{farmer.name}</p>
                <p className="mt-1 text-xs text-slate-500">{farmer.phone}</p>
              </div>
              <p className="text-sm text-slate-600">{formatLocation(farmer.location)}</p>
              <p className="text-sm font-semibold text-slate-800">
                {formatNumber(farmer.quantity)} units
              </p>
              <p className="text-sm text-slate-600">{farmer.records}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function formatLocation(location = {}) {
  return [location.village, location.district, location.state]
    .filter(Boolean)
    .join(", ") || "—";
}

function ErrorBox({ message }) {
  return <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{message}</div>;
}

export default ArthiyaFarmers;
