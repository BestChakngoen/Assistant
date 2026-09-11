/**
 * TableCellParser - Parse & Render Multi-Content Cells
 * Handles mixed content inside a single cell: text paragraphs, multiple images, files, and links.
 * Conforms to Single Responsibility Principle (SRP) and Strict No White Borders.
 */
export class TableCellParser {
    static escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    static getUrlType(url) {
        if (!url || typeof url !== 'string') return 'text';
        if (url.startsWith('data:image/')) return 'image';

        const cleanUrl = url.split('#')[0].split('?')[0].toLowerCase();

        // 1. Image extensions or known image hosts
        if (/\.(png|jpe?g|webp|gif|svg|bmp|jfif|ico|avif|heic)$/i.test(cleanUrl)) {
            return 'image';
        }
        if (/unsplash\.com\/photos|images\.unsplash\.com|imgur\.com\/[a-zA-Z0-9]+(\.[a-z]+)?|i\.imgur\.com|media\.giphy\.com/i.test(cleanUrl)) {
            return 'image';
        }

        // 2. Document & Archive & Media extensions (File)
        if (/\.(pdf|docx?|xlsx?|pptx?|txt|csv|zip|rar|7z|tar|gz|mp3|wav|ogg|mp4|mov|webm|mkv)$/i.test(cleanUrl)) {
            return 'file';
        }

        // 3. Web link
        if (/^https?:\/\//i.test(url)) {
            return 'link';
        }

        return 'text';
    }

    static extractLabelFromUrl(url) {
        if (!url) return '';
        if (url.startsWith('data:image/')) return 'Pasted Image';
        try {
            const clean = url.split('#')[0].split('?')[0];
            const parts = clean.split('/');
            const lastPart = parts.pop() || '';
            if (lastPart && lastPart.length < 50) return decodeURIComponent(lastPart);
            const urlObj = new URL(url);
            return urlObj.hostname + (urlObj.pathname.length > 1 ? urlObj.pathname : '');
        } catch (e) {
            return url;
        }
    }

    static getFileInfo(url) {
        const clean = (url || '').split('#')[0].split('?')[0].toLowerCase();
        if (/\.pdf$/i.test(clean)) return { icon: 'file-text', ext: 'PDF' };
        if (/\.(docx?|txt)$/i.test(clean)) return { icon: 'file-text', ext: 'DOC' };
        if (/\.(xlsx?|csv)$/i.test(clean)) return { icon: 'file-spreadsheet', ext: 'SHEET' };
        if (/\.(zip|rar|7z|tar|gz)$/i.test(clean)) return { icon: 'folder-archive', ext: 'ARCHIVE' };
        if (/\.(mp3|wav|ogg)$/i.test(clean)) return { icon: 'music', ext: 'AUDIO' };
        if (/\.(mp4|mov|webm|mkv)$/i.test(clean)) return { icon: 'video', ext: 'VIDEO' };
        return { icon: 'file', ext: 'FILE' };
    }

    /**
     * Check if text contains any rich media items (URLs or data URLs)
     */
    static hasRichMedia(val) {
        if (!val || typeof val !== 'string') return false;
        const text = val.trim();
        if (!text) return false;

        // Check for markdown links [label](url)
        if (/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/i.test(text)) return true;

        // Check for data:image/
        if (/data:image\/[a-zA-Z]+;base64,/i.test(text)) return true;

        // Check for standalone URLs
        if (/https?:\/\/[^\s]+/i.test(text)) return true;

        return false;
    }

    /**
     * Parses cell content into structured blocks
     */
    static parseContent(val) {
        if (!val || typeof val !== 'string') return [];
        const lines = val.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
        const blocks = [];

        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) {
                blocks.push({ type: 'empty' });
                continue;
            }

