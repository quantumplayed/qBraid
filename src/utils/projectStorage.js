/**
 * projectStorage.js
 * Utilities for saving, loading, importing, and exporting Narrative Entangler projects.
 */

export const DEMO_STORIES = [
    {
        id: 'hero_dragon',
        title: '🐉 The Hero & The Dragon (Tutorial Quest)',
        description: 'A classic tale of courage: if the Hero ventures forth, the Dragon is repelled; if the Hero stays, the village falls.',
        beatsCount: 2,
        qubits: [
            {
                id: 'q0',
                name: 'The Hero',
                active: 'Goes on the perilous mountain adventure',
                passive: 'Stays in the safe comfort of home',
                gates: [{ id: 'g0', type: 'Ry', theta: Math.PI / 2, position: 0.25 }]
            },
            {
                id: 'q1',
                name: 'The Dragon',
                active: 'Flees across the burning horizon',
                passive: 'Destroys the defenseless village',
                gates: []
            }
        ],
        connections: [
            { id: 'c0', type: 'CNOT', control: 0, target: 1, position: 0.55, parity: 'even' }
        ]
    },
    {
        id: 'triad',
        title: '🎭 Triad of Fate (Alliance & Rivalry)',
        description: 'Co-occurrence and mutual exclusion in harmony: The Hero is bound to the Ally, but in strict zero-sum conflict with the Nemesis.',
        beatsCount: 3,
        qubits: [
            {
                id: 'q0',
                name: 'The Hero',
                active: 'Breaches the dark citadel gates',
                passive: 'Retreats to the valley to regroup',
                gates: [{ id: 'g0', type: 'Ry', theta: Math.PI / 2, position: 0.2 }]
            },
            {
                id: 'q1',
                name: 'The Ally',
                active: 'Provides covering fire from the ramparts',
                passive: 'Falls back to perimeter defense',
                gates: []
            },
            {
                id: 'q2',
                name: 'The Nemesis',
                active: 'Overruns the ancient stronghold',
                passive: 'Is cast into the shadow abyss',
                gates: []
            }
        ],
        connections: [
            { id: 'c0', type: 'CNOT', control: 0, target: 1, position: 0.45, parity: 'even' },
            { id: 'c1', type: 'CNOT', control: 0, target: 2, position: 0.7, parity: 'odd' }
        ]
    },
    {
        id: 'heist_intrigue',
        title: '💎 The Midnight Heist (Cyberpunk Spire)',
        description: 'A four-character infiltration where the Hacker and Infiltrator succeed together, but the Security AI and Smuggler compete for escape vectors.',
        beatsCount: 4,
        qubits: [
            {
                id: 'q0',
                name: 'The Infiltrator',
                active: 'Cracks the laser vault biometric lock',
                passive: 'Triggers the silent pressure alarm',
                gates: [{ id: 'g0', type: 'Ry', theta: Math.PI / 2, position: 0.2 }]
            },
            {
                id: 'q1',
                name: 'The Hacker',
                active: 'Disables building power grid and cameras',
                passive: 'Gets counter-hacked by defense matrix',
                gates: []
            },
            {
                id: 'q2',
                name: 'The Guard Captain',
                active: 'Intercepts the escape elevator',
                passive: 'Guards the decoy server wing',
                gates: []
            },
            {
                id: 'q3',
                name: 'The Getaway Pilot',
                active: 'Lands the hovercraft on rooftop extraction',
                passive: 'Evades local patrol drones off-site',
                gates: []
            }
        ],
        connections: [
            { id: 'c0', type: 'CNOT', control: 0, target: 1, position: 0.4, parity: 'even' },
            { id: 'c1', type: 'CNOT', control: 0, target: 2, position: 0.65, parity: 'odd' },
            { id: 'c2', type: 'CNOT', control: 1, target: 3, position: 0.8, parity: 'even' }
        ]
    },
    {
        id: 'epic_10',
        title: '🌌 10-Qubit Deep Multiverse (1024 Timelines)',
        description: 'Comprehensive 10-beat narrative branching universe with complex interconnected causal chains.',
        beatsCount: 10,
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
];

export function exportProjectToJson(qubits, connections, title = 'Multiverse Story') {
    const project = {
        app: 'Narrative Entangler',
        version: '2.0.0',
        exportedAt: new Date().toISOString(),
        title,
        qubits,
        connections,
    };
    return JSON.stringify(project, null, 2);
}

export function downloadProjectFile(qubits, connections, title = 'Multiverse Story') {
    const json = exportProjectToJson(qubits, connections, title);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
    link.href = url;
    link.download = `narrative_entangler_${safeTitle || 'project'}_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

export function parseProjectJson(jsonString) {
    try {
        const data = JSON.parse(jsonString);
        if (!Array.isArray(data.qubits) || !Array.isArray(data.connections)) {
            throw new Error('Invalid project file format: missing qubits or connections array.');
        }
        return {
            title: data.title || 'Loaded Story',
            qubits: data.qubits,
            connections: data.connections,
        };
    } catch (err) {
        throw new Error(`Failed to load story: ${err.message}`);
    }
}
