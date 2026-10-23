import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../api/api";

const ROLE_CONTENT = {
  farmer: {
    label: "Farmer workspace",
    intro: "Manage produce, respond to demand and move accepted trades forward.",
    groups: [
      { title: "Produce & demand", items: [
        ["Create crop listing", "Add produce details, quantity, price and availability.", "/farmer/supply/add", "Open form"],
        ["Manage crop listings", "Review your listings and edit eligible produce.", "/farmer/supply", "Manage supply"],
        ["Future-crop supply intents", "Create and review planned harvest availability.", "/farmer/supply", "View supply"],
        ["Buyer requests & opportunities", "Explore matching demand and supply opportunities.", "/farmer/opportunities", "Explore demand"],
        ["Marketplace", "Browse available supply and marketplace records.", "/farmer/marketplace", "Open marketplace"],
        ["Send offer against buyer request", "Open demand opportunities and respond where the workflow permits.", "/farmer/opportunities", "Send offer"],
      ]},
      { title: "Trades & auctions", items: [
        ["Allocations & proposals", "Review allocations and use the quick action panel to reject eligible proposals.", "/farmer/marketplace", "Review opportunities"],
        ["Approve buyer allocation", "Open the relevant supply or trade page to review eligible buyer proposals.", "/farmer/supply", "Review allocation"],
        ["Release reserved allocation", "Release an eligible reservation where the backend permits it.", "/farmer/marketplace", "Release allocation"],
        ["Mark allocation fulfilled", "Complete an eligible allocation after trade fulfilment.", "/farmer/marketplace", "Mark fulfilled"],
        ["Auctions & external offers", "Create and close eligible auctions, review offers and select eligible offers.", "/farmer/auctions", "Manage auctions"],
        ["Commitments", "Review commitment status and approval-related updates.", "/farmer/commitments", "View commitments"],
        ["Payments & proof", "Review payment records; demo payments do not transfer real money.", "/farmer/payments", "View payments"],
        ["Blockchain proof history", "Inspect accessible entity proof history using the live backend check below.", "/farmer/operations", "Check proofs"],
        ["Notifications", "Load and mark in-app notifications read in the live backend checks below.", "/farmer/operations", "Check alerts"],
        ["Farmer payout ledger", "Review available ledger records; no actual transfer is initiated.", "/farmer/operations", "View ledger"],
      ]},
    ],
  },
  buyer: {
    label: "Buyer workspace",
    intro: "Manage procurement, compare supply, bid and track your commitments.",
    groups: [
      { title: "Procurement & matching", items: [
        ["Create procurement request", "Post the crop, quantity, unit, target price and delivery window.", "/buyer/requirements/add", "Post requirement"],
        ["Manage requirements", "View, edit or cancel eligible open requests.", "/buyer/requirements", "Manage requests"],
        ["Matched supply", "Run matching and inspect available farmer supply.", "/buyer/matches", "View matches"],
        ["Marketplace", "Browse available supply and supplier details.", "/buyer/marketplace", "Browse supply"],
        ["Supply offers & allocations", "Review allocation proposals and manage eligible allocations.", "/buyer/supply", "View supply"],
        ["Accept farmer-originated allocation", "Review eligible allocation proposals and status.", "/buyer/supply", "Review offers"],
        ["Commit approved allocation", "Commit an allocation only when its current state permits it.", "/buyer/supply", "Commit allocation"],
      ]},
      { title: "Auctions, orders & payments", items: [
        ["Auctions & bids", "Browse auctions, inspect bid history and place eligible bids.", "/buyer/auctions", "Browse auctions"],
        ["My bids", "Track the status of your submitted bids.", "/buyer/bids", "View bids"],
        ["Commitments & fulfilment", "Review orders, commitment state and eligible withdrawal options.", "/buyer/commitments", "View commitments"],
        ["Payment history", "Record demo deposits and review payment records.", "/buyer/payments", "View payments"],
        ["Withdraw eligible commitment", "Withdrawal depends on commitment status; post-deposit withdrawal is blocked by policy.", "/buyer/commitments", "Review withdrawal"],
        ["Blockchain proof history", "Inspect accessible commitment and payment proof history.", "/buyer/operations", "Check proofs"],
        ["Notifications", "Load and mark in-app notifications read in the live backend checks below.", "/buyer/operations", "Check alerts"],
      ]},
    ],
  },
  fpo: {
    label: "FPO workspace",
    intro: "Coordinate farmer supply, aggregate produce and connect collective volume to demand.",
    groups: [
      { title: "Organization & supply", items: [
        ["Farmer network", "Review farmer records and organization verification state.", "/fpo/farmers", "View farmers"],
        ["Managed supply", "View and manage eligible produce lots and future supply.", "/fpo/supply", "Manage supply"],
        ["Supply pools", "Review aggregated supply and pool status.", "/fpo/pools", "Manage pools"],
        ["Create supply pool", "Aggregate eligible supply for larger buyer requirements.", "/fpo/pools/create", "Create pool"],
      ]},
      { title: "Demand & trade", items: [
        ["Procurement & matching", "Browse buyer demand and run matching for eligible requests.", "/fpo/demand", "Explore demand"],
        ["Marketplace", "Review supply and marketplace opportunities.", "/fpo/marketplace", "Open marketplace"],
        ["Allocations", "Review managed allocations; use quick actions for eligible transitions.", "/fpo/marketplace", "Review allocations"],
        ["Approve allocation proposal", "Review a proposal against supply your organization manages.", "/fpo/marketplace", "Approve allocation"],
        ["Release reserved allocation", "Release an eligible allocation where the backend permits it.", "/fpo/marketplace", "Release allocation"],
        ["Mark allocation fulfilled", "Mark an eligible trade fulfilled after completion.", "/fpo/marketplace", "Mark fulfilled"],
        ["Commitments & settlements", "Track commitments and settlement ledger records.", "/fpo/commitments", "View commitments"],
        ["Settlement history", "Review recorded settlement activity; this is not a bank transfer.", "/fpo/settlements", "View settlements"],
        ["Blockchain proof history", "Inspect accessible marketplace event proof history.", "/fpo/operations", "Check proofs"],
        ["Notifications", "Load and mark in-app notifications read in the live backend checks below.", "/fpo/operations", "Check alerts"],
        ["Payout ledger", "Review ledger records; no actual payout is executed.", "/fpo/operations", "View ledger"],
      ]},
    ],
  },
  admin: {
    label: "Administration workspace",
    intro: "Review platform activity, organization verification, payment records and blockchain anchor health.",
    groups: [
      { title: "Governance & verification", items: [
        ["User management", "View and manage user records using supported admin routes.", "/admin/operations", "Open user checks"],
        ["Organization verification", "Review verification state and supported status changes.", "/admin/operations", "Review verification"],
        ["Marketplace oversight", "Inspect listings, procurement, allocations, auctions and commitments where authorized.", "/admin/operations", "Review operations"],
      ]},
      { title: "Payments & blockchain", items: [
        ["Eligible demo refunds", "Use the existing admin refund workflow only for eligible demo payments.", "/admin/operations", "Review payment records"],
        ["Blockchain monitor", "Check anchor status, inspect accessible proof history and retry failed anchors.", "/admin/operations", "Open blockchain tools"],
        ["Payout ledger", "Update ledger status; this does not execute a bank transfer.", "/admin/operations", "Manage ledger"],
      ]},
    ],
  },
  arthiya: {
    label: "Arthiya workspace",
    intro: "Coordinate the farmer network, aggregate supply and facilitate protected trades.",
    groups: [
      { title: "Supply network", items: [
        ["Farmer network", "Review farmers represented in your managed supply.", "/arthiya/farmers", "View network"],
        ["Managed produce", "View eligible lots and supply intents.", "/arthiya/supply", "Manage supply"],
        ["Supply pools", "Review your aggregation pools and status.", "/arthiya/pools", "Manage pools"],
        ["Create supply pool", "Build a pool from eligible supply sources.", "/arthiya/pools/create", "Create pool"],
      ]},
      { title: "Demand & trade", items: [
        ["Buyer demand", "Explore procurement requests and run matching where available.", "/arthiya/demand", "Explore demand"],
        ["Market opportunities", "Browse opportunities and eligible auction flows.", "/arthiya/opportunities", "View opportunities"],
        ["Auctions", "Manage eligible auctions and inspect bids.", "/arthiya/auctions", "Manage auctions"],
        ["Approve allocation proposal", "Review a proposal against supply your organization manages.", "/arthiya/marketplace", "Approve allocation"],
        ["Release reserved allocation", "Release an eligible allocation where the backend permits it.", "/arthiya/marketplace", "Release allocation"],
        ["Mark allocation fulfilled", "Mark an eligible trade fulfilled after completion.", "/arthiya/marketplace", "Mark fulfilled"],
        ["Deals & commitments", "Track deals and commitment status.", "/arthiya/deals", "View deals"],
        ["Settlement history", "Review settlement records and payment activity.", "/arthiya/settlements", "View settlements"],
        ["Blockchain proof history", "Inspect accessible marketplace event proof history.", "/arthiya/operations", "Check proofs"],
        ["Notifications", "Load and mark in-app notifications read in the live backend checks below.", "/arthiya/operations", "Check alerts"],
        ["Payout ledger", "Review ledger records; no actual payout is executed.", "/arthiya/operations", "View ledger"],
      ]},
    ],
  },
};

