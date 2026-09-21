import React, { useRef, useEffect, useState } from 'react';
import PixiScene from '../visualizer/PixiScene.js';

/**
 * React wrapper for the Pixi.js worldline scene with smooth navigation controls.
 */
export default function PixiWorldlineCanvas({
    qubits,
    connections,
    qubitUncertainty,
    hasPhaseInterference = false,
    scrubberPosition = 1.0,
    sliceInfo = null,
    tutorialState = null,
    onScrubberChange,
    onCNOTCreate,
    onToggleConnectionParity,
    onEditQubit,
    onPlaceGate,
    onEditGate,
    onGateContextMenu,
    onRemoveGate,
    onRemoveConnection,
    onRemoveWorldline,
    onAddWorldline,
    onAddControlToConnection,
    onConfigureConnection,
}) {
    const containerRef = useRef(null);
    const sceneRef = useRef(null);
    const isFirstRender = useRef(true);
    const [zoomLevel, setZoomLevel] = useState(1.0);

    // Stable callback refs
    const callbackRefs = useRef({});
    callbackRefs.current = {
        onScrubberChange,
        onCNOTCreate,
        onToggleConnectionParity,
        onEditQubit,
        onPlaceGate,
        onEditGate,
        onGateContextMenu,
        onRemoveGate,
        onRemoveConnection,
        onRemoveWorldline,
        onAddWorldline,
        onAddControlToConnection,
        onConfigureConnection,
    };

    // Mount / unmount
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const scene = new PixiScene({
            container,
            qubits,
            connections,
            qubitUncertainty: qubitUncertainty || {},
            hasPhaseInterference,
            scrubberPosition,
            sliceInfo,
            tutorialState,
            onZoomChange: (z) => setZoomLevel(z),
            onScrubberChange: (...args) => callbackRefs.current.onScrubberChange?.(...args),
            onCNOTCreate: (...args) => callbackRefs.current.onCNOTCreate?.(...args),
            onToggleConnectionParity: (...args) => callbackRefs.current.onToggleConnectionParity?.(...args),
            onEditQubit: (...args) => callbackRefs.current.onEditQubit?.(...args),
            onPlaceGate: (...args) => callbackRefs.current.onPlaceGate?.(...args),
            onEditGate: (...args) => callbackRefs.current.onEditGate?.(...args),
            onGateContextMenu: (...args) => callbackRefs.current.onGateContextMenu?.(...args),
            onRemoveGate: (...args) => callbackRefs.current.onRemoveGate?.(...args),
            onRemoveConnection: (...args) => callbackRefs.current.onRemoveConnection?.(...args),
            onRemoveWorldline: (...args) => callbackRefs.current.onRemoveWorldline?.(...args),
            onAddWorldline: (...args) => callbackRefs.current.onAddWorldline?.(...args),
            onAddControlToConnection: (...args) => callbackRefs.current.onAddControlToConnection?.(...args),
            onConfigureConnection: (...args) => callbackRefs.current.onConfigureConnection?.(...args),
        });

        sceneRef.current = scene;
        isFirstRender.current = false;

        return () => {
            scene.destroy();
            sceneRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Sync qubit data
    useEffect(() => {
        if (isFirstRender.current) return;
        sceneRef.current?.updateQubits(qubits);
    }, [qubits]);

    // Sync connections
    useEffect(() => {
        if (isFirstRender.current) return;
        sceneRef.current?.updateConnections(connections);
    }, [connections]);

    // Sync uncertainty
    useEffect(() => {
        if (isFirstRender.current) return;
        sceneRef.current?.updateUncertainty(qubitUncertainty || {});
    }, [qubitUncertainty]);

    // Sync scrubber and slice
    useEffect(() => {
        if (isFirstRender.current) return;
        sceneRef.current?.updateScrubber(scrubberPosition, sliceInfo);
    }, [scrubberPosition, sliceInfo]);

    // Sync phase interference
    useEffect(() => {
        if (isFirstRender.current) return;
        sceneRef.current?.updatePhaseInterference(hasPhaseInterference);
    }, [hasPhaseInterference]);

    // Sync tutorial state
    useEffect(() => {
        if (isFirstRender.current) return;
        sceneRef.current?.updateTutorialState(tutorialState);
    }, [tutorialState]);

    return (
        <div className="relative w-full h-full overflow-hidden select-none bg-slate-50">
            <div
                ref={containerRef}
                style={{
                    width: '100%',
                    height: '100%',
                    overflow: 'hidden',
                    background: '#f8fafc',
                }}
            />

            {/* Scroll Navigation Hint (shown when story has many worldlines) */}
            {qubits.length >= 7 && (
                <div
                    style={{
                        position: 'absolute',
                        bottom: '50px',
                        left: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: 'rgba(255, 255, 255, 0.88)',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        padding: '3px 9px',
                        fontSize: '11px',
                        color: '#64748b',
                        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
                        pointerEvents: 'none',
                        zIndex: 10,
                    }}
                >
                    <span>↕ Scroll or drag canvas to explore all worldlines</span>
                </div>
            )}

            {/* Floating Glassmorphic Canvas Navigation & Zoom Bar */}
            <div
                style={{
                    position: 'absolute',
                    bottom: '50px',
                    right: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px',
                    background: 'rgba(255, 255, 255, 0.92)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid #cbd5e1',
                    borderRadius: '10px',
                    padding: '3px 5px',
                    boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)',
                    zIndex: 10,
                }}
            >
                <button
                    onClick={() => sceneRef.current?.zoomOut()}
                    title="Zoom Out (or Ctrl + Scroll Down)"
                    className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-slate-100 text-slate-700 text-sm font-bold transition-colors"
                >
                    −
                </button>
                <button
                    onClick={() => sceneRef.current?.resetView()}
                    title="Reset Zoom to 100%"
                    className="px-1.5 h-6 flex items-center justify-center rounded-md hover:bg-slate-100 text-slate-700 text-[11px] font-semibold font-mono transition-colors"
                >
                    {Math.round(zoomLevel * 100)}%
                </button>
                <button
                    onClick={() => sceneRef.current?.zoomIn()}
                    title="Zoom In (or Ctrl + Scroll Up)"
                    className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-slate-100 text-slate-700 text-sm font-bold transition-colors"
                >
                    +
                </button>
                <div className="w-[1px] h-3.5 bg-slate-200 mx-0.5" />
                <button
                    onClick={() => sceneRef.current?.fitToScreen()}
                    title="Fit All Worldlines onto Screen"
                    className="px-1.5 h-6 flex items-center justify-center rounded-md hover:bg-sky-50 text-sky-700 text-[11px] font-semibold transition-colors"
                >
                    ⤢ Fit
                </button>
            </div>
        </div>
    );
}
