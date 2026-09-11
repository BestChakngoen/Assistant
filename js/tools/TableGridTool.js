import { ShareUI } from '../ui/share/ShareUI.js';

/**
 * TableGridTool - Freeform Dynamic Data Grid Tool
 * Features:
 * - Blank canvas with freeform row & column additions/deletions
 * - Cells auto-expand/shrink to fit content length naturally
 * - Inline editable column headers & cells
 * - Excel/Google Sheets clipboard paste integration
 * - Copy to clipboard (Markdown / TSV)
 * - File export (.csv with UTF-8 BOM, .md)
 * - Realtime dual-sync (LocalStorage + Firestore)
 */
export class TableGridTool {
    constructor() {
        this.storageKey = 'assistant_quick_table_grid';
        this.saveTimer = null;
        this.onSave = null;
        this.lastSavedTimestamp = 0;

        // Default blank state: 3 cols x 3 rows
        this.data = {
            title: '',
            headers: ['Column 1', 'Column 2', 'Column 3'],
            rows: [
                ['', '', ''],
                ['', '', ''],
                ['', '', '']
            ],
            updatedAt: Date.now()
        };

        this.dom = {
            section: null,
            titleInput: null,
            saveBadge: null,
            lastUpdated: null,
            rowsCount: null,
            colsCount: null,
            cellsCount: null,
            tableEl: null,
            tableHead: null,
            tableBody: null,
            btnAddRow: null,
            btnAddCol: null,
            btnQuickAddRow: null,
            btnQuickAddCol: null,
            btnPaste: null,
            btnCopy: null,
            btnExportCsv: null,
            btnExportMd: null,
            btnClear: null
        };
    }

    init() {
        this.dom.section = document.getElementById('tools-table-section');
        if (!this.dom.section) return;

        this.dom.titleInput = document.getElementById('table-title-input');
        this.dom.saveBadge = document.getElementById('table-save-badge');
        this.dom.lastUpdated = document.getElementById('table-last-updated');
        this.dom.rowsCount = document.getElementById('table-rows-count');
        this.dom.colsCount = document.getElementById('table-cols-count');
        this.dom.cellsCount = document.getElementById('table-cells-count');
        this.dom.tableEl = document.getElementById('table-grid-element');
        this.dom.tableHead = document.getElementById('table-grid-head');
        this.dom.tableBody = document.getElementById('table-grid-body');

        this.dom.btnAddRow = document.getElementById('btn-table-add-row');
        this.dom.btnAddCol = document.getElementById('btn-table-add-col');
        this.dom.btnQuickAddRow = document.getElementById('btn-table-quick-add-row');
        this.dom.btnQuickAddCol = document.getElementById('btn-table-quick-add-col');
        this.dom.btnPaste = document.getElementById('btn-table-paste');
        this.dom.btnCopy = document.getElementById('btn-table-copy');
        this.dom.btnExportCsv = document.getElementById('btn-table-export-csv');
        this.dom.btnExportMd = document.getElementById('btn-table-export-md');
        this.dom.btnClear = document.getElementById('btn-table-clear');

        this.loadFromStorage();
        this.renderTable();
        this.bindEvents();

        if (window.lucide && typeof window.lucide.createIcons === 'function') {
            window.lucide.createIcons();
        }
    }

    bindEvents() {
        // Title Input Event
        if (this.dom.titleInput) {
            this.dom.titleInput.addEventListener('input', () => {
                this.data.title = this.dom.titleInput.value.trim();
                this.handleDataChange();
            });
        }

        // Toolbar Buttons
        if (this.dom.btnAddRow) {
            this.dom.btnAddRow.addEventListener('click', () => this.addRow());
        }
        if (this.dom.btnQuickAddRow) {
            this.dom.btnQuickAddRow.addEventListener('click', () => this.addRow());
        }
        if (this.dom.btnAddCol) {
            this.dom.btnAddCol.addEventListener('click', () => this.addColumn());
        }
        if (this.dom.btnQuickAddCol) {
            this.dom.btnQuickAddCol.addEventListener('click', () => this.addColumn());
        }
        if (this.dom.btnPaste) {
            this.dom.btnPaste.addEventListener('click', () => this.pasteFromClipboard());
        }
        if (this.dom.btnCopy) {
            this.dom.btnCopy.addEventListener('click', () => this.copyToClipboard());
        }
        if (this.dom.btnExportCsv) {
            this.dom.btnExportCsv.addEventListener('click', () => this.exportCsv());
        }
        if (this.dom.btnExportMd) {
            this.dom.btnExportMd.addEventListener('click', () => this.exportMarkdown());
        }
        if (this.dom.btnClear) {
            this.dom.btnClear.addEventListener('click', () => this.clearTable());
        }

        // Table Event Delegation (Input, Keydown, Click, Paste)
        if (this.dom.tableEl) {
            this.dom.tableEl.addEventListener('input', (e) => this.handleTableInput(e));
            this.dom.tableEl.addEventListener('keydown', (e) => this.handleTableKeydown(e));
            this.dom.tableEl.addEventListener('click', (e) => this.handleTableClick(e));
            this.dom.tableEl.addEventListener('paste', (e) => this.handleTablePaste(e));
        }
    }

