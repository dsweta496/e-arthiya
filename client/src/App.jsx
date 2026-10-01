import { BrowserRouter, Routes, Route } from "react-router-dom";

import Landing from "./pages/Landing";
import Marketplace from "./pages/Marketplace";
import Dashboard from "./pages/Dashboard";
import FarmerDashboard from "./pages/FarmerDashboard";
import BuyerDashboard from "./pages/BuyerDashboard";
import AggregatorDashboard from "./pages/AggregatorDashboard";
import PoolDetail from "./pages/PoolDetail";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/farmer" element={<FarmerDashboard />} />
        <Route path="/buyer" element={<BuyerDashboard />} />
        <Route path="/aggregator" element={<AggregatorDashboard />} />
        <Route path="/pool/:poolId" element={<PoolDetail />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
