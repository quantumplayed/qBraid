import React from 'react';

/**
 * Wavefunction probability histogram.
 * Receives pre-computed probabilities from the simulator.
 */
export default function WavefunctionPanel({ qubits, probabilities, numQubits }) {
  const n = numQubits;
  const numUsedStates = Math.pow(2, n);

  // Only show states for the active qubits (ignore simulator's extra qubits)
  const probs = probabilities ? probabilities.slice(0, numUsedStates) : [];

  const maxProb = Math.max(...probs, 0.001);

  // For legibility, cap at 32 states with labels; beyond that, use narrow bars
  const showLabels = numUsedStates <= 32;
  const barWidth = showLabels ? Math.max(20, Math.min(60, 600 / numUsedStates)) : 6;

  return (
    <div className="bg-slate-800 border-t border-cyan-500/20 p-4 overflow-x-auto" style={{ maxHeight: '220px' }}>
      <h3 className="text-cyan-400 font-bold text-xs mb-2 font-mono">
        WAVEFUNCTION ({numUsedStates} states)
      </h3>

      <div className="flex items-end gap-[2px]" style={{ height: '120px' }}>
        {probs.map((prob, idx) => {
          const label = idx.toString(2).padStart(n, '0');
          const height = Math.max(1, (prob / maxProb) * 110);
          const percentage = (prob * 100).toFixed(1);
          const isSignificant = prob > 0.01;

          return (
            <div
              key={idx}
              className="flex flex-col items-center flex-shrink-0"
              style={{ width: `${barWidth}px` }}
            >
              {/* Probability label on top */}
              {showLabels && isSignificant && (
                <span className="text-cyan-300 font-mono mb-1"
                  style={{ fontSize: '8px' }}>
                  {percentage}%
                </span>
              )}

              {/* Bar */}
              <div
                className="w-full rounded-t transition-all duration-200"
                style={{
                  height: `${height}px`,
                  background: isSignificant
                    ? 'linear-gradient(to top, #0891b2, #22d3ee)'
                    : 'linear-gradient(to top, #334155, #475569)',
                  opacity: isSignificant ? 1 : 0.4,
                }}
                title={`|${label}⟩: ${percentage}%`}
              />

              {/* State label */}
              {showLabels && (
                <span
                  className="font-mono text-slate-500 mt-1"
                  style={{
                    fontSize: n > 4 ? '6px' : '8px',
                    writingMode: n > 4 ? 'vertical-lr' : 'horizontal-tb',
                  }}
                >
                  |{label}⟩
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="text-xs text-slate-500 mt-2 font-mono">
        {numUsedStates} outcomes · bars scaled relative to max ({(maxProb * 100).toFixed(1)}%)
      </div>
    </div>
  );
}