    renderTable() {
        if (!this.dom.tableHead || !this.dom.tableBody) return;

        // Ensure rows structure matches headers count
        const colCount = Math.max(1, this.data.headers.length);
        this.data.rows.forEach(row => {
            while (row.length < colCount) row.push('');
            if (row.length > colCount) row.length = colCount;
        });

        // 1. Render Header Row (Sticky Header for vertical scrolling)
        let headHtml = `
            <tr class="sticky top-0 z-20 bg-slate-950 text-slate-300 text-xs font-mono border-b border-slate-800/40 shadow-sm">
                <th class="w-10 py-2.5 px-3 text-center text-slate-500 font-normal select-none sticky top-0 z-20 bg-slate-950">#</th>
        `;

        this.data.headers.forEach((header, colIdx) => {
            headHtml += `
                <th class="py-2 px-2 text-left font-normal align-middle sticky top-0 z-20 bg-slate-950" data-col="${colIdx}">
                    <div class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-900 transition-colors">
                        <span contenteditable="plaintext-only" spellcheck="false" class="table-header-editor outline-none min-w-[70px] font-bold text-slate-200 text-xs font-mono whitespace-nowrap block" data-col="${colIdx}" title="Click to rename header">${this.escapeHtml(header)}</span>
                        ${colCount > 1 ? `
                            <button type="button" class="btn-del-col p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all shrink-0" data-col="${colIdx}" title="Delete Column">
                                <i data-lucide="x" class="size-3"></i>
                            </button>
                        ` : ''}
                    </div>
                </th>
            `;
        });

        headHtml += `
                <th class="w-10 py-2 px-2 text-center align-middle select-none sticky top-0 z-20 bg-slate-950">
                    <button id="btn-table-quick-add-col" type="button" class="p-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-all flex items-center justify-center mx-auto" title="Add New Column">
                        <i data-lucide="plus" class="size-3.5"></i>
                    </button>
                </th>
            </tr>
        `;
        this.dom.tableHead.innerHTML = headHtml;

        // Re-attach quick add col listener since innerHTML was updated
        this.dom.btnQuickAddCol = document.getElementById('btn-table-quick-add-col');
        if (this.dom.btnQuickAddCol) {
            this.dom.btnQuickAddCol.addEventListener('click', () => this.addColumn());
        }

        // 2. Render Body Rows
        let bodyHtml = '';
        this.data.rows.forEach((row, rowIdx) => {
            bodyHtml += `
                <tr class="group hover:bg-slate-800/20 transition-colors border-b border-slate-800/20" data-row="${rowIdx}">
                    <td class="w-10 py-2.5 px-3 text-center text-slate-500 text-xs font-mono select-none">${rowIdx + 1}</td>
            `;

            row.forEach((cell, colIdx) => {
                bodyHtml += `
                    <td class="py-1.5 px-2 align-top" data-row="${rowIdx}" data-col="${colIdx}">
                        <div contenteditable="plaintext-only" spellcheck="false" role="textbox" class="table-cell-editor outline-none min-w-[90px] whitespace-pre-wrap break-words px-3 py-2 text-xs font-mono text-slate-100 rounded-xl transition-all focus:bg-slate-900/90 focus:ring-1 focus:ring-emerald-500/40" data-row="${rowIdx}" data-col="${colIdx}">${this.escapeHtml(cell)}</div>
                    </td>
                `;
            });

            bodyHtml += `
                    <td class="w-10 py-2 px-2 text-center align-middle select-none">
                        <button type="button" class="btn-del-row p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all opacity-40 group-hover:opacity-100" data-row="${rowIdx}" title="Delete Row">
                            <i data-lucide="trash-2" class="size-3.5"></i>
                        </button>
                    </td>
                </tr>
            `;
        });

        this.dom.tableBody.innerHTML = bodyHtml;

        this.updateStats();

        if (window.lucide && typeof window.lucide.createIcons === 'function') {
            window.lucide.createIcons();
        }
    }

