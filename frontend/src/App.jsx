import React from 'react';
import { BrowserRouter, Routes, Route, useLocation, Link } from 'react-router-dom';
import MapComponent from './components/MapComponent';
import AgentStatePanel from './components/AgentStatePanel';
import CargoInputPage from './pages/CargoInputPage';
import { Activity, Radio } from 'lucide-react';

function DashboardLayout() {
  const location = useLocation();
  const cargoLat = location.state?.cargo?.lat || 35.6895;
  const cargoLon = location.state?.cargo?.lon || 139.6917;

  return (
    <main className="h-full w-full flex p-4 gap-4 relative">
      {/* Left Panel: Map */}
      <div className="flex-1 relative rounded-2xl overflow-hidden ring-1 ring-white/10 shadow-2xl">
        <MapComponent lat={cargoLat} lon={cargoLon} />
        
        {/* Map Overlay Stats */}
        <div className="absolute bottom-6 left-6 z-[500] bg-slate-900/80 backdrop-blur-md border border-slate-700/50 p-4 rounded-xl shadow-lg">
          <div className="text-xs text-slate-400 uppercase tracking-widest mb-1">Target Coordinates</div>
          <div className="font-mono text-cyan-400">{cargoLat}° N, {cargoLon}° E</div>
          <div className="text-xs text-slate-500 mt-2">Live Tracking</div>
        </div>
      </div>

      {/* Right Panel: Agent State */}
      <aside className="w-[400px] h-full flex-shrink-0">
        <AgentStatePanel />
      </aside>
    </main>
  );
}

function App() {
  return (
    <BrowserRouter basename="/app">
      <div className="h-screen w-screen bg-slate-950 text-slate-200 overflow-hidden relative selection:bg-cyan-500/30 flex flex-col">
        
        {/* Top Navigation Bar */}
        <nav className="w-full h-16 border-b border-white/5 bg-slate-900/50 backdrop-blur-md z-50 flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 mr-4">
              <div className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
              </div>
              <h1 className="text-white font-bold tracking-widest text-lg">LOGISTICS<span className="text-cyan-400">COMMAND</span></h1>
            </div>
            {/* Navigation Buttons */}
            <div className="flex gap-2">
              <Link to="/" className="px-4 py-1.5 text-sm font-medium rounded-lg bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700/50 transition-colors">
                New Input
              </Link>
              <Link to="/approval" className="px-4 py-1.5 text-sm font-medium rounded-lg bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700/50 transition-colors">
                Approval Dashboard
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm font-medium text-slate-400">
            <span className="flex items-center gap-2 bg-slate-800/50 px-3 py-1 rounded-full border border-slate-700/50">
              <Radio className="w-4 h-4 text-emerald-400 animate-pulse" /> Live Feed
            </span>
            <span className="flex items-center gap-2">
              <Activity className="w-4 h-4" /> System Nominal
            </span>
          </div>
        </nav>

        {/* Main Content Area */}
        <div className="flex-1 w-full relative overflow-hidden">
          <Routes>
            <Route path="/" element={<CargoInputPage />} />
            <Route path="/approval" element={<DashboardLayout />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
