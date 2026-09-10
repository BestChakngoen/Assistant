import { ShareUI } from '../ui/share/ShareUI.js';

/**
 * ImageResizerTool - Handles image loading, aspect ratio math, canvas scaling, format conversion, and export.
 */
export class ImageResizerTool {
    constructor() {
        this.dom = {
            dropZone: null,
            fileInput: null,
            infoContainer: null,
            fileNameEl: null,
            fileSizeEl: null,
            fileDimsEl: null,
            controlsContainer: null,
            inputWidth: null,
            inputHeight: null,
            btnLockRatio: null,
            lockIcon: null,
            btnScaleDown: null,
            btnScaleUp: null,
            btnScaleReset: null,
            currentScaleEl: null,
            formatSelect: null,
            qualityContainer: null,
            qualitySlider: null,
            qualityValueEl: null,
            btnClear: null,
            previewContainer: null,
            emptyPlaceholder: null,
            previewImage: null,
            previewDimsEl: null,
            previewSizeEl: null,
            btnDownload: null,
            statusBadge: null
        };

        this.state = {
            originalImage: null,
            originalWidth: 0,
            originalHeight: 0,
            originalFileSize: 0,
            originalFileName: '',
            originalMimeType: 'image/png',
            aspectRatio: 1,
            maintainAspectRatio: true,
            currentWidth: 0,
            currentHeight: 0,
            scaleFactor: 1.0,
            format: 'image/png',
            quality: 0.9,
            previewBlob: null,
            isRendering: false
        };

        this.renderTimeout = null;
    }

    init() {
        this.cacheDom();
        if (!this.dom.dropZone || !this.dom.fileInput) return;
        this.bindEvents();
    }

    cacheDom() {
        this.dom.dropZone = document.getElementById('img-drop-zone');
        this.dom.fileInput = document.getElementById('img-file-input');
        this.dom.infoContainer = document.getElementById('img-info-container');
        this.dom.fileNameEl = document.getElementById('img-info-filename');
        this.dom.fileSizeEl = document.getElementById('img-info-filesize');
        this.dom.fileDimsEl = document.getElementById('img-info-dimensions');
        this.dom.controlsContainer = document.getElementById('img-controls-container');
        this.dom.inputWidth = document.getElementById('img-input-width');
        this.dom.inputHeight = document.getElementById('img-input-height');
        this.dom.btnLockRatio = document.getElementById('btn-img-lock-ratio');
        this.dom.lockIcon = document.getElementById('img-lock-icon');
        this.dom.btnScaleDown = document.getElementById('btn-scale-down');
        this.dom.btnScaleUp = document.getElementById('btn-scale-up');
        this.dom.btnScaleReset = document.getElementById('btn-scale-reset');
        this.dom.currentScaleEl = document.getElementById('img-current-scale');
        this.dom.formatSelect = document.getElementById('img-format-select');
        this.dom.qualityContainer = document.getElementById('img-quality-container');
        this.dom.qualitySlider = document.getElementById('img-quality-slider');
        this.dom.qualityValueEl = document.getElementById('img-quality-value');
        this.dom.btnClear = document.getElementById('btn-img-clear');
        this.dom.previewContainer = document.getElementById('img-preview-container');
        this.dom.emptyPlaceholder = document.getElementById('img-empty-placeholder');
        this.dom.previewImage = document.getElementById('img-preview-image');
        this.dom.previewDimsEl = document.getElementById('img-preview-dimensions');
        this.dom.previewSizeEl = document.getElementById('img-preview-filesize');
        this.dom.btnDownload = document.getElementById('btn-img-download');
        this.dom.statusBadge = document.getElementById('img-status-badge');
    }

