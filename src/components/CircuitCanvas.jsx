import React from 'react';

export default function CircuitCanvas({ width, height, qubits, gates, simulator, onCNOTCreate, onEditQubit, dragState, onDragStateChange }) {
  const canvasRef = React.useRef(null);
  const particlesRef = React.useRef([]);
  const ANCHORS_PER_LINE = 10;

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let animationId;
    const animate = () => {
      render();
      particlesRef.current = particlesRef.current.filter(p => p.life > 0);
      particlesRef.current.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.02;
        p.vy += 0.1;
      });
      animationId = requestAnimationFrame(animate);
    };
    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [width, height, qubits, gates, dragState]);

  const getAnchorPoints = () => {
    const padding = 100;
    const lineHeight = (height - 2 * padding) / Math.max(qubits.length, 1);
    const lineWidth = width - 2 * padding;
    const anchors = [];

    for (let i = 0; i < qubits.length; i++) {
      const y = padding + i * lineHeight + lineHeight / 2;
      for (let j = 0; j < ANCHORS_PER_LINE; j++) {
        const x = padding + (j / (ANCHORS_PER_LINE - 1)) * lineWidth;
        anchors.push({ x, y, qubit: i, index: j });
      }
    }
    return anchors;
  };

  const getClosestAnchor = (x, y) => {
    const anchors = getAnchorPoints();
    let closest = anchors[0];
    let minDist = Infinity;

    for (const anchor of anchors) {
      const dist = Math.sqrt((anchor.x - x) ** 2 + (anchor.y - y) ** 2);
      if (dist < minDist) {
        minDist = dist;
        closest = anchor;
      }
    }

    return closest;
  };

  const render = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const padding = 100;
    const lineHeight = (height - 2 * padding) / Math.max(qubits.length, 1);
    const lineWidth = width - 2 * padding;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);

    // Draw worldlines
    ctx.strokeStyle = '#00d9ff';
    ctx.lineWidth = 2;

    const worldlineYs = [];
    for (let i = 0; i < qubits.length; i++) {
      const y = padding + i * lineHeight + lineHeight / 2;
      worldlineYs[i] = y;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(padding + lineWidth, y);
      ctx.stroke();
    }

    // Draw anchor points (subtle)
    ctx.fillStyle = 'rgba(34, 211, 238, 0.2)';
    const anchors = getAnchorPoints();
    for (const anchor of anchors) {
      ctx.beginPath();
      ctx.arc(anchor.x, anchor.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw CNOT gates with bezier curves
    ctx.strokeStyle = '#3b82f6';
    ctx.fillStyle = '#3b82f6';
    ctx.lineWidth = 2.5;

    for (const gate of gates) {
      if (gate.type === 'CNOT') {
        const y1 = worldlineYs[gate.control];
        const y2 = worldlineYs[gate.target];
        // Use middle anchor positions for gate drawing
        const x1 = padding + lineWidth * 0.5;
        const x2 = padding + lineWidth * 0.5;

        const cp1x = x1 + (x2 - x1) * 0.3;
        const cp1y = y1;
        const cp2x = x2 - (x2 - x1) * 0.3;
        const cp2y = y2;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x2, y2);
        ctx.stroke();

        ctx.fillStyle = '#3b82f6';
        ctx.beginPath();
        ctx.arc(x1, y1, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x2, y2, 6, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // Draw drag preview
    if (dragState && dragState.isActive) {
      const startAnchor = dragState.startAnchor;
      const currentX = dragState.currentX;
      const currentY = dragState.currentY;

      // Find closest anchor to current position
      let closestAnchor = startAnchor;
      if (currentX !== startAnchor.x || currentY !== startAnchor.y) {
        closestAnchor = getClosestAnchor(currentX, currentY);
      }

      const now = Date.now() * 0.003;
      const pulse = 0.7 + Math.sin(now) * 0.3;

      // Glow
      ctx.strokeStyle = `rgba(34, 211, 238, ${pulse * 0.6})`;
      ctx.lineWidth = 8;
      ctx.lineCap = 'round';

      ctx.beginPath();
      ctx.moveTo(startAnchor.x, startAnchor.y);
      const cpx = startAnchor.x + (currentX - startAnchor.x) * 0.4;
      const cpy1 = startAnchor.y + (closestAnchor.y - startAnchor.y) * 0.2;
      const cpy2 = startAnchor.y + (closestAnchor.y - startAnchor.y) * 0.8;
      ctx.bezierCurveTo(cpx, cpy1, cpx, cpy2, currentX, closestAnchor.y);
      ctx.stroke();

      // Main line
      ctx.strokeStyle = 'rgba(34, 211, 238, 1)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(startAnchor.x, startAnchor.y);
      ctx.bezierCurveTo(cpx, cpy1, cpx, cpy2, currentX, closestAnchor.y);
      ctx.stroke();

      // Source dot
      ctx.fillStyle = '#22d3ee';
      ctx.beginPath();
      ctx.arc(startAnchor.x, startAnchor.y, 8, 0, Math.PI * 2);
      ctx.fill();

      // Target indicator
      if (closestAnchor.qubit !== dragState.startAnchor.qubit) {
        const indicatorRadius = 6 + Math.sin(now * 3) * 2;
        ctx.strokeStyle = 'rgba(34, 211, 238, 0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(currentX, closestAnchor.y, indicatorRadius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = 'rgba(34, 211, 238, 0.3)';
        ctx.beginPath();
        ctx.arc(currentX, closestAnchor.y, indicatorRadius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Draw main dots at start of each worldline
    const now = Date.now() * 0.001;
    for (let i = 0; i < qubits.length; i++) {
      const y = worldlineYs[i];
      const pulseScale = 1 + Math.sin(now * 2.5) * 0.3;
      const glowRadius = 12 * pulseScale;

      ctx.fillStyle = `rgba(34, 211, 238, ${0.5 * (1 - pulseScale * 0.3)})`;
      ctx.beginPath();
      ctx.arc(padding, y, glowRadius + 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = `rgba(34, 211, 238, ${0.4 * (1 - pulseScale * 0.2)})`;
      ctx.beginPath();
      ctx.arc(padding, y, glowRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#22d3ee';
      ctx.beginPath();
      ctx.arc(padding, y, 10, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw titles
    ctx.fillStyle = '#00d9ff';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    for (let i = 0; i < qubits.length; i++) {
      const y = worldlineYs[i];
      ctx.fillText(qubits[i].name, padding + 25, y - 10);
    }

    // Draw particles
    ctx.fillStyle = '#22d3ee';
    for (const particle of particlesRef.current) {
      ctx.globalAlpha = particle.life;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  };

  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleMouseDown = (e) => {
    const coords = getCanvasCoords(e);
    const padding = 100;
    const lineHeight = (height - 2 * padding) / Math.max(qubits.length, 1);
    const lineWidth = width - 2 * padding;

    for (let i = 0; i < qubits.length; i++) {
      const lineY = padding + i * lineHeight + lineHeight / 2;
      
      if (Math.abs(coords.y - lineY) < 15 && coords.x >= padding && coords.x <= padding + lineWidth) {
        const dotDist = Math.sqrt((coords.x - padding) ** 2 + (coords.y - lineY) ** 2);
        
        if (dotDist < 20) {
          // Click on dot - edit narrative
          onEditQubit(qubits[i]);
        } else {
          // Click on worldline - start drag
          const startAnchor = getClosestAnchor(coords.x, coords.y);
          onDragStateChange({
            isActive: true,
            startAnchor,
            currentX: coords.x,
            currentY: coords.y,
          });
        }
        e.preventDefault();
        break;
      }
    }
  };

  const handleMouseMove = (e) => {
    if (!dragState?.isActive) return;

    const coords = getCanvasCoords(e);
    onDragStateChange({
      ...dragState,
      currentX: coords.x,
      currentY: coords.y,
    });
  };

  const handleMouseUp = (e) => {
    if (!dragState?.isActive) return;

    const coords = getCanvasCoords(e);
    const targetAnchor = getClosestAnchor(coords.x, coords.y);
    const sourceAnchor = dragState.startAnchor;

    if (targetAnchor.qubit !== sourceAnchor.qubit) {
      onCNOTCreate(sourceAnchor.qubit, targetAnchor.qubit);

      // Particles
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        const speed = 2 + Math.random() * 3;
        particlesRef.current.push({
          x: sourceAnchor.x,
          y: sourceAnchor.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          r: 2 + Math.random() * 2,
          life: 1,
        });
        particlesRef.current.push({
          x: targetAnchor.x,
          y: targetAnchor.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          r: 2 + Math.random() * 2,
          life: 1,
        });
      }
    }

    onDragStateChange(null);
  };

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => dragState && onDragStateChange(null)}
      style={{ display: 'block', cursor: 'grab' }}
    />
  );
}
