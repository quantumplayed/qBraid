import React, { useState, useMemo, useCallback } from 'react';
import { QuantumSimulator } from './engine/QuantumSimulator';
import PixiWorldlineCanvas from './components/PixiWorldlineCanvas';
import StoryGeneratorModal from './components/StoryGeneratorModal';
import StateDistributionModal from './components/StateDistributionModal';
import StoryBeatsModal from './components/StoryBeatsModal';
import NarrativeModal from './components/NarrativeModal';
import GateSliderOverlay from './components/GateSliderOverlay';

const MAX_WORLDLINES = 10;

const DEFAULT_PRESETS = {
  even_bell: {
    name: '🤝 Even Parity (Always Together)',
    description: 'When the Hero ascends, the Guide must follow. They always share the same fate.',
    qubits: [
      { id: 'q0', name: 'The Hero', active: 'Scales the mountain peak', passive: 'Stays in the valley', gates: [{ id: 'g0', type: 'Ry', theta: Math.PI / 2, position: 0.25 }] },
      { id: 'q1', name: 'The Guide', active: 'Aids the ascent willingly', passive: 'Remains in the valley refuge', gates: [] },
    ],
    connections: [
      { id: 'c0', type: 'CNOT', control: 0, target: 1, position: 0.55, parity: 'even' }
    ]
  },
  odd_bell: {
    name: '⚔️ Odd Parity (Never Together / Conflict)',
    description: 'Zero-sum conflict: The Protagonist and The Rival cannot both claim victory.',
    qubits: [
      { id: 'q0', name: 'The Protagonist', active: 'Claims the ancient crown', passive: 'Yields into exile', gates: [{ id: 'g0', type: 'Ry', theta: Math.PI / 2, position: 0.25 }] },
      { id: 'q1', name: 'The Rival', active: 'Seizes the throne in triumph', passive: 'Retreats in defeat', gates: [] },
    ],
    connections: [
      { id: 'c0', type: 'CNOT', control: 0, target: 1, position: 0.55, parity: 'odd' }
    ]
  },
  triad: {
    name: '🎭 Triad of Fate (Even + Odd Links)',
    description: 'Hero is entangled evenly with the Ally, and odd-parity entangled with the Adversary.',
    qubits: [
      { id: 'q0', name: 'The Hero', active: 'Breaches the dark citadel', passive: 'Retreats to regroup', gates: [{ id: 'g0', type: 'Ry', theta: Math.PI / 2, position: 0.2 }] },
      { id: 'q1', name: 'The Ally', active: 'Provides covering fire', passive: 'Falls back to perimeter', gates: [] },
      { id: 'q2', name: 'The Nemesis', active: 'Overruns the stronghold', passive: 'Is cast into the abyss', gates: [] },
    ],
    connections: [
      { id: 'c0', type: 'CNOT', control: 0, target: 1, position: 0.45, parity: 'even' },
      { id: 'c1', type: 'CNOT', control: 0, target: 2, position: 0.7, parity: 'odd' }
    ]
  },
  epic_10: {
    name: '🌌 10-Qubit Deep Multiverse (1024 Stories)',
    description: 'Full 10-beat narrative branching space with complex interconnected causal lines.',
    qubits: [
      { id: 'q0', name: 'The Oracle', active: 'Reveals the cosmic prophecy', passive: 'Keeps the omen hidden', gates: [{ id: 'g0', type: 'Ry', theta: Math.PI / 2, position: 0.15 }] },
      { id: 'q1', name: 'The Captain', active: 'Rallies the vanguard fleet', passive: 'Orders defensive retreat', gates: [] },
      { id: 'q2', name: 'The Smuggler', active: 'Delivers the hyper-core', passive: 'Sells the cargo elsewhere', gates: [{ id: 'g2', type: 'Ry', theta: Math.PI / 2, position: 0.2 }] },
      { id: 'q3', name: 'The Diplomat', active: 'Signs the interplanetary treaty', passive: 'Declares martial law', gates: [] },
      { id: 'q4', name: 'The Engineer', active: 'Overclocks the warp shield', passive: 'Ejects the power cell', gates: [] },
      { id: 'q5', name: 'The Shadow Agent', active: 'Assassinates the traitor', passive: 'Discovers false intelligence', gates: [] },
      { id: 'q6', name: 'The AI Sentinel', active: 'Overrides colony defense', passive: 'Remains subservient', gates: [] },
      { id: 'q7', name: 'The Rebel Leader', active: 'Ignites the planetary uprising', passive: 'Advises patience', gates: [] },
      { id: 'q8', name: 'The Archon', active: 'Unleashes the dark sun weapon', passive: 'Sues for truce', gates: [] },
      { id: 'q9', name: 'The Chronicler', active: 'Preserves the heroic epoch', passive: 'Witnesses civilization collapse', gates: [] },
    ],
    connections: [
      { id: 'c0', type: 'CNOT', control: 0, target: 1, position: 0.35, parity: 'even' },
      { id: 'c1', type: 'CNOT', control: 1, target: 4, position: 0.5, parity: 'even' },
      { id: 'c2', type: 'CNOT', control: 2, target: 3, position: 0.4, parity: 'odd' },
      { id: 'c3', type: 'CNOT', control: 3, target: 7, position: 0.6, parity: 'even' },
      { id: 'c4', type: 'CNOT', control: 1, target: 8, position: 0.75, parity: 'odd' },
      { id: 'c5', type: 'CNOT', control: 8, target: 9, position: 0.85, parity: 'odd' },
    ]
  }
};

