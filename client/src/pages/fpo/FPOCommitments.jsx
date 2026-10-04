import { useEffect, useState } from "react";
import { getFPOCommitments } from "../../api/fpoApi";

function FPOCommitments() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getFPOCommitments()
      .then((response) => setItems(response?.data || []))
      .catch((err) => setError(err.message || "Unable to load commitments."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Page title="Commitments" subtitle="Track protected buyer deals connected to your facilitated farmer supply.">
      {error && <Alert>{error}</Alert>}

      {loading ? (
        <Empty text="Loading commitments..." />
      ) : items.length ? (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="divide-y divide-slate-100">
            {items.map((item) => (
              <div key={item._id} className="px-5 py-5 sm:px-6">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="font-bold text-slate-950">
                      {item.lot?.crop || item.supplyPool?.crop || "Trade commitment"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Buyer: {item.buyer?.name || "Buyer"} ·
                      {item.quantity ? ` ${item.quantity} ${item.unit || ""}` : ""}
                    </p>
                  </div>

                  <span className="w-fit rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold capitalize text-emerald-800">
                    {(item.status || "unknown").replaceAll("_", " ")}
                  </span>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <Metric label="Agreed price" value={item.agreedPrice ? `₹${item.agreedPrice}` : "—"} />
                  <Metric label="Total value" value={item.totalValue ? `₹${item.totalValue}` : "—"} />
                  <Metric label="Source" value={item.source || "—"} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <Empty text="No commitments are connected to this FPO yet." />
      )}
    </Page>
  );
}

function Page({ title, subtitle, children }) { return <div className="space-y-6"><header><p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">Trade</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{title}</h1><p className="mt-2 text-sm text-slate-500">{subtitle}</p></header>{children}</div>; }
function Metric({ label, value }) { return <div className="rounded-2xl bg-slate-50 p-3"><p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 font-bold text-slate-900">{value}</p></div>; }
function Alert({ children }) { return <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{children}</div>; }
function Empty({ text }) { return <div className="rounded-3xl border border-slate-200 bg-white px-5 py-14 text-center text-sm text-slate-500 shadow-sm">{text}</div>; }

export default FPOCommitments;
