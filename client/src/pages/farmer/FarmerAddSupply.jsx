import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../../api/api";
import { uploadProduceImages } from "../../lib/storage";
function FarmerAddSupply({ user = null }) {
    const navigate = useNavigate();
    const [supplyType, setSupplyType] = useState("spot");
    const [form, setForm] = useState({
        crop: "",
        variety: "",
        quantity: "",
        unit: "quintal",
        expectedPrice: "",
        harvestDate: "",
        state: "",
        district: "",
        village: "",
        qualityGrade: "",
        qualityExpectation: "",
    });
    const [selectedImages, setSelectedImages] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((previous) => ({
            ...previous,
            [name]: value,
        }));
    };
    /* ====================================================== */
    /* IMAGE HANDLING */
    /* ====================================================== */
    const handleImageChange = (event) => {
        const files = Array.from(event.target.files || []);
        if (!files.length)
            return;
        setError("");
        const remainingSlots = 5 - selectedImages.length;
        if (remainingSlots <= 0) {
            setError("You can upload a maximum of 5 images.");
            event.target.value = "";
            return;
        }
        const filesToAdd = files.slice(0, remainingSlots);
        const invalidFile = filesToAdd.find((file) => !file.type.startsWith("image/"));
        if (invalidFile) {
            setError("Please select image files only.");
            event.target.value = "";
            return;
        }
        const oversizedFile = filesToAdd.find((file) => file.size > 6 * 1024 * 1024);
        if (oversizedFile) {
            setError(`${oversizedFile.name} is larger than 6 MB.`);
            event.target.value = "";
            return;
        }
        setSelectedImages((previous) => [
            ...previous,
            ...filesToAdd,
        ]);
        setImagePreviews((previous) => [
            ...previous,
            ...filesToAdd.map((file) => ({
                file,
                url: URL.createObjectURL(file),
            })),
        ]);
        event.target.value = "";
    };
    const removeImage = (index) => {
        setImagePreviews((previous) => {
            const removed = previous[index];
            if (removed?.url) {
                URL.revokeObjectURL(removed.url);
            }
            return previous.filter((_, imageIndex) => imageIndex !== index);
        });
        setSelectedImages((previous) => previous.filter((_, imageIndex) => imageIndex !== index));
    };
    /* ====================================================== */
    /* SUBMIT */
    /* ====================================================== */
    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        setSuccess("");
        const farmerId = user?.id || user?._id;
        if (!farmerId) {
            setError("Your farmer account could not be identified. Please log in again.");
            return;
        }
        if (!form.crop.trim()) {
            setError("Please enter the crop name.");
            return;
        }
        if (!form.quantity || Number(form.quantity) <= 0) {
            setError("Please enter a valid quantity.");
            return;
        }
        if (!form.state.trim()) {
            setError("Please enter the state.");
            return;
        }
        if (!form.district.trim()) {
            setError("Please enter the district.");
            return;
        }
        if (!form.village.trim()) {
            setError("Please enter the village.");
            return;
        }
        if (supplyType === "spot" && !form.expectedPrice) {
            setError("Please enter your expected price.");
            return;
        }
        if (supplyType === "preorder" && !form.harvestDate) {
            setError("Please select an expected harvest date for future supply.");
            return;
        }
        setLoading(true);
        try {
            let payload;
            /* ================================================== */
            /* SPOT SUPPLY */
            /* ================================================== */
            if (supplyType === "spot") {
                let imageUrls = [];
                if (selectedImages.length > 0) {
                    setSuccess("Uploading your produce images...");
                    imageUrls = await uploadProduceImages(selectedImages, farmerId);
                }
                payload = {
                    farmer: farmerId,
                    crop: form.crop.trim(),
                    variety: form.variety.trim() || undefined,
                    quantity: Number(form.quantity),
                    unit: form.unit,
                    expectedPrice: Number(form.expectedPrice),
                    harvestDate: form.harvestDate || undefined,
                    qualityGrade: form.qualityGrade.trim() || undefined,
                    location: {
                        state: form.state.trim(),
                        district: form.district.trim(),
                        village: form.village.trim(),
                    },
                    images: imageUrls,
                    aggregatorType: "direct",
                    availableFrom: form.harvestDate || undefined,
                };
            }
            /* ================================================== */
            /* FUTURE / PREORDER SUPPLY */
            /* ================================================== */
            else {
                payload = {
                    farmer: farmerId,
                    crop: form.crop.trim(),
                    variety: form.variety.trim() || undefined,
                    expectedQuantity: Number(form.quantity),
                    unit: form.unit,
                    expectedHarvestDate: form.harvestDate,
                    supplyType: "preorder",
                    qualityExpectation: form.qualityExpectation.trim() || undefined,
                    location: {
                        state: form.state.trim(),
                        district: form.district.trim(),
                        village: form.village.trim(),
                    },
                    aggregatorType: "direct",
                };
            }
            setSuccess("Saving your supply...");
            const endpoint = supplyType === "spot"
                ? "/lots"
                : "/supply-intents";
            await apiRequest(endpoint, {
                method: "POST",
                body: JSON.stringify(payload),
            });
            setSuccess(supplyType === "spot"
                ? "Your spot supply has been listed successfully."
                : "Your future supply has been listed successfully.");
            /* ================================================== */
            /* RESET FORM */
            /* ================================================== */
            imagePreviews.forEach((preview) => {
                if (preview?.url) {
                    URL.revokeObjectURL(preview.url);
                }
            });
            setForm({
                crop: "",
                variety: "",
                quantity: "",
                unit: "quintal",
                expectedPrice: "",
                harvestDate: "",
                state: "",
                district: "",
                village: "",
                qualityGrade: "",
                qualityExpectation: "",
            });
            setSelectedImages([]);
            setImagePreviews([]);
            setTimeout(() => {
                navigate("/farmer/supply");
            }, 1000);
        }
        catch (requestError) {
            setError(requestError.message ||
                "Something went wrong while creating your supply.");
            setSuccess("");
        }
        finally {
            setLoading(false);
        }
    };
    return (<div className="mx-auto max-w-5xl space-y-7">
      {/* HEADER */}
      <section>
        <button type="button" onClick={() => navigate("/farmer/supply")} className="mb-4 inline-flex items-center gap-2 text-xs font-bold text-slate-500 transition hover:text-emerald-800">
          <ArrowLeftIcon />
          Back to my supply
        </button>

        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500"/>

          <span className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">
            Farmer workspace
          </span>
        </div>

        <h1 className="mt-2 text-3xl font-bold tracking-[-0.045em] text-slate-950 sm:text-4xl">
          Add your supply
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
          Tell buyers what you can supply and when it will be available.
        </p>
      </section>

      {/* SUPPLY TYPE */}
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
            Step 01
          </p>

          <h2 className="mt-1 text-lg font-bold text-slate-950">
            What kind of supply are you listing?
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Choose whether the produce is available now or will be available
            after harvest.
          </p>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <SupplyTypeCard active={supplyType === "spot"} onClick={() => setSupplyType("spot")} icon={<PackageIcon />} title="Spot supply" description="Produce already harvested or available immediately."/>

          <SupplyTypeCard active={supplyType === "preorder"} onClick={() => setSupplyType("preorder")} icon={<CalendarIcon />} title="Future supply" description="Upcoming harvest that buyers can reserve in advance."/>
        </div>
      </section>

      {/* FORM */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* PRODUCT */}
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
              Step 02
            </p>

            <h2 className="mt-1 text-lg font-bold text-slate-950">
              Produce details
            </h2>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <Field label="Crop" name="crop" value={form.crop} onChange={handleChange} placeholder="e.g. Tomato" required/>

            <Field label="Variety" name="variety" value={form.variety} onChange={handleChange} placeholder="e.g. Hybrid"/>

            <Field label="Quantity" name="quantity" type="number" min="0" step="0.01" value={form.quantity} onChange={handleChange} placeholder="e.g. 20" required/>

            <SelectField label="Unit" name="unit" value={form.unit} onChange={handleChange} options={[
            { value: "quintal", label: "Quintal" },
            { value: "kg", label: "Kilogram" },
            { value: "tonne", label: "Tonne" },
        ]}/>

            {/* EXPECTED PRICE */}
            <Field label="Expected price per unit" name="expectedPrice" type="number" min="0" step="0.01" value={form.expectedPrice} onChange={handleChange} placeholder="e.g. 2500" required={supplyType === "spot"}/>

            {/* DATE */}
            <Field label={supplyType === "spot"
            ? "Harvest / availability date"
            : "Expected harvest date"} name="harvestDate" type="date" value={form.harvestDate} onChange={handleChange} required={supplyType === "preorder"}/>
          </div>
        </section>

        {/* LOCATION */}
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
              Step 03
            </p>

            <h2 className="mt-1 text-lg font-bold text-slate-950">
              Supply location
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Tell buyers where the produce is coming from.
            </p>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-3">
            <Field label="State" name="state" value={form.state} onChange={handleChange} placeholder="e.g. Uttar Pradesh" required/>

            <Field label="District" name="district" value={form.district} onChange={handleChange} placeholder="e.g. Ghaziabad" required/>

            <Field label="Village" name="village" value={form.village} onChange={handleChange} placeholder="e.g. Dasna" required/>
          </div>
        </section>

        {/* QUALITY */}
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
              Step 04
            </p>

            <h2 className="mt-1 text-lg font-bold text-slate-950">
              Quality information
            </h2>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            {supplyType === "spot" ? (<Field label="Quality grade" name="qualityGrade" value={form.qualityGrade} onChange={handleChange} placeholder="e.g. Grade A"/>) : (<Field label="Quality expectation" name="qualityExpectation" value={form.qualityExpectation} onChange={handleChange} placeholder="e.g. Grade A / Standard"/>)}

            <div className="flex items-end">
              <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-500">
                {supplyType === "spot"
            ? "Add the current quality grade of the produce."
            : "Describe the quality you expect at harvest."}
              </div>
            </div>
          </div>
        </section>

        {/* IMAGES — SPOT ONLY */}
        {supplyType === "spot" && (<section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                Step 05
              </p>

              <h2 className="mt-1 text-lg font-bold text-slate-950">
                Produce images
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                Upload up to 5 photos so buyers can see the actual produce.
              </p>
            </div>

            <div className="mt-6">
              <label htmlFor="produce-images" className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-6 py-8 text-center transition hover:border-emerald-300 hover:bg-emerald-50/30">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800">
                  <ImageIcon />
                </div>

                <p className="mt-3 text-sm font-bold text-slate-800">
                  Add produce photos
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  JPG, PNG or other image formats · Max 6 MB each
                </p>

                <span className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-900 px-4 py-2 text-xs font-semibold text-white">
                  <PlusIcon />
                  Choose images
                </span>

                <input id="produce-images" type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden"/>
              </label>

              {imagePreviews.length > 0 && (<div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
                  {imagePreviews.map((preview, index) => (<div key={`${preview.file.name}-${index}`} className="group relative aspect-square overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                      <img src={preview.url} alt={`Produce preview ${index + 1}`} className="h-full w-full object-cover"/>

                      <button type="button" onClick={() => removeImage(index)} className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white opacity-100 transition hover:bg-red-600" aria-label={`Remove image ${index + 1}`}>
                        <CloseIcon />
                      </button>

                      <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-2 py-1 text-[10px] font-medium text-white">
                        Image {index + 1}
                      </div>
                    </div>))}
                </div>)}

              <p className="mt-3 text-xs text-slate-400">
                {selectedImages.length}/5 images selected
              </p>
            </div>
          </section>)}

        {/* INFO */}
        <section className="rounded-3xl border border-emerald-100 bg-emerald-50/70 p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-900 text-white">
              <ShieldIcon />
            </div>

            <div>
              <h3 className="text-sm font-bold text-emerald-950">
                What happens after you list?
              </h3>

              <p className="mt-1 text-xs leading-5 text-emerald-900/65">
                Your supply becomes available for matching against relevant
                buyer requirements. If a buyer commits to the supply, the
                transaction moves into the protected commitment flow.
              </p>
            </div>
          </div>
        </section>

        {/* MESSAGES */}
        {error && (<div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>)}

        {success && (<div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            {success}
          </div>)}

        {/* ACTIONS */}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={() => navigate("/farmer/supply")} className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50">
            Cancel
          </button>

          <button type="submit" disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-950 disabled:cursor-not-allowed disabled:opacity-60">
            {loading ? (<>
                <SpinnerIcon />
                {selectedImages.length > 0 && supplyType === "spot"
                ? "Uploading & listing..."
                : "Listing supply..."}
              </>) : (<>
                List supply
                <ArrowRightIcon />
              </>)}
          </button>
        </div>
      </form>
    </div>);
}
/* ====================================================== */
/* SUPPLY TYPE CARD */
/* ====================================================== */
function SupplyTypeCard({ active, onClick, icon, title, description, }) {
    return (<button type="button" onClick={onClick} className={[
            "group rounded-2xl border p-5 text-left transition",
            active
                ? "border-emerald-300 bg-emerald-50/70 ring-2 ring-emerald-100"
                : "border-slate-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/30",
        ].join(" ")}>
      <div className="flex items-start justify-between">
        <span className={[
            "flex h-10 w-10 items-center justify-center rounded-xl transition",
            active
                ? "bg-emerald-900 text-white"
                : "bg-slate-100 text-slate-500 group-hover:bg-emerald-50 group-hover:text-emerald-800",
        ].join(" ")}>
          {icon}
        </span>

        <span className={[
            "flex h-5 w-5 items-center justify-center rounded-full border",
            active
                ? "border-emerald-700 bg-emerald-700"
                : "border-slate-300",
        ].join(" ")}>
          {active && <span className="h-2 w-2 rounded-full bg-white"/>}
        </span>
      </div>

      <h3 className="mt-4 text-sm font-bold text-slate-900">
        {title}
      </h3>

      <p className="mt-1 text-xs leading-5 text-slate-400">
        {description}
      </p>
    </button>);
}
/* ====================================================== */
/* FIELD */
/* ====================================================== */
function Field({ label, name, value, onChange, placeholder, type = "text", required = false, min, step, }) {
    return (<label className="block">
      <span className="mb-2 block text-xs font-bold text-slate-700">
        {label}
        {required && <span className="ml-1 text-emerald-600">*</span>}
      </span>

      <input name={name} type={type} value={value} onChange={onChange} placeholder={placeholder} required={required} min={min} step={step} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:bg-white focus:ring-2 focus:ring-emerald-100"/>
    </label>);
}
/* ====================================================== */
/* SELECT */
/* ====================================================== */
function SelectField({ label, name, value, onChange, options, }) {
    return (<label className="block">
      <span className="mb-2 block text-xs font-bold text-slate-700">
        {label}
      </span>

      <select name={name} value={value} onChange={onChange} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-300 focus:bg-white focus:ring-2 focus:ring-emerald-100">
        {options.map((option) => (<option key={option.value} value={option.value}>
            {option.label}
          </option>))}
      </select>
    </label>);
}
/* ====================================================== */
/* ICONS */
/* ====================================================== */
function PlusIcon() {
    return (<svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-[2]">
      <path d="M12 5v14M5 12h14"/>
    </svg>);
}
function ArrowLeftIcon() {
    return (<svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-[2]">
      <path d="m15 18-6-6 6-6"/>
    </svg>);
}
function ArrowRightIcon() {
    return (<svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-[2]">
      <path d="M5 12h14M13 6l6 6-6 6"/>
    </svg>);
}
function PackageIcon() {
    return (<svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.8]">
      <path d="m21 8-9 5-9-5 9-5 9 5Z"/>
      <path d="M3 8v8l9 5 9-5V8"/>
      <path d="M12 13v8"/>
    </svg>);
}
function CalendarIcon() {
    return (<svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.8]">
      <rect x="3" y="5" width="18" height="16" rx="2"/>
      <path d="M7 3v4M17 3v4M3 10h18"/>
    </svg>);
}
function ImageIcon() {
    return (<svg viewBox="0 0 24 24" className="h-6 w-6 fill-none stroke-current stroke-[1.7]">
      <rect x="3" y="4" width="18" height="16" rx="2"/>
      <circle cx="8.5" cy="9" r="1.5"/>
      <path d="m21 15-4.5-4.5L8 19"/>
    </svg>);
}
function CloseIcon() {
    return (<svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-none stroke-current stroke-[2]">
      <path d="m7 7 10 10M17 7 7 17"/>
    </svg>);
}
function ShieldIcon() {
    return (<svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.8]">
      <path d="M12 3 20 6v5c0 5-3.3 8.5-8 10-4.7-1.5-8-5-8-10V6l8-3Z"/>
      <path d="m9 12 2 2 4-4"/>
    </svg>);
}
function SpinnerIcon() {
    return (<svg viewBox="0 0 24 24" className="h-4 w-4 animate-spin fill-none stroke-current stroke-[2]">
      <circle cx="12" cy="12" r="9" className="opacity-25"/>
      <path d="M21 12a9 9 0 0 1-9 9"/>
    </svg>);
}
export default FarmerAddSupply;
