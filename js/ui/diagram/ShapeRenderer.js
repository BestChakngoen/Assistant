import { Geometry } from './Geometry.js';

export class ShapeRenderer {
    static drawShape(ctx, shape, shapes, currentLineWidth = 4) {
        ctx.save();
        ctx.strokeStyle = shape.color;
        ctx.lineWidth = shape.lineWidth;
        ctx.fillStyle = shape.color;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (shape.type === 'pencil') {
            if (shape.points.length > 0) {
                ctx.beginPath();
                ctx.moveTo(shape.points[0].x, shape.points[0].y);
                for (let i = 1; i < shape.points.length; i++) {
                    ctx.lineTo(shape.points[i].x, shape.points[i].y);
                }
                ctx.stroke();
            }
        } else if (shape.type === 'line') {
            ctx.beginPath();
            ctx.moveTo(shape.x, shape.y);
            ctx.lineTo(shape.x2, shape.y2);
            ctx.stroke();
        } else if (shape.type === 'arrow') {
            this.drawArrowPath(ctx, shape.x, shape.y, shape.x2, shape.y2, shape.lineWidth);
        } else if (shape.type === 'rect') {
            if (shape.fill) {
                ctx.save();
                ctx.globalAlpha = 0.25;
                ctx.fillRect(shape.x, shape.y, shape.w, shape.h);
                ctx.restore();
            }
            ctx.strokeRect(shape.x, shape.y, shape.w, shape.h);
        } else if (shape.type === 'circle') {
            ctx.beginPath();
            ctx.arc(shape.x, shape.y, shape.radius, 0, 2 * Math.PI);
            if (shape.fill) {
                ctx.save();
                ctx.globalAlpha = 0.25;
                ctx.fill();
                ctx.restore();
            }
            ctx.stroke();
        } else if (shape.type === 'diamond') {
            ctx.beginPath();
            ctx.moveTo(shape.x + shape.w / 2, shape.y);
            ctx.lineTo(shape.x + shape.w, shape.y + shape.h / 2);
            ctx.lineTo(shape.x + shape.w / 2, shape.y + shape.h);
            ctx.lineTo(shape.x, shape.y + shape.h / 2);
            ctx.closePath();
            if (shape.fill) {
                ctx.save();
                ctx.globalAlpha = 0.25;
                ctx.fill();
                ctx.restore();
            }
            ctx.stroke();
        } else if (shape.type === 'parallelogram') {
            const skew = Math.min(24, shape.w * 0.2);
            ctx.beginPath();
            ctx.moveTo(shape.x + skew, shape.y);
            ctx.lineTo(shape.x + shape.w, shape.y);
            ctx.lineTo(shape.x + shape.w - skew, shape.y + shape.h);
            ctx.lineTo(shape.x, shape.y + shape.h);
            ctx.closePath();
            if (shape.fill) {
                ctx.save();
                ctx.globalAlpha = 0.25;
                ctx.fill();
                ctx.restore();
            }
            ctx.stroke();
        } else if (shape.type === 'text') {
            const fontSize = shape.fontSize || 14;
            ctx.font = `${fontSize}px Rajdhani, Kanit, sans-serif`;
            ctx.fillStyle = shape.color;
            
            const lines = shape.text.split('\n');
            lines.forEach((line, i) => {
                ctx.fillText(line, shape.x, shape.y + (i * (fontSize + 4)));
            });
        } else if (shape.type === 'connector') {
            const f = shapes.find(s => s.id === shape.fromId);
            const t = shapes.find(s => s.id === shape.toId);
            if (f && t) {
                this.drawCurvedConnector(ctx, f, t, shape.lineWidth, shape.fromPort, shape.toPort);
            }
        }

        if ((shape.type === 'rect' || shape.type === 'circle' || shape.type === 'line' || shape.type === 'arrow' || shape.type === 'connector') && shape.text) {
            let center;
            if (shape.type === 'connector') {
                center = Geometry.getConnectorCenter(shape, shapes);
            } else {
                center = Geometry.getShapeCenter(shape);
            }
            this.drawShapeText(ctx, shape, center.x, center.y);
        }

        ctx.restore();
    }

