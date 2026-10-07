import { Geometry } from './Geometry.js';

export class DiagramStorage {
    static STORAGE_KEY = 'assistant_strategy_diagram';
    static VIEWPORT_STORAGE_KEY = 'assistant_strategy_diagram_viewport';

    static loadViewportFromStorage() {
        try {
            const data = localStorage.getItem(this.VIEWPORT_STORAGE_KEY);
            if (data) {
                const vp = JSON.parse(data);
                if (typeof vp.zoom === 'number' && typeof vp.panX === 'number' && typeof vp.panY === 'number') {
                    return {
                        zoom: Math.min(4, Math.max(0.15, vp.zoom)),
                        panX: vp.panX,
                        panY: vp.panY
                    };
                }
            }
        } catch (e) {
            console.error("Failed to load diagram viewport:", e);
        }
        return { zoom: 1, panX: 0, panY: 0 };
    }

    static saveViewportToStorage(diagram) {
        try {
            const vp = {
                zoom: diagram.zoom,
                panX: diagram.panX,
                panY: diagram.panY
            };
            localStorage.setItem(this.VIEWPORT_STORAGE_KEY, JSON.stringify(vp));
        } catch (e) {
            console.error("Failed to save diagram viewport:", e);
        }
    }

    static loadFromStorage() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            if (data && JSON.parse(data).length > 0) {
                const shapes = JSON.parse(data);
                shapes.forEach(shape => {
                    if (!shape.id) {
                        shape.id = Date.now() + '-' + Math.round(Math.random() * 10000);
                    }
                });
                return shapes;
            }
        } catch (e) {
            console.error("Failed to load diagram shapes:", e);
        }
        const initial = this.getInitialStrategyDiagram();
        this.saveToStorageDirect(initial);
        return initial;
    }

    static saveToStorageDirect(shapes) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(shapes));
        } catch (e) {
            console.error("Failed to save diagram shapes:", e);
        }
    }

    static saveToStorage(diagram) {
        try {
            const state = JSON.stringify(diagram.shapes);
            localStorage.setItem(this.STORAGE_KEY, state);
            
            if (diagram.undoStack && (diagram.undoStack.length === 0 || diagram.undoStack[diagram.undoStack.length - 1] !== state)) {
                diagram.undoStack.push(state);
                if (diagram.undoStack.length > 100) diagram.undoStack.shift();
                diagram.redoStack = [];
            }

            if (diagram.onSaveCallback) {
                diagram.onSaveCallback(diagram.shapes);
            }
        } catch (e) {
            console.error("Failed to save diagram shapes:", e);
        }
    }

    static undo(diagram) {
        if (diagram.undoStack && diagram.undoStack.length > 1) {
            const currentState = diagram.undoStack.pop();
            diagram.redoStack.push(currentState);
            
            const prevState = diagram.undoStack[diagram.undoStack.length - 1];
            diagram.shapes = JSON.parse(prevState);
            
            localStorage.setItem(this.STORAGE_KEY, prevState);
            diagram.selectedShapes = [];
            diagram.selectedShape = null;
            diagram.draw();
        }
    }

    static redo(diagram) {
        if (diagram.redoStack && diagram.redoStack.length > 0) {
            const nextState = diagram.redoStack.pop();
            diagram.undoStack.push(nextState);
            
            diagram.shapes = JSON.parse(nextState);
            
            localStorage.setItem(this.STORAGE_KEY, nextState);
            diagram.selectedShapes = [];
            diagram.selectedShape = null;
            diagram.draw();
        }
    }

    static getSelectedShapesBoundingBox(selectedShapes, shapes) {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        selectedShapes.forEach(shape => {
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
                const bbox = Geometry.getConnectorBoundingBox(shape, shapes);
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

    static getInitialStrategyDiagram() {
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
}
