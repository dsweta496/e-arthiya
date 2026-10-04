import { useEffect, useState } from "react";
import { getFPOFarmerSupply, getFPOSupplyIntents } from "../../api/fpoApi";

function FPOSupply() {
  const [lots, setLots] = useState([]);
  const [intents, setIntents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([getFPOFarmerSupply(), getFPOSupplyIntents()])
      .then(([lotResponse, intentResponse]) => {
        setLots(lotResponse?.data || []);
        setIntents(intentResponse?.data || []);
      })
      .catch((err) => setError(err.message || "Unable to load farmer supply."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Page title="Farmer supply" subtitle="Review spot and future supply available across the farmer network.">
      {error && <Alert>{error}</Alert>}

      {loading ? (
        <Empty text="Loading supply..." />
      ) : (
        <div className="space-y-6">
          <Section title="Spot supply">
            {lots.length ? (
              <Rows items={lots} future={false} />
            ) : (
              <Empty text="No spot supply found." />
            )}
          </Section>

          <Section title="Future supply">
            {intents.length ? (
              <Rows items={intents} future />
            ) : (
              <Empty text="No future supply found." />
            )}
          </Section>
        </div>
      )}
    </Page>
  );
}

function Rows({ items, future }) {
  return (
    <div className="divide-y divide-slate-100">
      {items.map((item) => (
        <div key={item._id} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-slate-900">
              {item.crop} {item.variety ? `· ${item.variety}` : ""}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {future ? item.expectedQuantity : item.quantity} {item.unit}
              {" · "}
              {item.farmer?.name || "Farmer"}
            </p>
          </div>
          <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-bold capitalize text-slate-700">
            {(item.status || "unknown").replaceAll("_", " ")}
          </span>
        </div>
      ))}
    </div>
  );
}

function Section({ title, children }) {
  return <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 px-5 py-4"><h2 className="font-bold text-slate-950">{title}</h2></div>{children}</div>;
}
function Page({ title, subtitle, children }) { return <div className="space-y-6"><header><p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">FPO workspace</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{title}</h1><p className="mt-2 text-sm text-slate-500">{subtitle}</p></header>{children}</div>; }
function Alert({ children }) { return <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{children}</div>; }
function Empty({ text }) { return <div className="px-5 py-12 text-center text-sm text-slate-500">{text}</div>; }

export default FPOSupply;
