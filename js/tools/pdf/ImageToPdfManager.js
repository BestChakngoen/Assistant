import { ShareUI } from '../../ui/share/ShareUI.js';
import { ShareLightbox } from '../../ui/share/ShareLightbox.js';
import { setupDropZone } from './pdfUtils.js';
import { PdfGeometry } from './PdfGeometry.js';

/**
 * ImageToPdfManager - Manages multi-image to PDF generation and live interactive preview.
 */
export class ImageToPdfManager {
    constructor() {
        this.dom = {
            imgDropZone: null,
            imgFileInput: null,
            imgSettingSize: null,
            imgSettingOrientation: null,
            imgSettingMargin: null,
            imgSettingQuality: null,
            imgCountBadge: null,
            imgEmptyPlaceholder: null,
            imgListMount: null,

            pdfPreviewNav: null,
            btnPdfPrevPage: null,
            btnPdfNextPage: null,
            pdfPreviewPageIndicator: null,
            pdfPreviewStatusBadge: null,
            pdfPreviewEmptyPlaceholder: null,
            pdfPreviewActiveContainer: null,
            pdfPreviewCanvas: null,
            pdfPreviewDimensions: null,
            pdfPreviewPageCount: null,
            btnPdfFullscreenPreview: null,
            btnGeneratePdf: null
        };

        this.state = {
            images: [], // array of { id, file, name, size, width, height, dataUrl, imgElement }
            previewPageIndex: 0,
            previewDebounceTimer: null
        };
    }

    init() {
        this.cacheDom();
        if (!this.dom.imgDropZone) return;
        this.bindEvents();
    }

    cacheDom() {
        this.dom.imgDropZone = document.getElementById('pdf-img-drop-zone');
        this.dom.imgFileInput = document.getElementById('pdf-img-file-input');
        this.dom.imgSettingSize = document.getElementById('pdf-setting-size');
        this.dom.imgSettingOrientation = document.getElementById('pdf-setting-orientation');
        this.dom.imgSettingMargin = document.getElementById('pdf-setting-margin');
        this.dom.imgSettingQuality = document.getElementById('pdf-setting-quality');
        this.dom.imgCountBadge = document.getElementById('pdf-img-count-badge');
        this.dom.imgEmptyPlaceholder = document.getElementById('pdf-img-empty-placeholder');
        this.dom.imgListMount = document.getElementById('pdf-img-list-mount');

        this.dom.pdfPreviewNav = document.getElementById('pdf-preview-nav');
        this.dom.btnPdfPrevPage = document.getElementById('btn-pdf-prev-page');
        this.dom.btnPdfNextPage = document.getElementById('btn-pdf-next-page');
        this.dom.pdfPreviewPageIndicator = document.getElementById('pdf-preview-page-indicator');
        this.dom.pdfPreviewStatusBadge = document.getElementById('pdf-preview-status-badge');
        this.dom.pdfPreviewEmptyPlaceholder = document.getElementById('pdf-preview-empty-placeholder');
        this.dom.pdfPreviewActiveContainer = document.getElementById('pdf-preview-active-container');
        this.dom.pdfPreviewCanvas = document.getElementById('pdf-preview-canvas');
        this.dom.pdfPreviewDimensions = document.getElementById('pdf-preview-dimensions');
        this.dom.pdfPreviewPageCount = document.getElementById('pdf-preview-page-count');
        this.dom.btnPdfFullscreenPreview = document.getElementById('btn-pdf-fullscreen-preview');
        this.dom.btnGeneratePdf = document.getElementById('btn-pdf-generate');
    }

    bindEvents() {
        setupDropZone(this.dom.imgDropZone, this.dom.imgFileInput, (files) => this.handleImageFiles(files));
        this.dom.btnGeneratePdf.onclick = () => this.generatePdf();

        if (this.dom.btnPdfPrevPage) {
            this.dom.btnPdfPrevPage.onclick = () => this.navigatePreviewPage(-1);
        }
        if (this.dom.btnPdfNextPage) {
            this.dom.btnPdfNextPage.onclick = () => this.navigatePreviewPage(1);
        }
        if (this.dom.btnPdfFullscreenPreview) {
            this.dom.btnPdfFullscreenPreview.onclick = () => this.openFullscreenPdfPreview();
        }
        if (this.dom.pdfPreviewCanvas) {
            this.dom.pdfPreviewCanvas.onclick = () => this.openFullscreenPdfPreview();
        }

        [this.dom.imgSettingSize, this.dom.imgSettingOrientation, this.dom.imgSettingMargin, this.dom.imgSettingQuality].forEach(el => {
            if (el) el.onchange = () => this.schedulePreviewUpdate();
        });
    }

