import React, { useState, useRef, useEffect } from 'react';

/**
 * TutorialGuide
 * Guided 9-step interactive tutorial teaching quantum narrative entanglement.
 * Features strict input gating, canvas beacon animations, AND/OR parity terminology,
 * color-coded positive (blue) and negative (orange) outcomes, and sidebar integration.
 */
export default function TutorialGuide({
  isOpen,
  onClose,
  currentStep,
  onStepChange,
  onApplyStepAction,
  onOpenStoryModal,
  onOpenSidebar,
  onCloseSidebar,
  isSidebarOpen,
  qubits = [],
  connections = [],
}) {
  if (!isOpen) return null;

  // Draggable position state
  const [position, setPosition] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef(null);
  const startDragRef = useRef({ mouseX: 0, mouseY: 0, startX: 0, startY: 0 });

  const handleMouseDown = (e) => {
    if (e.target.closest('button')) return;
    const cardElem = dragRef.current;
    if (!cardElem) return;

    const rect = cardElem.getBoundingClientRect();
    startDragRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startX: rect.left,
      startY: rect.top,
    };
    setIsDragging(true);
    e.preventDefault();
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      const deltaX = e.clientX - startDragRef.current.mouseX;
      const deltaY = e.clientY - startDragRef.current.mouseY;
      const newX = Math.max(10, Math.min(window.innerWidth - 440, startDragRef.current.startX + deltaX));
      const newY = Math.max(10, Math.min(window.innerHeight - 150, startDragRef.current.startY + deltaY));
      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // Sidebar triggers when stepping into Step 6 or Step 9
  useEffect(() => {
    if (currentStep === 6 && !isSidebarOpen) {
      onOpenSidebar?.();
    } else if (currentStep === 9 && !isSidebarOpen) {
      onOpenSidebar?.();
    }
  }, [currentStep, isSidebarOpen, onOpenSidebar]);

  // If entering step 7 with 3rd qubit added, ensure sword defaults are set
  useEffect(() => {
    if (currentStep === 7 && qubits.length >= 3) {
      const q2 = qubits[2];
      if (!q2.active || !q2.passive) {
        onApplyStepAction?.('SET_SWORD_DEFAULTS');
      }
    }
  }, [currentStep, qubits, onApplyStepAction]);

  // ── Step Completion Computations ──────────────────────────────────────────
  const isStep2Complete = Boolean(qubits[0]?.active && qubits[0]?.passive);
  const isStep3Complete = Boolean(qubits[1]?.active && qubits[1]?.passive);
  const isStep4Complete = (qubits[0]?.gates?.length || 0) >= 1;
  const isStep5Complete = connections.some(
    (c) => (c.control === 0 && c.target === 1) || (c.control === 1 && c.target === 0)
  );
  const isStep7Complete = qubits.length >= 3;
  const connTo3 = connections.find(
    (c) => (c.control === 0 && c.target === 2) || (c.control === 2 && c.target === 0)
  );
  const isStep8Complete = Boolean(connTo3 && connTo3.parity === 'odd');

  // Can the user advance from currentStep?
  let canAdvance = true;
  let advanceBlockReason = '';

  if (currentStep === 2 && !isStep2Complete) {
    canAdvance = false;
    advanceBlockReason = 'Enter beat text or click Auto-Fill to continue';
  } else if (currentStep === 3 && !isStep3Complete) {
    canAdvance = false;
    advanceBlockReason = 'Enter beat text or click Auto-Fill to continue';
  } else if (currentStep === 4 && !isStep4Complete) {
    canAdvance = false;
    advanceBlockReason = 'Click the beacon on Line 1 to place the Uncertainty gate';
  } else if (currentStep === 5 && !isStep5Complete) {
    canAdvance = false;
    advanceBlockReason = 'Drag from The Hero to The Dragon to entangle';
  } else if (currentStep === 7) {
    if (isSidebarOpen) {
      canAdvance = false;
      advanceBlockReason = 'Please close the side panel first (click ✕)';
    } else if (!isStep7Complete) {
      canAdvance = false;
      advanceBlockReason = 'Click "+ Add Story Worldline" on the canvas';
    }
  } else if (currentStep === 8 && !isStep8Complete) {
    canAdvance = false;
    if (!connTo3) {
      advanceBlockReason = 'Drag from The Hero to Worldline 3 to connect';
    } else {
      advanceBlockReason = 'Click the connection badge to toggle to OR';
    }
  }

  // ── 9 Tutorial Steps ──────────────────────────────────────────────────────
  const TUTORIAL_STEPS = [
    {
      step: 1,
      title: '1. The Multiverse Quest Begins',
      badge: 'Getting Started',
      description: (
        <div>
          Welcome to <strong className="text-slate-900">qBraid</strong>! We begin with two clean worldlines representing parallel narrative arcs in a story universe.
          <br /><br />
          In quantum narrative design, every beat branches into two fundamental paths: <span className="font-bold text-sky-600">Scenario 1</span> or <span className="font-bold text-amber-600">Scenario 2</span>.
          <br /><br />
          Right now, both worldlines are blank. Let's give them life!
        </div>
      ),
      actionLabel: null,
    },
    {
      step: 2,
      title: '2. Name Beat 1: The Hero',
      badge: 'Protagonist',
      description: (
        <div>
          Look at the animated highlight around the top worldline's start card.
          <br /><br />
          Click the card on the canvas to name your protagonist, or click the Auto-Fill button below:
          <div className="mt-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1">
            <div className="font-bold text-slate-800">Character: The Hero</div>
            <div>• <span className="font-bold text-sky-600">Scenario 1</span>: "Goes on adventure"</div>
            <div>• <span className="font-bold text-amber-600">Scenario 2</span>: "Stays at home"</div>
          </div>
        </div>
      ),
      actionLabel: '✨ Auto-Fill "The Hero"',
      actionType: 'SET_HERO_BEAT',
    },
    {
      step: 3,
      title: '3. Name Beat 2: The Dragon',
      badge: 'Antagonist',
      description: (
        <div>
          Now look at the animated highlight on the second worldline.
          <br /><br />
          Click the card on the canvas or click Auto-Fill to define the opposing force:
          <div className="mt-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1">
            <div className="font-bold text-slate-800">Character: The Dragon</div>
            <div>• <span className="font-bold text-sky-600">Scenario 1</span>: "Flees across the burning horizon"</div>
            <div>• <span className="font-bold text-amber-600">Scenario 2</span>: "Destroys the defenseless village"</div>
          </div>
        </div>
      ),
      actionLabel: '✨ Auto-Fill "The Dragon"',
      actionType: 'SET_DRAGON_BEAT',
    },
    {
      step: 4,
      title: '4. Injecting Dramatic Uncertainty',
      badge: 'Uncertainty Gate',
      description: (
        <div>
          A predetermined story lacks suspense. In quantum storytelling, we inject suspense using an <strong className="text-slate-900">Uncertainty gate</strong>.
          <br /><br />
          An Uncertainty gate creates a balanced 50/50 superposition: equal chances of <span className="font-bold text-sky-600">Scenario 1</span> or <span className="font-bold text-amber-600">Scenario 2</span>.
          <br /><br />
          👉 <strong className="text-sky-700">Click the pulsating target beacon on The Hero's line</strong> to place the Uncertainty gate!
          {isStep4Complete && (
            <div className="mt-2 p-2 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-semibold border border-emerald-200 flex items-center gap-1.5">
              <span>✓</span> Uncertainty gate placed! Click "Next" below.
            </div>
          )}
        </div>
      ),
      actionLabel: null,
    },
    {
      step: 5,
      title: '5. Story Consistency: The AND Connection',
      badge: 'Story Entanglement',
      description: (
        <div>
          Without narrative rules, independent chance causes plot holes (e.g. Hero triumphs, but village still burns).
          <br /><br />
          We demand narrative coherence:
          <div className="my-2 text-xs bg-slate-50 p-2 rounded border border-slate-200 space-y-1">
            <div>• If Hero ventures (<span className="font-bold text-sky-600">Scenario 1</span>), Dragon flees (<span className="font-bold text-sky-600">Scenario 1</span>).</div>
            <div>• If Hero stays (<span className="font-bold text-amber-600">Scenario 2</span>), Dragon attacks (<span className="font-bold text-amber-600">Scenario 2</span>).</div>
          </div>
          👉 Look at the guided arrow: <strong className="text-amber-700">Drag from the source point on The Hero down to The Dragon</strong> to link them with an <strong className="text-slate-900">AND</strong> connection!
          {isStep5Complete && (
            <div className="mt-2 p-2 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-semibold border border-emerald-200 flex items-center gap-1.5">
              <span>✓</span> Characters entangled with AND! Click "Next" below.
            </div>
          )}
        </div>
      ),
      actionLabel: null,
    },
    {
      step: 6,
      title: '6. Inspect the Multiverse in the Side Panel',
      badge: 'Possible Narratives',
      description: (
        <div>
          Notice the <strong className="text-slate-900">Possible Narratives</strong> side panel that opened on the right!
          <br /><br />
          Instead of 4 disconnected random combinations, the <strong className="text-slate-900">AND</strong> connection has pruned the multiverse down to <strong className="text-sky-700">2 consistent timelines</strong>:
          <div className="my-2 text-xs bg-slate-50 p-2 rounded border border-slate-200 space-y-1">
            <div><strong>Timeline #0:</strong> Both resolve into <span className="font-bold text-amber-600">Scenario 2</span> (50%).</div>
            <div><strong>Timeline #3:</strong> Both achieve <span className="font-bold text-sky-600">Scenario 1</span> (50%).</div>
          </div>
          💡 <em>Tip: For larger stories with many worldlines, the top "Generate Story" modal is also available for a full prose chronicle.</em>
        </div>
      ),
      actionLabel: isSidebarOpen ? null : '📖 Open Possible Narratives Panel',
      actionType: 'OPEN_SIDEBAR',
    },
    {
      step: 7,
      title: '7. Expanding the Tale: Add a 3rd Worldline',
      badge: 'Story Expansion',
      description: (
        <div>
          To see how quantum branching scales, let's add a third narrative arc: <strong className="text-slate-900">The Magic Sword</strong>.
          <br /><br />
          👉 <strong>Step 1:</strong> Close the side panel by clicking the <strong className="text-slate-800">✕</strong> button in its header.
          <br />
          👉 <strong>Step 2:</strong> Click the highlighted <strong className="text-sky-700">+ Add Story Worldline</strong> button at the bottom of the worldlines!
          {isStep7Complete && (
            <div className="mt-2 p-2 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-semibold border border-emerald-200 flex items-center gap-1.5">
              <span>✓</span> 3rd Worldline added and configured! Click "Next" below.
            </div>
          )}
        </div>
      ),
      actionLabel: isSidebarOpen ? '✕ Close Side Panel' : null,
      actionType: 'CLOSE_SIDEBAR',
    },
    {
      step: 8,
      title: '8. Connect the Sword with an OR Connection',
      badge: 'Mutual Exclusion',
      description: (
        <div>
          Let's connect The Hero to The Magic Sword. But this time, we want conflict and mutual exclusion!
          <br /><br />
          👉 <strong>Step 1:</strong> Drag from The Hero down to The Magic Sword.
          <br />
          👉 <strong>Step 2:</strong> Click the connection's badge to toggle it from <strong className="text-slate-800">AND</strong> to <strong className="text-amber-700">OR</strong>.
          <br /><br />
          An <strong className="text-slate-900">OR</strong> connection guarantees that when The Hero achieves <span className="font-bold text-sky-600">Scenario 1</span>, the Sword is in <span className="font-bold text-amber-600">Scenario 2</span>, creating meaningful dramatic trade-offs!
          {isStep8Complete && (
            <div className="mt-2 p-2 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-semibold border border-emerald-200 flex items-center gap-1.5">
              <span>✓</span> OR connection set! Click "Next" below.
            </div>
          )}
        </div>
      ),
      actionLabel: null,
    },
    {
      step: 9,
      title: '9. Unfolding Destiny & The Timeline Scrubber',
      badge: 'Multiverse Complete',
      description: (
        <div>
          The Possible Narratives side panel has reopened! Notice how the <strong className="text-slate-900">OR</strong> rule reshaped the 3-beat multiverse into coherent, mutually exclusive branches.
          <br /><br />
          Now look at the <strong className="text-slate-900">Timeline Scrubber</strong> at the very bottom of the canvas:
          <br />
          Dragging the scrubber from <strong className="text-slate-800">Start</strong> to <strong className="text-slate-800">End</strong> travels through narrative time. Notice how gates and connections take effect chronologically as the vertical laser line crosses them!
          <br /><br />
          🎉 <strong>Congratulations!</strong> You have mastered quantum narrative entangling.
        </div>
      ),
      actionLabel: null,
    },
  ];

  const activeStepData = TUTORIAL_STEPS[currentStep - 1] || TUTORIAL_STEPS[0];

  const handleActionClick = () => {
    if (activeStepData.actionType === 'OPEN_SIDEBAR') {
      onOpenSidebar?.();
    } else if (activeStepData.actionType === 'CLOSE_SIDEBAR') {
      onCloseSidebar?.();
    } else if (activeStepData.actionType) {
      onApplyStepAction?.(activeStepData.actionType);
    }
  };

  return (
    <div
      ref={dragRef}
      style={{
        position: 'fixed',
        ...(position
          ? { top: `${position.y}px`, left: `${position.x}px` }
          : { bottom: '24px', right: isSidebarOpen ? '410px' : '24px' }),
        width: '420px',
        maxWidth: 'calc(100vw - 48px)',
        background: '#ffffff',
        border: '1px solid #bfdbfe',
        borderRadius: '16px',
        boxShadow: isDragging
          ? '0 25px 50px -10px rgba(30, 58, 138, 0.35), 0 0 0 2px #3b82f6'
          : '0 20px 35px -8px rgba(30, 58, 138, 0.22), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        zIndex: 1200,
        overflow: 'hidden',
        animation: position ? 'none' : 'fadeInUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        userSelect: isDragging ? 'none' : 'auto',
        transition: isDragging ? 'box-shadow 0.15s ease' : 'box-shadow 0.2s ease, right 0.2s ease',
      }}
    >
      {/* Top progress bar */}
      <div style={{ height: '4px', background: '#e2e8f0', width: '100%' }}>
        <div
          style={{
            height: '100%',
            width: `${(currentStep / TUTORIAL_STEPS.length) * 100}%`,
            background: 'linear-gradient(90deg, #0284c7, #6366f1)',
            transition: 'width 0.3s ease',
          }}
        />
      </div>

      {/* Header (Draggable) */}
      <div
        onMouseDown={handleMouseDown}
        style={{
          padding: '0.85rem 1.25rem 0.75rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#f8fafc',
          borderBottom: '1px solid #f1f5f9',
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
        title="Click and drag to move this tutorial window anywhere on screen"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
              color: '#94a3b8',
              paddingRight: '2px',
            }}
          >
            <span style={{ fontSize: '10px', lineHeight: 1 }}>⠿</span>
          </div>
          <span style={{ fontSize: '1.25rem' }}>🎓</span>
          <div>
            <div
              style={{
                fontSize: '0.72rem',
                fontWeight: '700',
                textTransform: 'uppercase',
                color: '#0284c7',
                letterSpacing: '0.05em',
              }}
            >
              Interactive Tutorial • Step {currentStep} of {TUTORIAL_STEPS.length}
            </div>
            <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: '700', color: '#0f172a' }}>
              {activeStepData.title}
            </h4>
          </div>
        </div>

        <button
          onClick={onClose}
          title="Close Tutorial"
          style={{
            background: 'transparent',
            border: 'none',
            fontSize: '1.1rem',
            cursor: 'pointer',
            color: '#94a3b8',
            padding: '4px 6px',
            borderRadius: '6px',
          }}
        >
          ✕
        </button>
      </div>

      {/* Body */}
      <div style={{ padding: '1rem 1.25rem' }}>
        <div
          style={{
            display: 'inline-block',
            padding: '2px 8px',
            borderRadius: '6px',
            background: '#eff6ff',
            color: '#0369a1',
            fontSize: '0.72rem',
            fontWeight: '700',
            marginBottom: '0.6rem',
            border: '1px solid #bae6fd',
          }}
        >
          {activeStepData.badge}
        </div>

        <div
          style={{
            fontSize: '0.85rem',
            color: '#334155',
            lineHeight: 1.55,
            marginBottom: activeStepData.actionLabel ? '0.85rem' : '0.2rem',
          }}
        >
          {activeStepData.description}
        </div>

        {/* Quick action button (only when step has an action) */}
        {activeStepData.actionLabel && (
          <button
            onClick={handleActionClick}
            style={{
              width: '100%',
              padding: '0.6rem 1rem',
              borderRadius: '10px',
              border: 'none',
              background: 'linear-gradient(135deg, #0284c7, #2563eb)',
              color: '#ffffff',
              fontWeight: '600',
              fontSize: '0.84rem',
              cursor: 'pointer',
              boxShadow: '0 3px 8px rgba(2, 132, 199, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              transition: 'transform 0.1s ease',
            }}
            onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.98)')}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            {activeStepData.actionLabel}
          </button>
        )}
      </div>

      {/* Footer Navigation */}
      <div
        style={{
          padding: '0.75rem 1.25rem',
          background: '#f8fafc',
          borderTop: '1px solid #f1f5f9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <button
          disabled={currentStep === 1}
          onClick={() => onStepChange(Math.max(1, currentStep - 1))}
          style={{
            padding: '0.45rem 0.85rem',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            background: '#ffffff',
            color: currentStep === 1 ? '#cbd5e1' : '#475569',
            fontSize: '0.8rem',
            fontWeight: '600',
            cursor: currentStep === 1 ? 'not-allowed' : 'pointer',
          }}
        >
          ← Back
        </button>

        <div style={{ display: 'flex', gap: '4px' }}>
          {TUTORIAL_STEPS.map((_, idx) => (
            <div
              key={idx}
              onClick={() => onStepChange(idx + 1)}
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: idx + 1 === currentStep ? '#0284c7' : '#cbd5e1',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            />
          ))}
        </div>

        {currentStep < TUTORIAL_STEPS.length ? (
          <button
            disabled={!canAdvance}
            onClick={() => canAdvance && onStepChange(currentStep + 1)}
            title={canAdvance ? 'Advance to next step' : advanceBlockReason}
            style={{
              padding: '0.48rem 1rem',
              borderRadius: '8px',
              border: 'none',
              background: canAdvance
                ? 'linear-gradient(135deg, #16a34a, #15803d)'
                : '#94a3b8',
              color: '#ffffff',
              fontSize: '0.8rem',
              fontWeight: '700',
              cursor: canAdvance ? 'pointer' : 'not-allowed',
              boxShadow: canAdvance ? '0 2px 6px rgba(22, 163, 74, 0.3)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            Next →
          </button>
        ) : (
          <button
            onClick={onClose}
            style={{
              padding: '0.48rem 1.05rem',
              borderRadius: '8px',
              border: 'none',
              background: 'linear-gradient(135deg, #16a34a, #15803d)',
              color: '#ffffff',
              fontSize: '0.8rem',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(22, 163, 74, 0.3)',
            }}
          >
            ✓ Finish Tutorial
          </button>
        )}
      </div>
    </div>
  );
}
