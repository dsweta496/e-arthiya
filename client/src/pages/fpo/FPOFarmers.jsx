import { useEffect, useMemo, useState } from "react";
import { getFPOFarmers } from "../../api/fpoApi";

function FPOFarmers() {
  const [farmers, setFarmers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getFPOFarmers()
      .then((response) => setFarmers(response?.data || []))
      .catch((err) => setError(err.message || "Unable to load farmers."))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return farmers;

    return farmers.filter((farmer) =>
      [farmer.name, farmer.phone, farmer.location?.district, farmer.location?.village]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [farmers, search]);

  return (
    <Page title="Farmer network" subtitle="View the farmers registered on e-Arthiya.">
      <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search farmers..."
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-400"
        />
      </div>

      {error && <Alert>{error}</Alert>}

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <Empty text="Loading farmers..." />
        ) : filtered.length ? (
          <div className="divide-y divide-slate-100">
            {filtered.map((farmer) => (
              <div key={farmer._id} className="flex flex-col gap-2 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-bold text-slate-900">{farmer.name}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {farmer.phone} · {locationText(farmer.location)}
                  </p>
                </div>
                <span className="w-fit rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold capitalize text-emerald-800">
                  {farmer.verificationStatus || "verified"}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <Empty text="No farmers found." />
        )}
      </div>
    </Page>
  );
}

function Page({ title, subtitle, children }) {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">FPO workspace</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{title}</h1>
        <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
      </header>
      {children}
    </div>
  );
}

function Alert({ children }) {
  return <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{children}</div>;
}

function Empty({ text }) {
  return <div className="px-5 py-12 text-center text-sm text-slate-500">{text}</div>;
}

function locationText(location) {
  if (!location) return "Location not provided";
  return [location.village, location.district, location.state].filter(Boolean).join(", ");
}

export default FPOFarmers;