    async handleImageFiles(files) {
        const imageFiles = files.filter(f => f.type.startsWith('image/'));
        if (imageFiles.length === 0) {
            ShareUI.showToast('Invalid File', 'Please select valid image files (JPG, PNG, WEBP, etc.)', 'warning');
            return;
        }

        for (const file of imageFiles) {
            try {
                const item = await this.readImageFile(file);
                this.state.images.push(item);
            } catch (err) {
                console.error('Failed to read image:', file.name, err);
            }
        }

        this.renderImagesList();
        this.schedulePreviewUpdate();
    }

    readImageFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const dataUrl = e.target.result;
                const img = new Image();
                img.onload = () => {
                    resolve({
                        id: 'img_' + Math.random().toString(36).substring(2, 9),
                        file,
                        name: file.name,
                        size: file.size,
                        width: img.naturalWidth || img.width,
                        height: img.naturalHeight || img.height,
                        dataUrl,
                        imgElement: img
                    });
                };
                img.onerror = () => reject(new Error('Image failed to decode'));
                img.src = dataUrl;
            };
            reader.onerror = () => reject(new Error('File read failed'));
            reader.readAsDataURL(file);
        });
    }

    renderImagesList() {
        const total = this.state.images.length;
        this.dom.imgCountBadge.textContent = `${total} image${total !== 1 ? 's' : ''} selected`;

        if (total === 0) {
            this.dom.imgEmptyPlaceholder.classList.remove('hidden');
            this.dom.imgListMount.classList.add('hidden');
            return;
        }

        this.dom.imgEmptyPlaceholder.classList.add('hidden');
        this.dom.imgListMount.classList.remove('hidden');

        this.dom.imgListMount.innerHTML = this.state.images.map((img, idx) => `
            <div class="pdf-queue-card relative flex items-center justify-between p-3.5 bg-slate-950/60 rounded-2xl gap-3 border border-transparent hover:border-slate-800/80 transition-all select-none" data-index="${idx}">
                <div class="flex items-center gap-3 min-w-0 flex-1">
                    <i data-lucide="grip-vertical" class="w-4 h-4 text-slate-500 hover:text-cyan-400 cursor-grab active:cursor-grabbing pdf-drag-handle shrink-0 transition" title="Press & drag 6 dots to reorder"></i>
                    <span class="size-7 rounded-xl bg-slate-900 flex items-center justify-center font-mono font-bold text-xs text-cyan-400 tabular-nums shrink-0">
                        ${idx + 1}
                    </span>
                    <div class="img-queue-thumb size-12 rounded-xl bg-slate-900 overflow-hidden flex items-center justify-center shrink-0 cursor-zoom-in hover:ring-2 hover:ring-cyan-500/50 transition-all" data-index="${idx}" title="Click to view full image">
                        <img src="${img.dataUrl}" alt="${img.name}" class="size-full object-cover pointer-events-none">
                    </div>
                    <div class="min-w-0 flex-1">
                        <p class="text-xs font-mono font-bold text-slate-200 truncate" title="${img.name}">${img.name}</p>
                        <div class="flex items-center gap-2 text-[10px] font-mono text-slate-500 mt-0.5">
                            <span class="tabular-nums">${img.width} × ${img.height} px</span>
                            <span class="size-1 rounded-full bg-slate-700"></span>
                            <span class="tabular-nums">${ShareUI.formatSize(img.size)}</span>
                        </div>
                    </div>
                </div>
                <div class="flex items-center gap-1 shrink-0">
                    <button type="button" data-action="delete" data-index="${idx}" class="size-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer" title="Remove Image">
                        <i data-lucide="trash-2" class="size-4"></i>
                    </button>
                </div>
            </div>
        `).join('');

        this.dom.imgListMount.querySelectorAll('button[data-action="delete"]').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const index = parseInt(btn.dataset.index, 10);
                this.removeImage(index);
            };
        });

        this.dom.imgListMount.querySelectorAll('.img-queue-thumb').forEach(thumb => {
            thumb.onclick = (e) => {
                e.stopPropagation();
                const idx = parseInt(thumb.dataset.index, 10);
                const img = this.state.images[idx];
                if (img) {
                    ShareLightbox.showImageModal(img.dataUrl, img.name);
                }
            };
        });

        const cards = this.dom.imgListMount.querySelectorAll('.pdf-queue-card');
        cards.forEach((card, index) => {
            this.attachQueueDragListeners(card, index);
        });

        if (window.lucide) window.lucide.createIcons();
    }

    attachQueueDragListeners(card, index) {
        const onPointerStart = (e) => {
            if (!e.target.closest('.pdf-drag-handle')) return;
            e.preventDefault();

            const startY = e.touches ? e.touches[0].clientY : e.clientY;
            let draggedIndex = index;
            let currentTargetIdx = index;
            const itemHeight = (card.offsetHeight || 76) + 12;
            const total = this.state.images.length;

            card.classList.add('is-dragging');
            card.style.transform = 'translateY(0px) scale(0.95)';

            ShareUI.playSound('mouse-click');
            if (navigator.vibrate) navigator.vibrate(30);

            const onPointerMove = (moveEvt) => {
                if (draggedIndex === null) return;
                const currentY = moveEvt.touches ? moveEvt.touches[0].clientY : moveEvt.clientY;
                const deltaY = currentY - startY;

                card.style.transform = `translateY(${deltaY}px) scale(0.95)`;

                const slotOffset = Math.round(deltaY / itemHeight);
                const newTargetIdx = Math.max(0, Math.min(total - 1, index + slotOffset));

                if (newTargetIdx !== currentTargetIdx) {
                    currentTargetIdx = newTargetIdx;
                }
                this.updateOtherQueueCardsShift(index, currentTargetIdx, itemHeight);
            };

            const onPointerEnd = () => {
                window.removeEventListener('mousemove', onPointerMove);
                window.removeEventListener('mouseup', onPointerEnd);
                window.removeEventListener('touchmove', onPointerMove);
                window.removeEventListener('touchend', onPointerEnd);

                if (draggedIndex === null) return;

                const sourceIdx = draggedIndex;
                const targetIdx = currentTargetIdx;

                card.classList.remove('is-dragging');
                card.classList.add('is-dropping');
                const finalDeltaY = (targetIdx - sourceIdx) * itemHeight;
                card.style.transform = `translateY(${finalDeltaY}px) scale(1)`;

                setTimeout(() => {
                    this.clearQueueDragShiftAnimation();
                    draggedIndex = null;
                    if (sourceIdx !== targetIdx) {
                        this.reorderImages(sourceIdx, targetIdx);
                    }
                }, 180);
            };

            window.addEventListener('mousemove', onPointerMove, { passive: false });
            window.addEventListener('mouseup', onPointerEnd, { passive: false });
            window.addEventListener('touchmove', onPointerMove, { passive: false });
            window.addEventListener('touchend', onPointerEnd, { passive: false });
        };

        card.addEventListener('mousedown', onPointerStart);
        card.addEventListener('touchstart', onPointerStart, { passive: false });
    }

    updateOtherQueueCardsShift(sourceIdx, targetIdx, itemHeight = 88) {
        const container = this.dom.imgListMount;
        if (!container || sourceIdx === null || sourceIdx === undefined) return;

        const cards = Array.from(container.querySelectorAll('.pdf-queue-card'));

        cards.forEach((c) => {
            const idx = parseInt(c.dataset.index, 10);
            if (isNaN(idx) || idx === sourceIdx) return;

            if (sourceIdx < targetIdx) {
                if (idx > sourceIdx && idx <= targetIdx) {
                    c.style.transform = `translateY(-${itemHeight}px)`;
                } else {
                    c.style.transform = 'translateY(0)';
                }
            } else if (sourceIdx > targetIdx) {
                if (idx >= targetIdx && idx < sourceIdx) {
                    c.style.transform = `translateY(${itemHeight}px)`;
                } else {
                    c.style.transform = 'translateY(0)';
                }
            } else {
                c.style.transform = 'translateY(0)';
            }
        });
    }

    clearQueueDragShiftAnimation() {
        const container = this.dom.imgListMount;
        if (!container) return;
        container.querySelectorAll('.pdf-queue-card').forEach(c => {
            c.style.transform = '';
            c.classList.remove('is-dragging', 'is-dropping');
        });
    }

    reorderImages(fromIndex, toIndex) {
        if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return;
        if (fromIndex >= this.state.images.length || toIndex >= this.state.images.length) return;

        const [movedItem] = this.state.images.splice(fromIndex, 1);
        this.state.images.splice(toIndex, 0, movedItem);

        if (this.state.previewPageIndex === fromIndex) {
            this.state.previewPageIndex = toIndex;
        } else if (fromIndex < this.state.previewPageIndex && toIndex >= this.state.previewPageIndex) {
            this.state.previewPageIndex--;
        } else if (fromIndex > this.state.previewPageIndex && toIndex <= this.state.previewPageIndex) {
            this.state.previewPageIndex++;
        }

        ShareUI.playSound('mouse-click');
        this.renderImagesList();
        this.schedulePreviewUpdate();
    }

    removeImage(index) {
        this.state.images.splice(index, 1);
        ShareUI.playSound('mouse-click');
        this.renderImagesList();
        this.schedulePreviewUpdate();
    }

    schedulePreviewUpdate() {
        if (this.state.previewDebounceTimer) {
            clearTimeout(this.state.previewDebounceTimer);
        }
        this.state.previewDebounceTimer = setTimeout(() => {
            this.updatePdfPreview();
        }, 120);
    }

    navigatePreviewPage(delta) {
        const total = this.state.images.length;
        if (total === 0) return;
        const target = this.state.previewPageIndex + delta;
        if (target >= 0 && target < total) {
            this.state.previewPageIndex = target;
            ShareUI.playSound('mouse-click');
            this.updatePdfPreview();
        }
    }

    updatePdfPreview() {
        const total = this.state.images.length;

        if (total === 0) {
            this.dom.pdfPreviewEmptyPlaceholder.classList.remove('hidden');
            this.dom.pdfPreviewActiveContainer.classList.add('hidden');
            this.dom.pdfPreviewNav.classList.add('hidden');
            this.dom.pdfPreviewStatusBadge.textContent = 'Waiting for images';
            this.dom.btnPdfFullscreenPreview.disabled = true;
            this.dom.btnGeneratePdf.disabled = true;
            return;
        }

        if (this.state.previewPageIndex >= total) {
            this.state.previewPageIndex = total - 1;
        }
        if (this.state.previewPageIndex < 0) {
            this.state.previewPageIndex = 0;
        }

        const idx = this.state.previewPageIndex;
        const img = this.state.images[idx];
        if (!img) return;

        this.dom.pdfPreviewEmptyPlaceholder.classList.add('hidden');
        this.dom.pdfPreviewActiveContainer.classList.remove('hidden');
        this.dom.btnPdfFullscreenPreview.disabled = false;
        this.dom.btnGeneratePdf.disabled = false;

        const pageSizeSetting = this.dom.imgSettingSize.value;
        const orientationSetting = this.dom.imgSettingOrientation.value;
        const marginMm = parseInt(this.dom.imgSettingMargin.value, 10) || 0;

        const layout = PdfGeometry.calculatePageLayout({
            pageSizeSetting,
            orientationSetting,
            marginMm,
            imgWidth: img.width,
            imgHeight: img.height
        });

        const canvas = this.dom.pdfPreviewCanvas;
        const renderScale = 1100 / layout.pageHeightMm;
        canvas.width = Math.round(layout.pageWidthMm * renderScale);
        canvas.height = Math.round(layout.pageHeightMm * renderScale);

        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.drawImage(
            img.imgElement,
            Math.round(layout.drawX * renderScale),
            Math.round(layout.drawY * renderScale),
            Math.round(layout.drawW * renderScale),
            Math.round(layout.drawH * renderScale)
        );

        this.dom.pdfPreviewDimensions.textContent = `${layout.formatLabel} ${layout.orientation === 'l' ? 'Landscape' : 'Portrait'} (${Math.round(layout.pageWidthMm)} × ${Math.round(layout.pageHeightMm)} mm)`;
        this.dom.pdfPreviewPageCount.textContent = `Page ${idx + 1} of ${total}`;
        this.dom.pdfPreviewStatusBadge.textContent = `Ready (${total} page${total !== 1 ? 's' : ''})`;

        if (total > 1) {
            this.dom.pdfPreviewNav.classList.remove('hidden');
            this.dom.pdfPreviewNav.classList.add('flex');
            this.dom.pdfPreviewPageIndicator.textContent = `Page ${idx + 1} / ${total}`;
            this.dom.btnPdfPrevPage.disabled = (idx === 0);
            this.dom.btnPdfNextPage.disabled = (idx === total - 1);
        } else {
            this.dom.pdfPreviewNav.classList.add('hidden');
            this.dom.pdfPreviewNav.classList.remove('flex');
        }

        if (window.lucide) window.lucide.createIcons();
    }

    openFullscreenPdfPreview() {
        if (!this.dom.pdfPreviewCanvas) return;
        ShareUI.playSound('mouse-click');
        const dataUrl = this.dom.pdfPreviewCanvas.toDataURL('image/png');
        const pageNum = this.state.previewPageIndex + 1;
        const total = this.state.images.length;
        ShareLightbox.showImageModal(dataUrl, `PDF Document Preview - Page ${pageNum} of ${total}`);
    }

    async generatePdf() {
        if (this.state.images.length === 0) return;

        if (!window.jspdf || !window.jspdf.jsPDF) {
            ShareUI.showToast('Library Missing', 'jsPDF library is not loaded. Please check connection.', 'error');
            return;
        }

        const { jsPDF } = window.jspdf;
        const pageSizeSetting = this.dom.imgSettingSize.value;
        const orientationSetting = this.dom.imgSettingOrientation.value;
        const marginMm = parseInt(this.dom.imgSettingMargin.value, 10) || 0;
        const quality = parseFloat(this.dom.imgSettingQuality.value) || 0.85;

        ShareUI.showToast('Building PDF', 'Generating document pages...', 'info');
        this.dom.btnGeneratePdf.disabled = true;
        this.dom.btnGeneratePdf.innerHTML = `<i data-lucide="loader-2" class="size-4 animate-spin"></i><span>GENERATING PDF...</span>`;
        if (window.lucide) window.lucide.createIcons();

        try {
            let doc = null;

            for (let i = 0; i < this.state.images.length; i++) {
                const img = this.state.images[i];

                const layout = PdfGeometry.calculatePageLayout({
                    pageSizeSetting,
                    orientationSetting,
                    marginMm,
                    imgWidth: img.width,
                    imgHeight: img.height
                });

                const docOptions = {
                    orientation: layout.orientation,
                    unit: 'mm',
                    format: pageSizeSetting === 'fit' ? [layout.pageWidthMm, layout.pageHeightMm] : pageSizeSetting
                };

                if (i === 0) {
                    doc = new jsPDF(docOptions);
                } else {
                    doc.addPage(pageSizeSetting === 'fit' ? [layout.pageWidthMm, layout.pageHeightMm] : pageSizeSetting, layout.orientation);
                }

                const finalImgData = PdfGeometry.getProcessedImageData(img, quality);
                doc.addImage(finalImgData, 'JPEG', layout.drawX, layout.drawY, layout.drawW, layout.drawH, undefined, 'FAST');
            }

            const timestamp = new Date().toISOString().slice(0, 10);
            doc.save(`converted_document_${timestamp}.pdf`);
        } catch (err) {
            console.error('PDF Generation failed:', err);
            ShareUI.showToast('Error', 'Failed to generate PDF document', 'error');
        } finally {
            this.dom.btnGeneratePdf.disabled = false;
            this.dom.btnGeneratePdf.innerHTML = `<i data-lucide="file-down" class="size-4"></i><span>DOWNLOAD PDF</span>`;
            if (window.lucide) window.lucide.createIcons();
        }
    }

    reset() {
        this.state.images = [];
        this.state.previewPageIndex = 0;
        if (this.state.previewDebounceTimer) {
            clearTimeout(this.state.previewDebounceTimer);
            this.state.previewDebounceTimer = null;
        }
        this.renderImagesList();
        this.updatePdfPreview();
    }
}
