export class DiagramTextEditor {
    static escapeHtml(text) {
        if (!text) return '';
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    static unescapeHtml(text) {
        if (!text) return '';
        return text
            .replace(/&amp;/g, "&")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&quot;/g, '"')
            .replace(/&#039;/g, "'");
    }

    static createTextEditor(diagram, x, y, existingShape = null) {
        if (diagram.activeTextInput) {
            diagram.activeTextInput.blur();
        }

        const rect = diagram.canvas.getBoundingClientRect();
        const screenX = x * diagram.zoom + diagram.panX + rect.left;
        const screenY = y * diagram.zoom + diagram.panY + rect.top;

        const input = document.createElement('textarea');
        input.value = existingShape ? this.unescapeHtml(existingShape.text) : '';
        const fontSize = existingShape ? (existingShape.fontSize || diagram.currentFontSize) : diagram.currentFontSize;
        input.style.position = 'fixed';
        input.style.left = `${screenX}px`;
        input.style.top = `${screenY}px`;
        input.style.transform = 'translate(-50%, -50%)';
        input.style.textAlign = 'center';
        input.style.font = `${fontSize * diagram.zoom}px Rajdhani, Kanit, sans-serif`;
        input.style.color = existingShape ? existingShape.color : diagram.currentColor;
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
        if (existingShape && existingShape.text) {
            input.select();
        }
        diagram.activeTextInput = input;

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
                        existingShape.fontSize = diagram.currentFontSize;
                    }
                } else {
                    const fSize = diagram.currentFontSize;
                    const lines = escapedVal.split('\n');
                    const longest = lines.reduce((max, line) => Math.max(max, line.length), 0);
                    const w = longest * fSize * 0.6;
                    const h = lines.length * (fSize + 4);
                    
                    diagram.shapes.push({
                        id: Date.now() + '-' + Math.round(Math.random() * 1000),
                        type: 'text',
                        x: x - w / 2,
                        y: y - h / 2 + fSize / 2,
                        text: escapedVal,
                        fontSize: fSize,
                        color: diagram.currentColor,
                        lineWidth: diagram.currentLineWidth
                    });
                }
            } else if (existingShape) {
                // remove if empty
                if (existingShape.type === 'text') {
                    diagram.shapes = diagram.shapes.filter(s => s !== existingShape);
                } else {
                    delete existingShape.text;
                }
            }
            input.remove();
            diagram.activeTextInput = null;
            diagram.saveToStorage();
            diagram.draw();
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
}
