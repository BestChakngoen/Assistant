/**
 * NoteHistoryManager.js - Lightweight Undo/Redo History Stack for Quick Note & Scratchpad.
 * Manages text snapshots and cursor positions with memory-safe bounding.
 * Adheres strictly to SOLID and Single Responsibility Principle (SRP).
 */
export class NoteHistoryManager {
    /**
     * @param {number} maxHistory Maximum number of undo states to keep per sheet.
     */
    constructor(maxHistory = 50) {
        this.maxHistory = maxHistory;
        this.sheetHistories = new Map(); // sheetId -> { undoStack: [], redoStack: [], lastRecordedValue: string, lastRecordedTitle: string }
        this.currentSheetId = 'default';
        this.recordDebounceTimer = null;
        this.pendingTyping = null;
    }

    /**
     * Sets the active sheet and initializes its history stack if it doesn't exist.
     * Automatically flushes any pending typing on the outgoing sheet.
     * @param {string} sheetId 
     * @param {string} initialValue 
     * @param {number} start 
     * @param {number} end 
     * @param {string} title 
     */
    setSheet(sheetId, initialValue = '', start = 0, end = 0, title = '') {
        this.flushPendingTyping();
        this.currentSheetId = sheetId || 'default';
        if (!this.sheetHistories.has(this.currentSheetId)) {
            this.reset(this.currentSheetId, initialValue, start, end, title);
        }
    }

    /**
     * Resets or initializes a sheet's history with clean initial state.
     * @param {string} sheetId 
     * @param {string} initialValue 
     * @param {number} start 
     * @param {number} end 
     * @param {string} title 
     */
    reset(sheetId, initialValue = '', start = 0, end = 0, title = '') {
        clearTimeout(this.recordDebounceTimer);
        this.pendingTyping = null;
        const targetSheetId = sheetId || this.currentSheetId || 'default';
        this.sheetHistories.set(targetSheetId, {
            undoStack: [{
                value: initialValue,
                selectionStart: start,
                selectionEnd: end,
                title
            }],
            redoStack: [],
            lastRecordedValue: initialValue,
            lastRecordedTitle: title
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
        if (this.pendingTyping) {
            const { value, start, end, title } = this.pendingTyping;
            this.pendingTyping = null;
            clearTimeout(this.recordDebounceTimer);
            this.recordImmediate(value, start, end, title);
        }
    }

    /**
     * Immediately records a state into the active sheet's undo stack.
     * @param {string} value 
     * @param {number} start 
     * @param {number} end 
     * @param {string} title 
     */
    recordImmediate(value, start, end, title = '') {
        clearTimeout(this.recordDebounceTimer);
        this.pendingTyping = null;
        const history = this._getOrCreateHistory();

        if (history.lastRecordedValue === value && history.lastRecordedTitle === title) {
            return;
        }

        history.undoStack.push({
            value,
            selectionStart: start,
            selectionEnd: end,
            title
        });

        if (history.undoStack.length > this.maxHistory) {
            history.undoStack.shift();
        }

        history.lastRecordedValue = value;
        history.lastRecordedTitle = title;
        history.redoStack = [];
    }

    /**
     * Debounced recording during rapid typing.
     * @param {string} value 
     * @param {number} start 
     * @param {number} end 
     * @param {string} title 
     */
    recordTyping(value, start, end, title = '') {
        const history = this._getOrCreateHistory();
        if (history.lastRecordedValue === value && history.lastRecordedTitle === title) return;

        this.pendingTyping = { value, start, end, title };
        clearTimeout(this.recordDebounceTimer);
        this.recordDebounceTimer = setTimeout(() => {
            this.flushPendingTyping();
        }, 350);
    }

    /**
     * Undoes the last change for the active sheet.
     * @param {string} currentValue 
     * @param {number} currentStart 
     * @param {number} currentEnd 
     * @param {string} currentTitle 
     * @returns {Object|null} The snapshot to restore, or null if cannot undo.
     */
    undo(currentValue, currentStart, currentEnd, currentTitle = '') {
        this.flushPendingTyping();
        const history = this._getOrCreateHistory();

        if (history.undoStack.length <= 1) {
            return null;
        }

        // Pop current top of undoStack and push to redoStack
        const currentSnapshot = {
            value: currentValue,
            selectionStart: currentStart,
            selectionEnd: currentEnd,
            title: currentTitle
        };
        history.redoStack.push(currentSnapshot);

        history.undoStack.pop();
        const previous = history.undoStack[history.undoStack.length - 1];
        history.lastRecordedValue = previous.value;
        history.lastRecordedTitle = previous.title;

        return previous;
    }

    /**
     * Redoes the last undone change for the active sheet.
     * @param {string} currentValue 
     * @param {number} currentStart 
     * @param {number} currentEnd 
     * @param {string} currentTitle 
     * @returns {Object|null} The snapshot to restore, or null if cannot redo.
     */
    redo(currentValue, currentStart, currentEnd, currentTitle = '') {
        this.flushPendingTyping();
        const history = this._getOrCreateHistory();

        if (history.redoStack.length === 0) {
            return null;
        }

        const next = history.redoStack.pop();
        history.undoStack.push(next);
        history.lastRecordedValue = next.value;
        history.lastRecordedTitle = next.title;

        return next;
    }

    canUndo() {
        const history = this.sheetHistories.get(this.currentSheetId);
        return history ? history.undoStack.length > 1 : false;
    }

    canRedo() {
        const history = this.sheetHistories.get(this.currentSheetId);
        return history ? history.redoStack.length > 0 : false;
    }

    /**
     * Retrieves or creates sheet history for current active sheet.
     * @private
     */
    _getOrCreateHistory() {
        if (!this.sheetHistories.has(this.currentSheetId)) {
            this.sheetHistories.set(this.currentSheetId, {
                undoStack: [],
                redoStack: [],
                lastRecordedValue: null,
                lastRecordedTitle: null
            });
        }
        return this.sheetHistories.get(this.currentSheetId);
    }
}
