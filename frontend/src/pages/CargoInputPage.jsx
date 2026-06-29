import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createSession, runAgentWorkflow } from '../services/agentService';
import { Anchor, Zap, AlertCircle, Map, Navigation } from 'lucide-react';
import PortDropdown from '../components/PortDropdown';

export default function CargoInputPage() {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    id: "CGO-" + Math.floor(Math.random() * 10000),
    priority: "High",
    total_value: 5000000.0,
    corporate_buyer: "Acme Corp",
    lat: 31.2304,
    lon: 121.4737,
    dest_lat: 34.0522,
    dest_lon: -118.2437,
    start_port_name: "Port of Shanghai",
    dest_port_name: "Port of Los Angeles"
  });

  const [startMode, setStartMode] = useState('port'); // 'port' or 'coord'
  const [destMode, setDestMode] = useState('port');

  const [status, setStatus] = useState('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value
    }));
  };

  const handleStartPortSelect = (port) => {
    if (port) {
      setFormData(prev => ({ ...prev, start_port_name: port.name, lat: port.lat, lon: port.lon }));
    }
  };

  const handleDestPortSelect = (port) => {
    if (port) {
      setFormData(prev => ({ ...prev, dest_port_name: port.name, dest_lat: port.lat, dest_lon: port.lon }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('processing');
    setErrorMsg('');
    
    try {
      const sessionId = await createSession();
      
      await runAgentWorkflow(
        sessionId, 
        formData, 
        (pauseData) => {
          setStatus('idle');
          navigate('/approval', { state: { sessionId, ...pauseData } });
        },
        (result) => {
          setStatus('idle');
          if (result.status === "auto_approved") {
             navigate('/approval', { state: { autoApproved: true, cargo: formData } });
          } else {
             console.log("Workflow completed directly", result);
          }
        },
        (err) => {
          setStatus('error');
          setErrorMsg(err.message);
        }
      );

    } catch (err) {
      setStatus('error');
      setErrorMsg(err.message);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center relative p-8">
      <div className="w-full max-w-4xl bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none" />

        <div className="flex items-center space-x-4 mb-8 relative z-10">
          <div className="p-3 bg-cyan-500/20 rounded-xl border border-cyan-500/30">
            <Anchor className="w-8 h-8 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-wide">New Cargo Event</h1>
            <p className="text-slate-400 mt-1">Enter routing parameters for dynamic ADK Agent analysis</p>
          </div>
        </div>

        {status === 'error' && (
           <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-3 relative z-10">
             <AlertCircle className="w-5 h-5 text-rose-400 mt-0.5 shrink-0" />
             <div className="text-sm text-rose-300">{errorMsg}</div>
           </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
          
          <div className="grid grid-cols-2 gap-8">
            
            {/* Left Column: Basic Details */}
            <div className="space-y-6">
              <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider border-b border-slate-700 pb-2">Cargo Profile</h3>
              
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cargo ID</label>
                <input 
                  type="text" 
                  name="id" 
                  value={formData.id} 
                  onChange={handleChange}
                  className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 transition-all"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Priority</label>
                <select 
                  name="priority" 
                  value={formData.priority} 
                  onChange={handleChange}
                  className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 transition-all appearance-none"
                >
                  <option value="High">High</option>
                  <option value="Low">Low</option>
                  <option value="Normal">Normal</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Value ($)</label>
                <input 
                  type="number" 
                  name="total_value" 
                  value={formData.total_value} 
                  onChange={handleChange}
                  className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 transition-all"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Corporate Buyer</label>
                <input 
                  type="text" 
                  name="corporate_buyer" 
                  value={formData.corporate_buyer} 
                  onChange={handleChange}
                  className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 transition-all"
                  required
                />
              </div>
            </div>

            {/* Right Column: Routing */}
            <div className="space-y-6">
              <h3 className="text-sm font-semibold text-indigo-400 uppercase tracking-wider border-b border-slate-700 pb-2">Routing Data</h3>
              
              <div className="space-y-3 bg-slate-800/30 p-4 rounded-xl border border-slate-700/30">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-2"><Map className="w-3 h-3"/> Current Position</label>
                  <button type="button" onClick={() => setStartMode(m => m === 'port' ? 'coord' : 'port')} className="text-[10px] uppercase text-cyan-400 hover:text-cyan-300">
                    Switch to {startMode === 'port' ? 'Coordinates' : 'Port Search'}
                  </button>
                </div>
                {startMode === 'port' ? (
                  <PortDropdown value={formData.start_port_name} onChange={handleStartPortSelect} placeholder="Search 5,000+ Global Ports..." />
                ) : (
                  <div className="flex gap-2">
                    <input type="number" step="any" name="lat" value={formData.lat} onChange={handleChange} placeholder="Lat" className="w-1/2 bg-slate-950/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50" required />
                    <input type="number" step="any" name="lon" value={formData.lon} onChange={handleChange} placeholder="Lon" className="w-1/2 bg-slate-950/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50" required />
                  </div>
                )}
              </div>

              <div className="space-y-3 bg-slate-800/30 p-4 rounded-xl border border-slate-700/30">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-2"><Navigation className="w-3 h-3"/> Destination Port</label>
                  <button type="button" onClick={() => setDestMode(m => m === 'port' ? 'coord' : 'port')} className="text-[10px] uppercase text-cyan-400 hover:text-cyan-300">
                    Switch to {destMode === 'port' ? 'Coordinates' : 'Port Search'}
                  </button>
                </div>
                {destMode === 'port' ? (
                  <PortDropdown value={formData.dest_port_name} onChange={handleDestPortSelect} placeholder="Search Destination..." />
                ) : (
                  <div className="flex gap-2">
                    <input type="number" step="any" name="dest_lat" value={formData.dest_lat} onChange={handleChange} placeholder="Lat" className="w-1/2 bg-slate-950/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50" required />
                    <input type="number" step="any" name="dest_lon" value={formData.dest_lon} onChange={handleChange} placeholder="Lon" className="w-1/2 bg-slate-950/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50" required />
                  </div>
                )}
              </div>
              
              <div className="text-xs text-slate-500 bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                <Zap className="inline w-3 h-3 mr-1 text-amber-400"/>
                <strong>Agent Note:</strong> Distance, transit delay, and port congestion will be dynamically calculated by the MCP tools based on these coordinates.
              </div>

            </div>
          </div>

          <button 
            type="submit"
            disabled={status === 'processing'}
            className="w-full mt-4 py-4 rounded-xl font-bold text-sm transition-all duration-300 bg-cyan-500 text-slate-900 shadow-[0_0_20px_rgba(34,211,238,0.4)] hover:shadow-[0_0_30px_rgba(34,211,238,0.6)] hover:bg-cyan-400 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {status === 'processing' ? (
              <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-900" />
            ) : (
              <>
                <Zap className="w-5 h-5" /> Execute Agent Analysis
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
