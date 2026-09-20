import React, { useState, useMemo } from 'react';

/**
 * StateDistributionModal
 * Dedicated modal for inspecting the quantum wavefunction probability distribution.
 * Replaces the static bottom panel with a comprehensive analytical tool.
 */
export default function StateDistributionModal({
    simulator,
    qubits,
    onClose,
    onOpenStoryGenerator
}) {
    const [filterNonZero, setFilterNonZero] = useState(true);
    const [sortBy, setSortBy] = useState('prob'); // 'prob' | 'index'

    const { allStates, nonZeroCount, maxProb } = useMemo(() => {
        const numActive = qubits.length;
        const probs = simulator.getProbabilities(numActive);
        const numStates = Math.pow(2, numActive);

        let maxP = 0;
        let nonZero = 0;
        const list = [];

        for (let i = 0; i < numStates; i++) {
            const p = probs[i] || 0;
            if (p > maxP) maxP = p;
            if (p > 0.0001) nonZero++;

            list.push({
                index: i,
                bitstring: simulator.indexToBitstring(i, numActive),
                probability: p,
                percent: (p * 100).toFixed(2),
            });
        }

        return {
            allStates: list,
            nonZeroCount: nonZero,
            maxProb: maxP || 0.0001
        };
    }, [simulator, qubits]);

    const displayedStates = useMemo(() => {
        let list = filterNonZero
            ? allStates.filter(s => s.probability > 0.0001)
            : allStates;

        if (sortBy === 'prob') {
            list = [...list].sort((a, b) => b.probability - a.probability);
        } else {
            list = [...list].sort((a, b) => a.index - b.index);
        }

        return list;
    }, [allStates, filterNonZero, sortBy]);

    return (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-cyan-500/40 rounded-2xl shadow-2xl shadow-cyan-950/80 max-w-4xl w-full flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                            <span className="text-xl">📊</span>
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
                                Quantum State Distribution
                                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-300">
                                    Wavefunction |Ψ⟩
                                </span>
                            </h2>
                            <p className="text-xs text-slate-400 font-mono">
                                Hilbert space distribution across {Math.pow(2, qubits.length)} possible states ({qubits.length} qubits)
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 p-2 rounded-lg text-sm transition-colors"
                    >
                        ✕
                    </button>
                </div>

                {/* Summary Metrics */}
                <div className="px-6 py-3 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between flex-wrap gap-4 text-xs font-mono">
                    <div className="flex items-center gap-6">
                        <div>
                            <span className="text-slate-500">Active Qubits: </span>
                            <span className="text-white font-bold">{qubits.length}</span>
                        </div>
                        <div>
                            <span className="text-slate-500">Total Hilbert Space: </span>
                            <span className="text-cyan-400 font-bold">{Math.pow(2, qubits.length)} states</span>
                        </div>
                        <div>
                            <span className="text-slate-500">Consistent Outcomes (P &gt; 0): </span>
                            <span className="text-purple-400 font-bold">{nonZeroCount} branches</span>
                        </div>
                    </div>

                    {/* Filter / Sort Controls */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setFilterNonZero(prev => !prev)}
                            className={`px-2.5 py-1 rounded-lg border text-xs transition-colors ${
                                filterNonZero
                                    ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 font-semibold'
                                    : 'bg-slate-800 border-slate-700 text-slate-400'
                            }`}
                        >
                            {filterNonZero ? 'Showing Non-Zero Only' : 'Showing All States'}
                        </button>

                        <button
                            onClick={() => setSortBy(s => s === 'prob' ? 'index' : 'prob')}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg text-xs transition-colors"
                        >
                            Sort: {sortBy === 'prob' ? 'Highest Probability' : 'Binary Index'}
                        </button>
                    </div>
                </div>

                {/* Body - Histogram & State Rows */}
                <div className="flex-1 p-6 overflow-y-auto space-y-3">
                    {displayedStates.length === 0 ? (
                        <div className="h-64 flex items-center justify-center text-slate-500 font-mono text-sm">
                            No states match the current filter.
                        </div>
                    ) : (
                        displayedStates.map((st) => {
                            const isNonZero = st.probability > 0.0001;
                            const barWidth = Math.max(1, (st.probability / maxProb) * 100);

                            return (
                                <div
                                    key={st.index}
                                    className={`p-3.5 rounded-xl border transition-all ${
                                        isNonZero
                                            ? 'bg-slate-900/90 border-cyan-500/30 hover:border-cyan-400/60 shadow-md shadow-slate-950/50'
                                            : 'bg-slate-950/40 border-slate-800/40 opacity-40'
                                    }`}
                                >
                                    <div className="flex items-center justify-between gap-4 mb-2">
                                        <div className="flex items-center gap-3">
                                            <span className="font-mono text-sm font-bold text-cyan-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                                                |{st.bitstring}⟩
                                            </span>
                                            <span className="font-mono text-xs text-slate-400">
                                                State #{st.index}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-3 font-mono">
                                            <span className={`text-sm font-bold ${isNonZero ? 'text-purple-300' : 'text-slate-600'}`}>
                                                {st.percent}%
                                            </span>
                                            {isNonZero && onOpenStoryGenerator && (
                                                <button
                                                    onClick={() => onOpenStoryGenerator(st.index)}
                                                    className="px-2 py-1 bg-purple-950 hover:bg-purple-900 text-purple-300 hover:text-white border border-purple-500/30 rounded text-[10px] transition-colors"
                                                >
                                                    Read Story ↗
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Probability Bar */}
                                    <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden mb-2.5 border border-slate-800">
                                        <div
                                            className="h-full rounded-full transition-all duration-300"
                                            style={{
                                                width: `${barWidth}%`,
                                                background: isNonZero
                                                    ? 'linear-gradient(to right, #06b6d4, #a855f7)'
                                                    : '#334155'
                                            }}
                                        />
                                    </div>

                                    {/* Narrative Outcomes for this state */}
                                    <div className="flex flex-wrap gap-1.5 text-[11px] font-mono">
                                        {qubits.map((q, qi) => {
                                            const isPositive = st.bitstring[qi] === '1';
                                            return (
                                                <span
                                                    key={q.id}
                                                    className={`px-2 py-0.5 rounded border ${
                                                        isPositive
                                                            ? 'bg-cyan-950/30 border-cyan-500/30 text-cyan-300'
                                                            : 'bg-purple-950/30 border-purple-500/30 text-purple-300'
                                                    }`}
                                                >
                                                    {q.name}: {isPositive ? (q.active || 'Active') : (q.passive || 'Passive')}
                                                </span>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-3.5 border-t border-slate-800 flex justify-between items-center bg-slate-900/90">
                    <span className="text-xs text-slate-500 font-mono">
                        Consistent states are filtered naturally via quantum interference & Bell-pair parity.
                    </span>
                    <button
                        onClick={onClose}
                        className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-mono text-xs font-semibold rounded-xl transition-all"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
