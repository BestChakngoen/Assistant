import { Geometry } from './Geometry.js';
import { DiagramControls } from './DiagramControls.js';
import { DiagramTextEditor } from './DiagramTextEditor.js';
import { DiagramKeyHandler } from './DiagramKeyHandler.js';
import { DiagramTransformHandler } from './DiagramTransformHandler.js';

/**
 * DiagramMouseHandler.js - Canvas Mouse & Touch Interaction Coordinator
 * Solid OOP: Delegates keyboard bindings to DiagramKeyHandler and transforms to DiagramTransformHandler.
 */
export class DiagramMouseHandler {
    static getMouseCoords(diagram, e) {
        const rect = diagram.canvas.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        const localX = (screenX - diagram.panX) / diagram.zoom;
        const localY = (screenY - diagram.panY) / diagram.zoom;
        return { screenX, screenY, localX, localY };
    }

    static initEvents(diagram) {
        // Initialize keyboard shortcuts via DiagramKeyHandler
        DiagramKeyHandler.initKeyboardEvents(diagram);

        // Mouse Down
        diagram.canvas.addEventListener('mousedown', (e) => {
            if (e.button === 1) { // Middle mouse wheel button click
                e.preventDefault();
                const coords = this.getMouseCoords(diagram, e);
                diagram.isPanning = true;
                diagram.dragStartX = coords.screenX - diagram.panX;
                diagram.dragStartY = coords.screenY - diagram.panY;
                diagram.canvas.style.cursor = 'grabbing';
                return;
            }
            if (e.button !== 0) return; // Only left click for regular tools
            if (diagram.dKeyPressed) {
                e.preventDefault();
                e.stopPropagation();
            }
            this.handleMouseDown(diagram, e);
        });

        // Mouse Move
        diagram.canvas.addEventListener('mousemove', (e) => {
            this.handleMouseMove(diagram, e);
        });

        // Mouse Up / Leave
        const handleMouseUp = () => {
            this.handleMouseUp(diagram);
        };
        diagram.canvas.addEventListener('mouseup', handleMouseUp);
        diagram.canvas.addEventListener('mouseleave', handleMouseUp);

        // Zoom via scroll wheel (Ctrl + Wheel)
        diagram.canvas.addEventListener('wheel', (e) => {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                this.handleWheel(diagram, e);
            }
        }, { passive: false });

