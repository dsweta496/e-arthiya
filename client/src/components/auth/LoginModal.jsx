import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../../api/authApi";

const ROLE_ROUTES = {
  farmer: "/farmer",
  buyer: "/buyer",
  fpo: "/fpo",
  arthiya: "/arthiya",
};

function LoginModal({
  isOpen,
  onClose,
  onSignup,
  onLogin,
}) {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    phone: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.phone.trim() || !form.password) {
      setError("Please enter your phone number and password.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await loginUser({
        phone: form.phone.trim(),
        password: form.password,
      });

      const user = response?.user;

      onLogin?.(user);

      if (!user) {
        throw new Error("Login succeeded but user information was not returned.");
      }

      onClose();

      const destination = ROLE_ROUTES[user.role] || "/";

      navigate(destination, {
        replace: true,
      });
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = () => {
    onClose();
    onSignup();
  };

  return (
    <div
      className="fixed left-0 top-0 z-[9999] flex h-screen w-screen items-center justify-center overflow-y-auto bg-[#C7CF91]/20 p-4 backdrop-blur-[24px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="relative w-full max-w-[420px] overflow-hidden rounded-[28px] border border-white/70 bg-white shadow-2xl">
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-500 transition hover:bg-slate-200 hover:text-slate-800"
          aria-label="Close login"
        >
          ×
        </button>

        {/* Header */}
        <div className="px-7 pb-5 pt-8 sm:px-9">
          <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-xl text-emerald-800">
            ↗
          </div>

          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
            Welcome back
          </p>

          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            Log in to e-Arthiya
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Access your marketplace, supply and trade workspace.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-7 pb-8 sm:px-9">
          {error && (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          {/* Phone */}
          <div className="mb-4">
            <label
              htmlFor="login-phone"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Phone number
            </label>

            <input
              id="login-phone"
              name="phone"
              type="tel"
              value={form.phone}
              onChange={handleChange}
              autoComplete="tel"
              placeholder="9876543210"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
            />
          </div>

          {/* Password */}
          <div className="mb-6">
            <label
              htmlFor="login-password"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Password
            </label>

            <input
              id="login-password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              autoComplete="current-password"
              placeholder="Enter your password"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
            />
          </div>

          {/* Login */}
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-2xl bg-emerald-900 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-900/15 transition hover:-translate-y-0.5 hover:bg-emerald-950 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Log in"}
          </button>

          {/* Signup */}
          <div className="mt-6 text-center text-sm text-slate-500">
            Don't have an account?{" "}
            <button
              type="button"
              onClick={handleSignup}
              className="font-bold text-emerald-800 transition hover:text-emerald-950"
            >
              Create one
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LoginModal;