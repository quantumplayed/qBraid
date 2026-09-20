import {
    QuantumEntity,
    Operations,
    EntanglementEngine,
    JointQuantumSystem
} from '@quantumplayed/quantum-game-engine';

/**
 * QuantumSimulator
 * Powered by @quantumplayed/quantum-game-engine (v1.0.3).
 *
 * Utilizes:
 * - Second Quantization and sparse amplitude dictionaries
 * - Native QuDit capabilities (dimension d >= 2)
 * - EntanglementEngine for conditional Bell-pair interactions
 * - JointQuantumSystem for multi-entity tensor-product merging and measurement
 */
export class QuantumSimulator {
    constructor(numQubits = 10, defaultDimension = 2) {
        this.numQubits = numQubits;
        this.defaultDimension = defaultDimension;
        this.reset();
    }

    reset() {
        QuantumEntity.resetIdCounter();
        this.entities = Array.from(
            { length: this.numQubits },
            () => new QuantumEntity({ dimension: this.defaultDimension, initialState: 0 })
        );
        this._cachedJointSystem = null;
    }

    /**
     * Apply a quantum operation to one or more entities.
     * Supports H (Hadamard), Ry (Rotational bias), X (Bit flip), CNOT (Even or Odd parity).
     */
    applyGate(gateType, target, control = null, params = {}) {
        this._cachedJointSystem = null;
        const targetEntity = this.entities[target];
        if (!targetEntity) return;

        if (gateType === 'H') {
            // Uniform superposition
            targetEntity.apply(Operations.Hadamard());
        } else if (gateType === 'Ry') {
            const theta = params.theta || 0;
            const cosT = Math.cos(theta / 2);
            const sinT = Math.sin(theta / 2);

            // Ry rotation:
            // |0> -> cos(t/2)|0> + sin(t/2)|1>
            // |1> -> -sin(t/2)|0> + cos(t/2)|1>
            const trans = [
                { from: 0, to: 0, amplitude: { re: cosT, im: 0 } },
                { from: 0, to: 1, amplitude: { re: sinT, im: 0 } },
                { from: 1, to: 0, amplitude: { re: -sinT, im: 0 } },
                { from: 1, to: 1, amplitude: { re: cosT, im: 0 } }
            ];
            targetEntity.apply(Operations.SparseTransition(trans));
        } else if (gateType === 'X') {
            // Pauli-X / Shift by 1
            targetEntity.apply(Operations.Shift(1));
        } else if (gateType === 'CNOT') {
            const controlEntity = this.entities[control];
            if (!controlEntity) return;

            if (params.parity === 'odd') {
                // Odd Parity: If control is 0, flip target (mutual exclusion / conflict)
                EntanglementEngine.conditionalInteract({
                    controls: [controlEntity.is(0)],
                    targets: [{ entity: targetEntity, operation: Operations.Shift(1) }]
                });
            } else {
                // Even Parity: If control is 1, flip target (co-occurrence / sync)
                EntanglementEngine.conditionalInteract({
                    controls: [controlEntity.is(1)],
                    targets: [{ entity: targetEntity, operation: Operations.Shift(1) }]
                });
            }
        }
    }

    /**
     * Get marginal probabilities for an individual entity (qubit/qudit).
     * Computed natively by the game engine from its state or joint system.
     */
    getEntityProbabilities(index) {
        const entity = this.entities[index];
        return entity ? entity.getProbabilities() : { 0: 1 };
    }

    /**
     * Get reduced density matrix for decoherence / entanglement analysis.
     */
    getReducedDensityMatrix(index) {
        const entity = this.entities[index];
        return entity ? entity.getReducedDensityMatrix() : null;
    }

    /**
     * Merges the specified number of active entities into a JointQuantumSystem.
     */
    getJointSystem(activeCount = this.numQubits) {
        const activeEntities = this.entities.slice(0, activeCount);
        return JointQuantumSystem.merge(activeEntities);
    }

    /**
     * Returns full state vector probability array for the active space.
     * Filled sparsely from non-zero joint amplitudes.
     */
    getProbabilities(activeCount = this.numQubits) {
        const system = this.getJointSystem(activeCount);
        const totalStates = system.totalDimension;
        const probs = new Array(totalStates).fill(0);

        for (const [state, amp] of Object.entries(system.jointAmplitudes)) {
            const p = (amp.re ** 2 + amp.im ** 2);
            probs[Number(state)] = p;
        }
        return probs;
    }

