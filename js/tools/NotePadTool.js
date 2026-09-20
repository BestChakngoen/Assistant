import { ShareUI } from '../ui/share/ShareUI.js';
import { NoteSmartDetector } from './notepad/NoteSmartDetector.js';
import { NoteSheetManager } from './notepad/NoteSheetManager.js';
import { NoteFormatter } from './notepad/NoteFormatter.js';
import { NoteHistoryManager } from './notepad/NoteHistoryManager.js';

/**
 * NotePadTool - Instant Digital Scratchpad Tool with Realtime Auto-Save & Smart Detection
 * Provides a clean, stable digital sheet for writing, with automatic media & link detection.
 * Supports multiple sheets/tabs, rich formatting tools, and robust multi-language undo/redo.
 * Adheres strictly to SOLID, Single Responsibility Principle (SRP), and Zero Regression.
 */
export class NotePadTool {
    constructor() {
        this.storageKey = 'assistant_quick_note_scratchpad';
        this.saveTimer = null;
        this.onSave = null;
        this.lastSavedTimestamp = 0;
        this.detector = new NoteSmartDetector();
        this.sheetManager = new NoteSheetManager();
        this.historyManager = new NoteHistoryManager();
        this.dom = {
            titleInput: null,
            contentInput: null,
            saveBadge: null,
            wordsCount: null,
            charsCount: null,
            linesCount: null,
            lastUpdated: null,
            btnClear: null,
            btnCopy: null,
            btnExportTxt: null,
            btnExportMd: null,
            sheetsTabs: null,
            btnAddSheet: null,
            btnFormatBold: null,
            btnFormatDivider: null,
            btnUndo: null,
            btnRedo: null
        };
    }

