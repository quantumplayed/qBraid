import * as PIXI from 'pixi.js';
import Worldline from './Worldline.js';

function getControls(conn) {
  if (Array.isArray(conn?.controls)) return conn.controls;
  if (Array.isArray(conn?.control)) return conn.control;
  if (conn?.control !== undefined && conn?.control !== null) return [conn.control];
  return [];
}

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
    this.onAddControlToConnection = options.onAddControlToConnection || (() => { });
    this.onConfigureConnection = options.onConfigureConnection || (() => { });
    this.onEditQubit = options.onEditQubit || (() => { });
    this.onPlaceGate = options.onPlaceGate || (() => { });
    this.onEditGate = options.onEditGate || (() => { });
    this.onGateContextMenu = options.onGateContextMenu || (() => { });
    this.onRemoveGate = options.onRemoveGate || (() => { });
    this.onRemoveConnection = options.onRemoveConnection || (() => { });
    this.onRemoveWorldline = options.onRemoveWorldline || (() => { });
    this.onAddWorldline = options.onAddWorldline || (() => { });
    this.onScrubberChange = options.onScrubberChange || (() => { });

    this.hasPhaseInterference = options.hasPhaseInterference || false;
    this.scrubberPosition = options.scrubberPosition ?? 1.0;
    this.sliceInfo = options.sliceInfo || null;
    this.tutorialState = options.tutorialState || null;

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

    // Timeline Scrubber state
    this._scrubberLayer = null;
    this._scrubberDragging = false;

    // Tutorial Guidance state
    this._tutorialLayer = null;
    this._tutorialTime = 0;

    // Cursor tracking
    this._cursorX = -1000;
    this._cursorY = -1000;

    // Zoom & Pan navigation state
    this.zoom = 1.0;
    this.panX = 0;
    this.scrollY = 0;
    this._isPanning = false;
    this._panStartX = 0;
    this._panStartY = 0;
    this._wheelHandler = null;
    this.onZoomChange = options.onZoomChange || (() => {});

    // Layers & Hierarchy
    this._contentContainer = null;
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
      this.stage = this.app.stage;

      // Reliable DOM contextmenu interception for right-clicking H gates
      this.app.canvas.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        const canvasRect = this.app.canvas.getBoundingClientRect();
        const mouseX = e.clientX - canvasRect.left;
        const mouseY = e.clientY - canvasRect.top;

        // Convert to content coordinates
        const contentX = (mouseX - this.panX) / this.zoom;
        const contentY = (mouseY - this.scrollY) / this.zoom;

        for (const wl of this.worldlines) {
          if (Math.abs(contentY - wl.lineY) < 24) {
            const usableStart = wl.lineX + wl.START_NODE_WIDTH + 8;
            const totalUsableWidth = wl.lineWidth - wl.START_NODE_WIDTH - 8;
            for (const gate of wl.gates) {
              const gx = usableStart + gate.position * totalUsableWidth;
              if (Math.abs(contentX - gx) < 24) {
                this.onGateContextMenu({
                  qubitId: wl.qubitId,
                  gateId: gate.id,
                  gate,
                  screenX: e.clientX,
                  screenY: e.clientY,
                });
                return;
              }
            }
          }
        }
      });

      // Wheel listener for smooth trackpad / mouse scroll and Ctrl+wheel zoom
      this._wheelHandler = (e) => {
        e.preventDefault();
        const canvasRect = this.app.canvas.getBoundingClientRect();
        const mouseX = e.clientX - canvasRect.left;
        const mouseY = e.clientY - canvasRect.top;

        if (e.ctrlKey || e.metaKey) {
          // Zoom in / out toward mouse cursor
          const factor = e.deltaY < 0 ? 1.08 : 0.92;
          this.setZoom(this.zoom * factor, mouseX, mouseY);
        } else {
          // Smooth pan / scroll
          this.scrollY -= e.deltaY;
          this.panX -= e.deltaX;
          this._clampPanAndScroll();
          this._applyContentTransform();
        }
      };
      this.app.canvas.addEventListener('wheel', this._wheelHandler, { passive: false });

      // Transformable Content Container (holds worldlines, connections, drag thread, tutorial)
      this._contentContainer = new PIXI.Container();
      this.stage.addChild(this._contentContainer);

      // Layers inside Content Container (scale and scroll with navigation)
      this._worldlineLayer = new PIXI.Container();
      this._contentContainer.addChild(this._worldlineLayer);

      this._connectionLayer = new PIXI.Container();
      this._connectionLayer.eventMode = 'passive';
      this._contentContainer.addChild(this._connectionLayer);

      this._dragThread = new PIXI.Graphics();
      this._dragThread.eventMode = 'none';
      this._contentContainer.addChild(this._dragThread);

      this._tutorialLayer = new PIXI.Container();
      this._tutorialLayer.eventMode = 'none';
      this._contentContainer.addChild(this._tutorialLayer);

      // Scrubber stays fixed at the viewport bottom directly on stage
      this._scrubberLayer = new PIXI.Container();
      this._scrubberLayer.eventMode = 'passive';
      this.stage.addChild(this._scrubberLayer);

      this._potentialDrag = null;
      this._linePointerDown = null;
      this._rebuildWorldlines();

      // Stage-level pointer tracking (Pixi v8 eventMode)
      this.stage.eventMode = 'static';
      this.stage.hitArea = new PIXI.Rectangle(
        0, 0,
        this.container.clientWidth,
        this.container.clientHeight
      );

      this.stage.on('pointerdown', (e) => this._onPointerDown(e));
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

  _calcStartNodeWidth() {
    let maxLen = 0;
    for (const q of this.qubits) {
      const name = (q.name || '').trim();
      const len = Math.min(name.length, 20) + (name.length > 20 ? 3 : 0);
      if (len > maxLen) maxLen = len;
    }
    const extraChars = Math.max(0, maxLen - 8);
    return Math.min(235, Math.max(130, Math.round(126 + extraChars * 7.4)));
  }

  _getLayout() {
    const padding = 80;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    const startNodeWidth = this._calcStartNodeWidth();
    const nodeOffset = startNodeWidth + 8;
    const lineWidth = w - padding * 2;
    const usableStart = padding + nodeOffset;
    const usableWidth = lineWidth - nodeOffset;
    const count = Math.max(this.qubits.length, 1);
    const minSpacing = count >= 6 ? 60 : 68;
    const lineSpacing = Math.max(minSpacing, (h - padding * 2) / (count + 1));
    const totalContentHeight = padding * 2 + lineSpacing * (count + 1) + 40;

    return { padding, startNodeWidth, nodeOffset, usableStart, usableWidth, lineWidth, lineSpacing, totalContentHeight, w, h };
  }

  _clampPanAndScroll() {
    const { totalContentHeight, lineWidth, padding, w, h } = this._getLayout();
    const scaledHeight = totalContentHeight * this.zoom;
    const scaledWidth = (lineWidth + padding * 2) * this.zoom;

    // Vertical clamping
    if (scaledHeight <= h - 40) {
      this.scrollY = 0;
    } else {
      const minScrollY = (h - 50) - scaledHeight;
      const maxScrollY = 30;
      this.scrollY = Math.min(maxScrollY, Math.max(minScrollY, this.scrollY));
    }

    // Horizontal clamping: keep content on screen
    const minPanX = Math.min(0, w - scaledWidth - 40);
    const maxPanX = Math.max(0, 40);
    this.panX = Math.min(maxPanX, Math.max(minPanX, this.panX));
  }

  _applyContentTransform() {
    if (!this._contentContainer) return;
    this._contentContainer.position.set(this.panX, this.scrollY);
    this._contentContainer.scale.set(this.zoom);
    this._drawScrubber();
  }

  setZoom(newZoom, pivotX = this.container.clientWidth / 2, pivotY = this.container.clientHeight / 2) {
    const clampedZoom = Math.max(0.45, Math.min(2.0, newZoom));
    if (Math.abs(clampedZoom - this.zoom) < 0.001) return;

    const contentX = (pivotX - this.panX) / this.zoom;
    const contentY = (pivotY - this.scrollY) / this.zoom;

    this.zoom = clampedZoom;

    this.panX = pivotX - contentX * this.zoom;
    this.scrollY = pivotY - contentY * this.zoom;

    this._clampPanAndScroll();
    this._applyContentTransform();

    if (this.onZoomChange) {
      this.onZoomChange(this.zoom);
    }
  }

  zoomIn() {
    this.setZoom(this.zoom * 1.2);
  }

  zoomOut() {
    this.setZoom(this.zoom / 1.2);
  }

  resetView() {
    this.zoom = 1.0;
    this.panX = 0;
    this.scrollY = 0;
    this._clampPanAndScroll();
    this._applyContentTransform();
    if (this.onZoomChange) {
      this.onZoomChange(this.zoom);
    }
  }

  fitToScreen() {
    const { totalContentHeight, h } = this._getLayout();
    const availableH = h - 65; // leave room for scrubber
    if (totalContentHeight > availableH) {
      const targetZoom = Math.max(0.48, Math.min(1.0, availableH / totalContentHeight));
      this.zoom = targetZoom;
      this.scrollY = 15;
      this.panX = 0;
      this._clampPanAndScroll();
      this._applyContentTransform();
      if (this.onZoomChange) {
        this.onZoomChange(this.zoom);
      }
    } else {
      this.resetView();
    }
  }

  _rebuildWorldlines() {
    // Remove old
    for (const wl of this.worldlines) {
      this._worldlineLayer.removeChild(wl);
      wl.destroy({ children: true });
    }
    this.worldlines = [];

    const { padding, lineWidth, lineSpacing, startNodeWidth } = this._getLayout();

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
        startNodeWidth,
        gates: q.gates || [],
        isUncertain,
        hasPhaseInterference: this.hasPhaseInterference,
        scrubberPosition: this.scrubberPosition,
        uncertainSegments: this.sliceInfo?.uncertainSegments?.[i] || [],
      });

      // Event listeners
      wl.on('line-down', (data) => {
        this._potentialDrag = data;
      });
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
    this._drawScrubber();
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
        fontFamily: '"Inter", monospace, sans-serif',
        fontSize: 14,
        fill: 0x0284c7,
        fontWeight: 'bold',
      },
    });
    plus.anchor.set(0.5, 0.5);
    plus.x = padding;
    plus.y = lastY;

    // Label "Add Worldline"
    const label = new PIXI.Text({
      text: 'Add Story Worldline',
      style: {
        fontFamily: '"Inter", system-ui, sans-serif',
        fontSize: 11,
        fill: 0x0284c7,
        fontWeight: '500',
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
    hitZone.eventMode = 'static';
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
      label.style.fill = 0x0369a1;
    });
    hitZone.on('pointerdown', (e) => {
      e.stopPropagation();
      if (this.tutorialState?.active && this.tutorialState.step < 7) {
        return;
      }
      this.onAddWorldline();
    });

    this._addBtn.addChild(hitZone);
    this._worldlineLayer.addChild(this._addBtn);
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  ENTANGLEMENT CONNECTIONS
  // ═══════════════════════════════════════════════════════════════════════

  _drawConnections() {
    this._connectionLayer.removeChildren();

    for (let ci = 0; ci < this.connections.length; ci++) {
      const conn = this.connections[ci];
      if (conn.type !== 'CNOT' && conn.type !== 'CCNOT' && conn.type !== 'MCX') continue;

      const ctrls = getControls(conn);
      const ctrlWls = ctrls.map(c => this.worldlines[c]).filter(Boolean);
      const targetWl = this.worldlines[conn.target];
      if (ctrlWls.length === 0 || !targetWl) continue;

      const pos = conn.position ?? 0.5;
      const refWl = ctrlWls[0] || targetWl;
      const usableStart = refWl.lineX + refWl.START_NODE_WIDTH + 8;
      const usableWidth = refWl.lineWidth - refWl.START_NODE_WIDTH - 8;
      const x = usableStart + usableWidth * pos;

      const allY = [...ctrlWls.map(w => w.lineY), targetWl.lineY];
      const minY = Math.min(...allY);
      const maxY = Math.max(...allY);
      const midY = (minY + maxY) / 2;

      const isOdd = conn.parity === 'odd';
      const isFuture = pos > (this.scrubberPosition + 0.005);
      const isMultiControl = ctrlWls.length > 1;

      const connContainer = new PIXI.Container();
      connContainer.eventMode = 'passive';
      connContainer.alpha = isFuture ? 0.28 : 1.0;

      // Theme colors based on parity and control count
      const strokeColor = isOdd ? 0xd97706 : (isMultiControl ? 0x6366f1 : 0x7c3aed);
      const glowColor = isOdd ? 0xfde68a : (isMultiControl ? 0xc7d2fe : 0xddd6fe);
      const badgeBg = 0xffffff;
      const badgeBorder = strokeColor;
      const textColor = isOdd ? 0xb45309 : (isMultiControl ? 0x4338ca : 0x6d28d9);

      const g = new PIXI.Graphics();
      g.eventMode = 'none';

      // Vertical bus line glow
      g.setStrokeStyle({ width: isMultiControl ? 6 : 5, color: glowColor, alpha: 0.6 });
      g.moveTo(x, minY);
      g.lineTo(x, maxY);
      g.stroke();

      // Vertical bus line core
      g.setStrokeStyle({ width: isMultiControl ? 2.5 : 2, color: strokeColor, alpha: 0.95 });
      g.moveTo(x, minY);
      g.lineTo(x, maxY);
      g.stroke();

      // Control dots (filled circles with halos on every control line)
      for (const cWl of ctrlWls) {
        const cy = cWl.lineY;
        g.fill({ color: glowColor, alpha: 0.7 });
        g.circle(x, cy, isMultiControl ? 9 : 8);
        g.fill();

        g.fill({ color: strokeColor, alpha: 1 });
        g.circle(x, cy, isMultiControl ? 5.5 : 5);
        g.fill();
      }

      // Target ⊕ symbol (circle with plus) on target line
      const ty = targetWl.lineY;
      const tR = 9;
      g.setStrokeStyle({ width: 2, color: strokeColor, alpha: 1 });
      g.circle(x, ty, tR);
      g.stroke();
      g.moveTo(x - tR, ty);
      g.lineTo(x + tR, ty);
      g.stroke();
      g.moveTo(x, ty - tR);
      g.lineTo(x, ty + tR);
      g.stroke();

      // Extra notch for odd parity target (inversion indicator)
      if (isOdd) {
        g.fill({ color: 0xd97706, alpha: 0.9 });
        g.circle(x, ty, 3);
        g.fill();
      }

      connContainer.addChild(g);

      // Determine label text for parity pill
      let labelText = isOdd ? 'OR' : 'AND';
      if (ctrlWls.length === 2) {
        labelText = isOdd ? '2-OR' : 'CCNOT';
      } else if (ctrlWls.length > 2) {
        labelText = `${ctrlWls.length}-${isOdd ? 'OR' : 'AND'}`;
      }

      const badgeWidth = Math.max(54, labelText.length * 8.5 + 16);
      const badgeHeight = 22;

      // Parity Pill Container (AND / OR / CCNOT)
      const badgeContainer = new PIXI.Container();
      badgeContainer.x = x;
      badgeContainer.y = midY;

      const badgeGraphics = new PIXI.Graphics();
      const renderBadge = (isHover) => {
        badgeGraphics.clear();
        badgeGraphics.fill({ color: isHover ? (isOdd ? 0xfffbeb : 0xf5f3ff) : badgeBg, alpha: 0.98 });
        badgeGraphics.setStrokeStyle({
          width: isHover ? 2 : 1.5,
          color: isHover ? (isOdd ? 0xb45309 : 0x4f46e5) : badgeBorder,
          alpha: 1,
        });
        badgeGraphics.roundRect(-badgeWidth / 2, -badgeHeight / 2, badgeWidth, badgeHeight, 11);
        badgeGraphics.fill();
        badgeGraphics.stroke();
      };
      renderBadge(false);
      badgeGraphics.eventMode = 'none';
      badgeContainer.addChild(badgeGraphics);

      const badgeText = new PIXI.Text({
        text: labelText,
        style: {
          fontFamily: '"Inter", system-ui, sans-serif',
          fontSize: 10,
          fontWeight: 'bold',
          fill: textColor,
          letterSpacing: 0.5,
        },
      });
      badgeText.anchor.set(0.5, 0.5);
      badgeText.eventMode = 'none';
      badgeContainer.addChild(badgeText);

      // Interactive toggle hit area on badgeContainer
      badgeContainer.eventMode = 'static';
      badgeContainer.cursor = 'pointer';
      badgeContainer.hitArea = new PIXI.Rectangle(-badgeWidth / 2 - 6, -badgeHeight / 2 - 6, badgeWidth + 12, badgeHeight + 12);

      const connId = conn.id;
      badgeContainer.on('pointerdown', (e) => {
        e.stopPropagation();
        this._linePointerDown = null;
        this._potentialDrag = null;
        this._dragActive = false;
        this.onToggleConnectionParity(connId);
      });
      badgeContainer.on('pointerover', () => {
        renderBadge(true);
      });
      badgeContainer.on('pointerout', () => {
        renderBadge(false);
      });

      // Configure / Inspector Button (⚙) next to the badge
      const cfgContainer = new PIXI.Container();
      cfgContainer.x = x + badgeWidth / 2 + 13;
      cfgContainer.y = midY;

      const cfgBg = new PIXI.Graphics();
      const renderCfg = (isHover) => {
        cfgBg.clear();
        cfgBg.fill({ color: isHover ? 0xe0e7ff : 0xffffff, alpha: isHover ? 1 : 0.98 });
        cfgBg.setStrokeStyle({ width: 1, color: isHover ? 0x6366f1 : 0xcbd5e1, alpha: 1 });
        cfgBg.circle(0, 0, 8);
        cfgBg.fill();
        cfgBg.stroke();
      };
      renderCfg(false);
      cfgBg.eventMode = 'none';
      cfgContainer.addChild(cfgBg);

      const cfgText = new PIXI.Text({
        text: '⚙',
        style: {
          fontFamily: 'system-ui',
          fontSize: 9,
          fill: 0x475569,
        },
      });
      cfgText.anchor.set(0.5, 0.5);
      cfgText.eventMode = 'none';
      cfgContainer.addChild(cfgText);

      cfgContainer.eventMode = 'static';
      cfgContainer.cursor = 'pointer';
      cfgContainer.hitArea = new PIXI.Circle(0, 0, 10);

      cfgContainer.on('pointerover', () => {
        renderCfg(true);
        cfgText.style.fill = 0x4338ca;
      });
      cfgContainer.on('pointerout', () => {
        renderCfg(false);
        cfgText.style.fill = 0x475569;
      });
      cfgContainer.on('pointerdown', (e) => {
        e.stopPropagation();
        this._linePointerDown = null;
        this._potentialDrag = null;
        this._dragActive = false;
        this.onConfigureConnection(conn);
      });

      // Small Delete Button (✕) next to the config button
      const delContainer = new PIXI.Container();
      delContainer.x = x + badgeWidth / 2 + 33;
      delContainer.y = midY;

      const delBg = new PIXI.Graphics();
      const renderDel = (isHover) => {
        delBg.clear();
        delBg.fill({ color: isHover ? 0xef4444 : 0xffffff, alpha: isHover ? 1 : 0.98 });
        delBg.setStrokeStyle({ width: 1, color: isHover ? 0xef4444 : 0xcbd5e1, alpha: 1 });
        delBg.circle(0, 0, 8);
        delBg.fill();
        delBg.stroke();
      };
      renderDel(false);
      delBg.eventMode = 'none';
      delContainer.addChild(delBg);

      const delText = new PIXI.Text({
        text: '✕',
        style: {
          fontFamily: 'system-ui',
          fontSize: 9,
          fill: 0x64748b,
        },
      });
      delText.anchor.set(0.5, 0.5);
      delText.eventMode = 'none';
      delContainer.addChild(delText);

      delContainer.eventMode = 'static';
      delContainer.cursor = 'pointer';
      delContainer.hitArea = new PIXI.Circle(0, 0, 10);

      delContainer.on('pointerover', () => {
        renderDel(true);
        delText.style.fill = 0xffffff;
      });
      delContainer.on('pointerout', () => {
        renderDel(false);
        delText.style.fill = 0x64748b;
      });
      delContainer.on('pointerdown', (e) => {
        e.stopPropagation();
        this._linePointerDown = null;
        this._potentialDrag = null;
        this._dragActive = false;
        this.onRemoveConnection(connId);
      });

      connContainer.addChild(badgeContainer);
      connContainer.addChild(cfgContainer);
      connContainer.addChild(delContainer);
      this._connectionLayer.addChild(connContainer);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  TIMELINE SCRUBBER
  // ═══════════════════════════════════════════════════════════════════════

  _drawScrubber() {
    if (!this._scrubberLayer) return;
    this._scrubberLayer.removeChildren();

    const { usableStart, usableWidth, h } = this._getLayout();
    const trackY = h - 28;

    const g = new PIXI.Graphics();

    // Subtle background timeline rail
    g.setStrokeStyle({ width: 2, color: 0xe2e8f0, alpha: 0.9 });
    g.moveTo(usableStart, trackY);
    g.lineTo(usableStart + usableWidth, trackY);
    g.stroke();

    // Filled progress rail up to scrubberPosition
    const curX = usableStart + usableWidth * this.scrubberPosition;
    const railColor = this.hasPhaseInterference ? 0xd97706 : 0x0284c7;
    g.setStrokeStyle({ width: 2.5, color: railColor, alpha: 0.95 });
    g.moveTo(usableStart, trackY);
    g.lineTo(curX, trackY);
    g.stroke();

    // Tick marks at 0%, 25%, 50%, 75%, 100%
    [0, 0.25, 0.5, 0.75, 1.0].forEach(frac => {
      const tx = usableStart + usableWidth * frac;
      g.setStrokeStyle({ width: 1.5, color: 0x94a3b8, alpha: 0.7 });
      g.moveTo(tx, trackY - 3);
      g.lineTo(tx, trackY + 3);
      g.stroke();
    });

    this._scrubberLayer.addChild(g);

    // Labels at 0% and 100%
    const label0 = new PIXI.Text({
      text: 'Start',
      style: {
        fontFamily: '"Inter", system-ui, sans-serif',
        fontSize: 9,
        fill: 0x94a3b8,
        fontWeight: '600',
      },
    });
    label0.anchor.set(0, 0.5);
    label0.x = usableStart;
    label0.y = trackY - 11;
    this._scrubberLayer.addChild(label0);

    const label1 = new PIXI.Text({
      text: 'End',
      style: {
        fontFamily: '"Inter", system-ui, sans-serif',
        fontSize: 9,
        fill: 0x94a3b8,
        fontWeight: '600',
      },
    });
    label1.anchor.set(1, 0.5);
    label1.x = usableStart + usableWidth;
    label1.y = trackY - 11;
    this._scrubberLayer.addChild(label1);

    // Vertical holographic laser line up through all worldlines
    const screenLaserX = this.panX + (usableStart + usableWidth * this.scrubberPosition) * this.zoom;
    const laser = new PIXI.Graphics();
    laser.setStrokeStyle({ width: 4, color: railColor, alpha: 0.22 });
    laser.moveTo(screenLaserX, trackY - 8);
    laser.lineTo(screenLaserX, 0);
    laser.stroke();

    laser.setStrokeStyle({ width: 1.5, color: railColor, alpha: 0.85 });
    laser.moveTo(screenLaserX, trackY - 8);
    laser.lineTo(screenLaserX, 0);
    laser.stroke();
    this._scrubberLayer.addChild(laser);

    // Draggable Scrubber Handle
    const handle = new PIXI.Container();
    handle.x = curX;
    handle.y = trackY;

    const handleG = new PIXI.Graphics();
    handleG.fill({ color: 0xffffff, alpha: 1 });
    handleG.setStrokeStyle({ width: 2, color: railColor, alpha: 1 });
    handleG.roundRect(-7, -9, 14, 18, 5);
    handleG.fill();
    handleG.stroke();

    handleG.fill({ color: railColor, alpha: 1 });
    handleG.circle(0, 0, 2.5);
    handleG.fill();

    handle.addChild(handleG);
    handle.eventMode = 'static';
    handle.cursor = 'ew-resize';
    handle.hitArea = new PIXI.Rectangle(-16, -16, 32, 32);

    handle.on('pointerdown', (e) => {
      e.stopPropagation();
      this._scrubberDragging = true;
      this._linePointerDown = null;
    });

    // Track click hit zone for direct clicking anywhere on the timeline rail
    const trackHit = new PIXI.Graphics();
    trackHit.fill({ color: 0x000000, alpha: 0.001 });
    trackHit.rect(usableStart - 10, trackY - 14, usableWidth + 20, 28);
    trackHit.fill();
    trackHit.eventMode = 'static';
    trackHit.cursor = 'ew-resize';
    trackHit.on('pointerdown', (e) => {
      e.stopPropagation();
      this._scrubberDragging = true;
      this._linePointerDown = null;
      const frac = Math.max(0, Math.min(1, (e.global.x - usableStart) / usableWidth));
      this.scrubberPosition = frac;
      this.onScrubberChange(frac);
      this._drawScrubber();
      this._updateWorldlinesForScrubber();
    });

    this._scrubberLayer.addChildAt(trackHit, 0);

    this._scrubberLayer.addChild(handle);
  }

  _updateWorldlinesForScrubber() {
    for (let i = 0; i < this.worldlines.length; i++) {
      const wl = this.worldlines[i];
      if (wl) {
        wl.updateData({
          hasPhaseInterference: this.hasPhaseInterference,
          scrubberPosition: this.scrubberPosition,
          uncertainSegments: this.sliceInfo?.uncertainSegments?.[i] || [],
        });
      }
    }
    this._drawConnections();
  }

  _isNearConnection(x, y) {
    for (const conn of this.connections) {
      if (conn.type !== 'CNOT' && conn.type !== 'CCNOT' && conn.type !== 'MCX') continue;
      const ctrls = getControls(conn);
      const ctrlWls = ctrls.map(c => this.worldlines[c]).filter(Boolean);
      const targetWl = this.worldlines[conn.target];
      if (ctrlWls.length === 0 || !targetWl) continue;

      const pos = conn.position ?? 0.5;
      const refWl = ctrlWls[0] || targetWl;
      const usableStart = refWl.lineX + (refWl.START_NODE_WIDTH || 130) + 8;
      const usableWidth = refWl.lineWidth - (refWl.START_NODE_WIDTH || 130) - 8;
      const cx = usableStart + usableWidth * pos;

      const allY = [...ctrlWls.map(w => w.lineY), targetWl.lineY];
      const minY = Math.min(...allY);
      const maxY = Math.max(...allY);
      const midY = (minY + maxY) / 2;

      // Parity badge, config & delete buttons area:
      if (x >= cx - 40 && x <= cx + 65 && Math.abs(y - midY) <= 20) {
        return true;
      }
      // Vertical connection line and control/target endpoints
      if (Math.abs(x - cx) <= 15) {
        if (y >= minY - 14 && y <= maxY + 14) {
          return true;
        }
      }
    }
    return false;
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  POINTER / DRAG / CLICK-TO-PLACE / PANNING
  // ═══════════════════════════════════════════════════════════════════════

  _onPointerDown(e) {
    // Left-click only
    if (e.button !== 0 && e.nativeEvent?.button !== 0) return;

    const rawX = e.global.x;
    const rawY = e.global.y;

    const { usableStart, usableWidth, h } = this._getLayout();
    const trackY = h - 28;

    // Timeline Scrubber track click / drag at the bottom (handled in screen space)
    if (rawY >= trackY - 16 && rawY <= h && rawX >= usableStart - 12 && rawX <= usableStart + usableWidth + 12) {
      this._scrubberDragging = true;
      this._linePointerDown = null;
      const frac = Math.max(0, Math.min(1, (rawX - usableStart) / usableWidth));
      this.scrubberPosition = frac;
      this.onScrubberChange(frac);
      this._drawScrubber();
      this._updateWorldlinesForScrubber();
      return;
    }

    // Convert raw coordinates to content coordinates
    const contentX = (rawX - this.panX) / this.zoom;
    const contentY = (rawY - this.scrollY) / this.zoom;

    // Do NOT place gates or start drags if clicking any CNOT connection element
    if (this._isNearConnection(contentX, contentY)) {
      this._linePointerDown = null;
      return;
    }

    // Check if clicked near any worldline track
    for (let i = 0; i < this.worldlines.length; i++) {
      const wl = this.worldlines[i];
      if (wl.isNearY(contentY)) {
        const usableStart = wl.lineX + wl.START_NODE_WIDTH + 8;
        const totalUsableWidth = wl.lineWidth - wl.START_NODE_WIDTH - 8;

        // Inside the track zone
        if (contentX >= usableStart && contentX <= usableStart + totalUsableWidth) {
          // Check if clicking an existing gate
          const onGate = wl.gates.find(gate => {
            const gx = usableStart + gate.position * totalUsableWidth;
            return Math.abs(contentX - gx) < 18;
          });

          if (onGate) {
            const canvasRect = this.app.canvas.getBoundingClientRect();
            this.onGateContextMenu({
              qubitId: wl.qubitId,
              gateId: onGate.id,
              gate: onGate,
              screenX: e.nativeEvent?.clientX ?? (canvasRect.left + rawX),
              screenY: e.nativeEvent?.clientY ?? (canvasRect.top + rawY),
            });
            return;
          }

          // Pressed on the line itself -> record for click or drag
          this._linePointerDown = {
            sourceIdx: i,
            qubitId: wl.qubitId,
            lineY: wl.lineY,
            startX: usableStart,
            totalWidth: totalUsableWidth,
            clickX: contentX,
            clickY: contentY,
            rawClickX: rawX,
            rawClickY: rawY,
            time: Date.now(),
          };
          return;
        }
      }
    }

    // Clicked empty canvas -> initiate drag panning
    this._isPanning = true;
    this._panStartX = rawX - this.panX;
    this._panStartY = rawY - this.scrollY;
    if (this.app?.canvas) {
      this.app.canvas.style.cursor = 'grabbing';
    }
  }

  _onPointerMove(e) {
    const rawX = e.global.x;
    const rawY = e.global.y;
    this._cursorX = rawX;
    this._cursorY = rawY;

    // Detect timeline scrubber dragging
    if (this._scrubberDragging) {
      const { usableStart, usableWidth } = this._getLayout();
      const frac = Math.max(0, Math.min(1, (rawX - usableStart) / usableWidth));
      this.scrubberPosition = frac;
      this.onScrubberChange(frac);
      this._drawScrubber();
      this._updateWorldlinesForScrubber();
      return;
    }

    // Handle background canvas panning
    if (this._isPanning) {
      this.panX = rawX - this._panStartX;
      this.scrollY = rawY - this._panStartY;
      this._clampPanAndScroll();
      this._applyContentTransform();
      return;
    }

    // Convert to content coordinates
    const contentX = (rawX - this.panX) / this.zoom;
    const contentY = (rawY - this.scrollY) / this.zoom;

    // Detect drag initiation from line press
    if (this._linePointerDown && !this._dragActive) {
      if (this.tutorialState?.active && this.tutorialState.step !== 5 && this.tutorialState.step !== 8) {
        // Drag blocked in non-drag tutorial steps
      } else {
        const dx = rawX - this._linePointerDown.rawClickX;
        const dy = rawY - this._linePointerDown.rawClickY;
        if (Math.sqrt(dx * dx + dy * dy) > 6) {
          this._dragActive = true;
          this._dragSourceId = this._linePointerDown.qubitId;
          this._dragSourceX = this._linePointerDown.clickX;
          this._dragSourceY = this._linePointerDown.lineY;
          this._dragCurrentX = contentX;
          this._dragCurrentY = contentY;
          this._dragTime = 0;
          for (const wl of this.worldlines) {
            wl.setHover(0, false);
          }
        }
      }
    }

    // Check potential drag from worldline internal event
    if (this._potentialDrag && !this._dragActive) {
      const dx = contentX - this._potentialDrag.x;
      const dy = contentY - this._potentialDrag.y;
      if (Math.sqrt(dx * dx + dy * dy) > 5) {
        this._onDragStart(this._potentialDrag);
        this._potentialDrag = null;
      }
    }

    const nearConnection = this._isNearConnection(contentX, contentY);
    for (const wl of this.worldlines) {
      const isNear = wl.isNearY(contentY) && !nearConnection;
      wl.setHover(contentX, isNear && !this._dragActive);
    }

    if (this._dragActive) {
      this._dragCurrentX = contentX;
      this._dragCurrentY = contentY;
    }
  }

  _onDragStart(data) {
    if (this.tutorialState?.active && this.tutorialState.step !== 5 && this.tutorialState.step !== 8) {
      return;
    }
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

  _onPointerUp(e) {
    this._potentialDrag = null;

    if (this._isPanning) {
      this._isPanning = false;
      if (this.app?.canvas) {
        this.app.canvas.style.cursor = 'default';
      }
    }

    if (this._scrubberDragging) {
      this._scrubberDragging = false;
    }

    // 1. If dragging an entanglement connection
    if (this._dragActive) {
      const sourceIdx = this.qubits.findIndex(q => q.id === this._dragSourceId);

      // Check if dropped onto or near an existing connection to add a control (upgrading to CCNOT / MCX)
      let addedToConnection = false;
      if (sourceIdx !== -1 && !this.tutorialState?.active) {
        for (const conn of this.connections) {
          if (conn.type !== 'CNOT' && conn.type !== 'CCNOT' && conn.type !== 'MCX') continue;
          const ctrls = getControls(conn);
          const ctrlWls = ctrls.map(c => this.worldlines[c]).filter(Boolean);
          const targetWl = this.worldlines[conn.target];
          if (ctrlWls.length === 0 || !targetWl) continue;

          const pos = conn.position ?? 0.5;
          const refWl = ctrlWls[0] || targetWl;
          const usableStart = refWl.lineX + refWl.START_NODE_WIDTH + 8;
          const usableWidth = refWl.lineWidth - refWl.START_NODE_WIDTH - 8;
          const cx = usableStart + usableWidth * pos;

          const allY = [...ctrlWls.map(w => w.lineY), targetWl.lineY];
          const minY = Math.min(...allY);
          const maxY = Math.max(...allY);

          // Check if dropped near the connection's vertical bus line, badge, or buttons
          const nearX = Math.abs(this._dragCurrentX - cx) <= 28;
          const nearY = (this._dragCurrentY >= minY - 24 && this._dragCurrentY <= maxY + 24) ||
                        Math.abs(this._dragCurrentY - (minY + maxY) / 2) <= 32;

          if (nearX && nearY) {
            if (conn.target !== sourceIdx && !ctrls.includes(sourceIdx)) {
              this.onAddControlToConnection(conn.id, sourceIdx);
              addedToConnection = true;
              break;
            }
          }
        }
      }

      if (!addedToConnection) {
        for (let targetIdx = 0; targetIdx < this.worldlines.length; targetIdx++) {
          const wl = this.worldlines[targetIdx];
          if (wl.qubitId === this._dragSourceId) continue;
          if (wl.isNearY(this._dragCurrentY)) {
            if (sourceIdx !== -1 && targetIdx !== -1) {
              let allowConnect = true;
              if (this.tutorialState?.active) {
                if (this.tutorialState.step === 5) {
                  allowConnect = (sourceIdx === 0 && targetIdx === 1) || (sourceIdx === 1 && targetIdx === 0);
                } else if (this.tutorialState.step === 8) {
                  allowConnect = (sourceIdx === 0 && targetIdx === 2) || (sourceIdx === 2 && targetIdx === 0);
                } else {
                  allowConnect = false;
                }
              }

              if (allowConnect) {
                const sourceWl = this.worldlines[sourceIdx];
                const usableStart = sourceWl ? sourceWl.lineX + sourceWl.START_NODE_WIDTH + 8 : 218;
                const usableWidth = sourceWl ? sourceWl.lineWidth - sourceWl.START_NODE_WIDTH - 8 : 500;
                const position = Math.max(0.1, Math.min(0.9, (this._dragSourceX - usableStart) / usableWidth));
                this.onCNOTCreate(sourceIdx, targetIdx, position);
              }
            }
            break;
          }
        }
      }

      this._dragActive = false;
      this._linePointerDown = null;
      this._dragThread.clear();
      return;
    }

    // 2. If it was a quick click on the line track -> place an Uncertainty gate!
    if (this._linePointerDown) {
      const elapsed = Date.now() - this._linePointerDown.time;
      if (elapsed < 400) {
        let allowGate = true;
        if (this.tutorialState?.active) {
          // Gated: in step 4, only allow clicking qubit 0, and only if 0 gates exist
          allowGate = (this.tutorialState.step === 4 && this._linePointerDown.qubitId === this.qubits[0]?.id && (this.qubits[0]?.gates?.length || 0) === 0);
        }

        if (allowGate) {
          const posFraction = (this._linePointerDown.clickX - this._linePointerDown.startX) / this._linePointerDown.totalWidth;
          const position = Math.max(0.05, Math.min(0.95, posFraction));
          this.onPlaceGate(this._linePointerDown.qubitId, position);
        }
      }
      this._linePointerDown = null;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  TICK & TUTORIAL GUIDANCE
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
    if (this.tutorialState?.active && this.tutorialState?.step) {
      this._tutorialTime += dt * 0.05;
      this._renderTutorialGuidance();
    } else if (this._tutorialLayer && this._tutorialLayer.children.length > 0) {
      this._tutorialLayer.removeChildren();
    }
  }

  _renderTutorialGuidance() {
    if (!this._tutorialLayer) return;
    this._tutorialLayer.removeChildren();

    const step = this.tutorialState?.step;
    const { padding, lineWidth, usableStart, usableWidth } = this._getLayout();
    const pulse = 0.5 + 0.5 * Math.sin(this._tutorialTime * 5);

    // ── STEP 2: Highlight Beat 1 Box (Hero) ──────────────────────────
    if (step === 2 && this.worldlines[0]) {
      const wl0 = this.worldlines[0];
      const g = new PIXI.Graphics();
      const bx = wl0.lineX - 4;
      const by = wl0.lineY - 28;
      const bw = wl0.START_NODE_WIDTH + 8;
      const bh = 56;

      g.setStrokeStyle({ width: 3, color: 0x0284c7, alpha: 0.6 + 0.4 * pulse });
      g.roundRect(bx, by, bw, bh, 14);
      g.stroke();

      g.setStrokeStyle({ width: 6, color: 0x38bdf8, alpha: 0.25 * pulse });
      g.roundRect(bx - 3, by - 3, bw + 6, bh + 6, 16);
      g.stroke();

      const label = new PIXI.Text({
        text: '👉 Click to name Beat 1',
        style: { fontFamily: '"Inter", system-ui, sans-serif', fontSize: 11, fontWeight: 'bold', fill: 0x0369a1 }
      });
      label.x = bx + bw / 2;
      label.y = by - 14;
      label.anchor.set(0.5, 1);
      this._tutorialLayer.addChild(g);
      this._tutorialLayer.addChild(label);
    }

    // ── STEP 3: Highlight Beat 2 Box (Dragon) ────────────────────────
    else if (step === 3 && this.worldlines[1]) {
      const wl1 = this.worldlines[1];
      const g = new PIXI.Graphics();
      const bx = wl1.lineX - 4;
      const by = wl1.lineY - 28;
      const bw = wl1.START_NODE_WIDTH + 8;
      const bh = 56;

      g.setStrokeStyle({ width: 3, color: 0xea580c, alpha: 0.6 + 0.4 * pulse });
      g.roundRect(bx, by, bw, bh, 14);
      g.stroke();

      g.setStrokeStyle({ width: 6, color: 0xfb923c, alpha: 0.25 * pulse });
      g.roundRect(bx - 3, by - 3, bw + 6, bh + 6, 16);
      g.stroke();

      const label = new PIXI.Text({
        text: '👉 Click to name Beat 2',
        style: { fontFamily: '"Inter", system-ui, sans-serif', fontSize: 11, fontWeight: 'bold', fill: 0xc2410c }
      });
      label.x = bx + bw / 2;
      label.y = by - 14;
      label.anchor.set(0.5, 1);
      this._tutorialLayer.addChild(g);
      this._tutorialLayer.addChild(label);
    }

    // ── STEP 4: Target Beacon on Worldline 1 (Uncertainty Gate) ──────
    else if (step === 4 && this.worldlines[0]) {
      const wl0 = this.worldlines[0];
      const targetX = usableStart + 0.28 * usableWidth;
      const targetY = wl0.lineY;
      const g = new PIXI.Graphics();

      const rOuter = 15 + pulse * 6;
      g.setStrokeStyle({ width: 2, color: 0x0284c7, alpha: 0.7 });
      g.circle(targetX, targetY, rOuter);
      g.stroke();

      g.fill({ color: 0x0284c7, alpha: 0.2 + 0.15 * pulse });
      g.circle(targetX, targetY, 10);
      g.fill();

      g.fill({ color: 0x0284c7, alpha: 0.9 });
      g.circle(targetX, targetY, 4);
      g.fill();

      const label = new PIXI.Text({
        text: '🎯 Click here to place Uncertainty gate',
        style: { fontFamily: '"Inter", system-ui, sans-serif', fontSize: 11, fontWeight: 'bold', fill: 0x0369a1 }
      });
      label.x = targetX;
      label.y = targetY - 22;
      label.anchor.set(0.5, 1);
      this._tutorialLayer.addChild(g);
      this._tutorialLayer.addChild(label);
    }

    // ── STEP 5: Drag from Line 1 to Line 2 ("Drag from here to here") ─
    else if (step === 5 && this.worldlines[0] && this.worldlines[1]) {
      const wl0 = this.worldlines[0];
      const wl1 = this.worldlines[1];
      const sx = usableStart + 0.55 * usableWidth;
      const sy = wl0.lineY;
      const ey = wl1.lineY;
      const g = new PIXI.Graphics();

      // High-contrast Amber/Gold theme (stands out from the user's purple drag thread)
      const guideColor = 0xd97706;
      const guideGlow = 0xf59e0b;
      const guideLight = 0xfef3c7;

      // Source beacon on Line 1
      g.fill({ color: guideColor, alpha: 0.95 });
      g.circle(sx, sy, 7);
      g.fill();
      g.setStrokeStyle({ width: 2.5, color: guideGlow, alpha: 0.7 + 0.3 * pulse });
      g.circle(sx, sy, 13 + 4 * pulse);
      g.stroke();

      // Target beacon on Line 2
      g.setStrokeStyle({ width: 2.5, color: guideColor, alpha: 0.9 });
      g.circle(sx, ey, 10);
      g.stroke();
      g.fill({ color: guideGlow, alpha: 0.35 });
      g.circle(sx, ey, 10);
      g.fill();

      // Vertical guide track
      g.setStrokeStyle({ width: 2.5, color: guideGlow, alpha: 0.6 });
      g.moveTo(sx, sy);
      g.lineTo(sx, ey);
      g.stroke();

      // Slower, smooth glide animation (~1.6s per cycle instead of rapid strobe)
      const arrowProgress = (this._tutorialTime * 0.3) % 1;
      const currY = sy + (ey - sy) * arrowProgress;

      // Moving golden comet tracer with glow
      g.fill({ color: guideGlow, alpha: 0.4 });
      g.circle(sx, currY, 9);
      g.fill();
      g.fill({ color: 0xb45309, alpha: 0.95 });
      g.circle(sx, currY, 5.5);
      g.fill();
      g.setStrokeStyle({ width: 1.5, color: guideLight, alpha: 0.95 });
      g.circle(sx, currY, 5.5);
      g.stroke();

      // Annotation label
      const label = new PIXI.Text({
        text: '⬇ Drag from here to here',
        style: { fontFamily: '"Inter", system-ui, sans-serif', fontSize: 11, fontWeight: 'bold', fill: 0x92400e }
      });
      label.x = sx + 16;
      label.y = (sy + ey) / 2;
      label.anchor.set(0, 0.5);
      this._tutorialLayer.addChild(g);
      this._tutorialLayer.addChild(label);
    }

    // ── STEP 7: Highlight "+ Add Story Worldline" Button ──────────────
    else if (step === 7 && this._addBtn) {
      const { lineSpacing } = this._getLayout();
      const lastY = padding + lineSpacing * (this.qubits.length + 1);
      const g = new PIXI.Graphics();
      const bx = padding - 14;
      const by = lastY - 14;
      const bw = 160;
      const bh = 28;

      g.setStrokeStyle({ width: 2.5, color: 0x0284c7, alpha: 0.7 + 0.3 * pulse });
      g.roundRect(bx, by, bw, bh, 8);
      g.stroke();

      g.setStrokeStyle({ width: 5, color: 0x38bdf8, alpha: 0.25 * pulse });
      g.roundRect(bx - 3, by - 3, bw + 6, bh + 6, 10);
      g.stroke();

      const label = new PIXI.Text({
        text: '➕ Click to add 3rd Worldline',
        style: { fontFamily: '"Inter", system-ui, sans-serif', fontSize: 10.5, fontWeight: 'bold', fill: 0x0369a1 }
      });
      label.x = bx + bw + 10;
      label.y = lastY;
      label.anchor.set(0, 0.5);
      this._tutorialLayer.addChild(g);
      this._tutorialLayer.addChild(label);
    }

    // ── STEP 8: Connect Line 1 to Line 3, then Toggle to OR ──────────
    else if (step === 8 && this.worldlines[0] && this.worldlines[2]) {
      const wl0 = this.worldlines[0];
      const wl2 = this.worldlines[2];
      const hasConnTo3 = this.connections.some(c => (getControls(c).includes(0) && c.target === 2) || (getControls(c).includes(2) && c.target === 0));
      const connTo3 = this.connections.find(c => (getControls(c).includes(0) && c.target === 2) || (getControls(c).includes(2) && c.target === 0));

      const g = new PIXI.Graphics();

      if (!hasConnTo3) {
        // Drag prompt to line 3
        const sx = usableStart + 0.72 * usableWidth;
        const sy = wl0.lineY;
        const ey = wl2.lineY;

        const guideColor = 0xd97706;
        const guideGlow = 0xf59e0b;
        const guideLight = 0xfef3c7;

        g.fill({ color: guideColor, alpha: 0.95 });
        g.circle(sx, sy, 7);
        g.fill();
        g.setStrokeStyle({ width: 2.5, color: guideGlow, alpha: 0.7 + 0.3 * pulse });
        g.circle(sx, sy, 13 + 4 * pulse);
        g.stroke();

        g.setStrokeStyle({ width: 2.5, color: guideColor, alpha: 0.9 });
        g.circle(sx, ey, 10);
        g.stroke();
        g.fill({ color: guideGlow, alpha: 0.35 });
        g.circle(sx, ey, 10);
        g.fill();

        g.setStrokeStyle({ width: 2.5, color: guideGlow, alpha: 0.6 });
        g.moveTo(sx, sy);
        g.lineTo(sx, ey);
        g.stroke();

        const arrowProgress = (this._tutorialTime * 0.3) % 1;
        const currY = sy + (ey - sy) * arrowProgress;

        g.fill({ color: guideGlow, alpha: 0.4 });
        g.circle(sx, currY, 9);
        g.fill();
        g.fill({ color: 0xb45309, alpha: 0.95 });
        g.circle(sx, currY, 5.5);
        g.fill();
        g.setStrokeStyle({ width: 1.5, color: guideLight, alpha: 0.95 });
        g.circle(sx, currY, 5.5);
        g.stroke();

        const label = new PIXI.Text({
          text: '⬇ Drag to connect to Worldline 3',
          style: { fontFamily: '"Inter", system-ui, sans-serif', fontSize: 11, fontWeight: 'bold', fill: 0x92400e }
        });
        label.x = sx + 16;
        label.y = (sy + ey) / 2;
        label.anchor.set(0, 0.5);
        this._tutorialLayer.addChild(g);
        this._tutorialLayer.addChild(label);
      } else if (connTo3?.parity !== 'odd') {
        // Prompt to click parity badge to toggle to OR!
        const pos = connTo3.position ?? 0.5;
        const cx = usableStart + usableWidth * pos;
        const midY = (wl0.lineY + wl2.lineY) / 2;

        g.setStrokeStyle({ width: 2.5, color: 0xb45309, alpha: 0.7 + 0.3 * pulse });
        g.roundRect(cx - 36, midY - 14, 72, 28, 14);
        g.stroke();

        g.setStrokeStyle({ width: 5, color: 0xf59e0b, alpha: 0.28 * pulse });
        g.roundRect(cx - 39, midY - 17, 78, 34, 16);
        g.stroke();

        const label = new PIXI.Text({
          text: '👆 Click badge to toggle to OR',
          style: { fontFamily: '"Inter", system-ui, sans-serif', fontSize: 10.5, fontWeight: 'bold', fill: 0x92400e }
        });
        label.x = cx + 42;
        label.y = midY;
        label.anchor.set(0, 0.5);
        this._tutorialLayer.addChild(g);
        this._tutorialLayer.addChild(label);
      }
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
            uncertainSegments: this.sliceInfo?.uncertainSegments?.[i] || [],
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
          uncertainSegments: this.sliceInfo?.uncertainSegments?.[i] || [],
        });
      }
    }
  }

  updateScrubber(position, sliceInfo) {
    this.scrubberPosition = position ?? 1.0;
    if (sliceInfo !== undefined) {
      this.sliceInfo = sliceInfo;
      if (sliceInfo?.hasPhaseInterference !== undefined) {
        this.hasPhaseInterference = sliceInfo.hasPhaseInterference;
      }
    }
    if (this._ready) {
      this._drawScrubber();
      this._updateWorldlinesForScrubber();
    }
  }

  updatePhaseInterference(hasPhase) {
    this.hasPhaseInterference = hasPhase;
    if (this._ready) {
      this._drawScrubber();
      this._updateWorldlinesForScrubber();
    }
  }

  updateTutorialState(state) {
    this.tutorialState = state;
    if (!state?.active) {
      if (this._tutorialLayer) {
        this._tutorialLayer.removeChildren();
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
    this._clampPanAndScroll();
    this._applyContentTransform();
    this._rebuildWorldlines();
  }

  destroy() {
    this.isDestroyed = true;
    try {
      if (this.resizeObserver) {
        this.resizeObserver.disconnect();
      }
      if (this.app?.canvas && this._wheelHandler) {
        this.app.canvas.removeEventListener('wheel', this._wheelHandler);
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
