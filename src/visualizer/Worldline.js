import * as PIXI from 'pixi.js';

/**
 * A single quantum worldline rendered in Pixi.js.
 *
 * Visual states:
 *  - Certain (isUncertain=false or no gates): solid cyan line
 *  - Uncertain (isUncertain=true + has gates): solid up to first gate, shimmers after
 *
 * Interactions:
 *  - Click start dot → emits 'edit-narrative'
 *  - Single click on line body → emits 'place-gate' with position
 *  - Click gate diamond → emits 'edit-gate'
 *  - Click+drag from line body → emits 'drag-start' for thread connection
 */
export default class Worldline extends PIXI.Container {
    constructor({ id, name, y, x, lineWidth, gates = [], isUncertain = false }) {
        super();

        this.qubitId = id;
        this.qubitName = name;
        this.lineY = y;
        this.lineX = x;
        this.lineWidth = lineWidth;
        this.gates = gates;
        this.isUncertain = isUncertain;

        // Internal state
        this._hoverActive = false;
        this._hoverX = 0;
        this._time = Math.random() * 1000;

        // Pointer tracking for click vs drag distinction
        this._pointerDownTime = 0;
        this._pointerDownX = 0;
        this._pointerDownY = 0;
        this._isDragging = false;
        this._DRAG_THRESHOLD = 8;   // px movement to switch from click to drag
        this._CLICK_MAX_MS = 300;   // max ms for a click

        // Build display objects
        this._buildStaticLine();
        this._buildShimmerLine();
        this._buildGateDiamonds();
        this._buildHoverDot();
        this._buildLabel();
        this._buildStartDot();
        this._buildHitArea();
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  CONSTRUCTION
    // ═══════════════════════════════════════════════════════════════════════

    _buildStaticLine() {
        this.staticLine = new PIXI.Graphics();
        this.addChild(this.staticLine);
        this._drawStaticLine();
    }

    _drawStaticLine() {
        const g = this.staticLine;
        g.clear();

        const endX = this._shouldShimmer()
            ? this.lineX + this._getShimmerStartFraction() * this.lineWidth
            : this.lineX + this.lineWidth;

        // Glow behind
        g.setStrokeStyle({ width: 6, color: 0x00d9ff, alpha: 0.12 });
        g.moveTo(this.lineX, this.lineY);
        g.lineTo(endX, this.lineY);
        g.stroke();

        // Core line
        g.setStrokeStyle({ width: 2, color: 0x00d9ff, alpha: 1 });
        g.moveTo(this.lineX, this.lineY);
        g.lineTo(endX, this.lineY);
        g.stroke();
    }

    _buildShimmerLine() {
        this.shimmerLine = new PIXI.Graphics();
        this.addChild(this.shimmerLine);
    }

    _buildGateDiamonds() {
        this.gateContainer = new PIXI.Container();
        this.addChild(this.gateContainer);
        this._drawGateDiamonds();
    }

    _drawGateDiamonds() {
        this.gateContainer.removeChildren();

        for (const gate of this.gates) {
            const cx = this.lineX + gate.position * this.lineWidth;
            const cy = this.lineY;
            const s = 7;

            const diamond = new PIXI.Graphics();

            // Outer glow
            diamond.setStrokeStyle({ width: 2, color: 0x22d3ee, alpha: 0.4 });
            diamond.moveTo(cx, cy - s - 3);
            diamond.lineTo(cx + s + 3, cy);
            diamond.lineTo(cx, cy + s + 3);
            diamond.lineTo(cx - s - 3, cy);
            diamond.closePath();
            diamond.stroke();

            // Inner diamond
            diamond.fill({ color: 0x22d3ee, alpha: 0.9 });
            diamond.moveTo(cx, cy - s);
            diamond.lineTo(cx + s, cy);
            diamond.lineTo(cx, cy + s);
            diamond.lineTo(cx - s, cy);
            diamond.closePath();
            diamond.fill();

            // Compute probability of active outcome: sin^2(theta / 2)
            const theta = gate.theta ?? (Math.PI / 2);
            const prob = Math.sin(theta / 2) ** 2;
            const isH = Math.abs(prob - 0.5) < 0.02;
            const gateText = isH ? 'H' : `H(${Math.round(prob * 100)}%)`;

            // Label
            const label = new PIXI.Text({
                text: gateText,
                style: {
                    fontFamily: '"Inter", monospace',
                    fontSize: 9,
                    fill: 0x22d3ee,
                    fontWeight: 'bold',
                },
            });
            label.anchor.set(0.5, 1);
            label.x = cx;
            label.y = cy - s - 6;
            diamond.addChild(label);

            // Hit area for clicking the diamond
            const hitArea = new PIXI.Graphics();
            hitArea.fill({ color: 0x000000, alpha: 0.001 });
            hitArea.rect(cx - 15, cy - 15, 30, 30);
            hitArea.fill();
            hitArea.interactive = true;
            hitArea.cursor = 'pointer';

            hitArea.on('pointerdown', (e) => {
                e.stopPropagation();
                this.emit('edit-gate', {
                    qubitId: this.qubitId,
                    gateId: gate.id,
                    gate,
                    screenX: e.global.x,
                    screenY: e.global.y,
                });
            });

            diamond.addChild(hitArea);
            this.gateContainer.addChild(diamond);
        }
    }

    _buildHoverDot() {
        this.hoverDot = new PIXI.Graphics();
        this.hoverDot.visible = false;
        this.addChild(this.hoverDot);
    }

    _drawHoverDot(x, pulse) {
        const g = this.hoverDot;
        g.clear();

        const baseRadius = 10;
        const glowRadius = baseRadius + 8 * pulse;

        // Outer glow
        g.fill({ color: 0x22d3ee, alpha: 0.08 * pulse });
        g.circle(x, this.lineY, glowRadius + 6);
        g.fill();

        // Mid glow
        g.fill({ color: 0x22d3ee, alpha: 0.15 * pulse });
        g.circle(x, this.lineY, glowRadius);
        g.fill();

        // Core dot
        g.fill({ color: 0x22d3ee, alpha: 0.85 });
        g.circle(x, this.lineY, 5);
        g.fill();

        // Bright center
        g.fill({ color: 0xffffff, alpha: 0.6 });
        g.circle(x, this.lineY, 2);
        g.fill();
    }

    _buildLabel() {
        this.label = new PIXI.Text({
            text: this.qubitName,
            style: {
                fontFamily: '"Inter", "SF Pro", system-ui, monospace',
                fontSize: 12,
                fill: 0x94a3b8,
                letterSpacing: 0.5,
            },
        });
        this.label.x = this.lineX + 22;
        this.label.y = this.lineY - 22;
        this.addChild(this.label);
    }

    _buildStartDot() {
        this.startDot = new PIXI.Graphics();
        this._drawStartDot(1.0);
        this.addChild(this.startDot);

        // Interactive hit zone for the start dot
        const hitDot = new PIXI.Graphics();
        hitDot.fill({ color: 0x000000, alpha: 0.001 });
        hitDot.circle(this.lineX, this.lineY, 18);
        hitDot.fill();
        hitDot.interactive = true;
        hitDot.cursor = 'pointer';

        hitDot.on('pointerdown', (e) => {
            e.stopPropagation();
            this.emit('edit-narrative', { qubitId: this.qubitId });
        });

        this.addChild(hitDot);

        // Remove button: small ✕ to the left of the start dot
        this._removeBtn = new PIXI.Container();

        const removeText = new PIXI.Text({
            text: '✕',
            style: {
                fontFamily: '"Inter", system-ui',
                fontSize: 12,
                fill: 0x94a3b8,
            },
        });
        removeText.anchor.set(0.5, 0.5);
        removeText.x = this.lineX - 20;
        removeText.y = this.lineY;
        this._removeBtn.addChild(removeText);

        const removeHit = new PIXI.Graphics();
        removeHit.fill({ color: 0x000000, alpha: 0.001 });
        removeHit.circle(this.lineX - 20, this.lineY, 12);
        removeHit.fill();
        removeHit.interactive = true;
        removeHit.cursor = 'pointer';

        removeHit.on('pointerover', () => { removeText.style.fill = 0xef4444; });
        removeHit.on('pointerout', () => { removeText.style.fill = 0x94a3b8; });
        removeHit.on('pointerdown', (e) => {
            e.stopPropagation();
            this.emit('remove-worldline', { qubitId: this.qubitId });
        });

        this._removeBtn.addChild(removeHit);
        this.addChild(this._removeBtn);
    }

    _drawStartDot(pulse) {
        const g = this.startDot;
        g.clear();

        const glowRadius = 12 * pulse;

        // Outer glow
        g.fill({ color: 0x22d3ee, alpha: 0.15 * (1 - pulse * 0.3) });
        g.circle(this.lineX, this.lineY, glowRadius + 5);
        g.fill();

        // Mid glow
        g.fill({ color: 0x22d3ee, alpha: 0.25 * (1 - pulse * 0.2) });
        g.circle(this.lineX, this.lineY, glowRadius);
        g.fill();

        // Core dot
        g.fill({ color: 0x22d3ee, alpha: 1 });
        g.circle(this.lineX, this.lineY, 8);
        g.fill();

        // Inner bright
        g.fill({ color: 0xffffff, alpha: 0.4 });
        g.circle(this.lineX, this.lineY, 3);
        g.fill();
    }

    _buildHitArea() {
        // Invisible wider zone for pointer events on the line body
        this.hitZone = new PIXI.Graphics();
        this.hitZone.fill({ color: 0x000000, alpha: 0.001 });
        // Start offset past the start dot
        this.hitZone.rect(this.lineX + 20, this.lineY - 25, this.lineWidth - 20, 50);
        this.hitZone.fill();

        this.hitZone.interactive = true;
        this.hitZone.cursor = 'default';

        // Click vs drag: track pointer down, distinguish by movement & time
        this.hitZone.on('pointerdown', (e) => {
            this._pointerDownTime = Date.now();
            this._pointerDownX = e.global.x;
            this._pointerDownY = e.global.y;
            this._isDragging = false;
        });

        this.hitZone.on('pointermove', (e) => {
            if (this._pointerDownTime === 0) return;
            const dx = e.global.x - this._pointerDownX;
            const dy = e.global.y - this._pointerDownY;
            if (Math.sqrt(dx * dx + dy * dy) > this._DRAG_THRESHOLD) {
                if (!this._isDragging) {
                    this._isDragging = true;
                    this.emit('drag-start', {
                        qubitId: this.qubitId,
                        x: this._pointerDownX,
                        y: this.lineY,
                    });
                }
            }
        });

        this.hitZone.on('pointerup', (e) => {
            const elapsed = Date.now() - this._pointerDownTime;
            this._pointerDownTime = 0;

            if (!this._isDragging && elapsed < this._CLICK_MAX_MS) {
                // This is a click — check if clicking on an existing gate
                const clickX = e.global.x;
                const isOnGate = this.gates.some(gate => {
                    const gateX = this.lineX + gate.position * this.lineWidth;
                    return Math.abs(clickX - gateX) < 15;
                });

                if (!isOnGate) {
                    // Place a new gate
                    const position = Math.max(0.05, Math.min(0.95,
                        (clickX - this.lineX) / this.lineWidth
                    ));
                    this.emit('place-gate', {
                        qubitId: this.qubitId,
                        position,
                    });
                }
            }
            this._isDragging = false;
        });

        this.hitZone.on('pointerupoutside', () => {
            this._pointerDownTime = 0;
            this._isDragging = false;
        });

        this.addChild(this.hitZone);
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  QUERIES
    // ═══════════════════════════════════════════════════════════════════════

    _shouldShimmer() {
        return this.isUncertain;
    }

    _getShimmerStartFraction() {
        if (this.gates.length === 0) return 0.5; // Entanglement-only: shimmer from midpoint
        return Math.min(...this.gates.map(g => g.position));
    }

    isNearY(globalY) {
        return Math.abs(globalY - this.lineY) < 25;
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  UPDATES
    // ═══════════════════════════════════════════════════════════════════════

    setHover(cursorX, isNear) {
        this._hoverActive = isNear;
        if (isNear) {
            this._hoverX = Math.max(this.lineX, Math.min(this.lineX + this.lineWidth, cursorX));
        }
    }

    updateData({ name, gates, isUncertain }) {
        if (name !== undefined && name !== this.qubitName) {
            this.qubitName = name;
            this.label.text = name;
        }
        let needsRedraw = false;
        if (gates !== undefined) {
            this.gates = gates;
            needsRedraw = true;
        }
        if (isUncertain !== undefined && isUncertain !== this.isUncertain) {
            this.isUncertain = isUncertain;
            needsRedraw = true;
        }
        if (needsRedraw) {
            this._drawStaticLine();
            this._drawGateDiamonds();
        }
    }

    tick(dt) {
        this._time += dt * 0.05;
        this._updateShimmer();
        this._updateHoverDot();
        this._updateStartDot();
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  FRAME-LEVEL RENDERING
    // ═══════════════════════════════════════════════════════════════════════

    _updateShimmer() {
        const g = this.shimmerLine;
        g.clear();

        if (!this._shouldShimmer()) return;

        const startFrac = this._getShimmerStartFraction();
        const startX = this.lineX + startFrac * this.lineWidth;
        const endX = this.lineX + this.lineWidth;
        const segmentCount = Math.max(8, Math.round((endX - startX) / 8));
        const segLen = (endX - startX) / segmentCount;

        // Draw glow layer
        for (let i = 0; i < segmentCount; i++) {
            const sx = startX + i * segLen;
            const ex = sx + segLen;
            const phase = this._time * 3.0 + i * 0.45;
            const alpha = 0.06 + Math.sin(phase) * 0.04;
            const yOff = Math.sin(phase * 0.7) * 1.5;

            g.setStrokeStyle({ width: 10, color: 0x7dd3fc, alpha });
            g.moveTo(sx, this.lineY + yOff);
            g.lineTo(ex, this.lineY + Math.sin(phase + 0.45) * 1.5);
            g.stroke();
        }

        // Draw core shimmer
        for (let i = 0; i < segmentCount; i++) {
            const sx = startX + i * segLen;
            const ex = sx + segLen;
            const phase = this._time * 3.0 + i * 0.45;
            const alpha = 0.35 + Math.sin(phase) * 0.35 + Math.sin(phase * 1.7) * 0.15;
            const yOff = Math.sin(phase * 0.7) * 1.8;
            const yOff2 = Math.sin((phase + 0.45) * 0.7) * 1.8;
            const color = i % 3 === 0 ? 0x7dd3fc : 0x00d9ff;

            g.setStrokeStyle({ width: 2, color, alpha: Math.max(0.2, Math.min(1, alpha)) });
            g.moveTo(sx, this.lineY + yOff);
            g.lineTo(ex, this.lineY + yOff2);
            g.stroke();
        }
    }

    _updateHoverDot() {
        if (!this._hoverActive) {
            this.hoverDot.visible = false;
            return;
        }
        this.hoverDot.visible = true;
        const pulse = 0.7 + Math.sin(this._time * 5) * 0.3;
        this._drawHoverDot(this._hoverX, pulse);
    }

    _updateStartDot() {
        const pulse = 1 + Math.sin(this._time * 2.5) * 0.15;
        this._drawStartDot(pulse);
    }
}