const ACTIONS = [
  { key: "notifications", title: "Load my notifications", description: "Fetch the signed-in account's notifications.", roles: ["farmer","buyer","fpo","arthiya"], fields: [], run: () => apiRequest("/notifications") },
  { key: "unread", title: "Load unread notifications", description: "Fetch unread in-app notifications.", roles: ["farmer","buyer","fpo","arthiya"], fields: [], run: () => apiRequest("/notifications?unread=true") },
  { key: "readNotification", title: "Mark notification as read", description: "Requires a notification ID belonging to your account.", roles: ["farmer","buyer","fpo","arthiya"], fields: ["notificationId"], run: (v) => apiRequest(`/notifications/${encodeURIComponent(v.notificationId)}/read`, { method: "PATCH" }) },
  { key: "rejectAllocation", title: "Reject proposed allocation", description: "Only a proposed allocation can be rejected by an authorized party.", roles: ["farmer","buyer","fpo","arthiya"], fields: ["allocationId"], run: (v) => apiRequest(`/allocations/${encodeURIComponent(v.allocationId)}/reject`, { method: "PATCH" }) },
  { key: "approveCommitment", title: "Approve deposited commitment", description: "Farmer/authorized admin only; commitment must await farmer approval.", roles: ["farmer"], fields: ["commitmentId"], run: (v) => apiRequest(`/commitments/${encodeURIComponent(v.commitmentId)}/approve`, { method: "POST" }) },
  { key: "editAuction", title: "Edit auction before first bid", description: "Requires an auction ID and at least one editable field. Values are sent as supplied.", roles: ["farmer","fpo","arthiya"], fields: ["auctionId","startTime","endTime","startingPrice"], run: (v) => {
    const payload = {};
    if (v.startTime) payload.startTime = v.startTime;
    if (v.endTime) payload.endTime = v.endTime;
    if (v.startingPrice !== "") payload.startingPrice = Number(v.startingPrice);
    return apiRequest(`/auctions/${encodeURIComponent(v.auctionId)}`, { method: "PATCH", body: JSON.stringify(payload) });
  }},
  { key: "cancelAuction", title: "Cancel auction before first bid", description: "Cancellation is blocked after a bid or external offer exists.", roles: ["farmer","fpo","arthiya"], fields: ["auctionId"], run: (v) => apiRequest(`/auctions/${encodeURIComponent(v.auctionId)}/cancel`, { method: "POST" }) },
  { key: "rejectExternalOffer", title: "Reject external offer", description: "Requires an open auction and an offer recorded for it.", roles: ["farmer","fpo","arthiya"], fields: ["auctionId","offerId"], run: (v) => apiRequest(`/auctions/${encodeURIComponent(v.auctionId)}/external-offers/${encodeURIComponent(v.offerId)}/reject`, { method: "POST" }) },
  { key: "payouts", title: "Load payout ledger", description: "Ledger entries only; no money is transferred. Access depends on role.", roles: ["farmer","fpo","arthiya","buyer"], fields: [], run: () => apiRequest("/payouts") },
  { key: "anchorHistory", title: "View entity blockchain proofs", description: "Requires entity type and entity ID accessible to this account.", roles: ["farmer","buyer","fpo","arthiya"], fields: ["entityType","entityId"], run: (v) => apiRequest(`/blockchain/anchors/${encodeURIComponent(v.entityType)}/${encodeURIComponent(v.entityId)}`) },
  { key: "adminPayoutStatus", title: "Update payout ledger status", description: "Admin-only action. It will be rejected for non-admin accounts.", roles: ["admin"], fields: ["payoutId","status"], run: (v) => apiRequest(`/payouts/${encodeURIComponent(v.payoutId)}`, { method: "PATCH", body: JSON.stringify({ status: v.status }) }) },
  { key: "adminManualAnchor", title: "Manually anchor supported event", description: "Admin-only. Provide eventType, entityType, entityId and payload JSON accepted by the backend.", roles: ["admin"], fields: ["eventType","entityType","entityId","payloadJson"], run: (v) => apiRequest("/blockchain/anchor", { method: "POST", body: JSON.stringify({ eventType: v.eventType, entityType: v.entityType, entityId: v.entityId, payload: JSON.parse(v.payloadJson || "{}") }) }) },
  { key: "adminAnchorStatus", title: "Check blockchain anchor status", description: "Admin-only action; requires the event ID.", roles: ["admin"], fields: ["eventId"], run: (v) => apiRequest(`/blockchain/status/${encodeURIComponent(v.eventId)}`) },
  { key: "adminRetryAnchor", title: "Retry blockchain anchor", description: "Admin-only action; requires an anchor record ID.", roles: ["admin"], fields: ["anchorId"], run: (v) => apiRequest(`/blockchain/anchors/${encodeURIComponent(v.anchorId)}/retry`, { method: "POST" }) },
];

