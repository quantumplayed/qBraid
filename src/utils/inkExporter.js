/**
 * inkExporter.js
 * Compiles qBraid's quantum worldlines and state distribution
 * into an idiomatic, ready-to-run Inkle Ink (.ink) script.
 */

function sanitizeIdentifier(name, fallback = 'beat') {
    if (!name) return fallback;
    const clean = name
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '_')
        .replace(/^[0-9]/, '_$&')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');
    return clean || fallback;
}

export function generateInkScript(qubits, connections, simulator) {
    const numQubits = qubits.length;
    const sparse = simulator.getSparseDistribution(numQubits);

    // Filter to states with probability > 0.0001
    const validStates = sparse.filter(s => s.probability > 0.0001);
    const sortedStates = [...validStates].sort((a, b) => b.probability - a.probability);

    // Map qubits to variable names
    const qubitVarMap = qubits.map((q, idx) => ({
        index: idx,
        id: q.id,
        name: q.name,
        varName: `${sanitizeIdentifier(q.name, `beat_${idx}`)}_active`,
        knotName: sanitizeIdentifier(q.name, `beat_${idx}`),
        active: q.active || 'Succeeds',
        passive: q.passive || 'Fails',
    }));

    let ink = `// =============================================================================
// qBraid -> INK MULTIVERSE SCRIPT
// Compiled from Quantum Game Engine Circuit (Sparse Joint Amplitudes)
// Active Story Beats: ${numQubits} | Hilbert Space: ${Math.pow(2, numQubits)} | Valid Branches: ${validStates.length}
// =============================================================================

`;

    // 1. Declare Global Story Variables
    ink += `// --- Story Beat Outcome Flags (Qubit Projections) ---\n`;
    for (const q of qubitVarMap) {
        ink += `VAR ${q.varName} = false // ${q.name}\n`;
    }
    ink += `VAR current_quantum_state = ""\n\n`;

    // 2. Quantum Multiverse Sampling Function
    ink += `// --- Quantum Multiverse Timeline Sampling ---
// Probabilistically samples only from physically consistent multiverse branches.
// Bell pair constraints (co-occurrence and conflict) are guaranteed preserved.
=== function sample_quantum_multiverse() ===
    ~ temp roll = RANDOM(1, ${sortedStates.length})
    { roll:
`;

    sortedStates.forEach((state, i) => {
        const percent = (state.probability * 100).toFixed(1);
        ink += `        - ${i + 1}: // State |${state.bitstring}> (Probability: ${percent}%)\n`;
        ink += `            ~ current_quantum_state = "${state.bitstring}"\n`;
        for (let b = 0; b < numQubits; b++) {
            const isOne = state.bitstring[b] === '1';
            ink += `            ~ ${qubitVarMap[b].varName} = ${isOne ? 'true' : 'false'}\n`;
        }
    });

    ink += `    }\n\n`;

    // 3. Main Story Entrypoint Knot
    ink += `// --- Main Story Entrypoint ---
=== start ===
~ sample_quantum_multiverse()
The fabric of the multiverse crystallizes into Timeline State |{current_quantum_state}>.
-> ${qubitVarMap[0].knotName}

`;

    // 4. Story Knots with Conditional Weaves
    qubitVarMap.forEach((q, idx) => {
        const isLast = idx === qubitVarMap.length - 1;
        const nextKnot = isLast ? 'multiverse_resolution' : qubitVarMap[idx + 1].knotName;

        // Entanglements mentioning this beat
        const relatedConns = connections.filter(c => c.control === idx || c.target === idx);

        ink += `=== ${q.knotName} ===
// Story Beat: ${q.name}`;
        if (relatedConns.length > 0) {
            const connNotes = relatedConns.map(c => {
                const partnerIdx = c.control === idx ? c.target : c.control;
                const partnerName = qubits[partnerIdx]?.name || `q${partnerIdx}`;
                return `${c.parity === 'odd' ? 'Odd Parity (Conflict)' : 'Even Parity (Co-occur)'} with ${partnerName}`;
            }).join(', ');
            ink += ` [Entangled: ${connNotes}]`;
        }
        ink += `
{ ${q.varName}:
    // Scenario 1 (|1>)
    ${q.active}
- else:
    // Scenario 2 (|0>)
    ${q.passive}
}

-> ${nextKnot}

`;
    });

    // 5. Multiverse Resolution Knot
    ink += `=== multiverse_resolution ===
The timeline reaches stability.
All quantum constraints and entangled commitments have been consistently fulfilled.

+ [Sample Another Parallel Multiverse Branch]
    -> start
+ [Conclude Chronicle]
    The multiverse narrative stands resolved.
    -> END
`;

    return ink;
}

export function downloadInkFile(qubits, connections, simulator) {
    const content = generateInkScript(qubits, connections, simulator);
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `narrative_multiverse_${Date.now()}.ink`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
