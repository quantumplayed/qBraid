import React, { useState } from 'react';

/**
 * ConnectionModal
 * Allows inspecting and editing an entanglement connection:
 * - Adding/removing control worldlines (CNOT -> CCNOT -> MCX)
 * - Changing the target worldline
 * - Toggling parity mode (Scenario 1 / AND vs Scenario 2 / OR)
 * - Removing the connection
 */
export default function ConnectionModal({
  connection,
  qubits = [],
  onUpdateConnection,
  onRemoveConnection,
  onClose,
}) {
  if (!connection) return null;

  // Resolve current controls
  const initialControls = Array.isArray(connection.controls)
    ? connection.controls
    : (Array.isArray(connection.control) ? connection.control : [connection.control]);

  const [controls, setControls] = useState(initialControls);
  const [target, setTarget] = useState(connection.target);
  const [parity, setParity] = useState(connection.parity || 'even');

  const controlCount = controls.length;
  const gateTitle = controlCount === 1 ? 'Controlled-NOT (CNOT)' : controlCount === 2 ? 'Toffoli Gate (CCNOT)' : `Multi-Controlled NOT (${controlCount}-CX)`;

  const handleToggleControl = (idx) => {
    if (idx === target) return;
    if (controls.includes(idx)) {
      if (controls.length <= 1) return; // Keep at least one control
      setControls(controls.filter(c => c !== idx));
    } else {
      setControls([...controls, idx].sort((a, b) => a - b));
    }
  };

  const handleSelectTarget = (idx) => {
    if (idx === target) return;
    setTarget(idx);
    // Remove from controls if previously a control
    setControls(prev => prev.filter(c => c !== idx));
  };

  const handleSave = () => {
    const updatedControls = controls.filter(c => c !== target);
    if (updatedControls.length === 0) {
      // Pick another non-target as control if all were cleared
      const fallback = qubits.findIndex((_, i) => i !== target);
      if (fallback !== -1) updatedControls.push(fallback);
    }
    const gateType = updatedControls.length === 1 ? 'CNOT' : updatedControls.length === 2 ? 'CCNOT' : 'MCX';
    onUpdateConnection(connection.id, {
      type: gateType,
      controls: updatedControls,
      control: updatedControls[0],
      target,
      parity,
    });
    onClose();
  };

  const handleDelete = () => {
    onRemoveConnection(connection.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-indigo-50/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-indigo-500/20">
              {controlCount > 1 ? 'CC' : 'C'}⊕
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 font-['Outfit']">
                  Entanglement Connection
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200">
                  {gateTitle}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Condition target outcome on one or more controlling characters
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-200/70 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer text-base"
          >
            ✕
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Parity Mode */}
          <div>
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-2 font-mono">
              Entanglement Condition Mode
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setParity('even')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  parity === 'even'
                    ? 'border-indigo-500 bg-indigo-50/70 ring-2 ring-indigo-500/20 shadow-xs'
                    : 'border-slate-200 hover:bg-slate-50 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-indigo-900">
                    AND (Co-occurrence)
                  </span>
                  <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded bg-indigo-200/80 text-indigo-900">
                    Φ⁺ Even
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-tight">
                  Target triggers when <strong className="text-indigo-900">ALL</strong> controls resolve to Scenario 1 (|1&gt;).
                </p>
              </button>

              <button
                type="button"
                onClick={() => setParity('odd')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  parity === 'odd'
                    ? 'border-amber-500 bg-amber-50/70 ring-2 ring-amber-500/20 shadow-xs'
                    : 'border-slate-200 hover:bg-slate-50 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-amber-900">
                    OR / Conflict
                  </span>
                  <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded bg-amber-200/80 text-amber-900">
                    Ψ⁺ Odd
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-tight">
                  Target triggers when <strong className="text-amber-900">ALL</strong> controls resolve to Scenario 2 (|0&gt;).
                </p>
              </button>
            </div>
          </div>

          {/* Controlling Characters (Multi-select) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider font-mono">
                Controlling Characters ({controls.length})
              </label>
              <span className="text-[11px] text-indigo-600 font-medium">
                {controls.length > 1 ? 'Multi-control active (CCNOT)' : 'Select more than one for CCNOT'}
              </span>
            </div>
            <div className="space-y-1.5 border border-slate-200 rounded-xl p-2 bg-slate-50/50 max-h-48 overflow-y-auto">
              {qubits.map((q, idx) => {
                const isTarget = idx === target;
                const isControl = controls.includes(idx);
                return (
                  <div
                    key={q.id || idx}
                    onClick={() => !isTarget && handleToggleControl(idx)}
                    className={`flex items-center justify-between p-2 rounded-lg border transition-all ${
                      isTarget
                        ? 'opacity-40 cursor-not-allowed bg-slate-100 border-dashed border-slate-200'
                        : isControl
                        ? 'bg-white border-indigo-300 shadow-xs cursor-pointer'
                        : 'bg-white/60 hover:bg-white border-slate-200 cursor-pointer text-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <input
                        type="checkbox"
                        checked={isControl}
                        disabled={isTarget}
                        onChange={() => {}}
                        className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                      />
                      <span className="text-xs font-medium text-slate-800 truncate">
                        {q.name || `Worldline ${idx + 1}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {isTarget ? (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 text-slate-600">
                          Target
                        </span>
                      ) : isControl ? (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold bg-indigo-100 text-indigo-800">
                          Control ●
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-mono">
                          Click to add
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Target Worldline */}
          <div>
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-2 font-mono">
              Target Character (Influenced outcome ⊕)
            </label>
            <select
              value={target}
              onChange={(e) => handleSelectTarget(Number(e.target.value))}
              className="w-full text-xs font-medium text-slate-800 bg-white border border-slate-300 rounded-xl px-3 py-2.5 shadow-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
            >
              {qubits.map((q, idx) => (
                <option key={q.id || idx} value={idx}>
                  {q.name || `Worldline ${idx + 1}`}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={handleDelete}
            className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <span>🗑️</span>
            <span>Delete Gate</span>
          </button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
            >
              Apply Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
