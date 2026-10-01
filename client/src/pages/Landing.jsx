import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import heroImage from "../assets/hero-market.jpg";

function Landing({ onEnter }) {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-white text-arthiya-dark">
      <Navbar onEnter={onEnter} />

      {/* HERO */}
      <section className="relative overflow-visible border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl lg:grid-cols-[0.9fr_1.1fr] lg:items-stretch">
          {/* LEFT CONTENT */}
          <div className="relative z-10 flex items-center px-5 py-12 sm:px-8 sm:py-14 lg:px-10 lg:py-16 xl:px-12">
            <div className="max-w-xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-arthiya-green/15 bg-arthiya-light-sage/60 px-3.5 py-2 text-xs font-semibold text-arthiya-green sm:text-sm">
                <span className="h-2 w-2 rounded-full bg-arthiya-sage" />
                Smarter markets · Stronger farmers
              </div>

              <h1 className="text-[2.65rem] font-semibold leading-[0.98] tracking-[-0.05em] text-arthiya-dark sm:text-5xl lg:text-[3.55rem] xl:text-[4rem]">
                From farm
                <br />
                <span className="text-arthiya-green">to fair market.</span>
              </h1>

              <p className="mt-6 max-w-lg text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">
                A digital marketplace connecting farmers, buyers, FPOs and
                Arthiyas through transparent aggregation, demand matching and
                protected commitments.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={() => navigate("/marketplace")}
                  className="rounded-full bg-arthiya-green px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-arthiya-green/15 transition hover:-translate-y-0.5 hover:bg-arthiya-dark"
                >
                  Explore Marketplace
                  <span className="ml-2">→</span>
                </button>

                <button
                  onClick={() => navigate("/marketplace")}
                  className="rounded-full bg-arthiya-green px-5 py-3 text-sm font-semibold text-white"
                >
                  Get Started
                </button>
              </div>

              <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-slate-500 sm:text-sm">
                <span>✓ Multi-farmer aggregation</span>
                <span>✓ Spot & future demand</span>
              </div>
            </div>
          </div>

          {/* IMAGE */}
          <div className="relative min-h-[360px] sm:min-h-[430px] lg:min-h-[555px]">
            <img
              src={heroImage}
              alt="Indian farmer at a local agricultural market"
              className="absolute inset-0 h-full w-full object-cover object-[72%_center]"
            />

            <div className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-white via-white/45 to-transparent" />

            
          </div>
        </div>

        {/* FLOATING STATS — intentionally overlaps the hero */}
        <div className="relative z-20 mx-auto -mb-12 w-[calc(100%-2rem)] max-w-6xl sm:-mb-14 sm:w-[calc(100%-4rem)] lg:-mb-16 lg:w-[calc(100%-6rem)]">
          <div className="grid overflow-hidden rounded-[1.35rem] border border-white/80 bg-white/95 shadow-[0_18px_55px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:grid-cols-2 lg:grid-cols-4">
            <Stat value="120+" label="Farmers connected" />
            <Stat value="35+" label="Active buyers" />
            <Stat value="48" label="Supply pools" />
            <Stat value="16" label="Live auctions" />
          </div>
        </div>
      </section>

      {/* CONTENT */}
      <section className="mx-auto max-w-7xl px-5 pb-16 pt-28 sm:px-8 lg:px-10 lg:pb-20 lg:pt-32">
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-arthiya-green/70">
              THE E-ARTHIYA MODEL
            </p>

            <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-[-0.04em] text-arthiya-dark sm:text-4xl">
              Agriculture needs
              <br />
              <span className="text-arthiya-green">better connections.</span>
            </h2>
          </div>

          <p className="max-w-xl text-sm leading-6 text-slate-500 sm:text-base sm:leading-7">
            Small quantities from multiple farmers can become one dependable
            supply pool for a large buyer. e-Arthiya brings those two sides
            together while keeping the journey visible and structured.
          </p>
        </div>

        <div className="mt-9 grid gap-4 md:grid-cols-3">
          <FeatureCard
            number="01"
            title="Aggregate"
            text="Bring smaller farmer supplies together into a market-ready pool."
          />
          <FeatureCard
            number="02"
            title="Match"
            text="Connect pooled supply with immediate and future procurement demand."
          />
          <FeatureCard
            number="03"
            title="Protect"
            text="Create structured commitments designed to protect both sides of the trade."
          />
        </div>
      </section>

      {/* CTA */}
      <section className="bg-arthiya-green px-5 py-12 text-white sm:px-8 lg:px-10 lg:py-14">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-arthiya-sage">
              BUILT FOR THE MARKETPLACE
            </p>
            <h2 className="mt-2 max-w-2xl text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">
              From individual harvests to collective market power.
            </h2>
          </div>

          <button
            onClick={onEnter}
            className="w-fit shrink-0 rounded-full bg-white px-5 py-3 text-sm font-semibold text-arthiya-green transition hover:-translate-y-0.5 hover:bg-arthiya-light-sage"
          >
            Enter Marketplace →
          </button>
          
        </div>
      </section>
    </div>
  );
}

function Stat({ value, label }) {
  return (
    <div className="px-5 py-5 sm:px-6 sm:py-6 lg:px-7">
      <p className="text-2xl font-semibold tracking-tight text-arthiya-green sm:text-3xl">
        {value}
      </p>
      <p className="mt-1 text-xs font-medium text-slate-500 sm:text-sm">
        {label}
      </p>
    </div>
  );
}

function FeatureCard({ number, title, text }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-arthiya-sage hover:shadow-lg sm:p-7">
      <span className="text-[11px] font-bold tracking-widest text-slate-400">
        {number}
      </span>

      <h3 className="mt-8 text-xl font-semibold tracking-tight text-arthiya-dark sm:text-2xl">
        {title}
      </h3>

      <p className="mt-2.5 text-sm leading-6 text-slate-500">{text}</p>

      <div className="mt-6 flex h-8 w-8 items-center justify-center rounded-full bg-arthiya-light-sage text-sm text-arthiya-green">
        →
      </div>
    </article>
  );
}

export default Landing;
