/**
 * Example Stories for Narrative Entangler
 * Progressive examples showing increasing complexity of narrative branching
 */

export const EXAMPLE_STORIES = {
  fork_in_road: {
    id: 'fork_in_road',
    title: '🛤️ The Fork in the Road',
    description: 'A simple story with two characters whose fates are linked. Perfect introduction to entanglement.',
    complexity: 1,
    qubits: [
      {
        id: 'q0',
        name: 'The Traveler',
        active: 'Takes the mountain pass',
        passive: 'Takes the valley road',
        probability: 0.5
      },
      {
        id: 'q1',
        name: 'The Companion',
        active: 'Joins the journey',
        passive: 'Stays behind',
        probability: 0.35
      }
    ],
    gates: [
      {
        id: 'gate1',
        type: 'CNOT',
        control: 0,
        target: 1,
        slot: 2,
        params: {}
      }
    ],
    narrative: {
      title: 'A Traveler\'s Choice',
      summary: 'When the Traveler chooses a path, their Companion must follow. Their destinies are entangled—one cannot act without affecting the other.'
    }
  },

  three_paths: {
    id: 'three_paths',
    title: '⚔️ Three Paths Diverge',
    description: 'Three characters with interconnected choices. Shows probability distribution and multiple outcomes.',
    complexity: 2,
    qubits: [
      {
        id: 'q0',
        name: 'The Hero',
        active: 'Accepts the quest',
        passive: 'Declines the quest',
        probability: 0.6
      },
      {
        id: 'q1',
        name: 'The Mentor',
        active: 'Provides guidance',
        passive: 'Stays silent',
        probability: 0.5
      },
      {
        id: 'q2',
        name: 'The Enemy',
        active: 'Intervenes',
        passive: 'Allows it',
        probability: 0.5
      }
    ],
    gates: [
      {
        id: 'gate1',
        type: 'H',
        target: 0,
        slot: 1,
        params: {}
      },
      {
        id: 'gate2',
        type: 'CNOT',
        control: 0,
        target: 1,
        slot: 2,
        params: {}
      },
      {
        id: 'gate3',
        type: 'CNOT',
        control: 0,
        target: 2,
        slot: 3,
        params: {}
      }
    ],
    narrative: {
      title: 'Quest of Entanglement',
      summary: 'The Hero faces a crucial decision. Their choice ripples through fate, determining whether the Mentor intervenes and how the Enemy responds. All three characters\' futures are interconnected.'
    }
  },

  web_of_fate: {
    id: 'web_of_fate',
    title: '🕸️ The Web of Fate',
    description: 'Four characters in a complex web of causality. Shows real-world narrative complexity with rich probability landscape.',
    complexity: 3,
    qubits: [
      {
        id: 'q0',
        name: 'The Protagonist',
        active: 'Embraces destiny',
        passive: 'Resists fate',
        probability: 0.5
      },
      {
        id: 'q1',
        name: 'The Ally',
        active: 'Offers support',
        passive: 'Withdraws help',
        probability: 0.6
      },
      {
        id: 'q2',
        name: 'The Antagonist',
        active: 'Opposes openly',
        passive: 'Works in shadow',
        probability: 0.65
      },
      {
        id: 'q3',
        name: 'The Fate-Weaver',
        active: 'Guides the story',
        passive: 'Observes silently',
        probability: 0.4
      }
    ],
    gates: [
      {
        id: 'gate1',
        type: 'H',
        target: 0,
        slot: 1,
        params: {}
      },
      {
        id: 'gate2',
        type: 'Ry',
        target: 1,
        slot: 2,
        params: { theta: Math.PI / 4 }
      },
      {
        id: 'gate3',
        type: 'CNOT',
        control: 0,
        target: 1,
        slot: 3,
        params: {}
      },
      {
        id: 'gate4',
        type: 'CNOT',
        control: 0,
        target: 2,
        slot: 4,
        params: {}
      },
      {
        id: 'gate5',
        type: 'CNOT',
        control: 1,
        target: 3,
        slot: 5,
        params: {}
      },
      {
        id: 'gate6',
        type: 'CNOT',
        control: 2,
        target: 3,
        slot: 6,
        params: {}
      }
    ],
    narrative: {
      title: 'The Tapestry Unweaves',
      summary: 'Four forces collide in an intricate dance. The Protagonist\'s choices affect the Ally\'s support. The Antagonist\'s actions ripple through everyone. And the Fate-Weaver watches all—influenced by multiple threads. This is a complex narrative with 16 possible outcomes.'
    }
  }
};

/**
 * Helper to get example by ID
 */
export const getExampleStory = (exampleId) => {
  return EXAMPLE_STORIES[exampleId];
};

/**
 * Helper to get all example stories (for list display)
 */
export const getAllExampleStories = () => {
  return Object.values(EXAMPLE_STORIES);
};

/**
 * Helper to convert example to app state format
 */
export const loadExampleToState = (exampleId) => {
  const example = getExampleStory(exampleId);
  if (!example) return null;
  
  return {
    qubits: example.qubits,
    gates: example.gates.map(gate => ({
      ...gate,
      id: gate.id || crypto.randomUUID()
    }))
  };
};
