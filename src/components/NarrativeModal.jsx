import React, { useState } from 'react';

export default function NarrativeModal({ qubit, onClose, onSave, onRemove }) {
  const [name, setName] = useState(qubit.name);
  const [active, setActive] = useState(qubit.active);
  const [passive, setPassive] = useState(qubit.passive);

  const handleSave = () => {
    onSave({ ...qubit, name, active, passive });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in zoom-in-95 duration-150">
      <div className="bg-slate-900 border border-cyan-500/40 rounded-2xl p-6 max-w-md w-full shadow-2xl shadow-cyan-950/50 text-slate-100">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
            <h2 className="text-white font-bold text-base tracking-wide">Edit Story Beat</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xs font-mono p-1"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-slate-300 text-xs font-mono uppercase tracking-wider mb-1.5">
              Beat / Character Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-white px-3 py-2 rounded-xl text-sm transition-all"
              placeholder="e.g. The Hero..."
            />
          </div>

          <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/20">
            <label className="block text-cyan-400 text-xs font-mono uppercase tracking-wider mb-1">
              Active / Positive Outcome (|1⟩)
            </label>
            <input
              type="text"
              value={active}
              onChange={(e) => setActive(e.target.value)}
              className="w-full bg-slate-950 border border-cyan-500/30 focus:border-cyan-400 text-white px-3 py-2 rounded-lg text-sm transition-all"
              placeholder="What happens if positive..."
            />
          </div>

          <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/20">
            <label className="block text-purple-400 text-xs font-mono uppercase tracking-wider mb-1">
              Passive / Negative Outcome (|0⟩)
            </label>
            <input
              type="text"
              value={passive}
              onChange={(e) => setPassive(e.target.value)}
              className="w-full bg-slate-950 border border-purple-500/30 focus:border-purple-400 text-white px-3 py-2 rounded-lg text-sm transition-all"
              placeholder="What happens if negative..."
            />
          </div>
        </div>

        <div className="flex gap-2.5 mt-6">
          {onRemove && (
            <button
              onClick={() => {
                onRemove(qubit.id);
                onClose();
              }}
              className="px-3 py-2 bg-red-950/40 hover:bg-red-900/60 border border-red-500/40 text-red-300 rounded-xl font-mono text-xs transition-colors"
              title="Delete this beat"
            >
              Delete
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-mono text-xs transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-mono text-xs font-semibold shadow-md shadow-cyan-900/30 transition-all"
          >
            Save Beat
          </button>
        </div>
      </div>
    </div>
  );
}
