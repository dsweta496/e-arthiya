import { useEffect, useMemo, useState } from "react";
import { closeFarmerAuction, createExternalOffer, createFarmerAuction, getAuctionExternalOffers, getFarmerAuctions, getFarmerLots, selectExternalOffer, } from "../../api/farmerApi";
const formatNumber = (value) => new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
}).format(Number(value || 0));
const formatDateTime = (value) => {
    if (!value)
        return "—";
    return new Date(value).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
    });
};
const getRecords = (response) => Array.isArray(response?.data) ? response.data : [];
function FarmerAuctions({ user = null }) {
    const farmerId = user?.id || user?._id;
    const [lots, setLots] = useState([]);
    const [auctions, setAuctions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [showCreate, setShowCreate] = useState(false);
    const [busy, setBusy] = useState("");
    const [offers, setOffers] = useState({});
    const [offerForm, setOfferForm] = useState({});
    const [form, setForm] = useState({
        lot: "",
        startTime: "",
        endTime: "",
        startingPrice: "",
    });
    const load = async () => {
        if (!farmerId)
            return;
        setLoading(true);
        setError("");
        try {
            const [lotsResponse, auctionsResponse] = await Promise.all([
                getFarmerLots(farmerId),
                getFarmerAuctions(farmerId),
            ]);
            const farmerLots = getRecords(lotsResponse);
            const farmerAuctions = getRecords(auctionsResponse);
            setLots(farmerLots.filter((lot) => lot.status === "available"));
            setAuctions(farmerAuctions);
        }
        catch (requestError) {
            setError(requestError.message || "Unable to load auctions.");
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        load();
    }, [farmerId]);
    const auctionableLots = useMemo(() => {
        return lots.filter((lot) => {
            return !auctions.some((auction) => {
                const auctionLotId = auction.lot?._id || auction.lot;
                return auctionLotId === lot._id;
            });
        });
    }, [lots, auctions]);
    const handleCreate = async (event) => {
        event.preventDefault();
        setBusy("create");
        setError("");
        setMessage("");
        try {
            await createFarmerAuction({
                lot: form.lot,
                startTime: new Date(form.startTime).toISOString(),
                endTime: new Date(form.endTime).toISOString(),
                startingPrice: Number(form.startingPrice),
            });
            setMessage("Auction created and the lot is now in auction.");
            setForm({
                lot: "",
                startTime: "",
                endTime: "",
                startingPrice: "",
            });
            setShowCreate(false);
            await load();
        }
        catch (requestError) {
            setError(requestError.message || "Could not create auction.");
        }
        finally {
            setBusy("");
        }
    };
    const handleClose = async (auction, result) => {
        setBusy(auction._id);
        setError("");
        setMessage("");
        try {
            await closeFarmerAuction(auction._id, result);
            setMessage("Auction closed successfully.");
            await load();
        }
        catch (requestError) {
            setError(requestError.message || "Could not close auction.");
        }
        finally {
            setBusy("");
        }
    };
    const loadOffers = async (auctionId) => {
        try {
            const response = await getAuctionExternalOffers(auctionId);
            setOffers((current) => ({
                ...current,
                [auctionId]: getRecords(response),
            }));
        }
        catch (requestError) {
            setError(requestError.message || "Could not load offers.");
        }
    };
    const updateOfferForm = (auctionId, field, value) => {
        setOfferForm((current) => ({
            ...current,
            [auctionId]: {
                ...(current[auctionId] || {}),
                [field]: value,
            },
        }));
    };
    const handleSubmitOffer = async (auction) => {
        const currentOffer = offerForm[auction._id] || {};
        if (!currentOffer.name || !currentOffer.amount) {
            setError("Buyer name and offer amount are required.");
            return;
        }
        try {
            await createExternalOffer(auction._id, {
                offeredAmount: Number(currentOffer.amount),
                buyerName: currentOffer.name,
                buyerPhone: currentOffer.phone || "",
                submittedByFarmer: farmerId,
            });
            setMessage("External offer recorded.");
            setOfferForm((current) => ({
                ...current,
                [auction._id]: {},
            }));
            await loadOffers(auction._id);
        }
        catch (requestError) {
            setError(requestError.message || "Could not record offer.");
        }
    };
    const handleSelectOffer = async (auction, offer) => {
        try {
            await selectExternalOffer(auction._id, offer._id);
            setMessage("External offer selected.");
            await loadOffers(auction._id);
            await load();
        }
        catch (requestError) {
            setError(requestError.message || "Could not select offer.");
        }
    };
    return (<div className="space-y-7">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">
            Farmer workspace
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            Auctions
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Put an available lot into competitive bidding or record a verified
            external offer.
          </p>
        </div>

        <button type="button" onClick={() => setShowCreate((current) => !current)} className="rounded-xl bg-emerald-900 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-950">
          + Create auction
        </button>
      </header>

      {error && <Alert>{error}</Alert>}

      {message && (<div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}
        </div>)}

      {showCreate && (<form onSubmit={handleCreate} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-bold text-slate-950">New auction</h2>

          <div className="mt-4 grid gap-4 md:grid-cols-4">
            <Select label="Lot" value={form.lot} onChange={(value) => setForm((current) => ({ ...current, lot: value }))} options={auctionableLots.map((lot) => ({
                value: lot._id,
                label: `${lot.crop} · ${formatNumber(lot.quantity)} ${lot.unit}`,
            }))}/>

            <Input label="Starts" type="datetime-local" value={form.startTime} onChange={(value) => setForm((current) => ({ ...current, startTime: value }))}/>

            <Input label="Ends" type="datetime-local" value={form.endTime} onChange={(value) => setForm((current) => ({ ...current, endTime: value }))}/>

            <Input label="Starting price / unit" type="number" value={form.startingPrice} onChange={(value) => setForm((current) => ({
                ...current,
                startingPrice: value,
            }))}/>
          </div>

          <button type="submit" disabled={busy === "create"} className="mt-5 rounded-xl bg-emerald-900 px-5 py-2.5 text-xs font-bold text-white disabled:opacity-50">
            {busy === "create" ? "Creating…" : "Create auction"}
          </button>
        </form>)}

      <section className="space-y-4">
        {loading ? (<Loading />) : auctions.length === 0 ? (<Empty />) : (auctions.map((auction) => (<AuctionCard key={auction._id} auction={auction} busy={busy === auction._id} onClose={handleClose} offers={offers[auction._id]} onLoadOffers={loadOffers} offerForm={offerForm[auction._id] || {}} onOfferChange={(field, value) => updateOfferForm(auction._id, field, value)} onSubmitOffer={handleSubmitOffer} onSelectOffer={handleSelectOffer}/>)))}
      </section>
    </div>);
}
function AuctionCard({ auction, busy, onClose, offers, onLoadOffers, offerForm, onOfferChange, onSubmitOffer, onSelectOffer, }) {
    const lot = auction.lot || {};
    const isOpen = auction.status === "open";
    return (<article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-bold text-slate-950">
              {lot.crop || "Produce lot"}
            </h2>
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
              {auction.status?.replaceAll("_", " ") || "unknown"}
            </span>
          </div>

          <p className="mt-1 text-xs text-slate-400">
            {lot.quantity
            ? `${formatNumber(lot.quantity)} ${lot.unit}`
            : "Quantity unavailable"}
            {" · "}
            {formatDateTime(auction.startTime)} → {formatDateTime(auction.endTime)}
          </p>
        </div>

        <div className="text-left lg:text-right">
          <p className="text-xs text-slate-400">Current highest bid</p>
          <p className="text-xl font-bold text-emerald-800">
            ₹{formatNumber(auction.currentHighestBid)}
          </p>
        </div>
      </div>

      {isOpen && (<div className="mt-5 grid gap-3 md:grid-cols-3">
          <button type="button" onClick={() => onLoadOffers(auction._id)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700">
            View external offers
          </button>

          <button type="button" onClick={() => onClose(auction, "platform_winner")} disabled={busy || !auction.highestBid} className="rounded-xl bg-emerald-900 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-40">
            Close with platform winner
          </button>

          <button type="button" onClick={() => onClose(auction, "external_offer")} disabled={busy || !auction.selectedExternalOffer} className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-bold text-amber-800 disabled:opacity-40">
            Close with external offer
          </button>
        </div>)}

      {offers && (<div className="mt-5 rounded-2xl bg-slate-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
            External offers
          </p>

          {offers.length === 0 ? (<p className="mt-2 text-sm text-slate-500">
              No external offers recorded.
            </p>) : (<div className="mt-3 space-y-2">
              {offers.map((offer) => (<div key={offer._id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-3">
                  <div>
                    <p className="text-sm font-bold text-slate-800">
                      {offer.buyerName}
                    </p>
                    <p className="text-xs text-slate-400">
                      {offer.buyerPhone || "No phone"} · {offer.status}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <b className="text-emerald-800">
                      ₹{formatNumber(offer.offeredAmount)}
                    </b>

                    {isOpen && offer.status !== "selected" && (<button type="button" onClick={() => onSelectOffer(auction, offer)} className="rounded-lg bg-emerald-900 px-3 py-2 text-[11px] font-bold text-white">
                        Select
                      </button>)}
                  </div>
                </div>))}
            </div>)}
        </div>)}

      {isOpen && (<div className="mt-4 grid gap-2 md:grid-cols-3">
          <input placeholder="Buyer name" value={offerForm.name || ""} onChange={(event) => onOfferChange("name", event.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-xs"/>

          <input placeholder="Phone" value={offerForm.phone || ""} onChange={(event) => onOfferChange("phone", event.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-xs"/>

          <div className="flex gap-2">
            <input placeholder="Offer amount" type="number" value={offerForm.amount || ""} onChange={(event) => onOfferChange("amount", event.target.value)} className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs"/>

            <button type="button" onClick={() => onSubmitOffer(auction)} className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white">
              Record
            </button>
          </div>
        </div>)}
    </article>);
}
function Input({ label, value, onChange, type = "text" }) {
    return (<label className="block">
      <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </span>
      <input required type={type} value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-400"/>
    </label>);
}
function Select({ label, value, onChange, options }) {
    return (<label className="block">
      <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </span>
      <select required value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm">
        <option value="">Choose…</option>
        {options.map((option) => (<option key={option.value} value={option.value}>
            {option.label}
          </option>))}
      </select>
    </label>);
}
function Alert({ children }) {
    return (<div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
      {children}
    </div>);
}
function Loading() {
    return (<div className="rounded-3xl border border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-400">
      Loading auctions…
    </div>);
}
function Empty() {
    return (<div className="rounded-3xl border border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-400">
      No auctions yet. Create one from an available lot.
    </div>);
}
export default FarmerAuctions;