        // Double Click
        diagram.canvas.addEventListener('dblclick', (e) => {
            this.handleDoubleClick(diagram, e);
        });
    }

    static handleMouseDown(diagram, e) {
        const coords = this.getMouseCoords(diagram, e);
        diagram.startX = coords.localX;
        diagram.startY = coords.localY;
        diagram.currentX = coords.localX;
        diagram.currentY = coords.localY;

        // D + Left-click to delete shape
        if (diagram.dKeyPressed && e.button === 0) {
            e.preventDefault();
            e.stopPropagation();
            const hit = Geometry.findShapeAt(diagram.shapes, coords.localX, coords.localY, diagram.zoom);
            if (hit) {
                diagram.shapes = diagram.shapes.filter(s => {
                    if (s === hit) return false;
                    if (s.type === 'connector') {
                        return s.fromId !== hit.id && s.toId !== hit.id;
                    }
                    return true;
                });
                if (diagram.selectedShape === hit) {
                    diagram.selectedShape = null;
                }
                diagram.selectedShapes = diagram.selectedShapes.filter(s => s !== hit);
                diagram.saveToStorage();
                diagram.draw();
                return;
            }
        }

        const activeTool = diagram.spacePressed ? 'pan' : diagram.currentTool;

        if (activeTool === 'pan') {
            diagram.isPanning = true;
            diagram.dragStartX = coords.screenX - diagram.panX;
            diagram.dragStartY = coords.screenY - diagram.panY;
            diagram.canvas.style.cursor = 'grabbing';
            return;
        }

        if (activeTool === 'text') {
            const hit = Geometry.findShapeAt(diagram.shapes, coords.localX, coords.localY, diagram.zoom);
            if (hit) {
                const center = hit.type === 'connector' 
                    ? Geometry.getConnectorCenter(hit, diagram.shapes) 
                    : Geometry.getShapeCenter(hit);
                DiagramTextEditor.createTextEditor(diagram, center.x, center.y, hit);
            } else {
                DiagramTextEditor.createTextEditor(diagram, coords.localX, coords.localY);
            }
            return;
        }

        if (activeTool === 'select') {
            // Check connection port handles
            let clickedPort = null;
            let portShape = null;
            for (let i = diagram.shapes.length - 1; i >= 0; i--) {
                const s = diagram.shapes[i];
                if (s.type === 'connector') continue;
                const port = Geometry.checkConnectionPortHit(s, coords, diagram.zoom);
                if (port) {
                    clickedPort = port;
                    portShape = s;
                    break;
                }
            }

            if (clickedPort && portShape) {
                diagram.isDrawingConnectorFromPort = true;
                diagram.connectFromShape = portShape;
                diagram.connectFromPortName = clickedPort.name;
                diagram.startX = clickedPort.x;
                diagram.startY = clickedPort.y;
                diagram.currentX = coords.localX;
                diagram.currentY = coords.localY;
                diagram.canvas.style.cursor = 'crosshair';
                diagram.draw();
                return;
            }

            // Check resize handles via DiagramTransformHandler
            const resizeHit = DiagramTransformHandler.checkResizeHandleHit(diagram, coords);
            if (resizeHit) {
                diagram.isResizing = true;
                diagram.activeHandle = resizeHit.name;
                diagram.groupResizeStart = resizeHit.bbox;
                diagram.shapeResizeStarts = resizeHit.starts;
                diagram.draw();
                return;
            }

            const hit = Geometry.findShapeAt(diagram.shapes, coords.localX, coords.localY, diagram.zoom);
            if (hit) {
                if (!diagram.selectedShapes.includes(hit)) {
                    diagram.selectedShapes = [hit];
                    diagram.selectedShape = hit;
                }
                diagram.isDragging = true;
                
                diagram.currentColor = hit.color;
                diagram.currentLineWidth = hit.lineWidth;
                if (hit.fill !== undefined) diagram.currentFill = hit.fill;
                
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

                diagram.shapeDragOffsets = new Map();
                diagram.selectedShapes.forEach(s => {
                    if (s.type === 'pencil') {
                        diagram.shapeDragOffsets.set(s.id, s.points.map(p => ({ dx: p.x - coords.localX, dy: p.y - coords.localY })));
                    } else {
                        diagram.shapeDragOffsets.set(s.id, {
                            dx: s.x - coords.localX,
                            dy: s.y - coords.localY,
                            dx2: s.x2 !== undefined ? s.x2 - coords.localX : 0,
                            dy2: s.y2 !== undefined ? s.y2 - coords.localY : 0,
                            radiusDx: s.radius !== undefined ? s.radius - coords.localX : 0
                        });
                    }
                });
            } else {
                diagram.selectedShapes = [];
                diagram.selectedShape = null;
                diagram.isSelectingArea = true;
                diagram.selectionBoxStart = { x: coords.localX, y: coords.localY };
                diagram.selectionBoxEnd = { x: coords.localX, y: coords.localY };
            }
            diagram.draw();
            return;
        }

        if (activeTool === 'eraser') {
            const hit = Geometry.findShapeAt(diagram.shapes, coords.localX, coords.localY, diagram.zoom);
            if (hit) {
                diagram.shapes = diagram.shapes.filter(s => s !== hit);
                diagram.saveToStorage();
                diagram.draw();
            }
            return;
        }

        if (activeTool === 'arrow') {
            let startShape = null;
            let matchedPort = null;
            for (let i = diagram.shapes.length - 1; i >= 0; i--) {
                const s = diagram.shapes[i];
                matchedPort = Geometry.checkConnectionPortHit(s, coords, diagram.zoom);
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
                diagram.connectFromShape = startShape;
                diagram.connectFromPortName = matchedPort ? matchedPort.name : null;
                const boundPt = Geometry.getShapeBoundaryPoint(startShape, coords);
                diagram.startX = matchedPort ? matchedPort.x : boundPt.x;
                diagram.startY = matchedPort ? matchedPort.y : boundPt.y;
            } else {
                diagram.connectFromShape = null;
                diagram.connectFromPortName = null;
            }
        }

        diagram.isDrawing = true;
        if (activeTool === 'pencil') {
            diagram.tempPencilPoints = [{ x: coords.localX, y: coords.localY }];
        }
    }

    static handleMouseMove(diagram, e) {
        const coords = this.getMouseCoords(diagram, e);
        diagram.currentX = coords.localX;
        diagram.currentY = coords.localY;

        if (diagram.isPanning) {
            diagram.panX = coords.screenX - diagram.dragStartX;
            diagram.panY = coords.screenY - diagram.dragStartY;
            diagram.draw();
            return;
        }

        if (diagram.isDrawingConnectorFromPort) {
            diagram.draw();
            return;
        }

        if (diagram.isResizing && diagram.activeHandle && diagram.activeHandle.startsWith('group-')) {
            DiagramTransformHandler.handleGroupResize(diagram, coords);
            return;
        }

        if (diagram.isSelectingArea) {
            diagram.selectionBoxEnd = { x: coords.localX, y: coords.localY };
            diagram.draw();
            return;
        }

        if (diagram.isDragging && diagram.selectedShapes.length > 0) {
            DiagramTransformHandler.handleShapeDrag(diagram, coords);
            return;
        }

        if (diagram.isDrawing) {
            if (diagram.currentTool === 'pencil') {
                diagram.tempPencilPoints.push({ x: coords.localX, y: coords.localY });
            }
            diagram.draw();
            return;
        }

        if (!diagram.isPanning && !diagram.isResizing && !diagram.isDragging && !diagram.isDrawingConnectorFromPort) {
            let foundHovered = null;
            for (let i = diagram.shapes.length - 1; i >= 0; i--) {
                const s = diagram.shapes[i];
                if (s.type === 'connector') continue;
                if (Geometry.findShapeAt(diagram.shapes, coords.localX, coords.localY, diagram.zoom) === s || 
                    Geometry.isPointNearShapeBoundary(s, coords.localX, coords.localY) || 
                    Geometry.checkConnectionPortHit(s, coords, diagram.zoom)) {
                    foundHovered = s;
                    break;
                }
            }
            if (diagram.hoveredShape !== foundHovered) {
                diagram.hoveredShape = foundHovered;
                diagram.draw();
            }
        }
    }

    static handleMouseUp(diagram) {
        if (diagram.isSelectingArea) {
            DiagramTransformHandler.handleAreaSelection(diagram);
            return;
        }

        if (diagram.isPanning) {
            diagram.isPanning = false;
            DiagramControls.updateCursor(diagram);
            diagram.saveViewportToStorage();
            return;
        }

        if (diagram.isDrawingConnectorFromPort) {
            diagram.isDrawingConnectorFromPort = false;
            
            let targetHit = null;
            let targetPort = null;
            for (let i = diagram.shapes.length - 1; i >= 0; i--) {
                const s = diagram.shapes[i];
                targetPort = Geometry.checkConnectionPortHit(s, { localX: diagram.currentX, localY: diagram.currentY }, diagram.zoom);
                if (targetPort) {
                    targetHit = s;
                    break;
                }
                if (Geometry.isPointNearShapeBoundary(s, diagram.currentX, diagram.currentY)) {
                    targetHit = s;
                    break;
                }
            }

            if (diagram.connectFromShape && targetHit && targetHit.id !== diagram.connectFromShape.id) {
                if (!targetPort) {
                    const center = Geometry.getShapeCenter(targetHit);
                    const dx = diagram.currentX - center.x;
                    const dy = diagram.currentY - center.y;
                    if (Math.abs(dx) > Math.abs(dy)) {
                        targetPort = { name: dx > 0 ? 'conn-r' : 'conn-l' };
                    } else {
                        targetPort = { name: dy > 0 ? 'conn-b' : 'conn-t' };
                    }
                }

                const newConnector = {
                    id: Date.now() + '-' + Math.round(Math.random() * 1000),
                    type: 'connector',
                    fromId: diagram.connectFromShape.id,
                    fromPort: diagram.connectFromPortName || 'conn-r',
                    toId: targetHit.id,
                    toPort: targetPort.name,
                    color: diagram.currentColor,
                    lineWidth: diagram.currentLineWidth
                };
                diagram.shapes.push(newConnector);
            }
            
            diagram.connectFromShape = null;
            diagram.connectFromPortName = null;
            diagram.saveToStorage();
            diagram.draw();
            return;
        }

        if (diagram.isResizing) {
            diagram.isResizing = false;
            diagram.activeHandle = null;
            diagram.saveToStorage();
            return;
        }

        if (diagram.isDragging) {
            diagram.isDragging = false;
            diagram.saveToStorage();
            return;
        }

        if (diagram.isDrawing) {
            diagram.isDrawing = false;
            const newShape = {
                id: Date.now() + '-' + Math.round(Math.random() * 1000),
                type: diagram.currentTool,
                color: diagram.currentColor,
                lineWidth: diagram.currentLineWidth
            };

            const dx = diagram.currentX - diagram.startX;
            const dy = diagram.currentY - diagram.startY;

            if (diagram.currentTool === 'pencil') {
                if (diagram.tempPencilPoints.length > 1) {
                    newShape.points = [...diagram.tempPencilPoints];
                    diagram.shapes.push(newShape);
                }
            } else if (diagram.currentTool === 'line') {
                if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
                    newShape.x = diagram.startX;
                    newShape.y = diagram.startY;
                    newShape.x2 = diagram.currentX;
                    newShape.y2 = diagram.currentY;
                    diagram.shapes.push(newShape);
                }
            } else if (diagram.currentTool === 'arrow') {
                if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
                    let targetHit = null;
                    let targetPort = null;
                    for (let i = diagram.shapes.length - 1; i >= 0; i--) {
                        const s = diagram.shapes[i];
                        targetPort = Geometry.checkConnectionPortHit(s, { localX: diagram.currentX, localY: diagram.currentY }, diagram.zoom);
                        if (targetPort) {
                            targetHit = s;
                            break;
                        }
                        if (Geometry.isPointNearShapeBoundary(s, diagram.currentX, diagram.currentY)) {
                            targetHit = s;
                            break;
                        }
                    }

                    if (diagram.connectFromShape && targetHit && targetHit.id !== diagram.connectFromShape.id) {
                        if (!diagram.connectFromPortName) {
                            const p1 = Geometry.getShapeCenter(diagram.connectFromShape);
                            const p2 = Geometry.getShapeCenter(targetHit);
                            const sx = p2.x - p1.x;
                            const sy = p2.y - p1.y;
                            if (Math.abs(sx) > Math.abs(sy)) {
                                diagram.connectFromPortName = sx > 0 ? 'conn-r' : 'conn-l';
                            } else {
                                diagram.connectFromPortName = sy > 0 ? 'conn-b' : 'conn-t';
                            }
                        }
                        if (!targetPort) {
                            const p1 = Geometry.getShapeCenter(diagram.connectFromShape);
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
                        newShape.fromId = diagram.connectFromShape.id;
                        newShape.fromPort = diagram.connectFromPortName;
                        newShape.toId = targetHit.id;
                        newShape.toPort = targetPort.name;
                        diagram.shapes.push(newShape);
                    } else {
                        newShape.x = diagram.startX;
                        newShape.y = diagram.startY;
                        newShape.x2 = diagram.currentX;
                        newShape.y2 = diagram.currentY;
                        diagram.shapes.push(newShape);
                    }
                }
            } else if (['rect', 'diamond', 'parallelogram'].includes(diagram.currentTool)) {
                if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
                    newShape.x = Math.min(diagram.startX, diagram.currentX);
                    newShape.y = Math.min(diagram.startY, diagram.currentY);
                    newShape.w = Math.abs(dx);
                    newShape.h = Math.abs(dy);
                    newShape.fill = diagram.currentFill;
                    diagram.shapes.push(newShape);
                }
            } else if (diagram.currentTool === 'circle') {
                const r = Math.sqrt(dx * dx + dy * dy);
                if (r > 2) {
                    newShape.x = diagram.startX;
                    newShape.y = diagram.startY;
                    newShape.radius = r;
                    newShape.fill = diagram.currentFill;
                    diagram.shapes.push(newShape);
                }
            } else if (diagram.currentTool === 'text') {
                DiagramTextEditor.createTextEditor(diagram, diagram.startX, diagram.startY);
            }

            diagram.connectFromShape = null;
            diagram.connectFromPortName = null;
            diagram.tempPencilPoints = [];
            diagram.saveToStorage();
            diagram.draw();
        }
    }

    static handleDoubleClick(diagram, e) {
        const coords = this.getMouseCoords(diagram, e);
        const hit = Geometry.findShapeAt(diagram.shapes, coords.localX, coords.localY, diagram.zoom);
        if (hit) {
            diagram.selectedShapes = [];
            diagram.selectedShape = null;
            const center = hit.type === 'connector' 
                ? Geometry.getConnectorCenter(hit, diagram.shapes) 
                : Geometry.getShapeCenter(hit);
            DiagramTextEditor.createTextEditor(diagram, center.x, center.y, hit);
            return;
        }
        
        if (diagram.currentTool === 'select') {
            DiagramTextEditor.createTextEditor(diagram, coords.localX, coords.localY);
        }
    }

    static handleWheel(diagram, e) {
        if (!e.ctrlKey && !e.metaKey) return;

        const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
        const rect = diagram.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const localX = (mouseX - diagram.panX) / diagram.zoom;
        const localY = (mouseY - diagram.panY) / diagram.zoom;
        
        diagram.zoom = Math.min(4, Math.max(0.15, diagram.zoom * factor));
        diagram.panX = mouseX - localX * diagram.zoom;
        diagram.panY = mouseY - localY * diagram.zoom;
        
        diagram.updateZoomPercent();
        diagram.saveViewportToStorage();
        diagram.draw();
    }
}
