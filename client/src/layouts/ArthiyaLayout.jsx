import { useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/navigation/Sidebar";

function ArthiyaLayout({ children, user = null }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f6f8f5] text-slate-900">
      <Navbar variant="arthiya" user={user} />

      <div className="flex min-h-[calc(100vh-68px)]">
        <Sidebar
          role="arthiya"
          user={user}
          mobileOpen={mobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
        />

        <main className="min-w-0 flex-1">
          <div className="sticky top-0 z-20 flex items-center border-b border-slate-200 bg-[#f6f8f5]/95 px-4 py-3 backdrop-blur-xl lg:hidden">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-emerald-200 hover:text-emerald-800"
            >
              <MenuIcon />
              Menu
            </button>
          </div>

          <div className="mx-auto w-full max-w-[1500px] px-5 py-6 sm:px-7 lg:px-10 lg:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

function MenuIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4 fill-none stroke-current stroke-[1.8]"
    >
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

export default ArthiyaLayout;