import { Link } from "react-router-dom";

function BuyerDashboard({ user = null }) {
  const buyerName = user?.name?.split(" ")[0] || "Buyer";

  return (
    <div className="space-y-7">
      {/* ------------------------------------------------ */}
      {/* HEADER */}
      {/* ------------------------------------------------ */}

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
            Find the right supply, track your requirements and manage your
            protected purchases from one place.
          </p>
        </div>

        <Link
          to="/buyer/requirements/add"
          className="inline-flex w-fit items-center gap-2 rounded-xl bg-emerald-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-950"
        >
          <PlusIcon />
          Post requirement
        </Link>
      </section>

      {/* ------------------------------------------------ */}
      {/* QUICK STATS */}
      {/* ------------------------------------------------ */}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Open requirements"
          value="4"
          unit="requests"
          detail="Currently sourcing"
          icon={<ClipboardIcon />}
        />

        <StatCard
          label="Matched supply"
          value="67"
          unit="quintal"
          detail="Available to review"
          icon={<PackageIcon />}
        />

        <StatCard
          label="Active bids"
          value="6"
          unit="bids"
          detail="Across live auctions"
          icon={<GavelIcon />}
        />

        <StatCard
          label="Protected purchases"
          value="3"
          unit="deals"
          detail="Commitments confirmed"
          icon={<ShieldIcon />}
        />
      </section>

      {/* ------------------------------------------------ */}
      {/* MAIN GRID */}
      {/* ------------------------------------------------ */}

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.85fr)]">
        {/* Requirements */}
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-start justify-between border-b border-slate-100 px-5 py-5 sm:px-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                Your demand
              </p>

              <h2 className="mt-1 text-lg font-bold tracking-tight text-slate-950">
                Active requirements
              </h2>
            </div>

            <Link
              to="/buyer/requirements"
              className="text-xs font-bold text-emerald-800 transition hover:text-emerald-950"
            >
              View all →
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            <RequirementRow
              crop="Tomato Hybrid"
              quantity="15 quintal"
              type="Immediate"
              status="Matched"
              statusType="matched"
              requiredBy="Required · 08 Oct"
            />

            <RequirementRow
              crop="Wheat"
              quantity="40 quintal"
              type="Forward"
              status="Partially matched"
              statusType="partial"
              requiredBy="Required · 14 Nov"
            />

            <RequirementRow
              crop="Mustard"
              quantity="25 quintal"
              type="Forward"
              status="Sourcing"
              statusType="sourcing"
              requiredBy="Required · 20 Nov"
            />
          </div>

          <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-4 sm:px-6">
            <Link
              to="/buyer/requirements/add"
              className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 py-3 text-sm font-semibold text-slate-600 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800"
            >
              <PlusIcon />
              Post another requirement
            </Link>
          </div>
        </div>

        {/* Match panel */}
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-emerald-950 text-white shadow-sm">
          <div className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-300">
                  Smart matching
                </p>

                <h2 className="mt-2 text-xl font-bold tracking-tight">
                  Supply ready for you
                </h2>
              </div>

              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                <TargetIcon />
              </span>
            </div>

            <p className="mt-4 text-sm leading-6 text-emerald-100/75">
              Available farmer supply that matches your current requirements.
            </p>

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">Tomato Hybrid</p>
                  <p className="mt-1 text-xs text-emerald-100/60">
                    3 farmer lots · pooled supply
                  </p>
                </div>

                <span className="rounded-full bg-emerald-400/15 px-2.5 py-1 text-[11px] font-bold text-emerald-200">
                  100% MATCH
                </span>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xl font-bold">15 q</p>
                  <p className="mt-1 text-xs text-emerald-100/60">
                    Available
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xl font-bold">₹2,600</p>
                  <p className="mt-1 text-xs text-emerald-100/60">
                    Indicative / q
                  </p>
                </div>
              </div>
            </div>

            <Link
              to="/buyer/matches"
              className="mt-5 flex items-center justify-center rounded-xl bg-white px-4 py-3 text-sm font-bold text-emerald-950 transition hover:bg-emerald-50"
            >
              Review matched supply
              <span className="ml-2">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ */}
      {/* AUCTIONS + COMMITMENTS */}
      {/* ------------------------------------------------ */}

      <section className="grid gap-6 lg:grid-cols-2">
        {/* Live auctions */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                Marketplace
              </p>

              <h2 className="mt-1 text-lg font-bold tracking-tight text-slate-950">
                Live auctions
              </h2>
            </div>

            <Link
              to="/buyer/auctions"
              className="text-xs font-bold text-emerald-800"
            >
              Browse all →
            </Link>
          </div>

          <div className="mt-5 space-y-3">
            <AuctionRow
              crop="Tomato Hybrid"
              quantity="20 q"
              currentBid="₹2,600 / q"
              ends="Ends in 42 min"
            />

            <AuctionRow
              crop="Basmati Rice"
              quantity="50 q"
              currentBid="₹6,850 / q"
              ends="Ends in 2h 15m"
            />

            <AuctionRow
              crop="Mustard"
              quantity="30 q"
              currentBid="₹5,350 / q"
              ends="Ends tomorrow"
            />
          </div>
        </div>

        {/* Commitments */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                Trade protection
              </p>

              <h2 className="mt-1 text-lg font-bold tracking-tight text-slate-950">
                Your commitments
              </h2>
            </div>

            <Link
              to="/buyer/commitments"
              className="text-xs font-bold text-emerald-800"
            >
              View all →
            </Link>
          </div>

          <div className="mt-5 space-y-3">
            <CommitmentRow
              crop="Tomato Hybrid"
              quantity="20 quintal"
              amount="₹52,000"
              status="Deposit confirmed"
              statusType="confirmed"
            />

            <CommitmentRow
              crop="Wheat"
              quantity="25 quintal"
              amount="₹56,250"
              status="Active"
              statusType="active"
            />

            <CommitmentRow
              crop="Mustard"
              quantity="12 quintal"
              amount="₹64,800"
              status="Awaiting delivery"
              statusType="delivery"
            />
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ */}
      {/* PROTECTION BANNER */}
      {/* ------------------------------------------------ */}

      <section className="rounded-3xl border border-emerald-100 bg-emerald-50/70 p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-900 text-white">
              <ShieldIcon />
            </div>

            <div>
              <h3 className="text-sm font-bold text-emerald-950">
                Protected buying
              </h3>

              <p className="mt-1 max-w-2xl text-xs leading-5 text-emerald-900/65">
                Confirmed purchases use protected commitments and deposits to
                create greater certainty for both sides of the trade.
              </p>
            </div>
          </div>

          <Link
            to="/buyer/commitments"
            className="shrink-0 text-sm font-bold text-emerald-900"
          >
            Manage commitments →
          </Link>
        </div>
      </section>
    </div>
  );
}

