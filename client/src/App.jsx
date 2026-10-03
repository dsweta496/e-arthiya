import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Landing from "./pages/Landing";
import Marketplace from "./pages/Marketplace";
import Signup from "./pages/auth/Signup";

import FarmerLayout from "./layouts/FarmerLayout";
import BuyerLayout from "./layouts/BuyerLayout";
import FPOLayout from "./layouts/FPOLayout";
import ArthiyaLayout from "./layouts/ArthiyaLayout";

import FarmerDashboard from "./pages/farmer/FarmerDashboard";
import FarmerSupply from "./pages/farmer/FarmerSupply";
import FarmerAddSupply from "./pages/farmer/FarmerAddSupply";
import BuyerDashboard from "./pages/buyer/BuyerDashboard";
import FPODashboard from "./pages/fpo/FPODashboard";
import ArthiyaDashboard from "./pages/arthiya/ArthiyaDashboard";

import { getStoredUser } from "./api/authApi";

const ROLE_HOME = {
  farmer: "/farmer",
  buyer: "/buyer",
  fpo: "/fpo",
  arthiya: "/arthiya",
};

function ProtectedRoute({ user, allowedRole, children }) {
  if (!user) {
    return (
      <Navigate
        to="/"
        replace
        state={{ openLogin: true }}
      />
    );
  }

  if (user.role !== allowedRole) {
    return (
      <Navigate
        to={ROLE_HOME[user.role] || "/"}
        replace
      />
    );
  }

  return children;
}

function App() {
  const [user, setUser] = useState(() => getStoredUser());

  /* Keep App state synchronized with login/logout */
  useEffect(() => {
    const handleAuthChange = () => {
      setUser(getStoredUser());
    };

    window.addEventListener(
      "auth-changed",
      handleAuthChange
    );

    return () => {
      window.removeEventListener(
        "auth-changed",
        handleAuthChange
      );
    };
  }, []);

  return (
    <BrowserRouter>
      <Routes>

        {/* =========================
            PUBLIC
        ========================= */}

        <Route
          path="/"
          element={
            <Landing
              user={user}
              onLogin={(loggedInUser) => {
                setUser(loggedInUser);
              }}
            />
          }
        />

        <Route
          path="/marketplace"
          element={<Marketplace />}
        />

        <Route
          path="/signup"
          element={<Signup />}
        />

        {/* =========================
            FARMER
        ========================= */}

        <Route
          path="/farmer"
          element={
            <ProtectedRoute
              user={user}
              allowedRole="farmer"
            >
              <FarmerLayout user={user}>
                <FarmerDashboard user={user} />
              </FarmerLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/farmer/supply"
          element={
            <ProtectedRoute
              user={user}
              allowedRole="farmer"
            >
              <FarmerLayout user={user}>
                <FarmerSupply user={user} />
              </FarmerLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/farmer/supply/add"
          element={
            <ProtectedRoute
              user={user}
              allowedRole="farmer"
            >
              <FarmerLayout user={user}>
                <FarmerAddSupply user={user} />
              </FarmerLayout>
            </ProtectedRoute>
          }
        />

        {/* =========================
            BUYER
        ========================= */}

        <Route
          path="/buyer"
          element={
            <ProtectedRoute
              user={user}
              allowedRole="buyer"
            >
              <BuyerLayout user={user}>
                <BuyerDashboard user={user} />
              </BuyerLayout>
            </ProtectedRoute>
          }
        />

        {/* =========================
            FPO
        ========================= */}

        <Route
          path="/fpo"
          element={
            <ProtectedRoute
              user={user}
              allowedRole="fpo"
            >
              <FPOLayout user={user}>
                <FPODashboard user={user} />
              </FPOLayout>
            </ProtectedRoute>
          }
        />

        {/* =========================
            ARTHIYA
        ========================= */}

        <Route
          path="/arthiya"
          element={
            <ProtectedRoute
              user={user}
              allowedRole="arthiya"
            >
              <ArthiyaLayout user={user}>
                <ArthiyaDashboard user={user} />
              </ArthiyaLayout>
            </ProtectedRoute>
          }
        />

        {/* =========================
            FALLBACK
        ========================= */}

        <Route
          path="*"
          element={<NotFound />}
        />

      </Routes>
    </BrowserRouter>
  );
}

/* ==================================================
   404
================================================== */

function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f6f8f5] px-6">
      <div className="text-center">

        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-900 text-lg font-bold text-white">
          e
        </div>

        <h1 className="mt-5 text-2xl font-bold text-slate-950">
          Page not found
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          The page you're looking for doesn't exist yet.
        </p>

        <a
          href="/"
          className="mt-5 inline-flex rounded-xl bg-emerald-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-950"
        >
          Back to home
        </a>

      </div>
    </div>
  );
}

export default App;