import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  getBuyerAuctions,
  getBuyerCommitments,
  getBuyerRequirements,
  getBuyerSupply,
} from "../../api/buyerApi";

const money = (value) =>
  `₹${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Number(value || 0))}`;

const date = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

function records(response, key = "data") {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.[key])) return response[key];
  return [];
}

export default function BuyerDashboard({ user = null }) {
  const [requirements, setRequirements] = useState([]);
  const [supply, setSupply] = useState([]);
  const [auctions, setAuctions] = useState([]);
  const [commitments, setCommitments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const buyerName = user?.name?.split(" ")[0] || "Buyer";

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        setError("");

        const [reqRes, supplyRes, auctionRes, commitmentRes] =
          await Promise.all([
            getBuyerRequirements(),
            getBuyerSupply(),
            getBuyerAuctions({ status: "open" }),
            getBuyerCommitments(),
          ]);

        if (!active) return;
        setRequirements(records(reqRes));
        setSupply(records(supplyRes));
        setAuctions(records(auctionRes));
        setCommitments(records(commitmentRes));
      } catch (err) {
        if (active) setError(err.message || "Unable to load buyer workspace.");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  const openRequirements = requirements.filter((item) =>
    ["open", "partially_fulfilled", "draft"].includes(item.status)
  );

  const protectedCommitments = commitments.filter((item) =>
    ["confirmed", "active", "pending_deposit"].includes(item.status)
  );

  const matchedQuantity = useMemo(
    () =>
      supply.reduce((sum, lot) => sum + Number(lot.quantity || 0), 0),
    [supply]
  );

  return (
    <div className="space-y-7">
      <section className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">
              Buyer workspace
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-[-0.045em] text-slate-950 sm:text-4xl">
            Good morning, {buyerName}.
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
            Find supply, manage your procurement requirements and protect your purchases from one place.
          </p>
        </div>

        <Link
          to="/buyer/requirements/add"
          className="inline-flex w-fit items-center gap-2 rounded-xl bg-emerald-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-950"
        >
          + Post requirement
        </Link>
      </section>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Open requirements" value={loading ? "—" : openRequirements.length} unit="requests" />
        <Stat label="Available supply" value={loading ? "—" : matchedQuantity} unit="listed units" />
        <Stat label="Live auctions" value={loading ? "—" : auctions.length} unit="auctions" />
        <Stat label="Protected purchases" value={loading ? "—" : protectedCommitments.length} unit="deals" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.9fr)]">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5 sm:px-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Your demand</p>
              <h2 className="mt-1 text-lg font-bold text-slate-950">Recent requirements</h2>
            </div>
            <Link to="/buyer/requirements" className="text-xs font-bold text-emerald-800">
              View all →
            </Link>
          </div>

          {loading ? (
            <div className="p-6 text-sm text-slate-500">Loading requirements…</div>
          ) : openRequirements.length === 0 ? (
            <div className="p-6 text-sm text-slate-500">
              No active requirements yet. Post your first procurement requirement.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {openRequirements.slice(0, 4).map((item) => (
                <div key={item._id} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      {item.crop}{item.variety ? ` · ${item.variety}` : ""}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {item.quantity} {item.unit} · Required {date(item.requiredBy)}
                    </p>
                  </div>
                  <span className="w-fit rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold capitalize text-emerald-800">
                    {String(item.status || "draft").replaceAll("_", " ")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-emerald-900 bg-emerald-950 p-6 text-white shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-300">Marketplace</p>
          <h2 className="mt-2 text-xl font-bold">Supply available now</h2>
          <p className="mt-3 text-sm leading-6 text-emerald-100/70">
            Browse farmer lots, compare available quantities and move suitable supply into your procurement workflow.
          </p>

          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-2xl font-bold">{loading ? "—" : supply.length}</p>
            <p className="mt-1 text-xs text-emerald-100/60">available produce lots</p>
          </div>

          <Link
            to="/buyer/marketplace"
            className="mt-5 flex items-center justify-center rounded-xl bg-white px-4 py-3 text-sm font-bold text-emerald-950 transition hover:bg-emerald-50"
          >
            Browse supply →
          </Link>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Panel title="Live auctions" link="/buyer/auctions" linkText="Browse all →">
          {auctions.length === 0 ? (
            <p className="text-sm text-slate-500">No open auctions right now.</p>
          ) : (
            <div className="space-y-3">
              {auctions.slice(0, 4).map((auction) => (
                <div key={auction._id} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-bold text-slate-900">{auction.lot?.crop || "Produce lot"}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {auction.lot?.quantity || "—"} {auction.lot?.unit || ""} · Ends {date(auction.endTime)}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-emerald-800">
                      {money(auction.currentHighestBid || auction.startingPrice)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Protected purchases" link="/buyer/commitments" linkText="View commitments →">
          {protectedCommitments.length === 0 ? (
            <p className="text-sm text-slate-500">No active protected purchases yet.</p>
          ) : (
            <div className="space-y-3">
              {protectedCommitments.slice(0, 4).map((commitment) => (
                <div key={commitment._id} className="rounded-2xl border border-slate-100 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-bold text-slate-900">
                      {commitment.lot?.crop || "Purchase commitment"}
                    </p>
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold capitalize text-emerald-800">
                      {String(commitment.status).replaceAll("_", " ")}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    {commitment.quantity} {commitment.unit} · {money(commitment.agreedPrice)} / unit
                  </p>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </section>
    </div>
  );
}

function Stat({ label, value, unit }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-2xl font-bold text-slate-950">{value}</span>
        <span className="text-xs font-semibold text-slate-400">{unit}</span>
      </div>
    </div>
  );
}

function Panel({ title, link, linkText, children }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-950">{title}</h2>
        <Link to={link} className="text-xs font-bold text-emerald-800">{linkText}</Link>
      </div>
      {children}
    </div>
  );
}
