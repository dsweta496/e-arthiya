import { Link } from "react-router-dom";

export default function AdminLayout({ children, user = null }) {
  return (
    <div className="min-h-screen bg-[#f6f8f5] text-slate-900">
      <header className="flex min-h-[68px] items-center justify-between border-b border-slate-200 bg-white px-5 sm:px-8">
        <Link to="/admin/operations" className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-950 text-sm font-bold text-white">e</span>
          <span className="font-semibold tracking-tight text-emerald-950">e-Arthiya <span className="ml-2 text-xs font-medium text-slate-400">Administration</span></span>
        </Link>
        <div className="text-right">
          <p className="text-sm font-semibold text-slate-800">{user?.name || "Admin account"}</p>
          <p className="text-xs text-emerald-800">Administrator</p>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[1500px] px-5 py-6 sm:px-7 lg:px-10 lg:py-8">{children}</main>
    </div>
  );
}
