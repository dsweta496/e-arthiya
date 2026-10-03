import { Link } from "react-router-dom";

function FPODashboard({ user = null }) {
  const fpoName = user?.name || "Your FPO";

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
              FPO workspace
            </span>
          </div>

          <h1 className="text-3xl font-bold tracking-[-0.045em] text-slate-950 sm:text-4xl">
            {fpoName}.
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
            Coordinate your farmer network, pool available produce and connect
            collective supply with verified buyer demand.
          </p>
        </div>

        <Link
          to="/fpo/pools/create"
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
          label="Farmers connected"
          value="48"
          unit="farmers"
          detail="Across your network"
          icon={<UsersIcon />}
        />

        <StatCard
          label="Active supply"
          value="186"
          unit="quintal"
          detail="Across available pools"
          icon={<PackageIcon />}
        />

        <StatCard
          label="Open demand"
          value="12"
          unit="requests"
          detail="Buyer requirements"
          icon={<TargetIcon />}
        />

        <StatCard
          label="Active pools"
          value="8"
          unit="pools"
          detail="Currently aggregating"
          icon={<LayersIcon />}
        />
      </section>

      {/* ------------------------------------------------ */}
      {/* MAIN GRID */}
      {/* ------------------------------------------------ */}

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.85fr)]">
        {/* Supply pools */}
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-start justify-between border-b border-slate-100 px-5 py-5 sm:px-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                Aggregation
              </p>

              <h2 className="mt-1 text-lg font-bold tracking-tight text-slate-950">
                Active supply pools
              </h2>
            </div>

            <Link
              to="/fpo/pools"
              className="text-xs font-bold text-emerald-800 transition hover:text-emerald-950"
            >
              View all →
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            <PoolRow
              crop="Tomato Hybrid"
              farmers="12 farmers"
              quantity="58 quintal"
              status="Matching"
              statusType="matching"
              demand="Buyer demand · 45 q"
            />

            <PoolRow
              crop="Wheat"
              farmers="18 farmers"
              quantity="74 quintal"
              status="Open"
              statusType="open"
              demand="Buyer demand · 90 q"
            />

            <PoolRow
              crop="Mustard"
              farmers="8 farmers"
              quantity="32 quintal"
              status="Committed"
              statusType="committed"
              demand="Buyer · 30 q"
            />
          </div>

          <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-4 sm:px-6">
            <Link
              to="/fpo/pools/create"
              className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 py-3 text-sm font-semibold text-slate-600 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800"
            >
              <PlusIcon />
              Create another supply pool
            </Link>
          </div>
        </div>

        {/* Demand panel */}
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-emerald-950 text-white shadow-sm">
          <div className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-300">
                  Buyer demand
                </p>

                <h2 className="mt-2 text-xl font-bold tracking-tight">
                  Demand waiting to be filled
                </h2>
              </div>

              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                <TargetIcon />
              </span>
            </div>

            <p className="mt-4 text-sm leading-6 text-emerald-100/75">
              Aggregate farmer supply against buyer requirements and identify
              where your network can fill the gap.
            </p>

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">Wheat</p>

                  <p className="mt-1 text-xs text-emerald-100/60">
                    Standard quality
                  </p>
                </div>

                <span className="rounded-full bg-amber-400/15 px-2.5 py-1 text-[11px] font-bold text-amber-200">
                  NEEDS SUPPLY
                </span>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xl font-bold">90 q</p>

                  <p className="mt-1 text-xs text-emerald-100/60">
                    Buyer requirement
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xl font-bold">74 q</p>

                  <p className="mt-1 text-xs text-emerald-100/60">
                    Network supply
                  </p>
                </div>
              </div>

              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-[82%] rounded-full bg-emerald-400" />
              </div>
            </div>

            <Link
              to="/fpo/demand"
              className="mt-5 flex items-center justify-center rounded-xl bg-white px-4 py-3 text-sm font-bold text-emerald-950 transition hover:bg-emerald-50"
            >
              Explore buyer demand
              <span className="ml-2">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ */}
      {/* FARMER NETWORK + SETTLEMENTS */}
      {/* ------------------------------------------------ */}

      <section className="grid gap-6 lg:grid-cols-2">
        {/* Farmer network */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                Network
              </p>

              <h2 className="mt-1 text-lg font-bold tracking-tight text-slate-950">
                Farmer activity
              </h2>
            </div>

            <Link
              to="/fpo/farmers"
              className="text-xs font-bold text-emerald-800"
            >
              Manage farmers →
            </Link>
          </div>

          <div className="mt-5 space-y-3">
            <FarmerRow
              initials="RS"
              name="Rajesh Singh"
              location="Bulandshahr"
              supply="18 q"
              status="Available"
            />

            <FarmerRow
              initials="AK"
              name="Amit Kumar"
              location="Meerut"
              supply="24 q"
              status="Committed"
            />

            <FarmerRow
              initials="PM"
              name="Pooja Malik"
              location="Hapur"
              supply="12 q"
              status="Available"
            />

            <FarmerRow
              initials="VS"
              name="Vijay Sharma"
              location="Ghaziabad"
              supply="20 q"
              status="Preorder"
            />
          </div>
        </div>

        {/* Settlements */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                Finance
              </p>

              <h2 className="mt-1 text-lg font-bold tracking-tight text-slate-950">
                Recent settlements
              </h2>
            </div>

            <Link
              to="/fpo/settlements"
              className="text-xs font-bold text-emerald-800"
            >
              View settlements →
            </Link>
          </div>

          <div className="mt-5 space-y-3">
            <SettlementRow
              crop="Tomato Hybrid"
              amount="₹1,35,200"
              date="01 Oct 2026"
              status="Completed"
            />

            <SettlementRow
              crop="Mustard"
              amount="₹1,02,600"
              date="29 Sep 2026"
              status="Completed"
            />

            <SettlementRow
              crop="Wheat"
              amount="₹86,400"
              date="27 Sep 2026"
              status="Processing"
            />
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ */}
      {/* AGGREGATION EXPLAINER */}
      {/* ------------------------------------------------ */}

      <section className="rounded-3xl border border-emerald-100 bg-emerald-50/70 p-5 sm:p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">
              Why aggregation matters
            </p>

            <h2 className="mt-2 text-xl font-bold tracking-tight text-emerald-950">
              Small harvests. Collective market power.
            </h2>

            <p className="mt-2 text-sm leading-6 text-emerald-900/65">
              Bring together produce from multiple farmers so buyers can
              source meaningful quantities without every farmer having to
              handle the entire transaction alone.
            </p>
          </div>

          <div className="grid shrink-0 grid-cols-3 gap-2 sm:gap-3">
            <MiniMetric value="12" label="Farmers" />
            <MiniMetric value="58 q" label="Supply" />
            <MiniMetric value="45 q" label="Demand" />
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
/* POOL ROW */
/* ====================================================== */

function PoolRow({
  crop,
  farmers,
  quantity,
  status,
  statusType,
  demand,
}) {
  const statusClasses = {
    matching: "bg-emerald-50 text-emerald-700",
    open: "bg-slate-100 text-slate-600",
    committed: "bg-blue-50 text-blue-700",
  };

  return (
    <div className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-emerald-800">
          <LayersIcon />
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
            {farmers} · {quantity} · {demand}
          </p>
        </div>
      </div>

      <span className="text-xs font-semibold text-slate-500">
        Aggregated
      </span>
    </div>
  );
}

/* ====================================================== */
/* FARMER ROW */
/* ====================================================== */

function FarmerRow({
  initials,
  name,
  location,
  supply,
  status,
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-900 text-xs font-bold text-white">
        {initials}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-slate-800">{name}</p>

        <p className="mt-0.5 text-xs text-slate-400">
          {location} · {supply}
        </p>
      </div>

      <span className="text-[10px] font-bold text-emerald-700">
        {status}
      </span>
    </div>
  );
}

/* ====================================================== */
/* SETTLEMENT ROW */
/* ====================================================== */

function SettlementRow({
  crop,
  amount,
  date,
  status,
}) {
  const statusClass =
    status === "Completed"
      ? "text-emerald-700"
      : "text-amber-700";

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-800 shadow-sm">
        <WalletIcon />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-slate-800">
          {crop}
        </p>

        <p className="mt-0.5 text-xs text-slate-400">
          {date} ·{" "}
          <span className={`font-semibold ${statusClass}`}>
            {status}
          </span>
        </p>
      </div>

      <span className="text-sm font-bold text-slate-800">
        {amount}
      </span>
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

function WalletIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5 fill-none stroke-current stroke-[1.8]"
    >
      <path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" />
      <path d="M4 8h16" />
      <path d="M15 14h5" />
      <circle cx="15" cy="14" r=".7" fill="currentColor" />
    </svg>
  );
}

export default FPODashboard;