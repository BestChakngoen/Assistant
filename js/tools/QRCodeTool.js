import { ShareUI } from '../ui/share/ShareUI.js';

/**
 * QRCodeTool - Handles URL/Text to QR Code conversion, realtime preview, and PNG downloading.
 */
export class QRCodeTool {
    constructor() {
        this.currentSize = 256;
        this.dom = {
            input: null,
            charCount: null,
            statusBadge: null,
            emptyPlaceholder: null,
            codeWrapper: null,
            qrOutput: null,
            sizeSlider: null,
            sizeBadge: null,
            presetBtns: null,
            btnDownload: null,
            btnCopyLink: null,
            btnClear: null
        };
    }

    init() {
        this.dom.input = document.getElementById('qr-text-input');
        this.dom.charCount = document.getElementById('qr-char-count');
        this.dom.statusBadge = document.getElementById('qr-status-badge');
        this.dom.emptyPlaceholder = document.getElementById('qr-empty-placeholder');
        this.dom.codeWrapper = document.getElementById('qr-code-wrapper');
        this.dom.qrOutput = document.getElementById('qr-code-output');
        this.dom.sizeSlider = document.getElementById('qr-size-slider');
        this.dom.sizeBadge = document.getElementById('qr-size-badge');
        this.dom.presetBtns = document.querySelectorAll('.btn-qr-size-preset');
        this.dom.btnDownload = document.getElementById('btn-qr-download');
        this.dom.btnCopyLink = document.getElementById('btn-qr-copy-link');
        this.dom.btnClear = document.getElementById('btn-qr-clear');

        if (!this.dom.input || !this.dom.qrOutput) return;

        this.bindEvents();
        if (window.lucide && typeof window.lucide.createIcons === 'function') {
            window.lucide.createIcons();
        }
    }

