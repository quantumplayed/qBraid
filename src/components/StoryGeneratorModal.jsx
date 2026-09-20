import React, { useState, useEffect, useMemo } from 'react';

/**
 * StoryGeneratorModal
 * Samples consistent multiverse storylines from the quantum probability distribution.
 * Weaves sampled positive/negative events into a coherent story chronicle.
 */
export default function StoryGeneratorModal({
    simulator,
    qubits,
    connections,
    onClose
}) {
    const [sampledState, setSampledState] = useState(null);
    const [isRolling, setIsRolling] = useState(false);
    const [copied, setCopied] = useState(false);

    // Compute all non-zero states from the quantum distribution using sparse evaluation
    const { validStates, totalValidCount } = useMemo(() => {
        const sparse = simulator.getSparseDistribution(qubits.length);
        const list = sparse.map(item => ({
            index: item.state,
            bitstring: item.bitstring,
            probability: item.probability
        }));
        return { validStates: list, totalValidCount: list.length };
    }, [simulator, qubits]);

    // Sample function
    const sampleNew = (explicitIndex = null) => {
        setIsRolling(true);
        setTimeout(() => {
            let index = explicitIndex;
            const n = qubits.length;

            if (index === null) {
                const sampled = simulator.sampleTimeline(qubits);
                index = sampled.index;
                const bitstring = sampled.bitstring;
                const probability = sampled.probability;

                const beatOutcomes = sampled.beatOutcomes.map((beat, idx) => {
                    const relevantConns = connections.filter(
                        c => c.control === idx || c.target === idx
                    );
                    return {
                        ...beat,
                        title: beat.status === 'active' ? 'POSITIVE OUTCOME' : 'NEGATIVE OUTCOME',
                        connections: relevantConns
                    };
                });

                setSampledState({
                    index,
                    bitstring,
                    probability,
                    beatOutcomes
                });
            } else {
                const probs = simulator.getProbabilities(n);
                const prob = probs[index] || 0;
                const bitstring = simulator.indexToBitstring(index, n);

                const beatOutcomes = qubits.map((q, idx) => {
                    const isBit1 = bitstring[idx] === '1';
                    const relevantConns = connections.filter(
                        c => c.control === idx || c.target === idx
                    );

                    return {
                        qubitId: q.id,
                        name: q.name,
                        bit: isBit1 ? 1 : 0,
                        status: isBit1 ? 'active' : 'passive',
                        title: isBit1 ? 'POSITIVE OUTCOME' : 'NEGATIVE OUTCOME',
                        text: isBit1 ? (q.active || 'Succeeds') : (q.passive || 'Fails'),
                        connections: relevantConns
                    };
                });

                setSampledState({
                    index,
                    bitstring,
                    probability: prob,
                    beatOutcomes
                });
            }
            setIsRolling(false);
        }, 180);
    };

    // Initial sample on mount
    useEffect(() => {
        sampleNew();
    }, []);

    // Helper to generate flowing prose
    const generatedProse = useMemo(() => {
        if (!sampledState) return '';

        const sentences = [];
        const outcomes = sampledState.beatOutcomes;

        // Opening hook
        sentences.push(`In Timeline #${sampledState.index} (|${sampledState.bitstring}⟩), the branching paths of fate converge.`);

        outcomes.forEach((beat, idx) => {
            const isFirst = idx === 0;
            const isLast = idx === outcomes.length - 1;

            let connector = 'Meanwhile,';
            if (isFirst) connector = 'It begins as';
            else if (isLast) connector = 'Finally,';
            else if (idx % 2 === 1) connector = 'Concurrently,';

            if (beat.status === 'active') {
                sentences.push(`${connector} ${beat.name} actively steps forward: "${beat.text}".`);
            } else {
                sentences.push(`${connector} ${beat.name} falters in the shadows: "${beat.text}".`);
            }
        });

        // Entanglement consistency note
        if (connections.length > 0) {
            sentences.push(`The outcome remains strictly coherent across all ${connections.length} entangled story threads.`);
        }

        return sentences.join(' ');
    }, [sampledState, connections]);

    const handleCopy = () => {
        if (!sampledState) return;
        const textToCopy = `--- NARRATIVE TIMELINE |${sampledState.bitstring}⟩ ---\nProbability: ${(sampledState.probability * 100).toFixed(1)}%\n\n${generatedProse}\n\nBeat Breakdown:\n` +
            sampledState.beatOutcomes.map(b => `• ${b.name} (${b.status.toUpperCase()}): ${b.text}`).join('\n');

        navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-purple-500/40 rounded-2xl shadow-2xl shadow-purple-950/80 max-w-4xl w-full flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
                            <span className="text-xl">✨</span>
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
                                Multiverse Story Generator
                                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-purple-950 border border-purple-500/40 text-purple-300">
                                    Quantum Sample
                                </span>
                            </h2>
                            <p className="text-xs text-slate-400 font-mono">
                                Sampled coherent timeline from {validStates.length} valid quantum branch{validStates.length === 1 ? '' : 'es'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => sampleNew()}
                            disabled={isRolling}
                            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-mono text-xs font-semibold rounded-xl transition-all shadow-lg shadow-purple-900/30 flex items-center gap-2"
                        >
                            <span className={isRolling ? 'animate-spin' : ''}>🎲</span>
                            <span>{isRolling ? 'Collapsing State...' : 'Sample New Timeline'}</span>
                        </button>
                        <button
                            onClick={onClose}
                            className="text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 p-2 rounded-lg text-sm transition-colors"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Left: Chronicle & Beats */}
                    <div className="flex-1 p-6 overflow-y-auto space-y-6">
                        {sampledState ? (
                            <>
                                {/* State Metric Ribbon */}
                                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between flex-wrap gap-4">
                                    <div>
                                        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-0.5">
                                            Sampled Wavefunction State
                                        </span>
                                        <span className="text-2xl font-mono font-bold text-cyan-400 tracking-widest">
                                            |{sampledState.bitstring}⟩
                                        </span>
                                    </div>

                                    <div>
                                        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-0.5">
                                            Occurrence Probability
                                        </span>
                                        <span className="text-xl font-mono font-bold text-purple-400">
                                            {(sampledState.probability * 100).toFixed(1)}%
                                        </span>
                                    </div>

                                    <div>
                                        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-0.5">
                                            Timeline Index
                                        </span>
                                        <span className="text-sm font-mono text-slate-300">
                                            State #{sampledState.index}
                                        </span>
                                    </div>

                                    <button
                                        onClick={handleCopy}
                                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs rounded-lg border border-slate-700 transition-colors flex items-center gap-1.5"
                                    >
                                        <span>{copied ? '✓' : '📋'}</span>
                                        <span>{copied ? 'Copied!' : 'Copy Story'}</span>
                                    </button>
                                </div>

                                {/* Flowing Narrative Chronicle */}
                                <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/30 border border-purple-500/20 shadow-inner">
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="text-xs font-mono font-bold uppercase tracking-wider text-purple-300">
                                            Narrative Chronicle
                                        </span>
                                        <span className="text-[10px] font-mono text-slate-500">
                                            Consistent Story Passage
                                        </span>
                                    </div>
                                    <p className="text-slate-200 text-sm leading-relaxed font-serif italic selection:bg-purple-500/30">
                                        "{generatedProse}"
                                    </p>
                                </div>

                                {/* Beat-by-Beat Timeline */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                                            Timeline Story Beats ({sampledState.beatOutcomes.length})
                                        </span>
                                        <span className="text-[11px] font-mono text-slate-500">
                                            Green = Active/Positive · Purple = Passive/Negative
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {sampledState.beatOutcomes.map((beat, idx) => {
                                            const isActive = beat.status === 'active';
                                            return (
                                                <div
                                                    key={idx}
                                                    className={`p-3.5 rounded-xl border transition-all ${
                                                        isActive
                                                            ? 'bg-cyan-950/20 border-cyan-500/30'
                                                            : 'bg-purple-950/20 border-purple-500/30'
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between mb-1.5">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                                                                q{idx}
                                                            </span>
                                                            <span className="font-semibold text-sm text-white">
                                                                {beat.name}
                                                            </span>
                                                        </div>

                                                        <span
                                                            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                                                                isActive
                                                                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                                                                    : 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                                                            }`}
                                                        >
                                                            {isActive ? 'POSITIVE (1)' : 'NEGATIVE (0)'}
                                                        </span>
                                                    </div>

                                                    <p className="text-xs text-slate-300 mt-1 leading-snug">
                                                        {beat.text}
                                                    </p>

                                                    {/* Entanglement Badges */}
                                                    {beat.connections.length > 0 && (
                                                        <div className="mt-2 pt-2 border-t border-slate-800/80 flex flex-wrap gap-1">
                                                            {beat.connections.map((conn, ci) => {
                                                                const otherIdx = conn.control === idx ? conn.target : conn.control;
                                                                const otherName = qubits[otherIdx]?.name || `q${otherIdx}`;
                                                                const isOdd = conn.parity === 'odd';
                                                                return (
                                                                    <span
                                                                        key={ci}
                                                                        className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                                                                            isOdd
                                                                                ? 'bg-amber-950/30 border-amber-500/40 text-amber-300'
                                                                                : 'bg-indigo-950/30 border-indigo-500/40 text-indigo-300'
                                                                        }`}
                                                                    >
                                                                        {isOdd ? '≠ Odd Bell Pair' : '= Even Bell Pair'} with {otherName}
                                                                    </span>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="h-64 flex items-center justify-center text-slate-400 font-mono text-sm">
                                Generating story timeline...
                            </div>
                        )}
                    </div>

                    {/* Right: Alternative Multiverse Timelines */}
                    <div className="w-72 border-l border-slate-800 bg-slate-950/50 p-4 flex flex-col justify-between overflow-y-auto">
                        <div className="space-y-2">
                            <span className="text-[11px] font-mono text-purple-400 uppercase tracking-wider font-semibold block mb-2">
                                Parallel Timelines ({validStates.length})
                            </span>
                            <p className="text-[11px] text-slate-500 mb-3">
                                Click any consistent quantum state to preview that timeline:
                            </p>

                            <div className="space-y-1.5">
                                {validStates.map((st) => {
                                    const isSelected = sampledState?.index === st.index;
                                    return (
                                        <button
                                            key={st.index}
                                            onClick={() => sampleNew(st.index)}
                                            className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between ${
                                                isSelected
                                                    ? 'bg-purple-950/60 border-purple-400 text-white shadow-md shadow-purple-950/50'
                                                    : 'bg-slate-900/60 hover:bg-slate-800/60 border-slate-800 text-slate-300'
                                            }`}
                                        >
                                            <span className="font-mono text-xs font-bold text-cyan-400">
                                                |{st.bitstring}⟩
                                            </span>
                                            <span className="font-mono text-xs text-purple-300">
                                                {(st.probability * 100).toFixed(1)}%
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-800 text-[10px] font-mono text-slate-500">
                            Guaranteed quantum coherence via unitary circuit constraints.
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-3.5 border-t border-slate-800 flex justify-between items-center bg-slate-900/90">
                    <span className="text-xs text-slate-500 font-mono">
                        Multiverse Story Generator · 10-Qubit Scalable Engine
                    </span>
                    <button
                        onClick={onClose}
                        className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-mono text-xs font-semibold rounded-xl transition-all"
                    >
                        Back to Canvas
                    </button>
                </div>
            </div>
        </div>
    );
}
