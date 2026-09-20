import React from 'react';

/**
 * GateSliderOverlay
 * Interactive overlay for adjusting quantum uncertainty gates.
 * Default is 50/50 balanced superposition (H gate).
 * Allows fine-grained bias tuning from 0% to 100% positive probability.
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
        // Clamp p in [0, 1]
        const clamped = Math.max(0, Math.min(1, p));
        // theta = 2 * arcsin(sqrt(p))
        const newTheta = 2 * Math.asin(Math.sqrt(clamped));
        onChange(newTheta);
    };

    return (
        <div
            className="fixed z-50 animate-in fade-in zoom-in-95 duration-150"
            style={{
                left: `${Math.max(10, Math.min(window.innerWidth - 320, x - 150))}px`,
                top: `${Math.min(window.innerHeight - 250, y + 20)}px`,
            }}
        >
            <div className="bg-slate-900/95 backdrop-blur-md border border-cyan-500/40 rounded-xl p-4 shadow-2xl shadow-cyan-950/50 w-72 text-slate-100">
                {/* Header */}
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-700/60">
                    <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                        <span className="font-semibold text-xs text-cyan-300 font-mono tracking-wider uppercase">
                            {isExactH ? 'Hadamard Gate (50/50)' : 'Uncertainty Bias'}
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={onRemove}
                            className="text-red-400 hover:text-red-300 hover:bg-red-950/40 px-1.5 py-0.5 rounded text-xs transition-colors"
                            title="Remove gate"
                        >
                            ✕
                        </button>
                        <button
                            onClick={onClose}
                            className="text-slate-400 hover:text-white hover:bg-slate-800 px-1.5 py-0.5 rounded text-xs transition-colors"
                            title="Done"
                        >
                            ✓
                        </button>
                    </div>
                </div>

                {/* Outcome Probabilities Display */}
                <div className="space-y-1.5 mb-3">
                    <div className="flex justify-between text-xs font-mono">
                        <span className="text-cyan-400 font-medium">Positive: {activePercent}%</span>
                        <span className="text-purple-400 font-medium">Negative: {passivePercent}%</span>
                    </div>

                    {/* Split Visual Bar */}
                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden flex border border-slate-700/50">
                        <div
                            className="bg-gradient-to-r from-cyan-500 to-cyan-400 transition-all duration-150"
                            style={{ width: `${activePercent}%` }}
                        />
                        <div
                            className="bg-gradient-to-r from-purple-500 to-purple-600 transition-all duration-150"
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
                        className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                        <span>0% (Passive)</span>
                        <span className="text-cyan-400/80">50% (H)</span>
                        <span>100% (Active)</span>
                    </div>
                </div>

                {/* Quick Presets */}
                <div className="space-y-1.5">
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                        Presets
                    </span>
                    <div className="grid grid-cols-3 gap-1.5 text-xs font-mono">
                        <button
                            type="button"
                            onClick={() => setProbability(0.5)}
                            className={`px-2 py-1 rounded text-center transition-all ${
                                isExactH
                                    ? 'bg-cyan-500/20 border border-cyan-400 text-cyan-300 font-bold'
                                    : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-slate-700/50'
                            }`}
                            title="Default Hadamard 50/50 superposition"
                        >
                            50/50 (H)
                        </button>
                        <button
                            type="button"
                            onClick={() => setProbability(0.75)}
                            className="px-2 py-1 rounded text-center bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-slate-700/50 transition-all"
                            title="75% Positive bias"
                        >
                            75 / 25
                        </button>
                        <button
                            type="button"
                            onClick={() => setProbability(0.25)}
                            className="px-2 py-1 rounded text-center bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-slate-700/50 transition-all"
                            title="25% Positive bias"
                        >
                            25 / 75
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
