import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signupUser } from "../../api/authApi";

const roles = [
  {
    value: "farmer",
    label: "Farmer",
    description: "Sell your produce directly or through aggregation.",
  },
  {
    value: "buyer",
    label: "Buyer",
    description: "Post requirements and source verified supply.",
  },
  {
    value: "fpo",
    label: "FPO",
    description: "Aggregate farmers and manage supply pools.",
  },
  {
    value: "arthiya",
    label: "Arthiya",
    description: "Connect farmer networks with market demand.",
  },
];

function Signup() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "farmer",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (
      !form.name.trim() ||
      !form.phone.trim() ||
      !form.password ||
      !form.confirmPassword
    ) {
      setError("Please fill in all required fields.");
      return;
    }

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      await signupUser({
        name: form.name.trim(),
        phone: form.phone.trim(),
        password: form.password,
        role: form.role,
      });

      setSuccess("Account created successfully! Redirecting to login...");

      setTimeout(() => {
        navigate("/", {
          state: {
            openLogin: true,
          },
        });
      }, 900);
    } catch (err) {
      setError(err.message || "Unable to create your account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-emerald-950 via-green-950 to-emerald-900 text-slate-900">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.7) 1px, transparent 1px)",
          backgroundSize: "42px 42px",
        }}
      />

      {/* Glow */}
      <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-emerald-400/20 blur-3xl" />
      <div className="absolute -bottom-40 -right-20 h-[500px] w-[500px] rounded-full bg-green-300/10 blur-3xl" />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-6 sm:px-10 lg:px-16">
        <Link
          to="/"
          className="text-xl font-black tracking-tight text-white"
        >
          e<span className="text-emerald-300">-</span>Arthiya
        </Link>

        <Link
          to="/"
          state={{ openLogin: true }}
          className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/15"
        >
          Already have an account?
          <span className="ml-2 text-emerald-300">Log in</span>
        </Link>
      </header>

      {/* Main */}
      <main className="relative z-10 flex min-h-[calc(100vh-92px)] items-center justify-center px-4 pb-10 pt-4 sm:px-8">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-[32px] border border-white/20 bg-white/95 shadow-2xl shadow-black/20 lg:grid-cols-[0.9fr_1.1fr]">
          {/* Left panel */}
          <div className="relative hidden overflow-hidden bg-emerald-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
            <div>
              <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/15 text-2xl text-emerald-300">
                ✦
              </div>

              <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">
                Join the marketplace
              </p>

              <h1 className="max-w-sm text-4xl font-black leading-tight tracking-tight">
                Build stronger markets from the ground up.
              </h1>

              <p className="mt-5 max-w-sm text-sm leading-7 text-emerald-100/70">
                Connect with farmers, buyers, FPOs and Arthiyas through
                transparent supply, demand matching and protected trades.
              </p>
            </div>

            <div className="space-y-4">
              {[
                "Transparent market discovery",
                "Aggregation for fragmented supply",
                "Protected buyer commitments",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 text-sm text-emerald-100/80"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-400/10 text-emerald-300">
                    ✓
                  </span>
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* Form panel */}
          <div className="p-6 sm:p-9 lg:p-11">
            <div className="mb-7">
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
                Create account
              </p>

              <h2 className="text-3xl font-black tracking-tight text-slate-900">
                Get started with e-Arthiya
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Tell us a little about yourself to create your marketplace
                account.
              </p>
            </div>

            {error && (
              <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name */}
              <div>
                <label
                  htmlFor="signup-name"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Full name
                </label>

                <input
                  id="signup-name"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  autoComplete="name"
                  placeholder="Enter your full name"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                />
              </div>

              {/* Phone */}
              <div>
                <label
                  htmlFor="signup-phone"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Phone number
                </label>

                <input
                  id="signup-phone"
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange}
                  autoComplete="tel"
                  placeholder="9876543210"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                />
              </div>

              {/* Role */}
              <div>
                <label
                  htmlFor="signup-role"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  I am joining as
                </label>

                <select
                  id="signup-role"
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  className="w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                >
                  {roles.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>

                <p className="mt-2 text-xs leading-5 text-slate-500">
                  {
                    roles.find((role) => role.value === form.role)
                      ?.description
                  }
                </p>
              </div>

              {/* Passwords */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="signup-password"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Password
                  </label>

                  <input
                    id="signup-password"
                    name="password"
                    type="password"
                    value={form.password}
                    onChange={handleChange}
                    autoComplete="new-password"
                    placeholder="Minimum 6 characters"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="signup-confirm-password"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Confirm password
                  </label>

                  <input
                    id="signup-confirm-password"
                    name="confirmPassword"
                    type="password"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    autoComplete="new-password"
                    placeholder="Repeat password"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="mt-2 flex w-full items-center justify-center rounded-2xl bg-emerald-900 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-900/15 transition hover:-translate-y-0.5 hover:bg-emerald-950 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Creating account..." : "Create account →"}
              </button>
            </form>

            <p className="mt-5 text-center text-xs leading-5 text-slate-400">
              By creating an account, you agree to use the platform for
              legitimate marketplace activity.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Signup;