import { ShareUI } from '../../ui/share/ShareUI.js';
import { ShareLightbox } from '../../ui/share/ShareLightbox.js';
import { setupDropZone, downloadDataUrl } from './pdfUtils.js';

/**
 * PdfToImageManager - Extracts PDF pages to images and provides ZIP batch export.
 */
export class PdfToImageManager {
    constructor() {
        this.dom = {
            pdfDropZone: null,
            pdfFileInput: null,
            pdfDocInfoBar: null,
            pdfDocName: null,
            pdfDocPages: null,
            pdfDocSize: null,
            pdfDocControls: null,
            pdfExtractFormat: null,
            pdfExtractScale: null,
            pdfPagesStatusBadge: null,
            pdfPagesEmptyPlaceholder: null,
            pdfPagesGridMount: null,
            btnDownloadZip: null
        };

        this.state = {
            pdfFile: null,
            pdfDoc: null,
            pdfPages: [], // array of { pageNum, canvas, dataUrl, width, height, filename }
            isRenderingPdf: false
        };
    }

    init() {
        this.cacheDom();
        if (!this.dom.pdfDropZone) return;
        this.bindEvents();
    }

    cacheDom() {
        this.dom.pdfDropZone = document.getElementById('pdf-file-drop-zone');
        this.dom.pdfFileInput = document.getElementById('pdf-file-input');
        this.dom.pdfDocInfoBar = document.getElementById('pdf-doc-info-bar');
        this.dom.pdfDocName = document.getElementById('pdf-doc-name');
        this.dom.pdfDocPages = document.getElementById('pdf-doc-pages');
        this.dom.pdfDocSize = document.getElementById('pdf-doc-size');
        this.dom.pdfDocControls = document.getElementById('pdf-doc-controls');
        this.dom.pdfExtractFormat = document.getElementById('pdf-extract-format');
        this.dom.pdfExtractScale = document.getElementById('pdf-extract-scale');
        this.dom.pdfPagesStatusBadge = document.getElementById('pdf-pages-status-badge');
        this.dom.pdfPagesEmptyPlaceholder = document.getElementById('pdf-pages-empty-placeholder');
        this.dom.pdfPagesGridMount = document.getElementById('pdf-pages-grid-mount');
        this.dom.btnDownloadZip = document.getElementById('btn-pdf-download-zip');
    }

    bindEvents() {
        setupDropZone(this.dom.pdfDropZone, this.dom.pdfFileInput, (files) => {
            if (files && files.length > 0) this.handlePdfDocument(files[0]);
        });

        this.dom.btnDownloadZip.onclick = () => this.downloadAllPagesAsZip();

        if (this.dom.pdfExtractFormat) {
            this.dom.pdfExtractFormat.onchange = () => this.reRenderPdfPages();
        }
        if (this.dom.pdfExtractScale) {
            this.dom.pdfExtractScale.onchange = () => this.reRenderPdfPages();
        }
    }

