import { QuantumSimulator } from './src/engine/QuantumSimulator.js';

console.log("--- Starting Quantum Simulator Verification ---");

// Test 1: Initial State
const sim = new QuantumSimulator(2);
console.log("\nTest 1: Initial State |00>");
const probs1 = sim.getProbabilities();
console.log("Probs:", probs1); // Should be [1, 0, 0, 0]

// Test 2: H / Ry(pi/2) on Q0 (Create 50/50 superposition)
console.log("\nTest 2: H Gate on Q0");
sim.applyGate('H', 0);
const probs2 = sim.getProbabilities();
console.log("Probs after H on Q0:", probs2);
// States: |00> (index 0) = 0.5, |01> (index 1) = 0.5

// Test 3: Even Parity CNOT (Control Q0, Target Q1) -> Bell pair Phi+
console.log("\nTest 3: Even Parity CNOT (Control=0, Target=1)");
sim.applyGate('CNOT', 1, 0, { parity: 'even' });
const probs3 = sim.getProbabilities();
console.log("Probs after Even CNOT (Phi+):", probs3);
// Expected: |00> (index 0) ~0.5, |11> (index 3) ~0.5. Zero for |01> and |10>.
if (Math.abs(probs3[0] - 0.5) < 1e-5 && Math.abs(probs3[3] - 0.5) < 1e-5 && probs3[1] < 1e-5 && probs3[2] < 1e-5) {
    console.log("✓ Even Parity Bell State PASSED: Beats ALWAYS occur together (00 or 11)");
} else {
    console.error("✗ Even Parity Bell State FAILED");
}

// Test 4: Odd Parity CNOT -> Bell pair Psi+
console.log("\nTest 4: Odd Parity CNOT (Control=0, Target=1)");
const simOdd = new QuantumSimulator(2);
simOdd.applyGate('H', 0);
simOdd.applyGate('CNOT', 1, 0, { parity: 'odd' });
const probsOdd = simOdd.getProbabilities();
console.log("Probs after Odd CNOT (Psi+):", probsOdd);
// Expected: |01> (index 1) ~0.5, |10> (index 2) ~0.5. Zero for |00> and |11>.
if (Math.abs(probsOdd[1] - 0.5) < 1e-5 && Math.abs(probsOdd[2] - 0.5) < 1e-5 && probsOdd[0] < 1e-5 && probsOdd[3] < 1e-5) {
    console.log("✓ Odd Parity Bell State PASSED: Beats NEVER occur together (01 or 10)");
} else {
    console.error("✗ Odd Parity Bell State FAILED");
}

// Test 5: 10-Qubit Scalability (1,024 states)
console.log("\nTest 5: 10-Qubit Circuit (1024 states)");
const sim10 = new QuantumSimulator(10);
sim10.applyGate('H', 0);
sim10.applyGate('CNOT', 1, 0, { parity: 'even' });
sim10.applyGate('CNOT', 2, 0, { parity: 'odd' });
const probs10 = sim10.getProbabilities();
console.log("10-qubit total state space:", probs10.length);
const timelineSample = sim10.sampleTimeline([
    { id: 'q0', name: 'Hero', active: 'Climbs mountain', passive: 'Stays low' },
    { id: 'q1', name: 'Guide', active: 'Guides willingly', passive: 'Hesitates' },
    { id: 'q2', name: 'Rival', active: 'Attacks', passive: 'Retreats' }
]);
console.log("Sampled timeline:", timelineSample.bitstring, "Probability:", timelineSample.probability);
console.log("Sampled beats:", timelineSample.beatOutcomes);

// Test 6: Triad of Fate (H on 0, Even CNOT on 1, Odd CNOT on 2)
console.log("\nTest 6: Triad of Fate (Mixed Even + Odd Parity)");
const simTriad = new QuantumSimulator(3);
simTriad.applyGate('H', 0);
simTriad.applyGate('CNOT', 1, 0, { parity: 'even' });
simTriad.applyGate('CNOT', 2, 0, { parity: 'odd' });
const probsTriad = simTriad.getProbabilities();
// When Q0=0: Q1=0 (even), Q2=1 (odd) -> |001> (state 1 in decimal)
// When Q0=1: Q1=1 (even), Q2=0 (odd) -> |110> (state 6 in decimal)
console.log("Prob state 1 (|001>):", probsTriad[1]);
console.log("Prob state 6 (|110>):", probsTriad[6]);
if (Math.abs(probsTriad[1] - 0.5) < 1e-5 && Math.abs(probsTriad[6] - 0.5) < 1e-5) {
    console.log("✓ Triad of Fate PASSED: Perfectly enforces co-occurrence and conflict simultaneously!");
} else {
    console.error("✗ Triad of Fate FAILED");
}

console.log("\n--- Verification Complete ---");
