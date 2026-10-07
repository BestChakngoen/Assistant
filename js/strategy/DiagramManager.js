import { Geometry } from './diagram/Geometry.js';
import { ShapeRenderer } from './diagram/ShapeRenderer.js';
import { DiagramStorage } from './diagram/DiagramStorage.js';
import { DiagramTextEditor } from './diagram/DiagramTextEditor.js';
import { DiagramControls } from './diagram/DiagramControls.js';
import { DiagramMouseHandler } from './diagram/DiagramMouseHandler.js';

/**
 * DiagramManager - Whiteboard Strategy Lab Diagram Canvas Coordinator
 * Refactored under OOP & SOLID principles:
 * Delegates storage, controls, text editing, and mouse interactions to specialized modules.
 */
export class DiagramManager {
    constructor(canvasId, containerId) {
        this.canvas = document.getElementById(canvasId);
        this.container = document.getElementById(containerId);
        if (!this.canvas || !this.container) {
            console.error("Canvas or container not found!");
            return;
        }

        this.ctx = this.canvas.getContext('2d');
        this.shapes = [];
        this.currentTool = 'select';
        this.currentColor = '#22c55e';
        this.currentLineWidth = 4;
        this.currentFill = false;
        this.currentFontSize = 14;
        this.onSaveCallback = null;

        // Viewport transform (persisted)
        const savedViewport = DiagramStorage.loadViewportFromStorage();
        this.zoom = savedViewport.zoom;
        this.panX = savedViewport.panX;
        this.panY = savedViewport.panY;

        // Drawing state
        this.isDrawing = false;
        this.isPanning = false;
        this.isResizing = false;
        this.isDrawingConnectorFromPort = false;
        this.activeHandle = null;
        this.resizeStartData = null;
        this.connectFromShape = null;
        this.connectFromPortName = null;
        
        this.startX = 0;
        this.startY = 0;
        this.currentX = 0;
        this.currentY = 0;
        this.tempPencilPoints = [];
        
        // Selection state
        this.selectedShape = null;
        this.hoveredShape = null;
        this.selectedShapes = [];
        this.isSelectingArea = false;
        this.selectionBoxStart = { x: 0, y: 0 };
        this.selectionBoxEnd = { x: 0, y: 0 };
        this.isDragging = false;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.shapeDragOffsets = null;
        this.dKeyPressed = false;

        // Text input reference
        this.activeTextInput = null;
        this.spacePressed = false;

        this.undoStack = [];
        this.redoStack = [];

        this.loadFromStorage();
        this.undoStack.push(JSON.stringify(this.shapes));

        this.initResizeObserver();
        this.initEvents();
        this.initControls();
        this.updateZoomPercent();
        this.draw();

        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    initResizeObserver() {
        const resizeObserver = new ResizeObserver(() => {
            this.resizeCanvas();
        });
        resizeObserver.observe(this.container);
        this.resizeCanvas();
    }

    resizeCanvas() {
        const rect = this.container.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        this.draw();
    }

    initEvents() {
        DiagramMouseHandler.initEvents(this);
    }

    initControls() {
        DiagramControls.initControls(this);
    }

    selectTool(toolName) {
        DiagramControls.selectTool(this, toolName);
    }

    toggleFill() {
        DiagramControls.toggleFill(this);
    }

    updateCursor() {
        DiagramControls.updateCursor(this);
    }

    updateZoomPercent() {
        DiagramControls.updateZoomPercent(this);
    }

    adjustZoom(factor) {
        const newZoom = Math.min(4, Math.max(0.15, this.zoom * factor));
        const rect = this.canvas.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const localCenterX = (centerX - this.panX) / this.zoom;
        const localCenterY = (centerY - this.panY) / this.zoom;
        
        this.zoom = newZoom;
        this.panX = centerX - localCenterX * this.zoom;
        this.panY = centerY - localCenterY * this.zoom;
        
        this.updateZoomPercent();
        this.saveViewportToStorage();
        this.draw();
    }

    getMouseCoords(e) {
        return DiagramMouseHandler.getMouseCoords(this, e);
    }

    createTextEditor(x, y, existingShape = null) {
        DiagramTextEditor.createTextEditor(this, x, y, existingShape);
    }

    escapeHtml(text) {
        return DiagramTextEditor.escapeHtml(text);
    }

    unescapeHtml(text) {
        return DiagramTextEditor.unescapeHtml(text);
    }

    saveToStorage() {
        DiagramStorage.saveToStorage(this);
    }

    saveViewportToStorage() {
        DiagramStorage.saveViewportToStorage(this);
    }

    undo() {
        DiagramStorage.undo(this);
    }

    redo() {
        DiagramStorage.redo(this);
    }

    loadFromStorage() {
        this.shapes = DiagramStorage.loadFromStorage();
    }

    getInitialStrategyDiagram() {
        return DiagramStorage.getInitialStrategyDiagram();
    }

    getSelectedShapesBoundingBox() {
        return DiagramStorage.getSelectedShapesBoundingBox(this.selectedShapes, this.shapes);
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.save();
        this.ctx.translate(this.panX, this.panY);
        this.ctx.scale(this.zoom, this.zoom);

        // Filter out broken connectors
        this.shapes = this.shapes.filter(shape => {
            if (shape.type === 'connector') {
                const f = this.shapes.find(s => s.id === shape.fromId);
                const t = this.shapes.find(s => s.id === shape.toId);
                return !!(f && t);
            }
            return true;
        });

        // Draw all saved shapes
        this.shapes.forEach(shape => {
            ShapeRenderer.drawShape(this.ctx, shape, this.shapes, this.currentLineWidth);
        });

        // Draw draft shapes/connectors
        if (this.isDrawingConnectorFromPort) {
            this.ctx.save();
            this.ctx.strokeStyle = this.currentColor;
            this.ctx.lineWidth = this.currentLineWidth;
            this.ctx.fillStyle = this.currentColor;
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';

            let targetHit = null;
            let targetPort = null;
            for (let i = this.shapes.length - 1; i >= 0; i--) {
                const s = this.shapes[i];
                targetPort = Geometry.checkConnectionPortHit(s, { localX: this.currentX, localY: this.currentY }, this.zoom);
                if (targetPort) {
                    targetHit = s;
                    break;
                }
                if (Geometry.isPointNearShapeBoundary(s, this.currentX, this.currentY)) {
                    targetHit = s;
                    break;
                }
            }

            if (this.connectFromShape && targetHit && targetHit.id !== this.connectFromShape.id) {
                if (!targetPort) {
                    const center = Geometry.getShapeCenter(targetHit);
                    const dx = this.currentX - center.x;
                    const dy = this.currentY - center.y;
                    targetPort = { name: Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'conn-r' : 'conn-l') : (dy > 0 ? 'conn-b' : 'conn-t') };
                }
                ShapeRenderer.drawCurvedConnector(this.ctx, this.connectFromShape, targetHit, this.currentLineWidth, this.connectFromPortName || 'conn-r', targetPort.name);
            } else {
                ShapeRenderer.drawArrowPath(this.ctx, this.startX, this.startY, this.currentX, this.currentY, this.currentLineWidth);
            }
            this.ctx.restore();
        } else if (this.isDrawing) {
            this.ctx.save();
            this.ctx.strokeStyle = this.currentColor;
            this.ctx.lineWidth = this.currentLineWidth;
            this.ctx.fillStyle = this.currentColor;
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';

            if (this.currentTool === 'pencil') {
                if (this.tempPencilPoints.length > 0) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(this.tempPencilPoints[0].x, this.tempPencilPoints[0].y);
                    for (let i = 1; i < this.tempPencilPoints.length; i++) {
                        this.ctx.lineTo(this.tempPencilPoints[i].x, this.tempPencilPoints[i].y);
                    }
                    this.ctx.stroke();
                }
            } else if (this.currentTool === 'line') {
                this.ctx.beginPath();
                this.ctx.moveTo(this.startX, this.startY);
                this.ctx.lineTo(this.currentX, this.currentY);
                this.ctx.stroke();
            } else if (this.currentTool === 'arrow') {
                let targetHit = null;
                let targetPort = null;
                for (let i = this.shapes.length - 1; i >= 0; i--) {
                    const s = this.shapes[i];
                    targetPort = Geometry.checkConnectionPortHit(s, { localX: this.currentX, localY: this.currentY }, this.zoom);
                    if (targetPort) {
                        targetHit = s;
                        break;
                    }
                    if (Geometry.isPointNearShapeBoundary(s, this.currentX, this.currentY)) {
                        targetHit = s;
                        break;
                    }
                }
                if (this.connectFromShape && targetHit && targetHit.id !== this.connectFromShape.id) {
                    if (!this.connectFromPortName) {
                        const p1 = Geometry.getShapeCenter(this.connectFromShape);
                        const p2 = Geometry.getShapeCenter(targetHit);
                        const sx = p2.x - p1.x;
                        const sy = p2.y - p1.y;
                        this.connectFromPortName = Math.abs(sx) > Math.abs(sy) ? (sx > 0 ? 'conn-r' : 'conn-l') : (sy > 0 ? 'conn-b' : 'conn-t');
                    }
                    if (!targetPort) {
                        const p1 = Geometry.getShapeCenter(this.connectFromShape);
                        const p2 = Geometry.getShapeCenter(targetHit);
                        const sx = p2.x - p1.x;
                        const sy = p2.y - p1.y;
                        targetPort = { name: Math.abs(sx) > Math.abs(sy) ? (sx > 0 ? 'conn-l' : 'conn-r') : (sy > 0 ? 'conn-t' : 'conn-b') };
                    }
                    ShapeRenderer.drawCurvedConnector(this.ctx, this.connectFromShape, targetHit, this.currentLineWidth, this.connectFromPortName, targetPort.name);
                } else {
                    ShapeRenderer.drawArrowPath(this.ctx, this.startX, this.startY, this.currentX, this.currentY, this.currentLineWidth);
                }
            } else if (['rect', 'diamond', 'parallelogram'].includes(this.currentTool)) {
                const x = Math.min(this.startX, this.currentX);
                const y = Math.min(this.startY, this.currentY);
                const w = Math.abs(this.currentX - this.startX);
                const h = Math.abs(this.currentY - this.startY);
                this.ctx.beginPath();
                if (this.currentTool === 'rect') {
                    this.ctx.rect(x, y, w, h);
                } else if (this.currentTool === 'diamond') {
                    this.ctx.moveTo(x + w / 2, y);
                    this.ctx.lineTo(x + w, y + h / 2);
                    this.ctx.lineTo(x + w / 2, y + h);
                    this.ctx.lineTo(x, y + h / 2);
                    this.ctx.closePath();
                } else if (this.currentTool === 'parallelogram') {
                    const skew = Math.min(24, w * 0.2);
                    this.ctx.moveTo(x + skew, y);
                    this.ctx.lineTo(x + w, y);
                    this.ctx.lineTo(x + w - skew, y + h);
                    this.ctx.lineTo(x, y + h);
                    this.ctx.closePath();
                }
                if (this.currentFill) {
                    this.ctx.save();
                    this.ctx.globalAlpha = 0.25;
                    this.ctx.fill();
                    this.ctx.restore();
                }
                this.ctx.stroke();
            } else if (this.currentTool === 'circle') {
                const dx = this.currentX - this.startX;
                const dy = this.currentY - this.startY;
                const r = Math.sqrt(dx * dx + dy * dy);
                this.ctx.beginPath();
                this.ctx.arc(this.startX, this.startY, r, 0, 2 * Math.PI);
                if (this.currentFill) {
                    this.ctx.save();
                    this.ctx.globalAlpha = 0.25;
                    this.ctx.fill();
                    this.ctx.restore();
                }
                this.ctx.stroke();
            }
            this.ctx.restore();
        }

