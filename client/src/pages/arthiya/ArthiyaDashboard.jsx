import { Link } from "react-router-dom";

function ArthiyaDashboard({ user = null }) {
  const arthiyaName = user?.name || "Your workspace";

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
              Arthiya workspace
            </span>
          </div>

          <h1 className="text-3xl font-bold tracking-[-0.045em] text-slate-950 sm:text-4xl">
            {arthiyaName}.
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
            Connect your farmer network with market opportunities, aggregate
            supply and manage trades from one workspace.
          </p>
        </div>

        <Link
          to="/arthiya/pools/create"
          className="inline-flex w-fit items-center gap-2 rounded-xl bg-emerald-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-950"
        >
          <PlusIcon />
          Create supply pool
        </Link>
      </section>

      {/* ------------------------------------------------ */}
      {/* QUICK STATS */}
      {/* ------------------------------------------------ */}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Farmer network"
          value="36"
          unit="farmers"
          detail="Active relationships"
          icon={<UsersIcon />}
        />

        <StatCard
          label="Available supply"
          value="142"
          unit="quintal"
          detail="Ready for market"
          icon={<PackageIcon />}
        />

        <StatCard
          label="Market opportunities"
          value="9"
          unit="open"
          detail="Relevant buyer demand"
          icon={<TrendingIcon />}
        />

        <StatCard
          label="Active deals"
          value="7"
          unit="deals"
          detail="Currently in progress"
          icon={<HandshakeIcon />}
        />
      </section>

      {/* ------------------------------------------------ */}
      {/* MAIN GRID */}
      {/* ------------------------------------------------ */}

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.85fr)]">
        {/* Market opportunities */}
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-start justify-between border-b border-slate-100 px-5 py-5 sm:px-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                Marketplace
              </p>

              <h2 className="mt-1 text-lg font-bold tracking-tight text-slate-950">
                Market opportunities
              </h2>
            </div>

            <Link
              to="/arthiya/opportunities"
              className="text-xs font-bold text-emerald-800 transition hover:text-emerald-950"
            >
              View all →
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            <OpportunityRow
              crop="Tomato Hybrid"
              demand="45 quintal"
              farmers="12 farmers"
              price="₹2,600 / q"
              status="Strong demand"
              statusType="strong"
            />

            <OpportunityRow
              crop="Wheat"
              demand="90 quintal"
              farmers="18 farmers"
              price="₹2,250 / q"
              status="Supply gap"
              statusType="gap"
            />

            <OpportunityRow
              crop="Mustard"
              demand="30 quintal"
              farmers="8 farmers"
              price="₹5,400 / q"
              status="Matched"
              statusType="matched"
            />
          </div>

          <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-4 sm:px-6">
            <Link
              to="/arthiya/opportunities"
              className="flex items-center justify-center rounded-xl border border-dashed border-slate-300 py-3 text-sm font-semibold text-slate-600 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800"
            >
              Explore marketplace opportunities
            </Link>
          </div>
        </div>

        {/* Network panel */}
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-emerald-950 text-white shadow-sm">
          <div className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-300">
                  Farmer network
                </p>

                <h2 className="mt-2 text-xl font-bold tracking-tight">
                  Supply available
                </h2>
              </div>

              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                <UsersIcon />
              </span>
            </div>

            <p className="mt-4 text-sm leading-6 text-emerald-100/75">
              Your network currently has produce that can be aggregated for
              active market demand.
            </p>

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">
                  Ready to aggregate
                </span>

                <span className="rounded-full bg-emerald-400/15 px-2.5 py-1 text-[11px] font-bold text-emerald-200">
                  142 Q
                </span>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div>
                  <p className="text-2xl font-bold">36</p>

                  <p className="mt-1 text-xs text-emerald-100/60">
                    Farmers
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-2xl font-bold">9</p>

                  <p className="mt-1 text-xs text-emerald-100/60">
                    Opportunities
                  </p>
                </div>
              </div>
            </div>

            <Link
              to="/arthiya/farmers"
              className="mt-5 flex items-center justify-center rounded-xl bg-white px-4 py-3 text-sm font-bold text-emerald-950 transition hover:bg-emerald-50"
            >
              View farmer network
              <span className="ml-2">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ */}
      {/* SUPPLY + DEALS */}
      {/* ------------------------------------------------ */}

      <section className="grid gap-6 lg:grid-cols-2">
        {/* Supply pools */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                Aggregation
              </p>

              <h2 className="mt-1 text-lg font-bold tracking-tight text-slate-950">
                Your supply pools
              </h2>
            </div>

            <Link
              to="/arthiya/pools"
              className="text-xs font-bold text-emerald-800"
            >
              View all →
            </Link>
          </div>

          <div className="mt-5 space-y-3">
            <PoolRow
              crop="Tomato Hybrid"
              farmers="12 farmers"
              quantity="58 q"
              status="Matching"
              statusType="matching"
            />

            <PoolRow
              crop="Wheat"
              farmers="18 farmers"
              quantity="74 q"
              status="Open"
              statusType="open"
            />

            <PoolRow
              crop="Mustard"
              farmers="6 farmers"
              quantity="24 q"
              status="Committed"
              statusType="committed"
            />
          </div>
        </div>

        {/* Deals */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                Trade
              </p>

              <h2 className="mt-1 text-lg font-bold tracking-tight text-slate-950">
                Recent deals
              </h2>
            </div>

            <Link
              to="/arthiya/deals"
              className="text-xs font-bold text-emerald-800"
            >
              View deals →
            </Link>
          </div>

          <div className="mt-5 space-y-3">
            <DealRow
              crop="Tomato Hybrid"
              buyer="Buyer #2048"
              amount="₹1,35,200"
              status="Confirmed"
              statusType="confirmed"
            />

            <DealRow
              crop="Mustard"
              buyer="Buyer #1972"
              amount="₹1,02,600"
              status="Processing"
              statusType="processing"
            />

            <DealRow
              crop="Wheat"
              buyer="Buyer #2134"
              amount="₹86,400"
              status="Awaiting delivery"
              statusType="delivery"
            />
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ */}
      {/* NETWORK SNAPSHOT */}
      {/* ------------------------------------------------ */}

      <section className="rounded-3xl border border-emerald-100 bg-emerald-50/70 p-5 sm:p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">
              Market network
            </p>

            <h2 className="mt-2 text-xl font-bold tracking-tight text-emerald-950">
              Turn fragmented supply into market-ready lots.
            </h2>

            <p className="mt-2 text-sm leading-6 text-emerald-900/65">
              Bring together supply from your farmer network, match it against
              demand and create a clear path from aggregation to settlement.
            </p>
          </div>

          <div className="grid shrink-0 grid-cols-3 gap-2 sm:gap-3">
            <MiniMetric value="36" label="Farmers" />
            <MiniMetric value="142 q" label="Supply" />
            <MiniMetric value="7" label="Deals" />
          </div>
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
/* OPPORTUNITY ROW */
/* ====================================================== */

function OpportunityRow({
  crop,
  demand,
  farmers,
  price,
  status,
  statusType,
}) {
  const statusClasses = {
    strong: "bg-emerald-50 text-emerald-700",
    gap: "bg-amber-50 text-amber-700",
    matched: "bg-blue-50 text-blue-700",
  };

  return (
    <div className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-emerald-800">
          <TrendingIcon />
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-bold text-slate-900">
              {crop}
            </p>

            <span
              className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${statusClasses[statusType]}`}
            >
              {status}
            </span>
          </div>

          <p className="mt-0.5 text-xs text-slate-400">
            Demand · {demand} · {farmers}
          </p>
        </div>
      </div>

      <span className="text-sm font-bold text-slate-800">{price}</span>
    </div>
  );
}

/* ====================================================== */
/* POOL ROW */
/* ====================================================== */

function PoolRow({
  crop,
  farmers,
  quantity,
  status,
  statusType,
}) {
  const statusClasses = {
    matching: "bg-emerald-50 text-emerald-700",
    open: "bg-slate-100 text-slate-600",
    committed: "bg-blue-50 text-blue-700",
  };

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-800 shadow-sm">
        <LayersIcon />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-bold text-slate-800">
            {crop}
          </p>

          <span
            className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${statusClasses[statusType]}`}
          >
            {status}
          </span>
        </div>

        <p className="mt-0.5 text-xs text-slate-400">
          {farmers} · {quantity}
        </p>
      </div>
    </div>
  );
}

