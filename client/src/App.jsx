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
import FarmerMarketplace from "./pages/farmer/FarmerMarketplace";
import FarmerDemand from "./pages/farmer/FarmerDemand";
import FarmerOpportunities from "./pages/farmer/FarmerOpportunities";
import FarmerAuctions from "./pages/farmer/FarmerAuctions";
import FarmerCommitments from "./pages/farmer/FarmerCommitments";
import FarmerPayments from "./pages/farmer/FarmerPayments";

import BuyerDashboard from "./pages/buyer/BuyerDashboard";
import BuyerMarketplace from "./pages/buyer/BuyerMarketplace";
import BuyerSupply from "./pages/buyer/BuyerSupply";
import BuyerRequirements from "./pages/buyer/BuyerRequirements";
import BuyerRequirementAdd from "./pages/buyer/BuyerRequirementAdd";
import BuyerMatches from "./pages/buyer/BuyerMatches";
import BuyerAuctions from "./pages/buyer/BuyerAuctions";
import BuyerBids from "./pages/buyer/BuyerBids";
import BuyerCommitments from "./pages/buyer/BuyerCommitments";
import BuyerPayments from "./pages/buyer/BuyerPayments";

import ArthiyaDashboard from "./pages/arthiya/ArthiyaDashboard";
import ArthiyaMarketplace from "./pages/arthiya/ArthiyaMarketplace";
import ArthiyaFarmers from "./pages/arthiya/ArthiyaFarmers";
import ArthiyaSupply from "./pages/arthiya/ArthiyaSupply";
import ArthiyaDemand from "./pages/arthiya/ArthiyaDemand";
import ArthiyaOpportunities from "./pages/arthiya/ArthiyaOpportunities";
import ArthiyaPools from "./pages/arthiya/ArthiyaPools";
import ArthiyaPoolCreate from "./pages/arthiya/ArthiyaPoolCreate";
import ArthiyaAuctions from "./pages/arthiya/ArthiyaAuctions";
import ArthiyaDeals from "./pages/arthiya/ArthiyaDeals";
import ArthiyaSettlements from "./pages/arthiya/ArthiyaSettlements";

