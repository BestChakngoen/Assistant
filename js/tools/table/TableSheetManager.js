import { ShareUI } from '../../ui/share/ShareUI.js';

/**
 * TableSheetManager.js - Multi-sheet Manager for Freeform Data Table Tool.
 * Follows OOP, SRP, and Strict No White Borders.
 * Maintains 100% backward compatibility with single-table storage & Firestore sync.
 */
export class TableSheetManager {
    constructor() {
        this.sheets = [];
        this.activeSheetId = null;
        this.dom = {
            tabsContainer: null,
            btnAddSheet: null
        };
        this.callbacks = {
            onSwitch: null,
            onDataChange: null,
            onDelete: null
        };
    }

    /**
     * Initializes DOM references and events.
     */
    init({ tabsContainer, btnAddSheet, onSwitch, onDataChange, onDelete }) {
        this.dom.tabsContainer = tabsContainer;
        this.dom.btnAddSheet = btnAddSheet;
        this.callbacks.onSwitch = onSwitch;
        this.callbacks.onDataChange = onDataChange;
        this.callbacks.onDelete = onDelete;

        if (this.dom.btnAddSheet) {
            this.dom.btnAddSheet.addEventListener('click', () => {
                this.addSheet();
            });
        }
    }

    /**
     * Creates a blank default table sheet.
     * @param {string} id 
     * @param {string} title 
     * @returns {Object}
     */
    createDefaultSheet(id = `sheet_${Date.now()}`, title = '') {
        return {
            id,
            title,
            headers: ['Column 1', 'Column 2', 'Column 3'],
            rows: [
                ['', '', ''],
                ['', '', ''],
                ['', '', '']
            ],
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
    }

    /**
     * Loads state from storage/cloud with legacy single-table migration support.
     * @param {Object} data 
     */
    loadState(data) {
        let sheetsList = (data && Array.isArray(data.sheets)) ? data.sheets : null;
        if (!sheetsList && data && typeof data.sheetsJson === 'string') {
            try {
                sheetsList = JSON.parse(data.sheetsJson);
            } catch (e) {
                sheetsList = null;
            }
        }

        if (sheetsList && Array.isArray(sheetsList) && sheetsList.length > 0) {
            this.sheets = sheetsList.map((s, index) => ({
                id: s.id || `table_sheet_${Date.now()}_${index}`,
                title: typeof s.title === 'string' ? s.title : '',
                headers: Array.isArray(s.headers) && s.headers.length > 0 ? s.headers : ['Column 1', 'Column 2', 'Column 3'],
                rows: Array.isArray(s.rows) && s.rows.length > 0 ? s.rows : [['', '', ''], ['', '', ''], ['', '', '']],
                createdAt: s.createdAt || Date.now(),
                updatedAt: s.updatedAt || Date.now()
            }));
            const exists = this.sheets.some(s => s.id === data.activeSheetId);
            this.activeSheetId = exists ? data.activeSheetId : this.sheets[0].id;
        } else if (data && (Array.isArray(data.headers) || Array.isArray(data.rows) || data.title)) {
            // Legacy single table migration
            const initialId = `table_sheet_${Date.now()}`;
            this.sheets = [{
                id: initialId,
                title: data.title || '',
                headers: Array.isArray(data.headers) && data.headers.length > 0 ? data.headers : ['Column 1', 'Column 2', 'Column 3'],
                rows: Array.isArray(data.rows) && data.rows.length > 0 ? data.rows : [['', '', ''], ['', '', ''], ['', '', '']],
                createdAt: data.updatedAt || Date.now(),
                updatedAt: data.updatedAt || Date.now()
            }];
            this.activeSheetId = initialId;
        } else {
            // Fresh state: create 1 default sheet
            const defaultSheet = this.createDefaultSheet();
            this.sheets = [defaultSheet];
            this.activeSheetId = defaultSheet.id;
        }

        this.renderTabs();
    }

    /**
     * Gets the currently active sheet.
     * @returns {Object}
     */
    getActiveSheet() {
        const found = this.sheets.find(s => s.id === this.activeSheetId);
        if (found) return found;
        if (this.sheets.length > 0) {
            this.activeSheetId = this.sheets[0].id;
            return this.sheets[0];
        }
        const fallback = this.createDefaultSheet();
        this.sheets.push(fallback);
        this.activeSheetId = fallback.id;
        return fallback;
    }

    /**
     * Updates active sheet data in-memory.
     * @param {string} title 
     * @param {string[]} headers 
     * @param {string[][]} rows 
     */
    updateActiveSheet(title, headers, rows) {
        const active = this.getActiveSheet();
        if (typeof title === 'string') active.title = title;
        if (Array.isArray(headers)) active.headers = headers;
        if (Array.isArray(rows)) active.rows = rows;
        active.updatedAt = Date.now();

        this.updateActiveTabLabel(active.title);
    }

    /**
     * Updates tab label dynamically while typing.
     * @param {string} title 
     */
    updateActiveTabLabel(title) {
        if (!this.dom.tabsContainer) return;
        const activeTab = this.dom.tabsContainer.querySelector(`[data-table-sheet-id="${this.activeSheetId}"]`);
        if (activeTab) {
            const labelEl = activeTab.querySelector('.table-sheet-title');
            if (labelEl) {
                const sheetIndex = this.sheets.findIndex(s => s.id === this.activeSheetId);
                const displayTitle = (title && title.trim()) ? title.trim() : `Sheet ${sheetIndex + 1}`;
                labelEl.textContent = displayTitle;
                labelEl.title = displayTitle;
            }
        }
    }

    /**
     * Adds a new table sheet.
     * @param {string} title 
     */
    addSheet(title = '') {
        const newId = `table_sheet_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
        const newSheet = this.createDefaultSheet(newId, title);

        this.sheets.push(newSheet);
        this.switchSheet(newId);
        ShareUI.showToast('New Sheet Created', `Added Table Sheet ${this.sheets.length}`, 'success');
    }

    /**
     * Switches to the specified sheet.
     * @param {string} targetId 
     */
    switchSheet(targetId) {
        if (targetId === this.activeSheetId && this.sheets.some(s => s.id === targetId)) {
            return;
        }

        const targetSheet = this.sheets.find(s => s.id === targetId);
        if (!targetSheet) return;

        const previousSheet = this.getActiveSheet();
        this.activeSheetId = targetId;
        this.renderTabs();

        if (typeof this.callbacks.onSwitch === 'function') {
            this.callbacks.onSwitch(targetSheet, previousSheet);
        }

        if (typeof this.callbacks.onDataChange === 'function') {
            this.callbacks.onDataChange();
        }
    }

    /**
     * Deletes a sheet with confirmation.
     * @param {string} sheetId 
     */
    async deleteSheet(sheetId) {
        if (this.sheets.length <= 1) {
            ShareUI.showToast('Notice', 'Cannot delete the only remaining table sheet', 'error');
            return;
        }

        const targetIndex = this.sheets.findIndex(s => s.id === sheetId);
        if (targetIndex === -1) return;

        const targetSheet = this.sheets[targetIndex];
        const sheetName = targetSheet.title ? `"${targetSheet.title}"` : `Sheet ${targetIndex + 1}`;

        const confirmed = await ShareUI.showConfirmModal({
            title: 'Delete Table Sheet?',
            message: `Are you sure you want to delete ${sheetName}? All table rows and data on this sheet will be permanently removed.`,
            icon: 'trash-2',
            iconColor: 'text-rose-400',
            confirmLabel: 'Delete Sheet',
            confirmClass: 'bg-rose-600 hover:bg-rose-500 text-white'
        });

        if (!confirmed) return;

        this.sheets.splice(targetIndex, 1);

        if (typeof this.callbacks.onDelete === 'function') {
            this.callbacks.onDelete(sheetId);
        }

        if (this.activeSheetId === sheetId) {
            const nextIndex = Math.min(targetIndex, this.sheets.length - 1);
            this.activeSheetId = this.sheets[nextIndex].id;
            const newActiveSheet = this.sheets[nextIndex];

            if (typeof this.callbacks.onSwitch === 'function') {
                this.callbacks.onSwitch(newActiveSheet, targetSheet);
            }
        }

        this.renderTabs();

        if (typeof this.callbacks.onDataChange === 'function') {
            this.callbacks.onDataChange();
        }

        ShareUI.showToast('Sheet Deleted', `${sheetName} removed`, 'success');
    }

    /**
     * Renders sheet tabs into DOM.
     */
    renderTabs() {
        if (!this.dom.tabsContainer) return;

        this.dom.tabsContainer.innerHTML = '';

        this.sheets.forEach((sheet, index) => {
            const isActive = sheet.id === this.activeSheetId;
            const displayTitle = (sheet.title && sheet.title.trim()) ? sheet.title.trim() : `Sheet ${index + 1}`;

            const tabEl = document.createElement('div');
            tabEl.setAttribute('data-table-sheet-id', sheet.id);

            // Strict No White Borders: Frameless background tints only (Emerald theme for Table)
            tabEl.className = isActive
                ? 'btn-press px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-300 font-semibold text-xs font-mono flex items-center gap-2 group transition-all shrink-0 cursor-pointer select-none shadow-sm'
                : 'btn-press px-3 py-1.5 rounded-xl bg-slate-800/50 hover:bg-slate-800/80 text-slate-400 hover:text-slate-200 text-xs font-mono flex items-center gap-2 group transition-all shrink-0 cursor-pointer select-none';

            tabEl.innerHTML = `
                <i data-lucide="table" class="size-3.5 shrink-0 ${isActive ? 'text-emerald-400' : 'text-slate-500 group-hover:text-slate-400'}"></i>
                <span class="table-sheet-title max-w-[110px] sm:max-w-[150px] truncate" title="${displayTitle}">${displayTitle}</span>
                ${this.sheets.length > 1 ? `
                    <button type="button" data-delete-table-sheet-id="${sheet.id}" title="Delete this sheet" class="table-sheet-delete-btn size-4 p-0.5 rounded hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 flex items-center justify-center transition-colors shrink-0">
                        <i data-lucide="x" class="size-3"></i>
                    </button>
                ` : ''}
            `;

            tabEl.addEventListener('click', (e) => {
                if (e.target.closest('.table-sheet-delete-btn')) {
                    e.stopPropagation();
                    this.deleteSheet(sheet.id);
                    return;
                }
                this.switchSheet(sheet.id);
            });

            this.dom.tabsContainer.appendChild(tabEl);
        });

        if (window.lucide && typeof window.lucide.createIcons === 'function') {
            window.lucide.createIcons();
        }
    }

    /**
     * Serializes sheet state with backward compatibility.
     * @returns {Object}
     */
    getStatePayload() {
        const active = this.getActiveSheet();
        return {
            sheets: this.sheets,
            activeSheetId: this.activeSheetId,
            // Fallback for legacy readers & cloud sync
            title: active.title || '',
            headers: active.headers || ['Column 1', 'Column 2', 'Column 3'],
            rows: active.rows || [['', '', ''], ['', '', ''], ['', '', '']],
            updatedAt: Date.now()
        };
    }
}
