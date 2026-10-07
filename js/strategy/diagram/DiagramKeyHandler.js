/**
 * DiagramKeyHandler.js - Keyboard Shortcuts & Tool Selection for Whiteboard Diagram
 * Handles keyboard hotkeys, tool toggles, undo/redo, delete shapes, and spacebar pan.
 */
import { DiagramControls } from './DiagramControls.js';

export class DiagramKeyHandler {
    static initKeyboardEvents(diagram) {
        diagram._boundKeyDown = (e) => {
            if (document.activeElement.tagName === 'INPUT' || 
                document.activeElement.tagName === 'TEXTAREA') {
                return;
            }

            if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) {
                e.preventDefault();
                diagram.undo();
                return;
            }
            if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || e.key === 'Y')) {
                e.preventDefault();
                diagram.redo();
                return;
            }

            if (e.code === 'Space') {
                diagram.spacePressed = true;
                if (diagram.currentTool !== 'pan') {
                    diagram.canvas.style.cursor = 'grab';
                }
            } else if (e.key === 'd' || e.key === 'D') {
                diagram.dKeyPressed = true;
            } else if (e.key === 'a' || e.key === 'A' || e.key === 'v' || e.key === 'V') {
                diagram.selectTool('select');
            } else if (e.key === 'h' || e.key === 'H') {
                diagram.selectTool('pan');
            } else if (e.key === 'o' || e.key === 'O') {
                diagram.selectTool('pencil');
            } else if (e.key === 'u' || e.key === 'U') {
                diagram.selectTool('arrow');
            } else if (e.key === 'w' || e.key === 'W') {
                diagram.selectTool('text');
            } else if (e.key === 'e' || e.key === 'E') {
                diagram.selectTool('eraser');
            } else if (e.key === 't' || e.key === 'T') {
                if (diagram.currentTool === 'rect') {
                    diagram.toggleFill();
                } else {
                    diagram.selectTool('rect');
                }
            } else if (e.key === 'c' || e.key === 'C') {
                if (diagram.currentTool === 'circle') {
                    diagram.toggleFill();
                } else {
                    diagram.selectTool('circle');
                }
            } else if (e.key === 'y' || e.key === 'Y') {
                if (diagram.currentTool === 'diamond') {
                    diagram.toggleFill();
                } else {
                    diagram.selectTool('diamond');
                }
            } else if (e.key === 'p' || e.key === 'P') {
                if (diagram.currentTool === 'parallelogram') {
                    diagram.toggleFill();
                } else {
                    diagram.selectTool('parallelogram');
                }
            } else if (e.key === 'l' || e.key === 'L') {
                diagram.selectTool('line');
            } else if (e.key === 'Delete' || e.key === 'Backspace') {
                if (diagram.selectedShapes.length > 0) {
                    const idsToDelete = new Set(diagram.selectedShapes.map(s => s.id));
                    diagram.shapes = diagram.shapes.filter(s => {
                        if (idsToDelete.has(s.id)) return false;
                        if (s.type === 'connector') {
                            return !idsToDelete.has(s.fromId) && !idsToDelete.has(s.toId);
                        }
                        return true;
                    });
                    diagram.selectedShapes = [];
                    diagram.selectedShape = null;
                    diagram.saveToStorage();
                    diagram.draw();
                }
            }
        };

        diagram._boundKeyUp = (e) => {
            if (e.code === 'Space') {
                diagram.spacePressed = false;
                DiagramControls.updateCursor(diagram);
            } else if (e.key === 'd' || e.key === 'D') {
                diagram.dKeyPressed = false;
            }
        };

        window.addEventListener('keydown', diagram._boundKeyDown);
        window.addEventListener('keyup', diagram._boundKeyUp);
    }
}
