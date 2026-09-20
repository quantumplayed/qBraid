import React from 'react';

/**
 * Story panel — shows all worldlines with their outcomes and uncertainty status.
 */
export default function StoryPanel({ qubits, qubitUncertainty }) {
  return (
    <div className="w-80 bg-slate-800 border-l border-cyan-500/20 p-4 overflow-y-auto">
      <h3 className="text-purple-400 font-bold text-xs mb-3 font-mono">NARRATIVES</h3>

      <div className="space-y-3">
        {qubits.map(q => {
          const isUncertain = qubitUncertainty?.[q.id] ?? false;
          return (
            <div
              key={q.id}
              className="bg-slate-900/60 rounded-lg p-3 border border-slate-700/50"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-2 h-2 rounded-full ${isUncertain ? 'bg-cyan-400 animate-pulse' : 'bg-slate-500'}`} />
                <span className="text-white text-sm font-medium">{q.name}</span>
                {isUncertain && (
                  <span className="text-cyan-400 text-[10px] font-mono ml-auto">SUPERPOSED</span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-cyan-900/20 rounded p-2 border border-cyan-500/10">
                  <span className="text-cyan-400 font-mono text-[10px]">POSITIVE</span>
                  <p className="text-slate-300 mt-0.5 leading-tight">{q.active}</p>
                </div>
                <div className="bg-purple-900/20 rounded p-2 border border-purple-500/10">
                  <span className="text-purple-400 font-mono text-[10px]">NEGATIVE</span>
                  <p className="text-slate-300 mt-0.5 leading-tight">{q.passive}</p>
                </div>
              </div>

              {(q.gates?.length || 0) > 0 && (
                <div className="mt-2 text-[10px] text-slate-500 font-mono">
                  {q.gates.length} gate{q.gates.length > 1 ? 's' : ''} placed
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
