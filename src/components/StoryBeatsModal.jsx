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
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-4xl w-full flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-slate-800">
                {/* Modal Header */}
                <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-sky-50 border border-sky-200 text-sky-600">
                            <span className="text-lg">📖</span>
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 tracking-wide">Story Beats & Characters</h2>
                            <p className="text-xs text-slate-500 font-mono">
                                Manage worldlines ({qubits.length}/{maxQubits} beats active · {Math.pow(2, qubits.length)} possible multiverse timelines)
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

                {/* Modal Body */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Left: Beat List */}
                    <div className="w-1/3 border-r border-slate-200 bg-slate-50/50 p-4 flex flex-col justify-between overflow-y-auto">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[11px] font-mono text-sky-800 uppercase tracking-wider font-semibold">
                                    Active Story Beats
                                </span>
                                <span className="text-[10px] font-mono text-slate-400 font-medium">
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
                                                ? 'bg-sky-50 border-sky-300 shadow-sm text-sky-950'
                                                : 'bg-white hover:bg-slate-100/80 border-slate-200 text-slate-700'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-600 font-medium">
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
                                                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 transition-opacity p-1"
                                                    title="Remove beat"
                                                >
                                                    ✕
                                                </button>
                                            )}
                                        </div>

                                        <p className="text-[11px] text-slate-500 truncate">
                                            + {q.active}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Add Beat Button */}
                        <div className="pt-4 border-t border-slate-200 mt-4 space-y-2">
                            <button
                                onClick={handleAddNew}
                                disabled={qubits.length >= maxQubits}
                                className="w-full py-2 px-3 bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white font-sans text-xs font-semibold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
                            >
                                <span>+</span> Add Custom Beat
                            </button>

                            {/* Inspiration Dropdown */}
                            <div className="text-[11px] font-mono text-slate-400 pt-1">
                                Quick presets:
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                    {PRESET_BEATS.slice(0, 3).map((p, i) => (
                                        <button
                                            key={i}
                                            onClick={() => handleAddPreset(p)}
                                            disabled={qubits.length >= maxQubits}
                                            className="text-[10px] px-2 py-0.5 rounded-full bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 disabled:opacity-40 transition-colors"
                                        >
                                            + {p.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Detailed Beat Editor */}
                    <div className="flex-1 p-6 overflow-y-auto bg-white">
                        {editingBeat ? (
                            <div className="space-y-6 max-w-xl">
                                <div>
                                    <span className="text-[10px] font-mono uppercase tracking-wider text-sky-700 block mb-1 font-semibold">
                                        Beat Identity
                                    </span>
                                    <label className="block text-slate-800 text-sm font-semibold mb-1">Character / Story Beat Name</label>
                                    <input
                                        type="text"
                                        value={editingBeat.name}
                                        onChange={(e) => handleFieldChange('name', e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 focus:border-sky-500 focus:bg-white focus:ring-1 focus:ring-sky-500 text-slate-900 px-3.5 py-2.5 rounded-xl text-sm transition-all"
                                        placeholder="e.g., The Hero, The Ancient Artifact, The Infiltration..."
                                    />
                                </div>

                                <div className="p-4 rounded-xl bg-sky-50/60 border border-sky-200/80 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sky-900 text-sm font-semibold flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full bg-sky-500" />
                                            Active / Positive Outcome (State |1⟩)
                                        </label>
                                        <span className="text-[10px] font-mono text-sky-700">Triggered on Active Bit</span>
                                    </div>
                                    <p className="text-xs text-slate-500">
                                        What happens when this event succeeds, this character acts, or this timeline branch resolves positively:
                                    </p>
                                    <textarea
                                        rows={3}
                                        value={editingBeat.active}
                                        onChange={(e) => handleFieldChange('active', e.target.value)}
                                        className="w-full bg-white border border-sky-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-slate-900 px-3.5 py-2.5 rounded-xl text-sm transition-all resize-none shadow-sm"
                                        placeholder="e.g. Scales the mountain fortress, discovers the ancient codex..."
                                    />
                                </div>

                                <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-200/80 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-purple-900 text-sm font-semibold flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full bg-purple-500" />
                                            Passive / Negative Outcome (State |0⟩)
                                        </label>
                                        <span className="text-[10px] font-mono text-purple-700">Triggered on Default Bit</span>
                                    </div>
                                    <p className="text-xs text-slate-500">
                                        What happens when this event fails, remains dormant, or resolves negatively:
                                    </p>
                                    <textarea
                                        rows={3}
                                        value={editingBeat.passive}
                                        onChange={(e) => handleFieldChange('passive', e.target.value)}
                                        className="w-full bg-white border border-purple-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-slate-900 px-3.5 py-2.5 rounded-xl text-sm transition-all resize-none shadow-sm"
                                        placeholder="e.g. Is forced into the treacherous lowlands, fails to decrypt the codex..."
                                    />
                                </div>

                                <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 flex items-center justify-between text-xs text-slate-600 font-mono">
                                    <span>Gate Modifications: {editingBeat.gates?.length || 0}</span>
                                    <span className="text-sky-700 font-semibold">Quantum Ready</span>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-400 font-mono text-sm">
                                Select or add a story beat to edit.
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-3.5 border-t border-slate-200 flex justify-between items-center bg-slate-50/70">
                    <span className="text-xs text-slate-500 font-mono">
                        Changes are saved instantly to the quantum canvas.
                    </span>
                    <button
                        onClick={onClose}
                        className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white font-sans text-xs font-semibold rounded-xl transition-all shadow-sm"
                    >
                        Close & View Canvas
                    </button>
                </div>
            </div>
        </div>
    );
}
