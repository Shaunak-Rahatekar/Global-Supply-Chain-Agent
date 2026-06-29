import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, Cpu, Anchor, CloudLightning, ArrowRightLeft } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { resumeWorkflow } from '../services/agentService';

export default function AgentStatePanel() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState('cheapest'); // 'cheapest' or 'fastest'

  // Extract state passed from CargoInputPage
  const { sessionId, plan, context, cargo, autoApproved } = location.state || {};

  const handleAction = async (actionType) => {
    setIsProcessing(true);
    setError(null);
    try {
      if (actionType === 'approve') {
          const decisionData = selectedRoute === 'cheapest' ? plan?.cheapest_route : plan?.fastest_route;
          await resumeWorkflow(sessionId, `Approved ${selectedRoute} route: ${JSON.stringify(decisionData)}`);
      } else {
          await resumeWorkflow(sessionId, 'No');
      }
      setCompleted(true);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!location.state) {
    return <div className="p-4 text-white">No active agent session. Please start a new cargo event.</div>;
  }

  if (autoApproved) {
    return (
      <div className="flex flex-col h-full bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-2xl relative overflow-hidden items-center justify-center text-center">
         <CheckCircle className="w-16 h-16 text-emerald-400 mb-4" />
         <h2 className="text-xl font-bold text-white tracking-wide">Auto-Approved</h2>
         <p className="text-slate-400 mt-2">Cargo {cargo?.id} was processed automatically due to low priority status.</p>
         <button onClick={() => navigate('/')} className="mt-6 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700">New Event</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
      <div className="absolute -top-32 -right-32 w-64 h-64 bg-cyan-500/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <div className="flex items-center space-x-3 mb-6 relative z-10">
        <div className="p-2 bg-indigo-500/20 rounded-lg border border-indigo-500/30">
          <Cpu className="w-6 h-6 text-indigo-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide">ADK Logistics Agent</h2>
          <p className="text-xs text-indigo-300/70 font-mono uppercase tracking-widest">
            {completed ? "Workflow Completed" : "Workflow Paused: Human Review"}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar relative z-10">
        
        {/* Cargo Details */}
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Anchor className="w-4 h-4" /> Cargo Profile
          </h3>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm">Cargo ID</span>
              <span className="text-white font-mono text-sm">{cargo?.id}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm">Priority</span>
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/30">{cargo?.priority}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm">Routing</span>
              <span className="text-slate-300 text-xs text-right max-w-[150px] truncate">{cargo?.start_port_name} ➔ {cargo?.dest_port_name}</span>
            </div>
          </div>
        </section>

        {/* LLM Weather Analysis */}
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <CloudLightning className="w-4 h-4" /> Live Context
          </h3>
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 space-y-2">
            <p className="text-amber-200/90 text-sm leading-relaxed whitespace-pre-wrap">
              {typeof context?.weather === 'string' ? context.weather : JSON.stringify(context?.weather)}
            </p>
            {context?.port_congestion && (
              <p className="text-amber-200/90 text-sm leading-relaxed whitespace-pre-wrap border-t border-amber-500/20 pt-2">
                {context.port_congestion}
              </p>
            )}
          </div>
        </section>

        {/* Proposed Routes */}
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4" /> Proposed Route Options
          </h3>
          
          <div className="space-y-3">
            {/* Cheapest Route Card */}
            <div 
              onClick={() => setSelectedRoute('cheapest')}
              className={`p-4 rounded-xl border relative overflow-hidden cursor-pointer transition-all ${selectedRoute === 'cheapest' ? 'bg-cyan-900/40 border-cyan-500/50' : 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-800'}`}
            >
              {selectedRoute === 'cheapest' && <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-cyan-400 to-indigo-500" />}
              <div className="pl-2 flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded">CHEAPEST</span>
                    <span className="text-white font-medium">{plan?.cheapest_route?.action || "Unknown Action"}</span>
                  </div>
                  <p className="text-slate-400 text-xs mt-2 leading-relaxed">{plan?.cheapest_route?.reasoning}</p>
                </div>
                <div className="text-right ml-4 shrink-0">
                  <div className="text-emerald-400 font-mono text-sm">${plan?.cheapest_route?.cost_estimate?.toLocaleString()}</div>
                  <div className="text-slate-500 text-xs">{plan?.cheapest_route?.transit_time_days} days</div>
                </div>
              </div>
            </div>

            {/* Fastest Route Card */}
            <div 
              onClick={() => setSelectedRoute('fastest')}
              className={`p-4 rounded-xl border relative overflow-hidden cursor-pointer transition-all ${selectedRoute === 'fastest' ? 'bg-cyan-900/40 border-cyan-500/50' : 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-800'}`}
            >
              {selectedRoute === 'fastest' && <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-cyan-400 to-indigo-500" />}
              <div className="pl-2 flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded">FASTEST</span>
                    <span className="text-white font-medium">{plan?.fastest_route?.action || "Unknown Action"}</span>
                  </div>
                  <p className="text-slate-400 text-xs mt-2 leading-relaxed">{plan?.fastest_route?.reasoning}</p>
                </div>
                <div className="text-right ml-4 shrink-0">
                  <div className="text-emerald-400 font-mono text-sm">${plan?.fastest_route?.cost_estimate?.toLocaleString()}</div>
                  <div className="text-amber-400 font-mono text-xs">{plan?.fastest_route?.transit_time_days} days</div>
                </div>
              </div>
            </div>
          </div>
        </section>

      </div>

      {/* Action Buttons */}
      {!completed && !error ? (
        <div className="pt-6 mt-4 border-t border-slate-700/50 flex gap-3 relative z-10">
          <button 
            disabled={isProcessing}
            onClick={() => handleAction('reject')}
            className="flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-300 bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 hover:text-white disabled:opacity-50"
          >
            Reject Plan
          </button>
          <button 
            disabled={isProcessing}
            onClick={() => handleAction('approve')}
            className="flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-300 bg-cyan-500 text-slate-900 shadow-[0_0_20px_rgba(34,211,238,0.4)] hover:shadow-[0_0_30px_rgba(34,211,238,0.6)] hover:bg-cyan-400 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isProcessing ? (
              <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-900" />
            ) : (
              <>
                <CheckCircle className="w-4 h-4" /> Approve Selected
              </>
            )}
          </button>
        </div>
      ) : error ? (
        <div className="pt-6 mt-4 border-t border-slate-700/50 flex flex-col gap-3 relative z-10 items-center justify-center">
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-sm w-full text-center flex flex-col items-center">
            <AlertTriangle className="w-6 h-6 mb-2" />
            <span className="font-semibold mb-1">Agent Error Encountered</span>
            <span>{error}</span>
          </div>
          <button onClick={() => navigate('/')} className="mt-2 px-4 py-2 text-white bg-slate-800 rounded hover:bg-slate-700 w-full font-medium">Dismiss</button>
        </div>
      ) : (
        <div className="pt-6 mt-4 border-t border-slate-700/50 flex flex-col gap-3 relative z-10 items-center justify-center text-emerald-400 text-sm font-semibold">
          <CheckCircle className="w-8 h-8 mb-1" />
          Manager Decision Submitted. Workflow Completed!
          <button onClick={() => navigate('/')} className="mt-4 px-4 py-2 text-white bg-slate-800 rounded hover:bg-slate-700">Start New Event</button>
        </div>
      )}

    </div>
  );
}
