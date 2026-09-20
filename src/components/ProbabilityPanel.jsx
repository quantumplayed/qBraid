import React from 'react';

export default function ProbabilityPanel({ qubits, selectedQubit, onSelectQubit }) {
  return (
    <div className="bg-slate-800 border-t border-cyan-500/20 p-4">
      <h3 className="text-cyan-400 font-bold text-sm mb-4 font-mono">PROBABILITY DISTRIBUTION</h3>
      
      <div className="space-y-3">
        {qubits.map((qubit, idx) => (
          <div key={qubit.id} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-cyan-300 font-mono">{qubit.name}</span>
              <span className="text-yellow-400">{Math.round(qubit.probability * 100)}%</span>
            </div>
            
            {/* Probability bar - clickable */}
            <div className="flex gap-2">
              {/* Active probability bar */}
              <button
                onClick={() => onSelectQubit(qubit, 'active')}
                className={`flex-1 h-6 rounded transition-all cursor-pointer border-2 ${
                  selectedQubit?.id === qubit.id && selectedQubit?.side === 'active'
                    ? 'border-green-400 bg-green-600/70'
                    : 'border-green-500/50 bg-green-600/40'
                }`}
                style={{ width: `${qubit.probability * 100}%` }}
                title={`${qubit.name}: ${qubit.active}`}
              />
              
              {/* Passive probability bar */}
              <button
                onClick={() => onSelectQubit(qubit, 'passive')}
                className={`flex-1 h-6 rounded transition-all cursor-pointer border-2 ${
                  selectedQubit?.id === qubit.id && selectedQubit?.side === 'passive'
                    ? 'border-purple-400 bg-purple-600/70'
                    : 'border-purple-500/50 bg-purple-600/40'
                }`}
                style={{ width: `${(1 - qubit.probability) * 100}%` }}
                title={`${qubit.name}: ${qubit.passive}`}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
