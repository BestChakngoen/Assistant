/**
 * TableHistoryManager.js - Lightweight Undo/Redo History Stack for Freeform Data Table.
 * Manages table snapshots (title, headers, rows) per sheet with memory-safe bounding.
 * Adheres strictly to SOLID and Single Responsibility Principle (SRP).
 */
export class TableHistoryManager {
    /**
     * @param {number} maxHistory Maximum number of undo states to keep per sheet.
     */
    constructor(maxHistory = 50) {
        this.maxHistory = maxHistory;
        this.sheetHistories = new Map(); // sheetId -> { undoStack: [], redoStack: [], lastSnapshotJson: string }
        this.currentSheetId = 'default';
        this.typingDebounceTimer = null;
        this.pendingData = null;
    }

    /**
     * Sets the active sheet and initializes its history stack if it doesn't exist.
     * Automatically flushes any uncommitted debounced edits on the outgoing sheet.
     * @param {string} sheetId 
     * @param {Object} currentData { title, headers, rows }
     */
    setSheet(sheetId, currentData) {
        this.flushPendingTyping();
        this.currentSheetId = sheetId || 'default';
        if (!this.sheetHistories.has(this.currentSheetId)) {
            this.reset(this.currentSheetId, currentData);
        }
    }

    /**
     * Resets or initializes a sheet's history with clean initial state.
     * @param {string} sheetId 
     * @param {Object} initialData 
     */
    reset(sheetId, initialData) {
        clearTimeout(this.typingDebounceTimer);
        this.pendingData = null;
        const snapshot = this._cloneData(initialData);
        this.sheetHistories.set(sheetId, {
            undoStack: [snapshot],
            redoStack: [],
            lastSnapshotJson: JSON.stringify(snapshot)
        });
    }

    /**
     * Removes history for a deleted sheet.
     * @param {string} sheetId 
     */
    deleteSheet(sheetId) {
        if (sheetId) {
            this.sheetHistories.delete(sheetId);
        }
    }

    /**
     * Immediately flushes any uncommitted debounced typing into the active sheet's stack.
     */
    flushPendingTyping() {
        if (this.pendingData) {
            const data = this.pendingData;
            this.pendingData = null;
            clearTimeout(this.typingDebounceTimer);
            this.recordImmediate(data);
        }
    }

    /**
     * Immediately records a state into the undo stack (for row/col add, del, clear, paste).
     * @param {Object} data 
     */
    recordImmediate(data) {
        clearTimeout(this.typingDebounceTimer);
        this.pendingData = null;
        const history = this._getOrCreateHistory();
        const json = JSON.stringify(this._cloneData(data));

        if (history.lastSnapshotJson === json) {
            return;
        }

        history.undoStack.push(JSON.parse(json));
        if (history.undoStack.length > this.maxHistory) {
            history.undoStack.shift();
        }

        history.lastSnapshotJson = json;
        history.redoStack = [];
    }

    /**
     * Debounced recording during rapid typing so keystrokes don't flood history.
     * @param {Object} data 
     */
    recordTyping(data) {
        const json = JSON.stringify(this._cloneData(data));
        const history = this._getOrCreateHistory();
        if (history.lastSnapshotJson === json) return;

        this.pendingData = data;
        clearTimeout(this.typingDebounceTimer);
        this.typingDebounceTimer = setTimeout(() => {
            this.flushPendingTyping();
        }, 350);
    }

    /**
     * Undoes the last change for the active sheet.
     * @param {Object} currentData 
     * @returns {Object|null} The snapshot to restore, or null if cannot undo.
     */
    undo(currentData) {
        clearTimeout(this.typingDebounceTimer);
        const history = this._getOrCreateHistory();

        if (history.undoStack.length <= 1) {
            return null;
        }

        // Push current state to redoStack
        const currentSnapshot = this._cloneData(currentData);
        history.redoStack.push(currentSnapshot);

        // Pop current top of undoStack
        history.undoStack.pop();

        // Target snapshot to restore
        const previous = history.undoStack[history.undoStack.length - 1];
        history.lastSnapshotJson = JSON.stringify(previous);

        return this._cloneData(previous);
    }

    /**
     * Redoes the last undone change for the active sheet.
     * @param {Object} currentData 
     * @returns {Object|null} The snapshot to restore, or null if cannot redo.
     */
    redo(currentData) {
        clearTimeout(this.typingDebounceTimer);
        const history = this._getOrCreateHistory();

        if (history.redoStack.length === 0) {
            return null;
        }

        const next = history.redoStack.pop();
        history.undoStack.push(next);
        history.lastSnapshotJson = JSON.stringify(next);

        return this._cloneData(next);
    }

    /**
     * @returns {boolean} Whether an undo operation is available.
     */
    canUndo() {
        const history = this.sheetHistories.get(this.currentSheetId);
        return history ? history.undoStack.length > 1 : false;
    }

    /**
     * @returns {boolean} Whether a redo operation is available.
     */
    canRedo() {
        const history = this.sheetHistories.get(this.currentSheetId);
        return history ? history.redoStack.length > 0 : false;
    }

    /**
     * Retrieves or lazily creates history state for currentSheetId.
     * @private
     */
    _getOrCreateHistory() {
        if (!this.sheetHistories.has(this.currentSheetId)) {
            this.sheetHistories.set(this.currentSheetId, {
                undoStack: [],
                redoStack: [],
                lastSnapshotJson: ''
            });
        }
        return this.sheetHistories.get(this.currentSheetId);
    }

    /**
     * Deep clones table data to isolate reference mutations.
     * @param {Object} data 
     * @private
     */
    _cloneData(data) {
        if (!data) return { title: '', headers: [], rows: [] };
        return {
            title: data.title || '',
            headers: Array.isArray(data.headers) ? [...data.headers] : [],
            rows: Array.isArray(data.rows) ? data.rows.map(r => Array.isArray(r) ? [...r] : []) : []
        };
    }
}
