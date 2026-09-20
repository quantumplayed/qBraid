import * as PIXI from 'pixi.js';
import Worldline from './Worldline.js';

/**
 * Main Pixi.js scene for the Narrative Entangler.
 * Manages worldlines, hover broadcasting, drag-to-connect threads,
 * gate placement events, and narrative editing.
 */
export default class PixiScene {
  constructor(options) {
    this.container = options.container;
    this.qubits = options.qubits || [];
    this.connections = options.connections || [];
    this.qubitUncertainty = options.qubitUncertainty || {};

    // Callbacks
    this.onCNOTCreate = options.onCNOTCreate || (() => { });
    this.onToggleConnectionParity = options.onToggleConnectionParity || (() => { });
    this.onEditQubit = options.onEditQubit || (() => { });
    this.onPlaceGate = options.onPlaceGate || (() => { });
    this.onEditGate = options.onEditGate || (() => { });
    this.onGateContextMenu = options.onGateContextMenu || (() => { });
    this.onRemoveGate = options.onRemoveGate || (() => { });
    this.onRemoveConnection = options.onRemoveConnection || (() => { });
    this.onRemoveWorldline = options.onRemoveWorldline || (() => { });
    this.onAddWorldline = options.onAddWorldline || (() => { });

    this.app = null;
    this.stage = null;
    this.isInitializing = true;
    this.isDestroyed = false;

    /** @type {Worldline[]} */
    this.worldlines = [];

    // Drag thread state
    this._dragActive = false;
    this._dragSourceId = null;
    this._dragSourceX = 0;
    this._dragSourceY = 0;
    this._dragCurrentX = 0;
    this._dragCurrentY = 0;
    this._dragTime = 0;
    this._dragThread = null;

    // Cursor tracking
    this._cursorX = -1000;
    this._cursorY = -1000;

    // Layers
    this._connectionLayer = null;
    this._worldlineLayer = null;

    // Ready flag
    this._ready = false;
    this._pendingQubits = null;
    this._pendingConnections = null;
    this._pendingUncertainty = null;

    this.resizeHandler = null;
    this.init();
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  INITIALISATION
  // ═══════════════════════════════════════════════════════════════════════

  async init() {
    try {
      this.app = new PIXI.Application();

      await this.app.init({
        width: this.container.clientWidth,
        height: this.container.clientHeight,
        backgroundColor: 0xf8fafc, // Modern Bright Studio Canvas
        antialias: true,
        resolution: window.devicePixelRatio,
        autoDensity: true,
      });

      if (this.isDestroyed) {
        this.app.destroy();
        return;
      }

      this.container.appendChild(this.app.canvas);
      this.app.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
      this.stage = this.app.stage;

      // Layers (bottom to top: worldlines -> connections -> drag thread)
      this._worldlineLayer = new PIXI.Container();
      this.stage.addChild(this._worldlineLayer);

      this._connectionLayer = new PIXI.Container();
      this.stage.addChild(this._connectionLayer);

      this._dragThread = new PIXI.Graphics();
      this.stage.addChild(this._dragThread);

      this._rebuildWorldlines();

      // Stage-level pointer tracking
      this.stage.interactive = true;
      this.stage.hitArea = new PIXI.Rectangle(
        0, 0,
        this.container.clientWidth,
        this.container.clientHeight
      );

      this.stage.on('pointermove', (e) => this._onPointerMove(e));
      this.stage.on('pointerup', (e) => this._onPointerUp(e));
      this.stage.on('pointerupoutside', (e) => this._onPointerUp(e));

      this.app.ticker.add((ticker) => this._tick(ticker));

      this.resizeObserver = new ResizeObserver(() => this._onResize());
      this.resizeObserver.observe(this.container);

      this.isInitializing = false;
      this._ready = true;

      // Flush pending updates
      if (this._pendingQubits) {
        this.updateQubits(this._pendingQubits);
        this._pendingQubits = null;
      }
      if (this._pendingConnections) {
        this.updateConnections(this._pendingConnections);
        this._pendingConnections = null;
      }
      if (this._pendingUncertainty) {
        this.updateUncertainty(this._pendingUncertainty);
        this._pendingUncertainty = null;
      }
    } catch (error) {
      this.isInitializing = false;
      console.error('Error initializing Pixi scene:', error);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  WORLDLINE MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════

  _getLayout() {
    const padding = 80;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    const lineWidth = w - padding * 2;
    const count = Math.max(this.qubits.length, 1);
    const lineSpacing = (h - padding * 2) / (count + 1);

    return { padding, lineWidth, lineSpacing, w, h };
  }

  _rebuildWorldlines() {
    // Remove old
    for (const wl of this.worldlines) {
      this._worldlineLayer.removeChild(wl);
      wl.destroy({ children: true });
    }
    this.worldlines = [];

    const { padding, lineWidth, lineSpacing } = this._getLayout();

    for (let i = 0; i < this.qubits.length; i++) {
      const q = this.qubits[i];
      const y = padding + lineSpacing * (i + 1);
      const isUncertain = this.qubitUncertainty[q.id] ?? false;

      const wl = new Worldline({
        id: q.id,
        name: q.name,
        y,
        x: padding,
        lineWidth,
        gates: q.gates || [],
        isUncertain,
      });

      // Event listeners
      wl.on('drag-start', (data) => this._onDragStart(data));
      wl.on('edit-narrative', (data) => {
        const qubit = this.qubits.find(q => q.id === data.qubitId);
        if (qubit) this.onEditQubit(qubit);
      });
      wl.on('place-gate', (data) => {
        this.onPlaceGate(data.qubitId, data.position);
      });
      wl.on('edit-gate', (data) => {
        this.onEditGate(data);
      });
      wl.on('gate-contextmenu', (data) => {
        this.onGateContextMenu(data);
      });
      wl.on('remove-gate', (data) => {
        this.onRemoveGate(data.qubitId, data.gateId);
      });
      wl.on('remove-worldline', (data) => {
        this.onRemoveWorldline(data.qubitId);
      });

      this._worldlineLayer.addChild(wl);
      this.worldlines.push(wl);
    }

    // "+" add worldline button below the last worldline
    this._buildAddButton();

    this._drawConnections();
  }

  _buildAddButton() {
    // Remove old button if it exists
    if (this._addBtn) {
      this._worldlineLayer.removeChild(this._addBtn);
      this._addBtn.destroy({ children: true });
      this._addBtn = null;
    }

    const { padding, lineSpacing } = this._getLayout();
    const lastY = padding + lineSpacing * (this.qubits.length + 1);

    this._addBtn = new PIXI.Container();

    // "+" circle
    const circle = new PIXI.Graphics();
    circle.setStrokeStyle({ width: 1.5, color: 0x0284c7, alpha: 0.8 });
    circle.circle(padding, lastY, 10);
    circle.stroke();

    // "+" text
    const plus = new PIXI.Text({
      text: '+',
      style: {
        fontFamily: '"Inter", system-ui, sans-serif',
        fontSize: 15,
        fontWeight: 'bold',
        fill: 0x0284c7,
      },
    });
    plus.anchor.set(0.5, 0.5);
    plus.x = padding;
    plus.y = lastY;

    // Label
    const label = new PIXI.Text({
      text: 'Add Story Beat',
      style: {
        fontFamily: '"Inter", system-ui, sans-serif',
        fontSize: 11,
        fontWeight: '600',
        fill: 0x0f172a, // dark slate
        letterSpacing: 0.5,
      },
    });
    label.x = padding + 18;
    label.y = lastY - 7;

    this._addBtn.addChild(circle);
    this._addBtn.addChild(plus);
    this._addBtn.addChild(label);

    // Hit zone
    const hitZone = new PIXI.Graphics();
    hitZone.fill({ color: 0x000000, alpha: 0.001 });
    hitZone.rect(padding - 15, lastY - 15, 150, 30);
    hitZone.fill();
    hitZone.interactive = true;
    hitZone.cursor = 'pointer';

    hitZone.on('pointerover', () => {
      plus.style.fill = 0x0369a1;
      circle.clear();
      circle.setStrokeStyle({ width: 2, color: 0x0369a1, alpha: 1 });
      circle.circle(padding, lastY, 10);
      circle.stroke();
      label.style.fill = 0x0284c7;
    });
    hitZone.on('pointerout', () => {
      plus.style.fill = 0x0284c7;
      circle.clear();
      circle.setStrokeStyle({ width: 1.5, color: 0x0284c7, alpha: 0.8 });
      circle.circle(padding, lastY, 10);
      circle.stroke();
      label.style.fill = 0x0f172a;
    });
    hitZone.on('pointerdown', (e) => {
      e.stopPropagation();
      this.onAddWorldline();
    });

    this._addBtn.addChild(hitZone);
    this._worldlineLayer.addChild(this._addBtn);
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  CONNECTIONS (inter-worldline CNOT gates)
  // ═══════════════════════════════════════════════════════════════════════

  _drawConnections() {
    this._connectionLayer.removeChildren();

    for (let ci = 0; ci < this.connections.length; ci++) {
      const conn = this.connections[ci];
      if (conn.type !== 'CNOT') continue;

      const controlWl = this.worldlines[conn.control];
      const targetWl = this.worldlines[conn.target];
      if (!controlWl || !targetWl) continue;

      const pos = conn.position ?? 0.5;
      const usableStart = controlWl.lineX + 138;
      const usableWidth = controlWl.lineWidth - 138;
      const x = usableStart + usableWidth * pos;
      const y1 = controlWl.lineY;
      const y2 = targetWl.lineY;
      const isOdd = conn.parity === 'odd';

      const connContainer = new PIXI.Container();

      // Theme colors based on parity (Modern Bright)
      const strokeColor = isOdd ? 0xd97706 : 0x7c3aed; // Amber vs Royal Purple
      const glowColor = isOdd ? 0xfde68a : 0xddd6fe;
      const badgeBg = 0xffffff;
      const badgeBorder = isOdd ? 0xd97706 : 0x7c3aed;
      const textColor = isOdd ? 0xb45309 : 0x6d28d9;

      const g = new PIXI.Graphics();

      // Vertical line glow
      g.setStrokeStyle({ width: 5, color: glowColor, alpha: 0.5 });
      g.moveTo(x, y1);
      g.lineTo(x, y2);
      g.stroke();

      // Vertical line core
      g.setStrokeStyle({ width: 2, color: strokeColor, alpha: 0.95 });
      g.moveTo(x, y1);
      g.lineTo(x, y2);
      g.stroke();

      // Control dot (filled circle with halo)
      g.fill({ color: glowColor, alpha: 0.6 });
      g.circle(x, y1, 8);
      g.fill();

      g.fill({ color: strokeColor, alpha: 1 });
      g.circle(x, y1, 5);
      g.fill();

      // Target ⊕ symbol (circle with plus)
      const tR = 9;
      g.setStrokeStyle({ width: 2, color: strokeColor, alpha: 1 });
      g.circle(x, y2, tR);
      g.stroke();
      g.moveTo(x - tR, y2);
      g.lineTo(x + tR, y2);
      g.stroke();
      g.moveTo(x, y2 - tR);
      g.lineTo(x, y2 + tR);
      g.stroke();

      // Extra notch for odd parity target (inversion indicator)
      if (isOdd) {
        g.fill({ color: 0xd97706, alpha: 0.9 });
        g.circle(x, y2, 3);
        g.fill();
      }

      connContainer.addChild(g);

      // Midpoint for parity badge
      const midY = (y1 + y2) / 2;

      // Parity Pill Container
      const badgeContainer = new PIXI.Container();
      badgeContainer.x = x;
      badgeContainer.y = midY;

      const badgeWidth = 90;
      const badgeHeight = 24;

      const badgeGraphics = new PIXI.Graphics();
      badgeGraphics.fill({ color: badgeBg, alpha: 0.98 });
      badgeGraphics.setStrokeStyle({ width: 1.5, color: badgeBorder, alpha: 1 });
      badgeGraphics.roundRect(-badgeWidth / 2, -badgeHeight / 2, badgeWidth, badgeHeight, 12);
      badgeGraphics.fill();
      badgeGraphics.stroke();
      badgeContainer.addChild(badgeGraphics);

      const badgeText = new PIXI.Text({
        text: isOdd ? '≠ ODD PARITY' : '= EVEN PARITY',
        style: {
          fontFamily: '"Inter", monospace, system-ui',
          fontSize: 9,
          fontWeight: 'bold',
          fill: textColor,
          letterSpacing: 0.5,
        },
      });
      badgeText.anchor.set(0.5, 0.5);
      badgeContainer.addChild(badgeText);

      // Interactive toggle hit area for parity badge
      badgeGraphics.interactive = true;
      badgeGraphics.cursor = 'pointer';

      const connId = conn.id;
      badgeGraphics.on('pointerdown', (e) => {
        e.stopPropagation();
        this.onToggleConnectionParity(connId);
      });
      badgeGraphics.on('pointerover', () => {
        badgeGraphics.setStrokeStyle({ width: 2, color: isOdd ? 0xb45309 : 0x5b21b6, alpha: 1 });
        badgeGraphics.stroke();
      });
      badgeGraphics.on('pointerout', () => {
        badgeGraphics.setStrokeStyle({ width: 1.5, color: badgeBorder, alpha: 1 });
        badgeGraphics.stroke();
      });

      // Small Delete Button (✕) next to the badge
      const delContainer = new PIXI.Container();
      delContainer.x = x + badgeWidth / 2 + 14;
      delContainer.y = midY;

      const delBg = new PIXI.Graphics();
      delBg.fill({ color: 0xffffff, alpha: 0.98 });
      delBg.setStrokeStyle({ width: 1, color: 0xcbd5e1, alpha: 1 });
      delBg.circle(0, 0, 8);
      delBg.fill();
      delBg.stroke();

      const delText = new PIXI.Text({
        text: '✕',
        style: {
          fontFamily: 'system-ui',
          fontSize: 9,
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
        delBg.circle(0, 0, 8);
        delBg.fill();
        delText.style.fill = 0xffffff;
      });
      delContainer.on('pointerout', () => {
        delBg.clear();
        delBg.fill({ color: 0xffffff, alpha: 0.98 });
        delBg.setStrokeStyle({ width: 1, color: 0xcbd5e1, alpha: 1 });
        delBg.circle(0, 0, 8);
        delBg.fill();
        delBg.stroke();
        delText.style.fill = 0x64748b;
      });
      delContainer.on('pointerdown', (e) => {
        e.stopPropagation();
        this.onRemoveConnection(connId);
      });

      connContainer.addChild(badgeContainer);
      connContainer.addChild(delContainer);
      this._connectionLayer.addChild(connContainer);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  POINTER / DRAG
  // ═══════════════════════════════════════════════════════════════════════

  _onPointerMove(e) {
    this._cursorX = e.global.x;
    this._cursorY = e.global.y;

    for (const wl of this.worldlines) {
      const isNear = wl.isNearY(this._cursorY);
      wl.setHover(this._cursorX, isNear && !this._dragActive);
    }

    if (this._dragActive) {
      this._dragCurrentX = this._cursorX;
      this._dragCurrentY = this._cursorY;
    }
  }

  _onDragStart(data) {
    this._dragActive = true;
    this._dragSourceId = data.qubitId;
    this._dragSourceX = data.x;
    this._dragSourceY = data.y;
    this._dragCurrentX = data.x;
    this._dragCurrentY = data.y;
    this._dragTime = 0;

    for (const wl of this.worldlines) {
      wl.setHover(0, false);
    }
  }

  _onPointerUp(_e) {
    if (!this._dragActive) return;

    for (const wl of this.worldlines) {
      if (wl.qubitId === this._dragSourceId) continue;
      if (wl.isNearY(this._dragCurrentY)) {
        const sourceIdx = this.qubits.findIndex(q => q.id === this._dragSourceId);
        const targetIdx = this.qubits.findIndex(q => q.id === wl.qubitId);
        if (sourceIdx !== -1 && targetIdx !== -1) {
          // Calculate position from drag start x
          const sourceWl = this.worldlines[sourceIdx];
          const position = sourceWl
            ? Math.max(0.05, Math.min(0.95, (this._dragSourceX - sourceWl.lineX) / sourceWl.lineWidth))
            : 0.5;
          this.onCNOTCreate(sourceIdx, targetIdx, position);
        }
        break;
      }
    }

    this._dragActive = false;
    this._dragThread.clear();
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  TICK
  // ═══════════════════════════════════════════════════════════════════════

  _tick(ticker) {
    const dt = ticker.deltaTime;
    for (const wl of this.worldlines) {
      wl.tick(dt);
    }
    if (this._dragActive) {
      this._dragTime += dt * 0.05;
      this._drawDragThread();
    }
  }

  _drawDragThread() {
    const g = this._dragThread;
    g.clear();

    const sx = this._dragSourceX;
    const sy = this._dragSourceY;
    const ex = this._dragCurrentX;
    const ey = this._dragCurrentY;

    let snapY = ey;
    let snapped = false;
    for (const wl of this.worldlines) {
      if (wl.qubitId === this._dragSourceId) continue;
      if (wl.isNearY(ey)) {
        snapY = wl.lineY;
        snapped = true;
        break;
      }
    }

    const dx = ex - sx;
    const dy = snapY - sy;
    const cp1x = sx + dx * 0.4;
    const cp1y = sy + dy * 0.1;
    const cp2x = sx + dx * 0.6;
    const cp2y = snapY - dy * 0.1;

    const pulse = 0.6 + Math.sin(this._dragTime * 6) * 0.4;

    // Wide glow
    g.setStrokeStyle({ width: 10, color: 0xa855f7, alpha: 0.12 * pulse });
    g.moveTo(sx, sy);
    g.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, ex, snapY);
    g.stroke();

    // Medium glow
    g.setStrokeStyle({ width: 5, color: 0xa855f7, alpha: 0.3 * pulse });
    g.moveTo(sx, sy);
    g.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, ex, snapY);
    g.stroke();

    // Core line
    g.setStrokeStyle({ width: 2, color: 0xc084fc, alpha: 0.9 });
    g.moveTo(sx, sy);
    g.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, ex, snapY);
    g.stroke();

    // Source dot
    g.fill({ color: 0xa855f7, alpha: 0.9 });
    g.circle(sx, sy, 6);
    g.fill();
    g.fill({ color: 0xffffff, alpha: 0.5 });
    g.circle(sx, sy, 2.5);
    g.fill();

    // Target indicator
    if (snapped) {
      const indicatorPulse = 4 + Math.sin(this._dragTime * 8) * 2;
      g.setStrokeStyle({ width: 2, color: 0xa855f7, alpha: 0.8 });
      g.circle(ex, snapY, indicatorPulse + 4);
      g.stroke();
      g.fill({ color: 0xa855f7, alpha: 0.25 });
      g.circle(ex, snapY, indicatorPulse + 4);
      g.fill();
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  PUBLIC API
  // ═══════════════════════════════════════════════════════════════════════

  updateQubits(qubits) {
    if (!this._ready) {
      this._pendingQubits = qubits;
      return;
    }

    const changed = qubits.length !== this.qubits.length ||
      qubits.some((q, i) => q.id !== this.qubits[i]?.id);

    this.qubits = qubits;

    if (changed) {
      this._rebuildWorldlines();
    } else {
      for (let i = 0; i < qubits.length; i++) {
        if (this.worldlines[i]) {
          this.worldlines[i].updateData({
            name: qubits[i].name,
            gates: qubits[i].gates || [],
            isUncertain: this.qubitUncertainty[qubits[i].id] ?? false,
          });
        }
      }
    }
  }

  updateConnections(connections) {
    if (!this._ready) {
      this._pendingConnections = connections;
      return;
    }
    this.connections = connections;
    this._drawConnections();
  }

  updateUncertainty(uncertainty) {
    if (!this._ready) {
      this._pendingUncertainty = uncertainty;
      return;
    }
    this.qubitUncertainty = uncertainty;
    // Update each worldline's isUncertain flag
    for (let i = 0; i < this.worldlines.length; i++) {
      const q = this.qubits[i];
      if (q && this.worldlines[i]) {
        this.worldlines[i].updateData({
          isUncertain: uncertainty[q.id] ?? false,
        });
      }
    }
  }

  _onResize() {
    if (!this.app) return;
    this.app.renderer.resize(
      this.container.clientWidth,
      this.container.clientHeight
    );
    if (this.stage) {
      this.stage.hitArea = new PIXI.Rectangle(
        0, 0,
        this.container.clientWidth,
        this.container.clientHeight
      );
    }
    this._rebuildWorldlines();
  }

  destroy() {
    this.isDestroyed = true;
    try {
      if (this.resizeObserver) {
        this.resizeObserver.disconnect();
      }
      if (this.app && !this.isInitializing) {
        if (this.app.canvas && this.app.canvas.parentNode) {
          this.app.canvas.parentNode.removeChild(this.app.canvas);
        }
        try {
          this.app.destroy();
        } catch (e) {
          console.warn('PIXI destroy warning:', e.message);
        }
      }
    } catch (error) {
      console.error('Error destroying Pixi scene:', error);
    }
  }
}
