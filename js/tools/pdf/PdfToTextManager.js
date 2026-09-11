import { ShareUI } from '../../ui/share/ShareUI.js';
import { setupDropZone, downloadBlob } from './pdfUtils.js';

/**
 * PdfToTextManager - Extracts text from PDF documents with word/char statistics and export.
 */
export class PdfToTextManager {
    constructor() {
        this.dom = {
            txtDropZone: null,
            txtFileInput: null,
            txtCharCount: null,
            txtWordCount: null,
            txtTextarea: null,
            btnCopyTxt: null,
            btnDownloadTxt: null
        };

        this.state = {
            extractedText: ''
        };
    }

    init() {
        this.cacheDom();
        if (!this.dom.txtDropZone) return;
        this.bindEvents();
    }

    cacheDom() {
        this.dom.txtDropZone = document.getElementById('pdf-txt-drop-zone');
        this.dom.txtFileInput = document.getElementById('pdf-txt-file-input');
        this.dom.txtCharCount = document.getElementById('pdf-txt-char-count');
        this.dom.txtWordCount = document.getElementById('pdf-txt-word-count');
        this.dom.txtTextarea = document.getElementById('pdf-extracted-textarea');
        this.dom.btnCopyTxt = document.getElementById('btn-pdf-copy-txt');
        this.dom.btnDownloadTxt = document.getElementById('btn-pdf-download-txt');
    }

    bindEvents() {
        setupDropZone(this.dom.txtDropZone, this.dom.txtFileInput, (files) => {
            if (files && files.length > 0) this.handlePdfForText(files[0]);
        });

        this.dom.btnCopyTxt.onclick = () => this.copyExtractedText();
        this.dom.btnDownloadTxt.onclick = () => this.downloadExtractedText();
        this.dom.txtTextarea.oninput = () => this.updateTextCounts();
    }

    async handlePdfForText(file) {
        if (!file || (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf'))) {
            ShareUI.showToast('Invalid File', 'Please upload a valid .pdf file', 'warning');
            return;
        }

        if (!window.pdfjsLib) {
            ShareUI.showToast('PDF Engine Missing', 'PDF.js library is not available.', 'error');
            return;
        }

        ShareUI.showToast('Reading PDF', 'Extracting text content...', 'info');
        this.dom.txtTextarea.value = 'Extracting text from PDF, please wait...';

        try {
            const arrayBuffer = await file.arrayBuffer();
            const loadingTask = window.pdfjsLib.getDocument({ data: arrayBuffer });
            const doc = await loadingTask.promise;

            let fullText = '';
            for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
                const page = await doc.getPage(pageNum);
                const textContent = await page.getTextContent();
                const pageStrings = textContent.items.map(item => item.str);

                fullText += `--- Page ${pageNum} ---\n`;
                fullText += pageStrings.join(' ') + '\n\n';
            }

            this.state.extractedText = fullText.trim();
            this.dom.txtTextarea.value = this.state.extractedText;
            this.updateTextCounts();

            this.dom.btnCopyTxt.disabled = false;
            this.dom.btnDownloadTxt.disabled = false;

            ShareUI.showToast('Extracted!', `Successfully extracted text from ${doc.numPages} pages`, 'info');
        } catch (err) {
            console.error('Failed to extract text:', err);
            this.dom.txtTextarea.value = '';
            ShareUI.showToast('Error', 'Failed to extract text from PDF', 'error');
        }
    }

    updateTextCounts() {
        const text = this.dom.txtTextarea.value || '';
        const chars = text.length;
        const words = text.trim() ? text.trim().split(/\s+/).length : 0;

        this.dom.txtCharCount.textContent = `${chars.toLocaleString()} characters`;
        this.dom.txtWordCount.textContent = `${words.toLocaleString()} words`;

        this.dom.btnCopyTxt.disabled = (chars === 0);
        this.dom.btnDownloadTxt.disabled = (chars === 0);
    }

    copyExtractedText() {
        const text = this.dom.txtTextarea.value;
        if (!text) return;

        navigator.clipboard.writeText(text).then(() => {
            ShareUI.playSound('mouse-click');
            ShareUI.showToast('Copied', 'Extracted text copied to clipboard', 'info');
        }).catch(() => {
            ShareUI.showToast('Error', 'Could not copy to clipboard', 'error');
        });
    }

    downloadExtractedText() {
        const text = this.dom.txtTextarea.value;
        if (!text) return;

        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        const filename = `extracted_text_${new Date().toISOString().slice(0, 10)}.txt`;

        downloadBlob(blob, filename);

        ShareUI.playSound('mouse-click');
        ShareUI.showToast('Downloaded', 'Text file saved', 'info');
    }

    reset() {
        this.state.extractedText = '';
        this.dom.txtTextarea.value = '';
        this.updateTextCounts();
    }
}
