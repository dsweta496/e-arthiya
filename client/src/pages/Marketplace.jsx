import Navbar from "../components/Navbar";

function Marketplace() {
  return (
    <div className="min-h-screen bg-slate-50 text-arthiya-dark">

      <Navbar />

      <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10 lg:py-10">

        {/* HERO */}
        <section className="rounded-[1.75rem] bg-gradient-to-br from-arthiya-green via-[#174b3b] to-[#315f49] p-6 text-white shadow-xl shadow-arthiya-green/10 sm:p-8 lg:p-10">
          <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">

            <div className="max-w-2xl">
              <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-arthiya-sage">
                MARKETPLACE OVERVIEW
              </p>

              <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl lg:text-5xl">
                Where supply meets demand.
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-6 text-white/70 sm:text-base">
                Discover available produce, active procurement requirements
                and aggregated supply pools across e-Arthiya.
              </p>
            </div>

            <div className="flex gap-3">
              <button className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-arthiya-green">
                + Add Supply
              </button>

              <button className="rounded-full border border-white/30 bg-white/10 px-5 py-3 text-sm font-semibold text-white">
                + Post Demand
              </button>
            </div>

          </div>
        </section>

        {/* METRICS */}
        <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Metric value="120+" label="Farmers" />
          <Metric value="35+" label="Buyers" />
          <Metric value="48" label="Supply pools" />
          <Metric value="16" label="Active auctions" />
        </section>

        {/* SUPPLY */}
        <section className="mt-10">
          <SectionTitle eyebrow="AVAILABLE SUPPLY" title="What farmers have" />

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <SupplyCard
              crop="Wheat"
              variety="Sharbati"
              quantity="20 Q"
              type="Spot"
              location="Haryana"
              price="₹2,450 / Q"
              status="Available"
            />

            <SupplyCard
              crop="Roses"
              variety="Dutch Rose"
              quantity="12 Q"
              type="Preorder"
              location="Uttar Pradesh"
              price="₹4,800 / Q"
              status="Future supply"
            />

            <SupplyCard
              crop="Tomato"
              variety="Hybrid"
              quantity="35 Q"
              type="Spot"
              location="Himachal Pradesh"
              price="₹1,900 / Q"
              status="Available"
            />
          </div>
        </section>

        {/* DEMAND */}
        <section className="mt-12">
          <SectionTitle eyebrow="PROCUREMENT" title="What buyers need" />

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <DemandCard
              buyer="FreshMart Foods"
              crop="Wheat"
              quantity="39 Q"
              window="Required in 8 months"
              matched="72%"
              location="Delhi NCR"
            />

            <DemandCard
              buyer="GreenBasket"
              crop="Tomato"
              quantity="50 Q"
              window="Required in 12 days"
              matched="44%"
              location="Noida"
            />
          </div>
        </section>

        {/* SUPPLY POOL */}
        <section className="mt-12">
          <SectionTitle eyebrow="SUPPLY POOLS" title="Aggregated supply" />

          <div className="mt-5 rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-xl font-semibold">Dutch Rose</h3>

                  <span className="rounded-full bg-arthiya-light-sage px-2.5 py-1 text-[11px] font-bold text-arthiya-green">
                    MATCHED
                  </span>
                </div>

                <p className="mt-1 text-sm text-slate-500">
                  3 farmers contributing to one buyer requirement
                </p>
              </div>

              <div className="grid grid-cols-3 gap-6 text-sm">
                <MiniStat value="20 Q" label="Total pool" />
                <MiniStat value="3" label="Farmers" />
                <MiniStat value="20 Q" label="Demand matched" />
              </div>

              <button className="rounded-full border border-arthiya-green/20 px-5 py-2.5 text-sm font-semibold text-arthiya-green">
                View pool →
              </button>

            </div>

            <div className="mt-6 h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full w-full rounded-full bg-arthiya-green" />
            </div>

            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-500">
              <span>Farmer A · 6 Q</span>
              <span>Farmer B · 7 Q</span>
              <span>Farmer C · 7 Q</span>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}

function SectionTitle({ eyebrow, title }) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-arthiya-green/70">
        {eyebrow}
      </p>

      <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
        {title}
      </h2>
    </div>
  );
}

function Metric({ value, label }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
      <p className="text-2xl font-semibold tracking-tight text-arthiya-green sm:text-3xl">
        {value}
      </p>

      <p className="mt-1 text-xs font-medium text-slate-500 sm:text-sm">
        {label}
      </p>
    </div>
  );
}

function SupplyCard({ crop, variety, quantity, type, location, price, status }) {
  return (
    <article className="rounded-[1.4rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <div className="flex items-start justify-between gap-4">

        <div>
          <span className="rounded-full bg-arthiya-light-sage px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-arthiya-green">
            {type}
          </span>

          <h3 className="mt-4 text-xl font-semibold">{crop}</h3>

          <p className="mt-1 text-sm text-slate-500">{variety}</p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-50 text-xl">
          🌾
        </div>

      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <Info label="Quantity" value={quantity} />
        <Info label="Price" value={price} />
        <Info label="Location" value={location} />
        <Info label="Status" value={status} />
      </div>

      <button className="mt-5 w-full rounded-full bg-arthiya-green py-2.5 text-sm font-semibold text-white">
        View supply →
      </button>
    </article>
  );
}

function DemandCard({ buyer, crop, quantity, window, matched, location }) {
  return (
    <article className="rounded-[1.4rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">

        <div>
          <p className="text-xs font-semibold text-slate-400">{buyer}</p>

          <h3 className="mt-1 text-xl font-semibold">
            {quantity} {crop}
          </h3>

          <p className="mt-1 text-sm text-slate-500">{window}</p>
        </div>

        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-600">
          {location}
        </span>

      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-slate-500">Supply matched</span>
          <span className="text-arthiya-green">{matched}</span>
        </div>

        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-arthiya-green"
            style={{ width: matched }}
          />
        </div>
      </div>

      <button className="mt-5 rounded-full border border-arthiya-green/20 px-4 py-2.5 text-sm font-semibold text-arthiya-green">
        See matching supply →
      </button>
    </article>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 truncate text-xs font-semibold text-slate-700">
        {value}
      </p>
    </div>
  );
}

function MiniStat({ value, label }) {
  return (
    <div>
      <p className="font-semibold text-arthiya-green">{value}</p>
      <p className="mt-0.5 text-[11px] text-slate-400">{label}</p>
    </div>
  );
}

export default Marketplace;