        // Connections & Ports highlight
        const shapesToShowPorts = new Set();
        const activeTool = this.currentTool;

        if (this.isDrawingConnectorFromPort || (this.isDrawing && activeTool === 'arrow')) {
            this.shapes.forEach(s => {
                if (s.type !== 'connector') shapesToShowPorts.add(s);
            });
        } else if (activeTool === 'select') {
            this.selectedShapes.forEach(s => {
                if (s.type !== 'connector') shapesToShowPorts.add(s);
            });
            if (this.hoveredShape && this.hoveredShape.type !== 'connector') {
                shapesToShowPorts.add(this.hoveredShape);
            }
        } else if (activeTool === 'arrow' && this.hoveredShape && this.hoveredShape.type !== 'connector') {
            shapesToShowPorts.add(this.hoveredShape);
        }

        // Draw Selection Bounding Box & Resizing Handles
        if (this.currentTool === 'select' && this.selectedShapes.length > 0) {
            const bbox = this.getSelectedShapesBoundingBox();
            if (bbox) {
                this.ctx.save();
                this.ctx.strokeStyle = '#06b6d4';
                this.ctx.lineWidth = 1.5;
                this.ctx.setLineDash([6, 4]);
                const pad = 6;
                const hSize = Math.max(10, 10 / this.zoom);
                this.ctx.strokeRect(bbox.x - pad, bbox.y - pad, bbox.w + pad * 2, bbox.h + pad * 2);
                
                this.ctx.fillStyle = '#ffffff';
                this.ctx.strokeStyle = '#06b6d4';
                this.ctx.lineWidth = 1.5;
                this.ctx.setLineDash([]);
                const corners = [
                    { x: bbox.x - pad, y: bbox.y - pad },
                    { x: bbox.x + bbox.w + pad, y: bbox.y - pad },
                    { x: bbox.x - pad, y: bbox.y + bbox.h + pad },
                    { x: bbox.x + bbox.w + pad, y: bbox.y + bbox.h + pad }
                ];
                corners.forEach(c => {
                    this.ctx.fillRect(c.x - hSize / 2, c.y - hSize / 2, hSize, hSize);
                    this.ctx.strokeRect(c.x - hSize / 2, c.y - hSize / 2, hSize, hSize);
                });
                this.ctx.restore();
            }
        }

