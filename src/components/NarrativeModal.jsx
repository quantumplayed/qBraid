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
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in zoom-in-95 duration-150">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl text-slate-800">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
            <h2 className="text-slate-900 font-bold text-base tracking-wide">Edit Story Beat</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-xs font-mono p-1 rounded hover:bg-slate-100 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-slate-500 text-xs font-mono uppercase tracking-wider mb-1.5 font-medium">
              Beat / Character Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-sky-500 focus:bg-white focus:ring-1 focus:ring-sky-500 text-slate-900 px-3 py-2 rounded-xl text-sm transition-all"
              placeholder="e.g. The Hero..."
            />
          </div>

          <div className="p-3.5 rounded-xl bg-sky-50/60 border border-sky-200/70">
            <label className="block text-sky-800 text-xs font-mono uppercase tracking-wider mb-1 font-semibold">
              Active / Positive Outcome (|1⟩)
            </label>
            <input
              type="text"
              value={active}
              onChange={(e) => setActive(e.target.value)}
              className="w-full bg-white border border-sky-200 focus:border-sky-500 text-slate-900 px-3 py-2 rounded-lg text-sm transition-all shadow-sm"
              placeholder="What happens if positive..."
            />
          </div>

          <div className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-200/70">
            <label className="block text-purple-800 text-xs font-mono uppercase tracking-wider mb-1 font-semibold">
              Passive / Negative Outcome (|0⟩)
            </label>
            <input
              type="text"
              value={passive}
              onChange={(e) => setPassive(e.target.value)}
              className="w-full bg-white border border-purple-200 focus:border-purple-500 text-slate-900 px-3 py-2 rounded-lg text-sm transition-all shadow-sm"
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
              className="px-3 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl font-mono text-xs transition-colors font-medium"
              title="Delete this beat"
            >
              Delete
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-mono text-xs transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-mono text-xs font-semibold shadow-md shadow-sky-600/20 transition-all"
          >
            Save Beat
          </button>
        </div>
      </div>
    </div>
  );
}