    handleTableInput(e) {
        const target = e.target;
        if (!target) return;

        if (target.classList.contains('table-header-editor')) {
            const col = parseInt(target.getAttribute('data-col'), 10);
            if (!isNaN(col) && this.data.headers[col] !== undefined) {
                this.data.headers[col] = target.innerText.trim() || `Col ${col + 1}`;
                this.handleDataChange();
            }
            return;
        }

        if (target.classList.contains('table-cell-editor')) {
            const row = parseInt(target.getAttribute('data-row'), 10);
            const col = parseInt(target.getAttribute('data-col'), 10);
            if (!isNaN(row) && !isNaN(col) && this.data.rows[row] && this.data.rows[row][col] !== undefined) {
                this.data.rows[row][col] = target.innerText;
                this.handleDataChange();
            }
        }
    }

    handleTableKeydown(e) {
        const target = e.target;
        if (!target || !target.classList.contains('table-cell-editor')) return;

        const row = parseInt(target.getAttribute('data-row'), 10);
        const col = parseInt(target.getAttribute('data-col'), 10);
        if (isNaN(row) || isNaN(col)) return;

        // Enter key: move to same column in next row (or add row if at the end)
        if (e.key === 'Enter' && !e.shiftKey && !e.altKey && !e.ctrlKey) {
            e.preventDefault();
            if (row + 1 < this.data.rows.length) {
                this.focusCell(row + 1, col);
            } else {
                this.addRow();
                setTimeout(() => this.focusCell(row + 1, col), 10);
            }
            return;
        }

        // Tab key: navigate cells
        if (e.key === 'Tab') {
            e.preventDefault();
            if (e.shiftKey) {
                // Prev cell
                if (col > 0) {
                    this.focusCell(row, col - 1);
                } else if (row > 0) {
                    this.focusCell(row - 1, this.data.headers.length - 1);
                }
            } else {
                // Next cell
                if (col + 1 < this.data.headers.length) {
                    this.focusCell(row, col + 1);
                } else if (row + 1 < this.data.rows.length) {
                    this.focusCell(row + 1, 0);
                } else {
                    this.addRow();
                    setTimeout(() => this.focusCell(row + 1, 0), 10);
                }
            }
        }
    }

    handleTableClick(e) {
        const delColBtn = e.target.closest('.btn-del-col');
        if (delColBtn) {
            const col = parseInt(delColBtn.getAttribute('data-col'), 10);
            if (!isNaN(col)) {
                this.deleteColumn(col);
            }
            return;
        }

        const delRowBtn = e.target.closest('.btn-del-row');
        if (delRowBtn) {
            const row = parseInt(delRowBtn.getAttribute('data-row'), 10);
            if (!isNaN(row)) {
                this.deleteRow(row);
            }
        }
    }

    handleTablePaste(e) {
        const text = (e.clipboardData || window.clipboardData)?.getData('text');
        if (!text) return;

        // If it's a multi-line or tab-separated string, parse into cells
        if (text.includes('\t') || text.includes('\n')) {
            e.preventDefault();
            const target = e.target;
            const startRow = target && target.classList.contains('table-cell-editor')
                ? parseInt(target.getAttribute('data-row'), 10)
                : 0;
            const startCol = target && target.classList.contains('table-cell-editor')
                ? parseInt(target.getAttribute('data-col'), 10)
                : 0;

            this.insertParsedData(text, isNaN(startRow) ? 0 : startRow, isNaN(startCol) ? 0 : startCol);
        }
    }

