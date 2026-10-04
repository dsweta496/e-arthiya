import { useEffect, useState } from "react";
import { getFPOMarketplace } from "../../api/fpoApi";

function FPOMarketplace() {
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getFPOMarketplace()
      .then((response) => setLots(response?.data || []))
      .catch((err) => setError(err.message || "Unable to load marketplace supply."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Page title="Marketplace" subtitle="Discover available farmer produce that can be aggregated or matched to demand.">
      {error && <Alert>{error}</Alert>}

      {loading ? (
        <Empty text="Loading marketplace..." />
      ) : lots.length ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {lots.map((lot) => (
            <article key={lot._id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              {lot.images?.[0] ? (
                <img src={lot.images[0]} alt={lot.crop} className="h-44 w-full object-cover" />
              ) : (
                <div className="flex h-44 items-center justify-center bg-emerald-50 text-4xl">🌾</div>
              )}

              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-bold text-slate-950">{lot.crop}</h2>
                    <p className="mt-1 text-xs text-slate-500">{lot.variety || "Standard variety"}</p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-800">
                    Available
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <Metric label="Quantity" value={`${lot.quantity} ${lot.unit}`} />
                  <Metric label="Expected price" value={lot.expectedPrice ? `₹${lot.expectedPrice}` : "—"} />
                </div>

                <div className="mt-4 border-t border-slate-100 pt-4 text-xs text-slate-500">
                  Farmer: <span className="font-semibold text-slate-700">{lot.farmer?.name || "Farmer"}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <Empty text="No available produce is currently listed." />
      )}
    </Page>
  );
}

function Page({ title, subtitle, children }) {
  return <div className="space-y-6"><header><p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">FPO workspace</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{title}</h1><p className="mt-2 text-sm text-slate-500">{subtitle}</p></header>{children}</div>;
}
function Metric({ label, value }) { return <div className="rounded-2xl bg-slate-50 p-3"><p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 font-bold text-slate-900">{value}</p></div>; }
function Alert({ children }) { return <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{children}</div>; }
function Empty({ text }) { return <div className="rounded-3xl border border-slate-200 bg-white px-5 py-14 text-center text-sm text-slate-500 shadow-sm">{text}</div>; }

export default FPOMarketplace;
