import { useEffect, useState } from "react";
import { commitWinningAuction, getAuctionBids, getBuyerAuctions, placeBid } from "../../api/buyerApi";

const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;
const date = (value) => value ? new Date(value).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";

export default function BuyerAuctions() {
  const [auctions, setAuctions] = useState([]);
  const [bids, setBids] = useState({});
  const [bidValues, setBidValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    try {
      setLoading(true);
      const response = await getBuyerAuctions();
      const data = Array.isArray(response?.data) ? response.data : [];
      setAuctions(data);
      const entries = await Promise.all(data.map(async (auction) => [auction._id, await getAuctionBids(auction._id)]));
      const next = {};
      entries.forEach(([id, responseData]) => { next[id] = Array.isArray(responseData?.data) ? responseData.data : []; });
      setBids(next);
    } catch (err) {
      setError(err.message || "Unable to load auctions.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function bid(auction) {
    const amount = Number(bidValues[auction._id]);
    if (!amount) return;
    try {
      setBusy(auction._id);
      setError("");
      const minimum = Number(auction.currentHighestBid || auction.startingPrice || 0);
      if (amount <= minimum) throw new Error(`Bid must be higher than ${money(minimum)}.`);
      await placeBid(auction._id, amount);
      setMessage("Bid placed successfully.");
      setBidValues((current) => ({ ...current, [auction._id]: "" }));
      await load();
    } catch (err) {
      setError(err.message || "Unable to place bid.");
    } finally {
      setBusy("");
    }
  }

  async function commit(auction) {
    try {
      setBusy(`commit-${auction._id}`);
      setError("");
      await commitWinningAuction(auction._id);
      setMessage("Purchase commitment created. Pay the security deposit from Commitments or Payments.");
      await load();
    } catch (err) {
      setError(err.message || "Unable to create commitment.");
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="space-y-6">
      <header><p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">Buyer marketplace</p><h1 className="mt-2 text-3xl font-bold text-slate-950">Auctions</h1><p className="mt-2 text-sm text-slate-500">Bid on live farmer auctions and turn a winning bid into a protected purchase commitment.</p></header>
      {message && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{message}</div>}
      {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      {loading ? <div className="rounded-3xl border border-slate-200 bg-white p-8 text-sm text-slate-500">Loading auctions…</div> : auctions.length === 0 ? <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">No live auctions right now.</div> : <div className="grid gap-5 lg:grid-cols-2">{auctions.map((auction) => { const myBids = bids[auction._id] || []; const highest = Number(auction.currentHighestBid || auction.startingPrice || 0); return <article key={auction._id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Live auction</p><h2 className="mt-2 text-xl font-bold text-slate-950">{auction.lot?.crop || "Produce"}</h2><p className="mt-1 text-sm text-slate-500">{auction.lot?.quantity || "—"} {auction.lot?.unit || ""} · ends {date(auction.endTime)}</p></div><span className={`rounded-full px-3 py-1 text-[11px] font-bold ${auction.status === "open" ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>{String(auction.status).replaceAll("_", " ")}</span></div><div className="mt-5 grid grid-cols-2 gap-3"><Info label="Current bid" value={money(highest)} /><Info label="My bids" value={myBids.length} /></div>{auction.status === "open" && <div className="mt-5 flex gap-2"><input type="number" value={bidValues[auction._id] || ""} onChange={(e) => setBidValues((current) => ({ ...current, [auction._id]: e.target.value }))} placeholder={`> ${highest}`} className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm" /><button disabled={busy === auction._id} onClick={() => bid(auction)} className="rounded-xl bg-emerald-900 px-4 py-3 text-xs font-bold text-white disabled:opacity-50">{busy === auction._id ? "…" : "Place bid"}</button></div>}{auction.status === "closed_platform_winner" && myBids.some((item) => item.status === "winning") && <button disabled={busy === `commit-${auction._id}`} onClick={() => commit(auction)} className="mt-3 w-full rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-800 disabled:opacity-50">Create commitment from my winning bid</button>}</article>; })}</div>}
    </div>
  );
}
function Info({ label, value }) { return <div className="rounded-xl bg-slate-50 p-3"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 text-sm font-bold text-slate-900">{value}</p></div>; }
