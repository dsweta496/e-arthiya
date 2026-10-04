import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createBuyerRequirement } from "../../api/buyerApi";

const initial = {
  crop: "",
  variety: "",
  quantity: "",
  unit: "quintal",
  availabilityFrom: "",
  requiredBy: "",
  qualityRequirement: "",
  state: "",
  district: "",
  village: "",
  demandType: "spot",
};

export default function BuyerRequirementAdd() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function update(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setError("");

    if (!form.crop.trim() || !form.quantity || !form.availabilityFrom || !form.requiredBy) {
      setError("Crop, quantity, availability date and required-by date are required.");
      return;
    }

    try {
      setSaving(true);
      await createBuyerRequirement({
        crop: form.crop.trim(),
        variety: form.variety.trim() || undefined,
        quantity: Number(form.quantity),
        unit: form.unit,
        availabilityFrom: form.availabilityFrom,
        requiredBy: form.requiredBy,
        qualityRequirement: form.qualityRequirement.trim() || undefined,
        location: {
          state: form.state.trim(),
          district: form.district.trim(),
          village: form.village.trim(),
        },
        demandType: form.demandType,
      });
      navigate("/buyer/requirements");
    } catch (err) {
      setError(err.message || "Unable to create requirement.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">Buyer workspace</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-950">Post a requirement</h1>
        <p className="mt-2 text-sm text-slate-500">Tell farmers what you need and when you need it.</p>
      </header>

      {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      <form onSubmit={submit} className="space-y-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Crop" value={form.crop} onChange={(v) => update("crop", v)} placeholder="e.g. Tomato" required />
          <Field label="Variety" value={form.variety} onChange={(v) => update("variety", v)} placeholder="e.g. Hybrid" />
          <Field label="Quantity" type="number" value={form.quantity} onChange={(v) => update("quantity", v)} placeholder="20" required />
          <Select label="Unit" value={form.unit} onChange={(v) => update("unit", v)} options={["kg", "quintal", "tonne"]} />
          <Field label="Available from" type="date" value={form.availabilityFrom} onChange={(v) => update("availabilityFrom", v)} required />
          <Field label="Required by" type="date" value={form.requiredBy} onChange={(v) => update("requiredBy", v)} required />
          <Select label="Demand type" value={form.demandType} onChange={(v) => update("demandType", v)} options={["spot", "forward"]} />
          <Field label="Quality requirement" value={form.qualityRequirement} onChange={(v) => update("qualityRequirement", v)} placeholder="Grade / quality / packaging" />
        </div>

        <div>
          <h2 className="mb-4 text-sm font-bold text-slate-900">Preferred supply location</h2>
          <div className="grid gap-5 sm:grid-cols-3">
            <Field label="State" value={form.state} onChange={(v) => update("state", v)} />
            <Field label="District" value={form.district} onChange={(v) => update("district", v)} />
            <Field label="Village" value={form.village} onChange={(v) => update("village", v)} />
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
          <button type="button" onClick={() => navigate("/buyer/requirements")} className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600">Cancel</button>
          <button disabled={saving} className="rounded-xl bg-emerald-900 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Posting…" : "Post requirement"}</button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder = "", required = false }) {
  return <label className="block"><span className="mb-2 block text-xs font-bold text-slate-600">{label}{required ? " *" : ""}</span><input required={required} type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500" /></label>;
}

function Select({ label, value, onChange, options }) {
  return <label className="block"><span className="mb-2 block text-xs font-bold text-slate-600">{label}</span><select value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-500">{options.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>;
}
