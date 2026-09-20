import React from 'react';

export default function UnsavedChangesPrompt({
    isOpen,
    onCancel,
    onDiscard,
    onSaveAndProceed,
    actionName = 'load another story',
}) {
    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.55)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: '1rem',
            animation: 'fadeIn 0.15s ease-out',
        }}>
            <div style={{
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '16px',
                width: '100%',
                maxWidth: '480px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                overflow: 'hidden',
                padding: '1.5rem',
            }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.25rem' }}>
                    <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '12px',
                        background: '#fef3c7',
                        border: '1px solid #fde68a',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.4rem',
                        flexShrink: 0,
                    }}>
                        ⚠️
                    </div>
                    <div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0f172a', margin: '0 0 0.35rem 0' }}>
                            Unsaved Changes Detected
                        </h3>
                        <p style={{ fontSize: '0.86rem', color: '#64748b', margin: 0, lineHeight: 1.45 }}>
                            You have made changes to your quantum story universe that have not been saved. If you {actionName} now, your recent edits will be lost.
                        </p>
                    </div>
                </div>

                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.6rem',
                    marginTop: '1.5rem',
                }}>
                    <button
                        onClick={onSaveAndProceed}
                        style={{
                            width: '100%',
                            padding: '0.7rem 1rem',
                            borderRadius: '8px',
                            border: 'none',
                            background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
                            color: '#ffffff',
                            fontWeight: '600',
                            fontSize: '0.9rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)',
                        }}
                    >
                        💾 Save & Proceed
                    </button>

                    <div style={{ display: 'flex', gap: '0.6rem' }}>
                        <button
                            onClick={onDiscard}
                            style={{
                                flex: 1,
                                padding: '0.65rem 1rem',
                                borderRadius: '8px',
                                border: '1px solid #fca5a5',
                                background: '#fef2f2',
                                color: '#b91c1c',
                                fontWeight: '600',
                                fontSize: '0.85rem',
                                cursor: 'pointer',
                            }}
                        >
                            Discard Changes
                        </button>
                        <button
                            onClick={onCancel}
                            style={{
                                flex: 1,
                                padding: '0.65rem 1rem',
                                borderRadius: '8px',
                                border: '1px solid #cbd5e1',
                                background: '#ffffff',
                                color: '#475569',
                                fontWeight: '600',
                                fontSize: '0.85rem',
                                cursor: 'pointer',
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
