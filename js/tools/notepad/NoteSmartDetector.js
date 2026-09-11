import { NoteContentParser } from './NoteContentParser.js';
import { NoteFileCompressor } from './NoteFileCompressor.js';
import { ShareUI } from '../../ui/share/ShareUI.js';
import { ShareLightbox } from '../../ui/share/ShareLightbox.js';

/**
 * NoteSmartDetector.js - Intelligent Media & Link Detection Bar
 * Automatically scans note text, detects links, images, and files in real-time.
 * Remains completely hidden when no media/links exist, keeping the writing interface 100% clean.
 * Handles drag-and-drop and clipboard paste (Ctrl+V) directly on the textarea.
 * Strictly adheres to Single Responsibility Principle (SRP) and Strict No White Borders.
 */
export class NoteSmartDetector {
    constructor() {
        this.dom = {
            container: null,
            badge: null,
            linksGrid: null,
            imagesGrid: null,
            filesGrid: null,
            dropZone: null,
            contentInput: null,
            noteSection: null
        };
        this.detected = {
            links: [],
            images: [],
            files: [],
            totalCount: 0
        };
    }

    /**
     * Initializes DOM references and event listeners.
     */
    init() {
        this.dom.container = document.getElementById('note-smart-detector-container');
        this.dom.badge = document.getElementById('note-detected-badge');
        this.dom.linksGrid = document.getElementById('note-detected-links');
        this.dom.imagesGrid = document.getElementById('note-detected-images');
        this.dom.filesGrid = document.getElementById('note-detected-files');
        this.dom.dropZone = document.getElementById('note-drop-zone');
        this.dom.contentInput = document.getElementById('note-content-input');
        this.dom.noteSection = document.getElementById('tools-note-section');

        if (!this.dom.contentInput) return;

        this.bindEvents();
        this.scan();
    }

    /**
     * Binds input, paste, drag & drop, and action click events.
     */
    bindEvents() {
        // Realtime scan on textarea typing or modification
        this.dom.contentInput.addEventListener('input', () => {
            this.scan();
        });

        // Clipboard paste (Ctrl+V) of images directly into note
        this.dom.contentInput.addEventListener('paste', (e) => {
            this.handleClipboardPaste(e);
        });

        // Drag & drop files onto note
        if (this.dom.noteSection) {
            this.bindDragAndDrop();
        }

        // Delegated action clicks on detected bar
        if (this.dom.container) {
            this.dom.container.addEventListener('click', (e) => {
                this.handleActionClick(e);
            });
        }
    }

    /**
     * Scans the current note content and updates detected items.
     */
    scan() {
        const text = this.dom.contentInput?.value || '';
        this.detected = NoteContentParser.parse(text);
        this.render();
    }

