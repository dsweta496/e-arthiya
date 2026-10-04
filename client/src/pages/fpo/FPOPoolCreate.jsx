import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createSupplyPool,
  getFPOFarmerSupply,
  getFPOSupplyIntents,
} from "../../api/fpoApi";

function FPOPoolCreate({ user = null }) {
  const navigate = useNavigate();
  const [lots, setLots] = useState([]);
  const [intents, setIntents] = useState([]);
  const [form, setForm] = useState({
    crop: "",
    variety: "",
    unit: "quintal",
    availabilityFrom: "",
    availabilityUntil: "",
  });
  const [contributors, setContributors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([getFPOFarmerSupply({ status: "available" }), getFPOSupplyIntents({ status: "available" })])
      .then(([lotResponse, intentResponse]) => {
        setLots(lotResponse?.data || []);
        setIntents(intentResponse?.data || []);
      })
      .catch((err) => setError(err.message || "Unable to load farmer supply."))
      .finally(() => setLoading(false));
  }, []);

  const sourceOptions = useMemo(
    () => [
      ...lots.map((lot) => ({
        sourceType: "lot",
        sourceId: lot._id,
        farmer: lot.farmer?._id || lot.farmer,
        label: `${lot.crop} · ${lot.quantity} ${lot.unit} · ${lot.farmer?.name || "Farmer"}`,
        quantity: lot.quantity,
        crop: lot.crop,
        unit: lot.unit,
      })),
      ...intents.map((intent) => ({
        sourceType: "supply_intent",
        sourceId: intent._id,
        farmer: intent.farmer?._id || intent.farmer,
        label: `${intent.crop} · ${intent.expectedQuantity} ${intent.unit} · ${intent.farmer?.name || "Farmer"}`,
        quantity: intent.expectedQuantity,
        crop: intent.crop,
        unit: intent.unit,
      })),
    ],
    [lots, intents]
  );

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function addContributor(event) {
    const sourceId = event.target.value;
    if (!sourceId) return;

    const source = sourceOptions.find((item) => item.sourceId === sourceId);
    if (!source) return;

    if (contributors.some((item) => item.sourceId === sourceId)) {
      event.target.value = "";
      return;
    }

    setContributors((current) => [
      ...current,
      {
        farmer: source.farmer,
        sourceType: source.sourceType,
        sourceId: source.sourceId,
        quantity: source.quantity,
        label: source.label,
      },
    ]);

    event.target.value = "";
  }

  function removeContributor(sourceId) {
    setContributors((current) =>
      current.filter((item) => item.sourceId !== sourceId)
    );
  }

  async function submit(event) {
    event.preventDefault();
    setError("");

    if (!form.crop.trim() || !form.availabilityFrom || !form.availabilityUntil) {
      setError("Crop and the full availability window are required.");
      return;
    }

    if (!contributors.length) {
      setError("Add at least one farmer supply source.");
      return;
    }

    try {
      setSaving(true);

      await createSupplyPool({
        crop: form.crop.trim(),
        variety: form.variety.trim() || undefined,
        unit: form.unit,
        availabilityFrom: form.availabilityFrom,
        availabilityUntil: form.availabilityUntil,
        contributors: contributors.map(({ label, ...item }) => item),
        aggregatorType: "fpo",
        aggregator: user?.id || user?._id,
      });

      navigate("/fpo/pools");
    } catch (err) {
      setError(err.message || "Unable to create the supply pool.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">
          Aggregation
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
          Create supply pool
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Combine compatible farmer quantities into one collective supply pool.
        </p>
      </header>

      {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <form onSubmit={submit} className="space-y-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Crop">
            <input value={form.crop} onChange={(e) => updateForm("crop", e.target.value)} className={inputClass} placeholder="Tomato" />
          </Field>

          <Field label="Variety">
            <input value={form.variety} onChange={(e) => updateForm("variety", e.target.value)} className={inputClass} placeholder="Hybrid" />
          </Field>

          <Field label="Unit">
            <select value={form.unit} onChange={(e) => updateForm("unit", e.target.value)} className={inputClass}>
              <option value="kg">kg</option>
              <option value="quintal">quintal</option>
              <option value="tonne">tonne</option>
            </select>
          </Field>

          <Field label="Availability from">
            <input type="date" value={form.availabilityFrom} onChange={(e) => updateForm("availabilityFrom", e.target.value)} className={inputClass} />
          </Field>

          <Field label="Availability until">
            <input type="date" value={form.availabilityUntil} onChange={(e) => updateForm("availabilityUntil", e.target.value)} className={inputClass} />
          </Field>
        </div>

        <div>
          <label className="text-sm font-bold text-slate-800">Add farmer supply</label>
          <select disabled={loading} defaultValue="" onChange={addContributor} className={`${inputClass} mt-2`}>
            <option value="">Select a supply source...</option>
            {sourceOptions.map((source) => (
              <option key={`${source.sourceType}-${source.sourceId}`} value={source.sourceId}>
                {source.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          {contributors.map((item) => (
            <div key={item.sourceId} className="flex flex-col gap-2 rounded-2xl bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-slate-900">{item.label}</p>
                <p className="mt-1 text-xs text-slate-500">{item.quantity} {form.unit} contributed</p>
              </div>
              <button type="button" onClick={() => removeContributor(item.sourceId)} className="w-fit text-xs font-bold text-red-600">
                Remove
              </button>
            </div>
          ))}
        </div>

        <button disabled={saving} className="w-full rounded-xl bg-emerald-900 px-5 py-3 text-sm font-bold text-white disabled:opacity-50">
          {saving ? "Creating pool..." : "Create supply pool"}
        </button>
      </form>
    </div>
  );
}

function Field({ label, children }) {
  return <div><label className="text-sm font-bold text-slate-800">{label}</label>{children}</div>;
}

const inputClass = "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-400";

export default FPOPoolCreate;
