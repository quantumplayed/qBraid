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
    initialStateIndex = null,
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
                        title: beat.status === 'active' ? 'SCENARIO 1' : 'SCENARIO 2',
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
                        title: isBit1 ? 'SCENARIO 1' : 'SCENARIO 2',
                        text: isBit1 ? (q.active || 'Scenario 1') : (q.passive || 'Scenario 2'),
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
        sampleNew(initialStateIndex);
    }, [initialStateIndex]);

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
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-4xl w-full flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-slate-800">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-600">
                            <span className="text-xl">✨</span>
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 tracking-wide flex items-center gap-2">
                                Multiverse Story Generator
                                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-purple-50 border border-purple-200 text-purple-800 font-semibold">
                                    Quantum Sample
                                </span>
                            </h2>
                            <p className="text-xs text-slate-500 font-mono">
                                Sampled coherent timeline from {validStates.length} valid quantum branch{validStates.length === 1 ? '' : 'es'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => sampleNew()}
                            disabled={isRolling}
                            className="px-4 py-2 bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600 hover:from-sky-700 hover:to-purple-700 text-white font-sans text-xs font-semibold rounded-xl transition-all shadow-md shadow-indigo-100 flex items-center gap-2"
                        >
                            <span className={isRolling ? 'animate-spin' : ''}>🎲</span>
                            <span>{isRolling ? 'Collapsing State...' : 'Sample New Timeline'}</span>
                        </button>
                        <button
                            onClick={onClose}
                            className="text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 p-2 rounded-lg text-sm transition-colors"
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
                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between flex-wrap gap-4">
                                    <div>
                                        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-0.5 font-medium">
                                            Sampled Wavefunction State
                                        </span>
                                        <span className="text-2xl font-mono font-bold text-sky-700 tracking-widest">
                                            |{sampledState.bitstring}⟩
                                        </span>
                                    </div>

                                    <div>
                                        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-0.5 font-medium">
                                            Occurrence Probability
                                        </span>
                                        <span className="text-xl font-mono font-bold text-purple-700">
                                            {(sampledState.probability * 100).toFixed(1)}%
                                        </span>
                                    </div>

                                    <div>
                                        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-0.5 font-medium">
                                            Timeline Index
                                        </span>
                                        <span className="text-sm font-mono text-slate-600 font-semibold">
                                            State #{sampledState.index}
                                        </span>
                                    </div>

                                    <button
                                        onClick={handleCopy}
                                        className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 font-sans text-xs rounded-lg border border-slate-200 transition-colors flex items-center gap-1.5 shadow-sm font-medium"
                                    >
                                        <span>{copied ? '✓' : '📋'}</span>
                                        <span>{copied ? 'Copied!' : 'Copy Story'}</span>
                                    </button>
                                </div>

                                {/* Flowing Narrative Chronicle */}
                                <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50/70 via-sky-50/50 to-purple-50/70 border border-indigo-200/80 shadow-sm">
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-900">
                                            Narrative Chronicle
                                        </span>
                                        <span className="text-[10px] font-mono text-slate-400">
                                            Consistent Story Passage
                                        </span>
                                    </div>
                                    <p className="text-slate-800 text-sm leading-relaxed font-serif italic selection:bg-purple-200">
                                        "{generatedProse}"
                                    </p>
                                </div>

                                {/* Beat-by-Beat Timeline */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-600">
                                            Timeline Story Beats ({sampledState.beatOutcomes.length})
                                        </span>
                                        <span className="text-[11px] font-mono text-slate-400">
                                            Blue = Scenario 1 · Purple = Scenario 2
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
                                                            ? 'bg-sky-50/60 border-sky-200/80'
                                                            : 'bg-purple-50/60 border-purple-200/80'
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between mb-1.5">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                                                q{idx}
                                                            </span>
                                                            <span className="font-semibold text-sm text-slate-900">
                                                                {beat.name}
                                                            </span>
                                                        </div>

                                                        <span
                                                            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                                                                isActive
                                                                    ? 'bg-sky-100 text-sky-800 border border-sky-300'
                                                                    : 'bg-purple-100 text-purple-800 border border-purple-300'
                                                            }`}
                                                        >
                                                            {isActive ? 'SCENARIO 1' : 'SCENARIO 2'}
                                                        </span>
                                                    </div>

                                                    <p className="text-xs text-slate-700 mt-1 leading-snug">
                                                        {beat.text}
                                                    </p>

                                                    {/* Entanglement Badges */}
                                                    {beat.connections.length > 0 && (
                                                        <div className="mt-2 pt-2 border-t border-slate-200/80 flex flex-wrap gap-1">
                                                            {beat.connections.map((conn, ci) => {
                                                                const otherIdx = conn.control === idx ? conn.target : conn.control;
                                                                const otherName = qubits[otherIdx]?.name || `q${otherIdx}`;
                                                                const isOdd = conn.parity === 'odd';
                                                                return (
                                                                    <span
                                                                        key={ci}
                                                                        className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                                                                            isOdd
                                                                                ? 'bg-amber-50 border-amber-200 text-amber-800'
                                                                                : 'bg-indigo-50 border-indigo-200 text-indigo-800'
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
                    <div className="w-72 border-l border-slate-200 bg-slate-50/50 p-4 flex flex-col justify-between overflow-y-auto">
                        <div className="space-y-2">
                            <span className="text-[11px] font-mono text-purple-800 uppercase tracking-wider font-semibold block mb-2">
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
                                                    ? 'bg-purple-50 border-purple-300 text-purple-950 shadow-sm'
                                                    : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                                            }`}
                                        >
                                            <span className="font-mono text-xs font-bold text-sky-800">
                                                |{st.bitstring}⟩
                                            </span>
                                            <span className="font-mono text-xs text-purple-700 font-semibold">
                                                {(st.probability * 100).toFixed(1)}%
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-200 text-[10px] font-mono text-slate-400">
                            Guaranteed quantum coherence via unitary circuit constraints.
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-3.5 border-t border-slate-200 flex justify-between items-center bg-slate-50/70">
                    <span className="text-xs text-slate-500 font-mono">
                        Multiverse Story Generator · 10-Qubit Scalable Engine
                    </span>
                    <button
                        onClick={onClose}
                        className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-sans text-xs font-semibold rounded-xl transition-all"
                    >
                        Back to Canvas
                    </button>
                </div>
            </div>
        </div>
    );
}
