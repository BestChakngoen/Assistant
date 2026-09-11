/**
 * NoteContentParser.js - Smart Realtime Content & Media Parser
 * Automatically parses raw text into classified links, images, and files without requiring manual addition.
 * Conforms to Single Responsibility Principle (SRP).
 */
export class NoteContentParser {
    /**
     * Escape HTML string to prevent XSS.
     * @param {string} str
     * @returns {string}
     */
    static escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    /**
     * Determines whether a URL or Data URL represents an image, a downloadable file, or a standard link.
     * @param {string} url
     * @returns {'image' | 'file' | 'link'}
     */
    static classifyUrl(url) {
        if (!url || typeof url !== 'string') return 'link';

        // 1. Data URLs
        if (url.startsWith('data:image/')) return 'image';
        if (url.startsWith('data:')) return 'file';

        const cleanUrl = url.split('#')[0].split('?')[0].toLowerCase();

        // 2. Image extensions or known image hosts
        if (/\.(png|jpe?g|webp|gif|svg|bmp|jfif|ico|avif|heic)$/i.test(cleanUrl)) {
            return 'image';
        }
        if (/unsplash\.com\/photos|images\.unsplash\.com|imgur\.com\/[a-zA-Z0-9]+(\.[a-z]+)?|i\.imgur\.com|media\.giphy\.com/i.test(cleanUrl)) {
            return 'image';
        }

        // 3. Document & Archive & Media extensions (File)
        if (/\.(pdf|docx?|xlsx?|pptx?|txt|csv|zip|rar|7z|tar|gz|mp3|wav|ogg|m4a|mp4|mov|webm|mkv|json|xml)$/i.test(cleanUrl)) {
            return 'file';
        }

        // 4. Default to standard web link
        return 'link';
    }

    /**
     * Extracts a user-friendly label or filename from a URL or Data URL.
     * @param {string} url
     * @param {string} defaultLabel
     * @returns {string}
     */
    static extractLabel(url, defaultLabel = '') {
        if (defaultLabel && defaultLabel.trim()) return defaultLabel.trim();
        if (!url) return 'Media';

        if (url.startsWith('data:image/')) return 'Pasted Image';
        if (url.startsWith('data:')) return 'Attached File';

        try {
            const clean = url.split('#')[0].split('?')[0];
            const parts = clean.split('/');
            const lastPart = parts.pop() || '';
            if (lastPart && lastPart.length < 60) {
                return decodeURIComponent(lastPart);
            }
            const urlObj = new URL(url);
            return urlObj.hostname + (urlObj.pathname.length > 1 ? urlObj.pathname : '');
        } catch (e) {
            return url.substring(0, 40);
        }
    }

    /**
     * Determines the appropriate Lucide icon name and badge label for a file.
     * @param {string} filenameOrUrl
     * @returns {{ icon: string, ext: string }}
     */
    static getFileInfo(filenameOrUrl = '') {
        const clean = (filenameOrUrl || '').split('#')[0].split('?')[0].toLowerCase();
        if (clean.startsWith('data:application/pdf') || /\.pdf$/i.test(clean)) return { icon: 'file-text', ext: 'PDF' };
        if (/\.(docx?|odt|rtf)$/i.test(clean)) return { icon: 'file-text', ext: 'DOC' };
        if (/\.(xlsx?|csv|ods)$/i.test(clean)) return { icon: 'file-spreadsheet', ext: 'SHEET' };
        if (/\.(pptx?|odp)$/i.test(clean)) return { icon: 'presentation', ext: 'SLIDES' };
        if (/\.(zip|rar|7z|tar|gz)$/i.test(clean)) return { icon: 'archive', ext: 'ARCHIVE' };
        if (/\.(mp3|wav|ogg|m4a)$/i.test(clean)) return { icon: 'music', ext: 'AUDIO' };
        if (/\.(mp4|mov|webm|mkv)$/i.test(clean)) return { icon: 'video', ext: 'VIDEO' };
        if (/\.(js|ts|html|css|json|py|cpp|c|php)$/i.test(clean)) return { icon: 'file-code', ext: 'CODE' };
        return { icon: 'file', ext: 'FILE' };
    }

    /**
     * Scans raw text and extracts all smart items (links, images, files).
     * @param {string} text
     * @returns {{ links: Array, images: Array, files: Array, totalCount: number }}
     */
    static parse(text = '') {
        if (!text || typeof text !== 'string') {
            return { links: [], images: [], files: [], totalCount: 0 };
        }

        const links = [];
        const images = [];
        const files = [];
        const seenUrls = new Set();

        // 1. Markdown images: ![alt](url)
        const mdImageRegex = /!\[([^\]]*)\]\(((?:data:image\/[^;]+;base64,[^\s)]+)|(?:https?:\/\/[^\s)]+))\)/gi;
        let match;
        while ((match = mdImageRegex.exec(text)) !== null) {
            const label = match[1];
            const url = match[2];
            if (!seenUrls.has(url)) {
                seenUrls.add(url);
                images.push({
                    id: 'img_' + seenUrls.size,
                    url,
                    name: this.extractLabel(url, label),
                    type: 'image'
                });
            }
        }

        // 2. Markdown links: [label](url)
        const mdLinkRegex = /\[([^\]]+)\]\(((?:data:[^;]+;base64,[^\s)]+)|(?:https?:\/\/[^\s)]+))\)/gi;
        while ((match = mdLinkRegex.exec(text)) !== null) {
            const label = match[1];
            const url = match[2];
            if (!seenUrls.has(url)) {
                seenUrls.add(url);
                const type = this.classifyUrl(url);
                const item = {
                    id: `${type}_${seenUrls.size}`,
                    url,
                    name: this.extractLabel(url, label),
                    label: label || this.extractLabel(url),
                    type
                };

                if (type === 'image') images.push(item);
                else if (type === 'file') files.push(item);
                else links.push(item);
            }
        }

        // 3. Standalone Data URLs: data:...;base64,...
        const dataUrlRegex = /(data:(?:image\/[a-zA-Z0-9.+]+|[a-zA-Z0-9.+/-]+);base64,[A-Za-z0-9+/=]+)/gi;
        while ((match = dataUrlRegex.exec(text)) !== null) {
            const url = match[1];
            if (!seenUrls.has(url)) {
                seenUrls.add(url);
                const type = this.classifyUrl(url);
                const item = {
                    id: `${type}_${seenUrls.size}`,
                    url,
                    name: this.extractLabel(url),
                    label: this.extractLabel(url),
                    type
                };

                if (type === 'image') images.push(item);
                else files.push(item);
            }
        }

        // 4. Standalone standard URLs: https?://...
        const urlRegex = /(https?:\/\/[^\s<>"'{}|\\^`[\]]+)/gi;
        while ((match = urlRegex.exec(text)) !== null) {
            let url = match[1];
            // Strip trailing punctuation often typed at end of sentence
            url = url.replace(/[.,;:)!]+$/, '');

            if (!seenUrls.has(url)) {
                seenUrls.add(url);
                const type = this.classifyUrl(url);
                const item = {
                    id: `${type}_${seenUrls.size}`,
                    url,
                    name: this.extractLabel(url),
                    label: this.extractLabel(url),
                    type
                };

                if (type === 'image') images.push(item);
                else if (type === 'file') files.push(item);
                else links.push(item);
            }
        }

        return {
            links,
            images,
            files,
            totalCount: links.length + images.length + files.length
        };
    }
}
