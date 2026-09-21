import React, { useState } from 'react';
import { generateInkScript, downloadInkFile } from '../utils/inkExporter';

export default function AboutModal({ qubits, connections, simulator, onClose }) {
    const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'ink_options' | 'preview_ink'
    const [copied, setCopied] = useState(false);

    const inkCode = generateInkScript(qubits, connections, simulator);

    const handleCopy = () => {
        navigator.clipboard.writeText(inkCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-4xl w-full flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-slate-800">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 p-[1.5px] shadow-sm flex items-center justify-center">
                            <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center text-sky-600 font-mono font-bold text-base">
                                Ψ
                            </div>
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 tracking-wide flex items-center gap-2">
                                qBraid
                                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-sky-50 border border-sky-200 text-sky-800 font-semibold">
                                    Industry Overview
                                </span>
                            </h2>
                            <p className="text-xs text-slate-500 font-mono">
                                Consistent Quantum Multiverse Story Engine & Game Narrative Integration
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

                {/* Tabs */}
                <div className="px-6 border-b border-slate-200 bg-slate-50/30 flex gap-2 pt-2">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`px-4 py-2 font-sans text-xs font-semibold rounded-t-lg transition-all border-b-2 ${
                            activeTab === 'overview'
                                ? 'border-sky-600 text-sky-700 bg-white'
                                : 'border-transparent text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        📖 Core Architecture & Value
                    </button>
                    <button
                        onClick={() => setActiveTab('ink_options')}
                        className={`px-4 py-2 font-sans text-xs font-semibold rounded-t-lg transition-all border-b-2 ${
                            activeTab === 'ink_options'
                                ? 'border-indigo-600 text-indigo-700 bg-white'
                                : 'border-transparent text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        🎮 3 Game Engine Integration Options (Ink / Inky)
                    </button>
                    <button
                        onClick={() => setActiveTab('preview_ink')}
                        className={`px-4 py-2 font-sans text-xs font-semibold rounded-t-lg transition-all border-b-2 ${
                            activeTab === 'preview_ink'
                                ? 'border-purple-600 text-purple-700 bg-white'
                                : 'border-transparent text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        📜 Compiled .ink Script Preview
                    </button>
                </div>

                {/* Tab Content */}
                <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-slate-50/20">
                    {/* TAB 1: OVERVIEW */}
                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            <div className="p-5 rounded-2xl bg-gradient-to-br from-sky-50/80 via-white to-indigo-50/80 border border-sky-100 shadow-sm space-y-3">
                                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                    <span>🌌</span>
                                    <span>The Core Strength: Solving the Multiverse Consistency Dilemma</span>
                                </h3>
                                <p className="text-slate-700 text-sm leading-relaxed">
                                    Traditional branching narratives suffer from <strong>exponential combinatorial explosion</strong>. With 10 story beats, there are <strong>1,024 naive story timelines</strong> ($2^{10}$). Manually writing and debugging 1,024 independent paths inevitably creates narrative plot holes, contradictions, and impossible character states.
                                </p>
                                <p className="text-slate-700 text-sm leading-relaxed">
                                    <strong>Narrative Entangler</strong> solves this using pure quantum mechanics. By mapping story beats to qubits and applying <strong>Hadamard ($H$) uncertainty gates</strong> and <strong>Bell-pair entanglement (CNOT)</strong>, the system mathematically eliminates inconsistent branches through destructive interference.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl border border-sky-200/80 bg-white shadow-sm space-y-2">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                                        <h4 className="font-bold text-sm text-slate-900">1. Uncertainty Superposition ($H$ Gate)</h4>
                                    </div>
                                    <p className="text-xs text-slate-600 leading-relaxed">
                                        Placing an $H$ gate creates a balanced 50/50 superposition between Scenario 1 ($|1\rangle$) and Scenario 2 ($|0\rangle$). Writers can fine-tune probabilities continuously from 0% to 100% using continuous $R_y(\theta)$ bias sliders.
                                    </p>
                                </div>

                                <div className="p-4 rounded-xl border border-purple-200/80 bg-white shadow-sm space-y-2">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                                        <h4 className="font-bold text-sm text-slate-900">2. Bell-Pair Entanglement (CNOT)</h4>
                                    </div>
                                    <p className="text-xs text-slate-600 leading-relaxed">
                                        <strong>AND ($\Phi^+$)</strong>: Enforces strict co-occurrence. Two beats always share the same branch ($|00\rangle$ or $|11\rangle$).<br />
                                        <strong>OR ($\Psi^+$)</strong>: Enforces mutual exclusion. Two beats never co-occur ($|01\rangle$ or $|10\rangle$).
                                    </p>
                                </div>
                            </div>

                            <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm flex items-center justify-between">
                                <div>
                                    <span className="text-xs font-mono font-semibold text-slate-500 uppercase tracking-wider block">
                                        Active Simulation Backend
                                    </span>
                                    <span className="text-sm font-semibold text-slate-900">
                                        @quantumplayed/quantum-game-engine (v1.0.3)
                                    </span>
                                </div>
                                <span className="text-xs font-mono px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-semibold">
                                    Sparse Unitary State Machine
                                </span>
                            </div>
                        </div>
                    )}

                    {/* TAB 2: 3 GAME ENGINE INTEGRATION OPTIONS */}
                    {activeTab === 'ink_options' && (
                        <div className="space-y-6">
                            <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200/80">
                                <h3 className="text-sm font-bold text-indigo-950 mb-1">
                                    Bridging Narrative Entangler to Inkle's Ink & Inky IDE
                                </h3>
                                <p className="text-xs text-indigo-900/80 leading-relaxed">
                                    <strong>Ink</strong> is the gold standard for game narrative design (*80 Days*, *Heaven’s Vault*, *Pentiment*, *Sable*). Here are the three production deployment architectures ready for studio presentation:
                                </p>
                            </div>

                            {/* Option 1 */}
                            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="w-6 h-6 rounded-full bg-sky-100 text-sky-700 font-bold text-xs flex items-center justify-center font-mono">
                                            1
                                        </span>
                                        <h4 className="font-bold text-sm text-slate-900">
                                            Option 1: Compile-Time .ink Script Export (Immediate Win)
                                        </h4>
                                    </div>
                                    <span className="text-[10px] font-mono font-semibold px-2.5 py-0.5 bg-sky-50 text-sky-700 border border-sky-200 rounded-full">
                                        Ready to Use Today
                                    </span>
                                </div>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                    The writer designs their worldlines and entangled constraints visually in Narrative Entangler. Clicking <strong>"Export to .ink"</strong> compiles the quantum probability distribution directly into an idiomatic <code>.ink</code> file.
                                </p>
                                <div className="bg-slate-900 rounded-xl p-3.5 text-slate-200 font-mono text-[11px] overflow-x-auto">
                                    <span className="text-slate-500">// Story Beat Flags + Quantum Multiverse Preamble</span><br />
                                    <span className="text-purple-400">VAR</span> hero_active = <span className="text-amber-400">false</span><br />
                                    <span className="text-purple-400">VAR</span> guide_active = <span className="text-amber-400">false</span><br /><br />
                                    <span className="text-purple-400">=== function</span> sample_quantum_multiverse() <span className="text-purple-400">===</span><br />
                                    &nbsp;&nbsp;&nbsp;&nbsp;~ temp roll = RANDOM(1, 2)<br />
                                    &nbsp;&nbsp;&nbsp;&nbsp;&#123; roll:<br />
                                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;- 1: <span className="text-emerald-400">// State |11&gt; (Even Bell Pair Co-occurrence: 50%)</span><br />
                                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;~ hero_active = <span className="text-amber-400">true</span><br />
                                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;~ guide_active = <span className="text-amber-400">true</span><br />
                                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;- 2: <span className="text-emerald-400">// State |00&gt; (Neither occurs: 50%)</span><br />
                                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;~ hero_active = <span className="text-amber-400">false</span><br />
                                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;~ guide_active = <span className="text-amber-400">false</span><br />
                                    &nbsp;&nbsp;&nbsp;&nbsp;&#125;
                                </div>
                                <p className="text-[11px] text-slate-500">
                                    <strong>Client Benefit:</strong> Zero engine overhead. Writers drop the file directly into Inky, Unity, Unreal, or Godot without modifying their existing toolchain.
                                </p>
                            </div>

                            {/* Option 2 */}
                            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center font-mono">
                                            2
                                        </span>
                                        <h4 className="font-bold text-sm text-slate-900">
                                            Option 2: Runtime In-Engine Quantum Story Sampling
                                        </h4>
                                    </div>
                                    <span className="text-[10px] font-mono font-semibold px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full">
                                        Dynamic & Reactive
                                    </span>
                                </div>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                    Instead of static preambles, the game engine (Unity C# with <code>ink-unity-integration</code> or Web/Node with <code>inkjs</code>) executes <code>@quantumplayed/quantum-game-engine</code> live at runtime.
                                </p>
                                <ul className="text-xs text-slate-600 list-disc list-inside space-y-1">
                                    <li>Ink script declares <code>EXTERNAL collapse_quantum_multiverse()</code>.</li>
                                    <li>As the player makes interactive dialogue choices, the host engine measures corresponding qubits, causing the rest of the quantum story state to collapse instantly.</li>
                                    <li>Enables truly emergent, procedurally consistent branching playthroughs for roguelikes and RPGs.</li>
                                </ul>
                            </div>

                            {/* Option 3 */}
                            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center font-mono">
                                            3
                                        </span>
                                        <h4 className="font-bold text-sm text-slate-900">
                                            Option 3: Inky IDE Native Extension / Visual Sidecar
                                        </h4>
                                    </div>
                                    <span className="text-[10px] font-mono font-semibold px-2.5 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-full">
                                        Full Studio Tooling
                                    </span>
                                </div>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                    Because <strong>Inky</strong> is built with Electron and TypeScript, Narrative Entangler (built in pure HTML/JS/Pixi with zero native dependencies) can be embedded directly as a visual <strong>"Quantum Story Canvas"</strong> tab inside Inky.
                                </p>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                    <strong>Bi-directional synchronization</strong>: Writers edit prose in Inky's code editor, while Narrative Entangler renders and enforces the causal timeline connections in real time.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* TAB 3: LIVE .INK PREVIEW & EXPORT */}
                    {activeTab === 'preview_ink' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                                <div>
                                    <h4 className="font-bold text-sm text-slate-900">
                                        Compiled Inkle .ink Source Code
                                    </h4>
                                    <p className="text-xs text-slate-500 font-mono">
                                        Direct translation of current circuit into valid Ink narrative script
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleCopy}
                                        className="px-3.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
                                    >
                                        <span>{copied ? '✓' : '📋'}</span>
                                        <span>{copied ? 'Copied!' : 'Copy Ink Code'}</span>
                                    </button>

                                    <button
                                        onClick={() => downloadInkFile(qubits, connections, simulator)}
                                        className="px-4 py-1.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-100 transition-all flex items-center gap-1.5"
                                    >
                                        <span>📥</span>
                                        <span>Download .ink File</span>
                                    </button>
                                </div>
                            </div>

                            <pre className="bg-slate-900 text-slate-200 p-4 rounded-xl text-xs font-mono overflow-x-auto max-h-96 leading-relaxed select-text border border-slate-800">
                                {inkCode}
                            </pre>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-3.5 border-t border-slate-200 flex justify-between items-center bg-slate-50/70">
                    <span className="text-xs text-slate-500 font-mono">
                        Ready for client walkthrough & industry game demonstration.
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => downloadInkFile(qubits, connections, simulator)}
                            className="px-4 py-2 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 font-sans text-xs font-semibold rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                        >
                            <span>📥</span>
                            <span>Download .ink</span>
                        </button>
                        <button
                            onClick={onClose}
                            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-sans text-xs font-semibold rounded-xl transition-all"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
