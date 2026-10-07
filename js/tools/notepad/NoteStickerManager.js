import { ShareUI } from '../../share/ShareUI.js';

export class NoteStickerManager {
    constructor(sheetManager) {
        this.sheetManager = sheetManager;
        this.dom = {
            canvas: document.getElementById('note-sheet-canvas'),
            layer: document.getElementById('note-stickers-layer'),
            input: document.getElementById('note-content-input')
        };
        
        // Active drag state
        this.dragState = null;
        this.resizeState = null;
        this.zoomLevel = 1.0;

        this.bindEvents();
    }

    bindEvents() {
        if (!this.dom.canvas || !this.dom.layer) return;

        // Paste event on the input
        this.dom.input.addEventListener('paste', (e) => this.handlePaste(e));

        // Drag and drop events on canvas
        this.dom.canvas.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.dom.canvas.classList.add('ring-2', 'ring-amber-500', 'bg-slate-900');
        });

        this.dom.canvas.addEventListener('dragleave', (e) => {
            e.preventDefault();
            this.dom.canvas.classList.remove('ring-2', 'ring-amber-500', 'bg-slate-900');
        });

        this.dom.canvas.addEventListener('drop', (e) => {
            e.preventDefault();
            this.dom.canvas.classList.remove('ring-2', 'ring-amber-500', 'bg-slate-900');
            this.handleDrop(e);
        });

        // Global mouse moves for dragging and resizing
        document.addEventListener('mousemove', (e) => this.onGlobalMove(e), { passive: false });
        document.addEventListener('mouseup', (e) => this.onGlobalEnd(e));
        document.addEventListener('touchmove', (e) => this.onGlobalMove(e), { passive: false });
        document.addEventListener('touchend', (e) => this.onGlobalEnd(e));
    }

    async handlePaste(e) {
        const clipboardData = e.clipboardData || e.originalEvent.clipboardData;
        const items = clipboardData.items;
        
        for (let item of items) {
            if (item.type.indexOf('image') === 0) {
                // Let Quill handle it? Or prevent default?
                // We want stickers for images, not inline images!
                e.preventDefault();
                const file = item.getAsFile();
                if (file) {
                    await this.processAndAddImage(file);
                }
            }
        }
    }

    async handleDrop(e) {
        const files = e.dataTransfer.files;
        for (let file of files) {
            if (file.type.startsWith('image/')) {
                await this.processAndAddImage(file);
            }
        }
    }

    addLinkSticker(url) {
        const activeSheet = this.sheetManager.getActiveSheet();
        if (!activeSheet) return;

        if (!activeSheet.stickers) {
            activeSheet.stickers = [];
        }

        const offset = (activeSheet.stickers.length % 5) * 20;

        const sticker = {
            id: `sticker_${Date.now()}_${Math.random().toString(36).substr(2,9)}`,
            type: 'link',
            url: url,
            x: 20 + offset,
            y: 20 + offset,
            width: 250
        };

        activeSheet.stickers.push(sticker);
        
        if (typeof this.sheetManager.callbacks.onDataChange === 'function') {
            this.sheetManager.callbacks.onDataChange();
        }

        this.renderStickers();
    }

    async processAndAddImage(file) {
        ShareUI.showToast('Processing Image...', 'Adding sticker to note', 'info');
        
        try {
            const dataUrl = await this.compressImage(file);
            
            const activeSheet = this.sheetManager.getActiveSheet();
            if (!activeSheet) return;

            if (!activeSheet.stickers) {
                activeSheet.stickers = [];
            }

            // Create a small offset so multiple stickers don't stack perfectly
            const offset = (activeSheet.stickers.length % 5) * 20;

            const sticker = {
                id: `sticker_${Date.now()}_${Math.random().toString(36).substr(2,9)}`,
                dataUrl: dataUrl,
                x: 20 + offset,
                y: 20 + offset,
                width: 250 // default size, auto height based on aspect ratio
            };

            activeSheet.stickers.push(sticker);
            
            // Trigger save
            if (typeof this.sheetManager.callbacks.onDataChange === 'function') {
                this.sheetManager.callbacks.onDataChange();
            }

            this.renderStickers();
            ShareUI.showToast('Sticker Added', 'Image added successfully', 'success');
        } catch (err) {
            console.error('Sticker Add Error:', err);
            ShareUI.showToast('Error', 'Failed to process image', 'error');
        }
    }

    compressImage(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (e) => {
                const img = new Image();
                img.src = e.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 400; // max width to keep payload small
                    let width = img.width;
                    let height = img.height;

                    if (width > MAX_WIDTH) {
                        height = Math.round((height * MAX_WIDTH) / width);
                        width = MAX_WIDTH;
                    }

                    canvas.width = width;
                    canvas.height = height;

                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    // Compress to webp for best size/quality ratio
                    const dataUrl = canvas.toDataURL('image/webp', 0.8);
                    resolve(dataUrl);
                };
                img.onerror = (err) => reject(err);
            };
            reader.onerror = (err) => reject(err);
        });
    }

    setZoom(level) {
        this.zoomLevel = level || 1.0;
        this.renderStickers();
    }

    renderStickers() {
        if (!this.dom.layer) return;
        this.dom.layer.innerHTML = '';

        const activeSheet = this.sheetManager.getActiveSheet();
        if (!activeSheet || !activeSheet.stickers) return;

        activeSheet.stickers.forEach(sticker => {
            const el = document.createElement('div');
            el.className = 'sticker-item absolute group pointer-events-auto shadow-md rounded-xl overflow-hidden hover:shadow-xl transition-all cursor-grab hover:ring-2 hover:ring-amber-500/50 bg-transparent';
            el.style.left = `${sticker.x * this.zoomLevel}px`;
            el.style.top = `${sticker.y * this.zoomLevel}px`;
            el.style.width = `${sticker.width * this.zoomLevel}px`;
            
            let contentHtml = '';
            
            if (sticker.type === 'link') {
                const urlObj = new URL(sticker.url);
                const shortName = urlObj.hostname.replace('www.', '') + (urlObj.pathname.length > 1 ? '/...' : '');
                contentHtml = `
                    <a href="${sticker.url}" target="_blank" class="block w-full h-full px-4 py-2 bg-slate-900/90 text-cyan-400 font-medium text-sm truncate flex items-center gap-2 hover:bg-slate-800/90 transition-colors pointer-events-auto shadow-[inset_0_0_0_1px_rgba(34,211,238,0.2)]">
                        <i data-lucide="link-2" class="size-4 shrink-0"></i>
                        ${shortName}
                    </a>
                `;
                // Override width for links if it was created with default image width
                if (sticker.width === 250) sticker.width = 200;
            } else {
                contentHtml = `<img src="${sticker.dataUrl}" class="w-full h-auto block select-none pointer-events-none" draggable="false" />`;
            }

            el.innerHTML = `
                ${contentHtml}
                <button type="button" class="btn-delete-sticker absolute top-1 right-1 p-1 bg-rose-500/90 hover:bg-rose-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity transform scale-75 hover:scale-100 shadow-sm" data-id="${sticker.id}" title="Remove Sticker">
                    <i data-lucide="x" class="size-3"></i>
                </button>
                <div class="resize-handle absolute bottom-0 right-0 w-6 h-6 cursor-se-resize z-20 opacity-0 group-hover:opacity-100 flex items-end justify-end p-1.5" title="Resize">
                    <div class="w-2.5 h-2.5 rounded-tl-sm bg-amber-500/80 pointer-events-none"></div>
                </div>
            `;

            // Delete event
            el.querySelector('.btn-delete-sticker').addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteSticker(sticker.id);
            });

            // Resize event initiation
            const resizeHandle = el.querySelector('.resize-handle');
            resizeHandle.addEventListener('mousedown', (e) => this.onResizeStart(e, sticker.id, el));
            resizeHandle.addEventListener('touchstart', (e) => this.onResizeStart(e, sticker.id, el), { passive: false });

            // Drag event initiation
            el.addEventListener('mousedown', (e) => this.onDragStart(e, sticker.id, el));
            el.addEventListener('touchstart', (e) => this.onDragStart(e, sticker.id, el), { passive: false });

            this.dom.layer.appendChild(el);
        });

        if (window.lucide) window.lucide.createIcons();
    }

    deleteSticker(stickerId) {
        const activeSheet = this.sheetManager.getActiveSheet();
        if (!activeSheet || !activeSheet.stickers) return;

        activeSheet.stickers = activeSheet.stickers.filter(s => s.id !== stickerId);
        
        if (typeof this.sheetManager.callbacks.onDataChange === 'function') {
            this.sheetManager.callbacks.onDataChange();
        }
        
        this.renderStickers();
    }

    onDragStart(e, stickerId, el) {
        if (e.target.closest('.btn-delete-sticker')) return;
        
        const isTouch = e.type === 'touchstart';
        const clientX = isTouch ? e.touches[0].clientX : e.clientX;
        const clientY = isTouch ? e.touches[0].clientY : e.clientY;

        const rect = el.getBoundingClientRect();
        const layerRect = this.dom.layer.getBoundingClientRect();

        this.dragState = {
            id: stickerId,
            el: el,
            offsetX: clientX - rect.left,
            offsetY: clientY - rect.top,
            layerX: layerRect.left,
            layerY: layerRect.top,
            layerW: layerRect.width,
            layerH: layerRect.height
        };

        el.classList.remove('cursor-grab', 'transition-all');
        el.classList.add('cursor-grabbing', 'z-50', 'ring-2', 'ring-amber-500');
        
        if (isTouch) e.preventDefault();
    }

    onGlobalMove(e) {
        if (this.dragState) {
            this.onDragMove(e);
        } else if (this.resizeState) {
            this.onResizeMove(e);
        }
    }

    onGlobalEnd(e) {
        if (this.dragState) {
            this.onDragEnd(e);
        } else if (this.resizeState) {
            this.onResizeEnd(e);
        }
    }

    onResizeStart(e, stickerId, el) {
        e.stopPropagation(); // Prevent drag start
        
        const isTouch = e.type === 'touchstart';
        const clientX = isTouch ? e.touches[0].clientX : e.clientX;
        
        const rect = el.getBoundingClientRect();
        
        this.resizeState = {
            id: stickerId,
            el: el,
            startX: clientX,
            startWidth: rect.width
        };

        el.classList.remove('transition-all', 'hover:shadow-xl', 'cursor-grab');
        el.classList.add('z-50', 'ring-2', 'ring-amber-500');
        
        if (isTouch) e.preventDefault();
    }

    onResizeMove(e) {
        if (!this.resizeState) return;

        const isTouch = e.type === 'touchmove';
        const clientX = isTouch ? e.touches[0].clientX : e.clientX;
        
        const deltaX = clientX - this.resizeState.startX;
        let newZoomedWidth = this.resizeState.startWidth + deltaX;
        
        // Base width boundaries
        let baseWidth = newZoomedWidth / this.zoomLevel;
        baseWidth = Math.max(50, Math.min(baseWidth, 800));
        newZoomedWidth = baseWidth * this.zoomLevel;

        if (this.resizeState.rafId) {
            cancelAnimationFrame(this.resizeState.rafId);
        }
        
        this.resizeState.rafId = requestAnimationFrame(() => {
            if (this.resizeState && this.resizeState.el) {
                this.resizeState.el.style.width = `${newZoomedWidth}px`;
            }
        });

        if (isTouch) e.preventDefault();
    }

    onResizeEnd(e) {
        if (!this.resizeState) return;

        const { id, el } = this.resizeState;
        
        el.classList.remove('z-50', 'ring-2', 'ring-amber-500');
        el.classList.add('transition-all', 'hover:shadow-xl', 'cursor-grab');

        // Update model
        const activeSheet = this.sheetManager.getActiveSheet();
        if (activeSheet && activeSheet.stickers) {
            const sticker = activeSheet.stickers.find(s => s.id === id);
            if (sticker) {
                sticker.width = Math.round(parseInt(el.style.width, 10) / this.zoomLevel);
                
                if (typeof this.sheetManager.callbacks.onDataChange === 'function') {
                    this.sheetManager.callbacks.onDataChange();
                }
            }
        }

        this.resizeState = null;
    }

    onDragMove(e) {
        if (!this.dragState) return;

        const isTouch = e.type === 'touchmove';
        const clientX = isTouch ? e.touches[0].clientX : e.clientX;
        const clientY = isTouch ? e.touches[0].clientY : e.clientY;

        // Calculate new X, Y relative to layer in visual space
        let newX = clientX - this.dragState.layerX - this.dragState.offsetX;
        let newY = clientY - this.dragState.layerY - this.dragState.offsetY;

        // Base coordinate boundaries
        let baseX = newX / this.zoomLevel;
        let baseY = newY / this.zoomLevel;
        
        baseX = Math.max(0, Math.min(baseX, (this.dragState.layerW / this.zoomLevel) - 50));
        baseY = Math.max(0, Math.min(baseY, (this.dragState.layerH / this.zoomLevel) - 50));

        newX = baseX * this.zoomLevel;
        newY = baseY * this.zoomLevel;

        if (this.dragState.rafId) {
            cancelAnimationFrame(this.dragState.rafId);
        }
        
        this.dragState.rafId = requestAnimationFrame(() => {
            if (this.dragState && this.dragState.el) {
                this.dragState.el.style.left = `${newX}px`;
                this.dragState.el.style.top = `${newY}px`;
            }
        });

        if (isTouch) e.preventDefault();
    }

    onDragEnd(e) {
        if (!this.dragState) return;

        const { id, el } = this.dragState;
        
        el.classList.remove('cursor-grabbing', 'z-50', 'ring-2', 'ring-amber-500');
        el.classList.add('cursor-grab', 'transition-all');

        // Update model
        const activeSheet = this.sheetManager.getActiveSheet();
        if (activeSheet && activeSheet.stickers) {
            const sticker = activeSheet.stickers.find(s => s.id === id);
            if (sticker) {
                sticker.x = Math.round(parseInt(el.style.left, 10) / this.zoomLevel);
                sticker.y = Math.round(parseInt(el.style.top, 10) / this.zoomLevel);
                
                if (typeof this.sheetManager.callbacks.onDataChange === 'function') {
                    this.sheetManager.callbacks.onDataChange();
                }
            }
        }

        this.dragState = null;
    }
}
