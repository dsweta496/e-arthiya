import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import LoginModal from "./auth/LoginModal";
import navConfig from "./navigation/navConfig";
import logo from "../assets/images.png";

function Navbar({
  variant = "public",
  user = null,
  onLogin,
}) {
  const location = useLocation();
  const navigate = useNavigate();

  const [loginOpen, setLoginOpen] = useState(false);

  useEffect(() => {
    if (!location.state?.openLogin) return;

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto",
    });

    setLoginOpen(true);

    navigate(location.pathname, {
      replace: true,
      state: {},
    });
  }, [
    location.state?.openLogin,
    location.pathname,
    navigate,
  ]);

  const config = navConfig[variant] || navConfig.public;

  const isActive = (path) => {
    if (path.includes("#")) return false;

    return (
      location.pathname === path ||
      location.pathname.startsWith(`${path}/`)
    );
  };

  const publicVariant = variant === "public";

  const dashboardPath = user?.role
    ? `/${user.role}`
    : "/";

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    /*
     * Tell App that authentication changed.
     * App will update its user state immediately.
     */
    window.dispatchEvent(new Event("auth-changed"));

    navigate("/", {
      replace: true,
    });
  };

  return (
    <header className="relative z-50 border-b border-slate-200/80 bg-white/95 shadow-sm backdrop-blur-xl">
      <nav className="mx-auto flex h-[68px] max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">

        {/* BRAND */}
        <Link
          to="/"
          className="flex items-center gap-2.5"
        >
          <img
            src={logo}
            alt="e-Arthiya"
            className="
      block
      h-[40px]
      w-auto
      object-contain
      object-left
    "
          />

          <span className="text-lg font-bold tracking-[-0.035em] text-emerald-950 sm:text-xl">
            e-Arthiya
          </span>
        </Link>

        {/* DESKTOP NAVIGATION */}
        <div className="hidden items-center gap-7 text-sm font-medium md:flex">

          {/* HOME */}
          <NavLink
            item={{
              label: "Home",
              path: "/",
            }}
            active={isActive("/")}
          />

          {/* PUBLIC LINKS */}
          {publicVariant &&
            config.main
              ?.filter((item) => item.path !== "/")
              .map((item) => (
                <NavLink
                  key={item.label}
                  item={item}
                  active={isActive(item.path)}
                />
              ))}

          {/* ROLE LINKS */}
          {!publicVariant &&
            config.navbar?.links
              ?.filter((item) => item.path !== "/")
              .map((item) => (
                <NavLink
                  key={item.label}
                  item={item}
                  active={isActive(item.path)}
                />
              ))}
        </div>

        {/* RIGHT SIDE */}
        <div className="flex items-center gap-3">

          {/* ROLE LABEL */}
          {!publicVariant && (
            <div className="hidden items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 sm:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />

              <span className="text-xs font-semibold capitalize text-emerald-900">
                {config.roleLabel}
              </span>
            </div>
          )}

          {/* LOGGED-IN USER */}
          {user && (
            <button
              type="button"
              onClick={() => {
                if (!publicVariant) {
                  navigate(`/${variant}/profile`);
                }
              }}
              className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1.5 transition hover:border-emerald-200 hover:bg-emerald-50"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-900 text-xs font-semibold text-white">
                {getInitials(user?.name)}
              </span>

              <span className="hidden max-w-[100px] truncate text-xs font-semibold text-slate-700 lg:block">
                {user?.name || "Account"}
              </span>
            </button>
          )}

          {/* PUBLIC — LOGGED OUT */}
          {publicVariant && !user && config.cta && (
            <button
              type="button"
              onClick={() => setLoginOpen(true)}
              className="rounded-full bg-emerald-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-950 sm:px-5"
            >
              Login
              <span className="ml-1.5">→</span>
            </button>
          )}

          {/* PUBLIC — LOGGED IN */}
          {publicVariant && user && (
            <>
              <Link
                to={dashboardPath}
                className="hidden rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-100 sm:inline-flex"
              >
                Dashboard
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full bg-emerald-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-950 sm:px-5"
              >
                Logout
                <span className="ml-1.5">↗</span>
              </button>
            </>
          )}

          {/* ROLE — LOGGED IN */}
          {!publicVariant && user && (
            <button
              type="button"
              onClick={handleLogout}
              className="hidden rounded-full bg-emerald-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-950 sm:inline-flex"
            >
              Logout
              <span className="ml-1.5">↗</span>
            </button>
          )}
        </div>
      </nav>

      <LoginModal
        isOpen={loginOpen}
        onClose={() => setLoginOpen(false)}
        onSignup={() => navigate("/signup")}
        onLogin={onLogin}
      />
    </header>
  );
}

function NavLink({ item, active }) {
  return (
    <Link
      to={item.path}
      className={
        active
          ? "font-semibold text-emerald-800"
          : "text-slate-600 transition hover:text-emerald-800"
      }
    >
      {item.label}
    </Link>
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

export default Navbar;