    bindEvents() {
        // Drag & drop
        this.dom.dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.dom.dropZone.classList.add('bg-cyan-500/10');
        });

        this.dom.dropZone.addEventListener('dragleave', () => {
            this.dom.dropZone.classList.remove('bg-cyan-500/10');
        });

        this.dom.dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            this.dom.dropZone.classList.remove('bg-cyan-500/10');
            const files = e.dataTransfer?.files;
            if (files && files.length > 0) {
                this.loadFile(files[0]);
            }
        });

        // Click to browse
        this.dom.dropZone.addEventListener('click', () => {
            this.dom.fileInput.click();
        });

        this.dom.fileInput.addEventListener('change', (e) => {
            const files = e.target.files;
            if (files && files.length > 0) {
                this.loadFile(files[0]);
            }
        });

        // Clipboard paste (Ctrl+V)
        window.addEventListener('paste', (e) => {
            const toolsPanel = document.getElementById('tools-panel');
            if (!toolsPanel || toolsPanel.classList.contains('hidden')) return;

            const items = e.clipboardData?.items;
            if (!items) return;

            for (let i = 0; i < items.length; i++) {
                if (items[i].type.startsWith('image/')) {
                    const file = items[i].getAsFile();
                    if (file) {
                        this.loadFile(file);
                        ShareUI.showToast('Pasted', 'Image loaded from clipboard', 'success');
                        break;
                    }
                }
            }
        });

        // Dimension inputs
        if (this.dom.inputWidth) {
            this.dom.inputWidth.addEventListener('input', () => this.handleWidthInput());
        }

        if (this.dom.inputHeight) {
            this.dom.inputHeight.addEventListener('input', () => this.handleHeightInput());
        }

        // Lock ratio toggle
        if (this.dom.btnLockRatio) {
            this.dom.btnLockRatio.addEventListener('click', () => this.toggleAspectRatioLock());
        }

        // Step scale buttons (+/- 10% and reset)
        if (this.dom.btnScaleDown) {
            this.dom.btnScaleDown.addEventListener('click', () => this.stepScale(-0.1));
        }

        if (this.dom.btnScaleUp) {
            this.dom.btnScaleUp.addEventListener('click', () => this.stepScale(0.1));
        }

        if (this.dom.btnScaleReset) {
            this.dom.btnScaleReset.addEventListener('click', () => this.resetScale());
        }

        // Format change
        if (this.dom.formatSelect) {
            this.dom.formatSelect.addEventListener('change', () => {
                this.state.format = this.dom.formatSelect.value;
                this.updateQualityVisibility();
                this.schedulePreviewRender();
            });
        }

        // Quality slider
        if (this.dom.qualitySlider) {
            this.dom.qualitySlider.addEventListener('input', () => {
                const val = parseInt(this.dom.qualitySlider.value, 10);
                this.state.quality = val / 100;
                if (this.dom.qualityValueEl) {
                    this.dom.qualityValueEl.textContent = `${val}%`;
                }
                this.schedulePreviewRender();
            });
        }

        // Clear button
        if (this.dom.btnClear) {
            this.dom.btnClear.addEventListener('click', () => this.clear());
        }

        // Download button
        if (this.dom.btnDownload) {
            this.dom.btnDownload.addEventListener('click', () => this.download());
        }
    }

    loadFile(file) {
        if (!file || !file.type.startsWith('image/')) {
            ShareUI.showToast('Invalid File', 'Please upload a valid image file (PNG, JPG, WEBP)', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                this.state.originalImage = img;
                this.state.originalWidth = img.naturalWidth || img.width;
                this.state.originalHeight = img.naturalHeight || img.height;
                this.state.aspectRatio = this.state.originalWidth / this.state.originalHeight;
                this.state.originalFileSize = file.size;
                this.state.originalFileName = file.name.replace(/\.[^/.]+$/, '');
                this.state.originalMimeType = file.type;

                // Defaults
                this.state.scaleFactor = 1.0;
                this.state.currentWidth = this.state.originalWidth;
                this.state.currentHeight = this.state.originalHeight;

                // Auto match format if supported
                if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
                    this.state.format = 'image/jpeg';
                } else if (file.type === 'image/webp') {
                    this.state.format = 'image/webp';
                } else {
                    this.state.format = 'image/png';
                }

                if (this.dom.formatSelect) {
                    this.dom.formatSelect.value = this.state.format;
                }

                this.updateUiWithLoadedImage(file);
                this.updateQualityVisibility();
                this.renderPreview();
                ShareUI.showToast('Image Loaded', `${img.naturalWidth} x ${img.naturalHeight} px loaded`, 'success');
            };
            img.onerror = () => {
                ShareUI.showToast('Error', 'Failed to load image file', 'error');
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    updateUiWithLoadedImage(file) {
        // Show info & controls
        if (this.dom.infoContainer) this.dom.infoContainer.classList.remove('hidden');
        if (this.dom.controlsContainer) this.dom.controlsContainer.classList.remove('hidden');
        if (this.dom.emptyPlaceholder) this.dom.emptyPlaceholder.classList.add('hidden');
        if (this.dom.previewContainer) this.dom.previewContainer.classList.remove('hidden');
        if (this.dom.btnDownload) this.dom.btnDownload.disabled = false;

        // Populate info
        if (this.dom.fileNameEl) this.dom.fileNameEl.textContent = file.name;
        if (this.dom.fileSizeEl) this.dom.fileSizeEl.textContent = this.formatBytes(file.size);
        if (this.dom.fileDimsEl) this.dom.fileDimsEl.textContent = `${this.state.originalWidth} x ${this.state.originalHeight} px`;

        // Populate inputs
        if (this.dom.inputWidth) this.dom.inputWidth.value = this.state.currentWidth;
        if (this.dom.inputHeight) this.dom.inputHeight.value = this.state.currentHeight;

        this.updateScaleIndicator();

        // Status badge
        if (this.dom.statusBadge) {
            this.dom.statusBadge.textContent = 'Ready';
            this.dom.statusBadge.className = 'px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400';
        }
    }

    handleWidthInput() {
        const val = parseInt(this.dom.inputWidth?.value, 10);
        if (isNaN(val) || val <= 0) return;

        this.state.currentWidth = val;
        if (this.state.maintainAspectRatio && this.state.aspectRatio > 0) {
            this.state.currentHeight = Math.max(1, Math.round(val / this.state.aspectRatio));
            if (this.dom.inputHeight) {
                this.dom.inputHeight.value = this.state.currentHeight;
            }
        }

        if (this.state.originalWidth > 0) {
            this.state.scaleFactor = Math.round((this.state.currentWidth / this.state.originalWidth) * 100) / 100;
            this.updateScaleIndicator();
        }

        this.schedulePreviewRender();
    }

    handleHeightInput() {
        const val = parseInt(this.dom.inputHeight?.value, 10);
        if (isNaN(val) || val <= 0) return;

        this.state.currentHeight = val;
        if (this.state.maintainAspectRatio && this.state.aspectRatio > 0) {
            this.state.currentWidth = Math.max(1, Math.round(val * this.state.aspectRatio));
            if (this.dom.inputWidth) {
                this.dom.inputWidth.value = this.state.currentWidth;
            }
        }

        if (this.state.originalHeight > 0) {
            this.state.scaleFactor = Math.round((this.state.currentHeight / this.state.originalHeight) * 100) / 100;
            this.updateScaleIndicator();
        }

        this.schedulePreviewRender();
    }

    toggleAspectRatioLock() {
        this.state.maintainAspectRatio = !this.state.maintainAspectRatio;
        if (this.dom.btnLockRatio) {
            if (this.state.maintainAspectRatio) {
                this.dom.btnLockRatio.classList.remove('text-slate-500', 'bg-slate-800/30');
                this.dom.btnLockRatio.classList.add('text-cyan-400', 'bg-cyan-500/15');
                this.dom.btnLockRatio.title = 'Aspect ratio locked';
                if (this.dom.lockIcon) {
                    this.dom.lockIcon.setAttribute('data-lucide', 'lock');
                }
                // Re-align height to current width
                if (this.state.currentWidth > 0 && this.state.aspectRatio > 0) {
                    this.state.currentHeight = Math.max(1, Math.round(this.state.currentWidth / this.state.aspectRatio));
                    if (this.dom.inputHeight) {
                        this.dom.inputHeight.value = this.state.currentHeight;
                    }
                    this.schedulePreviewRender();
                }
            } else {
                this.dom.btnLockRatio.classList.remove('text-cyan-400', 'bg-cyan-500/15');
                this.dom.btnLockRatio.classList.add('text-slate-500', 'bg-slate-800/30');
                this.dom.btnLockRatio.title = 'Aspect ratio unlocked';
                if (this.dom.lockIcon) {
                    this.dom.lockIcon.setAttribute('data-lucide', 'unlock');
                }
            }
            if (window.lucide) {
                window.lucide.createIcons();
            }
        }
    }

    stepScale(delta) {
        if (!this.state.originalWidth || !this.state.originalHeight) return;

        const nextScale = Math.round((this.state.scaleFactor + delta) * 10) / 10;
        this.state.scaleFactor = Math.max(0.1, Math.min(5.0, nextScale));

        this.applyScaleFactor();
    }

    resetScale() {
        if (!this.state.originalWidth || !this.state.originalHeight) return;
        this.state.scaleFactor = 1.0;
        this.applyScaleFactor();
    }

    applyScaleFactor() {
        this.state.currentWidth = Math.max(1, Math.round(this.state.originalWidth * this.state.scaleFactor));
        this.state.currentHeight = Math.max(1, Math.round(this.state.originalHeight * this.state.scaleFactor));

        if (this.dom.inputWidth) this.dom.inputWidth.value = this.state.currentWidth;
        if (this.dom.inputHeight) this.dom.inputHeight.value = this.state.currentHeight;

        this.updateScaleIndicator();
        this.schedulePreviewRender();
    }

    updateScaleIndicator() {
        if (this.dom.currentScaleEl) {
            const pct = Math.round(this.state.scaleFactor * 100);
            this.dom.currentScaleEl.textContent = `Scale: ${pct}%`;
        }
    }

    updateQualityVisibility() {
        if (!this.dom.qualityContainer) return;
        if (this.state.format === 'image/jpeg' || this.state.format === 'image/webp') {
            this.dom.qualityContainer.classList.remove('hidden');
        } else {
            this.dom.qualityContainer.classList.add('hidden');
        }
    }

    schedulePreviewRender() {
        if (this.renderTimeout) clearTimeout(this.renderTimeout);
        this.renderTimeout = setTimeout(() => {
            this.renderPreview();
        }, 120);
    }

    renderPreview() {
        if (!this.state.originalImage) return;

        const targetW = Math.max(1, this.state.currentWidth);
        const targetH = Math.max(1, this.state.currentHeight);

        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');

        // High quality image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Draw white background if converting PNG with transparency to JPEG
        if (this.state.format === 'image/jpeg') {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, targetW, targetH);
        }

        ctx.drawImage(this.state.originalImage, 0, 0, targetW, targetH);

        canvas.toBlob((blob) => {
            if (!blob) return;

            if (this.state.previewBlob) {
                URL.revokeObjectURL(this.dom.previewImage?.src);
            }

            this.state.previewBlob = blob;
            const previewUrl = URL.createObjectURL(blob);

            if (this.dom.previewImage) {
                this.dom.previewImage.src = previewUrl;
            }

            if (this.dom.previewDimsEl) {
                this.dom.previewDimsEl.textContent = `${targetW} x ${targetH} px`;
            }

            if (this.dom.previewSizeEl) {
                this.dom.previewSizeEl.textContent = this.formatBytes(blob.size);
            }
        }, this.state.format, this.state.quality);
    }

    download() {
        if (!this.state.previewBlob) {
            ShareUI.showToast('Warning', 'No image available for download', 'error');
            return;
        }

        const extMap = {
            'image/png': 'png',
            'image/jpeg': 'jpg',
            'image/webp': 'webp'
        };
        const ext = extMap[this.state.format] || 'png';
        const filename = `${this.state.originalFileName || 'image'}_${this.state.currentWidth}x${this.state.currentHeight}.${ext}`;

        const url = URL.createObjectURL(this.state.previewBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        ShareUI.showToast('Download Complete', `${filename} saved successfully`, 'success');
    }

    clear() {
        if (this.state.previewBlob && this.dom.previewImage) {
            URL.revokeObjectURL(this.dom.previewImage.src);
        }

        this.state.originalImage = null;
        this.state.originalWidth = 0;
        this.state.originalHeight = 0;
        this.state.originalFileSize = 0;
        this.state.originalFileName = '';
        this.state.aspectRatio = 1;
        this.state.currentWidth = 0;
        this.state.currentHeight = 0;
        this.state.scaleFactor = 1.0;
        this.state.previewBlob = null;

        if (this.dom.fileInput) this.dom.fileInput.value = '';
        if (this.dom.infoContainer) this.dom.infoContainer.classList.add('hidden');
        if (this.dom.controlsContainer) this.dom.controlsContainer.classList.add('hidden');
        if (this.dom.previewContainer) this.dom.previewContainer.classList.add('hidden');
        if (this.dom.emptyPlaceholder) this.dom.emptyPlaceholder.classList.remove('hidden');
        if (this.dom.btnDownload) this.dom.btnDownload.disabled = true;

        if (this.dom.previewImage) this.dom.previewImage.src = '';
        if (this.dom.inputWidth) this.dom.inputWidth.value = '';
        if (this.dom.inputHeight) this.dom.inputHeight.value = '';

        if (this.dom.currentScaleEl) {
            this.dom.currentScaleEl.textContent = 'Scale: 100%';
        }

        if (this.dom.statusBadge) {
            this.dom.statusBadge.textContent = 'Waiting for image';
            this.dom.statusBadge.className = 'px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800/60 text-slate-400';
        }
    }

    formatBytes(bytes) {
        if (!bytes || bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }
}