        // Selection area box preview
        if (this.isSelectingArea) {
            this.ctx.save();
            this.ctx.strokeStyle = 'rgba(6, 182, 212, 0.7)';
            this.ctx.lineWidth = 1;
            this.ctx.setLineDash([4, 4]);
            this.ctx.fillStyle = 'rgba(6, 182, 212, 0.08)';
            const x = Math.min(this.selectionBoxStart.x, this.selectionBoxEnd.x);
            const y = Math.min(this.selectionBoxStart.y, this.selectionBoxEnd.y);
            const w = Math.abs(this.selectionBoxEnd.x - this.selectionBoxStart.x);
            const h = Math.abs(this.selectionBoxEnd.y - this.selectionBoxStart.y);
            this.ctx.fillRect(x, y, w, h);
            this.ctx.strokeRect(x, y, w, h);
            this.ctx.restore();
        }

        // Draw Connection Ports
        if (shapesToShowPorts.size > 0) {
            this.ctx.save();
            this.ctx.fillStyle = '#10b981';
            this.ctx.strokeStyle = '#06b6d4';
            this.ctx.lineWidth = 1.2;

            shapesToShowPorts.forEach(shape => {
                const ports = Geometry.getShapePorts(shape);
                ports.forEach(p => {
                    this.ctx.beginPath();
                    this.ctx.arc(p.x, p.y, 4, 0, 2 * Math.PI);
                    this.ctx.fill();
                    this.ctx.stroke();
                });
            });

            this.ctx.restore();
        }

        this.ctx.restore();
    }

    destroy() {
        if (this._boundKeyDown) {
            window.removeEventListener('keydown', this._boundKeyDown);
        }
        if (this._boundKeyUp) {
            window.removeEventListener('keyup', this._boundKeyUp);
        }
        if (this.activeTextInput) {
            this.activeTextInput.remove();
            this.activeTextInput = null;
        }
    }
}