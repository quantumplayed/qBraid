import React, { useState, useRef } from 'react';
import { exportProjectToJson, downloadProjectFile, parseProjectJson, DEMO_STORIES } from '../utils/projectStorage';

export default function SaveLoadModal({
    isOpen,
    onClose,
    qubits,
    connections,
    onLoadProject,
    isDirty,
    onTriggerUnsavedPrompt,
}) {
    const [activeTab, setActiveTab] = useState('save'); // 'save' | 'load' | 'demos'
    const [projectTitle, setProjectTitle] = useState('My Multiverse Story');
    const [copied, setCopied] = useState(false);
    const [pastedJson, setPastedJson] = useState('');
    const [importError, setImportError] = useState(null);
    const [selectedDemoId, setSelectedDemoId] = useState(null);
    const fileInputRef = useRef(null);

    if (!isOpen) return null;

    const currentJson = exportProjectToJson(qubits, connections, projectTitle);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(currentJson);
            setCopied(true);
            setTimeout(() => setCopied(false), 2200);
        } catch (e) {
            console.error('Failed to copy', e);
        }
    };

    const handleDownload = () => {
        downloadProjectFile(qubits, connections, projectTitle);
    };

    const executeLoad = (projectData) => {
        onLoadProject(projectData);
        onClose();
    };

    const requestLoadWithGuard = (projectData) => {
        if (isDirty && onTriggerUnsavedPrompt) {
            onTriggerUnsavedPrompt(() => executeLoad(projectData));
        } else {
            executeLoad(projectData);
        }
    };

    const handleFileUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImportError(null);
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const parsed = parseProjectJson(evt.target.result);
                requestLoadWithGuard(parsed);
            } catch (err) {
                setImportError(err.message);
            }
        };
        reader.onerror = () => {
            setImportError('Failed to read the selected file.');
        };
        reader.readAsText(file);
    };

    const handlePasteLoad = () => {
        setImportError(null);
        if (!pastedJson.trim()) {
            setImportError('Please paste valid JSON project text.');
            return;
        }
        try {
            const parsed = parseProjectJson(pastedJson);
            requestLoadWithGuard(parsed);
        } catch (err) {
            setImportError(err.message);
        }
    };

    const handleDemoLoad = (demo) => {
        requestLoadWithGuard({
            title: demo.title,
            qubits: JSON.parse(JSON.stringify(demo.qubits)),
            connections: JSON.parse(JSON.stringify(demo.connections)),
        });
    };

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1500,
            padding: '1rem',
            animation: 'fadeIn 0.15s ease-out',
        }}>
            <div style={{
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '16px',
                width: '100%',
                maxWidth: '720px',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.18)',
                overflow: 'hidden',
            }}>
                {/* Header */}
                <div style={{
                    padding: '1.25rem 1.5rem',
                    borderBottom: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: '#f8fafc',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '10px',
                            background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.2rem',
                            boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.25)',
                        }}>
                            💾
                        </div>
                        <div>
                            <h2 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                                Save & Load Stories
                            </h2>
                            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>
                                Export timelines, restore past universes, or explore curated story templates
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            fontSize: '1.25rem',
                            cursor: 'pointer',
                            color: '#94a3b8',
                            padding: '4px 8px',
                            borderRadius: '6px',
                        }}
                    >
                        ✕
                    </button>
                </div>

                {/* Navigation Tabs */}
                <div style={{
                    display: 'flex',
                    borderBottom: '1px solid #e2e8f0',
                    background: '#f1f5f9',
                    padding: '0 1rem',
                    gap: '0.5rem',
                }}>
                    {[
                        { id: 'save', label: '💾 Save & Export' },
                        { id: 'load', label: '📂 Load / Import File' },
                        { id: 'demos', label: '✨ Demo Stories' },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => { setActiveTab(tab.id); setImportError(null); }}
                            style={{
                                padding: '0.75rem 1.2rem',
                                border: 'none',
                                background: 'transparent',
                                borderBottom: activeTab === tab.id ? '3px solid #3b82f6' : '3px solid transparent',
                                color: activeTab === tab.id ? '#1e40af' : '#64748b',
                                fontWeight: activeTab === tab.id ? '700' : '500',
                                fontSize: '0.88rem',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                            }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
                    {/* TAB 1: SAVE */}
                    {activeTab === 'save' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.4rem' }}>
                                    Story Universe Title
                                </label>
                                <input
                                    type="text"
                                    value={projectTitle}
                                    onChange={(e) => setProjectTitle(e.target.value)}
                                    placeholder="e.g. The Hero and The Dragon Multiverse"
                                    style={{
                                        width: '100%',
                                        padding: '0.65rem 0.85rem',
                                        borderRadius: '8px',
                                        border: '1px solid #cbd5e1',
                                        fontSize: '0.9rem',
                                        color: '#0f172a',
                                        outline: 'none',
                                        boxSizing: 'border-box',
                                    }}
                                />
                            </div>

                            <div style={{
                                background: '#f8fafc',
                                border: '1px solid #e2e8f0',
                                borderRadius: '10px',
                                padding: '1rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '1rem',
                            }}>
                                <div>
                                    <div style={{ fontWeight: '600', color: '#0f172a', fontSize: '0.9rem' }}>
                                        Current Universe Summary
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.2rem' }}>
                                        {qubits.length} Story Worldlines • {connections.length} Parity Bell Entanglements
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.6rem' }}>
                                    <button
                                        onClick={handleCopy}
                                        style={{
                                            padding: '0.6rem 1rem',
                                            borderRadius: '8px',
                                            border: '1px solid #cbd5e1',
                                            background: '#ffffff',
                                            color: '#334155',
                                            fontWeight: '600',
                                            fontSize: '0.85rem',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.4rem',
                                        }}
                                    >
                                        {copied ? '✓ Copied!' : '📋 Copy JSON'}
                                    </button>
                                    <button
                                        onClick={handleDownload}
                                        style={{
                                            padding: '0.6rem 1.1rem',
                                            borderRadius: '8px',
                                            border: 'none',
                                            background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
                                            color: '#ffffff',
                                            fontWeight: '600',
                                            fontSize: '0.85rem',
                                            cursor: 'pointer',
                                            boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.4rem',
                                        }}
                                    >
                                        ⬇️ Download .json File
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#475569', marginBottom: '0.35rem' }}>
                                    Raw Project JSON (Snapshot)
                                </label>
                                <textarea
                                    readOnly
                                    value={currentJson}
                                    rows={8}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        borderRadius: '8px',
                                        border: '1px solid #e2e8f0',
                                        fontFamily: 'monospace',
                                        fontSize: '0.78rem',
                                        color: '#334155',
                                        background: '#f8fafc',
                                        boxSizing: 'border-box',
                                        resize: 'vertical',
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    {/* TAB 2: LOAD / IMPORT */}
                    {activeTab === 'load' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            {/* File Drag Drop or Upload */}
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                style={{
                                    border: '2px dashed #93c5fd',
                                    background: '#eff6ff',
                                    borderRadius: '12px',
                                    padding: '2rem 1.5rem',
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                }}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".json,application/json"
                                    onChange={handleFileUpload}
                                    style={{ display: 'none' }}
                                />
                                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📁</div>
                                <div style={{ fontWeight: '700', color: '#1e40af', fontSize: '1rem', marginBottom: '0.25rem' }}>
                                    Click to select a Narrative Entangler .json file
                                </div>
                                <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                                    or drag and drop your exported story file here
                                </div>
                            </div>

                            {/* Paste JSON */}
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.4rem' }}>
                                    Or Paste Project JSON Directly
                                </label>
                                <textarea
                                    value={pastedJson}
                                    onChange={(e) => setPastedJson(e.target.value)}
                                    placeholder='Paste exported JSON structure here: { "qubits": [...], "connections": [...] }'
                                    rows={5}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        borderRadius: '8px',
                                        border: '1px solid #cbd5e1',
                                        fontFamily: 'monospace',
                                        fontSize: '0.8rem',
                                        color: '#0f172a',
                                        boxSizing: 'border-box',
                                        outline: 'none',
                                    }}
                                />
                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                                    <button
                                        onClick={handlePasteLoad}
                                        disabled={!pastedJson.trim()}
                                        style={{
                                            padding: '0.6rem 1.2rem',
                                            borderRadius: '8px',
                                            border: 'none',
                                            background: pastedJson.trim() ? '#2563eb' : '#94a3b8',
                                            color: '#ffffff',
                                            fontWeight: '600',
                                            fontSize: '0.85rem',
                                            cursor: pastedJson.trim() ? 'pointer' : 'not-allowed',
                                            boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)',
                                        }}
                                    >
                                        📥 Parse & Load Story
                                    </button>
                                </div>
                            </div>

                            {importError && (
                                <div style={{
                                    padding: '0.75rem 1rem',
                                    borderRadius: '8px',
                                    background: '#fef2f2',
                                    border: '1px solid #fecaca',
                                    color: '#b91c1c',
                                    fontSize: '0.85rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                }}>
                                    <span>⚠️</span> {importError}
                                </div>
                            )}

                            {isDirty && (
                                <div style={{
                                    padding: '0.65rem 0.9rem',
                                    borderRadius: '8px',
                                    background: '#fffbeb',
                                    border: '1px solid #fde68a',
                                    color: '#92400e',
                                    fontSize: '0.8rem',
                                }}>
                                    ℹ️ You have unsaved changes in your current universe. Loading a story will prompt you to save or discard first.
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB 3: DEMO STORIES */}
                    {activeTab === 'demos' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                                Choose a pre-configured quantum narrative universe to explore instantly:
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {DEMO_STORIES.map(demo => (
                                    <div
                                        key={demo.id}
                                        style={{
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '12px',
                                            padding: '1rem 1.25rem',
                                            background: '#ffffff',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            gap: '1rem',
                                            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                                            transition: 'border-color 0.15s ease',
                                        }}
                                    >
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
                                                <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                                                    {demo.title}
                                                </h3>
                                                <span style={{
                                                    fontSize: '0.72rem',
                                                    fontWeight: '600',
                                                    padding: '2px 8px',
                                                    borderRadius: '12px',
                                                    background: '#e0f2fe',
                                                    color: '#0369a1',
                                                }}>
                                                    {demo.beatsCount} beats • {demo.connections.length} CNOTs
                                                </span>
                                            </div>
                                            <p style={{ fontSize: '0.82rem', color: '#475569', margin: 0, lineHeight: 1.4 }}>
                                                {demo.description}
                                            </p>
                                        </div>

                                        <button
                                            onClick={() => handleDemoLoad(demo)}
                                            style={{
                                                padding: '0.55rem 1.1rem',
                                                borderRadius: '8px',
                                                border: '1px solid #3b82f6',
                                                background: '#eff6ff',
                                                color: '#1d4ed8',
                                                fontWeight: '600',
                                                fontSize: '0.85rem',
                                                cursor: 'pointer',
                                                whiteSpace: 'nowrap',
                                                transition: 'all 0.15s ease',
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.background = '#2563eb';
                                                e.currentTarget.style.color = '#ffffff';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = '#eff6ff';
                                                e.currentTarget.style.color = '#1d4ed8';
                                            }}
                                        >
                                            ✨ Load Story
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{
                    padding: '0.9rem 1.5rem',
                    borderTop: '1px solid #e2e8f0',
                    background: '#f8fafc',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}>
                    <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                        JSON Format v2.0 • Compatible with QGE & Inky Compiler
                    </span>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '0.5rem 1rem',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            background: '#ffffff',
                            color: '#475569',
                            fontWeight: '600',
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                        }}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
