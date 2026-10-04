import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createArthiyaSupplyPool,
  extractRecords,
  formatNumber,
  getArthiyaFarmerSupply,
} from "../../api/arthiyaApi";

function ArthiyaPoolCreate({ user = null }) {
  const navigate = useNavigate();
  const [lots, setLots] = useState([]);
  const [selected, setSelected] = useState({});
  const [form, setForm] = useState({
    crop: "",
    variety: "",
    unit: "quintal",
    availabilityFrom: "",
    availabilityUntil: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const response = await getArthiyaFarmerSupply({ status: "available" });
        setLots(extractRecords(response));
      } catch (requestError) {
        setError(requestError.message || "Unable to load available farmer supply.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const cropOptions = useMemo(
    () => Array.from(new Set(lots.map((lot) => lot.crop).filter(Boolean))),
    [lots]
  );

  const candidateLots = lots.filter((lot) => {
    if (form.crop && lot.crop !== form.crop) return false;
    if (form.unit && lot.unit !== form.unit) return false;
    return true;
  });

  const totalQuantity = candidateLots.reduce(
    (sum, lot) => sum + Number(selected[lot._id] || 0),
    0
  );

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateQuantity(lotId, value) {
    setSelected((current) => ({
      ...current,
      [lotId]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const contributors = candidateLots
      .filter((lot) => Number(selected[lot._id]) > 0)
      .map((lot) => ({
        farmer: lot.farmer?._id || lot.farmer,
        sourceType: "lot",
        sourceId: lot._id,
        quantity: Number(selected[lot._id]),
      }));

    if (!form.crop || !form.availabilityFrom || !form.availabilityUntil) {
      setError("Crop and availability dates are required.");
      return;
    }

    if (contributors.length === 0) {
      setError("Select at least one farmer contribution.");
      return;
    }

    if (new Date(form.availabilityUntil) < new Date(form.availabilityFrom)) {
      setError("Availability end cannot be before availability start.");
      return;
    }

    try {
      setSaving(true);

      await createArthiyaSupplyPool({
        crop: form.crop,
        variety: form.variety.trim() || undefined,
        unit: form.unit,
        availabilityFrom: form.availabilityFrom,
        availabilityUntil: form.availabilityUntil,
        contributors,
        aggregatorType: "arthiya",
        aggregator: user?.id || user?._id,
      });

      navigate("/arthiya/pools");
    } catch (requestError) {
      setError(requestError.message || "Unable to create the supply pool.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-7">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">Supply pool</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Create an aggregated pool</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
          Select available farmer lots and combine them into one coordinated supply pool.
        </p>
      </header>

      {error && <ErrorBox message={error} />}

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Crop">
              <select value={form.crop} onChange={(event) => updateForm("crop", event.target.value)} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100">
                <option value="">Select crop</option>
                {cropOptions.map((crop) => <option key={crop} value={crop}>{crop}</option>)}
              </select>
            </Field>
            <Field label="Variety">
              <input value={form.variety} onChange={(event) => updateForm("variety", event.target.value)} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100" placeholder="Optional" />
            </Field>
            <Field label="Unit">
              <select value={form.unit} onChange={(event) => updateForm("unit", event.target.value)} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100">
                <option value="kg">kg</option>
                <option value="quintal">quintal</option>
                <option value="tonne">tonne</option>
              </select>
            </Field>
            <Field label="Available from">
              <input type="date" value={form.availabilityFrom} onChange={(event) => updateForm("availabilityFrom", event.target.value)} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100" />
            </Field>
            <Field label="Available until">
              <input type="date" value={form.availabilityUntil} onChange={(event) => updateForm("availabilityUntil", event.target.value)} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100" />
            </Field>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-bold text-slate-950">Select farmer contributions</h2>
              <p className="mt-1 text-sm text-slate-500">Enter the quantity to take from each available lot.</p>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800">
              Pool total: {formatNumber(totalQuantity)} {form.unit}
            </span>
          </div>

          <div className="mt-5 space-y-3">
            {loading ? (
              <p className="text-sm text-slate-500">Loading available supply...</p>
            ) : candidateLots.length === 0 ? (
              <p className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">Choose a crop and unit to see eligible lots.</p>
            ) : (
              candidateLots.map((lot) => (
                <div key={lot._id} className="grid gap-4 rounded-2xl border border-slate-200 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div>
                    <p className="font-bold text-slate-950">{lot.crop}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {lot.farmer?.name || "Farmer"} · Available {formatNumber(lot.quantity)} {lot.unit}
                    </p>
                  </div>
                  <input
                    type="number"
                    min="0"
                    max={lot.quantity}
                    step="0.01"
                    value={selected[lot._id] || ""}
                    onChange={(event) => updateQuantity(lot._id, event.target.value)}
                    placeholder="Quantity"
                    className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 sm:w-36"
                  />
                </div>
              ))
            )}
          </div>
        </section>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={() => navigate("/arthiya/pools")} className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700">
            Cancel
          </button>
          <button disabled={saving} type="submit" className="rounded-xl bg-emerald-900 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-950 disabled:opacity-50">
            {saving ? "Creating..." : "Create supply pool"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">{label}</span>
      {children}
    </label>
  );
}

function ErrorBox({ message }) {
  return <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{message}</div>;
}

export default ArthiyaPoolCreate;