export default function App() {
  const [qubits, setQubits] = useState(DEFAULT_PRESETS.triad.qubits);
  const [connections, setConnections] = useState(DEFAULT_PRESETS.triad.connections);
  const [simulator] = useState(() => new QuantumSimulator(10));

  // Modals state
  const [showStoryGenerator, setShowStoryGenerator] = useState(false);
  const [showStateDistribution, setShowStateDistribution] = useState(false);
  const [showStoryBeats, setShowStoryBeats] = useState(false);
  const [selectedQubit, setSelectedQubit] = useState(null);
  const [editingGate, setEditingGate] = useState(null); // { qubitId, gateId, gate, screenX, screenY }

  // ── Simulator: compute per-qubit uncertainty & state distribution ───────
  const { qubitUncertainty, probabilities } = useMemo(() => {
    simulator.reset();

    // Gather all gates and connections
    const allEvents = [];

    for (let i = 0; i < qubits.length; i++) {
      for (const gate of (qubits[i].gates || [])) {
        const theta = gate.theta ?? (Math.PI / 2);
        allEvents.push({
          position: gate.position,
          type: 'Ry',
          target: i,
          params: { theta },
        });
      }
    }

    // Add connections (CNOT with even or odd parity)
    for (const conn of connections) {
      allEvents.push({
        position: conn.position ?? 0.5,
        type: 'CNOT',
        target: conn.target,
        control: conn.control,
        params: { parity: conn.parity || 'even' },
      });
    }

    // Sort chronologically by position along the worldline
    allEvents.sort((a, b) => a.position - b.position);

    // Apply circuit to simulator
    for (const evt of allEvents) {
      simulator.applyGate(evt.type, evt.target, evt.control ?? null, evt.params || {});
    }

    const n = qubits.length;
    const probs = simulator.getProbabilities(n);

    // Compute per-qubit reduced probabilities for visual shimmering natively via the engine
    const uncertainty = {};
    for (let qi = 0; qi < n; qi++) {
      const entityProbs = simulator.getEntityProbabilities(qi);
      const prob1 = entityProbs[1] || 0;
      uncertainty[qubits[qi].id] = prob1 > 0.001 && prob1 < 0.999;
    }

    return { qubitUncertainty: uncertainty, probabilities: probs };
  }, [qubits, connections, simulator]);

  // ── Handlers ──────────────────────────────────────────────────────────

  const addConnection = useCallback((control, target, position = 0.5, parity = 'even') => {
    setConnections(prev => [...prev, {
      id: `cnot-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      type: 'CNOT',
      control,
      target,
      position,
      parity,
    }]);
  }, []);

  const handleToggleConnectionParity = useCallback((connId) => {
    setConnections(prev => prev.map(c => {
      if (c.id !== connId) return c;
      const newParity = c.parity === 'odd' ? 'even' : 'odd';
      return { ...c, parity: newParity };
    }));
  }, []);

  const handleRemoveConnection = useCallback((connId) => {
    setConnections(prev => prev.filter(c => c.id !== connId));
  }, []);

  const updateQubit = useCallback((updatedQubit) => {
    setQubits(prev => prev.map(q => q.id === updatedQubit.id ? updatedQubit : q));
  }, []);

  const handlePlaceGate = useCallback((qubitId, position) => {
    setQubits(prev => prev.map(q => {
      if (q.id !== qubitId) return q;
      const newGate = {
        id: `gate-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type: 'Ry',
        theta: Math.PI / 2, // 50/50 superposition (H gate default)
        position,
      };
      return { ...q, gates: [...(q.gates || []), newGate] };
    }));
  }, []);

  const handleEditGate = useCallback((data) => {
    setEditingGate(data);
  }, []);

  const handleUpdateGateTheta = useCallback((theta) => {
    if (!editingGate) return;
    setQubits(prev => prev.map(q => {
      if (q.id !== editingGate.qubitId) return q;
      return {
        ...q,
        gates: (q.gates || []).map(g =>
          g.id === editingGate.gateId ? { ...g, theta } : g
        ),
      };
    }));
    setEditingGate(prev => prev ? { ...prev, gate: { ...prev.gate, theta } } : null);
  }, [editingGate]);

  const handleRemoveGate = useCallback(() => {
    if (!editingGate) return;
    setQubits(prev => prev.map(q => {
      if (q.id !== editingGate.qubitId) return q;
      return {
        ...q,
        gates: (q.gates || []).filter(g => g.id !== editingGate.gateId),
      };
    }));
    setEditingGate(null);
  }, [editingGate]);

  const addWorldline = useCallback((customData) => {
    setQubits(prev => {
      if (prev.length >= MAX_WORLDLINES) return prev;
      const num = prev.length + 1;
      return [...prev, {
        id: `q${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        name: customData?.name || `Character ${num}`,
        active: customData?.active || `Positive outcome for Character ${num}`,
        passive: customData?.passive || `Negative outcome for Character ${num}`,
        gates: [],
      }];
    });
  }, []);

  const removeWorldlineById = useCallback((qubitId) => {
    setQubits(prev => {
      if (prev.length <= 1) return prev;
      const idx = prev.findIndex(q => q.id === qubitId);
      if (idx === -1) return prev;

      // Clean up connections attached to this index and re-index higher indices
      setConnections(conns =>
        conns
          .filter(c => c.control !== idx && c.target !== idx)
          .map(c => ({
            ...c,
            control: c.control > idx ? c.control - 1 : c.control,
            target: c.target > idx ? c.target - 1 : c.target,
          }))
      );
      return prev.filter(q => q.id !== qubitId);
    });
  }, []);

  const resetCircuit = useCallback(() => {
    setConnections([]);
    setQubits(prev => prev.map(q => ({ ...q, gates: [] })));
    setEditingGate(null);
  }, []);

  const loadPreset = (presetKey) => {
    const preset = DEFAULT_PRESETS[presetKey];
    if (!preset) return;
    setQubits(preset.qubits);
    setConnections(preset.connections);
    setEditingGate(null);
  };

  const totalGates = qubits.reduce((sum, q) => sum + (q.gates?.length || 0), 0);
  const totalStateSpace = Math.pow(2, qubits.length);

  return (
    <div className="w-full h-screen bg-slate-950 flex flex-col select-none overflow-hidden font-sans">
      {/* ── Top Navigation Bar ────────────────────────────────────────── */}
      <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-5 py-3 flex items-center justify-between gap-4 z-20">
        {/* Branding */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-600 p-[1.5px] shadow-lg shadow-cyan-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-cyan-400 font-mono font-bold text-sm">
              Ψ
            </div>
          </div>
          <div>
            <h1 className="text-white font-bold text-base tracking-wide flex items-center gap-2 font-['Outfit']">
              Narrative Entangler
              <span className="text-[10px] font-mono font-normal px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-400">
                Studio 2.0
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 font-mono">
              Consistent Quantum Multiverse Story Engine
            </p>
          </div>
        </div>

        {/* Live Metrics */}
        <div className="hidden lg:flex items-center gap-4 text-xs font-mono bg-slate-950/80 border border-slate-800/80 px-3.5 py-1.5 rounded-xl text-slate-400">
          <div>
            <span className="text-slate-500">Beats: </span>
            <span className="text-cyan-300 font-semibold">{qubits.length}/{MAX_WORLDLINES}</span>
          </div>
          <div className="w-[1px] h-3.5 bg-slate-800" />
          <div>
            <span className="text-slate-500">State Space: </span>
            <span className="text-purple-300 font-semibold">{totalStateSpace} Timelines</span>
          </div>
          <div className="w-[1px] h-3.5 bg-slate-800" />
          <div>
            <span className="text-slate-500">Gates: </span>
            <span className="text-white font-semibold">{totalGates}</span>
          </div>
          <div className="w-[1px] h-3.5 bg-slate-800" />
          <div>
            <span className="text-slate-500">Entangled: </span>
            <span className="text-amber-300 font-semibold">{connections.length}</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          {/* Preset Selector */}
          <select
            onChange={(e) => loadPreset(e.target.value)}
            defaultValue="triad"
            className="bg-slate-950 border border-slate-700 hover:border-slate-600 text-slate-200 text-xs font-mono py-1.5 px-3 rounded-xl focus:outline-none focus:border-cyan-500 transition-colors cursor-pointer"
          >
            <option value="even_bell">Preset: Even Parity (Co-occur)</option>
            <option value="odd_bell">Preset: Odd Parity (Conflict)</option>
            <option value="triad">Preset: Triad of Fate</option>
            <option value="epic_10">Preset: 10-Qubit Multiverse</option>
          </select>

          {/* Story Beats Modal Button */}
          <button
            onClick={() => setShowStoryBeats(true)}
            className="px-3.5 py-1.5 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 hover:text-white rounded-xl font-mono text-xs font-medium transition-all flex items-center gap-1.5"
            title="Edit story beats, characters, and narrative branches"
          >
            <span>📖</span>
            <span>Story Beats</span>
          </button>

          {/* State Distribution Modal Button */}
          <button
            onClick={() => setShowStateDistribution(true)}
            className="px-3.5 py-1.5 bg-cyan-950/50 hover:bg-cyan-900/60 border border-cyan-500/40 text-cyan-300 hover:text-cyan-200 rounded-xl font-mono text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm shadow-cyan-950"
            title="View full quantum state probability distribution"
          >
            <span>📊</span>
            <span>State Distribution</span>
          </button>

          {/* Story Generator Modal Button */}
          <button
            onClick={() => setShowStoryGenerator(true)}
            className="px-4 py-1.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-mono text-xs font-bold rounded-xl transition-all shadow-md shadow-purple-900/40 flex items-center gap-1.5"
            title="Sample and generate complete narrative from quantum distribution"
          >
            <span>✨</span>
            <span>Generate Story</span>
          </button>

          {/* Reset Circuit */}
          <button
            onClick={resetCircuit}
            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-950/30 rounded-xl transition-colors text-xs font-mono"
            title="Clear all gates and connections"
          >
            ↺
          </button>
        </div>
      </header>

      {/* ── Main Canvas Viewport ──────────────────────────────────────── */}
      <main className="flex-1 relative overflow-hidden bg-[#0a0f1d]">
        <PixiWorldlineCanvas
          qubits={qubits}
          connections={connections}
          qubitUncertainty={qubitUncertainty}
          onCNOTCreate={addConnection}
          onToggleConnectionParity={handleToggleConnectionParity}
          onEditQubit={(qubit) => setSelectedQubit(qubit)}
          onPlaceGate={handlePlaceGate}
          onEditGate={handleEditGate}
          onRemoveConnection={handleRemoveConnection}
          onRemoveWorldline={removeWorldlineById}
          onAddWorldline={addWorldline}
        />

        {/* Floating Quick Action Badge */}
        <div className="absolute top-4 left-6 pointer-events-none flex items-center gap-2">
          <span className="text-[11px] font-mono text-slate-400 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-800/80 shadow-lg">
            ✨ <strong className="text-cyan-400 font-medium">Click line</strong> to place 50/50 H-Gate · <strong className="text-purple-400 font-medium">Drag line-to-line</strong> to Entangle · <strong className="text-amber-400 font-medium">Click Parity Badge</strong> to Toggle Even/Odd
          </span>
        </div>
      </main>

      {/* ── Footer Status Bar ────────────────────────────────────────── */}
      <footer className="bg-slate-900/90 border-t border-slate-800/80 px-5 py-2 flex items-center justify-between text-[11px] font-mono text-slate-400">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            Quantum Engine Online
          </span>
          <span className="text-slate-600">|</span>
          <span>10-Qubit Unitary Simulation Active</span>
        </div>
        <div className="flex items-center gap-4 text-slate-500">
          <span>Even Parity: Both Beats Co-occur (Φ⁺)</span>
          <span>·</span>
          <span>Odd Parity: Mutual Exclusion (Ψ⁺)</span>
        </div>
      </footer>

      {/* ── Modals ───────────────────────────────────────────────────── */}

      {/* Story Generator Modal */}
      {showStoryGenerator && (
        <StoryGeneratorModal
          simulator={simulator}
          qubits={qubits}
          connections={connections}
          onClose={() => setShowStoryGenerator(false)}
        />
      )}

      {/* State Distribution Modal */}
      {showStateDistribution && (
        <StateDistributionModal
          simulator={simulator}
          qubits={qubits}
          onClose={() => setShowStateDistribution(false)}
          onOpenStoryGenerator={() => {
            setShowStateDistribution(false);
            setShowStoryGenerator(true);
          }}
        />
      )}

      {/* Story Beats Manager Modal */}
      {showStoryBeats && (
        <StoryBeatsModal
          qubits={qubits}
          onClose={() => setShowStoryBeats(false)}
          onSaveQubit={updateQubit}
          onAddBeat={addWorldline}
          onRemoveBeat={removeWorldlineById}
          maxQubits={MAX_WORLDLINES}
        />
      )}

      {/* Quick Narrative Edit Modal (on clicking worldline start dot) */}
      {selectedQubit && (
        <NarrativeModal
          qubit={selectedQubit}
          onClose={() => setSelectedQubit(null)}
          onSave={updateQubit}
          onRemove={removeWorldlineById}
        />
      )}

      {/* Uncertainty Gate Slider Overlay */}
      {editingGate && (
        <GateSliderOverlay
          x={editingGate.screenX}
          y={editingGate.screenY}
          gate={editingGate.gate}
          onChange={handleUpdateGateTheta}
          onClose={() => setEditingGate(null)}
          onRemove={handleRemoveGate}
        />
      )}
    </div>
  );
}