    insertParsedData(text, startRow = 0, startCol = 0) {
        const rawLines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
        // Filter trailing empty line
        if (rawLines.length > 0 && rawLines[rawLines.length - 1] === '') {
            rawLines.pop();
        }
        if (rawLines.length === 0) return;

        const parsedRows = rawLines.map(line => line.split('\t'));
        const maxColsNeeded = Math.max(...parsedRows.map(r => r.length));

        // Expand headers if needed
        const totalColsNeeded = Math.max(this.data.headers.length, startCol + maxColsNeeded);
        while (this.data.headers.length < totalColsNeeded) {
            this.data.headers.push(`Col ${this.data.headers.length + 1}`);
        }

        // Expand rows if needed
        const totalRowsNeeded = Math.max(this.data.rows.length, startRow + parsedRows.length);
        while (this.data.rows.length < totalRowsNeeded) {
            const newRow = new Array(this.data.headers.length).fill('');
            this.data.rows.push(newRow);
        }

        // Fill cells
        for (let r = 0; r < parsedRows.length; r++) {
            const targetRow = startRow + r;
            const rowData = parsedRows[r];
            for (let c = 0; c < rowData.length; c++) {
                const targetCol = startCol + c;
                this.data.rows[targetRow][targetCol] = rowData[c];
            }
        }

        this.renderTable();
        this.handleDataChange();
        ShareUI.showToast('Data Pasted', `Imported ${parsedRows.length} rows and ${maxColsNeeded} columns`, 'success');
    }

    focusCell(row, col) {
        const cell = this.dom.tableBody?.querySelector(`.table-cell-editor[data-row="${row}"][data-col="${col}"]`);
        if (cell) {
            cell.focus();
            cell.scrollIntoView({ block: 'nearest', inline: 'nearest' });
            // Move cursor to end of text
            const range = document.createRange();
            const sel = window.getSelection();
            range.selectNodeContents(cell);
            range.collapse(false);
            sel.removeAllRanges();
            sel.addRange(range);
        }
    }

    addRow() {
        const newRow = new Array(this.data.headers.length).fill('');
        this.data.rows.push(newRow);
        this.renderTable();
        this.handleDataChange();

        // Focus first cell of newly created row
        setTimeout(() => this.focusCell(this.data.rows.length - 1, 0), 10);
    }

    deleteRow(rowIdx) {
        if (this.data.rows.length <= 1) {
            // Reset single row instead of deleting everything
            this.data.rows = [new Array(this.data.headers.length).fill('')];
        } else {
            this.data.rows.splice(rowIdx, 1);
        }
        this.renderTable();
        this.handleDataChange();
    }

    addColumn() {
        const newColName = `Column ${this.data.headers.length + 1}`;
        this.data.headers.push(newColName);
        this.data.rows.forEach(row => row.push(''));
        this.renderTable();
        this.handleDataChange();
    }

    deleteColumn(colIdx) {
        if (this.data.headers.length <= 1) {
            ShareUI.showToast('Info', 'Table must have at least one column', 'info');
            return;
        }
        this.data.headers.splice(colIdx, 1);
        this.data.rows.forEach(row => row.splice(colIdx, 1));

        // Re-index/re-sequence columns automatically when a column is deleted
        this.data.headers = this.data.headers.map((h, idx) => {
            const trimmed = (h || '').trim();
            // If it matches default pattern like "Column X", "Col X", or is empty, re-sequence it
            if (!trimmed || /^(Column|Col)\s*\d+$/i.test(trimmed)) {
                return `Column ${idx + 1}`;
            }
            return h;
        });

        this.renderTable();
        this.handleDataChange();
    }

    async pasteFromClipboard() {
        try {
            if (!navigator.clipboard || !navigator.clipboard.readText) {
                ShareUI.showToast('Clipboard Error', 'Clipboard access not supported or denied by browser', 'error');
                return;
            }
            const text = await navigator.clipboard.readText();
            if (!text || !text.trim()) {
                ShareUI.showToast('Clipboard Empty', 'No text found in clipboard', 'info');
                return;
            }
            this.insertParsedData(text, 0, 0);
        } catch (e) {
            console.error('Failed to read clipboard:', e);
            ShareUI.showToast('Clipboard Access', 'Please paste directly into the table (Ctrl+V)', 'info');
        }
    }