import FPODashboard from "./pages/fpo/FPODashboard";
import FPOFarmers from "./pages/fpo/FPOFarmers";
import FPOSupply from "./pages/fpo/FPOSupply";
import FPODemand from "./pages/fpo/FPODemand";
import FPOPools from "./pages/fpo/FPOPools";
import FPOPoolCreate from "./pages/fpo/FPOPoolCreate";
import FPOMarketplace from "./pages/fpo/FPOMarketplace";
import FPOCommitments from "./pages/fpo/FPOCommitments";
import FPOSettlements from "./pages/fpo/FPOSettlements";


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
          path="/farmer/marketplace"
          element={
            <ProtectedRoute user={user} allowedRole="farmer">
              <FarmerLayout user={user}><FarmerMarketplace user={user} /></FarmerLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/farmer/demand"
          element={
            <ProtectedRoute user={user} allowedRole="farmer">
              <FarmerLayout user={user}><FarmerDemand user={user} /></FarmerLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/farmer/opportunities"
          element={
            <ProtectedRoute user={user} allowedRole="farmer">
              <FarmerLayout user={user}><FarmerOpportunities user={user} /></FarmerLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/farmer/auctions"
          element={
            <ProtectedRoute user={user} allowedRole="farmer">
              <FarmerLayout user={user}><FarmerAuctions user={user} /></FarmerLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/farmer/commitments"
          element={
            <ProtectedRoute user={user} allowedRole="farmer">
              <FarmerLayout user={user}><FarmerCommitments user={user} /></FarmerLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/farmer/payments"
          element={
            <ProtectedRoute user={user} allowedRole="farmer">
              <FarmerLayout user={user}><FarmerPayments user={user} /></FarmerLayout>
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
        <Route
          path="/buyer/marketplace"
          element={
            <ProtectedRoute user={user} allowedRole="buyer">
              <BuyerLayout user={user}>
                <BuyerMarketplace user={user} />
              </BuyerLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/buyer/supply"
          element={
            <ProtectedRoute user={user} allowedRole="buyer">
              <BuyerLayout user={user}>
                <BuyerSupply user={user} />
              </BuyerLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/buyer/requirements"
          element={
            <ProtectedRoute user={user} allowedRole="buyer">
              <BuyerLayout user={user}>
                <BuyerRequirements user={user} />
              </BuyerLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/buyer/requirements/add"
          element={
            <ProtectedRoute user={user} allowedRole="buyer">
              <BuyerLayout user={user}>
                <BuyerRequirementAdd user={user} />
              </BuyerLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/buyer/matches"
          element={
            <ProtectedRoute user={user} allowedRole="buyer">
              <BuyerLayout user={user}>
                <BuyerMatches user={user} />
              </BuyerLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/buyer/auctions"
          element={
            <ProtectedRoute user={user} allowedRole="buyer">
              <BuyerLayout user={user}>
                <BuyerAuctions user={user} />
              </BuyerLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/buyer/bids"
          element={
            <ProtectedRoute user={user} allowedRole="buyer">
              <BuyerLayout user={user}>
                <BuyerBids user={user} />
              </BuyerLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/buyer/commitments"
          element={
            <ProtectedRoute user={user} allowedRole="buyer">
              <BuyerLayout user={user}>
                <BuyerCommitments user={user} />
              </BuyerLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/buyer/payments"
          element={
            <ProtectedRoute user={user} allowedRole="buyer">
              <BuyerLayout user={user}>
                <BuyerPayments user={user} />
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

        <Route
          path="/fpo"
          element={
            <FPOLayout user={user}>
              <FPODashboard user={user} />
            </FPOLayout>
          }
        />

        <Route
          path="/fpo/farmers"
          element={
            <FPOLayout user={user}>
              <FPOFarmers user={user} />
            </FPOLayout>
          }
        />

        <Route
          path="/fpo/supply"
          element={
            <FPOLayout user={user}>
              <FPOSupply user={user} />
            </FPOLayout>
          }
        />

        <Route
          path="/fpo/demand"
          element={
            <FPOLayout user={user}>
              <FPODemand user={user} />
            </FPOLayout>
          }
        />

        <Route
          path="/fpo/pools"
          element={
            <FPOLayout user={user}>
              <FPOPools user={user} />
            </FPOLayout>
          }
        />

        <Route
          path="/fpo/pools/create"
          element={
            <FPOLayout user={user}>
              <FPOPoolCreate user={user} />
            </FPOLayout>
          }
        />

        <Route
          path="/fpo/marketplace"
          element={
            <FPOLayout user={user}>
              <FPOMarketplace user={user} />
            </FPOLayout>
          }
        />

        <Route
          path="/fpo/commitments"
          element={
            <FPOLayout user={user}>
              <FPOCommitments user={user} />
            </FPOLayout>
          }
        />

        <Route
          path="/fpo/settlements"
          element={
            <FPOLayout user={user}>
              <FPOSettlements user={user} />
            </FPOLayout>
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

        <Route
          path="/arthiya"
          element={
            <ProtectedRoute user={user} allowedRole="arthiya">
              <ArthiyaLayout user={user}>
                <ArthiyaDashboard user={user} />
              </ArthiyaLayout>
            </ProtectedRoute>
          }
        />

        <Route path="/arthiya/marketplace" element={
          <ProtectedRoute user={user} allowedRole="arthiya">
            <ArthiyaLayout user={user}><ArthiyaMarketplace user={user} /></ArthiyaLayout>
          </ProtectedRoute>
        } />

        <Route path="/arthiya/farmers" element={
          <ProtectedRoute user={user} allowedRole="arthiya">
            <ArthiyaLayout user={user}><ArthiyaFarmers user={user} /></ArthiyaLayout>
          </ProtectedRoute>
        } />

        <Route path="/arthiya/supply" element={
          <ProtectedRoute user={user} allowedRole="arthiya">
            <ArthiyaLayout user={user}><ArthiyaSupply user={user} /></ArthiyaLayout>
          </ProtectedRoute>
        } />

        <Route path="/arthiya/demand" element={
          <ProtectedRoute user={user} allowedRole="arthiya">
            <ArthiyaLayout user={user}><ArthiyaDemand user={user} /></ArthiyaLayout>
          </ProtectedRoute>
        } />

        <Route path="/arthiya/opportunities" element={
          <ProtectedRoute user={user} allowedRole="arthiya">
            <ArthiyaLayout user={user}><ArthiyaOpportunities user={user} /></ArthiyaLayout>
          </ProtectedRoute>
        } />

        <Route path="/arthiya/pools" element={
          <ProtectedRoute user={user} allowedRole="arthiya">
            <ArthiyaLayout user={user}><ArthiyaPools user={user} /></ArthiyaLayout>
          </ProtectedRoute>
        } />

        <Route path="/arthiya/pools/create" element={
          <ProtectedRoute user={user} allowedRole="arthiya">
            <ArthiyaLayout user={user}><ArthiyaPoolCreate user={user} /></ArthiyaLayout>
          </ProtectedRoute>
        } />

        <Route path="/arthiya/auctions" element={
          <ProtectedRoute user={user} allowedRole="arthiya">
            <ArthiyaLayout user={user}><ArthiyaAuctions user={user} /></ArthiyaLayout>
          </ProtectedRoute>
        } />

        <Route path="/arthiya/deals" element={
          <ProtectedRoute user={user} allowedRole="arthiya">
            <ArthiyaLayout user={user}><ArthiyaDeals user={user} /></ArthiyaLayout>
          </ProtectedRoute>
        } />

        <Route path="/arthiya/settlements" element={
          <ProtectedRoute user={user} allowedRole="arthiya">
            <ArthiyaLayout user={user}><ArthiyaSettlements user={user} /></ArthiyaLayout>
          </ProtectedRoute>
        } />


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