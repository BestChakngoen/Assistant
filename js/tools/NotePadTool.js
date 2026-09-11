import { ShareUI } from '../ui/share/ShareUI.js';

/**
 * NotePadTool - Instant Digital Scratchpad Tool with Realtime Auto-Save
 * Provides a blank digital sheet for note-taking, live statistics, clipboard copy, and file export.
 */
export class NotePadTool {
    constructor() {
        this.storageKey = 'assistant_quick_note_scratchpad';
        this.saveTimer = null;
        this.onSave = null;
        this.lastSavedTimestamp = 0;
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
            btnExportMd: null
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

        if (!this.dom.contentInput) return;

        this.loadFromStorage();
        this.bindEvents();

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
    }

    handleInput() {
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
            const data = {
                title: (this.dom.titleInput?.value || '').trim(),
                content: this.dom.contentInput?.value || '',
                updatedAt: Date.now()
            };
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
            if (data) {
                if (this.dom.titleInput && data.title !== undefined) {
                    this.dom.titleInput.value = data.title;
                }
                if (this.dom.contentInput && data.content !== undefined) {
                    this.dom.contentInput.value = data.content;
                }
                this.lastSavedTimestamp = data.updatedAt || Date.now();
                this.updateStats();
                this.setSaveStatus('saved', this.lastSavedTimestamp);
                return;
            }
        } catch (e) {
            console.error('Failed to load note from localStorage:', e);
        }

        this.updateStats();
        this.setSaveStatus('ready');
    }

    syncFromCloud(cloudData) {
        if (!cloudData) {
            // Cloud has no data yet. If local has existing notes, push to cloud as initial seed
            const local = this.getLocalData();
            if (local && (local.title || local.content) && typeof this.onSave === 'function') {
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

        // If cloud is newer, pull cloud changes
        if (cloudTime > localTime) {
            if (this.dom.titleInput && cloudData.title !== undefined) {
                this.dom.titleInput.value = cloudData.title;
            }
            if (this.dom.contentInput && cloudData.content !== undefined) {
                this.dom.contentInput.value = cloudData.content;
            }
            this.lastSavedTimestamp = cloudTime;
            try {
                localStorage.setItem(this.storageKey, JSON.stringify({
                    title: cloudData.title || '',
                    content: cloudData.content || '',
                    updatedAt: cloudTime
                }));
            } catch (e) {
                console.error('Failed to cache cloud note to localStorage:', e);
            }
            this.updateStats();
            this.setSaveStatus('saved', cloudTime);
        } else if (localTime > cloudTime && typeof this.onSave === 'function') {
            // Local is newer than cloud (e.g. offline edits made earlier), sync up to cloud
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

            ShareUI.showToast('Exported', `Saved as ${filename}`, 'success');
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

        if (this.dom.titleInput) this.dom.titleInput.value = '';
        if (this.dom.contentInput) this.dom.contentInput.value = '';

        this.saveToStorage();
        this.updateStats();
        if (this.dom.contentInput) this.dom.contentInput.focus();

        ShareUI.showToast('Cleared', 'Notepad has been reset', 'info');
    }
}
