import React from 'react';

export default function NarrativeCard({ qubit, onEdit }) {
  return (
    <div className="bg-slate-700 border border-cyan-500/30 rounded p-3 hover:border-cyan-500/60 transition-colors">
      <div className="flex items-start gap-3">
        {/* Glowing dot */}
        <button
          onClick={() => onEdit(qubit)}
          className="flex-shrink-0 mt-0.5 w-4 h-4 rounded-full bg-cyan-400 hover:bg-cyan-300 transition-colors shadow-lg"
          style={{
            boxShadow: '0 0 12px rgba(34, 211, 238, 0.8), 0 0 20px rgba(6, 182, 212, 0.4)',
          }}
          title="Click to edit narrative"
        />
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-cyan-300 font-bold text-sm mb-2">{qubit.name}</h3>
          <div className="space-y-1 text-xs">
            <div className="text-green-400 line-clamp-2">
              <span className="opacity-60 block text-green-500">Active:</span>
              <span>{qubit.active}</span>
            </div>
            <div className="text-purple-400 line-clamp-2">
              <span className="opacity-60 block text-purple-500">Passive:</span>
              <span>{qubit.passive}</span>
            </div>
            <div className="text-yellow-400">
              <span className="opacity-60">Prob:</span> {Math.round(qubit.probability * 100)}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