/* ====================================================== */
/* DEAL ROW */
/* ====================================================== */

function DealRow({
  crop,
  buyer,
  amount,
  status,
  statusType,
}) {
  const statusClasses = {
    confirmed: "text-emerald-700",
    processing: "text-amber-700",
    delivery: "text-blue-700",
  };

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-800 shadow-sm">
        <HandshakeIcon />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-slate-800">
          {crop}
        </p>

        <p className="mt-0.5 text-xs text-slate-400">
          {buyer} ·{" "}
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
/* MINI METRIC */
/* ====================================================== */

function MiniMetric({ value, label }) {
  return (
    <div className="rounded-2xl border border-emerald-100 bg-white/70 px-4 py-3 text-center">
      <p className="text-lg font-bold text-emerald-950">{value}</p>

      <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700/60">
        {label}
      </p>
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

function UsersIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5 fill-none stroke-current stroke-[1.8]"
    >
      <path d="M16 20v-1.5a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4V20" />
      <circle cx="9.5" cy="7.5" r="3.5" />
      <path d="M17 11a3.5 3.5 0 1 0 0-7" />
      <path d="M17 14.5h1a4 4 0 0 1 4 4V20" />
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

function TrendingIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5 fill-none stroke-current stroke-[1.8]"
    >
      <path d="m3 17 6-6 4 4 8-9" />
      <path d="M15 6h6v6" />
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

function LayersIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5 fill-none stroke-current stroke-[1.8]"
    >
      <path d="m12 3 9 5-9 5-9-5 9-5Z" />
      <path d="m3 12 9 5 9-5" />
      <path d="m3 16 9 5 9-5" />
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

export default ArthiyaDashboard;