    async handlePdfDocument(file) {
        if (!file || (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf'))) {
            ShareUI.showToast('Invalid File', 'Please upload a valid .pdf file', 'warning');
            return;
        }

        if (!window.pdfjsLib) {
            ShareUI.showToast('PDF Engine Missing', 'PDF.js library is not available. Check connection.', 'error');
            return;
        }

        this.state.pdfFile = file;
        this.dom.pdfDocName.textContent = file.name;
        this.dom.pdfDocSize.textContent = ShareUI.formatSize(file.size);
        this.dom.pdfDocInfoBar.classList.remove('hidden');
        this.dom.pdfDocControls.classList.remove('hidden');
        this.dom.pdfPagesStatusBadge.textContent = 'Loading PDF...';

        try {
            const arrayBuffer = await file.arrayBuffer();
            const loadingTask = window.pdfjsLib.getDocument({ data: arrayBuffer });
            this.state.pdfDoc = await loadingTask.promise;

            this.dom.pdfDocPages.textContent = `${this.state.pdfDoc.numPages} pages`;
            this.renderPdfPages();
        } catch (err) {
            console.error('Failed to load PDF:', err);
            ShareUI.showToast('Error', 'Unable to parse PDF document', 'error');
            this.dom.pdfPagesStatusBadge.textContent = 'Failed to load';
        }
    }

    reRenderPdfPages() {
        if (this.state.pdfDoc) {
            this.renderPdfPages();
        }
    }

    async renderPdfPages() {
        if (!this.state.pdfDoc || this.state.isRenderingPdf) return;

        this.state.isRenderingPdf = true;
        this.state.pdfPages = [];
        const numPages = this.state.pdfDoc.numPages;

        this.dom.pdfPagesEmptyPlaceholder.classList.add('hidden');
        this.dom.pdfPagesGridMount.classList.remove('hidden');
        this.dom.pdfPagesGridMount.innerHTML = '';
        this.dom.btnDownloadZip.disabled = true;

        const scale = parseFloat(this.dom.pdfExtractScale.value) || 1.5;
        const format = this.dom.pdfExtractFormat.value || 'image/png';
        const ext = format === 'image/jpeg' ? 'jpg' : 'png';

        this.dom.pdfPagesStatusBadge.textContent = `Rendering (0/${numPages})...`;

        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
            this.dom.pdfPagesStatusBadge.textContent = `Rendering page ${pageNum}/${numPages}...`;

            try {
                const page = await this.state.pdfDoc.getPage(pageNum);
                const viewport = page.getViewport({ scale });

                const canvas = document.createElement('canvas');
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                const ctx = canvas.getContext('2d');

                await page.render({ canvasContext: ctx, viewport }).promise;

                const dataUrl = canvas.toDataURL(format, 0.92);
                this.state.pdfPages.push({
                    pageNum,
                    canvas,
                    dataUrl,
                    width: Math.round(viewport.width),
                    height: Math.round(viewport.height),
                    filename: `page_${String(pageNum).padStart(2, '0')}.${ext}`
                });

                const card = document.createElement('div');
                card.className = 'p-3.5 bg-slate-950/60 rounded-2xl flex flex-col gap-3 group hover:bg-slate-950/90 transition-all';
                card.innerHTML = `
                    <div class="page-thumb-container w-full aspect-[3/4] bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center p-1 cursor-zoom-in group/thumb relative" title="Click to view fullscreen">
                        <img src="${dataUrl}" alt="Page ${pageNum}" class="size-full object-contain rounded-lg shadow-md transition-transform group-hover/thumb:scale-[1.02]">
                        <div class="absolute inset-0 bg-slate-950/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center pointer-events-none rounded-xl">
                            <span class="px-2.5 py-1 rounded-full bg-slate-900/90 text-cyan-300 text-[10px] font-mono font-bold flex items-center gap-1.5 shadow-lg">
                                <i data-lucide="zoom-in" class="size-3.5"></i> Preview
                            </span>
                        </div>
                    </div>
                    <div class="flex items-center justify-between pt-1">
                        <div>
                            <span class="text-xs font-mono font-bold text-slate-200 tabular-nums">Page ${pageNum}</span>
                            <p class="text-[10px] font-mono text-slate-500 tabular-nums">${Math.round(viewport.width)} × ${Math.round(viewport.height)}</p>
                        </div>
                        <div class="flex items-center gap-1">
                            <button type="button" class="btn-preview-page size-8 rounded-lg flex items-center justify-center bg-slate-800/60 hover:bg-cyan-600 text-slate-300 hover:text-white transition-all cursor-pointer" title="Preview Page ${pageNum}">
                                <i data-lucide="maximize-2" class="size-3.5"></i>
                            </button>
                            <button type="button" class="btn-download-page size-8 rounded-lg flex items-center justify-center bg-slate-800/60 hover:bg-cyan-600 text-slate-300 hover:text-white transition-all cursor-pointer" title="Download Page ${pageNum}">
                                <i data-lucide="download" class="size-3.5"></i>
                            </button>
                        </div>
                    </div>
                `;

                const openPreview = () => {
                    ShareUI.playSound('mouse-click');
                    ShareLightbox.showImageModal(dataUrl, `Page ${pageNum} of ${numPages} - ${this.dom.pdfDocName.textContent}`);
                };

                card.querySelector('.page-thumb-container').onclick = openPreview;
                card.querySelector('.btn-preview-page').onclick = openPreview;

                card.querySelector('.btn-download-page').onclick = (e) => {
                    e.stopPropagation();
                    ShareUI.playSound('mouse-click');
                    downloadDataUrl(dataUrl, `page_${String(pageNum).padStart(2, '0')}.${ext}`);
                };

                this.dom.pdfPagesGridMount.appendChild(card);
            } catch (err) {
                console.error(`Error rendering page ${pageNum}:`, err);
            }
        }

        this.state.isRenderingPdf = false;
        this.dom.pdfPagesStatusBadge.textContent = `${numPages} pages ready`;
        this.dom.btnDownloadZip.disabled = this.state.pdfPages.length === 0;

        if (window.lucide) window.lucide.createIcons();
    }

    async downloadAllPagesAsZip() {
        if (this.state.pdfPages.length === 0) return;

        if (!window.JSZip) {
            ShareUI.showToast('ZIP Library Missing', 'JSZip library not available', 'error');
            return;
        }

        ShareUI.showToast('Packaging ZIP', 'Compressing pages into ZIP archive...', 'info');
        this.dom.btnDownloadZip.disabled = true;

        try {
            const zip = new window.JSZip();
            const format = this.dom.pdfExtractFormat.value || 'image/png';
            const ext = format === 'image/jpeg' ? 'jpg' : 'png';

            for (const pageItem of this.state.pdfPages) {
                const base64Data = pageItem.dataUrl.split(',')[1];
                zip.file(`page_${String(pageItem.pageNum).padStart(2, '0')}.${ext}`, base64Data, { base64: true });
            }

            const zipBlob = await zip.generateAsync({ type: 'blob' });
            const zipUrl = URL.createObjectURL(zipBlob);

            const a = document.createElement('a');
            a.href = zipUrl;
            a.download = `extracted_pdf_pages_${new Date().toISOString().slice(0, 10)}.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(zipUrl);
        } catch (err) {
            console.error('Failed to create ZIP:', err);
            ShareUI.showToast('Error', 'Failed to generate ZIP archive', 'error');
        } finally {
            this.dom.btnDownloadZip.disabled = false;
        }
    }

    reset() {
        this.state.pdfFile = null;
        this.state.pdfDoc = null;
        this.state.pdfPages = [];
        this.state.isRenderingPdf = false;

        this.dom.pdfDocInfoBar.classList.add('hidden');
        this.dom.pdfDocControls.classList.add('hidden');
        this.dom.pdfPagesGridMount.classList.add('hidden');
        this.dom.pdfPagesGridMount.innerHTML = '';
        this.dom.pdfPagesEmptyPlaceholder.classList.remove('hidden');
        this.dom.pdfPagesStatusBadge.textContent = 'Waiting for PDF';
        this.dom.btnDownloadZip.disabled = true;
    }
}