    /**
     * Handles clipboard paste events for images.
     * @param {ClipboardEvent} e
     */
    async handleClipboardPaste(e) {
        const items = e.clipboardData?.items;
        if (!items) return;

        const imageFiles = [];
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item.type && item.type.indexOf('image') !== -1) {
                const file = item.getAsFile();
                if (file) imageFiles.push(file);
            }
        }

        if (imageFiles.length === 0) return;

        // Prevent default paste of raw data string
        e.preventDefault();

        for (const file of imageFiles) {
            try {
                const compressed = await NoteFileCompressor.compressImage(file);
                const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const markdownImage = `\n![Pasted Image ${timeStr}](${compressed.data})\n`;
                this.insertTextAtCursor(markdownImage);
                ShareUI.playSound('success');
            } catch (err) {
                console.error('Pasted image compression failed:', err);
                ShareUI.showToast('Upload Error', err.message || 'Failed to process pasted image', 'error');
            }
        }
    }

    /**
     * Binds drag & drop listeners to the note section.
     */
    bindDragAndDrop() {
        const dropTarget = this.dom.noteSection;
        let dragCounter = 0;

        const setDropZoneVisible = (visible) => {
            if (this.dom.dropZone) {
                if (visible) {
                    this.dom.dropZone.classList.remove('hidden');
                } else {
                    this.dom.dropZone.classList.add('hidden');
                }
            }
        };

        dropTarget.addEventListener('dragenter', (e) => {
            e.preventDefault();
            dragCounter++;
            if (e.dataTransfer.types && Array.from(e.dataTransfer.types).includes('Files')) {
                setDropZoneVisible(true);
            }
        });

        dropTarget.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        dropTarget.addEventListener('dragleave', (e) => {
            e.preventDefault();
            dragCounter--;
            if (dragCounter <= 0) {
                dragCounter = 0;
                setDropZoneVisible(false);
            }
        });

        dropTarget.addEventListener('drop', async (e) => {
            e.preventDefault();
            dragCounter = 0;
            setDropZoneVisible(false);

            const files = Array.from(e.dataTransfer.files || []);
            if (files.length === 0) return;

            for (const file of files) {
                try {
                    if (file.type && file.type.startsWith('image/')) {
                        const compressed = await NoteFileCompressor.compressImage(file);
                        const md = `\n![${file.name}](${compressed.data})\n`;
                        this.insertTextAtCursor(md);
                    } else {
                        const fileData = await NoteFileCompressor.readFileAsBase64(file);
                        const md = `\n[${file.name}](${fileData.data})\n`;
                        this.insertTextAtCursor(md);
                    }
                    ShareUI.playSound('success');
                } catch (err) {
                    console.error('File drop processing failed:', err);
                    ShareUI.showToast('File Error', err.message || `Failed to attach "${file.name}"`, 'error');
                }
            }
        });
    }

    /**
     * Inserts text at current cursor in textarea and dispatches input event.
     * @param {string} textToInsert
     */
    insertTextAtCursor(textToInsert) {
        const ta = this.dom.contentInput;
        if (!ta) return;

        const startPos = ta.selectionStart !== undefined ? ta.selectionStart : ta.value.length;
        const endPos = ta.selectionEnd !== undefined ? ta.selectionEnd : ta.value.length;
        const before = ta.value.substring(0, startPos);
        const after = ta.value.substring(endPos);

        ta.value = before + textToInsert + after;
        ta.selectionStart = ta.selectionEnd = startPos + textToInsert.length;

        // Dispatches input event for auto-save debounce and real-time detection scan
        ta.dispatchEvent(new Event('input', { bubbles: true }));
    }

    /**
     * Handles delegated action clicks in the Smart Detection Bar.
     * @param {MouseEvent} e
     */
    handleActionClick(e) {
        const actionBtn = e.target.closest('[data-smart-action]');
        if (!actionBtn) return;

        const action = actionBtn.getAttribute('data-smart-action');
        const url = actionBtn.getAttribute('data-url');
        const name = actionBtn.getAttribute('data-name') || 'Media';

        switch (action) {
            case 'copy-url': {
                if (url) {
                    this.copyToClipboard(url, 'URL copied to clipboard');
                }
                break;
            }
            case 'preview-image': {
                if (url) {
                    ShareLightbox.showImageModal(url, name, {
                        playSound: ShareUI.playSound,
                        downloadFile: () => this.downloadFileItem(name, url)
                    });
                }
                break;
            }
            case 'download': {
                if (url) {
                    this.downloadFileItem(name, url);
                }
                break;
            }
        }
    }

    /**
     * Copies text to clipboard.
     * @param {string} text
     * @param {string} successMessage
     */
    copyToClipboard(text, successMessage = 'Copied') {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text)
                .then(() => ShareUI.showToast('Copied', successMessage, 'success'))
                .catch(() => this.fallbackCopy(text, successMessage));
        } else {
            this.fallbackCopy(text, successMessage);
        }
    }

    fallbackCopy(text, successMessage) {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try {
            document.execCommand('copy');
            ShareUI.showToast('Copied', successMessage, 'success');
        } catch (e) {
            ShareUI.showToast('Error', 'Failed to copy', 'error');
        }
        document.body.removeChild(ta);
    }

    /**
     * Downloads file or image data URL.
     * @param {string} filename
     * @param {string} url
     */
    downloadFileItem(filename, url) {
        try {
            const a = document.createElement('a');
            a.href = url;
            a.download = filename || 'download';
            if (!url.startsWith('data:')) {
                a.target = '_blank';
                a.rel = 'noopener noreferrer';
            }
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            ShareUI.playSound('mouse-click');
        } catch (e) {
            console.error('Download failed:', e);
            ShareUI.showToast('Error', 'Failed to download item', 'error');
        }
    }

    /**
     * Renders detected links, images, and files in the Smart Detection Bar.
     * Automatically hides the container completely when totalCount === 0.
     */
    render() {
        if (!this.dom.container) return;

        const { links, images, files, totalCount } = this.detected;

        // Auto-hide entire container when 0 items are detected, keeping interface clean!
        if (totalCount === 0) {
            this.dom.container.classList.add('hidden');
            return;
        }

        // Show container when media/links are detected
        this.dom.container.classList.remove('hidden');

        // Update badge
        if (this.dom.badge) {
            this.dom.badge.textContent = `${totalCount} detected`;
            this.dom.badge.className = 'px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300';
        }

        // Render Links
        if (this.dom.linksGrid) {
            if (links.length > 0) {
                this.dom.linksGrid.classList.remove('hidden');
                this.dom.linksGrid.innerHTML = links.map(link => `
                    <div class="group flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-slate-950/70 hover:bg-slate-900/90 transition-all text-xs font-mono">
                        <div class="flex items-center gap-2.5 min-w-0 flex-1">
                            <div class="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 shrink-0">
                                <i data-lucide="globe" class="size-3.5"></i>
                            </div>
                            <div class="flex flex-col min-w-0">
                                <span class="text-slate-200 font-semibold truncate text-[11px] sm:text-xs">${NoteContentParser.escapeHtml(link.label)}</span>
                                <span class="text-slate-500 truncate text-[10px]">${NoteContentParser.escapeHtml(link.url)}</span>
                            </div>
                        </div>
                        <div class="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                            <a href="${NoteContentParser.escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer" title="Open in new tab" class="p-1.5 rounded-lg hover:bg-sky-500/20 text-slate-400 hover:text-sky-300 transition-colors">
                                <i data-lucide="external-link" class="size-3.5"></i>
                            </a>
                            <button type="button" data-smart-action="copy-url" data-url="${NoteContentParser.escapeHtml(link.url)}" title="Copy Link" class="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer">
                                <i data-lucide="copy" class="size-3.5"></i>
                            </button>
                        </div>
                    </div>
                `).join('');
            } else {
                this.dom.linksGrid.innerHTML = '';
                this.dom.linksGrid.classList.add('hidden');
            }
        }

        // Render Images
        if (this.dom.imagesGrid) {
            if (images.length > 0) {
                this.dom.imagesGrid.classList.remove('hidden');
                this.dom.imagesGrid.innerHTML = images.map(img => `
                    <div class="group relative rounded-2xl bg-slate-950/70 overflow-hidden flex flex-col transition-all">
                        <div class="relative aspect-video w-full bg-slate-950 overflow-hidden cursor-pointer" data-smart-action="preview-image" data-url="${NoteContentParser.escapeHtml(img.url)}" data-name="${NoteContentParser.escapeHtml(img.name)}">
                            <img src="${NoteContentParser.escapeHtml(img.url)}" alt="${NoteContentParser.escapeHtml(img.name)}" class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" onerror="this.classList.add('hidden'); this.nextElementSibling.classList.remove('hidden');" />
                            <div class="hidden w-full h-full flex items-center justify-center bg-slate-950 text-slate-600">
                                <i data-lucide="image-off" class="size-5"></i>
                            </div>
                            <div class="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <span class="p-2 rounded-xl bg-slate-900/80 text-white hover:bg-sky-600 transition-colors" title="Zoom / Preview">
                                    <i data-lucide="zoom-in" class="size-4"></i>
                                </span>
                            </div>
                        </div>
                        <div class="p-2 flex items-center justify-between gap-1">
                            <div class="min-w-0 flex-1">
                                <p class="text-[10px] font-mono text-slate-300 font-medium truncate" title="${NoteContentParser.escapeHtml(img.name)}">${NoteContentParser.escapeHtml(img.name)}</p>
                                <span class="text-[9px] font-mono text-emerald-400">Image</span>
                            </div>
                            <div class="flex items-center gap-0.5 shrink-0">
                                <button type="button" data-smart-action="download" data-url="${NoteContentParser.escapeHtml(img.url)}" data-name="${NoteContentParser.escapeHtml(img.name)}" title="Download image" class="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer">
                                    <i data-lucide="download" class="size-3"></i>
                                </button>
                                <button type="button" data-smart-action="copy-url" data-url="${NoteContentParser.escapeHtml(img.url)}" title="Copy image URL" class="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer">
                                    <i data-lucide="copy" class="size-3"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                `).join('');
            } else {
                this.dom.imagesGrid.innerHTML = '';
                this.dom.imagesGrid.classList.add('hidden');
            }
        }

        // Render Files
        if (this.dom.filesGrid) {
            if (files.length > 0) {
                this.dom.filesGrid.classList.remove('hidden');
                this.dom.filesGrid.innerHTML = files.map(file => {
                    const fileInfo = NoteContentParser.getFileInfo(file.name || file.url);
                    return `
                        <div class="group flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-slate-950/70 hover:bg-slate-900/90 transition-all text-xs font-mono">
                            <div class="flex items-center gap-2.5 min-w-0 flex-1">
                                <div class="p-2 rounded-lg bg-violet-500/10 text-violet-400 shrink-0">
                                    <i data-lucide="${fileInfo.icon}" class="size-4"></i>
                                </div>
                                <div class="flex flex-col min-w-0">
                                    <span class="text-slate-200 font-medium truncate text-[11px] sm:text-xs" title="${NoteContentParser.escapeHtml(file.name)}">${NoteContentParser.escapeHtml(file.name)}</span>
                                    <span class="text-[9px] font-mono text-slate-400 uppercase">${fileInfo.ext}</span>
                                </div>
                            </div>
                            <div class="flex items-center gap-1 shrink-0">
                                <button type="button" data-smart-action="download" data-url="${NoteContentParser.escapeHtml(file.url)}" data-name="${NoteContentParser.escapeHtml(file.name)}" title="Download file" class="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-violet-300 transition-colors flex items-center gap-1 text-[10px] cursor-pointer">
                                    <i data-lucide="download" class="size-3.5"></i>
                                    <span class="hidden sm:inline">Download</span>
                                </button>
                                <button type="button" data-smart-action="copy-url" data-url="${NoteContentParser.escapeHtml(file.url)}" title="Copy link" class="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer">
                                    <i data-lucide="copy" class="size-3.5"></i>
                                </button>
                            </div>
                        </div>
                    `;
                }).join('');
            } else {
                this.dom.filesGrid.innerHTML = '';
                this.dom.filesGrid.classList.add('hidden');
            }
        }

        if (window.lucide && typeof window.lucide.createIcons === 'function') {
            window.lucide.createIcons();
        }
    }
}
