import { ShareUI } from '../../ui/share/ShareUI.js';

/**
 * NoteSheetManager.js - Manages multiple digital sheets (tabs) for Quick Note & Scratchpad.
 * Follows OOP & Single Responsibility Principle (SRP), Strict No White Borders,
 * and maintains 100% backward compatibility with single-note storage.
 */
export class NoteSheetManager {
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
     * Initializes the sheet manager with DOM elements and callbacks.
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
     * Loads sheet data from storage or cloud, migrating legacy single note if needed.
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
                id: s.id || `sheet_${Date.now()}_${index}`,
                title: typeof s.title === 'string' ? s.title : '',
                content: typeof s.content === 'string' ? s.content : '',
                createdAt: s.createdAt || Date.now(),
                updatedAt: s.updatedAt || Date.now()
            }));
            const exists = this.sheets.some(s => s.id === data.activeSheetId);
            this.activeSheetId = exists ? data.activeSheetId : this.sheets[0].id;
        } else if (data && (data.title || data.content)) {
            // Backward-compatible migration from single note to sheets
            const initialId = `sheet_${Date.now()}`;
            this.sheets = [{
                id: initialId,
                title: data.title || '',
                content: data.content || '',
                createdAt: data.updatedAt || Date.now(),
                updatedAt: data.updatedAt || Date.now()
            }];
            this.activeSheetId = initialId;
        } else {
            // Fresh state: create 1 default sheet
            const defaultId = `sheet_${Date.now()}`;
            this.sheets = [{
                id: defaultId,
                title: '',
                content: '',
                createdAt: Date.now(),
                updatedAt: Date.now()
            }];
            this.activeSheetId = defaultId;
        }

        this.renderTabs();
    }

    /**
     * Gets the currently active sheet object.
     * @returns {Object}
     */
    getActiveSheet() {
        const found = this.sheets.find(s => s.id === this.activeSheetId);
        if (found) return found;
        if (this.sheets.length > 0) {
            this.activeSheetId = this.sheets[0].id;
            return this.sheets[0];
        }
        // Fallback safety
        const fallback = {
            id: `sheet_${Date.now()}`,
            title: '',
            content: '',
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        this.sheets.push(fallback);
        this.activeSheetId = fallback.id;
        return fallback;
    }

    /**
     * Updates the content of the active sheet in-memory.
     * @param {string} title 
     * @param {string} content 
     */
    updateActiveSheet(title, content) {
        const active = this.getActiveSheet();
        active.title = title;
        active.content = content;
        active.updatedAt = Date.now();

        // Update the active tab label without re-rendering the whole strip
        this.updateActiveTabLabel(title);
    }

    /**
     * Dynamically updates the active tab's text label.
     * @param {string} title 
     */
    updateActiveTabLabel(title) {
        if (!this.dom.tabsContainer) return;
        const activeTab = this.dom.tabsContainer.querySelector(`[data-sheet-tab-id="${this.activeSheetId}"]`);
        if (activeTab) {
            const labelEl = activeTab.querySelector('.sheet-tab-title');
            if (labelEl) {
                const sheetIndex = this.sheets.findIndex(s => s.id === this.activeSheetId);
                const displayTitle = (title && title.trim()) ? title.trim() : `Sheet ${sheetIndex + 1}`;
                labelEl.textContent = displayTitle;
                labelEl.title = displayTitle;
            }
        }
    }

    /**
     * Adds a new paper sheet and switches to it immediately.
     * @param {string} title 
     * @param {string} content 
     */
    addSheet(title = '', content = '') {
        const newId = `sheet_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
        const newSheet = {
            id: newId,
            title: title || '',
            content: content || '',
            createdAt: Date.now(),
            updatedAt: Date.now()
        };

        this.sheets.push(newSheet);
        this.switchSheet(newId);
        ShareUI.showToast('New Sheet Created', `Added Sheet ${this.sheets.length}`, 'success');
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
     * Prompts confirmation and deletes the specified sheet.
     * @param {string} sheetId 
     */
    async deleteSheet(sheetId) {
        if (this.sheets.length <= 1) {
            ShareUI.showToast('Notice', 'Cannot delete the only remaining sheet', 'error');
            return;
        }

        const targetIndex = this.sheets.findIndex(s => s.id === sheetId);
        if (targetIndex === -1) return;

        const targetSheet = this.sheets[targetIndex];
        const sheetName = targetSheet.title ? `"${targetSheet.title}"` : `Sheet ${targetIndex + 1}`;

        const confirmed = await ShareUI.showConfirmModal({
            title: 'Delete Sheet?',
            message: `Are you sure you want to delete ${sheetName}? All notes on this sheet will be permanently removed.`,
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

        // If active sheet was deleted, switch to the nearest adjacent sheet
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
     * Renders the tab buttons into the container.
     */
    renderTabs() {
        if (!this.dom.tabsContainer) return;

        this.dom.tabsContainer.innerHTML = '';

        this.sheets.forEach((sheet, index) => {
            const isActive = sheet.id === this.activeSheetId;
            const displayTitle = (sheet.title && sheet.title.trim()) ? sheet.title.trim() : `Sheet ${index + 1}`;

            const tabEl = document.createElement('div');
            tabEl.setAttribute('data-sheet-tab-id', sheet.id);

            // Strict No White Borders: Frameless background tints only
            tabEl.className = isActive
                ? 'btn-press px-3 py-1.5 rounded-xl bg-amber-500/15 text-amber-300 font-semibold text-xs font-mono flex items-center gap-2 group transition-all shrink-0 cursor-pointer select-none shadow-sm'
                : 'btn-press px-3 py-1.5 rounded-xl bg-slate-800/50 hover:bg-slate-800/80 text-slate-400 hover:text-slate-200 text-xs font-mono flex items-center gap-2 group transition-all shrink-0 cursor-pointer select-none';

            tabEl.innerHTML = `
                <i data-lucide="file-text" class="size-3.5 shrink-0 ${isActive ? 'text-amber-400' : 'text-slate-500 group-hover:text-slate-400'}"></i>
                <span class="sheet-tab-title max-w-[110px] sm:max-w-[150px] truncate" title="${displayTitle}">${displayTitle}</span>
                ${this.sheets.length > 1 ? `
                    <button type="button" data-delete-sheet-id="${sheet.id}" title="Delete this sheet" class="sheet-delete-btn size-4 p-0.5 rounded hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 flex items-center justify-center transition-colors shrink-0">
                        <i data-lucide="x" class="size-3"></i>
                    </button>
                ` : ''}
            `;

            // Tab click -> Switch sheet
            tabEl.addEventListener('click', (e) => {
                // If clicked on the delete button, handle delete instead of switch
                if (e.target.closest('.sheet-delete-btn')) {
                    e.stopPropagation();
                    this.deleteSheet(sheet.id);
                    return;
                }
                this.switchSheet(sheet.id);
            });

            this.dom.tabsContainer.appendChild(tabEl);
        });

        // Initialize icons inside rendered tabs
        if (window.lucide && typeof window.lucide.createIcons === 'function') {
            window.lucide.createIcons();
        }
    }

    /**
     * Serializes sheet state into storage payload with backward compatibility.
     * @returns {Object}
     */
    getStatePayload() {
        const active = this.getActiveSheet();
        return {
            sheets: this.sheets,
            activeSheetId: this.activeSheetId,
            // Fallback for legacy single-note readers & cloud sync
            title: active.title || '',
            content: active.content || '',
            updatedAt: Date.now()
        };
    }
}
