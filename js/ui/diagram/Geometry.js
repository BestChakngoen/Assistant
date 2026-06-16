export class Geometry {
    static getShapeCenter(shape) {
        if (!shape) return { x: 0, y: 0 };
        if (shape.type === 'circle') {
            return { x: shape.x, y: shape.y };
        }
        if (shape.type === 'rect' || shape.type === 'diamond' || shape.type === 'parallelogram') {
            return { x: shape.x + shape.w / 2, y: shape.y + shape.h / 2 };
        }
        if (shape.type === 'text') {
            const bbox = this.getTextBoundingBox(shape);
            return { x: bbox.x + bbox.w / 2, y: bbox.y + bbox.h / 2 };
        }
        if (shape.type === 'pencil') {
            const bbox = this.getPencilBoundingBox(shape);
            return { x: bbox.x + bbox.w / 2, y: bbox.y + bbox.h / 2 };
        }
        if (shape.x2 !== undefined && shape.y2 !== undefined) {
            return { x: (shape.x + shape.x2) / 2, y: (shape.y + shape.y2) / 2 };
        }
        return { x: shape.x || 0, y: shape.y || 0 };
    }

    static getPencilBoundingBox(shape) {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        shape.points.forEach(p => {
            minX = Math.min(minX, p.x);
            minY = Math.min(minY, p.y);
            maxX = Math.max(maxX, p.x);
            maxY = Math.max(maxY, p.y);
        });
        return { x: minX, y: minY, w: maxX - minX, h: maxY - minY, maxX, maxY };
    }

    static getTextBoundingBox(shape) {
        const fontSize = shape.fontSize || 14;
        const lines = shape.text.split('\n');
        const longest = lines.reduce((max, line) => Math.max(max, line.length), 0);
        const w = longest * fontSize * 0.6;
        const h = lines.length * (fontSize + 4);
        return { x: shape.x, y: shape.y - fontSize, w, h };
    }

    static getShapePorts(shape) {
        if (!shape || shape.type === 'connector') return [];
        let rx = shape.x, ry = shape.y, rw = shape.w, rh = shape.h;
        if (shape.type === 'rect' || shape.type === 'text' || shape.type === 'pencil' || shape.type === 'diamond' || shape.type === 'parallelogram') {
            if (shape.type === 'text') {
                const bbox = this.getTextBoundingBox(shape);
                rx = bbox.x; ry = bbox.y; rw = bbox.w; rh = bbox.h;
            } else if (shape.type === 'pencil') {
                const bbox = this.getPencilBoundingBox(shape);
                rx = bbox.x; ry = bbox.y; rw = bbox.w; rh = bbox.h;
            }
            return [
                { name: 'conn-t', x: rx + rw/2, y: ry },
                { name: 'conn-r', x: rx + rw, y: ry + rh/2 },
                { name: 'conn-b', x: rx + rw/2, y: ry + rh },
                { name: 'conn-l', x: rx, y: ry + rh/2 }
            ];
        } else if (shape.type === 'circle') {
            return [
                { name: 'conn-t', x: shape.x, y: shape.y - shape.radius },
                { name: 'conn-r', x: shape.x + shape.radius, y: shape.y },
                { name: 'conn-b', x: shape.x, y: shape.y + shape.radius },
                { name: 'conn-l', x: shape.x - shape.radius, y: shape.y }
            ];
        }
        return [];
    }

    static getShapePortCoords(shape, portName) {
        const center = this.getShapeCenter(shape);
        let rx = shape.x, ry = shape.y, rw = shape.w, rh = shape.h;
        if (shape.type === 'circle') {
            const radius = shape.radius;
            const pad = 3;
            if (portName === 'conn-t') return { x: center.x, y: center.y - radius - pad };
            if (portName === 'conn-b') return { x: center.x, y: center.y + radius + pad };
            if (portName === 'conn-l') return { x: center.x - radius - pad, y: center.y };
            return { x: center.x + radius + pad, y: center.y }; // conn-r
        }
        
        if (shape.type === 'text') {
            const bbox = this.getTextBoundingBox(shape);
            rx = bbox.x; ry = bbox.y; rw = bbox.w; rh = bbox.h;
        } else if (shape.type === 'pencil') {
            const bbox = this.getPencilBoundingBox(shape);
            rx = bbox.x; ry = bbox.y; rw = bbox.w; rh = bbox.h;
        }
        
        const pad = 3;
        if (portName === 'conn-t') return { x: rx + rw / 2, y: ry - pad };
        if (portName === 'conn-b') return { x: rx + rw / 2, y: ry + rh + pad };
        if (portName === 'conn-l') return { x: rx - pad, y: ry + rh / 2 };
        return { x: rx + rw + pad, y: ry + rh / 2 }; // conn-r
    }

    static getShapePortPoint(shape, dir) {
        const center = this.getShapeCenter(shape);
        let rx = shape.x, ry = shape.y, rw = shape.w, rh = shape.h;
        if (shape.type === 'circle') {
            const pad = 3;
            return {
                x: center.x + dir.x * (shape.radius + pad),
                y: center.y + dir.y * (shape.radius + pad)
            };
        }
        
        if (shape.type === 'text') {
            const bbox = this.getTextBoundingBox(shape);
            rx = bbox.x; ry = bbox.y; rw = bbox.w; rh = bbox.h;
        } else if (shape.type === 'pencil') {
            const bbox = this.getPencilBoundingBox(shape);
            rx = bbox.x; ry = bbox.y; rw = bbox.w; rh = bbox.h;
        }
        
        const pad = 3;
        if (dir.x > 0) return { x: rx + rw + pad, y: ry + rh/2 }; // Right
        if (dir.x < 0) return { x: rx - pad, y: ry + rh/2 };      // Left
        if (dir.y > 0) return { x: rx + rw/2, y: ry + rh + pad }; // Bottom
        return { x: rx + rw/2, y: ry - pad };                     // Top
    }

    static getShapeBoundaryPoint(shape, targetCoords) {
        const center = this.getShapeCenter(shape);
        const dx = targetCoords.localX - center.x;
        const dy = targetCoords.localY - center.y;
        const len = Math.sqrt(dx * dx + dy * dy);

        if (len === 0) return center;

        const ux = dx / len;
        const uy = dy / len;

        if (shape.type === 'circle') {
            const pad = 3;
            return {
                x: center.x + ux * (shape.radius + pad),
                y: center.y + uy * (shape.radius + pad)
            };
        }

        if (shape.type === 'rect' || shape.type === 'text' || shape.type === 'pencil') {
            let x = shape.x, y = shape.y, w = shape.w, h = shape.h;
            if (shape.type === 'text') {
                const bbox = this.getTextBoundingBox(shape);
                x = bbox.x; y = bbox.y; w = bbox.w; h = bbox.h;
            } else if (shape.type === 'pencil') {
                const bbox = this.getPencilBoundingBox(shape);
                x = bbox.x; y = bbox.y; w = bbox.w; h = bbox.h;
            }

            const x_min = x;
            const x_max = x + w;
            const y_min = y;
            const y_max = y + h;

            let t_candidates = [];
            if (ux !== 0) {
                const t1 = (x_min - center.x) / ux;
                const t2 = (x_max - center.x) / ux;
                if (t1 > 0) t_candidates.push(t1);
                if (t2 > 0) t_candidates.push(t2);
            }
            if (uy !== 0) {
                const t3 = (y_min - center.y) / uy;
                const t4 = (y_max - center.y) / uy;
                if (t3 > 0) t_candidates.push(t3);
                if (t4 > 0) t_candidates.push(t4);
            }

            const t = t_candidates.length > 0 ? Math.min(...t_candidates) : 0;
            const pad = 3;
            return {
                x: center.x + ux * (t + pad),
                y: center.y + uy * (t + pad)
            };
        }

        return center;
    }

    static isPointNearShapeBoundary(shape, x, y, tolerance = 15) {
        if (!shape) return false;
        if (shape.type === 'circle') {
            const dist = Math.sqrt((x - shape.x) ** 2 + (y - shape.y) ** 2);
            return Math.abs(dist - shape.radius) < tolerance;
        } else if (shape.type === 'rect' || shape.type === 'text' || shape.type === 'pencil' || shape.type === 'diamond' || shape.type === 'parallelogram') {
            let rx = shape.x, ry = shape.y, rw = shape.w, rh = shape.h;
            if (shape.type === 'text') {
                const bbox = this.getTextBoundingBox(shape);
                rx = bbox.x; ry = bbox.y; rw = bbox.w; rh = bbox.h;
            } else if (shape.type === 'pencil') {
                const bbox = this.getPencilBoundingBox(shape);
                rx = bbox.x; ry = bbox.y; rw = bbox.w; rh = bbox.h;
            }
            
            const nearLeft = Math.abs(x - rx) < tolerance && y >= ry - tolerance && y <= ry + rh + tolerance;
            const nearRight = Math.abs(x - (rx + rw)) < tolerance && y >= ry - tolerance && y <= ry + rh + tolerance;
            const nearTop = Math.abs(y - ry) < tolerance && x >= rx - tolerance && x <= rx + rw + tolerance;
            const nearBottom = Math.abs(y - (ry + rh)) < tolerance && x >= rx - tolerance && x <= rx + rw + tolerance;
            
            return nearLeft || nearRight || nearTop || nearBottom;
        }
        return false;
    }

    static isPointNearLine(px, py, x1, y1, x2, y2, tolerance = 8) {
        const A = px - x1;
        const B = py - y1;
        const C = x2 - x1;
        const D = y2 - y1;

        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;
        if (lenSq !== 0) param = dot / lenSq;

        let xx, yy;

        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }

        const dx = px - xx;
        const dy = py - yy;
        return Math.sqrt(dx * dx + dy * dy) < tolerance;
    }

    static checkConnectionPortHit(shape, coords, zoom) {
        if (!shape) return null;
        const size = 12 / zoom; // hit box of the connection handle
        const ports = this.getShapePorts(shape);
        for (let p of ports) {
            if (Math.abs(coords.localX - p.x) < size && Math.abs(coords.localY - p.y) < size) {
                return p;
            }
        }
        return null;
    }

    static checkResizeHandleHit(shape, coords, zoom) {
        if (!shape) return null;
        const size = 10 / zoom; // hit tolerance size

        if (shape.type === 'rect') {
            const corners = [
                { name: 'rect-tl', x: shape.x, y: shape.y },
                { name: 'rect-tr', x: shape.x + shape.w, y: shape.y },
                { name: 'rect-bl', x: shape.x, y: shape.y + shape.h },
                { name: 'rect-br', x: shape.x + shape.w, y: shape.y + shape.h }
            ];
            for (let c of corners) {
                if (Math.abs(coords.localX - c.x) < size && Math.abs(coords.localY - c.y) < size) {
                    return c.name;
                }
            }
        } else if (shape.type === 'circle') {
            const corners = [
                { name: 'circle-t', x: shape.x, y: shape.y - shape.radius },
                { name: 'circle-b', x: shape.x, y: shape.y + shape.radius },
                { name: 'circle-l', x: shape.x - shape.radius, y: shape.y },
                { name: 'circle-r', x: shape.x + shape.radius, y: shape.y }
            ];
            for (let c of corners) {
                if (Math.abs(coords.localX - c.x) < size && Math.abs(coords.localY - c.y) < size) {
                    return c.name;
                }
            }
        } else if (shape.type === 'line' || shape.type === 'arrow') {
            const corners = [
                { name: 'line-start', x: shape.x, y: shape.y },
                { name: 'line-end', x: shape.x2, y: shape.y2 }
            ];
            for (let c of corners) {
                if (Math.abs(coords.localX - c.x) < size && Math.abs(coords.localY - c.y) < size) {
                    return c.name;
                }
            }
        } else if (shape.type === 'text') {
            const bbox = this.getTextBoundingBox(shape);
            const corners = [
                { name: 'text-tl', x: bbox.x, y: bbox.y },
                { name: 'text-tr', x: bbox.x + bbox.w, y: bbox.y },
                { name: 'text-bl', x: bbox.x, y: bbox.y + bbox.h },
                { name: 'text-br', x: bbox.x + bbox.w, y: bbox.y + bbox.h }
            ];
            for (let c of corners) {
                if (Math.abs(coords.localX - c.x) < size && Math.abs(coords.localY - c.y) < size) {
                    return c.name;
                }
            }
        } else if (shape.type === 'pencil') {
            const bbox = this.getPencilBoundingBox(shape);
            const corners = [
                { name: 'pencil-tl', x: bbox.x, y: bbox.y },
                { name: 'pencil-tr', x: bbox.x + bbox.w, y: bbox.y },
                { name: 'pencil-bl', x: bbox.x, y: bbox.y + bbox.h },
                { name: 'pencil-br', x: bbox.x + bbox.w, y: bbox.y + bbox.h }
            ];
            for (let c of corners) {
                if (Math.abs(coords.localX - c.x) < size && Math.abs(coords.localY - c.y) < size) {
                    return c.name;
                }
            }
        }
        return null;
    }

    static getConnectorBoundingBox(shape, shapes) {
        const f = shapes.find(s => s.id === shape.fromId);
        const t = shapes.find(s => s.id === shape.toId);
        if (!f || !t) return { x: 0, y: 0, w: 0, h: 0 };

        const p1_center = this.getShapeCenter(f);
        const p2_center = this.getShapeCenter(t);
        const dx = p2_center.x - p1_center.x;
        const dy = p2_center.y - p1_center.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist === 0) return { x: p1_center.x, y: p1_center.y, w: 0, h: 0 };

        let activeFromPort = shape.fromPort;
        let activeToPort = shape.toPort;
        if (!activeFromPort || !activeToPort) {
            if (Math.abs(dx) > Math.abs(dy)) {
                activeFromPort = dx > 0 ? 'conn-r' : 'conn-l';
                activeToPort = dx > 0 ? 'conn-l' : 'conn-r';
            } else {
                activeFromPort = dy > 0 ? 'conn-b' : 'conn-t';
                activeToPort = dy > 0 ? 'conn-t' : 'conn-b';
            }
        }
        const getDirVector = (port) => {
            if (port === 'conn-t') return { x: 0, y: -1 };
            if (port === 'conn-b') return { x: 0, y: 1 };
            if (port === 'conn-l') return { x: -1, y: 0 };
            return { x: 1, y: 0 };
        };
        const dir1 = getDirVector(activeFromPort);
        const dir2 = getDirVector(activeToPort);
        const startPt = this.getShapePortCoords(f, activeFromPort);
        const endPt = this.getShapePortCoords(t, activeToPort);
        const controlOffset = Math.max(30, dist * 0.45);
        const c1x = startPt.x + dir1.x * controlOffset;
        const c1y = startPt.y + dir1.y * controlOffset;
        const c2x = endPt.x + dir2.x * controlOffset;
        const c2y = endPt.y + dir2.y * controlOffset;

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        const steps = 15;
        for (let k = 0; k <= steps; k++) {
            const tVal = k / steps;
            const mt = 1 - tVal;
            const currX = mt*mt*mt * startPt.x + 3 * mt*mt * tVal * c1x + 3 * mt * tVal*tVal * c2x + tVal*tVal*tVal * endPt.x;
            const currY = mt*mt*mt * startPt.y + 3 * mt*mt * tVal * c1y + 3 * mt * tVal*tVal * c2y + tVal*tVal*tVal * endPt.y;
            minX = Math.min(minX, currX);
            maxX = Math.max(maxX, currX);
            minY = Math.min(minY, currY);
            maxY = Math.max(maxY, currY);
        }

        return {
            x: minX,
            y: minY,
            w: maxX - minX,
            h: maxY - minY
        };
    }

    static getConnectorCenter(shape, shapes) {
        const f = shapes.find(s => s.id === shape.fromId);
        const t = shapes.find(s => s.id === shape.toId);
        if (!f || !t) return { x: 0, y: 0 };
        const p1_center = this.getShapeCenter(f);
        const p2_center = this.getShapeCenter(t);
        const dx = p2_center.x - p1_center.x;
        const dy = p2_center.y - p1_center.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist === 0) return p1_center;
        
        let activeFromPort = shape.fromPort;
        let activeToPort = shape.toPort;
        if (!activeFromPort || !activeToPort) {
            if (Math.abs(dx) > Math.abs(dy)) {
                activeFromPort = dx > 0 ? 'conn-r' : 'conn-l';
                activeToPort = dx > 0 ? 'conn-l' : 'conn-r';
            } else {
                activeFromPort = dy > 0 ? 'conn-b' : 'conn-t';
                activeToPort = dy > 0 ? 'conn-t' : 'conn-b';
            }
        }
        const getDirVector = (port) => {
            if (port === 'conn-t') return { x: 0, y: -1 };
            if (port === 'conn-b') return { x: 0, y: 1 };
            if (port === 'conn-l') return { x: -1, y: 0 };
            return { x: 1, y: 0 };
        };
        const dir1 = getDirVector(activeFromPort);
        const dir2 = getDirVector(activeToPort);
        const startPt = this.getShapePortCoords(f, activeFromPort);
        const endPt = this.getShapePortCoords(t, activeToPort);
        const controlOffset = Math.max(30, dist * 0.45);
        const c1x = startPt.x + dir1.x * controlOffset;
        const c1y = startPt.y + dir1.y * controlOffset;
        const c2x = endPt.x + dir2.x * controlOffset;
        const c2y = endPt.y + dir2.y * controlOffset;

        const tVal = 0.5;
        const mt = 1 - tVal;
        const x = mt*mt*mt * startPt.x + 3 * mt*mt * tVal * c1x + 3 * mt * tVal*tVal * c2x + tVal*tVal*tVal * endPt.x;
        const y = mt*mt*mt * startPt.y + 3 * mt*mt * tVal * c1y + 3 * mt * tVal*tVal * c2y + tVal*tVal*tVal * endPt.y;
        return { x, y };
    }

    static getLineTextBoundingBox(shape, centerX, centerY) {
        if (!shape.text) return null;
        const fontSize = shape.fontSize || 14;
        const lines = shape.text.split('\n');
        const longest = lines.reduce((max, line) => Math.max(max, line.length), 0);
        const w = longest * fontSize * 0.6 + 12;
        const h = lines.length * (fontSize + 4) + 8;
        return {
            x: centerX - w / 2,
            y: centerY - h / 2,
            w: w,
            h: h
        };
    }

    static findShapeAt(shapes, x, y, zoom) {
        for (let i = shapes.length - 1; i >= 0; i--) {
            const shape = shapes[i];
            
            if (shape.type === 'rect') {
                if (x >= shape.x && x <= shape.x + shape.w && y >= shape.y && y <= shape.y + shape.h) {
                    return shape;
                }
            } else if (shape.type === 'circle') {
                const dist = Math.sqrt((x - shape.x) ** 2 + (y - shape.y) ** 2);
                if (dist <= shape.radius) {
                    return shape;
                }
            } else if (shape.type === 'diamond') {
                const cx = shape.x + shape.w / 2;
                const cy = shape.y + shape.h / 2;
                const dx = Math.abs(x - cx) / (shape.w / 2);
                const dy = Math.abs(y - cy) / (shape.h / 2);
                if (dx + dy <= 1) {
                    return shape;
                }
            } else if (shape.type === 'parallelogram') {
                if (y >= shape.y && y <= shape.y + shape.h) {
                    const skew = Math.min(24, shape.w * 0.2);
                    const t = (y - shape.y) / shape.h;
                    const leftX = shape.x + (1 - t) * skew;
                    const rightX = leftX + (shape.w - skew);
                    if (x >= leftX && x <= rightX) {
                        return shape;
                    }
                }
            } else if (shape.type === 'text') {
                const fontSize = shape.fontSize || 14;
                const lines = shape.text.split('\n');
                const longest = lines.reduce((max, line) => Math.max(max, line.length), 0);
                const w = longest * fontSize * 0.6;
                const h = lines.length * (fontSize + 4);
                if (x >= shape.x && x <= shape.x + w && y >= shape.y - fontSize && y <= shape.y + h - fontSize) {
                    return shape;
                }
            } else if (shape.type === 'line' || shape.type === 'arrow') {
                if (shape.text) {
                    const center = this.getShapeCenter(shape);
                    const bbox = this.getLineTextBoundingBox(shape, center.x, center.y);
                    if (bbox && x >= bbox.x && x <= bbox.x + bbox.w && y >= bbox.y && y <= bbox.y + bbox.h) {
                        return shape;
                    }
                }
                const tolerance = Math.max(16, 16 / zoom);
                if (this.isPointNearLine(x, y, shape.x, shape.y, shape.x2, shape.y2, tolerance)) {
                    return shape;
                }
            } else if (shape.type === 'connector') {
                if (shape.text) {
                    const center = this.getConnectorCenter(shape, shapes);
                    const bbox = this.getLineTextBoundingBox(shape, center.x, center.y);
                    if (bbox && x >= bbox.x && x <= bbox.x + bbox.w && y >= bbox.y && y <= bbox.y + bbox.h) {
                        return shape;
                    }
                }
                const f = shapes.find(s => s.id === shape.fromId);
                const t = shapes.find(s => s.id === shape.toId);
                if (f && t) {
                    const p1_center = this.getShapeCenter(f);
                    const p2_center = this.getShapeCenter(t);
                    const dx = p2_center.x - p1_center.x;
                    const dy = p2_center.y - p1_center.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist > 0) {
                        let activeFromPort = shape.fromPort;
                        let activeToPort = shape.toPort;
                        if (!activeFromPort || !activeToPort) {
                            if (Math.abs(dx) > Math.abs(dy)) {
                                activeFromPort = dx > 0 ? 'conn-r' : 'conn-l';
                                activeToPort = dx > 0 ? 'conn-l' : 'conn-r';
                            } else {
                                activeFromPort = dy > 0 ? 'conn-b' : 'conn-t';
                                activeToPort = dy > 0 ? 'conn-t' : 'conn-b';
                            }
                        }
                        const getDirVector = (port) => {
                            if (port === 'conn-t') return { x: 0, y: -1 };
                            if (port === 'conn-b') return { x: 0, y: 1 };
                            if (port === 'conn-l') return { x: -1, y: 0 };
                            return { x: 1, y: 0 };
                        };
                        const dir1 = getDirVector(activeFromPort);
                        const dir2 = getDirVector(activeToPort);
                        const startPt = this.getShapePortCoords(f, activeFromPort);
                        const endPt = this.getShapePortCoords(t, activeToPort);
                        const controlOffset = Math.max(30, dist * 0.45);
                        const c1x = startPt.x + dir1.x * controlOffset;
                        const c1y = startPt.y + dir1.y * controlOffset;
                        const c2x = endPt.x + dir2.x * controlOffset;
                        const c2y = endPt.y + dir2.y * controlOffset;

                        let prevX = startPt.x;
                        let prevY = startPt.y;
                        const steps = 15;
                        const connectorTolerance = Math.max(16, 16 / zoom);
                        for (let k = 1; k <= steps; k++) {
                            const tVal = k / steps;
                            const mt = 1 - tVal;
                            const currX = mt*mt*mt * startPt.x + 3 * mt*mt * tVal * c1x + 3 * mt * tVal*tVal * c2x + tVal*tVal*tVal * endPt.x;
                            const currY = mt*mt*mt * startPt.y + 3 * mt*mt * tVal * c1y + 3 * mt * tVal*tVal * c2y + tVal*tVal*tVal * endPt.y;
                            if (this.isPointNearLine(x, y, prevX, prevY, currX, currY, connectorTolerance)) {
                                return shape;
                            }
                            prevX = currX;
                            prevY = currY;
                        }
                    }
                }
            } else if (shape.type === 'pencil') {
                const pencilTolerance = Math.max(8, 8 / zoom);
                for (let j = 0; j < shape.points.length - 1; j++) {
                    const p1 = shape.points[j];
                    const p2 = shape.points[j+1];
                    if (this.isPointNearLine(x, y, p1.x, p1.y, p2.x, p2.y, pencilTolerance)) {
                        return shape;
                    }
                }
            }
        }
        return null;
    }
}