    copyToClipboard() {
        const tsv = this.generateTSV();
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

    generateTSV() {
        const headerLine = this.data.headers.join('\t');
        const rowLines = this.data.rows.map(row => row.join('\t'));
        return [headerLine, ...rowLines].join('\n');
    }

    exportCsv() {
        try {
            const escapeCsvCell = (val) => {
                const s = (val ?? '').toString();
                if (s.includes('"') || s.includes(',') || s.includes('\n') || s.includes('\r')) {
                    return `"${s.replace(/"/g, '""')}"`;
                }
                return s;
            };

            const headerLine = this.data.headers.map(escapeCsvCell).join(',');
            const rowLines = this.data.rows.map(row => row.map(escapeCsvCell).join(','));
            const csvContent = '\uFEFF' + [headerLine, ...rowLines].join('\r\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const safeTitle = (this.data.title || 'quick_table')
                .trim()
                .toLowerCase()
                .replace(/[^a-z0-9_\-\u0E00-\u0E7F]+/g, '_')
                .replace(/^_+|_+$/g, '') || 'quick_table';
            const filename = `${safeTitle}_${Date.now()}.csv`;

            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            ShareUI.showToast('Exported', `Saved as ${filename}`, 'success');
        } catch (e) {
            console.error('Export CSV failed:', e);
            ShareUI.showToast('Export Failed', 'Could not export CSV file', 'error');
        }
    }

    exportMarkdown() {
        try {
            const headers = this.data.headers.map(h => (h || '').trim());
            const dividers = headers.map(() => '---');

            const formatMdRow = (cells) => {
                return '| ' + cells.map(c => (c || '').replace(/\|/g, '\\|').replace(/\n/g, ' ')).join(' | ') + ' |';
            };

            const lines = [
                formatMdRow(headers),
                formatMdRow(dividers),
                ...this.data.rows.map(r => formatMdRow(r))
            ];

            const titleText = this.data.title ? `# ${this.data.title}\n\n` : '';
            const mdContent = titleText + lines.join('\n');

            const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const safeTitle = (this.data.title || 'quick_table')
                .trim()
                .toLowerCase()
                .replace(/[^a-z0-9_\-\u0E00-\u0E7F]+/g, '_')
                .replace(/^_+|_+$/g, '') || 'quick_table';
            const filename = `${safeTitle}_${Date.now()}.md`;

            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            ShareUI.showToast('Exported', `Saved as ${filename}`, 'success');
        } catch (e) {
            console.error('Export Markdown failed:', e);
            ShareUI.showToast('Export Failed', 'Could not export Markdown file', 'error');
        }
    }

    async clearTable() {
        const hasContent = this.data.rows.some(r => r.some(cell => cell.trim() !== '')) || this.data.title;
        if (!hasContent) return;

        const confirmed = await ShareUI.showConfirmModal({
            title: 'Clear Data Table?',
            message: 'Are you sure you want to reset this table? All rows and content will be cleared back to a blank 3x3 grid.',
            icon: 'trash-2',
            iconColor: 'text-rose-400',
            confirmLabel: 'Clear All',
            confirmClass: 'bg-rose-600 hover:bg-rose-500 text-white'
        });

        if (!confirmed) return;

        this.data = {
            title: '',
            headers: ['Column 1', 'Column 2', 'Column 3'],
            rows: [
                ['', '', ''],
                ['', '', ''],
                ['', '', '']
            ],
            updatedAt: Date.now()
        };

        if (this.dom.titleInput) this.dom.titleInput.value = '';
        this.renderTable();
        this.saveToStorage();
        ShareUI.showToast('Cleared', 'Table reset to blank canvas', 'info');
    }

    updateStats() {
        const numRows = this.data.rows.length;
        const numCols = this.data.headers.length;
        const numCells = numRows * numCols;

        if (this.dom.rowsCount) this.dom.rowsCount.textContent = `${numRows.toLocaleString()} rows`;
        if (this.dom.colsCount) this.dom.colsCount.textContent = `${numCols.toLocaleString()} columns`;
        if (this.dom.cellsCount) this.dom.cellsCount.textContent = `${numCells.toLocaleString()} cells`;
    }

    handleDataChange() {
        this.updateStats();
        this.setSaveStatus('saving');

        clearTimeout(this.saveTimer);
        this.saveTimer = setTimeout(() => {
            this.saveToStorage();
        }, 400);
    }

    saveToStorage() {
        try {
            this.data.updatedAt = Date.now();
            this.lastSavedTimestamp = this.data.updatedAt;
            localStorage.setItem(this.storageKey, JSON.stringify(this.data));
            this.setSaveStatus('saved', this.data.updatedAt);

            if (typeof this.onSave === 'function') {
                this.onSave(this.data);
            }
        } catch (e) {
            console.error('Failed to save table data to localStorage:', e);
            this.setSaveStatus('error');
        }
    }

    loadFromStorage() {
        try {
            const raw = localStorage.getItem(this.storageKey);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed && Array.isArray(parsed.headers) && Array.isArray(parsed.rows)) {
                    this.data = {
                        title: parsed.title || '',
                        headers: parsed.headers.length > 0 ? parsed.headers : ['Column 1', 'Column 2', 'Column 3'],
                        rows: parsed.rows.length > 0 ? parsed.rows : [['', '', ''], ['', '', ''], ['', '', '']],
                        updatedAt: parsed.updatedAt || Date.now()
                    };
                    if (this.dom.titleInput) {
                        this.dom.titleInput.value = this.data.title;
                    }
                    this.lastSavedTimestamp = this.data.updatedAt;
                    this.setSaveStatus('saved', this.lastSavedTimestamp);
                    return;
                }
            }
        } catch (e) {
            console.error('Failed to load table data from localStorage:', e);
        }

        this.setSaveStatus('ready');
    }

