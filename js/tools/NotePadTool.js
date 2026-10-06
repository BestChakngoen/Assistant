import { ShareUI } from '../ui/share/ShareUI.js';

import { NoteSheetManager } from './notepad/NoteSheetManager.js';
import { NoteFormatter } from './notepad/NoteFormatter.js';
import { NoteHistoryManager } from './notepad/NoteHistoryManager.js';
import { ToolZoomManager } from './common/ToolZoomManager.js';
import { NoteManagerModal } from './notepad/NoteManagerModal.js';
import { NoteStickerManager } from './notepad/NoteStickerManager.js';

/**
 * NotePadTool - Instant Digital Scratchpad Tool with Realtime Auto-Save & Smart Detection
 * Provides a clean, stable digital sheet for writing, with automatic media & link detection.
 * Supports multiple sheets/tabs, rich formatting tools, robust multi-language undo/redo, and zoom controls.
 * Adheres strictly to SOLID, Single Responsibility Principle (SRP), and Zero Regression.
 */
export class NotePadTool {
    constructor() {
        this.storageKey = 'assistant_quick_note_scratchpad';
        this.saveTimer = null;
        this.onSave = null;
        this.lastSavedTimestamp = 0;
        this.startedEmpty = false; // Hydration flag
        
        this.sheetManager = new NoteSheetManager();
        this.historyManager = new NoteHistoryManager();
        this.managerModal = new NoteManagerModal(this.sheetManager, this);
        this.stickerManager = new NoteStickerManager(this.sheetManager);
        this.zoomManager = null;
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
            btnRedo: null,
            section: null
        };
    }

    init() {
        this.dom.section = document.getElementById('tools-note-section');
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
        this.dom.sheetsScrollContainer = document.getElementById('note-sheets-scroll-container');
        this.dom.btnAddSheet = document.getElementById('btn-note-add-sheet');
        this.dom.btnManageSheets = document.getElementById('btn-note-manage-sheets');
        this.dom.btnFormatBold = document.getElementById('btn-note-format-bold');
        this.dom.btnFormatDivider = document.getElementById('btn-note-format-divider');
        this.dom.btnUndo = document.getElementById('btn-note-undo');
        this.dom.btnRedo = document.getElementById('btn-note-redo');

        if (!this.dom.contentInput) return;

        if (this.dom.section) {
            const cardEl = this.dom.section.querySelector('.rounded-3xl') || this.dom.section;
            this.zoomManager = new ToolZoomManager({
                container: cardEl,
                storageKey: 'assistant_quick_note_zoom',
                minZoom: 0.7,
                maxZoom: 2.0,
                step: 0.1,
                defaultZoom: 1.0,
                accentColor: 'text-amber-400',
                onZoomChange: (zoomLevel) => {
                    const baseFontSize = 14;
                    const baseLineHeight = 22;
                    this.dom.contentInput.style.fontSize = `${Math.round(baseFontSize * zoomLevel)}px`;
                    this.dom.contentInput.style.lineHeight = `${Math.round(baseLineHeight * zoomLevel)}px`;
                    if (this.stickerManager) {
                        this.stickerManager.setZoom(zoomLevel);
                    }
                }
            });
            this.zoomManager.init();
        }

        this.sheetManager.init({
            scrollContainer: this.dom.sheetsScrollContainer,
            tabsContainer: this.dom.sheetsTabs,
            btnAddSheet: this.dom.btnAddSheet,
            onSwitch: (targetSheet, previousSheet) => {
                if (previousSheet && this.dom.contentInput) {
                    this.historyManager.flushPendingTyping();
                    previousSheet.title = (this.dom.titleInput?.value || '').trim();
                    previousSheet.content = this.getEditorContent() || '';
                    previousSheet.updatedAt = Date.now();
                }
                if (this.dom.titleInput) {
                    this.dom.titleInput.value = targetSheet.title || '';
                }
                if (this.dom.contentInput) {
                    this.setEditorContent(targetSheet.content || '');
                }
                this.historyManager.setSheet(targetSheet.id, targetSheet.content || '', 0, 0, targetSheet.title || '');
                this.updateStats();
                
                this.stickerManager.renderStickers();
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

        
        this.initQuill();
        this.loadFromStorage();
        this.bindEvents();
        this.updateUndoRedoButtons();

        if (window.lucide && typeof window.lucide.createIcons === 'function') {
            window.lucide.createIcons();
        }
    }

    initQuill() {
        if (!window.Quill || !this.dom.contentInput) return;
        
        // Ensure container is empty before init
        this.dom.contentInput.innerHTML = '';
        
        this.quill = new window.Quill('#note-content-input', {
            theme: 'snow',
            modules: {
                toolbar: false, // No toolbar, clean scratchpad look
                clipboard: {
                    matchVisual: false // prevents weird spacing on paste
                }
            },
            placeholder: 'Start typing here...'
        });

        // Intercept typing for history/save
        this.quill.on('text-change', (delta, oldDelta, source) => {
            if (source === 'user') {
                this.handleInput();
            }
        });
    }

    getEditorContent() {
        if (this.quill) {
            return this.quill.root.innerHTML;
        }
        return '';
    }

    setEditorContent(html) {
        if (this.quill) {
            // Check if it's legacy plain text (no HTML tags)
            if (html && !html.includes('<') && html.includes('\n')) {
                html = html.replace(/\n/g, '<br>');
            }
            this.quill.clipboard.dangerouslyPasteHTML(html, 'api');
        }
    }

    getEditorSelectionStart() {
        if (this.quill) {
            const range = this.quill.getSelection();
            return range ? range.index : 0;
        }
        return 0;
    }

    getEditorSelectionEnd() {
        if (this.quill) {
            const range = this.quill.getSelection();
            return range ? range.index + range.length : 0;
        }
        return 0;
    }

    setEditorSelectionStart(index) {
        if (this.quill) {
            const range = this.quill.getSelection();
            this.quill.setSelection(index, range ? range.length : 0, 'silent');
        }
    }

    setEditorSelectionEnd(index) {
        if (this.quill) {
            const range = this.quill.getSelection();
            const start = range ? range.index : index;
            this.quill.setSelection(start, index - start, 'silent');
        }
    }

    bindEvents() {
        if (this.dom.titleInput) {
            this.dom.titleInput.addEventListener('input', () => {
                this.handleInput();
            });
        }
        
        // Custom Paste handler for Quill (URLs and Plain Text)
        if (this.quill) {
            this.quill.root.addEventListener('paste', (e) => {
                const clipboardData = e.clipboardData || window.clipboardData;
                const pastedText = clipboardData.getData('text');
                
                if (pastedText && pastedText.trim().match(/^https?:\/\/[^\s]+$/i)) {
                    e.preventDefault();
                    const url = pastedText.trim();
                    const urlObj = new URL(url);
                    const shortName = urlObj.hostname.replace('www.', '') + (urlObj.pathname.length > 1 ? '/...' : '');
                    
                    const range = this.quill.getSelection(true);
                    if (range) {
                        this.quill.insertText(range.index, shortName, 'link', url, 'user');
                        this.quill.formatText(range.index, shortName.length, {
                            'color': '#22d3ee' // cyan-400
                        });
                        this.quill.setSelection(range.index + shortName.length, 0, 'silent');
                    }
                } else {
                    // Force plain text paste to prevent unwanted HTML formatting
                    e.preventDefault();
                    const range = this.quill.getSelection(true);
                    if (range && pastedText) {
                        this.quill.insertText(range.index, pastedText, 'user');
                        this.quill.setSelection(range.index + pastedText.length, 0, 'silent');
                    }
                }
            });

            // Make Quill links clickable with double-click or ctrl-click
            this.quill.root.addEventListener('click', (e) => {
                if ((e.ctrlKey || e.metaKey || e.detail >= 2) && e.target.tagName === 'A') {
                    window.open(e.target.href, '_blank');
                }
            });
        }

        // Action: Manage Notes Modal
        if (this.dom.btnManageSheets) {
            this.dom.btnManageSheets.addEventListener('click', () => {
                this.historyManager.flushPendingTyping();
                const active = this.sheetManager.getActiveSheet();
                if (active) {
                    active.title = (this.dom.titleInput?.value || '').trim();
                    active.content = this.getEditorContent() || '';
                    active.updatedAt = Date.now();
                }
                this.saveToStorage();
                this.managerModal.open();
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
        const editorTarget = this.quill ? this.quill.root : this.dom.contentInput;
        if (editorTarget) {
            editorTarget.addEventListener('keydown', (e) => {
                const isCtrlOrCmd = e.ctrlKey || e.metaKey;
                if (!isCtrlOrCmd) return;

                const code = e.code;
                const key = e.key.toLowerCase();

                // Undo: Ctrl+Z (without Shift)
                if ((code === 'KeyZ' || key === 'z' || key === '?') && !e.shiftKey && !e.altKey) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.undo();
                    return;
                }

                // Redo: Ctrl+Y or Ctrl+Shift+Z
                const isRedoZ = (code === 'KeyZ' || key === 'z' || key === '?' || key === '(') && e.shiftKey;
                const isRedoY = (code === 'KeyY' || key === 'y' || key === '?') && !e.shiftKey;
                if ((isRedoZ || isRedoY) && !e.altKey) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.redo();
                    return;
                }

                // Bold: Ctrl+B
                if ((code === 'KeyB' || key === 'b' || key === '?') && !e.shiftKey && !e.altKey) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.applyFormatBold();
                    return;
                }

                // Divider Line: Ctrl+Shift+H
                if ((code === 'KeyH' || key === 'h' || key === '?') && e.shiftKey && !e.altKey) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.applyFormatDivider();
                    return;
                }
            }, { capture: true });
        }

        // Action: Manage Notes Modal
        if (this.dom.btnManageSheets) {
            this.dom.btnManageSheets.addEventListener('click', () => {
                this.historyManager.flushPendingTyping();
                const active = this.sheetManager.getActiveSheet();
                if (active) {
                    active.title = (this.dom.titleInput?.value || '').trim();
                    active.content = this.getEditorContent() || '';
                    active.updatedAt = Date.now();
                }
                this.saveToStorage();
                this.managerModal.open();
            });
        }

        // Action: Clear
        if (this.dom.btnClear) {
            this.dom.btnClear.addEventListener('click', () => this.clear());
        }

        // Action: Copy
        if (this.dom.btnCopy) {
            this.dom.btnCopy.addEventListener('click', () => this.copyAll());
        }

        // Action: Export TXT
        if (this.dom.btnExportTxt) {
            this.dom.btnExportTxt.addEventListener('click', () => this.exportFile('txt'));
        }

        // Action: Export Markdown
        if (this.dom.btnExportMd) {
            this.dom.btnExportMd.addEventListener('click', () => this.exportFile('md'));
        }
    }

    undo() {
        if (!this.dom.contentInput) return;
        const currentTitle = (this.dom.titleInput?.value || '').trim();
        const snapshot = this.historyManager.undo(
            this.getEditorContent(),
            this.getEditorSelectionStart(),
            this.getEditorSelectionEnd(),
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
            this.getEditorContent(),
            this.getEditorSelectionStart(),
            this.getEditorSelectionEnd(),
            currentTitle
        );
        if (snapshot) {
            this.applyNoteSnapshot(snapshot, currentTitle);
        }
    }

    applyNoteSnapshot(snapshot, currentTitle) {
        const titleChanged = snapshot.title !== undefined && snapshot.title !== currentTitle;
        const contentChanged = snapshot.value !== this.getEditorContent();

        if (titleChanged && this.dom.titleInput) {
            this.dom.titleInput.value = snapshot.title;
        }

        this.setEditorContent(snapshot.value);
        const cursorStart = snapshot.selectionStart ?? snapshot.value.length;
        const cursorEnd = snapshot.selectionEnd ?? snapshot.value.length;
        this.setEditorSelectionStart(cursorStart);
        this.setEditorSelectionEnd(cursorEnd);

        this.handleInput(false);
        
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
        if (!this.quill) return;
        try {
            const bounds = this.quill.getBounds(cursorIndex || 0);
            if (bounds) {
                // Find the scroll container (note-sheet-canvas)
                const scrollContainer = document.getElementById('note-sheet-canvas');
                if (scrollContainer) {
                    // bounds.top is relative to the editor container
                    // Add some headroom
                    const targetScrollTop = Math.max(0, bounds.top - 40);
                    scrollContainer.scrollTo({ top: targetScrollTop, behavior: 'smooth' });
                }
            }
        } catch (e) {
            console.warn('Scroll to cursor failed:', e);
        }
    }

    applyFormatBold() {
        if (!this.quill) return;
        const range = this.quill.getSelection(true);
        if (!range) return;

        if (range.length > 0) {
            // Has selection: wrap selected text with **
            const selectedText = this.quill.getText(range.index, range.length);
            
            // Toggle: if already wrapped with **, remove them
            if (selectedText.startsWith('**') && selectedText.endsWith('**') && selectedText.length > 4) {
                const inner = selectedText.slice(2, -2);
                this.quill.deleteText(range.index, range.length, 'user');
                this.quill.insertText(range.index, inner, 'user');
                this.quill.setSelection(range.index, inner.length, 'silent');
            } else {
                this.quill.insertText(range.index + range.length, '**', 'user');
                this.quill.insertText(range.index, '**', 'user');
                this.quill.setSelection(range.index + 2, range.length, 'silent');
            }
        } else {
            // No selection: insert ** cursor ** and place cursor in between
            this.quill.insertText(range.index, '****', 'user');
            this.quill.setSelection(range.index + 2, 0, 'silent');
        }
    }

    applyFormatDivider() {
        if (!this.quill) return;
        const range = this.quill.getSelection(true);
        if (range) {
            this.quill.insertText(range.index, '\n\n---\n\n', 'user');
            this.quill.setSelection(range.index + 6, 0, 'silent');
        }
    }

    handleInput(recordHistory = true) {
        const title = (this.dom.titleInput?.value || '').trim();
        const content = this.getEditorContent() || '';
        this.sheetManager.updateActiveSheet(title, content);

        if (recordHistory && this.dom.contentInput) {
            this.historyManager.recordTyping(
                content,
                this.getEditorSelectionStart(),
                this.getEditorSelectionEnd(),
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

    setSyncingState(isSyncing) {
        if (!this.dom.section) return;
        const card = this.dom.section.querySelector('.rounded-3xl') || this.dom.section;
        let overlay = card.querySelector('.syncing-overlay');
        
        if (isSyncing) {
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.className = 'syncing-overlay absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/50 backdrop-blur-sm rounded-3xl pointer-events-auto transition-opacity duration-300 opacity-0';
                overlay.innerHTML = `
                    <div class="p-5 rounded-2xl bg-slate-900/90 shadow-2xl border border-slate-700/50 flex flex-col items-center gap-3">
                        <i data-lucide="cloud-download" class="w-8 h-8 text-sky-400 animate-bounce"></i>
                        <span class="text-sm font-mono font-bold text-sky-400">Syncing data from Cloud...</span>
                    </div>
                `;
                if (window.getComputedStyle(card).position === 'static') {
                    card.style.position = 'relative';
                }
                card.appendChild(overlay);
                if (window.lucide && window.lucide.createIcons) window.lucide.createIcons();
                // trigger reflow
                void overlay.offsetWidth;
            }
            overlay.classList.remove('opacity-0');
        } else {
            if (overlay) {
                overlay.classList.add('opacity-0');
                setTimeout(() => {
                    if (overlay && overlay.parentNode) {
                        overlay.parentNode.removeChild(overlay);
                    }
                }, 300);
            }
        }
    }

    updateStats() {
        let text = '';
        if (this.quill) {
            text = this.quill.getText();
        } else {
            const rawHtml = this.getEditorContent() || '';
            const tmp = document.createElement('div');
            tmp.innerHTML = rawHtml;
            text = tmp.textContent || tmp.innerText || '';
        }

        const trimmed = text.trim();

        // Characters (subtract 1 for Quill's trailing newline)
        const chars = Math.max(0, text.length - (this.quill ? 1 : 0));
        if (this.dom.charsCount) {
            this.dom.charsCount.textContent = `${chars.toLocaleString()} characters`;
        }

        // Words
        const words = trimmed.length > 0 ? trimmed.split(/\s+/).length : 0;
        if (this.dom.wordsCount) {
            this.dom.wordsCount.textContent = `${words.toLocaleString()} words`;
        }

        // Lines
        const lines = text.length > 0 ? text.split('\n').length - (this.quill ? 1 : 0) : 0;
        if (this.dom.linesCount) {
            this.dom.linesCount.textContent = `${Math.max(0, lines).toLocaleString()} lines`;
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
            active.content = this.getEditorContent() || '';
            active.updatedAt = Date.now();

            const data = this.sheetManager.getStatePayload();
            if (this.isExplicitlyCleared) {
                data.isExplicitlyCleared = true;
                this.isExplicitlyCleared = false; // Reset after injecting
            }

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
            if (!data) {
                this.startedEmpty = true;
            } else {
                this.startedEmpty = false;
            }
            this.sheetManager.loadState(data);
            const active = this.sheetManager.getActiveSheet();
            if (this.dom.titleInput) {
                this.dom.titleInput.value = active.title || '';
            }
            if (this.dom.contentInput) {
                this.setEditorContent(active.content || '');
            }
            this.lastSavedTimestamp = (data && data.updatedAt) ? data.updatedAt : 0;
            this.historyManager.setSheet(active.id, active.content || '', 0, 0, active.title || '');
            this.updateStats();
            
            this.stickerManager.renderStickers();
            this.updateUndoRedoButtons();
            this.setSaveStatus('saved', this.lastSavedTimestamp);
            return;
        } catch (e) {
            console.error('Failed to load note from localStorage:', e);
            this.startedEmpty = true;
        }

        this.updateStats();
        
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
        // UNLESS we started empty (so local changes are just typing on a blank sheet before cloud loaded)
        if (isEditing && localTime >= cloudTime && !this.startedEmpty) {
            return;
        }

        const localHasContent = local && (
            (Array.isArray(local.sheets) && local.sheets.some(s => (s.title && s.title.trim()) || (s.content && s.content.trim()) || (Array.isArray(s.stickers) && s.stickers.length > 0))) ||
            (Array.isArray(local.folders) && local.folders.length > 0) ||
            (local.title && local.title.trim()) ||
            (local.content && local.content.trim())
        );

        const cloudHasContent = cloudData && (
            (Array.isArray(cloudData.sheets) && cloudData.sheets.some(s => (s.title && s.title.trim()) || (s.content && s.content.trim()) || (Array.isArray(s.stickers) && s.stickers.length > 0))) ||
            (Array.isArray(cloudData.folders) && cloudData.folders.length > 0) ||
            (cloudData.title && cloudData.title.trim()) ||
            (cloudData.content && cloudData.content.trim())
        );

        // If we started with empty local storage in this session, unconditionally accept cloud data.
        const shouldOverwriteLocal = this.startedEmpty || cloudTime > localTime || (!localHasContent && cloudHasContent);

        // If cloud is newer OR local has no actual notes yet while cloud does, OR we started empty
        if (shouldOverwriteLocal) {
            this.startedEmpty = false;
            this.sheetManager.loadState(cloudData);
            const active = this.sheetManager.getActiveSheet();
            if (this.dom.titleInput) {
                this.dom.titleInput.value = active.title || '';
            }
            if (this.dom.contentInput) {
                this.setEditorContent(active.content || '');
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
            
            this.stickerManager.renderStickers();
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

    // Helper: get plain text representation from the rich text editor
    getPlainText() {
        if (this.quill) {
            // Quill getText() returns plain text with a trailing newline
            return this.quill.getText().replace(/\n$/, '');
        }
        // Fallback: strip HTML
        const tmp = document.createElement('div');
        tmp.innerHTML = this.getEditorContent() || '';
        return tmp.textContent || tmp.innerText || '';
    }

    copyAll() {
        const title = (this.dom.titleInput?.value || '').trim();
        const content = this.getPlainText();

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
        const content = this.getPlainText();

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
        const content = this.getEditorContent() || '';

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
        
        this.isExplicitlyCleared = true;

        // Record snapshot before clearing so user can undo clear
        this.historyManager.recordImmediate(
            content,
            this.getEditorSelectionStart() || 0,
            this.getEditorSelectionEnd() || 0,
            title
        );

        if (this.dom.titleInput) this.dom.titleInput.value = '';
        if (this.dom.contentInput) this.setEditorContent('');

        this.sheetManager.updateActiveSheet('', '');
        this.saveToStorage();
        this.updateStats();
        
        this.historyManager.recordImmediate('', 0, 0, '');
        this.updateUndoRedoButtons();
        if (this.dom.contentInput) this.dom.contentInput.focus();
    }
}