    static drawShapeText(ctx, shape, x, y) {
        if (!shape.text) return;
        const fontSize = shape.fontSize || 14;
        ctx.font = `${fontSize}px Rajdhani, Kanit, sans-serif`;
        
        const lines = shape.text.split('\n');
        const lineHeight = fontSize + 4;
        const totalHeight = lines.length * lineHeight;
        
        ctx.save();
        ctx.fillStyle = shape.color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const needsBg = shape.type === 'line' || shape.type === 'arrow' || shape.type === 'connector';
        
        if (needsBg) {
            let maxWidth = 0;
            lines.forEach(line => {
                const metrics = ctx.measureText(line);
                if (metrics.width > maxWidth) {
                    maxWidth = metrics.width;
                }
            });
            const bgPaddingX = 8;
            const bgPaddingY = 4;
            const bgW = maxWidth + bgPaddingX * 2;
            const bgH = totalHeight + bgPaddingY * 2;
            const bgX = x - bgW / 2;
            const bgY = y - bgH / 2;
            
            ctx.fillStyle = 'rgba(15, 23, 42, 0.9)'; // Dark slate background matching the web app theme
            ctx.strokeStyle = shape.color;
            ctx.lineWidth = 1.5;
            
            ctx.beginPath();
            const r = 6;
            if (ctx.roundRect) {
                ctx.roundRect(bgX, bgY, bgW, bgH, r);
            } else {
                ctx.rect(bgX, bgY, bgW, bgH);
            }
            ctx.fill();
            ctx.stroke();
            
            ctx.fillStyle = shape.color; // reset fillStyle for text
        }
        
        const startY = y - totalHeight / 2 + lineHeight / 2;
        lines.forEach((line, i) => {
            const lineY = startY + i * lineHeight;
            ctx.fillText(line, x, lineY);
        });
        ctx.restore();
    }

    static drawCurvedConnector(ctx, f, t, width = 4, fromPort = null, toPort = null) {
        const p1_center = Geometry.getShapeCenter(f);
        const p2_center = Geometry.getShapeCenter(t);

        const dx = p2_center.x - p1_center.x;
        const dy = p2_center.y - p1_center.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist === 0) return;

        let activeFromPort = fromPort;
        let activeToPort = toPort;

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

        const startPt = Geometry.getShapePortCoords(f, activeFromPort);
        const endPt = Geometry.getShapePortCoords(t, activeToPort);

        const controlOffset = Math.max(30, dist * 0.45);
        const c1x = startPt.x + dir1.x * controlOffset;
        const c1y = startPt.y + dir1.y * controlOffset;
        const c2x = endPt.x + dir2.x * controlOffset;
        const c2y = endPt.y + dir2.y * controlOffset;

        ctx.beginPath();
        ctx.moveTo(startPt.x, startPt.y);
        ctx.bezierCurveTo(c1x, c1y, c2x, c2y, endPt.x, endPt.y);
        ctx.stroke();

        const angle = Math.atan2(endPt.y - c2y, endPt.x - c2x);
        const headLength = 12 + width;

        ctx.beginPath();
        ctx.moveTo(endPt.x, endPt.y);
        ctx.lineTo(endPt.x - headLength * Math.cos(angle - Math.PI / 6), endPt.y - headLength * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(endPt.x - headLength * Math.cos(angle + Math.PI / 6), endPt.y - headLength * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fill();
    }

    static drawArrowPath(ctx, x1, y1, x2, y2, lineWidth = 4) {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        const angle = Math.atan2(y2 - y1, x2 - x1);
        const headLength = 12 + lineWidth;
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(x2 - headLength * Math.cos(angle - Math.PI / 6), y2 - headLength * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(x2 - headLength * Math.cos(angle + Math.PI / 6), y2 - headLength * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fill();
    }
}
