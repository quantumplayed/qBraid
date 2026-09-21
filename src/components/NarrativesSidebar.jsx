import React, { useState, useMemo } from 'react';

/**
 * NarrativesSidebar
 * Displays all possible narrative timelines (quantum multiverse branches) in real time.
 * Allows comparing the current scrubber time slice vs. destiny, inspecting character fates,
 * and launching the full story chronicle for any branch.
 */
export default function NarrativesSidebar({
  simulator,
  qubits,
  connections = [],
  scrubberPosition = 1.0,
  sliceInfo = null,
  width = 384,
  onWidthChange,
  onOpenStoryGenerator,
  onClose,
}) {
  const [isResizing, setIsResizing] = useState(false);

  // Left resize drag handler
  const handleResizeStart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    const startX = e.clientX;
    const startW = width;

    const handleMouseMove = (moveEvent) => {
      // Dragging left increases width; dragging right decreases width
      const deltaX = startX - moveEvent.clientX;
      const newWidth = Math.max(384, Math.min(window.innerWidth - 80, startW + deltaX));
      onWidthChange?.(newWidth);
      try {
        localStorage.setItem('narratives_sidebar_width', String(newWidth));
      } catch { }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Compute active branches dynamically reflecting scrubber position
  const branchData = useMemo(() => {
    const numActive = qubits.length;
    if (numActive === 0) {
      return { branches: [], hasPhaseInterference: false, totalBranches: 0 };
    }

    const detailed = sliceInfo || simulator.getDetailedState(numActive);

    const branches = (detailed.activeBranches || []).map((b) => {
      // Map character fates
      const characterFates = qubits.map((q, idx) => {
        const isBit1 = b.bitstring[idx] === '1';
        return {
          id: q.id,
          name: q.name,
          isBit1,
          status: isBit1 ? 'active' : 'passive',
          text: isBit1 ? (q.active || 'Succeeds') : (q.passive || 'Fails'),
        };
      });

      // Generate dynamic narrative synopsis
      const sentences = [];
      characterFates.forEach((fate, idx) => {
        let connector = 'Meanwhile,';
        if (idx === 0) connector = 'In this branch,';
        else if (idx === characterFates.length - 1) connector = 'Finally,';
        else if (idx % 2 === 1) connector = 'Simultaneously,';

        if (fate.isBit1) {
          sentences.push(`${connector} ${fate.name} acts decisively: "${fate.text}".`);
        } else {
          sentences.push(`${connector} ${fate.name} hesitates in doubt: "${fate.text}".`);
        }
      });
      const synopsis = sentences.join(' ');

      return {
        ...b,
        characterFates,
        synopsis,
      };
    });

    return {
      branches,
      hasPhaseInterference: detailed.hasPhaseInterference,
      totalBranches: branches.length,
    };
  }, [simulator, qubits, sliceInfo]);

  const { branches, hasPhaseInterference, totalBranches } = branchData;

  return (
    <aside
      style={{ width: `${width}px`, minWidth: '384px' }}
      className="relative bg-white/95 backdrop-blur-md border-l border-slate-200 shadow-2xl flex flex-col z-20 h-full overflow-hidden text-slate-800 transition-[width] duration-75 select-none"
    >
      {/* ── Left Resize Drag Handle ─────────────────────────────────── */}
      <div
        onMouseDown={handleResizeStart}
        className={`absolute left-0 top-0 bottom-0 w-3 -ml-1.5 cursor-col-resize z-30 group flex items-center justify-center transition-colors ${
          isResizing ? 'bg-sky-500/20' : 'hover:bg-sky-400/20'
        }`}
        title="Drag left/right to resize sidebar (minimum 384px)"
      >
        <div
          className={`w-1 h-12 rounded-full transition-all ${
            isResizing ? 'bg-sky-600 w-1.5' : 'bg-slate-300 group-hover:bg-sky-500'
          }`}
        />
      </div>

      {/* ── Sidebar Header ─────────────────────────────────────────── */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-sky-100/70 text-sky-700 font-bold text-base flex items-center justify-center">
            📖
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">Possible Narratives</h2>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200">
                {totalBranches} {totalBranches === 1 ? 'Timeline' : 'Timelines'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              {totalBranches > 1 ? 'Coexisting parallel realities' : 'Deterministic timeline'}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-7 h-7 rounded-lg hover:bg-slate-200/70 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer text-sm"
          title="Close Narratives Sidebar"
        >
          ✕
        </button>
      </div>

      {/* ── Quantum State Context Banner ────────────────────────────── */}
      <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 text-[11px]">
        {hasPhaseInterference ? (
          <div className="flex items-center gap-2 text-amber-700">
            <span>⚡</span>
            <span>
              <strong>Phase Interference Active:</strong> Destructive cancellation has suppressed incompatible branches.
            </span>
          </div>
        ) : totalBranches > 1 ? (
          <div className="flex items-center gap-2 text-indigo-700">
            <span>✨</span>
            <span>
              <strong>Quantum Superposition:</strong> All {totalBranches} storylines exist simultaneously until observed.
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-slate-600">
            <span>🎯</span>
            <span>
              <strong>Single Reality:</strong> Add Hadamard gates or entangle worldlines to branch reality!
            </span>
          </div>
        )}
      </div>

      {/* ── Scrollable Narrative Branches List ──────────────────────── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
        {branches.map((branch) => {
          const probPct = parseFloat(branch.percent || (branch.probability * 100).toFixed(1));
          const isDominant = probPct >= 50;

          return (
            <div
              key={branch.index}
              className="bg-white rounded-xl border border-slate-200/90 hover:border-sky-300 p-3.5 shadow-xs hover:shadow-md transition-all space-y-3"
            >
              {/* Card Header: Ket + Probability Gauge */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                    |{branch.bitstring}⟩
                  </span>
                  <span className="text-xs font-semibold text-slate-700">
                    Timeline #{branch.index}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {branch.sign === '-' && (
                    <span
                      className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200"
                      title="Phase inversion (negative amplitude: -)"
                    >
                      Phase −
                    </span>
                  )}
                  <span
                    className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${
                      isDominant
                        ? 'bg-sky-100 text-sky-800 border border-sky-200'
                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    {branch.percent}%
                  </span>
                </div>
              </div>

              {/* Probability Visual Bar */}
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    branch.sign === '-'
                      ? 'bg-gradient-to-r from-amber-400 to-amber-500'
                      : 'bg-gradient-to-r from-sky-400 to-indigo-500'
                  }`}
                  style={{ width: `${Math.max(2, probPct)}%` }}
                />
              </div>

              {/* Character Outcomes in this Branch */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Character Fates
                </span>
                <div className="grid grid-cols-1 gap-1.5">
                  {branch.characterFates.map((fate) => (
                    <div
                      key={fate.id}
                      className="flex items-start gap-2 text-xs p-1.5 rounded-lg bg-slate-50 border border-slate-100"
                    >
                      <span
                        className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded shrink-0 uppercase ${
                          fate.isBit1
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-purple-100 text-purple-800 border border-purple-200'
                        }`}
                      >
                        {fate.isBit1 ? 'Active' : 'Passive'}
                      </span>
                      <div className="min-w-0 flex-1">
                        <span className="font-semibold text-slate-800 block text-[11px]">
                          {fate.name}
                        </span>
                        <p className="text-[11px] text-slate-600 leading-tight">
                          {fate.text}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mini Narrative Synopsis */}
              <div className="p-2.5 rounded-lg bg-sky-50/50 border border-sky-100 text-[11px] text-slate-700 leading-relaxed italic">
                "{branch.synopsis}"
              </div>

              {/* Quick Weave Trigger Button */}
              <button
                onClick={() => onOpenStoryGenerator && onOpenStoryGenerator(branch.index)}
                className="w-full py-1.5 px-3 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-sky-50 hover:text-sky-700 text-slate-700 border border-slate-200 hover:border-sky-300 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <span>✨</span>
                <span>Weave This Story Chronicle</span>
              </button>
            </div>
          );
        })}

        {branches.length === 0 && (
          <div className="text-center py-12 text-slate-400 text-xs">
            <span className="text-2xl block mb-2">🌌</span>
            <span>No valid timeline branches detected at this time slice.</span>
          </div>
        )}
      </div>

      {/* ── Sidebar Footer ─────────────────────────────────────────── */}
      <div className="p-3 border-t border-slate-200 bg-slate-50/90 flex items-center justify-between text-[11px] text-slate-500">
        <span>Click <strong>Weave</strong> to sample full story</span>
        <button
          onClick={() => onOpenStoryGenerator && onOpenStoryGenerator(null)}
          className="text-sky-700 hover:text-sky-900 font-semibold cursor-pointer underline"
        >
          Sample Random Timeline 🎲
        </button>
      </div>
    </aside>
  );
}
