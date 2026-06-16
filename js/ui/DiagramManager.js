import { Geometry } from './diagram/Geometry.js';
import { ShapeRenderer } from './diagram/ShapeRenderer.js';

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
        this.currentTool = 'select'; // select, pan, pencil, line, arrow, rect, circle, text, eraser
        this.currentColor = '#22c55e'; // green
        this.currentLineWidth = 4;
        this.currentFill = false;
        this.currentFontSize = 14;
        this.onSaveCallback = null;

        // Viewport transform
        this.zoom = 1;
        this.panX = 0;
        this.panY = 0;

        // Drawing state
        this.isDrawing = false;
        this.isPanning = false;
        this.isResizing = false;
        this.isDrawingConnectorFromPort = false; // for dragging connector from edge handles
        this.activeHandle = null;
        this.resizeStartData = null;
        this.connectFromShape = null; // for shape-to-shape connections
        this.connectFromPortName = null; // starting port side
        
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
        this.shapeDragOffsets = null; // for relative movements
        this.dKeyPressed = false;

        // Text input element reference
        this.activeTextInput = null;

        // Spacebar state for panning
        this.spacePressed = false;

        this.undoStack = [];
        this.redoStack = [];

        this.loadFromStorage();
        this.undoStack.push(JSON.stringify(this.shapes));

        this.initResizeObserver();
        this.initEvents();
        this.initControls();
        this.draw();

        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    initResizeObserver() {
        const resizeObserver = new ResizeObserver(entries => {
            for (let entry of entries) {
                this.resizeCanvas();
            }
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
        // Mouse Down
        this.canvas.addEventListener('mousedown', (e) => {
            if (e.button === 1) { // Middle mouse wheel button click
                e.preventDefault();
                const coords = this.getMouseCoords(e);
                this.isPanning = true;
                this.dragStartX = coords.screenX - this.panX;
                this.dragStartY = coords.screenY - this.panY;
                this.canvas.style.cursor = 'grabbing';
                return;
            }
            if (e.button !== 0) return; // Only left click for regular tools
            if (this.dKeyPressed) {
                e.preventDefault();
                e.stopPropagation();
            }
            this.handleMouseDown(e);
        });

        // Mouse Move
        this.canvas.addEventListener('mousemove', (e) => {
            this.handleMouseMove(e);
        });

        // Mouse Up / Leave
        const handleMouseUp = () => {
            this.handleMouseUp();
        };
        this.canvas.addEventListener('mouseup', handleMouseUp);
        this.canvas.addEventListener('mouseleave', handleMouseUp);

        // Zoom via scroll wheel (only when Ctrl is held)
        this.canvas.addEventListener('wheel', (e) => {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                this.handleWheel(e);
            }
            // Without Ctrl, let the browser scroll the page normally
        }, { passive: false });

        // Keyboard listener for Spacebar (pan shortcut) and Delete (delete shape)
        this._boundKeyDown = (e) => {
            // Only capture global shortcuts if not typing in text inputs
            if (document.activeElement.tagName === 'INPUT' || 
                document.activeElement.tagName === 'TEXTAREA') {
                return;
            }

            if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) {
                e.preventDefault();
                this.undo();
                return;
            }
            if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || e.key === 'Y')) {
                e.preventDefault();
                this.redo();
                return;
            }

            if (e.code === 'Space') {
                this.spacePressed = true;
                if (this.currentTool !== 'pan') {
                    this.canvas.style.cursor = 'grab';
                }
            } else if (e.key === 'd' || e.key === 'D') {
                this.dKeyPressed = true;
            } else if (e.key === 'a' || e.key === 'A' || e.key === 'v' || e.key === 'V') {
                this.selectTool('select');
            } else if (e.key === 'h' || e.key === 'H') {
                this.selectTool('pan');
            } else if (e.key === 'o' || e.key === 'O') {
                this.selectTool('pencil');
            } else if (e.key === 'u' || e.key === 'U') {
                this.selectTool('arrow');
            } else if (e.key === 'w' || e.key === 'W') {
                this.selectTool('text');
            } else if (e.key === 'e' || e.key === 'E') {
                this.selectTool('eraser');
            } else if (e.key === 't' || e.key === 'T') {
                if (this.currentTool === 'rect') {
                    this.toggleFill();
                } else {
                    this.selectTool('rect');
                }
            } else if (e.key === 'c' || e.key === 'C') {
                if (this.currentTool === 'circle') {
                    this.toggleFill();
                } else {
                    this.selectTool('circle');
                }
            } else if (e.key === 'y' || e.key === 'Y') {
                if (this.currentTool === 'diamond') {
                    this.toggleFill();
                } else {
                    this.selectTool('diamond');
                }
            } else if (e.key === 'p' || e.key === 'P') {
                if (this.currentTool === 'parallelogram') {
                    this.toggleFill();
                } else {
                    this.selectTool('parallelogram');
                }
            } else if (e.key === 'l' || e.key === 'L') {
                this.selectTool('line');
            } else if (e.key === 'Delete' || e.key === 'Backspace') {
                if (this.selectedShapes.length > 0) {
                    const idsToDelete = new Set(this.selectedShapes.map(s => s.id));
                    this.shapes = this.shapes.filter(s => {
                        if (idsToDelete.has(s.id)) return false;
                        if (s.type === 'connector') {
                            return !idsToDelete.has(s.fromId) && !idsToDelete.has(s.toId);
                        }
                        return true;
                    });
                    this.selectedShapes = [];
                    this.selectedShape = null;
                    this.saveToStorage();
                    this.draw();
                }
            }
        };

        this._boundKeyUp = (e) => {
            if (e.code === 'Space') {
                this.spacePressed = false;
                this.updateCursor();
            } else if (e.key === 'd' || e.key === 'D') {
                this.dKeyPressed = false;
            }
        };

        window.addEventListener('keydown', this._boundKeyDown);
        window.addEventListener('keyup', this._boundKeyUp);

        // Double Click to Edit Text or Create Text at double-click location
        this.canvas.addEventListener('dblclick', (e) => {
            this.handleDoubleClick(e);
        });
    }

    initControls() {
        // Tool buttons
        const toolBtns = document.querySelectorAll('.tool-btn');
        toolBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.selectTool(btn.dataset.tool);
            });
        });

        // Color buttons
        const colorBtns = document.querySelectorAll('.color-btn');
        colorBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                colorBtns.forEach(b => b.classList.remove('active-color', 'border-cyan-400', 'scale-110'));
                btn.classList.add('active-color', 'border-cyan-400', 'scale-110');
                this.currentColor = btn.dataset.color;
                
                // If shape is selected, change its color
                if (this.selectedShape && this.currentTool === 'select') {
                    this.selectedShape.color = this.currentColor;
                    this.saveToStorage();
                    this.draw();
                }
            });
        });

        // Line width dropdown
        const widthSelect = document.getElementById('diagram-select-width');
        if (widthSelect) {
            widthSelect.addEventListener('change', (e) => {
                this.currentLineWidth = parseInt(e.target.value, 10);
                if (this.selectedShape && this.currentTool === 'select') {
                    this.selectedShape.lineWidth = this.currentLineWidth;
                    this.saveToStorage();
                    this.draw();
                }
            });
        }

        // Font size dropdown
        const fontSizeSelect = document.getElementById('diagram-select-font-size');
        if (fontSizeSelect) {
            fontSizeSelect.addEventListener('change', (e) => {
                this.currentFontSize = parseInt(e.target.value, 10);
                if (this.currentTool === 'select') {
                    let changed = false;
                    if (this.selectedShape) {
                        this.selectedShape.fontSize = this.currentFontSize;
                        changed = true;
                    }
                    this.selectedShapes.forEach(s => {
                        s.fontSize = this.currentFontSize;
                        changed = true;
                    });
                    if (changed) {
                        this.saveToStorage();
                        this.draw();
                    }
                }
            });
        }

        // Fill shape checkbox
        const fillToggle = document.getElementById('diagram-toggle-fill');
        if (fillToggle) {
            fillToggle.addEventListener('change', (e) => {
                this.currentFill = e.target.checked;
                if (this.selectedShape && this.currentTool === 'select') {
                    if (this.selectedShape.type === 'rect' || this.selectedShape.type === 'circle' || this.selectedShape.type === 'diamond' || this.selectedShape.type === 'parallelogram') {
                        this.selectedShape.fill = this.currentFill;
                        this.saveToStorage();
                        this.draw();
                    }
                }
            });
        }

        // Zoom Buttons
        const btnZoomIn = document.getElementById('diagram-btn-zoom-in');
        const btnZoomOut = document.getElementById('diagram-btn-zoom-out');
        const btnResetZoom = document.getElementById('diagram-btn-reset-zoom');
        const btnClear = document.getElementById('diagram-btn-clear');

        if (btnZoomIn) btnZoomIn.addEventListener('click', () => this.adjustZoom(1.2));
        if (btnZoomOut) btnZoomOut.addEventListener('click', () => this.adjustZoom(1 / 1.2));
        if (btnResetZoom) btnResetZoom.addEventListener('click', () => {
            this.zoom = 1;
            this.panX = 0;
            this.panY = 0;
            this.updateZoomPercent();
            this.draw();
        });
        const btnUndo = document.getElementById('diagram-btn-undo');
        const btnRedo = document.getElementById('diagram-btn-redo');
        if (btnUndo) btnUndo.addEventListener('click', () => this.undo());
        if (btnRedo) btnRedo.addEventListener('click', () => this.redo());

        if (btnClear) {
            btnClear.addEventListener('click', () => {
                if (confirm('ต้องการล้างบอร์ดเขียนแบบใช่หรือไม่? (Clear all shapes?)')) {
                    this.shapes = [];
                    this.selectedShapes = [];
                    this.selectedShape = null;
                    this.saveToStorage();
                    this.draw();
                }
            });
        }

        // Help Modal toggle
        const btnHelp = document.getElementById('diagram-btn-help');
        const btnCloseHelp = document.getElementById('diagram-btn-close-help');
        const helpModal = document.getElementById('diagram-help-modal');

        if (btnHelp && helpModal) {
            btnHelp.addEventListener('click', () => {
                helpModal.classList.remove('hidden');
            });
        }
        if (btnCloseHelp && helpModal) {
            btnCloseHelp.addEventListener('click', () => {
                helpModal.classList.add('hidden');
            });
        }
    }

    selectTool(toolName) {
        const toolBtns = document.querySelectorAll('.tool-btn');
        toolBtns.forEach(btn => {
            if (btn.dataset.tool === toolName) {
                btn.classList.add('active', 'bg-slate-800', 'text-cyan-400');
            } else {
                btn.classList.remove('active', 'bg-slate-800', 'text-cyan-400');
            }
        });
        
        this.currentTool = toolName;
        this.updateCursor();
        if (this.currentTool !== 'select') {
            this.selectedShapes = [];
            this.selectedShape = null;
            this.draw();
        }
    }

    toggleFill() {
        this.currentFill = !this.currentFill;
        const fillToggle = document.getElementById('diagram-toggle-fill');
        if (fillToggle) {
            fillToggle.checked = this.currentFill;
        }
        
        // Update selected shapes fill
        if (this.selectedShapes.length > 0) {
            this.selectedShapes.forEach(shape => {
                if (shape.type === 'rect' || shape.type === 'circle' || shape.type === 'diamond' || shape.type === 'parallelogram') {
                    shape.fill = this.currentFill;
                }
            });
            this.saveToStorage();
        }
        this.draw();
    }

    updateCursor() {
        if (this.spacePressed || this.currentTool === 'pan') {
            this.canvas.style.cursor = 'grabbing';
        } else if (this.currentTool === 'select') {
            this.canvas.style.cursor = 'default';
        } else if (this.currentTool === 'text') {
            this.canvas.style.cursor = 'text';
        } else {
            this.canvas.style.cursor = 'crosshair';
        }
    }

    adjustZoom(factor) {
        const newZoom = Math.min(4, Math.max(0.15, this.zoom * factor));
        
        // Zoom relative to canvas center
        const rect = this.canvas.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const localCenterX = (centerX - this.panX) / this.zoom;
        const localCenterY = (centerY - this.panY) / this.zoom;
        
        this.zoom = newZoom;
        this.panX = centerX - localCenterX * this.zoom;
        this.panY = centerY - localCenterY * this.zoom;
        
        this.updateZoomPercent();
        this.draw();
    }

    updateZoomPercent() {
        const text = document.getElementById('diagram-zoom-percent');
        if (text) {
            text.textContent = `${Math.round(this.zoom * 100)}%`;
        }
    }

    getMouseCoords(e) {
        const rect = this.canvas.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        const localX = (screenX - this.panX) / this.zoom;
        const localY = (screenY - this.panY) / this.zoom;
        return { screenX, screenY, localX, localY };
    }

    handleMouseDown(e) {
        const coords = this.getMouseCoords(e);
        this.startX = coords.localX;
        this.startY = coords.localY;
        this.currentX = coords.localX;
        this.currentY = coords.localY;

        // D + Left-click to delete any shape, text, line, or connector
        if (this.dKeyPressed && e.button === 0) {
            e.preventDefault();
            e.stopPropagation();
            const hit = Geometry.findShapeAt(this.shapes, coords.localX, coords.localY, this.zoom);
            if (hit) {
                // Delete the hit shape and any connectors connected to it
                this.shapes = this.shapes.filter(s => {
                    if (s === hit) return false;
                    if (s.type === 'connector') {
                        return s.fromId !== hit.id && s.toId !== hit.id;
                    }
                    return true;
                });
                if (this.selectedShape === hit) {
                    this.selectedShape = null;
                }
                this.selectedShapes = this.selectedShapes.filter(s => s !== hit);
                this.saveToStorage();
                this.draw();
                return;
            }
        }

        // Force pan if space is pressed
        const activeTool = this.spacePressed ? 'pan' : this.currentTool;

        if (activeTool === 'pan') {
            this.isPanning = true;
            this.dragStartX = coords.screenX - this.panX;
            this.dragStartY = coords.screenY - this.panY;
            this.canvas.style.cursor = 'grabbing';
            return;
        }

        if (activeTool === 'select') {
            // Check if we clicked a connection port handle on ANY shape
            let clickedPort = null;
            let portShape = null;
            for (let i = this.shapes.length - 1; i >= 0; i--) {
                const s = this.shapes[i];
                if (s.type === 'connector') continue;
                const port = Geometry.checkConnectionPortHit(s, coords, this.zoom);
                if (port) {
                    clickedPort = port;
                    portShape = s;
                    break;
                }
            }

            if (clickedPort && portShape) {
                this.isDrawingConnectorFromPort = true;
                this.connectFromShape = portShape;
                this.connectFromPortName = clickedPort.name;
                this.startX = clickedPort.x;
                this.startY = clickedPort.y;
                this.currentX = coords.localX;
                this.currentY = coords.localY;
                this.canvas.style.cursor = 'crosshair';
                this.draw();
                return;
            }

            // Check resize handles of group selection (multi-select)
            if (this.selectedShapes.length > 1 && this.currentTool === 'select') {
                const bbox = this.getSelectedShapesBoundingBox();
                if (bbox) {
                    const size = Math.max(12, 12 / this.zoom);
                    const groupHandles = [
                        { name: 'group-tl', x: bbox.x, y: bbox.y },
                        { name: 'group-tr', x: bbox.x + bbox.w, y: bbox.y },
                        { name: 'group-bl', x: bbox.x, y: bbox.y + bbox.h },
                        { name: 'group-br', x: bbox.x + bbox.w, y: bbox.y + bbox.h }
                    ];
                    let hitHandle = null;
                    for (const h of groupHandles) {
                        if (Math.abs(coords.localX - h.x) < size && Math.abs(coords.localY - h.y) < size) {
                            hitHandle = h.name;
                            break;
                        }
                    }
                    if (hitHandle) {
                        this.isResizing = true;
                        this.activeHandle = hitHandle;
                        this.groupResizeStart = {
                            x: bbox.x,
                            y: bbox.y,
                            w: bbox.w,
                            h: bbox.h
                        };
                        this.shapeResizeStarts = this.selectedShapes.map(s => {
                            let item = {
                                id: s.id,
                                type: s.type,
                                x: s.x,
                                y: s.y
                            };
                            if (s.w !== undefined) item.w = s.w;
                            if (s.h !== undefined) item.h = s.h;
                            if (s.radius !== undefined) item.radius = s.radius;
                            if (s.fontSize !== undefined) item.fontSize = s.fontSize || 14;
                            if (s.x2 !== undefined) item.x2 = s.x2;
                            if (s.y2 !== undefined) item.y2 = s.y2;
                            if (s.points !== undefined) item.points = s.points.map(p => ({ x: p.x, y: p.y }));
                            return item;
                        });
                        return;
                    }
                }
            }

            // Check resize handles of selected shape
            if (this.selectedShape) {
                const handle = Geometry.checkResizeHandleHit(this.selectedShape, coords, this.zoom);
                if (handle) {
                    this.isResizing = true;
                    this.activeHandle = handle;
                    
                    if (this.selectedShape.type === 'rect' || this.selectedShape.type === 'diamond' || this.selectedShape.type === 'parallelogram') {
                        this.resizeStartData = { 
                             x: this.selectedShape.x, 
                             y: this.selectedShape.y, 
                             w: this.selectedShape.w, 
                             h: this.selectedShape.h 
                        };
                    } else if (this.selectedShape.type === 'circle') {
                        this.resizeStartData = { 
                             x: this.selectedShape.x, 
                             y: this.selectedShape.y, 
                             radius: this.selectedShape.radius 
                        };
                    } else if (this.selectedShape.type === 'text') {
                        const fontSize = this.selectedShape.fontSize || 14;
                        const bbox = Geometry.getTextBoundingBox(this.selectedShape);
                        this.resizeStartData = { 
                             x: this.selectedShape.x, 
                             y: this.selectedShape.y, 
                             fontSize: fontSize, 
                             width: bbox.w, 
                             height: bbox.h 
                        };
                    } else if (this.selectedShape.type === 'pencil') {
                        const bbox = Geometry.getPencilBoundingBox(this.selectedShape);
                        this.resizeStartData = {
                            minX: bbox.x, minY: bbox.y, 
                            w: bbox.w, h: bbox.h,
                            points: this.selectedShape.points.map(p => ({ x: p.x, y: p.y }))
                        };
                    }
                    return;
                }
            }

            const hit = Geometry.findShapeAt(this.shapes, coords.localX, coords.localY, this.zoom);
            if (hit) {
                // If the hit shape is not in selectedShapes, make it the selected one
                if (!this.selectedShapes.includes(hit)) {
                    this.selectedShapes = [hit];
                    this.selectedShape = hit;
                }
                this.isDragging = true;
                
                // Select settings alignment
                this.currentColor = hit.color;
                this.currentLineWidth = hit.lineWidth;
                if (hit.fill !== undefined) this.currentFill = hit.fill;
                
                // Update UI elements to match selection properties
                const widthSelect = document.getElementById('diagram-select-width');
                if (widthSelect) widthSelect.value = hit.lineWidth;
                const fontSizeSelect = document.getElementById('diagram-select-font-size');
                if (fontSizeSelect) fontSizeSelect.value = hit.fontSize || 14;
                const fillToggle = document.getElementById('diagram-toggle-fill');
                if (fillToggle) fillToggle.checked = hit.fill || false;
                
                const colorBtns = document.querySelectorAll('.color-btn');
                colorBtns.forEach(btn => {
                    if (btn.dataset.color === hit.color) {
                        colorBtns.forEach(b => b.classList.remove('active-color', 'border-cyan-400', 'scale-110'));
                        btn.classList.add('active-color', 'border-cyan-400', 'scale-110');
                    }
                });

                // Save starting positions for panning/moving for ALL selected shapes
                this.shapeDragOffsets = new Map();
                this.selectedShapes.forEach(s => {
                    if (s.type === 'pencil') {
                        this.shapeDragOffsets.set(s.id, s.points.map(p => ({ dx: p.x - coords.localX, dy: p.y - coords.localY })));
                    } else {
                        this.shapeDragOffsets.set(s.id, {
                            dx: s.x - coords.localX,
                            dy: s.y - coords.localY,
                            dx2: s.x2 !== undefined ? s.x2 - coords.localX : 0,
                            dy2: s.y2 !== undefined ? s.y2 - coords.localY : 0,
                            radiusDx: s.radius !== undefined ? s.radius - coords.localX : 0
                        });
                    }
                });
            } else {
                // Clicked on empty space -> start selection area dragging!
                this.selectedShapes = [];
                this.selectedShape = null;
                this.isSelectingArea = true;
                this.selectionBoxStart = { x: coords.localX, y: coords.localY };
                this.selectionBoxEnd = { x: coords.localX, y: coords.localY };
            }
            this.draw();
            return;
        }

        if (activeTool === 'eraser') {
            const hit = Geometry.findShapeAt(this.shapes, coords.localX, coords.localY, this.zoom);
            if (hit) {
                this.shapes = this.shapes.filter(s => s !== hit);
                this.saveToStorage();
                this.draw();
            }
            return;
        }

        // Draw tools
        if (activeTool === 'arrow') {
            // Find if there is a shape where the click is near its boundary
            let startShape = null;
            let matchedPort = null;
            for (let i = this.shapes.length - 1; i >= 0; i--) {
                const s = this.shapes[i];
                matchedPort = Geometry.checkConnectionPortHit(s, coords, this.zoom);
                if (matchedPort) {
                    startShape = s;
                    break;
                }
                if (Geometry.isPointNearShapeBoundary(s, coords.localX, coords.localY)) {
                    startShape = s;
                    break;
                }
            }

            if (startShape) {
                this.connectFromShape = startShape;
                this.connectFromPortName = matchedPort ? matchedPort.name : null;
                const boundPt = Geometry.getShapeBoundaryPoint(startShape, coords);
                this.startX = matchedPort ? matchedPort.x : boundPt.x;
                this.startY = matchedPort ? matchedPort.y : boundPt.y;
            } else {
                this.connectFromShape = null;
                this.connectFromPortName = null;
            }
        }

        this.isDrawing = true;
        if (activeTool === 'pencil') {
            this.tempPencilPoints = [{ x: coords.localX, y: coords.localY }];
        }
    }

    handleMouseMove(e) {
        const coords = this.getMouseCoords(e);
        this.currentX = coords.localX;
        this.currentY = coords.localY;

        if (this.isPanning) {
            this.panX = coords.screenX - this.dragStartX;
            this.panY = coords.screenY - this.dragStartY;
            this.draw();
            return;
        }

        if (this.isDrawingConnectorFromPort) {
            this.draw();
            return;
        }

        if (this.isResizing && this.activeHandle && this.activeHandle.startsWith('group-')) {
            const handle = this.activeHandle;
            const start = this.groupResizeStart;
            
            let newMinX = start.x;
            let newMinY = start.y;
            let newW = start.w;
            let newH = start.h;
            
            if (handle === 'group-br') {
                newW = Math.max(10, coords.localX - start.x);
                newH = Math.max(10, coords.localY - start.y);
            } else if (handle === 'group-bl') {
                newMinX = Math.min(coords.localX, start.x + start.w - 10);
                newW = start.x + start.w - newMinX;
                newH = Math.max(10, coords.localY - start.y);
            } else if (handle === 'group-tr') {
                newMinY = Math.min(coords.localY, start.y + start.h - 10);
                newH = start.y + start.h - newMinY;
                newW = Math.max(10, coords.localX - start.x);
            } else if (handle === 'group-tl') {
                newMinX = Math.min(coords.localX, start.x + start.w - 10);
                newMinY = Math.min(coords.localY, start.y + start.h - 10);
                newW = start.x + start.w - newMinX;
                newH = start.y + start.h - newMinY;
            }
            
            const scaleX = newW / start.w;
            const scaleY = newH / start.h;
            
            this.selectedShapes.forEach(shape => {
                const itemStart = this.shapeResizeStarts.find(s => s.id === shape.id);
                if (!itemStart) return;
                
                const relX = (itemStart.x - start.x) / start.w;
                const relY = (itemStart.y - start.y) / start.h;
                
                shape.x = newMinX + relX * newW;
                shape.y = newMinY + relY * newH;
                
                if (shape.w !== undefined && itemStart.w !== undefined) {
                    shape.w = Math.max(5, itemStart.w * scaleX);
                }
                if (shape.h !== undefined && itemStart.h !== undefined) {
                    shape.h = Math.max(5, itemStart.h * scaleY);
                }
                if (shape.radius !== undefined && itemStart.radius !== undefined) {
                    shape.radius = Math.max(2, itemStart.radius * (scaleX + scaleY) / 2);
                }
                if (shape.fontSize !== undefined && itemStart.fontSize !== undefined) {
                    shape.fontSize = Math.max(6, Math.min(120, Math.round(itemStart.fontSize * (scaleX + scaleY) / 2)));
                }
                if (shape.x2 !== undefined && itemStart.x2 !== undefined) {
                    const relX2 = (itemStart.x2 - start.x) / start.w;
                    const relY2 = (itemStart.y2 - start.y) / start.h;
                    shape.x2 = newMinX + relX2 * newW;
                    shape.y2 = newMinY + relY2 * newH;
                }
                if (shape.points !== undefined && itemStart.points !== undefined) {
                    shape.points = itemStart.points.map(p => {
                        const rx = (p.x - start.x) / start.w;
                        const ry = (p.y - start.y) / start.h;
                        return {
                            x: newMinX + rx * newW,
                            y: newMinY + ry * newH
                        };
                    });
                }
            });
            
            this.draw();
            return;
        }

        if (this.isResizing && this.selectedShape) {
            const shape = this.selectedShape;
            const handle = this.activeHandle;
            const start = this.resizeStartData;

            if (shape.type === 'rect' || shape.type === 'diamond' || shape.type === 'parallelogram') {
                if (handle === 'rect-br') {
                    shape.w = Math.max(10, coords.localX - shape.x);
                    shape.h = Math.max(10, coords.localY - shape.y);
                } else if (handle === 'rect-bl') {
                    const newX = Math.min(coords.localX, start.x + start.w - 10);
                    shape.w = start.x + start.w - newX;
                    shape.x = newX;
                    shape.h = Math.max(10, coords.localY - shape.y);
                } else if (handle === 'rect-tr') {
                    const newY = Math.min(coords.localY, start.y + start.h - 10);
                    shape.h = start.y + start.h - newY;
                    shape.y = newY;
                    shape.w = Math.max(10, coords.localX - shape.x);
                } else if (handle === 'rect-tl') {
                    const newX = Math.min(coords.localX, start.x + start.w - 10);
                    const newY = Math.min(coords.localY, start.y + start.h - 10);
                    shape.w = start.x + start.w - newX;
                    shape.x = newX;
                    shape.h = start.y + start.h - newY;
                    shape.y = newY;
                }
            } else if (shape.type === 'circle') {
                if (handle === 'circle-r') {
                    shape.radius = Math.max(5, Math.abs(coords.localX - shape.x));
                } else if (handle === 'circle-l') {
                    shape.radius = Math.max(5, Math.abs(shape.x - coords.localX));
                } else if (handle === 'circle-b') {
                    shape.radius = Math.max(5, Math.abs(coords.localY - shape.y));
                } else if (handle === 'circle-t') {
                    shape.radius = Math.max(5, Math.abs(shape.y - coords.localY));
                }
            } else if (shape.type === 'line' || shape.type === 'arrow') {
                if (handle === 'line-start') {
                    shape.x = coords.localX;
                    shape.y = coords.localY;
                } else if (handle === 'line-end') {
                    shape.x2 = coords.localX;
                    shape.y2 = coords.localY;
                }
            } else if (shape.type === 'text') {
                let currentWidth = start.width;
                if (handle === 'text-br') {
                    currentWidth = coords.localX - shape.x;
                } else if (handle === 'text-bl') {
                    currentWidth = (start.x + start.width) - coords.localX;
                    shape.x = coords.localX;
                } else if (handle === 'text-tr') {
                    currentWidth = coords.localX - shape.x;
                    shape.y = coords.localY + start.fontSize;
                } else if (handle === 'text-tl') {
                    currentWidth = (start.x + start.width) - coords.localX;
                    shape.x = coords.localX;
                    shape.y = coords.localY + start.fontSize;
                }
                const scale = Math.max(0.2, currentWidth / start.width);
                shape.fontSize = Math.max(8, Math.min(120, Math.round(start.fontSize * scale)));
            } else if (shape.type === 'pencil') {
                let currentW = start.w;
                let currentH = start.h;
                let anchorX = start.minX;
                let anchorY = start.minY;

                if (handle === 'pencil-br') {
                    currentW = coords.localX - start.minX;
                    currentH = coords.localY - start.minY;
                } else if (handle === 'pencil-bl') {
                    anchorX = coords.localX;
                    currentW = (start.minX + start.w) - coords.localX;
                    currentH = coords.localY - start.minY;
                } else if (handle === 'pencil-tr') {
                    anchorY = coords.localY;
                    currentW = coords.localX - start.minX;
                    currentH = (start.minY + start.h) - coords.localY;
                } else if (handle === 'pencil-tl') {
                    anchorX = coords.localX;
                    anchorY = coords.localY;
                    currentW = (start.minX + start.w) - coords.localX;
                    currentH = (start.minY + start.h) - coords.localY;
                }

                const scaleX = start.w > 0 ? currentW / start.w : 1;
                const scaleY = start.h > 0 ? currentH / start.h : 1;
                
                shape.points = start.points.map(p => {
                    const relX = p.x - start.minX;
                    const relY = p.y - start.minY;
                    return {
                        x: anchorX + relX * scaleX,
                        y: anchorY + relY * scaleY
                    };
                });
            }
            this.draw();
            return;
        }

        if (this.isSelectingArea) {
            this.selectionBoxEnd = { x: coords.localX, y: coords.localY };
            this.draw();
            return;
        }

        if (this.isDragging && this.selectedShapes.length > 0) {
            this.selectedShapes.forEach(shape => {
                const offsets = this.shapeDragOffsets.get(shape.id);
                if (!offsets) return;

                if (shape.type === 'pencil') {
                    shape.points = shape.points.map((p, idx) => ({
                        x: coords.localX + offsets[idx].dx,
                        y: coords.localY + offsets[idx].dy
                    }));
                } else {
                    shape.x = coords.localX + offsets.dx;
                    shape.y = coords.localY + offsets.dy;
                    if (shape.x2 !== undefined) {
                        shape.x2 = coords.localX + offsets.dx2;
                        shape.y2 = coords.localY + offsets.dy2;
                    }
                }
            });
            this.draw();
            return;
        }

        if (this.isDrawing) {
            if (this.currentTool === 'pencil') {
                this.tempPencilPoints.push({ x: coords.localX, y: coords.localY });
            }
            this.draw();
            return;
        }

        // Hover detection when simple mouse move
        if (!this.isPanning && !this.isResizing && !this.isDragging && !this.isDrawingConnectorFromPort) {
            let foundHovered = null;
            for (let i = this.shapes.length - 1; i >= 0; i--) {
                const s = this.shapes[i];
                if (s.type === 'connector') continue;
                if (Geometry.findShapeAt(this.shapes, coords.localX, coords.localY, this.zoom) === s || 
                    Geometry.isPointNearShapeBoundary(s, coords.localX, coords.localY) || 
                    Geometry.checkConnectionPortHit(s, coords, this.zoom)) {
                    foundHovered = s;
                    break;
                }
            }
            if (this.hoveredShape !== foundHovered) {
                this.hoveredShape = foundHovered;
                this.draw();
            }
        }
    }

    handleMouseUp() {
        if (this.isSelectingArea) {
            this.isSelectingArea = false;
            const x1 = Math.min(this.selectionBoxStart.x, this.selectionBoxEnd.x);
            const y1 = Math.min(this.selectionBoxStart.y, this.selectionBoxEnd.y);
            const x2 = Math.max(this.selectionBoxStart.x, this.selectionBoxEnd.x);
            const y2 = Math.max(this.selectionBoxStart.y, this.selectionBoxEnd.y);

            if (Math.abs(this.selectionBoxEnd.x - this.selectionBoxStart.x) > 5 || 
                Math.abs(this.selectionBoxEnd.y - this.selectionBoxStart.y) > 5) {
                
                const selected = [];
                this.shapes.forEach(shape => {
                    if (shape.type === 'connector') return;
                    const center = Geometry.getShapeCenter(shape);
                    if (center.x >= x1 && center.x <= x2 && center.y >= y1 && center.y <= y2) {
                        selected.push(shape);
                    }
                });
                this.selectedShapes = selected;
                this.selectedShape = selected.length > 0 ? selected[0] : null;
            }
            this.draw();
            return;
        }

        if (this.isPanning) {
            this.isPanning = false;
            this.updateCursor();
            return;
        }

        if (this.isDrawingConnectorFromPort) {
            this.isDrawingConnectorFromPort = false;
            
            // Find released shape and closest target connection port
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
                // If not hit on a specific port, dynamically find closest port on target shape
                if (!targetPort) {
                    const center = Geometry.getShapeCenter(targetHit);
                    const dx = this.currentX - center.x;
                    const dy = this.currentY - center.y;
                    if (Math.abs(dx) > Math.abs(dy)) {
                        targetPort = { name: dx > 0 ? 'conn-r' : 'conn-l' };
                    } else {
                        targetPort = { name: dy > 0 ? 'conn-b' : 'conn-t' };
                    }
                }

                const newConnector = {
                    id: Date.now() + '-' + Math.round(Math.random() * 1000),
                    type: 'connector',
                    fromId: this.connectFromShape.id,
                    fromPort: this.connectFromPortName || 'conn-r',
                    toId: targetHit.id,
                    toPort: targetPort.name,
                    color: this.currentColor,
                    lineWidth: this.currentLineWidth
                };
                this.shapes.push(newConnector);
            }
            
            this.connectFromShape = null;
            this.connectFromPortName = null;
            this.saveToStorage();
            this.draw();
            return;
        }

        if (this.isResizing) {
            this.isResizing = false;
            this.activeHandle = null;
            this.saveToStorage();
            return;
        }

        if (this.isDragging) {
            this.isDragging = false;
            this.saveToStorage();
            return;
        }

        if (this.isDrawing) {
            this.isDrawing = false;
            const newShape = {
                id: Date.now() + '-' + Math.round(Math.random() * 1000),
                type: this.currentTool,
                color: this.currentColor,
                lineWidth: this.currentLineWidth
            };

            const dx = this.currentX - this.startX;
            const dy = this.currentY - this.startY;

            if (this.currentTool === 'pencil') {
                if (this.tempPencilPoints.length > 1) {
                    newShape.points = [...this.tempPencilPoints];
                    this.shapes.push(newShape);
                }
            } else if (this.currentTool === 'line') {
                if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
                    newShape.x = this.startX;
                    newShape.y = this.startY;
                    newShape.x2 = this.currentX;
                    newShape.y2 = this.currentY;
                    this.shapes.push(newShape);
                }
            } else if (this.currentTool === 'arrow') {
                if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
                    // Check if released near the boundary of another shape -> connection arrow
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
                        // Dynamic calculation of fromPort/toPort if not explicitly dragged from a handle
                        if (!this.connectFromPortName) {
                            const p1 = Geometry.getShapeCenter(this.connectFromShape);
                            const p2 = Geometry.getShapeCenter(targetHit);
                            const sx = p2.x - p1.x;
                            const sy = p2.y - p1.y;
                            if (Math.abs(sx) > Math.abs(sy)) {
                                this.connectFromPortName = sx > 0 ? 'conn-r' : 'conn-l';
                            } else {
                                this.connectFromPortName = sy > 0 ? 'conn-b' : 'conn-t';
                            }
                        }
                        if (!targetPort) {
                            const p1 = Geometry.getShapeCenter(this.connectFromShape);
                            const p2 = Geometry.getShapeCenter(targetHit);
                            const sx = p2.x - p1.x;
                            const sy = p2.y - p1.y;
                            if (Math.abs(sx) > Math.abs(sy)) {
                                targetPort = { name: sx > 0 ? 'conn-l' : 'conn-r' };
                            } else {
                                targetPort = { name: sy > 0 ? 'conn-t' : 'conn-b' };
                            }
                        }

                        newShape.type = 'connector';
                        newShape.fromId = this.connectFromShape.id;
                        newShape.fromPort = this.connectFromPortName;
                        newShape.toId = targetHit.id;
                        newShape.toPort = targetPort.name;
                        this.shapes.push(newShape);
                    } else {
                        // Regular straight arrow
                        newShape.x = this.startX;
                        newShape.y = this.startY;
                        newShape.x2 = this.currentX;
                        newShape.y2 = this.currentY;
                        this.shapes.push(newShape);
                    }
                }
            } else if (this.currentTool === 'rect') {
                if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
                    newShape.x = Math.min(this.startX, this.currentX);
                    newShape.y = Math.min(this.startY, this.currentY);
                    newShape.w = Math.abs(dx);
                    newShape.h = Math.abs(dy);
                    newShape.fill = this.currentFill;
                    this.shapes.push(newShape);
                }
            } else if (this.currentTool === 'diamond' || this.currentTool === 'parallelogram') {
                if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
                    newShape.x = Math.min(this.startX, this.currentX);
                    newShape.y = Math.min(this.startY, this.currentY);
                    newShape.w = Math.abs(dx);
                    newShape.h = Math.abs(dy);
                    newShape.fill = this.currentFill;
                    this.shapes.push(newShape);
                }
            } else if (this.currentTool === 'circle') {
                const r = Math.sqrt(dx * dx + dy * dy);
                if (r > 2) {
                    newShape.x = this.startX;
                    newShape.y = this.startY;
                    newShape.radius = r;
                    newShape.fill = this.currentFill;
                    this.shapes.push(newShape);
                }
            } else if (this.currentTool === 'text') {
                this.createTextEditor(this.startX, this.startY);
            }

            this.connectFromShape = null;
            this.connectFromPortName = null;
            this.tempPencilPoints = [];
            this.saveToStorage();
            this.draw();
        }
    }

    handleDoubleClick(e) {
        const coords = this.getMouseCoords(e);
        
        // If clicking on text, edit it
        const hit = Geometry.findShapeAt(this.shapes, coords.localX, coords.localY, this.zoom);
        if (hit) {
            if (hit.type === 'text') {
                this.selectedShapes = [];
                this.selectedShape = null; // deselect
                const center = Geometry.getShapeCenter(hit);
                this.createTextEditor(center.x, center.y, hit);
                return;
            } else if (hit.type === 'line' || hit.type === 'arrow' || hit.type === 'connector' || hit.type === 'rect' || hit.type === 'circle' || hit.type === 'diamond' || hit.type === 'parallelogram') {
                this.selectedShapes = [];
                this.selectedShape = null; // deselect
                let center;
                if (hit.type === 'connector') {
                    center = Geometry.getConnectorCenter(hit, this.shapes);
                } else {
                    center = Geometry.getShapeCenter(hit);
                }
                this.createTextEditor(center.x, center.y, hit);
                return;
            }
        }
        
        if (this.currentTool === 'select') {
            this.createTextEditor(coords.localX, coords.localY);
        }
    }

    escapeHtml(text) {
        if (!text) return '';
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    unescapeHtml(text) {
        if (!text) return '';
        return text
            .replace(/&amp;/g, "&")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&quot;/g, '"')
            .replace(/&#039;/g, "'");
    }

    createTextEditor(x, y, existingShape = null) {
        if (this.activeTextInput) {
            this.activeTextInput.blur();
        }

        const rect = this.canvas.getBoundingClientRect();
        const screenX = x * this.zoom + this.panX + rect.left;
        const screenY = y * this.zoom + this.panY + rect.top;

        const input = document.createElement('textarea');
        input.value = existingShape ? this.unescapeHtml(existingShape.text) : '';
        const fontSize = existingShape ? (existingShape.fontSize || this.currentFontSize) : this.currentFontSize;
        input.style.position = 'fixed';
        input.style.left = `${screenX}px`;
        input.style.top = `${screenY}px`;
        input.style.transform = 'translate(-50%, -50%)';
        input.style.textAlign = 'center';
        input.style.font = `${fontSize * this.zoom}px Rajdhani, Kanit, sans-serif`;
        input.style.color = existingShape ? existingShape.color : this.currentColor;
        input.style.background = 'rgba(13, 18, 31, 0.95)';
        input.style.border = '1px solid #06b6d4';
        input.style.outline = 'none';
        input.style.padding = '4px 8px';
        input.style.borderRadius = '6px';
        input.style.zIndex = '1000';
        input.style.minWidth = '150px';
        input.style.minHeight = '30px';
        input.style.overflow = 'hidden';
        input.style.resize = 'both';

        document.body.appendChild(input);
        input.focus();
        this.activeTextInput = input;

        // Auto-resize height
        const autoResize = () => {
            input.style.height = 'auto';
            input.style.height = `${input.scrollHeight}px`;
        };
        input.addEventListener('input', autoResize);
        autoResize();

        const commitText = () => {
            const val = input.value.trim();
            if (val) {
                const escapedVal = this.escapeHtml(val);
                if (existingShape) {
                    existingShape.text = escapedVal;
                    if (!existingShape.fontSize) {
                        existingShape.fontSize = this.currentFontSize;
                    }
                } else {
                    const fontSize = this.currentFontSize;
                    const lines = escapedVal.split('\n');
                    const longest = lines.reduce((max, line) => Math.max(max, line.length), 0);
                    const w = longest * fontSize * 0.6;
                    const h = lines.length * (fontSize + 4);
                    
                    this.shapes.push({
                        id: Date.now() + '-' + Math.round(Math.random() * 1000),
                        type: 'text',
                        x: x - w / 2,
                        y: y - h / 2 + fontSize / 2,
                        text: escapedVal,
                        fontSize: fontSize,
                        color: this.currentColor,
                        lineWidth: this.currentLineWidth
                    });
                }
            } else if (existingShape) {
                // remove if empty
                if (existingShape.type === 'text') {
                    this.shapes = this.shapes.filter(s => s !== existingShape);
                } else {
                    delete existingShape.text;
                }
            }
            input.remove();
            this.activeTextInput = null;
            this.saveToStorage();
            this.draw();
        };

        input.addEventListener('blur', commitText);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                commitText();
            }
            if (e.key === 'Escape') {
                input.value = existingShape ? this.unescapeHtml(existingShape.text) : ''; // revert
                input.blur();
            }
        });
    }

    saveToStorage() {
        try {
            const state = JSON.stringify(this.shapes);
            localStorage.setItem('assistant_strategy_diagram', state);
            
            if (this.undoStack && (this.undoStack.length === 0 || this.undoStack[this.undoStack.length - 1] !== state)) {
                this.undoStack.push(state);
                if (this.undoStack.length > 100) this.undoStack.shift();
                this.redoStack = [];
            }

            if (this.onSaveCallback) {
                this.onSaveCallback(this.shapes);
            }
        } catch (e) {
            console.error("Failed to save diagram shapes:", e);
        }
    }

    undo() {
        if (this.undoStack && this.undoStack.length > 1) {
            const currentState = this.undoStack.pop();
            this.redoStack.push(currentState);
            
            const prevState = this.undoStack[this.undoStack.length - 1];
            this.shapes = JSON.parse(prevState);
            
            localStorage.setItem('assistant_strategy_diagram', prevState);
            this.selectedShapes = [];
            this.selectedShape = null;
            this.draw();
        }
    }

    redo() {
        if (this.redoStack && this.redoStack.length > 0) {
            const nextState = this.redoStack.pop();
            this.undoStack.push(nextState);
            
            this.shapes = JSON.parse(nextState);
            
            localStorage.setItem('assistant_strategy_diagram', nextState);
            this.selectedShapes = [];
            this.selectedShape = null;
            this.draw();
        }
    }

    loadFromStorage() {
        try {
            const data = localStorage.getItem('assistant_strategy_diagram');
            if (data && JSON.parse(data).length > 0) {
                this.shapes = JSON.parse(data);
                
                // Backwards compatibility: ensure all loaded shapes have an ID
                this.shapes.forEach(shape => {
                    if (!shape.id) {
                        shape.id = Date.now() + '-' + Math.round(Math.random() * 10000);
                    }
                });
            } else {
                this.shapes = this.getInitialStrategyDiagram();
                this.saveToStorage();
            }
        } catch (e) {
            console.error("Failed to load diagram shapes:", e);
            this.shapes = this.getInitialStrategyDiagram();
            this.saveToStorage();
        }
    }

    getInitialStrategyDiagram() {
        const id1 = 'shape-start';
        const id2 = 'shape-analyze';
        const id3 = 'shape-decision-trend';
        const id4 = 'shape-bullish-pullback';
        const id5 = 'shape-bearish-pullback';
        const id6 = 'shape-decision-trigger';
        const id7 = 'shape-buy-entry';

        return [
            // 1. Start (Circle)
            {
                id: id1,
                type: 'circle',
                x: 400,
                y: 70,
                radius: 40,
                color: '#38bdf8', // sky blue
                lineWidth: 4,
                fill: true,
                text: 'Start\nSession',
                fontSize: 14
            },
            // 2. Analyze (Parallelogram)
            {
                id: id2,
                type: 'parallelogram',
                x: 300,
                y: 160,
                w: 200,
                h: 80,
                color: '#eab308', // yellow
                lineWidth: 4,
                fill: false,
                text: 'Analyze Trend\n(EMA 20 / EMA 50)',
                fontSize: 14
            },
            // 3. Decision Trend (Diamond)
            {
                id: id3,
                type: 'diamond',
                x: 310,
                y: 300,
                w: 180,
                h: 120,
                color: '#ec4899', // pink
                lineWidth: 4,
                fill: false,
                text: 'Is Trend\nBullish?',
                fontSize: 14
            },
            // 4. Bullish Pullback (Rect)
            {
                id: id4,
                type: 'rect',
                x: 100,
                y: 460,
                w: 180,
                h: 80,
                color: '#22c55e', // green
                lineWidth: 4,
                fill: false,
                text: 'Wait for pullback\nto Support / EMA 20',
                fontSize: 14
            },
            // 5. Bearish Pullback (Rect)
            {
                id: id5,
                type: 'rect',
                x: 520,
                y: 460,
                w: 180,
                h: 80,
                color: '#ef4444', // red
                lineWidth: 4,
                fill: false,
                text: 'Wait for pullback\nto Resistance',
                fontSize: 14
            },
            // 6. Decision Trigger (Diamond)
            {
                id: id6,
                type: 'diamond',
                x: 100,
                y: 600,
                w: 180,
                h: 120,
                color: '#ec4899', // pink
                lineWidth: 4,
                fill: false,
                text: 'Price Bounces\n& Confirms?',
                fontSize: 14
            },
            // 7. BUY Entry (Rect)
            {
                id: id7,
                type: 'rect',
                x: 100,
                y: 780,
                w: 180,
                h: 80,
                color: '#22c55e', // green
                lineWidth: 4,
                fill: true,
                text: 'Enter BUY Position\nSL below Swing Low',
                fontSize: 14
            },

            // Connectors
            // Start -> Analyze
            {
                id: 'conn-1',
                type: 'connector',
                fromId: id1,
                fromPort: 'conn-b',
                toId: id2,
                toPort: 'conn-t',
                color: '#38bdf8',
                lineWidth: 3
            },
            // Analyze -> Decision Trend
            {
                id: 'conn-2',
                type: 'connector',
                fromId: id2,
                fromPort: 'conn-b',
                toId: id3,
                toPort: 'conn-t',
                color: '#eab308',
                lineWidth: 3
            },
            // Decision Trend -> Bullish Pullback (YES)
            {
                id: 'conn-3',
                type: 'connector',
                fromId: id3,
                fromPort: 'conn-l',
                toId: id4,
                toPort: 'conn-t',
                color: '#22c55e',
                lineWidth: 3,
                text: 'Yes',
                fontSize: 12
            },
            // Decision Trend -> Bearish Pullback (NO)
            {
                id: 'conn-4',
                type: 'connector',
                fromId: id3,
                fromPort: 'conn-r',
                toId: id5,
                toPort: 'conn-t',
                color: '#ef4444',
                lineWidth: 3,
                text: 'No',
                fontSize: 12
            },
            // Bullish Pullback -> Decision Trigger
            {
                id: 'conn-5',
                type: 'connector',
                fromId: id4,
                fromPort: 'conn-b',
                toId: id6,
                toPort: 'conn-t',
                color: '#22c55e',
                lineWidth: 3
            },
            // Decision Trigger -> BUY Entry (YES)
            {
                id: 'conn-6',
                type: 'connector',
                fromId: id6,
                fromPort: 'conn-b',
                toId: id7,
                toPort: 'conn-t',
                color: '#22c55e',
                lineWidth: 3,
                text: 'Yes',
                fontSize: 12
            }
        ];
    }

    getSelectedShapesBoundingBox() {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        this.selectedShapes.forEach(shape => {
            if (shape.type === 'rect' || shape.type === 'diamond' || shape.type === 'parallelogram') {
                minX = Math.min(minX, shape.x);
                minY = Math.min(minY, shape.y);
                maxX = Math.max(maxX, shape.x + shape.w);
                maxY = Math.max(maxY, shape.y + shape.h);
            } else if (shape.type === 'circle') {
                minX = Math.min(minX, shape.x - shape.radius);
                minY = Math.min(minY, shape.y - shape.radius);
                maxX = Math.max(maxX, shape.x + shape.radius);
                maxY = Math.max(maxY, shape.y + shape.radius);
            } else if (shape.type === 'text') {
                const bbox = Geometry.getTextBoundingBox(shape);
                minX = Math.min(minX, bbox.x);
                minY = Math.min(minY, bbox.y);
                maxX = Math.max(maxX, bbox.x + bbox.w);
                maxY = Math.max(maxY, bbox.y + bbox.h);
            } else if (shape.type === 'line' || shape.type === 'arrow') {
                minX = Math.min(minX, shape.x, shape.x2);
                minY = Math.min(minY, shape.y, shape.y2);
                maxX = Math.max(maxX, shape.x, shape.x2);
                maxY = Math.max(maxY, shape.y, shape.y2);
            } else if (shape.type === 'pencil') {
                const bbox = Geometry.getPencilBoundingBox(shape);
                minX = Math.min(minX, bbox.x);
                minY = Math.min(minY, bbox.y);
                maxX = Math.max(maxX, bbox.x + bbox.w);
                maxY = Math.max(maxY, bbox.y + bbox.h);
            } else if (shape.type === 'connector') {
                const bbox = Geometry.getConnectorBoundingBox(shape, this.shapes);
                minX = Math.min(minX, bbox.x);
                minY = Math.min(minY, bbox.y);
                maxX = Math.max(maxX, bbox.x + bbox.w);
                maxY = Math.max(maxY, bbox.y + bbox.h);
            }
        });
        
        if (minX === Infinity) return null;
        return {
            x: minX,
            y: minY,
            w: maxX - minX,
            h: maxY - minY
        };
    }

    handleWheel(e) {
        if (!e.ctrlKey && !e.metaKey) return;

        const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
        
        // Zoom relative to mouse position
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const localX = (mouseX - this.panX) / this.zoom;
        const localY = (mouseY - this.panY) / this.zoom;
        
        this.zoom = Math.min(4, Math.max(0.15, this.zoom * factor));
        this.panX = mouseX - localX * this.zoom;
        this.panY = mouseY - localY * this.zoom;
        
        this.updateZoomPercent();
        this.draw();
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.save();
        this.ctx.translate(this.panX, this.panY);
        this.ctx.scale(this.zoom, this.zoom);

        // Filter out any broken connectors
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

        // Draw current draft shape or connection preview
        if (this.isDrawingConnectorFromPort) {
            this.ctx.save();
            this.ctx.strokeStyle = this.currentColor;
            this.ctx.lineWidth = this.currentLineWidth;
            this.ctx.fillStyle = this.currentColor;
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';

            // Find if hovering near another shape's boundary or specific port
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
                // If not hit on a specific port, dynamically find closest port on target shape
                if (!targetPort) {
                    const center = Geometry.getShapeCenter(targetHit);
                    const dx = this.currentX - center.x;
                    const dy = this.currentY - center.y;
                    if (Math.abs(dx) > Math.abs(dy)) {
                        targetPort = { name: dx > 0 ? 'conn-r' : 'conn-l' };
                    } else {
                        targetPort = { name: dy > 0 ? 'conn-b' : 'conn-t' };
                    }
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
                // Check if hovering near the boundary of a target shape for snapping
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
                        if (Math.abs(sx) > Math.abs(sy)) {
                            this.connectFromPortName = sx > 0 ? 'conn-r' : 'conn-l';
                        } else {
                            this.connectFromPortName = sy > 0 ? 'conn-b' : 'conn-t';
                        }
                    }
                    if (!targetPort) {
                        const p1 = Geometry.getShapeCenter(this.connectFromShape);
                        const p2 = Geometry.getShapeCenter(targetHit);
                        const sx = p2.x - p1.x;
                        const sy = p2.y - p1.y;
                        if (Math.abs(sx) > Math.abs(sy)) {
                            targetPort = { name: sx > 0 ? 'conn-l' : 'conn-r' };
                        } else {
                            targetPort = { name: sy > 0 ? 'conn-t' : 'conn-b' };
                        }
                    }
                    ShapeRenderer.drawCurvedConnector(this.ctx, this.connectFromShape, targetHit, this.currentLineWidth, this.connectFromPortName, targetPort.name);
                } else {
                    // Draw normal straight arrow preview
                    ShapeRenderer.drawArrowPath(this.ctx, this.startX, this.startY, this.currentX, this.currentY, this.currentLineWidth);
                }
            } else if (this.currentTool === 'rect') {
                const x = Math.min(this.startX, this.currentX);
                const y = Math.min(this.startY, this.currentY);
                const w = Math.abs(this.currentX - this.startX);
                const h = Math.abs(this.currentY - this.startY);
                if (this.currentFill) {
                    this.ctx.save();
                    this.ctx.globalAlpha = 0.25;
                    this.ctx.fillRect(x, y, w, h);
                    this.ctx.restore();
                }
                this.ctx.strokeRect(x, y, w, h);
            } else if (this.currentTool === 'diamond') {
                const x = Math.min(this.startX, this.currentX);
                const y = Math.min(this.startY, this.currentY);
                const w = Math.abs(this.currentX - this.startX);
                const h = Math.abs(this.currentY - this.startY);
                this.ctx.beginPath();
                this.ctx.moveTo(x + w / 2, y);
                this.ctx.lineTo(x + w, y + h / 2);
                this.ctx.lineTo(x + w / 2, y + h);
                this.ctx.lineTo(x, y + h / 2);
                this.ctx.closePath();
                if (this.currentFill) {
                    this.ctx.save();
                    this.ctx.globalAlpha = 0.25;
                    this.ctx.fill();
                    this.ctx.restore();
                }
                this.ctx.stroke();
            } else if (this.currentTool === 'parallelogram') {
                const x = Math.min(this.startX, this.currentX);
                const y = Math.min(this.startY, this.currentY);
                const w = Math.abs(this.currentX - this.startX);
                const h = Math.abs(this.currentY - this.startY);
                const skew = Math.min(24, w * 0.2);
                this.ctx.beginPath();
                this.ctx.moveTo(x + skew, y);
                this.ctx.lineTo(x + w, y);
                this.ctx.lineTo(x + w - skew, y + h);
                this.ctx.lineTo(x, y + h);
                this.ctx.closePath();
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

        // Gather shapes that should show their connection ports
        const shapesToShowPorts = new Set();
        const activeTool = this.currentTool;

        if (this.isDrawingConnectorFromPort || (this.isDrawing && activeTool === 'arrow')) {
            this.shapes.forEach(s => {
                if (s.type !== 'connector') {
                    shapesToShowPorts.add(s);
                }
            });
        } else {
            if (activeTool === 'select') {
                this.selectedShapes.forEach(s => {
                    if (s.type !== 'connector') shapesToShowPorts.add(s);
                });
                if (this.hoveredShape && this.hoveredShape.type !== 'connector') {
                    shapesToShowPorts.add(this.hoveredShape);
                }
            } else if (activeTool === 'arrow') {
                if (this.hoveredShape && this.hoveredShape.type !== 'connector') {
                    shapesToShowPorts.add(this.hoveredShape);
                }
            }
        }

        // Draw Selection Outline for Selected Shapes
        if (this.currentTool === 'select' && this.selectedShapes.length > 0) {
            if (this.selectedShapes.length === 1) {
                this.selectedShapes.forEach(shape => {
                    this.ctx.save();
                    this.ctx.strokeStyle = '#06b6d4'; // Cyan outline
                    this.ctx.lineWidth = 1.5;
                    this.ctx.setLineDash([6, 4]);

                    const pad = 6;
                    const handleSize = 6;
                    let corners = [];

                    if (shape.type === 'rect' || shape.type === 'diamond' || shape.type === 'parallelogram') {
                        this.ctx.strokeRect(shape.x - pad, shape.y - pad, shape.w + pad * 2, shape.h + pad * 2);
                        this.ctx.setLineDash([]);
                        corners = [
                            { x: shape.x, y: shape.y },
                            { x: shape.x + shape.w, y: shape.y },
                            { x: shape.x, y: shape.y + shape.h },
                            { x: shape.x + shape.w, y: shape.y + shape.h }
                        ];
                    } else if (shape.type === 'circle') {
                        this.ctx.beginPath();
                        this.ctx.arc(shape.x, shape.y, shape.radius + pad, 0, 2 * Math.PI);
                        this.ctx.stroke();
                        this.ctx.setLineDash([]);
                        corners = [
                            { x: shape.x + shape.radius, y: shape.y },
                            { x: shape.x - shape.radius, y: shape.y },
                            { x: shape.x, y: shape.y + shape.radius },
                            { x: shape.x, y: shape.y - shape.radius }
                        ];
                    } else if (shape.type === 'text') {
                        const bbox = Geometry.getTextBoundingBox(shape);
                        this.ctx.strokeRect(bbox.x - pad, bbox.y - pad, bbox.w + pad * 2, bbox.h + pad * 2);
                        this.ctx.setLineDash([]);
                        corners = [
                            { x: bbox.x, y: bbox.y },
                            { x: bbox.x + bbox.w, y: bbox.y },
                            { x: bbox.x, y: bbox.y + bbox.h },
                            { x: bbox.x + bbox.w, y: bbox.y + bbox.h }
                        ];
                    } else if (shape.type === 'line' || shape.type === 'arrow') {
                        const minX = Math.min(shape.x, shape.x2);
                        const maxX = Math.max(shape.x, shape.x2);
                        const minY = Math.min(shape.y, shape.y2);
                        const maxY = Math.max(shape.y, shape.y2);
                        const w = maxX - minX;
                        const h = maxY - minY;
                        this.ctx.strokeRect(minX - pad, minY - pad, w + pad * 2, h + pad * 2);
                        this.ctx.setLineDash([]);
                        corners = [
                            { x: shape.x, y: shape.y },
                            { x: shape.x2, y: shape.y2 }
                        ];
                    } else if (shape.type === 'pencil') {
                        const bbox = Geometry.getPencilBoundingBox(shape);
                        this.ctx.strokeRect(bbox.x - pad, bbox.y - pad, bbox.w + pad * 2, bbox.h + pad * 2);
                        this.ctx.setLineDash([]);
                        corners = [
                            { x: bbox.x, y: bbox.y },
                            { x: bbox.x + bbox.w, y: bbox.y },
                            { x: bbox.x, y: bbox.y + bbox.h },
                            { x: bbox.x + bbox.w, y: bbox.y + bbox.h }
                        ];
                    } else if (shape.type === 'connector') {
                        const bbox = Geometry.getConnectorBoundingBox(shape, this.shapes);
                        this.ctx.strokeRect(bbox.x - pad, bbox.y - pad, bbox.w + pad * 2, bbox.h + pad * 2);
                        this.ctx.setLineDash([]);
                        const f = this.shapes.find(s => s.id === shape.fromId);
                        const t = this.shapes.find(s => s.id === shape.toId);
                        if (f && t) {
                            const startPt = Geometry.getShapePortCoords(f, shape.fromPort);
                            const endPt = Geometry.getShapePortCoords(t, shape.toPort);
                            corners = [startPt, endPt];
                        }
                    }

                    // Draw resizing handles only if single shape is selected
                    if (this.selectedShapes.length === 1) {
                        this.ctx.fillStyle = '#06b6d4';
                        corners.forEach(c => {
                            this.ctx.fillRect(c.x - handleSize/2, c.y - handleSize/2, handleSize, handleSize);
                        });
                    }

                    this.ctx.restore();
                });
            } else {
                const bbox = this.getSelectedShapesBoundingBox();
                if (bbox) {
                    this.ctx.save();
                    this.ctx.strokeStyle = '#06b6d4'; // Cyan outline
                    this.ctx.lineWidth = 1.5;
                    this.ctx.setLineDash([6, 4]);
                    const pad = 6;
                    const handleSize = 6;
                    this.ctx.strokeRect(bbox.x - pad, bbox.y - pad, bbox.w + pad * 2, bbox.h + pad * 2);
                    
                    this.ctx.fillStyle = '#06b6d4';
                    this.ctx.setLineDash([]);
                    const corners = [
                        { x: bbox.x, y: bbox.y },
                        { x: bbox.x + bbox.w, y: bbox.y },
                        { x: bbox.x, y: bbox.y + bbox.h },
                        { x: bbox.x + bbox.w, y: bbox.y + bbox.h }
                    ];
                    corners.forEach(c => {
                        this.ctx.fillRect(c.x - handleSize/2, c.y - handleSize/2, handleSize, handleSize);
                    });
                    this.ctx.restore();
                }
            }
        }

        // Draw Selection area box preview
        if (this.isSelectingArea) {
            this.ctx.save();
            this.ctx.strokeStyle = 'rgba(6, 182, 212, 0.7)'; // Cyan outline
            this.ctx.lineWidth = 1;
            this.ctx.setLineDash([4, 4]);
            this.ctx.fillStyle = 'rgba(6, 182, 212, 0.08)'; // Light cyan fill
            const x = Math.min(this.selectionBoxStart.x, this.selectionBoxEnd.x);
            const y = Math.min(this.selectionBoxStart.y, this.selectionBoxEnd.y);
            const w = Math.abs(this.selectionBoxEnd.x - this.selectionBoxStart.x);
            const h = Math.abs(this.selectionBoxEnd.y - this.selectionBoxStart.y);
            this.ctx.fillRect(x, y, w, h);
            this.ctx.strokeRect(x, y, w, h);
            this.ctx.restore();
        }

        // Draw Connection Ports for relevant shapes
        if (shapesToShowPorts.size > 0) {
            this.ctx.save();
            this.ctx.fillStyle = '#10b981'; // emerald green
            this.ctx.strokeStyle = '#06b6d4'; // cyan
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