    /**
     * Returns only non-zero probability states (sparse list),
     * avoiding iterating over 2^N elements for high qubit counts.
     */
    getSparseDistribution(activeCount = this.numQubits) {
        const system = this.getJointSystem(activeCount);
        const list = [];

        for (const [stateStr, amp] of Object.entries(system.jointAmplitudes)) {
            const state = Number(stateStr);
            const prob = (amp.re ** 2 + amp.im ** 2);
            if (prob > 1e-6) {
                const decomposed = system.decomposeState(state);
                list.push({
                    state,
                    decomposed,
                    bitstring: this.indexToBitstring(state, activeCount),
                    probability: prob
                });
            }
        }
        // Sort descending by probability
        list.sort((a, b) => b.probability - a.probability);
        return list;
    }

    /**
     * Collapses / samples an outcome index from the distribution.
     */
    measure(activeCount = this.numQubits) {
        const sparse = this.getSparseDistribution(activeCount);
        if (sparse.length === 0) return 0;

        const random = Math.random();
        let cumulative = 0;
        for (const item of sparse) {
            cumulative += item.probability;
            if (random <= cumulative) {
                return item.state;
            }
        }
        return sparse[sparse.length - 1].state;
    }

    indexToBitstring(index, length = this.numQubits) {
        return index.toString(2).padStart(length, '0');
    }

    /**
     * Sample a complete coherent multiverse timeline according to the wavefunction.
     * Maps each decomposed qudit/qubit value to the corresponding story beat.
     */
    sampleTimeline(qubits = []) {
        const n = qubits.length;
        const sparse = this.getSparseDistribution(n);
        if (sparse.length === 0) {
            return {
                index: 0,
                bitstring: this.indexToBitstring(0, n),
                probability: 1,
                beatOutcomes: []
            };
        }

        const random = Math.random();
        let cumulative = 0;
        let selected = sparse[0];

        for (const item of sparse) {
            cumulative += item.probability;
            if (random <= cumulative) {
                selected = item;
                break;
            }
        }

        const measuredIndex = selected.state;
        const probability = selected.probability;
        const bitstring = this.indexToBitstring(measuredIndex, n);
        const decomposed = selected.decomposed;

        const beatOutcomes = qubits.map((q, idx) => {
            const val = decomposed[idx] ?? ((measuredIndex >> idx) & 1);
            const isBit1 = val === 1;
            return {
                qubitId: q.id,
                name: q.name,
                bit: val,
                status: isBit1 ? 'active' : 'passive',
                text: isBit1 ? (q.active || 'Positive outcome') : (q.passive || 'Negative outcome'),
                rawQubit: q
            };
        });

        return {
            index: measuredIndex,
            bitstring,
            probability,
            beatOutcomes
        };
    }

    /**
     * Returns detailed state information including signed amplitudes, complex phases,
     * and a flag indicating if negative/destructive phase interference exists.
     */
    getDetailedState(activeCount = this.numQubits) {
        const system = this.getJointSystem(activeCount);
        const totalStates = system.totalDimension;
        const states = [];
        let hasPhaseInterference = false;

        for (let i = 0; i < totalStates; i++) {
            const amp = system.jointAmplitudes[i] || { re: 0, im: 0 };
            const re = amp.re || 0;
            const im = amp.im || 0;
            const prob = re * re + im * im;
            const mag = Math.sqrt(prob);
            const phaseRad = Math.atan2(im, re);
            const phaseDeg = Math.round((phaseRad * 180 / Math.PI + 360) % 360);
            const isNegative = re < -0.001;
            const hasPhase = Math.abs(phaseDeg) > 5 && Math.abs(phaseDeg - 360) > 5;
            if (prob > 0.001 && (isNegative || hasPhase)) {
                hasPhaseInterference = true;
            }

            states.push({
                index: i,
                bitstring: this.indexToBitstring(i, activeCount),
                probability: prob,
                percent: (prob * 100).toFixed(1),
                amplitudeRe: re,
                amplitudeIm: im,
                magnitude: mag,
                phaseDeg,
                phaseRad,
                sign: isNegative ? '-' : '+'
            });
        }

        const activeBranches = states.filter(s => s.probability > 0.0001);

        return {
            states,
            activeBranches,
            hasPhaseInterference,
            totalStates
        };
    }

    /**
     * Evaluates circuit up to a given time slice position (0.0 to 1.0).
     */
    getSliceState(allEvents = [], position = 1.0, activeCount = this.numQubits) {
        this.reset();
        const sorted = [...allEvents].sort((a, b) => a.position - b.position);
        const appliedEvents = sorted.filter(e => e.position <= position);

        for (const evt of appliedEvents) {
            this.applyGate(evt.type, evt.target, evt.control ?? null, evt.params || {});
        }

        const detailed = this.getDetailedState(activeCount);
        const marginals = {};
        for (let qi = 0; qi < activeCount; qi++) {
            marginals[qi] = this.getEntityProbabilities(qi);
        }

        return {
            ...detailed,
            position,
            appliedEvents,
            appliedEventCount: appliedEvents.length,
            totalEventCount: sorted.length,
            marginals
        };
    }
}

