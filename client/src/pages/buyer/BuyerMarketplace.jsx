import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getBuyerSupply } from "../../api/buyerApi";

const money = (value) =>
  value === undefined || value === null || value === ""
    ? "Price not specified"
    : `₹${Number(value).toLocaleString("en-IN")} / unit`;

function list(response) {
  return Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : [];
}

export default function BuyerMarketplace() {
  const [lots, setLots] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getBuyerSupply()
      .then((response) => setLots(list(response)))
      .catch((err) => setError(err.message || "Unable to load supply."))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return lots;
    return lots.filter((lot) =>
      [lot.crop, lot.variety, lot.location?.state, lot.location?.district, lot.location?.village]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [lots, search]);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">Buyer marketplace</p>
        <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950">Available supply</h1>
            <p className="mt-2 text-sm text-slate-500">Browse currently available farmer produce listed on e-Arthiya.</p>
          </div>
          <Link to="/buyer/requirements/add" className="rounded-xl bg-emerald-900 px-5 py-3 text-sm font-semibold text-white">Post requirement</Link>
        </div>
      </header>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search crop, variety or location…"
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500"
        />
      </div>

      {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      {loading ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-sm text-slate-500">Loading available supply…</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">No available produce matches your search.</div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((lot) => (
            <article key={lot._id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              {lot.images?.[0] ? (
                <img src={lot.images[0]} alt={lot.crop} className="h-44 w-full object-cover" />
              ) : (
                <div className="flex h-44 items-center justify-center bg-emerald-50 text-4xl">🌾</div>
              )}
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-slate-950">{lot.crop}</h2>
                    <p className="mt-1 text-xs text-slate-500">{lot.variety || "Variety not specified"}</p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-800">Available</span>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <Info label="Quantity" value={`${lot.quantity} ${lot.unit}`} />
                  <Info label="Expected price" value={money(lot.expectedPrice)} />
                </div>
                <p className="mt-4 text-xs text-slate-500">
                  {lot.location?.district || lot.location?.state || "Location not specified"}
                </p>
                <p className="mt-1 text-xs text-slate-400">Farmer: {lot.farmer?.name || "Verified farmer"}</p>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function Info({ label, value }) {
  return <div className="rounded-xl bg-slate-50 p-3"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 text-sm font-bold text-slate-900">{value}</p></div>;
}
