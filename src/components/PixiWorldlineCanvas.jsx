import React, { useRef, useEffect } from 'react';
import PixiScene from '../visualizer/PixiScene.js';

/**
 * React wrapper for the Pixi.js worldline scene.
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
}) {
    const containerRef = useRef(null);
    const sceneRef = useRef(null);
    const isFirstRender = useRef(true);

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
        onAddWorldline
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
        <div
            ref={containerRef}
            style={{
                width: '100%',
                height: '100%',
                overflow: 'hidden',
                background: '#f8fafc',
            }}
        />
    );
}
