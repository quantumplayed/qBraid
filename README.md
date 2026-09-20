# 🌌 Narrative Entangler 2.0

> **Consistent Multiverse Story Engine powered by Quantum Mechanics**

**Narrative Entangler** is a quantum narrative design tool built for creative writers, game designers, and interactive fiction studios. By modeling narrative beats as quantum entities, it guarantees **narrative consistency** across massive multiverse branching spaces ($2^N$ timelines; e.g. 10 qubits = 1,024 stories) through superposition, unitary constraints, and Bell-pair entanglement.

Backed by [`@quantumplayed/quantum-game-engine`](https://www.npmjs.com/package/@quantumplayed/quantum-game-engine), the engine leverages sparse amplitude dictionaries and native qudit capabilities to model complex story logic with zero state explosion.

---

## 🌟 Key Features

### 1. Uncertainty Gates (Adjustable Hadamard $H$)
- **50/50 Default Superposition**: Single-clicking on any worldline places an $H$ gate ($R_y(\pi/2)$), establishing a balanced 50% positive / 50% negative outcome probability.
- **Fine-Grained Bias**: Clicking any gate diamond opens an interactive slider overlay to adjust the branching probability from 0% (deterministic passive) to 100% (deterministic active), with quick presets (`50/50 H`, `75/25`, `25/75`).
- **Live Canvas Badges**: Gate diamonds dynamically display `H` when balanced or `H(X%)` when biased.

### 2. Entangled Storylines (Even & Odd Parity Bell Pairs)
- **Even Parity Bell Pairs ($\Phi^+$)**:
  - Dragging from line to line creates an entanglement connection.
  - Enforces **co-occurrence**: the two beats **always** occur together (both succeed or both fail: $|00\rangle$ or $|11\rangle$).
  - Visualized with a cyan/purple `= EVEN PARITY` badge.
- **Odd Parity Bell Pairs ($\Psi^+$)**:
  - Enforces **mutual exclusion / conflict**: the two beats **never** occur together (zero-sum rivalry: $|01\rangle$ or $|10\rangle$).
  - Visualized with an amber/rose `≠ ODD PARITY` badge.
- **Interactive Parity Toggling**: Clicking the parity badge directly on the canvas flips between Even and Odd parity with real-time wavefunction updates.

### 3. Multiverse Story Generator
- **Dedicated Generation Modal**: Click **✨ Generate Story** in the top bar to open the multiverse chronicle generator.
- **Quantum Waveform Collapse**: Samples an outcome from the probability distribution with an animated dice roll.
- **Synthesized Narrative Prose**: Weaves active and passive events into a coherent story passage.
- **Beat-by-Beat Breakdown**: Details character outcomes alongside entanglement notes (e.g. `= Even Bell Pair with The Hero`).
- **Multiverse Browser**: Displays all physically valid timelines; clicking any state previews that alternate reality instantly.
- **One-Click Export**: Copy the formatted chronicle to your clipboard.

### 4. Quantum State Distribution Modal
- **Dedicated Analytical View**: Click **📊 State Distribution** to inspect the full probability landscape.
- **Sparse Amplitude Analytics**: Shows probability bars, amplitudes, and narrative state tags for each state.
- **Filter Modes**: Toggle between "Non-Zero Only" (coherent outcomes) and "Full Hilbert Space" ($2^N$ states).
- **Direct Preview**: Launch straight into the Story Generator for any non-zero state.

### 5. Story Beats & Character Manager
- Click **📖 Story Beats** to open the beat manager modal.
- Add and delete worldlines (supports up to 10 qubits / 1,024 stories).
- Customize Character Names, Positive Outcomes ($|1\rangle$), and Negative Outcomes ($|0\rangle$).
- Includes quick character presets (The Scout, The Artifact, The Betrayer, The Storm, The AI Oracle).
- Clicking any worldline's glowing start dot opens a quick-edit dialog.

### 6. Save, Load & Demo Story Hub
- **Export Universe to JSON**: Download the current universe as a portable JSON file or copy it straight to your clipboard.
- **Import / Drag & Drop**: Drop or paste any project JSON to instantly restore timelines.
- **Curated Demo Stories**:
  - *The Hero & The Dragon* (Tutorial Quest)
  - *Triad of Fate* (Alliance & Conflict)
  - *The Midnight Heist* (4-Qubit Cyberpunk Spire)
  - *10-Qubit Deep Multiverse* (1,024 Parallel Universes)
- **Unsaved Changes Progress Guard**: Automatically warns the user with a confirmation dialog before loading a story or navigating away if there are unsaved modifications.

### 7. Interactive 8-Step Tutorial ("The Hero & The Dragon")
- An in-app floating interactive guide taking creators from a blank canvas to an entangled narrative multiverse:
  1. *Clean Slate*: 2 empty qubit worldlines.
  2. *Story Arc 1*: Configure "The Hero" (adventure vs home).
  3. *Story Arc 2*: Configure "The Dragon" (flees vs burns village).
  4. *Uncertainty*: Apply Hadamard ($H$) gate on the Hero for 50/50 branching.
  5. *Consistency*: Entangle Hero & Dragon with an Even Parity CNOT.
  6. *Multiverse Collapse*: Inspect the 2 coherent timelines in the Story Generator.
  7. *Deepening Narrative*: Co-create a 3rd beat ("The Magic Sword").
  8. *Preservation*: Save the project and explore demo stories.

### 8. Game Engine Integration (Ink / Inky) & Quantum Hardware
- **Direct `.ink` Export**: One-click export that generates complete, ready-to-run Ink files with knot branches, diversion choices, and parity weave assertions.
- **Live QPU Backend Selector**: Configure live execution against real hardware backends, starting with **Quantum Inspire** (TU Delft QX emulator & Starmon-5 transmon QPU).

### 9. Native QuDit Architecture
- Built on `@quantumplayed/quantum-game-engine`, where every entity possesses a generalized `dimension` ($d \ge 2$).
- Qubits ($d=2$) map to binary active/passive branches; the architecture naturally extends to $d$-ary qudits (e.g. 3-state qutrits for Win / Draw / Loss).

---

## 🚀 Built-in Presets

Quickly explore pre-configured causal structures via the top-bar dropdown:

1. **🤝 Even Parity (Co-occur)**: Hero & Guide entangled in a $\Phi^+$ Bell pair—both scale the peak, or both stay in the valley.
2. **⚔️ Odd Parity (Conflict)**: Protagonist & Rival entangled in a $\Psi^+$ Bell pair—only one can claim the throne.
3. **🎭 Triad of Fate**: Three-character system combining Even and Odd parity links simultaneously.
4. **🌌 10-Qubit Deep Multiverse**: Full 10-beat narrative branching space exploring 1,024 parallel timelines.

---

## 🛠️ Tech Stack & Architecture

- **Quantum Backend**: [`@quantumplayed/quantum-game-engine`](https://www.npmjs.com/package/@quantumplayed/quantum-game-engine) (v1.0.3)
  - Second quantization & sparse amplitude dictionaries
  - $O(1)$ marginal probability queries via `entity.getProbabilities()`
  - Unitary tensor product merging via `JointQuantumSystem.merge`
- **Frontend / UI**: React 19, Vite, Tailwind CSS
- **Visualizer Engine**: Pixi.js (HTML5 WebGL/WebGPU Canvas)
- **Typography**: Inter, Outfit, JetBrains Mono

---

## 💻 Getting Started

### Installation
```bash
npm install
```

### Run Local Dev Server
```bash
npm run dev
```
Open [http://localhost:5173/](http://localhost:5173/) (or the port specified by Vite) in your browser.

### Run Automated Quantum Engine Tests
```bash
node test_sim.mjs
```
Verifies initial states, 50/50 Hadamard superpositions, Even/Odd Bell pairs, Triad of Fate mixed parity, and 10-qubit circuit simulation.

### Production Build
```bash
npm run build
```

---

## 📄 License

Proprietary / MIT - Created by Evert van Nieuwenburg ([@quantumplayed](https://www.npmjs.com/package/@quantumplayed/quantum-game-engine)).