    init() {
        this.dom.titleInput = document.getElementById('note-title-input');
        this.dom.contentInput = document.getElementById('note-content-input');
        this.dom.saveBadge = document.getElementById('note-save-badge');
        this.dom.wordsCount = document.getElementById('note-words-count');
        this.dom.charsCount = document.getElementById('note-chars-count');
        this.dom.linesCount = document.getElementById('note-lines-count');
        this.dom.lastUpdated = document.getElementById('note-last-updated');
        this.dom.btnClear = document.getElementById('btn-note-clear');
        this.dom.btnCopy = document.getElementById('btn-note-copy');
        this.dom.btnExportTxt = document.getElementById('btn-note-export-txt');
        this.dom.btnExportMd = document.getElementById('btn-note-export-md');
        this.dom.sheetsTabs = document.getElementById('note-sheets-tabs');
        this.dom.btnAddSheet = document.getElementById('btn-note-add-sheet');
        this.dom.btnFormatBold = document.getElementById('btn-note-format-bold');
        this.dom.btnFormatDivider = document.getElementById('btn-note-format-divider');
        this.dom.btnUndo = document.getElementById('btn-note-undo');
        this.dom.btnRedo = document.getElementById('btn-note-redo');

        if (!this.dom.contentInput) return;

        this.sheetManager.init({
            tabsContainer: this.dom.sheetsTabs,
            btnAddSheet: this.dom.btnAddSheet,
            onSwitch: (targetSheet, previousSheet) => {
                if (previousSheet && this.dom.contentInput) {
                    this.historyManager.flushPendingTyping();
                    previousSheet.title = (this.dom.titleInput?.value || '').trim();
                    previousSheet.content = this.dom.contentInput?.value || '';
                    previousSheet.updatedAt = Date.now();
                }
                if (this.dom.titleInput) {
                    this.dom.titleInput.value = targetSheet.title || '';
                }
                if (this.dom.contentInput) {
                    this.dom.contentInput.value = targetSheet.content || '';
                }
                this.historyManager.setSheet(targetSheet.id, targetSheet.content || '', 0, 0, targetSheet.title || '');
                this.updateStats();
                this.detector.scan();
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

        this.detector.init();
        this.loadFromStorage();
        this.bindEvents();
        this.updateUndoRedoButtons();

        if (window.lucide && typeof window.lucide.createIcons === 'function') {
            window.lucide.createIcons();
        }
    }

    bindEvents() {
        // Auto-save & stats update on input
        this.dom.contentInput.addEventListener('input', () => {
            this.handleInput();
        });

        if (this.dom.titleInput) {
            this.dom.titleInput.addEventListener('input', () => {
                this.handleInput();
            });
        }

        // Action: Clear
        if (this.dom.btnClear) {
            this.dom.btnClear.addEventListener('click', () => this.clear());
        }

        // Action: Copy All
        if (this.dom.btnCopy) {
            this.dom.btnCopy.addEventListener('click', () => this.copyAll());
        }

        // Action: Export as .txt
        if (this.dom.btnExportTxt) {
            this.dom.btnExportTxt.addEventListener('click', () => this.exportFile('txt'));
        }

        // Action: Export as .md
        if (this.dom.btnExportMd) {
            this.dom.btnExportMd.addEventListener('click', () => this.exportFile('md'));
        }

        // Undo Action
        if (this.dom.btnUndo) {
            this.dom.btnUndo.addEventListener('click', () => this.undo());
        }

        // Redo Action
        if (this.dom.btnRedo) {
            this.dom.btnRedo.addEventListener('click', () => this.redo());
        }

        // Formatting Tool: Bold
        if (this.dom.btnFormatBold) {
            this.dom.btnFormatBold.addEventListener('click', () => this.applyFormatBold());
        }

        // Formatting Tool: Divider Line
        if (this.dom.btnFormatDivider) {
            this.dom.btnFormatDivider.addEventListener('click', () => this.applyFormatDivider());
        }

        // Keyboard Shortcuts (Universal layout support for English & Thai)
        if (this.dom.contentInput) {
            this.dom.contentInput.addEventListener('keydown', (e) => {
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

                // Bold: Ctrl+B
                // Physical KeyB, or key 'b', or Thai 'ิ'
                if ((code === 'KeyB' || key === 'b' || key === 'ิ') && !e.shiftKey && !e.altKey) {
                    e.preventDefault();
                    this.applyFormatBold();
                    return;
                }

                // Divider Line: Ctrl+Shift+H
                // Physical KeyH, or key 'h', or Thai '้'
                if ((code === 'KeyH' || key === 'h' || key === '้') && e.shiftKey && !e.altKey) {
                    e.preventDefault();
                    this.applyFormatDivider();
                    return;
                }
            });
        }
    }

    undo() {
        if (!this.dom.contentInput) return;
        const currentTitle = (this.dom.titleInput?.value || '').trim();
        const snapshot = this.historyManager.undo(
            this.dom.contentInput.value,
            this.dom.contentInput.selectionStart,
            this.dom.contentInput.selectionEnd,
            currentTitle
        );
        if (snapshot) {
            this.applyNoteSnapshot(snapshot, currentTitle);
        }
    }

    redo() {
        if (!this.dom.contentInput) return;
        const currentTitle = (this.dom.titleInput?.value || '').trim();
        const snapshot = this.historyManager.redo(
            this.dom.contentInput.value,
            this.dom.contentInput.selectionStart,
            this.dom.contentInput.selectionEnd,
            currentTitle
        );
        if (snapshot) {
            this.applyNoteSnapshot(snapshot, currentTitle);
        }
    }

    applyNoteSnapshot(snapshot, currentTitle) {
        const titleChanged = snapshot.title !== undefined && snapshot.title !== currentTitle;
        const contentChanged = snapshot.value !== this.dom.contentInput.value;

        if (titleChanged && this.dom.titleInput) {
            this.dom.titleInput.value = snapshot.title;
        }

        this.dom.contentInput.value = snapshot.value;
        const cursorStart = snapshot.selectionStart ?? snapshot.value.length;
        const cursorEnd = snapshot.selectionEnd ?? snapshot.value.length;
        this.dom.contentInput.selectionStart = cursorStart;
        this.dom.contentInput.selectionEnd = cursorEnd;

        this.handleInput(false);
        this.detector.scan();
        this.updateUndoRedoButtons();

        // Move to and view changed data without temporary highlight effects
        if (titleChanged && !contentChanged && this.dom.titleInput) {
            this.dom.titleInput.focus();
            this.dom.titleInput.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else {
            this.dom.contentInput.focus();
            this.scrollToCursorPosition(this.dom.contentInput, cursorStart);
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

    scrollToCursorPosition(textarea, cursorIndex) {
        if (!textarea) return;
        const textBefore = textarea.value.substring(0, cursorIndex);
        const lineIndex = (textBefore.match(/\n/g) || []).length;
        const computedLineHeight = parseFloat(window.getComputedStyle(textarea).lineHeight) || 20;

        // Position inside textarea with contextual headroom
        const targetScrollTop = Math.max(0, (lineIndex - 2) * computedLineHeight);
        textarea.scrollTop = targetScrollTop;

        // Ensure textarea element is visible within viewport
        textarea.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    applyFormatBold() {
        if (!this.dom.contentInput) return;
        const title = (this.dom.titleInput?.value || '').trim();
        this.historyManager.recordImmediate(
            this.dom.contentInput.value,
            this.dom.contentInput.selectionStart,
            this.dom.contentInput.selectionEnd,
            title
        );
        const changed = NoteFormatter.applyBold(this.dom.contentInput);
        if (changed) {
            this.historyManager.recordImmediate(
                this.dom.contentInput.value,
                this.dom.contentInput.selectionStart,
                this.dom.contentInput.selectionEnd,
                title
            );
            this.handleInput(false);
            this.detector.scan();
            this.updateUndoRedoButtons();
        }
    }

    applyFormatDivider() {
        if (!this.dom.contentInput) return;
        const title = (this.dom.titleInput?.value || '').trim();
        this.historyManager.recordImmediate(
            this.dom.contentInput.value,
            this.dom.contentInput.selectionStart,
            this.dom.contentInput.selectionEnd,
            title
        );
        const changed = NoteFormatter.insertDivider(this.dom.contentInput);
        if (changed) {
            this.historyManager.recordImmediate(
                this.dom.contentInput.value,
                this.dom.contentInput.selectionStart,
                this.dom.contentInput.selectionEnd,
                title
            );
            this.handleInput(false);
            this.detector.scan();
            this.updateUndoRedoButtons();
        }
    }

    handleInput(recordHistory = true) {
        const title = (this.dom.titleInput?.value || '').trim();
        const content = this.dom.contentInput?.value || '';
        this.sheetManager.updateActiveSheet(title, content);

        if (recordHistory && this.dom.contentInput) {
            this.historyManager.recordTyping(
                content,
                this.dom.contentInput.selectionStart,
                this.dom.contentInput.selectionEnd,
                title
            );
        }

        this.updateUndoRedoButtons();
        this.updateStats();
        this.setSaveStatus('saving');

        clearTimeout(this.saveTimer);
        this.saveTimer = setTimeout(() => {
            this.saveToStorage();
        }, 400);
    }

    updateStats() {
        const text = this.dom.contentInput?.value || '';
        const trimmed = text.trim();

        // Characters
        const chars = text.length;
        if (this.dom.charsCount) {
            this.dom.charsCount.textContent = `${chars.toLocaleString()} characters`;
        }

        // Words
        const words = trimmed.length > 0 ? trimmed.split(/\s+/).length : 0;
        if (this.dom.wordsCount) {
            this.dom.wordsCount.textContent = `${words.toLocaleString()} words`;
        }

        // Lines
        const lines = text.length > 0 ? text.split('\n').length : 0;
        if (this.dom.linesCount) {
            this.dom.linesCount.textContent = `${lines.toLocaleString()} lines`;
        }
    }

    getLocalData() {
        try {
            const raw = localStorage.getItem(this.storageKey);
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    }

    saveToStorage() {
        try {
            const active = this.sheetManager.getActiveSheet();
            active.title = (this.dom.titleInput?.value || '').trim();
            active.content = this.dom.contentInput?.value || '';
            active.updatedAt = Date.now();

            const data = this.sheetManager.getStatePayload();
            this.lastSavedTimestamp = data.updatedAt;
            localStorage.setItem(this.storageKey, JSON.stringify(data));
            this.setSaveStatus('saved', data.updatedAt);

            if (typeof this.onSave === 'function') {
                this.onSave(data);
            }
        } catch (e) {
            console.error('Failed to save note to localStorage:', e);
            this.setSaveStatus('error');
        }
    }

    loadFromStorage() {
        try {
            const data = this.getLocalData();
            this.sheetManager.loadState(data);
            const active = this.sheetManager.getActiveSheet();
            if (this.dom.titleInput) {
                this.dom.titleInput.value = active.title || '';
            }
            if (this.dom.contentInput) {
                this.dom.contentInput.value = active.content || '';
            }
            this.lastSavedTimestamp = (data && data.updatedAt) ? data.updatedAt : 0;
            this.historyManager.setSheet(active.id, active.content || '', 0, 0, active.title || '');
            this.updateStats();
            this.detector.scan();
            this.updateUndoRedoButtons();
            this.setSaveStatus('saved', this.lastSavedTimestamp);
            return;
        } catch (e) {
            console.error('Failed to load note from localStorage:', e);
        }

        this.updateStats();
        this.detector.scan();
        this.updateUndoRedoButtons();
        this.setSaveStatus('ready');
    }

    syncFromCloud(cloudData) {
        if (!cloudData) {
            const local = this.getLocalData();
            if (local && (local.title || local.content || (local.sheets && local.sheets.length > 0)) && typeof this.onSave === 'function') {
                this.onSave(local);
            }
            return;
        }

        const local = this.getLocalData();
        const cloudTime = typeof cloudData.updatedAt === 'number'
            ? cloudData.updatedAt
            : (cloudData.updatedAt ? new Date(cloudData.updatedAt).getTime() : 0);
        const localTime = (local && typeof local.updatedAt === 'number')
            ? local.updatedAt
            : (this.lastSavedTimestamp || 0);

        const isEditing = document.activeElement === this.dom.contentInput || document.activeElement === this.dom.titleInput;

        // If user is actively typing right now and local changes are at least as new as cloud, don't interrupt typing
        if (isEditing && localTime >= cloudTime) {
            return;
        }

        const localHasContent = local && (
            (Array.isArray(local.sheets) && local.sheets.some(s => (s.title && s.title.trim()) || (s.content && s.content.trim()))) ||
            (local.title && local.title.trim()) ||
            (local.content && local.content.trim())
        );

        const cloudHasContent = cloudData && (
            (Array.isArray(cloudData.sheets) && cloudData.sheets.some(s => (s.title && s.title.trim()) || (s.content && s.content.trim()))) ||
            (cloudData.title && cloudData.title.trim()) ||
            (cloudData.content && cloudData.content.trim())
        );

        // If cloud is newer OR local has no actual notes yet while cloud does
        if (cloudTime > localTime || (!localHasContent && cloudHasContent)) {
            this.sheetManager.loadState(cloudData);
            const active = this.sheetManager.getActiveSheet();
            if (this.dom.titleInput) {
                this.dom.titleInput.value = active.title || '';
            }
            if (this.dom.contentInput) {
                this.dom.contentInput.value = active.content || '';
            }
            this.historyManager.setSheet(active.id, active.content || '', 0, 0, active.title || '');
            this.lastSavedTimestamp = cloudTime;
            try {
                const payload = this.sheetManager.getStatePayload();
                payload.updatedAt = cloudTime;
                localStorage.setItem(this.storageKey, JSON.stringify(payload));
            } catch (e) {
                console.error('Failed to cache cloud note to localStorage:', e);
            }
            this.updateStats();
            this.detector.scan();
            this.updateUndoRedoButtons();
            this.setSaveStatus('saved', cloudTime);
        } else if (localTime > cloudTime && typeof this.onSave === 'function') {
            if (local) {
                this.onSave(local);
            }
        }
    }

    setSaveStatus(state, timestamp = null) {
        if (!this.dom.saveBadge) return;

        if (state === 'saving') {
            this.dom.saveBadge.className = 'flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-400';
            this.dom.saveBadge.innerHTML = `
                <span class="size-1.5 rounded-full bg-amber-400 animate-ping"></span>
                <span>Saving...</span>
            `;
        } else if (state === 'saved') {
            this.dom.saveBadge.className = 'flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400';
            this.dom.saveBadge.innerHTML = `
                <span class="size-1.5 rounded-full bg-emerald-400"></span>
                <span>Synced</span>
            `;

            if (this.dom.lastUpdated && timestamp) {
                const timeStr = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                this.dom.lastUpdated.textContent = `Synced at ${timeStr}`;
            }
        } else if (state === 'error') {
            this.dom.saveBadge.className = 'flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/15 text-rose-400';
            this.dom.saveBadge.innerHTML = `
                <span class="size-1.5 rounded-full bg-rose-400"></span>
                <span>Sync Error</span>
            `;
        } else {
            this.dom.saveBadge.className = 'flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800/60 text-slate-400';
            this.dom.saveBadge.innerHTML = `
                <span class="size-1.5 rounded-full bg-slate-500"></span>
                <span>Ready</span>
            `;
        }
    }

    copyAll() {
        const title = (this.dom.titleInput?.value || '').trim();
        const content = this.dom.contentInput?.value || '';

        if (!title && !content) {
            ShareUI.showToast('Notice', 'Notepad is empty', 'error');
            return;
        }

        const fullText = title ? `# ${title}\n\n${content}` : content;

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(fullText)
                .then(() => {
                    ShareUI.showToast('Copied', 'Notepad content copied to clipboard', 'success');
                })
                .catch(() => {
                    this.fallbackCopy(fullText);
                });
        } else {
            this.fallbackCopy(fullText);
        }
    }

    fallbackCopy(text) {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try {
            document.execCommand('copy');
            ShareUI.showToast('Copied', 'Notepad content copied to clipboard', 'success');
        } catch (e) {
            ShareUI.showToast('Error', 'Failed to copy to clipboard', 'error');
        }
        document.body.removeChild(ta);
    }

    exportFile(format = 'txt') {
        const title = (this.dom.titleInput?.value || '').trim();
        const content = this.dom.contentInput?.value || '';

        if (!title && !content) {
            ShareUI.showToast('Notice', 'Cannot export empty notepad', 'error');
            return;
        }

        let outputText = content;
        if (format === 'md') {
            outputText = title ? `# ${title}\n\n${content}` : content;
        } else if (title) {
            outputText = `${title}\n${'='.repeat(Math.max(title.length, 20))}\n\n${content}`;
        }

        try {
            const mimeType = format === 'md' ? 'text/markdown;charset=utf-8' : 'text/plain;charset=utf-8';
            const blob = new Blob([outputText], { type: mimeType });
            const url = URL.createObjectURL(blob);

            const safeTitle = title
                ? title.replace(/[^a-zA-Z0-9_\-\u0E00-\u0E7F]/g, '_').substring(0, 32)
                : 'note';
            const filename = `${safeTitle}_${Date.now()}.${format}`;

            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error('Export note failed:', e);
            ShareUI.showToast('Error', 'Failed to export note file', 'error');
        }
    }

    async clear() {
        const title = this.dom.titleInput?.value || '';
        const content = this.dom.contentInput?.value || '';

        if (!title && !content) {
            this.dom.contentInput?.focus();
            return;
        }

        const confirmed = await ShareUI.showConfirmModal({
            title: 'Clear Notepad?',
            message: 'Are you sure you want to clear this notepad? All text and notes on this sheet will be reset.',
            icon: 'trash-2',
            iconColor: 'text-rose-400',
            confirmLabel: 'Clear All',
            confirmClass: 'bg-rose-600 hover:bg-rose-500 text-white'
        });

        if (!confirmed) return;

        // Record snapshot before clearing so user can undo clear
        this.historyManager.recordImmediate(
            content,
            this.dom.contentInput?.selectionStart || 0,
            this.dom.contentInput?.selectionEnd || 0,
            title
        );

        if (this.dom.titleInput) this.dom.titleInput.value = '';
        if (this.dom.contentInput) this.dom.contentInput.value = '';

        this.sheetManager.updateActiveSheet('', '');
        this.saveToStorage();
        this.updateStats();
        this.detector.scan();
        this.historyManager.recordImmediate('', 0, 0, '');
        this.updateUndoRedoButtons();
        if (this.dom.contentInput) this.dom.contentInput.focus();
    }
}
