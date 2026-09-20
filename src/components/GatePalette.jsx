import React from 'react';

export default function GatePalette({ onGateDrag }) {
  const gates = [
    { type: 'H', name: 'Hadamard', color: 'bg-purple-600' },
    { type: 'Ry', name: 'Y-Rotation', color: 'bg-cyan-600' },
    { type: 'X', name: 'Pauli-X', color: 'bg-green-600' },
    { type: 'CNOT', name: 'Control-NOT', color: 'bg-blue-600' },
  ];

  return (
    <div className="bg-slate-800 border-r border-cyan-500/20 p-4">
      <h3 className="text-cyan-400 font-bold text-sm mb-4 font-mono">GATES</h3>
      <div className="space-y-2">
        {gates.map((gate) => (
          <div
            key={gate.type}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.effectAllowed = 'move';
              e.dataTransfer.setData('gateType', gate.type);
            }}
            className={`${gate.color} hover:opacity-80 p-3 rounded cursor-move text-white font-bold text-center transition-opacity`}
          >
            {gate.type}
          </div>
        ))}
      </div>
    </div>
  );
}
