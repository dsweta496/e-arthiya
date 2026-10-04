import { useEffect, useState } from "react";
import { getAuctionBids, getBuyerAuctions } from "../../api/buyerApi";

export default function BuyerBids() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const auctionsResponse = await getBuyerAuctions();
        const auctions = Array.isArray(auctionsResponse?.data) ? auctionsResponse.data : [];
        const all = [];
        for (const auction of auctions) {
          const response = await getAuctionBids(auction._id);
          const bids = Array.isArray(response?.data) ? response.data : [];
          bids.forEach((bid) => all.push({ ...bid, auction }));
        }
        all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setRows(all);
      } catch (err) {
        setError(err.message || "Unable to load bids.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return <div className="space-y-6"><header><p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">Buyer workspace</p><h1 className="mt-2 text-3xl font-bold text-slate-950">My bids</h1><p className="mt-2 text-sm text-slate-500">Track bids you have placed across e-Arthiya auctions.</p></header>{error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}<div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">{loading ? <div className="p-8 text-sm text-slate-500">Loading bids…</div> : rows.length === 0 ? <div className="p-10 text-center text-sm text-slate-500">You have not placed any bids yet.</div> : <div className="divide-y divide-slate-100">{rows.map((bid) => <div key={bid._id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-bold text-slate-900">{bid.auction?.lot?.crop || "Produce auction"}</p><p className="mt-1 text-xs text-slate-500">Bid ₹{Number(bid.amount || 0).toLocaleString("en-IN")} · {new Date(bid.createdAt).toLocaleString("en-IN")}</p></div><span className={`w-fit rounded-full px-3 py-1 text-[11px] font-bold capitalize ${bid.status === "winning" ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>{bid.status}</span></div>)}</div>}</div></div>;
}
