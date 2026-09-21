import * as PIXI from 'pixi.js';

/**
 * Worldline (Modern Bright Studio Edition)
 * A quantum worldline rendered in Pixi.js on a crisp light theme.
 *
 * Visual states:
 *  - Certain: solid deep sky-blue line (0x0284c7)
 *  - Uncertain: solid up to first gate, iridescent energetic shimmer after
 *
 * Interactions:
 *  - Interactive Story Beat Node Card at the beginning with "✎ Edit" affordance
 *  - Click on line body -> places H gate
 *  - Click on placed gate diamond -> instantly removes gate
 *  - Drag from line body -> creates entanglement thread
 */
export default class Worldline extends PIXI.Container {
    constructor({
        id,
        name,
        y,
        x,
        lineWidth,
        gates = [],
        isUncertain = false,
        hasPhaseInterference = false,
        scrubberPosition = 1.0,
        uncertainSegments = [],
    }) {
        super();

        this.qubitId = id;
        this.qubitName = name;
        this.lineY = y;
        this.lineX = x;
        this.lineWidth = lineWidth;
        this.gates = gates;
        this.isUncertain = isUncertain;
        this.hasPhaseInterference = hasPhaseInterference || false;
        this.scrubberPosition = scrubberPosition ?? 1.0;
        this.uncertainSegments = uncertainSegments || [];

        // Node pill width offset: line starts after the start node pill
        this.START_NODE_WIDTH = 130;

        // Internal state
        this._hoverActive = false;
        this._hoverX = 0;
        this._time = Math.random() * 1000;

        // Pointer tracking for click vs drag distinction
        this._pointerDownTime = 0;
        this._pointerDownX = 0;
        this._pointerDownY = 0;
        this._isDragging = false;
        this._DRAG_THRESHOLD = 8;
        this._CLICK_MAX_MS = 300;

        // Build display objects
        this._buildTrackGuideline();
        this._buildStaticLine();
        this._buildShimmerLine();
        this._buildHitArea();
        this._buildGateDiamonds();
        this._buildHoverDot();
        this._buildStartNodeCard();
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  CONSTRUCTION
    // ═══════════════════════════════════════════════════════════════════════

    _buildTrackGuideline() {
        // Subtle background rail
        this.trackGuideline = new PIXI.Graphics();
        const startX = this.lineX + this.START_NODE_WIDTH + 8;
        const endX = this.lineX + this.lineWidth;

        this.trackGuideline.setStrokeStyle({ width: 1.5, color: 0xe2e8f0, alpha: 0.8 });
        this.trackGuideline.moveTo(startX, this.lineY);
        this.trackGuideline.lineTo(endX, this.lineY);
        this.trackGuideline.stroke();

        this.addChild(this.trackGuideline);
    }

    _buildStaticLine() {
        this.staticLine = new PIXI.Graphics();
        this.addChild(this.staticLine);
        this._drawStaticLine();
    }

    _getClampedUncertainIntervals() {
        const limitFrac = (this.scrubberPosition !== undefined && this.scrubberPosition < 0.999)
            ? this.scrubberPosition
            : 1.0;

        let raw = this.uncertainSegments;
        if (!raw || raw.length === 0) {
            // Fallback if segments not computed but isUncertain is true
            if (this.isUncertain) {
                const startFrac = this.gates.length > 0
                    ? Math.min(...this.gates.map(g => g.position))
                    : 0;
                raw = [{ start: startFrac, end: 1.0 }];
            } else {
                return [];
            }
        }

        const clamped = [];
        for (const seg of raw) {
            const s = Math.max(0, seg.start);
            const e = Math.min(limitFrac, seg.end);
            if (e > s + 0.001) {
                clamped.push({ start: s, end: e });
            }
        }
        return clamped;
    }

    _getDeterministicIntervals() {
        const limitFrac = (this.scrubberPosition !== undefined && this.scrubberPosition < 0.999)
            ? this.scrubberPosition
            : 1.0;

        const uList = this._getClampedUncertainIntervals();
        if (uList.length === 0) {
            return limitFrac > 0.001 ? [{ start: 0, end: limitFrac }] : [];
        }

        const det = [];
        let curr = 0;
        for (const u of uList) {
            if (u.start > curr + 0.001) {
                det.push({ start: curr, end: u.start });
            }
            curr = Math.max(curr, u.end);
        }
        if (limitFrac > curr + 0.001) {
            det.push({ start: curr, end: limitFrac });
        }
        return det;
    }

    _drawStaticLine() {
        const g = this.staticLine;
        g.clear();

        const startX = this.lineX + this.START_NODE_WIDTH + 8;
        const totalUsableWidth = this.lineWidth - this.START_NODE_WIDTH - 8;

        const glowColor = this.hasPhaseInterference ? 0xfde68a : 0x38bdf8;
        const coreColor = this.hasPhaseInterference ? 0xd97706 : 0x0284c7;

        const detIntervals = this._getDeterministicIntervals();
        const uncIntervals = this._getClampedUncertainIntervals();

        // 1. Draw solid deterministic portions (full opacity glow + core line)
        for (const intv of detIntervals) {
            const x1 = startX + intv.start * totalUsableWidth;
            const x2 = startX + intv.end * totalUsableWidth;
            if (x2 <= x1 + 0.5) continue;

            g.setStrokeStyle({ width: 5, color: glowColor, alpha: 0.28 });
            g.moveTo(x1, this.lineY);
            g.lineTo(x2, this.lineY);
            g.stroke();

            g.setStrokeStyle({ width: 2.5, color: coreColor, alpha: 1 });
            g.moveTo(x1, this.lineY);
            g.lineTo(x2, this.lineY);
            g.stroke();
        }

        // 2. Draw subtle baseline rail underneath superposition wave portions
        for (const intv of uncIntervals) {
            const x1 = startX + intv.start * totalUsableWidth;
            const x2 = startX + intv.end * totalUsableWidth;
            if (x2 <= x1 + 0.5) continue;

            g.setStrokeStyle({ width: 2, color: coreColor, alpha: 0.35 });
            g.moveTo(x1, this.lineY);
            g.lineTo(x2, this.lineY);
            g.stroke();
        }
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

        const startX = this.lineX + this.START_NODE_WIDTH + 8;
        const totalUsableWidth = this.lineWidth - this.START_NODE_WIDTH - 8;

        for (let gi = 0; gi < this.gates.length; gi++) {
            const gate = this.gates[gi];
            const cx = startX + gate.position * totalUsableWidth;
            const cy = this.lineY;
            const s = 8;

            const isFuture = gate.position > (this.scrubberPosition + 0.005);
            const isPhaseGate = this.hasPhaseInterference && gi > 0;

            const diamondContainer = new PIXI.Container();
            diamondContainer.alpha = isFuture ? 0.28 : 1.0;

            // Diamond graphics
            const diamondG = new PIXI.Graphics();
            const gateCoreColor = isPhaseGate ? 0xd97706 : 0x0284c7;
            const gateGlowColor = isPhaseGate ? 0xf59e0b : 0x0284c7;

            // Default look
            const drawNormal = () => {
                diamondG.clear();
                // Outer glow
                diamondG.setStrokeStyle({ width: 2, color: gateGlowColor, alpha: isPhaseGate ? 0.6 : 0.4 });
                diamondG.moveTo(cx, cy - s - 3);
                diamondG.lineTo(cx + s + 3, cy);
                diamondG.lineTo(cx, cy + s + 3);
                diamondG.lineTo(cx - s - 3, cy);
                diamondG.closePath();
                diamondG.stroke();

                // Inner diamond
                diamondG.fill({ color: gateCoreColor, alpha: 1 });
                diamondG.moveTo(cx, cy - s);
                diamondG.lineTo(cx + s, cy);
                diamondG.lineTo(cx, cy + s);
                diamondG.lineTo(cx - s, cy);
                diamondG.closePath();
                diamondG.fill();
            };

            const drawHover = () => {
                diamondG.clear();
                diamondG.setStrokeStyle({ width: 2.5, color: gateCoreColor, alpha: 0.95 });
                diamondG.moveTo(cx, cy - s - 2);
                diamondG.lineTo(cx + s + 2, cy);
                diamondG.lineTo(cx, cy + s + 2);
                diamondG.lineTo(cx - s - 2, cy);
                diamondG.closePath();
                diamondG.stroke();

                diamondG.fill({ color: gateCoreColor, alpha: 0.95 });
                diamondG.moveTo(cx, cy - s);
                diamondG.lineTo(cx + s, cy);
                diamondG.lineTo(cx, cy + s);
                diamondG.lineTo(cx - s, cy);
                diamondG.closePath();
                diamondG.fill();
            };

            drawNormal();
            diamondContainer.addChild(diamondG);

            // Gate Label
            const theta = gate.theta ?? (Math.PI / 2);
            const prob = Math.sin(theta / 2) ** 2;
            const isH = Math.abs(prob - 0.5) < 0.02;
            let gateText = isH ? (isPhaseGate ? 'H±' : 'H') : `H(${Math.round(prob * 100)}%)`;

            const label = new PIXI.Text({
                text: gateText,
                style: {
                    fontFamily: '"Inter", monospace, sans-serif',
                    fontSize: 9,
                    fill: isPhaseGate ? 0x92400e : 0x0369a1,
                    fontWeight: 'bold',
                },
            });
            label.anchor.set(0.5, 1);
            label.x = cx;
            label.y = cy - s - 5;
            diamondContainer.addChild(label);

            // Hit area for clicking or right-clicking the diamond
            const hitArea = new PIXI.Graphics();
            hitArea.fill({ color: 0x000000, alpha: 0.001 });
            hitArea.rect(cx - 18, cy - 18, 36, 36);
            hitArea.fill();
            hitArea.eventMode = 'static';
            hitArea.hitArea = new PIXI.Rectangle(cx - 18, cy - 18, 36, 36);
            hitArea.cursor = 'pointer';

            // Hover state: subtle accent, no tooltip text change
            hitArea.on('pointerover', () => {
                drawHover();
            });

            hitArea.on('pointerout', () => {
                drawNormal();
            });

            const handleGateInteraction = (e) => {
                e.stopPropagation();
                if (e.nativeEvent?.preventDefault) {
                    e.nativeEvent.preventDefault();
                }

                // Open context menu (slider + delete option)
                const canvasRect = document.querySelector('canvas')?.getBoundingClientRect() || { left: 0, top: 0 };
                const screenX = e.nativeEvent?.clientX ?? (canvasRect.left + (e.global?.x ?? cx));
                const screenY = e.nativeEvent?.clientY ?? (canvasRect.top + (e.global?.y ?? cy));
                this.emit('gate-contextmenu', {
                    qubitId: this.qubitId,
                    gateId: gate.id,
                    gate,
                    screenX,
                    screenY,
                });
            };

            hitArea.on('pointerdown', handleGateInteraction);
            hitArea.on('rightdown', handleGateInteraction);
            hitArea.on('rightclick', handleGateInteraction);
            hitArea.on('click', handleGateInteraction);

            diamondContainer.addChild(hitArea);
            this.gateContainer.addChild(diamondContainer);
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

        const baseRadius = 8;
        const glowRadius = baseRadius + 6 * pulse;

        // Outer glow
        g.fill({ color: 0x0284c7, alpha: 0.12 * pulse });
        g.circle(x, this.lineY, glowRadius + 4);
        g.fill();

        // Mid glow
        g.fill({ color: 0x38bdf8, alpha: 0.25 * pulse });
        g.circle(x, this.lineY, glowRadius);
        g.fill();

        // Core dot
        g.fill({ color: 0x0284c7, alpha: 1 });
        g.circle(x, this.lineY, 4.5);
        g.fill();
    }

    /**
     * Obvious, clickable Story Beat Node Card at the beginning of the line.
     * Features prominent "✎ Edit" icon and hover affordance.
     */
    _buildStartNodeCard() {
        this.startCard = new PIXI.Container();
        const cardX = this.lineX;
        const cardY = this.lineY - 14;
        const cardW = this.START_NODE_WIDTH;
        const cardH = 28;

        // Card background pill
        const cardBg = new PIXI.Graphics();
        const drawCardBg = (isHover) => {
            cardBg.clear();
            // Background fill
            cardBg.fill({ color: isHover ? 0xf0f9ff : 0xffffff, alpha: 0.98 });
            cardBg.setStrokeStyle({
                width: isHover ? 2 : 1.5,
                color: isHover ? 0x0284c7 : 0xbae6fd,
                alpha: 1,
            });
            cardBg.roundRect(cardX, cardY, cardW, cardH, 8);
            cardBg.fill();
            cardBg.stroke();
        };
        drawCardBg(false);
        this.startCard.addChild(cardBg);

        // State indicator dot (small pulsing cyan circle on the left)
        const nodeDot = new PIXI.Graphics();
        nodeDot.fill({ color: 0x0284c7, alpha: 1 });
        nodeDot.circle(cardX + 12, this.lineY, 4);
        nodeDot.fill();
        this.startCard.addChild(nodeDot);

        // Character / Beat Name Text
        this.cardLabel = new PIXI.Text({
            text: this.qubitName,
            style: {
                fontFamily: '"Inter", system-ui, sans-serif',
                fontSize: 11,
                fontWeight: '600',
                fill: 0x0f172a, // dark slate
            },
        });
        this.cardLabel.x = cardX + 22;
        this.cardLabel.y = cardY + 7;
        this.startCard.addChild(this.cardLabel);

        // "✎ Edit" hint badge on the right
        const editHint = new PIXI.Text({
            text: '✎ Edit',
            style: {
                fontFamily: '"Inter", system-ui, sans-serif',
                fontSize: 9,
                fontWeight: '600',
                fill: 0x0284c7,
            },
        });
        editHint.x = cardX + cardW - 36;
        editHint.y = cardY + 8;
        this.startCard.addChild(editHint);

        // Clickable hit zone for the card
        const cardHit = new PIXI.Graphics();
        cardHit.fill({ color: 0x000000, alpha: 0.001 });
        cardHit.roundRect(cardX, cardY, cardW, cardH, 8);
        cardHit.fill();
        cardHit.eventMode = 'static';
        cardHit.cursor = 'pointer';

        cardHit.on('pointerover', () => {
            drawCardBg(true);
            editHint.style.fill = 0x0369a1;
        });

        cardHit.on('pointerout', () => {
            drawCardBg(false);
            editHint.style.fill = 0x0284c7;
        });

        cardHit.on('pointerdown', (e) => {
            e.stopPropagation();
            this.emit('edit-narrative', { qubitId: this.qubitId });
        });

        this.startCard.addChild(cardHit);

        // Delete button (✕) to the left of the card
        const delContainer = new PIXI.Container();
        delContainer.x = cardX - 16;
        delContainer.y = this.lineY;

        const delBg = new PIXI.Graphics();
        delBg.fill({ color: 0xffffff, alpha: 0.95 });
        delBg.setStrokeStyle({ width: 1, color: 0xcbd5e1, alpha: 1 });
        delBg.circle(0, 0, 7.5);
        delBg.fill();
        delBg.stroke();

        const delText = new PIXI.Text({
            text: '✕',
            style: {
                fontFamily: 'system-ui, sans-serif',
                fontSize: 8,
                fill: 0x64748b,
            },
        });
        delText.anchor.set(0.5, 0.5);

        delContainer.addChild(delBg);
        delContainer.addChild(delText);
        delContainer.eventMode = 'static';
        delContainer.cursor = 'pointer';

        delContainer.on('pointerover', () => {
            delBg.clear();
            delBg.fill({ color: 0xef4444, alpha: 1 });
            delBg.circle(0, 0, 7.5);
            delBg.fill();
            delText.style.fill = 0xffffff;
        });
        delContainer.on('pointerout', () => {
            delBg.clear();
            delBg.fill({ color: 0xffffff, alpha: 0.95 });
            delBg.setStrokeStyle({ width: 1, color: 0xcbd5e1, alpha: 1 });
            delBg.circle(0, 0, 7.5);
            delBg.fill();
            delBg.stroke();
            delText.style.fill = 0x64748b;
        });
        delContainer.on('pointerdown', (e) => {
            e.stopPropagation();
            this.emit('remove-worldline', { qubitId: this.qubitId });
        });

        this.addChild(delContainer);
        this.addChild(this.startCard);
    }

    _buildHitArea() {
        const startX = this.lineX + this.START_NODE_WIDTH + 8;
        const totalUsableWidth = this.lineWidth - this.START_NODE_WIDTH - 8;

        this.hitZone = new PIXI.Graphics();
        this.hitZone.fill({ color: 0x000000, alpha: 0.001 });
        this.hitZone.rect(startX, this.lineY - 20, totalUsableWidth, 40);
        this.hitZone.fill();

        this.hitZone.eventMode = 'static';
        this.hitZone.hitArea = new PIXI.Rectangle(startX, this.lineY - 20, totalUsableWidth, 40);
        this.hitZone.cursor = 'crosshair';

        // Click vs drag: click places gate, drag starts connection thread
        this.hitZone.on('pointerdown', (e) => {
            // Ignore right-click on the line
            if (e.button === 2 || e.nativeEvent?.button === 2) return;
            this._pointerDownTime = Date.now();
            this._pointerDownX = e.global.x;
            this._pointerDownY = e.global.y;
            this._isDragging = false;
            this.emit('line-down', {
                qubitId: this.qubitId,
                x: e.global.x,
                y: this.lineY,
            });
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
            const wasDown = this._pointerDownTime > 0;
            this._pointerDownTime = 0;

            // Ignore right-click events
            if (e.button === 2 || e.nativeEvent?.button === 2) {
                this._isDragging = false;
                return;
            }

            if (wasDown && !this._isDragging && elapsed < this._CLICK_MAX_MS) {
                const clickX = e.global.x;
                const isOnGate = this.gates.some(gate => {
                    const gateX = startX + gate.position * totalUsableWidth;
                    return Math.abs(clickX - gateX) < 18;
                });

                if (!isOnGate) {
                    // Place a new H gate
                    const position = Math.max(0.05, Math.min(0.95,
                        (clickX - startX) / totalUsableWidth
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
    //  QUERIES & UPDATES
    // ═══════════════════════════════════════════════════════════════════════

    _shouldShimmer() {
        return this.isUncertain;
    }

    _getShimmerStartFraction() {
        if (this.gates.length === 0) return 0;
        return Math.min(...this.gates.map(g => g.position));
    }

    isNearY(globalY) {
        return Math.abs(globalY - this.lineY) < 25;
    }

    setHover(cursorX, isNear) {
        this._hoverActive = isNear;
        const startX = this.lineX + this.START_NODE_WIDTH + 8;
        if (isNear) {
            this._hoverX = Math.max(startX, Math.min(this.lineX + this.lineWidth, cursorX));
        }
    }

    updateData({ name, gates, isUncertain, hasPhaseInterference, scrubberPosition, uncertainSegments }) {
        if (name !== undefined && name !== this.qubitName) {
            this.qubitName = name;
            if (this.cardLabel) this.cardLabel.text = name;
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
        if (hasPhaseInterference !== undefined && hasPhaseInterference !== this.hasPhaseInterference) {
            this.hasPhaseInterference = hasPhaseInterference;
            needsRedraw = true;
        }
        if (scrubberPosition !== undefined && scrubberPosition !== this.scrubberPosition) {
            this.scrubberPosition = scrubberPosition;
            needsRedraw = true;
        }
        if (uncertainSegments !== undefined) {
            this.uncertainSegments = uncertainSegments;
            needsRedraw = true;
        }
        if (needsRedraw) {
            this._drawStaticLine();
            this._drawGateDiamonds();
        }
    }

    tick(dt) {
        // Slow, elegant quantum wave speed (reduced by ~3.5x from 0.05)
        this._time += dt * 0.015;
        this._updateShimmer();
        this._updateHoverDot();
    }

    _updateShimmer() {
        const g = this.shimmerLine;
        g.clear();

        const uncIntervals = this._getClampedUncertainIntervals();
        if (uncIntervals.length === 0) return;

        const startX = this.lineX + this.START_NODE_WIDTH + 8;
        const totalUsableWidth = this.lineWidth - this.START_NODE_WIDTH - 8;

        const step = 4;
        const glowColor = this.hasPhaseInterference ? 0xf59e0b : 0x38bdf8;
        const coreColor = this.hasPhaseInterference ? 0xd97706 : 0x0284c7;
        const rippleColor = this.hasPhaseInterference ? 0xec4899 : 0x6366f1;

        for (const intv of uncIntervals) {
            const sx = startX + intv.start * totalUsableWidth;
            const ex = startX + intv.end * totalUsableWidth;
            if (ex <= sx + 2) continue;

            // 1. Soft glowing outer superposition wave (smooth, wide crests)
            const glowPulse = 0.35 + 0.15 * Math.sin(this._time * 1.5);
            g.setStrokeStyle({ width: 5.5, color: glowColor, alpha: glowPulse });
            g.moveTo(sx, this.lineY + Math.sin(this._time * 1.8 + sx * 0.032) * 3.0);
            for (let px = sx + step; px < ex; px += step) {
                const y = this.lineY + Math.sin(this._time * 1.8 + px * 0.032) * 3.0;
                g.lineTo(px, y);
            }
            g.lineTo(ex, this.lineY + Math.sin(this._time * 1.8 + ex * 0.032) * 3.0);
            g.stroke();

            // 2. High-contrast core wave (richly visible, calm flow)
            const coreAlpha = 0.85 + 0.12 * Math.sin(this._time * 1.2 + 1);
            g.setStrokeStyle({ width: 2.8, color: coreColor, alpha: Math.min(1.0, coreAlpha) });
            g.moveTo(sx, this.lineY + Math.sin(this._time * 1.8 + sx * 0.032) * 3.0);
            for (let px = sx + step; px < ex; px += step) {
                const y = this.lineY + Math.sin(this._time * 1.8 + px * 0.032) * 3.0;
                g.lineTo(px, y);
            }
            g.lineTo(ex, this.lineY + Math.sin(this._time * 1.8 + ex * 0.032) * 3.0);
            g.stroke();

            // 3. Counter-phase harmonic ripple (quantum interference look)
            const rippleAlpha = 0.7 + 0.2 * Math.cos(this._time * 1.4);
            g.setStrokeStyle({ width: 1.8, color: rippleColor, alpha: Math.min(0.95, rippleAlpha) });
            g.moveTo(sx, this.lineY - Math.sin(this._time * 1.4 + sx * 0.025) * 2.0);
            for (let px = sx + step; px < ex; px += step) {
                const y = this.lineY - Math.sin(this._time * 1.4 + px * 0.025) * 2.0;
                g.lineTo(px, y);
            }
            g.lineTo(ex, this.lineY - Math.sin(this._time * 1.4 + ex * 0.025) * 2.0);
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
}
