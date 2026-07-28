export class DiagramControls {
    static initControls(diagram) {
        // Tool buttons
        const toolBtns = document.querySelectorAll('.tool-btn');
        toolBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.selectTool(diagram, btn.dataset.tool);
            });
        });

        // Color buttons
        const colorBtns = document.querySelectorAll('.color-btn');
        colorBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                colorBtns.forEach(b => b.classList.remove('active-color', 'border-cyan-400', 'scale-110'));
                btn.classList.add('active-color', 'border-cyan-400', 'scale-110');
                diagram.currentColor = btn.dataset.color;
                
                // If shape is selected, change its color
                if (diagram.selectedShape && diagram.currentTool === 'select') {
                    diagram.selectedShape.color = diagram.currentColor;
                    diagram.saveToStorage();
                    diagram.draw();
                }
            });
        });

        // Line width dropdown
        const widthSelect = document.getElementById('diagram-select-width');
        if (widthSelect) {
            widthSelect.addEventListener('change', (e) => {
                diagram.currentLineWidth = parseInt(e.target.value, 10);
                if (diagram.selectedShape && diagram.currentTool === 'select') {
                    diagram.selectedShape.lineWidth = diagram.currentLineWidth;
                    diagram.saveToStorage();
                    diagram.draw();
                }
            });
        }

        // Font size dropdown
        const fontSizeSelect = document.getElementById('diagram-select-font-size');
        if (fontSizeSelect) {
            fontSizeSelect.addEventListener('change', (e) => {
                diagram.currentFontSize = parseInt(e.target.value, 10);
                if (diagram.currentTool === 'select') {
                    let changed = false;
                    if (diagram.selectedShape) {
                        diagram.selectedShape.fontSize = diagram.currentFontSize;
                        changed = true;
                    }
                    diagram.selectedShapes.forEach(s => {
                        s.fontSize = diagram.currentFontSize;
                        changed = true;
                    });
                    if (changed) {
                        diagram.saveToStorage();
                        diagram.draw();
                    }
                }
            });
        }

        // Fill shape checkbox
        const fillToggle = document.getElementById('diagram-toggle-fill');
        if (fillToggle) {
            fillToggle.addEventListener('change', (e) => {
                diagram.currentFill = e.target.checked;
                if (diagram.selectedShape && diagram.currentTool === 'select') {
                    if (['rect', 'circle', 'diamond', 'parallelogram'].includes(diagram.selectedShape.type)) {
                        diagram.selectedShape.fill = diagram.currentFill;
                        diagram.saveToStorage();
                        diagram.draw();
                    }
                }
            });
        }

        // Zoom Buttons
        const btnZoomIn = document.getElementById('diagram-btn-zoom-in');
        const btnZoomOut = document.getElementById('diagram-btn-zoom-out');
        const btnResetZoom = document.getElementById('diagram-btn-reset-zoom');
        const btnClear = document.getElementById('diagram-btn-clear');

        if (btnZoomIn) btnZoomIn.addEventListener('click', () => diagram.adjustZoom(1.2));
        if (btnZoomOut) btnZoomOut.addEventListener('click', () => diagram.adjustZoom(1 / 1.2));
        if (btnResetZoom) btnResetZoom.addEventListener('click', () => {
            diagram.zoom = 1;
            diagram.panX = 0;
            diagram.panY = 0;
            diagram.updateZoomPercent();
            diagram.saveViewportToStorage();
            diagram.draw();
        });
        const btnUndo = document.getElementById('diagram-btn-undo');
        const btnRedo = document.getElementById('diagram-btn-redo');
        if (btnUndo) btnUndo.addEventListener('click', () => diagram.undo());
        if (btnRedo) btnRedo.addEventListener('click', () => diagram.redo());

        if (btnClear) {
            btnClear.addEventListener('click', () => {
                if (confirm('ต้องการล้างบอร์ดเขียนแบบใช่หรือไม่? (Clear all shapes?)')) {
                    diagram.shapes = [];
                    diagram.selectedShapes = [];
                    diagram.selectedShape = null;
                    diagram.saveToStorage();
                    diagram.draw();
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

    static selectTool(diagram, toolName) {
        const toolBtns = document.querySelectorAll('.tool-btn');
        toolBtns.forEach(btn => {
            if (btn.dataset.tool === toolName) {
                btn.classList.add('active', 'bg-slate-800', 'text-cyan-400');
            } else {
                btn.classList.remove('active', 'bg-slate-800', 'text-cyan-400');
            }
        });
        
        diagram.currentTool = toolName;
        this.updateCursor(diagram);
        if (diagram.currentTool !== 'select') {
            diagram.selectedShapes = [];
            diagram.selectedShape = null;
            diagram.draw();
        }
    }

    static toggleFill(diagram) {
        diagram.currentFill = !diagram.currentFill;
        const fillToggle = document.getElementById('diagram-toggle-fill');
        if (fillToggle) {
            fillToggle.checked = diagram.currentFill;
        }
        
        // Update selected shapes fill
        if (diagram.selectedShapes.length > 0) {
            diagram.selectedShapes.forEach(shape => {
                if (['rect', 'circle', 'diamond', 'parallelogram'].includes(shape.type)) {
                    shape.fill = diagram.currentFill;
                }
            });
            diagram.saveToStorage();
        }
        diagram.draw();
    }

    static updateCursor(diagram) {
        if (diagram.spacePressed || diagram.currentTool === 'pan') {
            diagram.canvas.style.cursor = 'grabbing';
        } else if (diagram.currentTool === 'select') {
            diagram.canvas.style.cursor = 'default';
        } else if (diagram.currentTool === 'text') {
            diagram.canvas.style.cursor = 'text';
        } else {
            diagram.canvas.style.cursor = 'crosshair';
        }
    }

    static updateZoomPercent(diagram) {
        const text = document.getElementById('diagram-zoom-percent');
        if (text) {
            text.textContent = `${Math.round(diagram.zoom * 100)}%`;
        }
    }
}