    bindEvents() {
        // Realtime input listener
        this.dom.input.addEventListener('input', () => {
            this.generate(this.dom.input.value);
        });

        // Size slider listener
        if (this.dom.sizeSlider) {
            this.dom.sizeSlider.addEventListener('input', (e) => {
                this.setSize(parseInt(e.target.value, 10));
            });
        }

        // Quick size preset buttons
        if (this.dom.presetBtns) {
            this.dom.presetBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    const size = parseInt(btn.dataset.qrSize, 10);
                    if (size) this.setSize(size);
                });
            });
        }

        // Clear button
        if (this.dom.btnClear) {
            this.dom.btnClear.addEventListener('click', () => this.clear());
        }

        // Download button
        if (this.dom.btnDownload) {
            this.dom.btnDownload.addEventListener('click', () => this.downloadQRCode());
        }

        // Copy link button
        if (this.dom.btnCopyLink) {
            this.dom.btnCopyLink.addEventListener('click', () => this.copyLink());
        }
    }

    /**
     * Sets QR code output resolution (width & height in px)
     */
    setSize(size) {
        this.currentSize = Math.max(128, Math.min(1024, size));
        if (this.dom.sizeSlider) this.dom.sizeSlider.value = this.currentSize;
        if (this.dom.sizeBadge) this.dom.sizeBadge.textContent = `${this.currentSize} × ${this.currentSize} px`;

        // Update active preset button highlighting
        if (this.dom.presetBtns) {
            this.dom.presetBtns.forEach(btn => {
                const btnSize = parseInt(btn.dataset.qrSize, 10);
                if (btnSize === this.currentSize) {
                    btn.className = 'btn-qr-size-preset btn-press px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all bg-cyan-500/20 text-cyan-300 font-bold shadow-[0_0_8px_rgba(6,182,212,0.2)]';
                } else {
                    btn.className = 'btn-qr-size-preset btn-press px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all bg-slate-800/40 hover:bg-slate-800 text-slate-400 hover:text-slate-200';
                }
            });
        }

        // Re-generate QR Code dynamically if text exists
        const text = (this.dom.input?.value || '').trim();
        if (text) {
            this.generate(text);
        }
    }

    generate(rawText) {
        const text = (rawText || '').trim();

        // Update character count
        if (this.dom.charCount) {
            this.dom.charCount.textContent = `${text.length} characters`;
        }

        // Empty State Handling
        if (!text) {
            if (this.dom.qrOutput) this.dom.qrOutput.innerHTML = '';
            if (this.dom.emptyPlaceholder) this.dom.emptyPlaceholder.classList.remove('hidden');
            if (this.dom.codeWrapper) this.dom.codeWrapper.classList.add('hidden');
            if (this.dom.btnDownload) this.dom.btnDownload.disabled = true;
            if (this.dom.btnCopyLink) this.dom.btnCopyLink.disabled = true;

            if (this.dom.statusBadge) {
                this.dom.statusBadge.textContent = 'Waiting for input';
                this.dom.statusBadge.className = 'px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800/60 text-slate-400';
            }
            return;
        }

        // Active State
        if (this.dom.emptyPlaceholder) this.dom.emptyPlaceholder.classList.add('hidden');
        if (this.dom.codeWrapper) {
            this.dom.codeWrapper.classList.remove('hidden');
            this.dom.codeWrapper.classList.add('flex');
        }
        if (this.dom.btnDownload) this.dom.btnDownload.disabled = false;
        if (this.dom.btnCopyLink) this.dom.btnCopyLink.disabled = false;

        if (this.dom.statusBadge) {
            this.dom.statusBadge.textContent = 'Ready';
            this.dom.statusBadge.className = 'px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400';
        }

        // Render QR Code with QRCode.js
        if (this.dom.qrOutput) {
            this.dom.qrOutput.innerHTML = '';
            if (typeof window !== 'undefined' && window.QRCode) {
                try {
                    new window.QRCode(this.dom.qrOutput, {
                        text: text,
                        width: this.currentSize,
                        height: this.currentSize,
                        colorDark: "#080b11",
                        colorLight: "#ffffff",
                        correctLevel: window.QRCode.CorrectLevel.H
                    });
                } catch (e) {
                    console.error('QRCode generation failed:', e);
                    this.dom.qrOutput.innerHTML = '<span class="text-xs text-red-400 p-4">QR Generation Error</span>';
                }
            } else {
                this.dom.qrOutput.innerHTML = '<span class="text-xs text-slate-500 p-4 font-mono">QRCode.js is not loaded</span>';
            }
        }
    }

    downloadQRCode() {
        const text = (this.dom.input?.value || '').trim();
        if (!text) {
            ShareUI.showToast('Notice', 'Please enter a URL or text before downloading', 'error');
            return;
        }

        const canvas = this.dom.qrOutput?.querySelector('canvas');
        const img = this.dom.qrOutput?.querySelector('img');

        let srcCanvas = canvas;
        if (!srcCanvas && img && img.complete) {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = img.naturalWidth || this.currentSize;
            tempCanvas.height = img.naturalHeight || this.currentSize;
            const ctx = tempCanvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            srcCanvas = tempCanvas;
        }

        if (!srcCanvas) {
            ShareUI.showToast('Error', 'QR code image not found. Please try again', 'error');
            return;
        }

        try {
            // Proportional quiet zone padding for optimal scanner readability (~8% margin)
            const padding = Math.max(16, Math.round(this.currentSize * 0.08));
            const downloadCanvas = document.createElement('canvas');
            downloadCanvas.width = srcCanvas.width + (padding * 2);
            downloadCanvas.height = srcCanvas.height + (padding * 2);
            const ctx = downloadCanvas.getContext('2d');
            
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, downloadCanvas.width, downloadCanvas.height);
            ctx.drawImage(srcCanvas, padding, padding);

            const dataUrl = downloadCanvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = `qrcode_${this.currentSize}x${this.currentSize}_${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            console.error('Download QR Code error:', err);
            ShareUI.showToast('Error', 'An error occurred while downloading the QR code', 'error');
        }
    }

    copyLink() {
        const text = (this.dom.input?.value || '').trim();
        if (!text) return;

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text)
                .then(() => {
                    ShareUI.showToast('Copied', 'Link copied to clipboard', 'success');
                })
                .catch(() => {
                    this.fallbackCopy(text);
                });
        } else {
            this.fallbackCopy(text);
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
            ShareUI.showToast('Copied', 'Link copied to clipboard', 'success');
        } catch (e) {
            ShareUI.showToast('Error', 'Failed to copy to clipboard', 'error');
        }
        document.body.removeChild(ta);
    }

    clear() {
        if (this.dom.input) {
            this.dom.input.value = '';
            this.generate('');
            this.dom.input.focus();
        }
    }
}