/* ====================================================== */
/* STAT CARD */
/* ====================================================== */

function StatCard({ label, value, unit, detail, icon }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
          {icon}
        </span>

        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
          Live
        </span>
      </div>

      <div className="mt-5 flex items-baseline gap-1.5">
        <span className="text-2xl font-bold tracking-tight text-slate-950">
          {value}
        </span>

        {unit && (
          <span className="text-xs font-semibold text-slate-400">{unit}</span>
        )}
      </div>

      <p className="mt-1 text-sm font-semibold text-slate-700">{label}</p>

      <p className="mt-1 text-xs text-slate-400">{detail}</p>
    </div>
  );
}

/* ====================================================== */
/* REQUIREMENT ROW */
/* ====================================================== */

function RequirementRow({
  crop,
  quantity,
  type,
  status,
  statusType,
  requiredBy,
}) {
  const statusClasses = {
    matched: "bg-emerald-50 text-emerald-700",
    partial: "bg-amber-50 text-amber-700",
    sourcing: "bg-slate-100 text-slate-600",
  };

  return (
    <div className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-emerald-800">
          <ClipboardIcon />
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-bold text-slate-900">
              {crop}
            </p>

            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-500">
              {type}
            </span>
          </div>

          <p className="mt-0.5 text-xs text-slate-400">
            {quantity} · {requiredBy}
          </p>
        </div>
      </div>

      <span
        className={`w-fit rounded-full px-2.5 py-1 text-[10px] font-bold ${statusClasses[statusType]}`}
      >
        {status}
      </span>
    </div>
  );
}

/* ====================================================== */
/* AUCTION ROW */
/* ====================================================== */

function AuctionRow({ crop, quantity, currentBid, ends }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-800 shadow-sm">
        <GavelIcon />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-slate-800">{crop}</p>

        <p className="mt-0.5 text-xs text-slate-400">
          {quantity} · {ends}
        </p>
      </div>

      <div className="text-right">
        <p className="text-sm font-bold text-slate-800">{currentBid}</p>

        <p className="mt-0.5 text-[10px] font-medium text-slate-400">
          Current bid
        </p>
      </div>
    </div>
  );
}

/* ====================================================== */
/* COMMITMENT ROW */
/* ====================================================== */

function CommitmentRow({
  crop,
  quantity,
  amount,
  status,
  statusType,
}) {
  const statusClasses = {
    confirmed: "text-emerald-700",
    active: "text-blue-700",
    delivery: "text-amber-700",
  };

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-800 shadow-sm">
        <HandshakeIcon />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-slate-800">{crop}</p>

        <p className="mt-0.5 text-xs text-slate-400">
          {quantity} ·{" "}
          <span className={`font-semibold ${statusClasses[statusType]}`}>
            {status}
          </span>
        </p>
      </div>

      <span className="text-sm font-bold text-slate-800">{amount}</span>
    </div>
  );
}

/* ====================================================== */
/* ICONS */
/* ====================================================== */

function PlusIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4 fill-none stroke-current stroke-[2]"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function ClipboardIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5 fill-none stroke-current stroke-[1.8]"
    >
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 4.5V3h6v1.5M8 9h8M8 13h8M8 17h5" />
    </svg>
  );
}

function PackageIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5 fill-none stroke-current stroke-[1.8]"
    >
      <path d="m21 8-9 5-9-5 9-5 9 5Z" />
      <path d="M3 8v8l9 5 9-5V8" />
      <path d="M12 13v8" />
    </svg>
  );
}

function GavelIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5 fill-none stroke-current stroke-[1.8]"
    >
      <path d="m14 4 6 6" />
      <path d="m17 7-7 7" />
      <path d="m13 3-3 3 8 8 3-3" />
      <path d="m5 14-2 2 5 5 2-2" />
      <path d="M3 21h9" />
    </svg>
  );
}

function TargetIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5 fill-none stroke-current stroke-[1.8]"
    >
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="1" />
    </svg>
  );
}

function HandshakeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5 fill-none stroke-current stroke-[1.8]"
    >
      <path d="m3 11 4-4 4 2 2-2 4 2 4-4" />
      <path d="m3 11 5 7 3-2 2 2 4-5 3 1 1-3" />
      <path d="m7 7 2-4 4 2 2-2 4 4" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5 fill-none stroke-current stroke-[1.8]"
    >
      <path d="M12 3 20 6v5c0 5-3.3 8.5-8 10-4.7-1.5-8-5-8-10V6l8-3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

export default BuyerDashboard;