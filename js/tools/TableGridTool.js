import { ShareUI } from '../ui/share/ShareUI.js';
import { TableCellParser } from './table/TableCellParser.js';
import { TableStorage } from './table/TableStorage.js';
import { TableExporter } from './table/TableExporter.js';
import { TableClipboard } from './table/TableClipboard.js';
import { TableGridRenderer } from './table/TableGridRenderer.js';
import { TableSheetManager } from './table/TableSheetManager.js';
import { TableHistoryManager } from './table/TableHistoryManager.js';
import { TablePanManager } from './table/TablePanManager.js';
import { ToolZoomManager } from './common/ToolZoomManager.js';

/**
 * TableGridTool - Freeform Dynamic Data Grid Tool (Refactored Controller)
 * Orchestrates Storage, Exporter, Clipboard, Renderer, SheetManager, History, Pan, and Zoom modules.
 * Adheres strictly to SOLID, Clean Code, and Zero Regression standards.
 */
export class TableGridTool {
    constructor() {
        this.storageKey = 'assistant_quick_table_grid';
        this.storage = new TableStorage(this.storageKey);
        this.sheetManager = new TableSheetManager();
        this.historyManager = new TableHistoryManager();
        this.panManager = null;
        this.zoomManager = null;

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
            btnQuickAddCol: null,
            btnUndo: null,
            btnRedo: null,
            btnExportCsv: null,
            btnExportMd: null,
            btnClear: null,
            sheetsTabs: null,
            btnAddSheet: null,
            scrollWrapper: null
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
        this.dom.scrollWrapper = document.getElementById('table-scroll-wrapper');

        if (this.dom.scrollWrapper) {
            this.panManager = new TablePanManager(this.dom.scrollWrapper);
            this.panManager.init();
        }

        if (this.dom.section && this.dom.tableEl) {
            const cardEl = this.dom.section.querySelector('.rounded-3xl') || this.dom.section;
            this.zoomManager = new ToolZoomManager({
                container: cardEl,
                storageKey: 'assistant_quick_table_zoom',
                minZoom: 0.7,
                maxZoom: 2.0,
                step: 0.1,
                defaultZoom: 1.0,
                accentColor: 'text-emerald-400',
                onZoomChange: (zoomLevel) => {
                    this.dom.tableEl.style.zoom = zoomLevel;
                }
            });
            this.zoomManager.init();
        }

        this.dom.btnQuickAddCol = document.getElementById('btn-table-quick-add-col');
        this.dom.btnUndo = document.getElementById('btn-table-undo');
        this.dom.btnRedo = document.getElementById('btn-table-redo');
        this.dom.btnExportCsv = document.getElementById('btn-table-export-csv');
        this.dom.btnExportMd = document.getElementById('btn-table-export-md');
        this.dom.btnClear = document.getElementById('btn-table-clear');
        this.dom.sheetsTabs = document.getElementById('table-sheets-tabs');
        this.dom.btnAddSheet = document.getElementById('btn-table-add-sheet');

        this.sheetManager.init({
            tabsContainer: this.dom.sheetsTabs,
            btnAddSheet: this.dom.btnAddSheet,
            onSwitch: (targetSheet, previousSheet) => {
                if (previousSheet) {
                    this.historyManager.flushPendingTyping();
                    previousSheet.title = this.data.title;
                    previousSheet.headers = this.data.headers;
                    previousSheet.rows = this.data.rows;
                    previousSheet.updatedAt = Date.now();
                }
                this.data.title = targetSheet.title || '';
                this.data.headers = Array.isArray(targetSheet.headers) && targetSheet.headers.length > 0 ? targetSheet.headers : ['Column 1', 'Column 2', 'Column 3'];
                this.data.rows = Array.isArray(targetSheet.rows) && targetSheet.rows.length > 0 ? targetSheet.rows : [['', '', ''], ['', '', ''], ['', '', '']];
                if (this.dom.titleInput) {
                    this.dom.titleInput.value = this.data.title;
                }
                this.historyManager.setSheet(targetSheet.id, this.data);
                this.renderTable();
                this.saveToStorage();
                this.updateUndoRedoButtons();
            },
            onDataChange: () => {
                this.saveToStorage();
            },
            onDelete: (deletedSheetId) => {
                this.historyManager.deleteSheet(deletedSheetId);
            }
        });

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
        const quickAddRowBtn = document.getElementById('btn-table-quick-add-row');
        if (quickAddRowBtn) {
            quickAddRowBtn.addEventListener('click', () => this.addRow());
        }
        if (this.dom.btnUndo) {
            this.dom.btnUndo.addEventListener('click', () => this.undo());
        }
        if (this.dom.btnRedo) {
            this.dom.btnRedo.addEventListener('click', () => this.redo());
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

        // Keyboard Shortcuts (Universal layout support for English & Thai)
        if (this.dom.section) {
            this.dom.section.addEventListener('keydown', (e) => {
                const isCtrlOrCmd = e.ctrlKey || e.metaKey;
                if (!isCtrlOrCmd) return;

                const code = e.code;
                const key = e.key.toLowerCase();

                // Undo: Ctrl+Z (without Shift)
                // Physical KeyZ, or key 'z', or Thai 'ผ'
                if ((code === 'KeyZ' || key === 'z' || key === 'ผ') && !e.shiftKey && !e.altKey) {
                    e.preventDefault();
                    this.undo();
                    return;
                }

                // Redo: Ctrl+Y or Ctrl+Shift+Z
                // Physical KeyY, or key 'y', or Thai 'ั'
                // Physical KeyZ + Shift, or Thai 'ฉ'/'ผ' + Shift
                const isRedoZ = (code === 'KeyZ' || key === 'z' || key === 'ผ' || key === 'ฉ') && e.shiftKey;
                const isRedoY = (code === 'KeyY' || key === 'y' || key === 'ั') && !e.shiftKey;
                if ((isRedoZ || isRedoY) && !e.altKey) {
                    e.preventDefault();
                    this.redo();
                    return;
                }
            });
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
            this.handleDataChange({ immediate: true });
        }
    }

    addRow() {
        const newRow = new Array(this.data.headers.length).fill('');
        this.data.rows.push(newRow);
        this.renderTable();
        this.handleDataChange({ immediate: true });

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
        this.handleDataChange({ immediate: true });
    }

    addColumn() {
        const newColName = `Column ${this.data.headers.length + 1}`;
        this.data.headers.push(newColName);
        this.data.rows.forEach(row => row.push(''));
        this.renderTable();
        this.handleDataChange({ immediate: true });
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
        this.handleDataChange({ immediate: true });
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

        // Record snapshot before clearing so user can undo clear
        this.historyManager.recordImmediate(this.data);

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
        this.handleDataChange({ immediate: true });
    }

    undo() {
        const previousData = {
            title: this.data.title || '',
            headers: Array.isArray(this.data.headers) ? [...this.data.headers] : [],
            rows: Array.isArray(this.data.rows) ? this.data.rows.map(r => [...r]) : []
        };

        const restored = this.historyManager.undo(this.data);
        if (!restored) return;

        const diff = this.findTableDiff(previousData, restored);

        this.data.title = restored.title || '';
        this.data.headers = Array.isArray(restored.headers) ? [...restored.headers] : [];
        this.data.rows = Array.isArray(restored.rows) ? restored.rows.map(r => [...r]) : [];

        if (this.dom.titleInput) {
            this.dom.titleInput.value = this.data.title;
        }

        this.renderTable();
        this.updateStats();
        this.updateUndoRedoButtons();
        this.sheetManager.updateActiveSheet(this.data.title, this.data.headers, this.data.rows);
        const payload = this.sheetManager.getStatePayload();
        this.storage.scheduleSave(payload, (status, ts) => this.setSaveStatus(status, ts));

        if (diff) {
            this.navigateToDiff(diff);
        }
    }

    redo() {
        const previousData = {
            title: this.data.title || '',
            headers: Array.isArray(this.data.headers) ? [...this.data.headers] : [],
            rows: Array.isArray(this.data.rows) ? this.data.rows.map(r => [...r]) : []
        };

        const restored = this.historyManager.redo(this.data);
        if (!restored) return;

        const diff = this.findTableDiff(previousData, restored);

        this.data.title = restored.title || '';
        this.data.headers = Array.isArray(restored.headers) ? [...restored.headers] : [];
        this.data.rows = Array.isArray(restored.rows) ? restored.rows.map(r => [...r]) : [];

        if (this.dom.titleInput) {
            this.dom.titleInput.value = this.data.title;
        }

        this.renderTable();
        this.updateStats();
        this.updateUndoRedoButtons();
        this.sheetManager.updateActiveSheet(this.data.title, this.data.headers, this.data.rows);
        const payload = this.sheetManager.getStatePayload();
        this.storage.scheduleSave(payload, (status, ts) => this.setSaveStatus(status, ts));

        if (diff) {
            this.navigateToDiff(diff);
        }
    }

    findTableDiff(prev, next) {
        if (!prev || !next) return null;

        // 1. Check title difference
        if ((prev.title || '') !== (next.title || '')) {
            return { type: 'title' };
        }

        // 2. Check header changes
        const prevHeaders = prev.headers || [];
        const nextHeaders = next.headers || [];
        const maxHeaders = Math.max(prevHeaders.length, nextHeaders.length);
        for (let c = 0; c < maxHeaders; c++) {
            if (prevHeaders[c] !== nextHeaders[c]) {
                return { type: 'header', col: Math.min(c, nextHeaders.length - 1) };
            }
        }

        // 3. Check cells in rows
        const prevRows = prev.rows || [];
        const nextRows = next.rows || [];
        for (let r = 0; r < nextRows.length; r++) {
            const nextRow = nextRows[r] || [];
            const prevRow = prevRows[r] || [];
            for (let c = 0; c < nextHeaders.length; c++) {
                if ((prevRow[c] || '') !== (nextRow[c] || '')) {
                    return { type: 'cell', row: r, col: c };
                }
            }
        }

        // 4. Check row addition or deletion
        if (prevRows.length !== nextRows.length) {
            const r = Math.min(prevRows.length, nextRows.length);
            return { type: 'row', row: Math.max(0, Math.min(r, nextRows.length - 1)), col: 0 };
        }

        // 5. Check column addition or deletion
        if (prevHeaders.length !== nextHeaders.length) {
            const c = Math.min(prevHeaders.length, nextHeaders.length);
            return { type: 'column', col: Math.max(0, Math.min(c, nextHeaders.length - 1)) };
        }

        return null;
    }

    navigateToDiff(diff) {
        if (!diff) return;

        if (diff.type === 'title') {
            if (this.dom.titleInput) {
                this.dom.titleInput.focus();
                this.dom.titleInput.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
            return;
        }

        if (diff.type === 'header' || diff.type === 'column') {
            const col = diff.col !== undefined ? diff.col : 0;
            const headerEditor = this.dom.tableHead?.querySelector(`.table-header-editor[data-col="${col}"]`);
            if (headerEditor) {
                headerEditor.focus();
                headerEditor.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
            }
            return;
        }

        if (diff.type === 'cell' || diff.type === 'row') {
            const row = diff.row !== undefined ? diff.row : 0;
            const col = diff.col !== undefined ? diff.col : 0;
            this.focusCell(row, col);
            const td = this.dom.tableBody?.querySelector(`td[data-row="${row}"][data-col="${col}"]`);
            if (td) {
                td.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
            }
        }
    }

    updateUndoRedoButtons() {
        if (this.dom.btnUndo) {
            const canUndo = this.historyManager.canUndo();
            this.dom.btnUndo.disabled = !canUndo;
            this.dom.btnUndo.classList.toggle('opacity-40', !canUndo);
            this.dom.btnUndo.classList.toggle('cursor-not-allowed', !canUndo);
        }
        if (this.dom.btnRedo) {
            const canRedo = this.historyManager.canRedo();
            this.dom.btnRedo.disabled = !canRedo;
            this.dom.btnRedo.classList.toggle('opacity-40', !canRedo);
            this.dom.btnRedo.classList.toggle('cursor-not-allowed', !canRedo);
        }
    }

    updateStats() {
        TableGridRenderer.updateStats(this.dom, this.data);
    }

    handleDataChange({ immediate = false } = {}) {
        this.updateStats();
        if (immediate) {
            this.historyManager.recordImmediate(this.data);
        } else {
            this.historyManager.recordTyping(this.data);
        }
        this.updateUndoRedoButtons();
        this.sheetManager.updateActiveSheet(this.data.title, this.data.headers, this.data.rows);
        const payload = this.sheetManager.getStatePayload();
        this.storage.scheduleSave(payload, (status, ts) => this.setSaveStatus(status, ts));
    }

    saveToStorage() {
        this.sheetManager.updateActiveSheet(this.data.title, this.data.headers, this.data.rows);
        const payload = this.sheetManager.getStatePayload();
        this.storage.save(payload, (status, ts) => this.setSaveStatus(status, ts));
    }

    loadFromStorage() {
        const loaded = this.storage.load();
        this.sheetManager.loadState(loaded);
        const active = this.sheetManager.getActiveSheet();
        this.data = {
            title: active.title || '',
            headers: active.headers && active.headers.length > 0 ? active.headers : ['Column 1', 'Column 2', 'Column 3'],
            rows: active.rows && active.rows.length > 0 ? active.rows : [['', '', ''], ['', '', ''], ['', '', '']],
            updatedAt: (loaded && loaded.updatedAt) || active.updatedAt || Date.now()
        };
        if (this.dom.titleInput) {
            this.dom.titleInput.value = this.data.title;
        }
        this.historyManager.setSheet(active.id, this.data);
        this.updateUndoRedoButtons();
        if (loaded) {
            this.setSaveStatus('saved', this.storage.lastSavedTimestamp);
        } else {
            this.setSaveStatus('ready');
        }
    }

    syncFromCloud(cloudData) {
        const isEditing = this.dom.section && this.dom.section.contains(document.activeElement);
        const currentPayload = this.sheetManager.getStatePayload();
        const merged = this.storage.mergeCloudData(currentPayload, cloudData, isEditing);
        if (merged) {
            this.sheetManager.loadState(merged);
            const active = this.sheetManager.getActiveSheet();
            this.data = {
                title: active.title || '',
                headers: active.headers && active.headers.length > 0 ? active.headers : ['Column 1', 'Column 2', 'Column 3'],
                rows: active.rows && active.rows.length > 0 ? active.rows : [['', '', ''], ['', '', ''], ['', '', '']],
                updatedAt: merged.updatedAt
            };
            if (this.dom.titleInput) {
                this.dom.titleInput.value = this.data.title;
            }
            this.historyManager.setSheet(active.id, this.data);
            this.renderTable();
            this.updateUndoRedoButtons();
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
