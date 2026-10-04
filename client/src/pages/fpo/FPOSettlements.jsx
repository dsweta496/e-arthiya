import { useEffect, useMemo, useState } from "react";
import { getFPOSettlements } from "../../api/fpoApi";

function FPOSettlements() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getFPOSettlements()
      .then((response) => setItems(response?.data || []))
      .catch((err) => setError(err.message || "Unable to load settlements."))
      .finally(() => setLoading(false));
  }, []);

  const completedValue = useMemo(
    () =>
      items
        .filter((item) => item.status === "completed")
        .reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [items]
  );

  return (
    <Page title="Settlements" subtitle="Review payment transactions associated with commitments facilitated by your FPO.">
      {error && <Alert>{error}</Alert>}

      <div className="grid gap-4 sm:grid-cols-2">
        <Summary label="Transactions" value={items.length} />
        <Summary label="Completed value" value={`₹${formatNumber(completedValue)}`} />
      </div>

      {loading ? (
        <Empty text="Loading settlements..." />
      ) : items.length ? (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="divide-y divide-slate-100">
            {items.map((item) => (
              <div key={item._id} className="px-5 py-5 sm:px-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-bold text-slate-950">
                      {item.type?.replaceAll("_", " ") || "Settlement"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {item.commitment?.lot?.crop || "Trade commitment"} ·{" "}
                      {formatDate(item.createdAt)}
                    </p>
                  </div>

                  <div className="text-left sm:text-right">
                    <p className="font-bold text-slate-950">
                      ₹{formatNumber(item.amount)}
                    </p>
                    <span className="text-xs font-semibold capitalize text-emerald-700">
                      {item.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <Empty text="No settlement transactions are connected to this FPO yet." />
      )}
    </Page>
  );
}

function Page({ title, subtitle, children }) { return <div className="space-y-6"><header><p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">Trade</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{title}</h1><p className="mt-2 text-sm text-slate-500">{subtitle}</p></header>{children}</div>; }
function Summary({ label, value }) { return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-2 text-2xl font-bold text-slate-950">{value}</p></div>; }
function Alert({ children }) { return <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{children}</div>; }
function Empty({ text }) { return <div className="rounded-3xl border border-slate-200 bg-white px-5 py-14 text-center text-sm text-slate-500 shadow-sm">{text}</div>; }
function formatNumber(value) { return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(Number(value || 0)); }
function formatDate(value) { if (!value) return "—"; return new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); }

export default FPOSettlements;
