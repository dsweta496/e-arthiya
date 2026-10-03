import { Link, useLocation } from "react-router-dom";
import navConfig from "./navConfig";

function Sidebar({
  role = "farmer",
  user = null,
  mobileOpen = false,
  onClose = () => {},
}) {
  const location = useLocation();
  const config = navConfig[role] || navConfig.farmer;

  const isActive = (path) => {
    if (location.pathname === path) return true;

    // Prevent /farmer from being active on /farmer/supply etc.
    if (path === `/${role}`) return false;

    return location.pathname.startsWith(`${path}/`);
  };

  const initials = getInitials(user?.name);

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/30 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 flex w-[270px] flex-col border-r border-slate-200 bg-[#f8faf8] transition-transform duration-300 lg:sticky lg:top-0 lg:z-30 lg:h-[calc(100vh-68px)] lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        {/* Mobile header */}
        <div className="flex h-[68px] items-center justify-between border-b border-slate-200 px-5 lg:hidden">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-900 text-sm font-bold text-white">
              e
            </span>

            <span className="text-lg font-bold tracking-[-0.035em] text-emerald-950">
              e-Arthiya
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-200 hover:text-slate-800"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Role identity */}
        <div className="border-b border-slate-200 p-4">
          <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-900 text-sm font-bold text-white">
                {initials}
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-900">
                  {user?.name || "Account"}
                </p>

                <div className="mt-1 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

                  <span className="text-xs font-medium text-emerald-800">
                    {config.roleLabel}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-5">
          {config.sidebar?.sections?.map((section) => (
            <div key={section.title} className="mb-7">
              <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                {section.title}
              </p>

              <div className="space-y-1">
                {section.items.map((item) => {
                  const active = isActive(item.path);

                  return (
                    <Link
                      key={item.label}
                      to={item.path}
                      onClick={onClose}
                      className={[
                        "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all",
                        active
                          ? "bg-emerald-900 font-semibold text-white shadow-sm"
                          : "font-medium text-slate-600 hover:bg-white hover:text-emerald-900 hover:shadow-sm",
                      ].join(" ")}
                    >
                      <span
                        className={[
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition",
                          active
                            ? "bg-white/10 text-white"
                            : "bg-slate-100 text-slate-500 group-hover:bg-emerald-50 group-hover:text-emerald-800",
                        ].join(" ")}
                      >
                        <Icon name={item.icon} />
                      </span>

                      <span className="truncate">{item.label}</span>

                      {active && (
                        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-300" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom status card */}
        <div className="border-t border-slate-200 p-3">
          <div className="rounded-2xl bg-emerald-950 p-4 text-white">
            <div className="mb-3 flex items-center justify-between">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
                <ShieldIcon />
              </span>

              <span className="rounded-full bg-emerald-400/15 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-200">
                Protected
              </span>
            </div>

            <p className="text-xs font-semibold text-white">
              e-Arthiya marketplace
            </p>

            <p className="mt-1 text-[11px] leading-4 text-emerald-100/70">
              Transparent trades with protected commitments.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}

/* ---------------- ICONS ---------------- */

function Icon({ name }) {
  const common =
    "h-[17px] w-[17px] fill-none stroke-current stroke-[1.8]";

  const icons = {
    grid: (
      <svg viewBox="0 0 24 24" className={common}>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),

    package: (
      <svg viewBox="0 0 24 24" className={common}>
        <path d="m21 8-9 5-9-5 9-5 9 5Z" />
        <path d="M3 8v8l9 5 9-5V8" />
        <path d="M12 13v8" />
      </svg>
    ),

    search: (
      <svg viewBox="0 0 24 24" className={common}>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </svg>
    ),

    gavel: (
      <svg viewBox="0 0 24 24" className={common}>
        <path d="m14 4 6 6" />
        <path d="m17 7-7 7" />
        <path d="m13 3-3 3 8 8 3-3" />
        <path d="m5 14-2 2 5 5 2-2" />
        <path d="M3 21h9" />
      </svg>
    ),

    file: (
      <svg viewBox="0 0 24 24" className={common}>
        <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Z" />
        <path d="M14 3v6h6" />
        <path d="M8 13h8M8 17h6" />
      </svg>
    ),

    wallet: (
      <svg viewBox="0 0 24 24" className={common}>
        <path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" />
        <path d="M4 8h16" />
        <path d="M15 14h5" />
        <circle cx="15" cy="14" r=".7" fill="currentColor" />
      </svg>
    ),

    clipboard: (
      <svg viewBox="0 0 24 24" className={common}>
        <rect x="5" y="4" width="14" height="17" rx="2" />
        <path d="M9 4.5V3h6v1.5M8 9h8M8 13h8M8 17h5" />
      </svg>
    ),

    target: (
      <svg viewBox="0 0 24 24" className={common}>
        <circle cx="12" cy="12" r="8" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="12" cy="12" r="1" />
      </svg>
    ),

    trending: (
      <svg viewBox="0 0 24 24" className={common}>
        <path d="m3 17 6-6 4 4 8-9" />
        <path d="M15 6h6v6" />
      </svg>
    ),

    users: (
      <svg viewBox="0 0 24 24" className={common}>
        <path d="M16 20v-1.5a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4V20" />
        <circle cx="9.5" cy="7.5" r="3.5" />
        <path d="M17 11a3.5 3.5 0 1 0 0-7" />
        <path d="M17 14.5h1a4 4 0 0 1 4 4V20" />
      </svg>
    ),

    layers: (
      <svg viewBox="0 0 24 24" className={common}>
        <path d="m12 3 9 5-9 5-9-5 9-5Z" />
        <path d="m3 12 9 5 9-5" />
        <path d="m3 16 9 5 9-5" />
      </svg>
    ),

    store: (
      <svg viewBox="0 0 24 24" className={common}>
        <path d="M4 10v10h16V10" />
        <path d="M3 10 5 4h14l2 6" />
        <path d="M3 10a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0" />
        <path d="M9 20v-5h6v5" />
      </svg>
    ),

    handshake: (
      <svg viewBox="0 0 24 24" className={common}>
        <path d="m3 11 4-4 4 2 2-2 4 2 4-4" />
        <path d="m3 11 5 7 3-2 2 2 4-5 3 1 1-3" />
        <path d="m7 7 2-4 4 2 2-2 4 4" />
      </svg>
    ),

    calendar: (
      <svg viewBox="0 0 24 24" className={common}>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M7 3v4M17 3v4M3 10h18" />
      </svg>
    ),

    plus: (
      <svg viewBox="0 0 24 24" className={common}>
        <path d="M12 5v14M5 12h14" />
      </svg>
    ),
  };

  return icons[name] || icons.grid;
}

function ShieldIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4 fill-none stroke-current stroke-[1.8]"
    >
      <path d="M12 3 20 6v5c0 5-3.3 8.5-8 10-4.7-1.5-8-5-8-10V6l8-3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5 fill-none stroke-current stroke-[1.8]"
    >
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}

function getInitials(name) {
  if (!name) return "U";

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default Sidebar;