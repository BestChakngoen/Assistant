import { ShareUI } from '../../ui/share/ShareUI.js';

/**
 * TableClipboard.js - Clipboard & Matrix Integration
 * Handles Excel/Sheets paste parsing, clipboard reading/copying, and pasted image compression.
 * Adheres strictly to SRP and Clean Code standards.
 */

export class TableClipboard {
    static insertParsedData(data, text, startRow = 0, startCol = 0) {
        const rawLines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
        // Filter trailing empty line
        if (rawLines.length > 0 && rawLines[rawLines.length - 1] === '') {
            rawLines.pop();
        }
        if (rawLines.length === 0) return false;

        const parsedRows = rawLines.map(line => line.split('\t'));
        const maxColsNeeded = Math.max(...parsedRows.map(r => r.length));

        // Expand headers if needed
        const totalColsNeeded = Math.max(data.headers.length, startCol + maxColsNeeded);
        while (data.headers.length < totalColsNeeded) {
            data.headers.push(`Col ${data.headers.length + 1}`);
        }

        // Expand rows if needed
        const totalRowsNeeded = Math.max(data.rows.length, startRow + parsedRows.length);
        while (data.rows.length < totalRowsNeeded) {
            const newRow = new Array(data.headers.length).fill('');
            data.rows.push(newRow);
        }

        // Fill cells
        for (let r = 0; r < parsedRows.length; r++) {
            const targetRow = startRow + r;
            const rowData = parsedRows[r];
            for (let c = 0; c < rowData.length; c++) {
                const targetCol = startCol + c;
                data.rows[targetRow][targetCol] = rowData[c];
            }
        }

        return true;
    }

    static async readClipboardText() {
        try {
            if (!navigator.clipboard || !navigator.clipboard.readText) {
                ShareUI.showToast('Clipboard Error', 'Clipboard access not supported or denied by browser', 'error');
                return null;
            }
            const text = await navigator.clipboard.readText();
            if (!text || !text.trim()) {
                ShareUI.showToast('Clipboard Empty', 'No text found in clipboard', 'info');
                return null;
            }
            return text;
        } catch (e) {
            console.error('Failed to read clipboard:', e);
            ShareUI.showToast('Clipboard Access', 'Please paste directly into the table (Ctrl+V)', 'info');
            return null;
        }
    }

    static copyTsv(tsv) {
        if (!tsv) {
            ShareUI.showToast('Empty Table', 'No data to copy', 'info');
            return;
        }

        navigator.clipboard.writeText(tsv).then(() => {
            ShareUI.showToast('Copied', 'Table data copied to clipboard (TSV / Excel ready)', 'success');
        }).catch(err => {
            console.error('Copy failed:', err);
            ShareUI.showToast('Copy Failed', 'Unable to copy table to clipboard', 'error');
        });
    }

    static compressImageFile(file, maxDim = 600, quality = 0.75) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (readerEvent) => {
                const img = new Image();
                img.onload = () => {
                    let w = img.width;
                    let h = img.height;
                    if (w > maxDim || h > maxDim) {
                        if (w > h) {
                            h = Math.round((h * maxDim) / w);
                            w = maxDim;
                        } else {
                            w = Math.round((w * maxDim) / h);
                            h = maxDim;
                        }
                    }
                    const canvas = document.createElement('canvas');
                    canvas.width = w;
                    canvas.height = h;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, w, h);
                    resolve(canvas.toDataURL('image/jpeg', quality));
                };
                img.onerror = reject;
                img.src = readerEvent.target.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    static async handlePastedImageFile(file, target, data, onUpdated) {
        try {
            const dataUrl = await this.compressImageFile(file, 600, 0.75);
            const td = target?.closest('td');
            if (!td) return;
            const row = parseInt(td.getAttribute('data-row'), 10);
            const col = parseInt(td.getAttribute('data-col'), 10);
            if (isNaN(row) || isNaN(col)) return;

            if (data.rows[row]) {
                const currentVal = data.rows[row][col] || '';
                const newVal = currentVal.trim() ? `${currentVal.trim()}\n${dataUrl}` : dataUrl;
                data.rows[row][col] = newVal;
                if (typeof onUpdated === 'function') {
                    onUpdated(td, newVal, row, col);
                }
            }
        } catch (e) {
            console.error('Failed to process pasted image:', e);
            ShareUI.showToast('Image Error', 'Could not process clipboard image', 'error');
        }
    }
}