function OperationsHub({ user = null }) {
  const role = String(user?.role || "farmer").toLowerCase();
  const content = ROLE_CONTENT[role] || ROLE_CONTENT.farmer;
  const actions = ACTIONS.filter((action) => action.roles.includes(role));
  const [values, setValues] = useState({});
  const [busy, setBusy] = useState("");
  const [results, setResults] = useState({});
  const [filter, setFilter] = useState("all");

  const visibleGroups = useMemo(() => content.groups.map((group) => ({
    ...group,
    items: group.items.filter((item) => filter === "all" || (filter === "pending" ? /allocation|commitment|payment|settlement|bid|offer/i.test(item[0]) : /supply|crop|produce|pool/i.test(item[0])))
  })).filter((group) => group.items.length), [content, filter]);

  const updateValue = (key, field, value) => setValues((old) => ({ ...old, [key]: { ...(old[key] || {}), [field]: value } }));

  async function execute(action) {
    setBusy(action.key);
    setResults((old) => ({ ...old, [action.key]: null }));
    try {
      const data = await action.run(values[action.key] || {});
      setResults((old) => ({ ...old, [action.key]: { ok: true, data } }));
    } catch (error) {
      setResults((old) => ({ ...old, [action.key]: { ok: false, message: error.message || "Request failed" } }));
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[28px] bg-[#103f31] px-6 py-8 text-white shadow-lg sm:px-9 sm:py-10">
        <div className="absolute -right-14 -top-20 h-64 w-64 rounded-full border-[36px] border-white/5" />
        <div className="absolute bottom-[-90px] right-28 h-56 w-56 rounded-full bg-emerald-500/10 blur-2xl" />
        <div className="relative max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-200">e-Arthiya · Operations centre</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{content.label}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-50/80 sm:text-base">{content.intro}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to={`/${role}`} className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-50">Back to overview</Link>
            <span className="rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-emerald-50/90">Signed in as {user?.name || role}</span>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-800">Role-based dashboard</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">Your workspace, at a glance</h2>
            <p className="mt-1 text-sm text-slate-500">Every tile opens the existing workflow page for that capability.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {[["all","All features"],["supply","Supply"],["pending","Trade actions"]].map(([key,label]) => <button key={key} onClick={() => setFilter(key)} className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${filter===key?"border-emerald-900 bg-emerald-900 text-white":"border-slate-200 bg-white text-slate-600 hover:border-emerald-300"}`}>{label}</button>)}
          </div>
        </div>
        {visibleGroups.map((group) => (
          <div key={group.title} className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-700">{group.title}</h3>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {group.items.map(([title,description,path,cta],index) => (
                <Link key={title} to={path} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-sm font-bold text-emerald-900">{String(index+1).padStart(2,"0")}</div>
                    <span className="text-xs font-semibold text-emerald-800 group-hover:underline">{cta} <span aria-hidden="true">↗</span></span>
                  </div>
                  <h4 className="mt-4 font-semibold text-slate-950">{title}</h4>
                  <p className="mt-1.5 text-sm leading-5 text-slate-500">{description}</p>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="space-y-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-800">Live backend checks</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">Run actions against your API</h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">These controls send requests to the configured backend using your current login token. Use real record IDs from your database. A success response confirms the endpoint response, not a complete end-to-end business test.</p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-5 text-amber-900">
          <strong>Demo-payment notice:</strong> payment and payout screens represent records/ledger activity. They do not transfer real money. A blocked request can be expected when the record is in the wrong state or your role lacks permission.
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          {actions.map((action) => (
            <div key={action.key} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="font-semibold text-slate-950">{action.title}</h3>
                  <p className="mt-1 text-sm leading-5 text-slate-500">{action.description}</p>
                </div>
                <span className="w-fit rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-600">{action.fields.length ? "Record action" : "Read request"}</span>
              </div>
              {action.fields.length > 0 && <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {action.fields.map((field) => <label key={field} className="block text-xs font-semibold capitalize text-slate-600">{field.replace(/([A-Z])/g," $1")}
                  <input value={values[action.key]?.[field] || ""} onChange={(event) => updateValue(action.key,field,event.target.value)} placeholder={field.includes("Time") ? "ISO date/time" : `Enter ${field}`} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-normal text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100" />
                </label>)}
              </div>}
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button disabled={busy===action.key || action.fields.some((field) => !String(values[action.key]?.[field] ?? "").trim() && !["startTime","endTime","startingPrice"].includes(field)) || (action.key==="editAuction" && !["startTime","endTime","startingPrice"].some((field)=>String(values[action.key]?.[field] ?? "").trim()))} onClick={() => execute(action)} className="rounded-xl bg-emerald-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-950 disabled:cursor-not-allowed disabled:opacity-40">{busy===action.key ? "Sending request..." : "Run backend check"}</button>
                {results[action.key] && <span className={`text-xs font-semibold ${results[action.key].ok?"text-emerald-700":"text-red-700"}`}>{results[action.key].ok ? "Request succeeded" : "Request failed"}</span>}
              </div>
              {results[action.key] && <pre className={`mt-3 max-h-56 overflow-auto rounded-xl border p-3 text-xs leading-5 ${results[action.key].ok?"border-emerald-100 bg-emerald-50/60 text-emerald-950":"border-red-100 bg-red-50 text-red-900"}`}>{JSON.stringify(results[action.key].ok ? results[action.key].data : { error: results[action.key].message },null,2)}</pre>}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default OperationsHub;
