/**
 * DiagramTransformHandler.js - Shape Resizing, Drag & Marquee Selection
 * Handles math calculations for 8-direction handles, group resizing, and multi-selection area.
 */
import { Geometry } from './Geometry.js';

export class DiagramTransformHandler {
    static checkResizeHandleHit(diagram, coords) {
        if (diagram.selectedShapes.length === 0 || diagram.currentTool !== 'select') return null;

        const bbox = diagram.getSelectedShapesBoundingBox();
        if (!bbox) return null;

        const pad = 6;
        const size = Math.max(16, 16 / diagram.zoom);
        const handles = [
            { name: 'group-tl', x: bbox.x - pad, y: bbox.y - pad },
            { name: 'group-tr', x: bbox.x + bbox.w + pad, y: bbox.y - pad },
            { name: 'group-bl', x: bbox.x - pad, y: bbox.y + bbox.h + pad },
            { name: 'group-br', x: bbox.x + bbox.w + pad, y: bbox.y + bbox.h + pad },
            { name: 'group-tl', x: bbox.x, y: bbox.y },
            { name: 'group-tr', x: bbox.x + bbox.w, y: bbox.y },
            { name: 'group-bl', x: bbox.x, y: bbox.y + bbox.h },
            { name: 'group-br', x: bbox.x + bbox.w, y: bbox.y + bbox.h }
        ];

        for (const h of handles) {
            if (Math.abs(coords.localX - h.x) < size && Math.abs(coords.localY - h.y) < size) {
                return {
                    name: h.name,
                    bbox: { x: bbox.x, y: bbox.y, w: bbox.w, h: bbox.h },
                    starts: diagram.selectedShapes.map(s => {
                        const item = { id: s.id, type: s.type, x: s.x, y: s.y };
                        if (s.w !== undefined) item.w = s.w;
                        if (s.h !== undefined) item.h = s.h;
                        if (s.radius !== undefined) item.radius = s.radius;
                        if (s.fontSize !== undefined) item.fontSize = s.fontSize || 14;
                        if (s.x2 !== undefined) item.x2 = s.x2;
                        if (s.y2 !== undefined) item.y2 = s.y2;
                        if (s.points !== undefined) item.points = s.points.map(p => ({ x: p.x, y: p.y }));
                        return item;
                    })
                };
            }
        }
        return null;
    }

    static handleGroupResize(diagram, coords) {
        const handle = diagram.activeHandle;
        const start = diagram.groupResizeStart;
        if (!handle || !start) return;

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

        diagram.selectedShapes.forEach(shape => {
            const itemStart = diagram.shapeResizeStarts.find(s => s.id === shape.id);
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

        diagram.draw();
    }

    static handleAreaSelection(diagram) {
        diagram.isSelectingArea = false;
        const x1 = Math.min(diagram.selectionBoxStart.x, diagram.selectionBoxEnd.x);
        const y1 = Math.min(diagram.selectionBoxStart.y, diagram.selectionBoxEnd.y);
        const x2 = Math.max(diagram.selectionBoxStart.x, diagram.selectionBoxEnd.x);
        const y2 = Math.max(diagram.selectionBoxStart.y, diagram.selectionBoxEnd.y);

        if (Math.abs(diagram.selectionBoxEnd.x - diagram.selectionBoxStart.x) > 5 || 
            Math.abs(diagram.selectionBoxEnd.y - diagram.selectionBoxStart.y) > 5) {
            
            const selected = [];
            diagram.shapes.forEach(shape => {
                if (shape.type === 'connector') return;
                const center = Geometry.getShapeCenter(shape);
                if (center.x >= x1 && center.x <= x2 && center.y >= y1 && center.y <= y2) {
                    selected.push(shape);
                }
            });
            diagram.selectedShapes = selected;
            diagram.selectedShape = selected.length > 0 ? selected[0] : null;
        }
        diagram.draw();
    }

    static handleShapeDrag(diagram, coords) {
        if (!diagram.isDragging || diagram.selectedShapes.length === 0) return;

        diagram.selectedShapes.forEach(shape => {
            const offsets = diagram.shapeDragOffsets.get(shape.id);
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
        diagram.draw();
    }
}
