import React, { useState, useRef, useEffect } from 'react';

export default function TutorialGuide({
    isOpen,
    onClose,
    currentStep,
    onStepChange,
    onApplyStepAction,
    onOpenStoryModal,
    onOpenSaveLoadModal,
}) {
    if (!isOpen) return null;

    // Draggable position state
    const [position, setPosition] = useState(null); // { x: number, y: number }
    const [isDragging, setIsDragging] = useState(false);
    const dragRef = useRef(null);
    const startDragRef = useRef({ mouseX: 0, mouseY: 0, startX: 0, startY: 0 });

    const handleMouseDown = (e) => {
        // Prevent dragging if clicking buttons or close icon
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

    const TUTORIAL_STEPS = [
        {
            step: 1,
            title: '1. Clean Slate: Two Worldlines',
            badge: 'Setup',
            description: `Welcome to qBraid! We begin with two clean qubit worldlines representing parallel narrative arcs. At $|0\\rangle$, both stories start in their neutral default states.`,
            actionLabel: '🧹 Initialize 2 Empty Worldlines',
            actionType: 'RESET_2_QUBITS',
        },
        {
            step: 2,
            title: '2. Name Beat 1: The Hero',
            badge: 'Story Arc',
            description: `Each worldline corresponds to a story beat with two outcomes: True ($|1\\rangle$) and False ($|0\\rangle$). Click the beginning of the top worldline (or click Auto-Apply) to name it "The Hero", with options "Goes on adventure" (active) vs "Stays at home" (passive).`,
            actionLabel: '✏️ Configure "The Hero" Beat',
            actionType: 'SET_HERO_BEAT',
        },
        {
            step: 3,
            title: '3. Name Beat 2: The Dragon',
            badge: 'Story Arc',
            description: `Now click the second worldline to define the opposing force: "The Dragon". Set its positive outcome to "Flees across the burning horizon" vs passive "Destroys the defenseless village".`,
            actionLabel: '🐉 Configure "The Dragon" Beat',
            actionType: 'SET_DRAGON_BEAT',
        },
        {
            step: 4,
            title: '4. Inject Uncertainty: The H Gate',
            badge: 'Superposition',
            description: `A predetermined story lacks tension. In quantum narrative design, we introduce dramatic uncertainty using a Hadamard (H) gate. Placing H on The Hero creates a 50/50 superposition: equal chances of embarking or staying safe.`,
            actionLabel: '🎲 Place H Gate on The Hero',
            actionType: 'ADD_H_GATE',
        },
        {
            step: 5,
            title: '5. Story Consistency: Parity CNOT',
            badge: 'Entanglement',
            description: `Without rules, independent randomness causes plot holes (e.g. Hero fights, but village still burns). We demand consistency: IF Hero goes on adventure $\\to$ Dragon flees; IF Hero stays home $\\to$ Dragon destroys village. We bind them with a CNOT gate in Even Parity!`,
            actionLabel: '🔗 Entangle Hero & Dragon (Even Parity)',
            actionType: 'ADD_CNOT',
        },
        {
            step: 6,
            title: '6. Inspect the Consistent Multiverse',
            badge: 'Story Modal',
            description: `Behold quantum narrative coherence! Out of 4 theoretical states, only 2 valid storylines survive with 50% probability each. Click below to inspect and sample full stories in the Story Generator modal.`,
            actionLabel: '📖 Open Story Generator Modal',
            actionType: 'OPEN_STORY_MODAL',
        },
        {
            step: 7,
            title: '7. Expanding the Tale: The Magic Sword',
            badge: '3rd Beat Co-creation',
            description: `Let's enrich the legend with a 3rd beat: "The Magic Sword" (Active: "Hero draws the radiant Sunblade" vs Passive: "Blade remains trapped in stone"). We add this worldline and entangle it with the Hero's resolve!`,
            actionLabel: '⚔️ Add 3rd Beat: "The Magic Sword"',
            actionType: 'ADD_MAGIC_SWORD',
        },
        {
            step: 8,
            title: '8. Save Universe & Explore Demos',
            badge: 'Save & Load',
            description: `Your custom multiverse is complete! You can now export your story to JSON to share with game engines (like Ink/Inky). If you ever load a new universe without saving, our safety prompt protects your progress!`,
            actionLabel: '💾 Open Save & Load Hub',
            actionType: 'OPEN_SAVE_LOAD',
        }
    ];

    const activeStepData = TUTORIAL_STEPS[currentStep - 1] || TUTORIAL_STEPS[0];

    const handleActionClick = () => {
        if (activeStepData.actionType === 'OPEN_STORY_MODAL') {
            onOpenStoryModal();
        } else if (activeStepData.actionType === 'OPEN_SAVE_LOAD') {
            onOpenSaveLoadModal();
        } else {
            onApplyStepAction(activeStepData.actionType);
        }
    };

    return (
        <div
            ref={dragRef}
            style={{
                position: 'fixed',
                ...(position
                    ? { top: `${position.y}px`, left: `${position.x}px` }
                    : { bottom: '24px', right: '24px' }),
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
                transition: isDragging ? 'box-shadow 0.15s ease' : 'box-shadow 0.2s ease',
            }}
        >
            {/* Top progress bar */}
            <div style={{ height: '4px', background: '#e2e8f0', width: '100%' }}>
                <div style={{
                    height: '100%',
                    width: `${(currentStep / TUTORIAL_STEPS.length) * 100}%`,
                    background: 'linear-gradient(90deg, #3b82f6, #6366f1)',
                    transition: 'width 0.3s ease',
                }} />
            </div>

            {/* Header (Draggable) */}
            <div
                onMouseDown={handleMouseDown}
                style={{
                    padding: '0.9rem 1.25rem 0.75rem 1.25rem',
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
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px',
                        color: '#94a3b8',
                        paddingRight: '2px',
                    }}>
                        <span style={{ fontSize: '10px', lineHeight: 1 }}>⠿</span>
                    </div>
                    <span style={{ fontSize: '1.25rem' }}>🎓</span>
                    <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#2563eb', letterSpacing: '0.05em' }}>
                            Interactive Tutorial • Step {currentStep} of {TUTORIAL_STEPS.length}
                        </div>
                        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700', color: '#0f172a' }}>
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
            <div style={{ padding: '1.1rem 1.25rem' }}>
                <div style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    background: '#eff6ff',
                    color: '#1e40af',
                    fontSize: '0.72rem',
                    fontWeight: '700',
                    marginBottom: '0.6rem',
                }}>
                    {activeStepData.badge}
                </div>

                <p style={{
                    fontSize: '0.86rem',
                    color: '#334155',
                    lineHeight: 1.5,
                    margin: '0 0 1rem 0',
                }}>
                    {activeStepData.description}
                </p>

                {/* Quick action button */}
                <button
                    onClick={handleActionClick}
                    style={{
                        width: '100%',
                        padding: '0.65rem 1rem',
                        borderRadius: '10px',
                        border: 'none',
                        background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
                        color: '#ffffff',
                        fontWeight: '600',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        boxShadow: '0 3px 8px rgba(37, 99, 235, 0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.4rem',
                        transition: 'transform 0.1s ease',
                    }}
                    onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
                    onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                    {activeStepData.actionLabel}
                </button>
            </div>

            {/* Footer Navigation */}
            <div style={{
                padding: '0.75rem 1.25rem',
                background: '#f8fafc',
                borderTop: '1px solid #f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
            }}>
                <button
                    disabled={currentStep === 1}
                    onClick={() => onStepChange(Math.max(1, currentStep - 1))}
                    style={{
                        padding: '0.45rem 0.85rem',
                        borderRadius: '6px',
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
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: (idx + 1) === currentStep ? '#2563eb' : '#cbd5e1',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                            }}
                        />
                    ))}
                </div>

                {currentStep < TUTORIAL_STEPS.length ? (
                    <button
                        onClick={() => onStepChange(currentStep + 1)}
                        style={{
                            padding: '0.45rem 0.95rem',
                            borderRadius: '6px',
                            border: 'none',
                            background: '#0f172a',
                            color: '#ffffff',
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                        }}
                    >
                        Next →
                    </button>
                ) : (
                    <button
                        onClick={onClose}
                        style={{
                            padding: '0.45rem 0.95rem',
                            borderRadius: '6px',
                            border: 'none',
                            background: '#16a34a',
                            color: '#ffffff',
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                        }}
                    >
                        ✓ Finish
                    </button>
                )}
            </div>
        </div>
    );
}