            // 1. Markdown link: [Label](url)
            const mdMatch = trimmed.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/i);
            if (mdMatch) {
                const label = mdMatch[1];
                const url = mdMatch[2];
                const type = this.getUrlType(url);
                blocks.push({ type, url, label, isMarkdown: true });
                continue;
            }

            // 2. Standalone URL or Data URL
            if (/^(https?:\/\/[^\s]+|data:image\/[a-zA-Z]+;base64,[^\s]+)$/i.test(trimmed)) {
                const url = trimmed;
                const type = this.getUrlType(url);
                blocks.push({ type, url, label: this.extractLabelFromUrl(url) });
                continue;
            }

            // 3. Mixed text with embedded URLs (e.g. "Check report: https://example.com/file.pdf")
            const urlMatch = trimmed.match(/(https?:\/\/[^\s]+)/i);
            if (urlMatch) {
                const url = urlMatch[1];
                const type = this.getUrlType(url);
                const textBefore = trimmed.substring(0, urlMatch.index).trim();
                const textAfter = trimmed.substring(urlMatch.index + url.length).trim();

                if (textBefore) blocks.push({ type: 'text', text: textBefore });
                blocks.push({ type, url, label: this.extractLabelFromUrl(url) });
                if (textAfter) blocks.push({ type: 'text', text: textAfter });
                continue;
            }

            // 4. Plain text line
            blocks.push({ type: 'text', text: line });
        }

        return blocks;
    }

    /**
     * Render rich media cell flow HTML
     */
    static renderCellContent(cellVal, rowIdx, colIdx) {
        const val = (cellVal || '').toString();

        // If no rich media, render directly as standard inline contenteditable cell for maximum performance & simplicity
        if (!this.hasRichMedia(val)) {
            return `
                <div contenteditable="plaintext-only" spellcheck="false" role="textbox" class="table-cell-editor outline-none min-w-[90px] whitespace-pre-wrap break-words px-3 py-2 text-xs font-mono text-slate-100 rounded-xl transition-all focus:bg-slate-900/90 focus:ring-1 focus:ring-emerald-500/40" data-row="${rowIdx}" data-col="${colIdx}">${this.escapeHtml(val)}</div>
            `;
        }

        const blocks = this.parseContent(val);

        // Group consecutive images together in a flex gallery
        let bodyHtml = '';
        let currentImageGroup = [];

        const flushImages = () => {
            if (currentImageGroup.length === 0) return;
            bodyHtml += `<div class="flex flex-wrap items-center gap-2 my-1">`;
            for (const img of currentImageGroup) {
                bodyHtml += `
                    <div class="btn-cell-preview-image group/thumb relative cursor-pointer overflow-hidden rounded-xl bg-slate-950/80 size-12 shrink-0 flex items-center justify-center shadow-inner transition-transform hover:scale-105" data-url="${this.escapeHtml(img.url)}" title="Click to view full image in modal">
                        <img src="${this.escapeHtml(img.url)}" alt="${this.escapeHtml(img.label)}" class="size-full object-cover rounded-xl transition-transform group-hover/thumb:scale-110" onerror="this.classList.add('hidden'); this.nextElementSibling.classList.remove('hidden');">
                        <div class="hidden size-full flex items-center justify-center text-slate-500">
                            <i data-lucide="image-off" class="size-3.5"></i>
                        </div>
                        <div class="absolute inset-0 bg-slate-950/40 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-opacity rounded-xl">
                            <i data-lucide="zoom-in" class="size-3.5 text-emerald-400"></i>
                        </div>
                    </div>
                `;
            }
            bodyHtml += `</div>`;
            currentImageGroup = [];
        };

        for (const block of blocks) {
            if (block.type === 'image') {
                currentImageGroup.push(block);
                continue;
            }

            // Flush pending images before non-image block
            flushImages();

            if (block.type === 'empty') {
                bodyHtml += `<div class="h-2"></div>`;
                continue;
            }

            if (block.type === 'text') {
                bodyHtml += `
                    <div class="text-xs font-mono text-slate-200 whitespace-pre-wrap break-words leading-relaxed select-text">${this.escapeHtml(block.text)}</div>
                `;
                continue;
            }

            if (block.type === 'file') {
                const fileInfo = this.getFileInfo(block.url);
                bodyHtml += `
                    <div class="my-1">
                        <a href="${this.escapeHtml(block.url)}" target="_blank" rel="noopener noreferrer" class="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800/90 text-slate-200 hover:text-emerald-300 transition-all group/file max-w-fit" title="Open or Download: ${this.escapeHtml(block.label)}">
                            <div class="p-1 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
                                <i data-lucide="${fileInfo.icon}" class="size-3.5"></i>
                            </div>
                            <div class="flex flex-col min-w-0 max-w-[170px]">
                                <span class="text-xs font-mono font-medium truncate">${this.escapeHtml(block.label)}</span>
                                <span class="text-[9px] font-mono text-slate-400 uppercase">${fileInfo.ext}</span>
                            </div>
                            <i data-lucide="download" class="size-3 text-slate-400 group-hover/file:text-emerald-400 shrink-0 ml-1"></i>
                        </a>
                    </div>
                `;
                continue;
            }

            if (block.type === 'link') {
                bodyHtml += `
                    <div class="my-0.5">
                        <a href="${this.escapeHtml(block.url)}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-900/70 hover:bg-slate-800/90 text-xs font-mono text-cyan-400 hover:underline max-w-fit transition-all truncate" title="${this.escapeHtml(block.url)}">
                            <i data-lucide="external-link" class="size-3 shrink-0 text-cyan-400"></i>
                            <span class="truncate max-w-[200px]">${this.escapeHtml(block.label)}</span>
                        </a>
                    </div>
                `;
                continue;
            }
        }

        // Flush any trailing images
        flushImages();

        return `
            <div class="table-cell-flow flex flex-col gap-1 p-2 rounded-xl bg-slate-900/40 hover:bg-slate-900/70 group/flow transition-all min-w-[120px] relative" data-row="${rowIdx}" data-col="${colIdx}">
                <div class="absolute top-1.5 right-1.5 opacity-0 group-hover/flow:opacity-100 transition-opacity z-10">
                    <button type="button" class="btn-cell-edit-flow p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-400 hover:text-slate-100 transition-all" title="Edit Cell Content (or double click)" data-row="${rowIdx}" data-col="${colIdx}">
                        <i data-lucide="pencil" class="size-3"></i>
                    </button>
                </div>
                ${bodyHtml}
            </div>
        `;
    }
}
