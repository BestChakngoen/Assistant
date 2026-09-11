import { ShareUI } from '../ui/share/ShareUI.js';
import { TableCellParser } from './table/TableCellParser.js';
import { TableStorage } from './table/TableStorage.js';
import { TableExporter } from './table/TableExporter.js';
import { TableClipboard } from './table/TableClipboard.js';
import { TableGridRenderer } from './table/TableGridRenderer.js';

/**
 * TableGridTool - Freeform Dynamic Data Grid Tool (Refactored Controller)
 * Orchestrates Storage, Exporter, Clipboard, and Renderer modules.
 * Adheres strictly to SOLID, Clean Code, and Zero Regression standards.
 */
export class TableGridTool {
    constructor() {
        this.storageKey = 'assistant_quick_table_grid';
        this.storage = new TableStorage(this.storageKey);

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
            btnQuickAddCol: null,
            btnPaste: null,
            btnCopy: null,
            btnExportCsv: null,
            btnExportMd: null,
            btnClear: null
        };
    }

    get onSave() {
        return this.storage.onSave;
    }

    set onSave(fn) {
        this.storage.onSave = fn;
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
        const quickAddRowBtn = document.getElementById('btn-table-quick-add-row');
        if (quickAddRowBtn) {
            quickAddRowBtn.addEventListener('click', () => this.addRow());
        }
        if (this.dom.btnAddCol) {
            this.dom.btnAddCol.addEventListener('click', () => this.addColumn());
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

        // Table Event Delegation (Input, Keydown, Click, DblClick, FocusOut, Paste)
        if (this.dom.tableEl) {
            this.dom.tableEl.addEventListener('input', (e) => this.handleTableInput(e));
            this.dom.tableEl.addEventListener('keydown', (e) => this.handleTableKeydown(e));
            this.dom.tableEl.addEventListener('click', (e) => this.handleTableClick(e));
            this.dom.tableEl.addEventListener('dblclick', (e) => this.handleTableDblClick(e));
            this.dom.tableEl.addEventListener('focusout', (e) => this.handleTableFocusOut(e));
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

        // 1. Render Header Row
        TableGridRenderer.renderHeader(this.dom.tableHead, this.data.headers);

        // Re-attach quick add col listener since innerHTML was updated
        this.dom.btnQuickAddCol = document.getElementById('btn-table-quick-add-col');
        if (this.dom.btnQuickAddCol) {
            this.dom.btnQuickAddCol.addEventListener('click', () => this.addColumn());
        }

        // 2. Render Body Rows
        TableGridRenderer.renderBody(this.dom.tableBody, this.data.rows);

        this.updateStats();

        if (window.lucide && typeof window.lucide.createIcons === 'function') {
            window.lucide.createIcons();
        }
    }

    renderCellContent(cell, rowIdx, colIdx) {
        return TableCellParser.renderCellContent(cell, rowIdx, colIdx);
    }

    switchToEditor(td, rowIdx, colIdx) {
        const currentVal = this.data.rows[rowIdx] ? (this.data.rows[rowIdx][colIdx] || '') : '';
        TableGridRenderer.switchToEditor(td, rowIdx, colIdx, currentVal);
    }

    focusCell(row, col) {
        TableGridRenderer.focusCell(this.dom.tableBody, row, col, (td, r, c) => this.switchToEditor(td, r, c));
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

    handleTableFocusOut(e) {
        const target = e.target;
        if (!target || !target.classList.contains('table-cell-editor')) return;

        const row = parseInt(target.getAttribute('data-row'), 10);
        const col = parseInt(target.getAttribute('data-col'), 10);
        if (isNaN(row) || isNaN(col)) return;

        const val = target.innerText;
        if (this.data.rows[row]) {
            this.data.rows[row][col] = val;
            this.handleDataChange();
        }

        if (TableCellParser.hasRichMedia(val)) {
            const td = target.closest('td');
            if (td) {
                td.innerHTML = this.renderCellContent(val, row, col);
                if (window.lucide && typeof window.lucide.createIcons === 'function') {
                    window.lucide.createIcons();
                }
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

            const currentVal = target.innerText;
            if (this.data.rows[row]) {
                this.data.rows[row][col] = currentVal;
                this.handleDataChange();
            }
            if (TableCellParser.hasRichMedia(currentVal)) {
                const td = target.closest('td');
                if (td) {
                    td.innerHTML = this.renderCellContent(currentVal, row, col);
                    if (window.lucide && typeof window.lucide.createIcons === 'function') {
                        window.lucide.createIcons();
                    }
                }
            }

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

            const currentVal = target.innerText;
            if (this.data.rows[row]) {
                this.data.rows[row][col] = currentVal;
                this.handleDataChange();
            }
            if (TableCellParser.hasRichMedia(currentVal)) {
                const td = target.closest('td');
                if (td) {
                    td.innerHTML = this.renderCellContent(currentVal, row, col);
                    if (window.lucide && typeof window.lucide.createIcons === 'function') {
                        window.lucide.createIcons();
                    }
                }
            }

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
        // 1. Preview Image Click
        const previewBtn = e.target.closest('.btn-cell-preview-image');
        if (previewBtn) {
            e.stopPropagation();
            const url = previewBtn.getAttribute('data-url');
            if (url) {
                ShareUI.playSound('mouse-click');
                ShareUI.showImageModal(url, 'Table Image');
            }
            return;
        }

        // 2. Edit Cell Button Click
        const editBtn = e.target.closest('.btn-cell-edit-flow, .btn-cell-edit-url');
        if (editBtn) {
            e.stopPropagation();
            const row = parseInt(editBtn.getAttribute('data-row'), 10);
            const col = parseInt(editBtn.getAttribute('data-col'), 10);
            const td = editBtn.closest('td');
            if (td && !isNaN(row) && !isNaN(col)) {
                this.switchToEditor(td, row, col);
            }
            return;
        }

        // 3. Delete Column
        const delColBtn = e.target.closest('.btn-del-col');
        if (delColBtn) {
            const col = parseInt(delColBtn.getAttribute('data-col'), 10);
            if (!isNaN(col)) {
                this.deleteColumn(col);
            }
            return;
        }

        // 4. Delete Row
        const delRowBtn = e.target.closest('.btn-del-row');
        if (delRowBtn) {
            const row = parseInt(delRowBtn.getAttribute('data-row'), 10);
            if (!isNaN(row)) {
                this.deleteRow(row);
            }
        }
    }

    handleTableDblClick(e) {
        const mediaCard = e.target.closest('.table-cell-flow, .table-cell-media');
        if (mediaCard) {
            const row = parseInt(mediaCard.getAttribute('data-row'), 10);
            const col = parseInt(mediaCard.getAttribute('data-col'), 10);
            const td = mediaCard.closest('td');
            if (td && !isNaN(row) && !isNaN(col)) {
                this.switchToEditor(td, row, col);
            }
        }
    }

    handleTablePaste(e) {
        // 1. Check for clipboard image file paste
        const items = e.clipboardData?.items;
        if (items) {
            for (let i = 0; i < items.length; i++) {
                if (items[i].type && items[i].type.startsWith('image/')) {
                    const file = items[i].getAsFile();
                    if (file) {
                        e.preventDefault();
                        TableClipboard.handlePastedImageFile(file, e.target, this.data, (td, newVal, row, col) => {
                            this.handleDataChange();
                            td.innerHTML = this.renderCellContent(newVal, row, col);
                            if (window.lucide && typeof window.lucide.createIcons === 'function') {
                                window.lucide.createIcons();
                            }
                        });
                        return;
                    }
                }
            }
        }

        const text = (e.clipboardData || window.clipboardData)?.getData('text');
        if (!text) return;

        // 2. Multi-line or tab-separated string paste
        if (text.includes('\t') || text.includes('\n')) {
            e.preventDefault();
            const target = e.target;
            const td = target?.closest('td');
            const startRow = td ? parseInt(td.getAttribute('data-row'), 10) : 0;
            const startCol = td ? parseInt(td.getAttribute('data-col'), 10) : 0;

            this.insertParsedData(text, isNaN(startRow) ? 0 : startRow, isNaN(startCol) ? 0 : startCol);
            return;
        }

        // 3. Single value pasted onto a media cell
        const td = e.target?.closest('td');
        if (td && !e.target.classList.contains('table-cell-editor')) {
            const row = parseInt(td.getAttribute('data-row'), 10);
            const col = parseInt(td.getAttribute('data-col'), 10);
            if (!isNaN(row) && !isNaN(col) && this.data.rows[row]) {
                e.preventDefault();
                const currentVal = this.data.rows[row][col] || '';
                const newVal = currentVal.trim() ? `${currentVal.trim()}\n${text}` : text;
                this.data.rows[row][col] = newVal;
                this.handleDataChange();
                td.innerHTML = this.renderCellContent(newVal, row, col);
                if (window.lucide && typeof window.lucide.createIcons === 'function') {
                    window.lucide.createIcons();
                }
            }
        }
    }

    insertParsedData(text, startRow = 0, startCol = 0) {
        const success = TableClipboard.insertParsedData(this.data, text, startRow, startCol);
        if (success) {
            this.renderTable();
            this.handleDataChange();
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

        // Re-sequence default column headers
        this.data.headers = this.data.headers.map((h, idx) => {
            const trimmed = (h || '').trim();
            if (!trimmed || /^(Column|Col)\s*\d+$/i.test(trimmed)) {
                return `Column ${idx + 1}`;
            }
            return h;
        });

        this.renderTable();
        this.handleDataChange();
    }

    async pasteFromClipboard() {
        const text = await TableClipboard.readClipboardText();
        if (text) {
            this.insertParsedData(text, 0, 0);
        }
    }

    copyToClipboard() {
        const tsv = this.generateTSV();
        TableClipboard.copyTsv(tsv);
    }

    generateTSV() {
        return TableExporter.generateTSV(this.data);
    }

    exportCsv() {
        TableExporter.exportCsv(this.data);
    }

    exportMarkdown() {
        TableExporter.exportMarkdown(this.data);
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
    }

    updateStats() {
        TableGridRenderer.updateStats(this.dom, this.data);
    }

    handleDataChange() {
        this.updateStats();
        this.storage.scheduleSave(this.data, (status, ts) => this.setSaveStatus(status, ts));
    }

    saveToStorage() {
        this.storage.save(this.data, (status, ts) => this.setSaveStatus(status, ts));
    }

    loadFromStorage() {
        const loaded = this.storage.load();
        if (loaded) {
            this.data = loaded;
            if (this.dom.titleInput) {
                this.dom.titleInput.value = this.data.title;
            }
            this.setSaveStatus('saved', this.storage.lastSavedTimestamp);
        } else {
            this.setSaveStatus('ready');
        }
    }

    syncFromCloud(cloudData) {
        const isEditing = this.dom.section && this.dom.section.contains(document.activeElement);
        const merged = this.storage.mergeCloudData(this.data, cloudData, isEditing);
        if (merged) {
            this.data = merged;
            if (this.dom.titleInput) {
                this.dom.titleInput.value = this.data.title;
            }
            this.renderTable();
            this.setSaveStatus('saved', merged.updatedAt);
        }
    }

    setSaveStatus(status, timestamp = null) {
        this.storage.updateStatusBadge(this.dom, status, timestamp);
    }

    escapeHtml(text) {
        return TableGridRenderer.escapeHtml(text);
    }

    compressImageFile(file, maxDim = 600, quality = 0.75) {
        return TableClipboard.compressImageFile(file, maxDim, quality);
    }
}
