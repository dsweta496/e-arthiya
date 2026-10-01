import { Link, useLocation } from "react-router-dom";

function Navbar() {
  const location = useLocation();

  const item = (path) =>
    location.pathname === path
      ? "font-semibold text-emerald-800"
      : "text-slate-600 transition hover:text-emerald-800";

  return (
    <header className="relative z-50 border-b border-slate-200/80 bg-white/90 shadow-sm backdrop-blur-xl">
      <nav className="mx-auto flex h-[68px] max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-900 text-sm font-bold text-white">
            e
          </span>
          <span className="text-lg font-bold tracking-[-0.035em] text-emerald-950 sm:text-xl">
            e-Arthiya
          </span>
        </Link>

        <div className="hidden items-center gap-7 text-sm font-medium md:flex">
          <Link to="/" className={item("/")}>Home</Link>
          <Link to="/marketplace" className={item("/marketplace")}>Marketplace</Link>
          <Link to="/dashboard" className={item("/dashboard")}>Dashboard</Link>
          <Link to="/#how-it-works" className="text-slate-600 transition hover:text-emerald-800">How it works</Link>
          <Link to="/#about" className="text-slate-600 transition hover:text-emerald-800">About</Link>
        </div>

        <Link
          to="/marketplace"
          className="rounded-full bg-emerald-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-950 sm:px-5"
        >
          Marketplace <span className="ml-1.5">→</span>
        </Link>
      </nav>
    </header>
  );
}

export default Navbar;
