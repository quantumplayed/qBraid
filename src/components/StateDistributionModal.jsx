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

    const { allStates, nonZeroCount, maxProb, hasPhaseInterference } = useMemo(() => {
        const numActive = qubits.length;
        const detailed = simulator.getDetailedState(numActive);
        const numStates = detailed.totalStates;

        let maxP = 0;
        let nonZero = 0;
        const list = [];

        for (let i = 0; i < numStates; i++) {
            const st = detailed.states[i];
            const p = st ? st.probability : 0;
            if (p > maxP) maxP = p;
            if (p > 0.0001) nonZero++;

            list.push({
                index: i,
                bitstring: st ? st.bitstring : simulator.indexToBitstring(i, numActive),
                probability: p,
                percent: (p * 100).toFixed(2),
                amplitudeRe: st ? st.amplitudeRe : 0,
                amplitudeIm: st ? st.amplitudeIm : 0,
                magnitude: st ? st.magnitude : 0,
                phaseDeg: st ? st.phaseDeg : 0,
                sign: st ? st.sign : '+',
                isNegative: st ? (st.amplitudeRe < -0.001) : false
            });
        }

        return {
            allStates: list,
            nonZeroCount: nonZero,
            maxProb: maxP || 0.0001,
            hasPhaseInterference: detailed.hasPhaseInterference
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
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-4xl w-full flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-slate-800">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-sky-50 border border-sky-200 text-sky-600">
                            <span className="text-xl">📊</span>
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 tracking-wide flex items-center gap-2">
                                Quantum State Distribution
                                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-sky-50 border border-sky-200 text-sky-800 font-semibold">
                                    Wavefunction |Ψ⟩
                                </span>
                            </h2>
                            <p className="text-xs text-slate-500 font-mono">
                                Hilbert space distribution across {Math.pow(2, qubits.length)} possible states ({qubits.length} qubits)
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 p-2 rounded-lg text-sm transition-colors"
                    >
                        ✕
                    </button>
                </div>

                {/* Summary Metrics */}
                <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between flex-wrap gap-4 text-xs font-mono">
                    <div className="flex items-center gap-6">
                        <div>
                            <span className="text-slate-400">Active Qubits: </span>
                            <span className="text-slate-900 font-bold">{qubits.length}</span>
                        </div>
                        <div>
                            <span className="text-slate-400">Total Hilbert Space: </span>
                            <span className="text-sky-700 font-bold">{Math.pow(2, qubits.length)} states</span>
                        </div>
                        <div>
                            <span className="text-slate-400">Consistent Outcomes (P &gt; 0): </span>
                            <span className="text-purple-700 font-bold">{nonZeroCount} branches</span>
                        </div>
                        {hasPhaseInterference && (
                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-800 font-semibold animate-pulse">
                                <span>⚡</span>
                                <span>Phase Interferences Present</span>
                            </div>
                        )}
                    </div>

                    {/* Filter / Sort Controls */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setFilterNonZero(prev => !prev)}
                            className={`px-2.5 py-1 rounded-lg border text-xs transition-colors ${
                                filterNonZero
                                    ? 'bg-sky-50 border-sky-300 text-sky-800 font-semibold shadow-sm'
                                    : 'bg-white border-slate-200 text-slate-600'
                            }`}
                        >
                            {filterNonZero ? 'Showing Non-Zero Only' : 'Showing All States'}
                        </button>

                        <button
                            onClick={() => setSortBy(s => s === 'prob' ? 'index' : 'prob')}
                            className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs transition-colors shadow-sm font-medium"
                        >
                            Sort: {sortBy === 'prob' ? 'Highest Probability' : 'Binary Index'}
                        </button>
                    </div>
                </div>

                {/* Educational Banner for Phase Interference */}
                {hasPhaseInterference && (
                    <div className="px-6 py-2.5 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200/80 flex items-start gap-2.5 text-xs text-amber-900">
                        <span className="text-sm mt-0.5">💡</span>
                        <div>
                            <span className="font-bold">Quantum Phase & Interference Active: </span>
                            Certain narrative branches carry negative amplitudes (<span className="font-mono font-bold text-amber-800">-0.50</span>, phase <span className="font-mono font-bold">180°</span>). Even when readout probabilities look uniform, this stored phase allows downstream beats to undergo destructive cancellation!
                        </div>
                    </div>
                )}

                {/* Body - Histogram & State Rows */}
                <div className="flex-1 p-6 overflow-y-auto space-y-3 bg-slate-50/30">
                    {displayedStates.length === 0 ? (
                        <div className="h-64 flex items-center justify-center text-slate-400 font-mono text-sm">
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
                                            ? st.isNegative
                                                ? 'bg-amber-50/30 border-amber-200 hover:border-amber-300 shadow-sm'
                                                : 'bg-white border-slate-200 hover:border-sky-300 shadow-sm'
                                            : 'bg-white/40 border-slate-200/50 opacity-40'
                                    }`}
                                >
                                    <div className="flex items-center justify-between gap-4 mb-2">
                                        <div className="flex items-center gap-3">
                                            <span className={`font-mono text-sm font-bold px-2.5 py-1 rounded-lg border ${
                                                st.isNegative
                                                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                                                    : 'bg-sky-50 text-sky-800 border-sky-200'
                                            }`}>
                                                |{st.bitstring}⟩
                                            </span>
                                            <span className="font-mono text-xs text-slate-500">
                                                State #{st.index}
                                            </span>

                                            {/* Amplitude & Phase Sign Badge */}
                                            {isNonZero && (
                                                <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono border ${
                                                    st.isNegative
                                                        ? 'bg-amber-100/80 border-amber-300 text-amber-900 font-semibold'
                                                        : 'bg-sky-50 border-sky-200 text-sky-800 font-medium'
                                                }`}>
                                                    <span className={`w-2.5 h-2.5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                                                        st.isNegative ? 'bg-amber-500 text-white' : 'bg-sky-500 text-white'
                                                    }`}>
                                                        {st.sign}
                                                    </span>
                                                    <span>
                                                        Amp: {st.amplitudeRe >= 0 ? '+' : ''}{st.amplitudeRe.toFixed(2)}
                                                    </span>
                                                    <span className="text-slate-400">|</span>
                                                    <span className="text-[10px]">
                                                        φ = {st.phaseDeg}°
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-3 font-mono">
                                            <span className={`text-sm font-bold ${
                                                isNonZero 
                                                    ? (st.isNegative ? 'text-amber-800' : 'text-purple-700')
                                                    : 'text-slate-400'
                                            }`}>
                                                {st.percent}%
                                            </span>
                                            {isNonZero && onOpenStoryGenerator && (
                                                <button
                                                    onClick={() => onOpenStoryGenerator(st.index)}
                                                    className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 hover:text-purple-900 border border-purple-200 rounded text-xs transition-colors font-medium shadow-sm"
                                                >
                                                    Read Story ↗
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Probability Bar */}
                                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden mb-2.5 border border-slate-200">
                                        <div
                                            className="h-full rounded-full transition-all duration-300"
                                            style={{
                                                width: `${barWidth}%`,
                                                background: isNonZero
                                                    ? st.isNegative
                                                        ? 'linear-gradient(to right, #d97706, #ec4899)'
                                                        : 'linear-gradient(to right, #0284c7, #7c3aed)'
                                                    : '#cbd5e1'
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
                                                            ? 'bg-sky-50 border-sky-200 text-sky-900 font-medium'
                                                            : 'bg-purple-50 border-purple-200 text-purple-900 font-medium'
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
                <div className="px-6 py-3.5 border-t border-slate-200 flex justify-between items-center bg-slate-50/70">
                    <span className="text-xs text-slate-500 font-mono">
                        Consistent states are filtered naturally via quantum interference & Bell-pair parity.
                    </span>
                    <button
                        onClick={onClose}
                        className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-sans text-xs font-semibold rounded-xl transition-all"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
