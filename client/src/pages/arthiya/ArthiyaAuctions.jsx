import { useEffect, useState } from "react";
import {
  closeArthiyaAuction,
  createArthiyaAuction,
  extractRecords,
  formatDate,
  formatNumber,
  getArthiyaAuctions,
  getArthiyaFarmerSupply,
} from "../../api/arthiyaApi";

function ArthiyaAuctions({ user = null }) {
  const [auctions, setAuctions] = useState([]);
  const [lots, setLots] = useState([]);
  const [form, setForm] = useState({
    lot: "",
    startTime: "",
    endTime: "",
    startingPrice: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      const [auctionResponse, lotResponse] = await Promise.all([
        getArthiyaAuctions(),
        getArthiyaFarmerSupply({ status: "available" }),
      ]);
      setAuctions(extractRecords(auctionResponse));
      setLots(
        extractRecords(lotResponse).filter((lot) => {
          const aggregatorId = lot.aggregator?._id || lot.aggregator;
          return aggregatorId && String(aggregatorId) === String(user?.id || user?._id);
        })
      );
    } catch (requestError) {
      setError(requestError.message || "Unable to load auctions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id || user?._id) load();
  }, [user?.id, user?._id]);

  async function createAuction(event) {
    event.preventDefault();
    setError("");

    if (!form.lot || !form.startTime || !form.endTime || !form.startingPrice) {
      setError("Lot, auction window and starting price are required.");
      return;
    }

    try {
      setSaving(true);
      await createArthiyaAuction({
        lot: form.lot,
        startTime: new Date(form.startTime).toISOString(),
        endTime: new Date(form.endTime).toISOString(),
        startingPrice: Number(form.startingPrice),
      });
      setForm({ lot: "", startTime: "", endTime: "", startingPrice: "" });
      await load();
    } catch (requestError) {
      setError(requestError.message || "Unable to create auction.");
    } finally {
      setSaving(false);
    }
  }

  async function closeAuction(auctionId, result) {
    try {
      await closeArthiyaAuction(auctionId, result);
      await load();
    } catch (requestError) {
      setError(requestError.message || "Unable to close auction.");
    }
  }

  return (
    <div className="space-y-7">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">Auctions</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Coordinate competitive sale</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
          Create and manage auctions for farmer lots being facilitated by your Arthiya account.
        </p>
      </header>

      {error && <ErrorBox message={error} />}

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="font-bold text-slate-950">Create auction</h2>
        <p className="mt-1 text-sm text-slate-500">Only lots assigned to your Arthiya account can be auctioned here.</p>

        <form onSubmit={createAuction} className="mt-5 grid gap-4 md:grid-cols-2">
          <Field label="Facilitated lot">
            <select value={form.lot} onChange={(event) => setForm({ ...form, lot: event.target.value })} className={inputClass}>
              <option value="">Select lot</option>
              {lots.map((lot) => (
                <option key={lot._id} value={lot._id}>
                  {lot.crop} · {formatNumber(lot.quantity)} {lot.unit} · {lot.farmer?.name || "Farmer"}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Starting price / unit">
            <input type="number" min="0" value={form.startingPrice} onChange={(event) => setForm({ ...form, startingPrice: event.target.value })} className={inputClass} />
          </Field>
          <Field label="Start time">
            <input type="datetime-local" value={form.startTime} onChange={(event) => setForm({ ...form, startTime: event.target.value })} className={inputClass} />
          </Field>
          <Field label="End time">
            <input type="datetime-local" value={form.endTime} onChange={(event) => setForm({ ...form, endTime: event.target.value })} className={inputClass} />
          </Field>
          <div className="md:col-span-2">
            <button disabled={saving} type="submit" className="rounded-xl bg-emerald-900 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-950 disabled:opacity-50">
              {saving ? "Creating..." : "Create auction"}
            </button>
          </div>
        </form>
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Live records</p>
            <h2 className="mt-1 text-xl font-bold text-slate-950">Your auctions</h2>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500">Loading auctions...</p>
        ) : auctions.length === 0 ? (
          <Empty text="No auctions found." />
        ) : (
          auctions.map((auction) => (
            <article key={auction._id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Auction</p>
                  <h3 className="mt-1 text-lg font-bold text-slate-950">{auction.lot?.crop || "Produce lot"}</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {formatNumber(auction.lot?.quantity)} {auction.lot?.unit} · {auction.lot?.farmer?.name || "Farmer"}
                  </p>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-800">{auction.status}</span>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-4">
                <Detail label="Start" value={formatDate(auction.startTime)} />
                <Detail label="End" value={formatDate(auction.endTime)} />
                <Detail label="Starting price" value={`₹${formatNumber(auction.startingPrice)}`} />
                <Detail label="Highest bid" value={auction.currentHighestBid ? `₹${formatNumber(auction.currentHighestBid)}` : "No bid"} />
              </div>

              {auction.status === "open" && (
                <div className="mt-5 flex flex-wrap gap-2">
                  <button onClick={() => closeAuction(auction._id, "platform_winner")} disabled={!auction.highestBid} className="rounded-xl bg-emerald-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">
                    Close with platform winner
                  </button>
                  <button onClick={() => closeAuction(auction._id, "external_offer")} disabled={!auction.selectedExternalOffer} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-40">
                    Close with external offer
                  </button>
                </div>
              )}
            </article>
          ))
        )}
      </section>
    </div>
  );
}

const inputClass = "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100";

function Field({ label, children }) {
  return <label className="block"><span className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">{label}</span>{children}</label>;
}

function Detail({ label, value }) {
  return <div><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p><p className="mt-1 text-sm font-semibold text-slate-700">{value}</p></div>;
}

function Empty({ text }) {
  return <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-sm text-slate-500">{text}</div>;
}

function ErrorBox({ message }) {
  return <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{message}</div>;
}

export default ArthiyaAuctions;
