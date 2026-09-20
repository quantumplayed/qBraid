import React, { useState } from 'react';

const PRESET_BEATS = [
    { name: 'The Scout', active: 'Discovers the secret path', passive: 'Falls into the ambush' },
    { name: 'The Artifact', active: 'Powers up successfully', passive: 'Overheats and detonates' },
    { name: 'The Betrayer', active: 'Switches allegiance', passive: 'Remains loyal' },
    { name: 'The Storm', active: 'Breaks the defenses', passive: 'Dissipates harmlessly' },
    { name: 'The AI Oracle', active: 'Grants enlightenment', passive: 'Initiates lockdown' },
];

export default function StoryBeatsModal({
    qubits,
    onClose,
    onSaveQubit,
    onAddBeat,
    onRemoveBeat,
    maxQubits = 10
}) {
    const [selectedId, setSelectedId] = useState(qubits[0]?.id || null);
    const [editingBeat, setEditingBeat] = useState(() => qubits[0] ? { ...qubits[0] } : null);

    const handleSelect = (q) => {
        setSelectedId(q.id);
        setEditingBeat({ ...q });
    };

    const handleFieldChange = (field, val) => {
        if (!editingBeat) return;
        const updated = { ...editingBeat, [field]: val };
        setEditingBeat(updated);
        onSaveQubit(updated);
    };

    const handleAddPreset = (preset) => {
        if (qubits.length >= maxQubits) return;
        onAddBeat({
            name: preset.name,
            active: preset.active,
            passive: preset.passive
        });
    };

    const handleAddNew = () => {
        if (qubits.length >= maxQubits) return;
        const num = qubits.length + 1;
        onAddBeat({
            name: `Story Beat ${num}`,
            active: `Positive event for Beat ${num}`,
            passive: `Negative event for Beat ${num}`
        });
    };

    return (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-cyan-500/40 rounded-2xl shadow-2xl shadow-cyan-950/70 max-w-4xl w-full flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Modal Header */}
                <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                            <span className="text-lg">📖</span>
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white tracking-wide">Story Beats & Characters</h2>
                            <p className="text-xs text-slate-400 font-mono">
                                Manage worldlines ({qubits.length}/{maxQubits} beats active · {Math.pow(2, qubits.length)} possible multiverse timelines)
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

                {/* Modal Body */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Left: Beat List */}
                    <div className="w-1/3 border-r border-slate-800 bg-slate-950/40 p-4 flex flex-col justify-between overflow-y-auto">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider font-semibold">
                                    Active Story Beats
                                </span>
                                <span className="text-[10px] font-mono text-slate-500">
                                    {qubits.length} / {maxQubits}
                                </span>
                            </div>

                            {qubits.map((q, idx) => {
                                const isSelected = q.id === selectedId;
                                return (
                                    <div
                                        key={q.id}
                                        onClick={() => handleSelect(q)}
                                        className={`group relative p-3 rounded-xl cursor-pointer transition-all border ${
                                            isSelected
                                                ? 'bg-cyan-950/40 border-cyan-500/60 shadow-lg shadow-cyan-950/40 text-white'
                                                : 'bg-slate-900/60 hover:bg-slate-800/60 border-slate-800 text-slate-300'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-cyan-400">
                                                    q{idx}
                                                </span>
                                                <span className="font-semibold text-sm truncate max-w-[130px]">
                                                    {q.name}
                                                </span>
                                            </div>

                                            {qubits.length > 1 && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onRemoveBeat(q.id);
                                                        if (selectedId === q.id) {
                                                            const remaining = qubits.filter(item => item.id !== q.id);
                                                            if (remaining.length > 0) {
                                                                handleSelect(remaining[0]);
                                                            }
                                                        }
                                                    }}
                                                    className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-opacity p-1"
                                                    title="Remove beat"
                                                >
                                                    ✕
                                                </button>
                                            )}
                                        </div>

                                        <p className="text-[11px] text-slate-400 truncate">
                                            + {q.active}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Add Beat Button */}
                        <div className="pt-4 border-t border-slate-800/80 mt-4 space-y-2">
                            <button
                                onClick={handleAddNew}
                                disabled={qubits.length >= maxQubits}
                                className="w-full py-2 px-3 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white font-mono text-xs font-semibold rounded-xl transition-all shadow-md shadow-cyan-900/30 flex items-center justify-center gap-1.5"
                            >
                                <span>+</span> Add Custom Beat
                            </button>

                            {/* Inspiration Dropdown */}
                            <div className="text-[11px] font-mono text-slate-500 pt-1">
                                Quick presets:
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                    {PRESET_BEATS.slice(0, 3).map((p, i) => (
                                        <button
                                            key={i}
                                            onClick={() => handleAddPreset(p)}
                                            disabled={qubits.length >= maxQubits}
                                            className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 transition-colors"
                                        >
                                            + {p.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Detailed Beat Editor */}
                    <div className="flex-1 p-6 overflow-y-auto bg-slate-900/50">
                        {editingBeat ? (
                            <div className="space-y-6 max-w-xl">
                                <div>
                                    <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 block mb-1">
                                        Beat Identity
                                    </span>
                                    <label className="block text-white text-sm font-semibold mb-1">Character / Story Beat Name</label>
                                    <input
                                        type="text"
                                        value={editingBeat.name}
                                        onChange={(e) => handleFieldChange('name', e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-white px-3.5 py-2.5 rounded-xl text-sm transition-all"
                                        placeholder="e.g., The Hero, The Ancient Artifact, The Infiltration..."
                                    />
                                </div>

                                <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/20 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-cyan-400 text-sm font-semibold flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full bg-cyan-400" />
                                            Active / Positive Outcome (State |1⟩)
                                        </label>
                                        <span className="text-[10px] font-mono text-cyan-500/80">Triggered on Active Bit</span>
                                    </div>
                                    <p className="text-xs text-slate-400">
                                        What happens when this event succeeds, this character acts, or this timeline branch resolves positively:
                                    </p>
                                    <textarea
                                        rows={3}
                                        value={editingBeat.active}
                                        onChange={(e) => handleFieldChange('active', e.target.value)}
                                        className="w-full bg-slate-950 border border-cyan-500/30 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-slate-100 px-3.5 py-2.5 rounded-xl text-sm transition-all resize-none"
                                        placeholder="e.g. Scales the mountain fortress, discovers the ancient codex..."
                                    />
                                </div>

                                <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/20 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-purple-400 text-sm font-semibold flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full bg-purple-400" />
                                            Passive / Negative Outcome (State |0⟩)
                                        </label>
                                        <span className="text-[10px] font-mono text-purple-400/80">Triggered on Default Bit</span>
                                    </div>
                                    <p className="text-xs text-slate-400">
                                        What happens when this event fails, remains dormant, or resolves negatively:
                                    </p>
                                    <textarea
                                        rows={3}
                                        value={editingBeat.passive}
                                        onChange={(e) => handleFieldChange('passive', e.target.value)}
                                        className="w-full bg-slate-950 border border-purple-500/30 focus:border-purple-400 focus:ring-1 focus:ring-purple-400 text-slate-100 px-3.5 py-2.5 rounded-xl text-sm transition-all resize-none"
                                        placeholder="e.g. Is forced into the treacherous lowlands, fails to decrypt the codex..."
                                    />
                                </div>

                                <div className="bg-slate-950/60 rounded-xl p-3.5 border border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
                                    <span>Gate Modifications: {editingBeat.gates?.length || 0}</span>
                                    <span className="text-cyan-400">Quantum Ready</span>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-500 font-mono text-sm">
                                Select or add a story beat to edit.
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-3.5 border-t border-slate-800 flex justify-between items-center bg-slate-900/90">
                    <span className="text-xs text-slate-500 font-mono">
                        Changes are saved instantly to the quantum canvas.
                    </span>
                    <button
                        onClick={onClose}
                        className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-semibold rounded-xl transition-all shadow-md shadow-cyan-900/40"
                    >
                        Close & View Canvas
                    </button>
                </div>
            </div>
        </div>
    );
}
