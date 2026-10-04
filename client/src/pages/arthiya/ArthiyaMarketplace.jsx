import { useEffect, useState } from "react";
import {
  extractRecords,
  formatNumber,
  getArthiyaFarmerSupply,
} from "../../api/arthiyaApi";

function ArthiyaMarketplace() {
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const response = await getArthiyaFarmerSupply({ status: "available" });
        setLots(extractRecords(response));
      } catch (requestError) {
        setError(requestError.message || "Unable to load marketplace supply.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <div className="space-y-7">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">Marketplace</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Available farmer supply</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
          Explore real available produce that can be coordinated for buyer opportunities.
        </p>
      </header>

      {error && <ErrorBox message={error} />}

      {loading ? (
        <p className="text-sm text-slate-500">Loading marketplace...</p>
      ) : lots.length === 0 ? (
        <Empty text="No available farmer supply right now." />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {lots.map((lot) => (
            <article key={lot._id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              {lot.images?.[0] ? (
                <img src={lot.images[0]} alt={lot.crop} className="h-48 w-full object-cover" />
              ) : (
                <div className="flex h-48 items-center justify-center bg-emerald-50 text-5xl">🌾</div>
              )}
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-bold text-slate-950">{lot.crop}</h2>
                    <p className="mt-1 text-xs text-slate-500">{lot.variety || "No variety specified"}</p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase text-emerald-800">Available</span>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <Detail label="Quantity" value={`${formatNumber(lot.quantity)} ${lot.unit}`} />
                  <Detail label="Price" value={lot.expectedPrice ? `₹${formatNumber(lot.expectedPrice)} / ${lot.unit}` : "Not specified"} />
                  <Detail label="Farmer" value={lot.farmer?.name || "Farmer"} />
                  <Detail label="Location" value={formatLocation(lot.location)} />
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }) {
  return <div><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p><p className="mt-1 text-sm font-semibold text-slate-700">{value}</p></div>;
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

export default ArthiyaMarketplace;
