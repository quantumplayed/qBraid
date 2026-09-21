import React, { useEffect } from 'react';

/**
 * GateSliderOverlay (Gate Context Menu)
 * Right-click context menu for quantum uncertainty gates:
 * - Prominent "Delete Gate" option
 * - Fine-grained slider to adjust from 50/50 (H gate) to biased Ry rotation
 */
export default function GateSliderOverlay({ x, y, gate, onChange, onClose, onRemove }) {
    // Current theta in [0, 2*PI], clamped to [0, PI] for probabilistic branching
    const theta = gate.theta ?? (Math.PI / 2);
    // Probability of active (1) is sin^2(theta / 2)
    const probActive = Math.sin(theta / 2) ** 2;
    const activePercent = Math.round(probActive * 100);
    const passivePercent = 100 - activePercent;
    const isExactH = Math.abs(probActive - 0.5) < 0.02;

    const setProbability = (p) => {
        const clamped = Math.max(0, Math.min(1, p));
        const newTheta = 2 * Math.asin(Math.sqrt(clamped));
        onChange(newTheta);
    };

    // Close on Escape
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-50 overflow-hidden" onClick={onClose}>
            <div
                className="absolute animate-in fade-in zoom-in-95 duration-100"
                style={{
                    left: `${Math.max(12, Math.min(window.innerWidth - 300, x - 130))}px`,
                    top: `${Math.max(60, Math.min(window.innerHeight - 280, y + 10))}px`,
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xl w-72 text-slate-800 ring-1 ring-black/5">
                    {/* Header */}
                    <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-pulse" />
                            <span className="font-semibold text-xs text-slate-800 font-mono tracking-wider uppercase">
                                {isExactH ? 'Hadamard (50/50)' : 'Ry Gate'}
                            </span>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 px-1.5 py-0.5 rounded text-xs transition-colors"
                            title="Close menu"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Primary Action: Delete Gate */}
                    <div className="mb-3">
                        <button
                            onClick={() => {
                                onRemove();
                                onClose();
                            }}
                            className="w-full py-2 px-3 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 border border-rose-200 text-rose-700 font-sans text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm"
                        >
                            <span>🗑️</span>
                            <span>Delete Gate</span>
                        </button>
                    </div>

                    <div className="w-full h-[1px] bg-slate-100 mb-3" />

                {/* Outcome Probabilities Display */}
                <div className="space-y-1.5 mb-3">
                    <div className="flex justify-between text-xs font-mono">
                        <span className="text-sky-700 font-semibold">Scenario 1: {activePercent}%</span>
                        <span className="text-purple-700 font-semibold">Scenario 2: {passivePercent}%</span>
                    </div>

                    {/* Split Visual Bar */}
                    <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden flex border border-slate-200">
                        <div
                            className="bg-sky-500 transition-all duration-150"
                            style={{ width: `${activePercent}%` }}
                        />
                        <div
                            className="bg-purple-500 transition-all duration-150"
                            style={{ width: `${passivePercent}%` }}
                        />
                    </div>
                </div>

                {/* Slider */}
                <div className="mb-4">
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={activePercent}
                        onChange={(e) => setProbability(Number(e.target.value) / 100)}
                        className="w-full accent-sky-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg appearance-none"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                        <span>0% (Scenario 2)</span>
                        <span className="text-sky-700 font-medium">50% (H)</span>
                        <span>100% (Scenario 1)</span>
                    </div>
                </div>

                {/* Quick Presets */}
                <div className="space-y-1.5">
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block font-medium">
                        Presets
                    </span>
                    <div className="grid grid-cols-3 gap-1.5 text-xs font-mono">
                        <button
                            type="button"
                            onClick={() => setProbability(0.5)}
                            className={`px-2 py-1 rounded text-center transition-all ${
                                isExactH
                                    ? 'bg-sky-50 border border-sky-300 text-sky-800 font-bold shadow-sm'
                                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                            title="Default Hadamard 50/50 superposition"
                        >
                            50/50 (H)
                        </button>
                        <button
                            type="button"
                            onClick={() => setProbability(0.75)}
                            className="px-2 py-1 rounded text-center bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition-all"
                            title="75% Scenario 1 bias"
                        >
                            75 / 25
                        </button>
                        <button
                            type="button"
                            onClick={() => setProbability(0.25)}
                            className="px-2 py-1 rounded text-center bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition-all"
                            title="25% Scenario 1 bias"
                        >
                            25 / 75
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
    );
}
