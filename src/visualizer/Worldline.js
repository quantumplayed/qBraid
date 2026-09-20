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
    constructor({ id, name, y, x, lineWidth, gates = [], isUncertain = false }) {
        super();

        this.qubitId = id;
        this.qubitName = name;
        this.lineY = y;
        this.lineX = x;
        this.lineWidth = lineWidth;
        this.gates = gates;
        this.isUncertain = isUncertain;

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

    _drawStaticLine() {
        const g = this.staticLine;
        g.clear();

        const startX = this.lineX + this.START_NODE_WIDTH + 8;
        const totalUsableWidth = this.lineWidth - this.START_NODE_WIDTH - 8;

        const endX = this._shouldShimmer()
            ? startX + this._getShimmerStartFraction() * totalUsableWidth
            : this.lineX + this.lineWidth;

        // Soft sky glow
        g.setStrokeStyle({ width: 5, color: 0x38bdf8, alpha: 0.22 });
        g.moveTo(startX, this.lineY);
        g.lineTo(endX, this.lineY);
        g.stroke();

        // Core line in rich sky blue
        g.setStrokeStyle({ width: 2.5, color: 0x0284c7, alpha: 1 });
        g.moveTo(startX, this.lineY);
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

        const startX = this.lineX + this.START_NODE_WIDTH + 8;
        const totalUsableWidth = this.lineWidth - this.START_NODE_WIDTH - 8;

        for (const gate of this.gates) {
            const cx = startX + gate.position * totalUsableWidth;
            const cy = this.lineY;
            const s = 8;

            const diamondContainer = new PIXI.Container();

            // Diamond graphics
            const diamondG = new PIXI.Graphics();

            // Default look
            const drawNormal = () => {
                diamondG.clear();
                // Outer glow
                diamondG.setStrokeStyle({ width: 2, color: 0x0284c7, alpha: 0.4 });
                diamondG.moveTo(cx, cy - s - 3);
                diamondG.lineTo(cx + s + 3, cy);
                diamondG.lineTo(cx, cy + s + 3);
                diamondG.lineTo(cx - s - 3, cy);
                diamondG.closePath();
                diamondG.stroke();

                // Inner diamond
                diamondG.fill({ color: 0x0284c7, alpha: 1 });
                diamondG.moveTo(cx, cy - s);
                diamondG.lineTo(cx + s, cy);
                diamondG.lineTo(cx, cy + s);
                diamondG.lineTo(cx - s, cy);
                diamondG.closePath();
                diamondG.fill();
            };

            const drawHover = () => {
                diamondG.clear();
                // Subtle bright blue outline on hover
                diamondG.setStrokeStyle({ width: 2.5, color: 0x0284c7, alpha: 0.9 });
                diamondG.moveTo(cx, cy - s - 2);
                diamondG.lineTo(cx + s + 2, cy);
                diamondG.lineTo(cx, cy + s + 2);
                diamondG.lineTo(cx - s - 2, cy);
                diamondG.closePath();
                diamondG.stroke();

                // Filled inner diamond
                diamondG.fill({ color: 0x0284c7, alpha: 0.95 });
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
            const gateText = isH ? 'H' : `H(${Math.round(prob * 100)}%)`;

            const label = new PIXI.Text({
                text: gateText,
                style: {
                    fontFamily: '"Inter", monospace, sans-serif',
                    fontSize: 9,
                    fill: 0x0369a1,
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
                const screenX = e.client?.x || e.global?.x || cx;
                const screenY = e.client?.y || e.global?.y || cy;
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
        cardHit.interactive = true;
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
        delContainer.interactive = true;
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

        this.hitZone.interactive = true;
        this.hitZone.cursor = 'default';

        // Click vs drag: click places gate, drag starts connection thread
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

            // Ignore right-click events
            if (e.button === 2 || e.nativeEvent?.button === 2) {
                this._isDragging = false;
                return;
            }

            if (!this._isDragging && elapsed < this._CLICK_MAX_MS) {
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
        if (this.gates.length === 0) return 0.5;
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

    updateData({ name, gates, isUncertain }) {
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
        if (needsRedraw) {
            this._drawStaticLine();
            this._drawGateDiamonds();
        }
    }

    tick(dt) {
        this._time += dt * 0.05;
        this._updateShimmer();
        this._updateHoverDot();
    }

    _updateShimmer() {
        const g = this.shimmerLine;
        g.clear();

        if (!this._shouldShimmer()) return;

        const startX = this.lineX + this.START_NODE_WIDTH + 8;
        const totalUsableWidth = this.lineWidth - this.START_NODE_WIDTH - 8;
        const startFrac = this._getShimmerStartFraction();
        const sx = startX + startFrac * totalUsableWidth;
        const ex = this.lineX + this.lineWidth;
        const segmentCount = Math.max(8, Math.round((ex - sx) / 8));
        const segLen = (ex - sx) / segmentCount;

        // Dynamic light-mode wave
        for (let i = 0; i < segmentCount; i++) {
            const segSx = sx + i * segLen;
            const segEx = segSx + segLen;
            const phase = this._time * 3.0 + i * 0.45;
            const alpha = 0.4 + Math.sin(phase) * 0.3;
            const yOff = Math.sin(phase * 0.7) * 1.5;
            const color = i % 2 === 0 ? 0x0284c7 : 0x6366f1;

            g.setStrokeStyle({ width: 2.5, color, alpha: Math.max(0.2, Math.min(0.9, alpha)) });
            g.moveTo(segSx, this.lineY + yOff);
            g.lineTo(segEx, this.lineY + Math.sin((phase + 0.45) * 0.7) * 1.5);
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