    syncFromCloud(cloudData) {
        if (!cloudData) {
            // Push local data as initial seed if local exists and has content
            const hasContent = this.data.rows.some(r => r.some(c => c.trim() !== '')) || this.data.title;
            if (hasContent && typeof this.onSave === 'function') {
                this.onSave(this.data);
            }
            return;
        }

        const cloudTime = typeof cloudData.updatedAt === 'number'
            ? cloudData.updatedAt
            : (cloudData.updatedAt ? new Date(cloudData.updatedAt).getTime() : 0);
        const localTime = this.lastSavedTimestamp || 0;

        // If user is actively typing right now and local changes are at least as new as cloud, don't interrupt
        const isEditing = this.dom.section && this.dom.section.contains(document.activeElement);
        if (isEditing && localTime >= cloudTime) {
            return;
        }

        if (cloudTime > localTime) {
            let cloudRows = [];
            if (Array.isArray(cloudData.rows)) {
                cloudRows = cloudData.rows;
            } else if (typeof cloudData.rowsJson === 'string') {
                try {
                    cloudRows = JSON.parse(cloudData.rowsJson);
                } catch (e) {
                    cloudRows = [];
                }
            }

            if (Array.isArray(cloudData.headers)) {
                this.data = {
                    title: cloudData.title || '',
                    headers: cloudData.headers.length > 0 ? cloudData.headers : ['Column 1', 'Column 2', 'Column 3'],
                    rows: cloudRows.length > 0 ? cloudRows : [['', '', ''], ['', '', ''], ['', '', '']],
                    updatedAt: cloudTime
                };
                if (this.dom.titleInput) {
                    this.dom.titleInput.value = this.data.title;
                }
                this.lastSavedTimestamp = cloudTime;
                this.renderTable();
                this.setSaveStatus('saved', cloudTime);
            }
        }
    }

    setSaveStatus(status, timestamp = null) {
        if (!this.dom.saveBadge) return;

        if (status === 'saving') {
            this.dom.saveBadge.className = 'flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400';
            this.dom.saveBadge.innerHTML = `
                <span class="size-1.5 rounded-full bg-amber-400 animate-ping"></span>
                <span>Saving...</span>
            `;
            return;
        }

        if (status === 'saved') {
            this.dom.saveBadge.className = 'flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400';
            this.dom.saveBadge.innerHTML = `
                <span class="size-1.5 rounded-full bg-emerald-400"></span>
                <span>Saved</span>
            `;

            if (this.dom.lastUpdated && timestamp) {
                const date = new Date(timestamp);
                const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                this.dom.lastUpdated.textContent = `Auto-saved at ${timeStr}`;
            }
            return;
        }

        if (status === 'error') {
            this.dom.saveBadge.className = 'flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/10 text-rose-400';
            this.dom.saveBadge.innerHTML = `
                <span class="size-1.5 rounded-full bg-rose-400"></span>
                <span>Sync Error</span>
            `;
            return;
        }

        // Ready state
        this.dom.saveBadge.className = 'flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800/60 text-slate-400';
        this.dom.saveBadge.innerHTML = `
            <span class="size-1.5 rounded-full bg-slate-500"></span>
            <span>Ready</span>
        `;
    }

    escapeHtml(text) {
        if (!text) return '';
        return text
            .toString()
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
}
