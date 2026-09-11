/**
 * NetWorthCardRenderer.js - DOM Card Rendering, Modals & Audio Subsystem
 * Handles UI templates, inline edit forms, delete confirmation modal, and alert modals.
 */
import { NetWorthDragHandler } from './NetWorthDragHandler.js';

export class NetWorthCardRenderer {
    static playClickSound() {
        try {
            const sound = new Audio('assets/Sounds/mouse-click.mp3');
            sound.currentTime = 0;
            sound.play().catch(() => {});
        } catch (e) {}
    }

    static playRemoveSound() {
        try {
            const sound = new Audio('assets/Sounds/remove.mp3');
            sound.currentTime = 0;
            sound.play().catch(() => {});
        } catch (e) {}
    }

    static showAppleAlertModal(title, message, icon = 'alert-circle') {
        const existing = document.getElementById('nw-alert-modal');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.id = 'nw-alert-modal';
        overlay.className = 'share-overlay';
        overlay.innerHTML = `
            <div class="share-modal-card">
                <div class="share-modal-body">
                    <div class="share-modal-icon-badge text-amber-400">
                        <i data-lucide="${icon}" class="w-8 h-8"></i>
                    </div>
                    <h3 class="share-modal-title">${title}</h3>
                    <p class="share-modal-message">${message}</p>
                    <div class="share-modal-divider"></div>
                    <div class="share-modal-actions">
                        <button id="btn-nw-alert-ok" class="share-modal-btn share-modal-btn-confirm bg-cyan-600 hover:bg-cyan-500 text-white w-full py-2.5 rounded-xl font-bold font-mono text-xs cursor-pointer">
                            OK
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        if (window.lucide) window.lucide.createIcons();

        requestAnimationFrame(() => {
            overlay.classList.add('share-overlay-visible');
            const card = overlay.querySelector('.share-modal-card');
            if (card) card.classList.add('share-modal-card-visible');
        });

        const close = () => {
            this.playClickSound();
            overlay.classList.remove('share-overlay-visible');
            const card = overlay.querySelector('.share-modal-card');
            if (card) card.classList.remove('share-modal-card-visible');
            setTimeout(() => overlay.remove(), 200);
        };

        const btnOk = overlay.querySelector('#btn-nw-alert-ok');
        if (btnOk) btnOk.onclick = close;
        overlay.onclick = (e) => {
            if (e.target === overlay) close();
        };
    }

    static showDeleteConfirmModal(manager, item) {
        const existing = document.getElementById('nw-delete-modal');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.id = 'nw-delete-modal';
        overlay.className = 'share-overlay';
        overlay.innerHTML = `
            <div class="share-modal-card">
                <div class="share-modal-body">
                    <div class="share-modal-icon-badge text-rose-400 bg-rose-500/10 border border-rose-500/20">
                        <i data-lucide="trash-2" class="w-8 h-8"></i>
                    </div>
                    <h3 class="share-modal-title">Confirm Delete Asset</h3>
                    <p class="share-modal-message">Are you sure you want to remove <strong class="text-white">${item.name}</strong> from your portfolio?</p>
                    <div class="share-modal-divider"></div>
                    <div class="share-modal-actions flex gap-3">
                        <button id="btn-nw-delete-cancel" class="share-modal-btn share-modal-btn-cancel flex-1 py-2.5 rounded-xl font-bold font-mono text-xs cursor-pointer">
                            Cancel
                        </button>
                        <button id="btn-nw-delete-confirm" class="share-modal-btn share-modal-btn-confirm bg-rose-600 hover:bg-rose-500 text-white flex-1 py-2.5 rounded-xl font-bold font-mono text-xs cursor-pointer">
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        if (window.lucide) window.lucide.createIcons();

        requestAnimationFrame(() => {
            overlay.classList.add('share-overlay-visible');
            const card = overlay.querySelector('.share-modal-card');
            if (card) card.classList.add('share-modal-card-visible');
        });

        const close = () => {
            overlay.classList.remove('share-overlay-visible');
            const card = overlay.querySelector('.share-modal-card');
            if (card) card.classList.remove('share-modal-card-visible');
            setTimeout(() => overlay.remove(), 200);
        };

        const btnCancel = overlay.querySelector('#btn-nw-delete-cancel');
        const btnConfirm = overlay.querySelector('#btn-nw-delete-confirm');

        if (btnCancel) {
            btnCancel.onclick = () => {
                this.playClickSound();
                close();
            };
        }

        if (btnConfirm) {
            btnConfirm.onclick = () => {
                this.playClickSound();
                manager.deleteItem(item.id);
                close();
                this.playRemoveSound();
            };
        }

        overlay.onclick = (e) => {
            if (e.target === overlay) close();
        };
    }

    static renderList(manager) {
        const container = document.getElementById('nw-items-list');
        const countEl = document.getElementById('nw-items-count');
        if (!container) return;

        // Auto-hiding scrollbar event listener
        if (!container.dataset.hasScrollListener) {
            container.dataset.hasScrollListener = 'true';
            let scrollTimeout;
            container.addEventListener('scroll', () => {
                container.classList.add('is-scrolling');
                clearTimeout(scrollTimeout);
                scrollTimeout = setTimeout(() => {
                    container.classList.remove('is-scrolling');
                }, 1000);
            });
        }

        const filtered = manager.items.filter(item => {
            if (manager.filter === 'ALL') return true;
            return item.type === manager.filter;
        });

        if (countEl) countEl.innerText = `${filtered.length} items registered`;

        if (filtered.length === 0) {
            container.className = 'space-y-2 pr-1';
            container.style.maxHeight = 'none';
            container.style.overflowY = 'visible';
            container.innerHTML = '<div class="text-center text-slate-500 py-12 text-xs font-mono">No financial items recorded in this view.</div>';
            return;
        }

        // Toggle scroll bar when assets count > 3
        if (filtered.length > 3) {
            container.className = 'space-y-2 pr-1 select-none nw-items-scroll';
            container.style.maxHeight = '210px';
            container.style.overflowY = 'auto';
        } else {
            container.className = 'space-y-2 pr-1 select-none';
            container.classList.remove('nw-items-scroll');
            container.style.maxHeight = 'none';
            container.style.overflowY = 'visible';
        }

        const symbol = manager.currency === 'THB' ? '฿' : '$';
        container.innerHTML = '';
        filtered.forEach((item, index) => {
            const isAsset = item.type === 'ASSET';
            const textClass = isAsset ? 'text-emerald-400' : 'text-red-400';
            const typeLabel = isAsset ? 'ASSET' : 'LIABILITY';
            const convertedAmt = manager.getItemConvertedAmount(item);

            // Check if updated > 7 days ago
            const lastUpdated = item.updatedAt || item.date;
            let isOutdated = false;
            if (lastUpdated) {
                const diffMs = Date.now() - new Date(lastUpdated).getTime();
                const diffDays = diffMs / (1000 * 60 * 60 * 24);
                if (diffDays > 7) {
                    isOutdated = true;
                }
            }

            const borderClass = isOutdated 
                ? 'border border-amber-500/70 bg-amber-950/20 shadow-[0_0_10px_rgba(245,158,11,0.15)]' 
                : 'border border-slate-800/60 bg-slate-900/40';

            const card = document.createElement('div');
            card.className = `p-3.5 rounded-xl ${borderClass} flex justify-between items-center group nw-item-card`;
            card.dataset.index = index;

            const renderNormalState = () => {
                const outdatedBadge = isOutdated 
                    ? `<span class="text-[9px] font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded flex items-center gap-1 shrink-0" title="Not updated for over 7 days"><i data-lucide="clock" class="w-2.5 h-2.5"></i> >7d outdated</span>` 
                    : '';

                card.innerHTML = `
                    <div class="flex items-center gap-2.5">
                        <i data-lucide="grip-vertical" class="w-4 h-4 text-slate-500 hover:text-cyan-400 cursor-grab active:cursor-grabbing nw-drag-handle shrink-0 transition" title="Press & drag 6 dots to reorder"></i>
                        <div class="w-8 h-8 rounded-lg ${isAsset ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'} flex items-center justify-center font-mono font-bold text-xs shrink-0">
                            ${isAsset ? '+' : '-'}
                        </div>
                        <div>
                            <div class="flex items-center gap-2 flex-wrap">
                                <span class="font-bold font-mono text-slate-200 text-xs">${item.name}</span>
                                <span class="text-[9px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">${item.category}</span>
                                ${outdatedBadge}
                            </div>
                            <span class="text-[10px] font-mono font-bold ${textClass}">${typeLabel}</span>
                        </div>
                    </div>
                    <div class="flex items-center gap-3">
                        <span class="font-mono font-bold text-sm ${textClass}">${isAsset ? '+' : '-'}${symbol}${convertedAmt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        <button class="edit-nw-btn text-slate-500 hover:text-cyan-400 transition p-1 text-xs" data-id="${item.id}" title="Edit Record">
                            <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
                        </button>
                        <button class="delete-nw-btn text-slate-600 hover:text-red-400 transition p-1 text-xs" data-id="${item.id}" title="Delete Record">✕</button>
                    </div>
                `;

                // Custom Pointer Drag Tracking for 6-dot grip handle
                NetWorthDragHandler.attachDragListeners(manager, card, index, filtered);

                const btnEdit = card.querySelector('.edit-nw-btn');
                if (btnEdit) {
                    btnEdit.onclick = (e) => {
                        e.stopPropagation();
                        this.playClickSound();
                        renderEditState();
                    };
                }

                const btnDelete = card.querySelector('.delete-nw-btn');
                if (btnDelete) {
                    btnDelete.onclick = (e) => {
                        e.stopPropagation();
                        this.playClickSound();
                        this.showDeleteConfirmModal(manager, item);
                    };
                }

                if (window.lucide) window.lucide.createIcons();
            };

            const renderEditState = () => {
                const categories = ['Cash & Bank', 'Investments', 'Real Estate & Vehicle', 'Valuables & Crypto', 'Credit & Debt', 'Other'];
                const categoryOptions = categories.map(cat => `<option value="${cat}" ${item.category === cat ? 'selected' : ''}>${cat}</option>`).join('');
                const displayAmt = convertedAmt.toFixed(2);

                card.innerHTML = `
                    <div class="w-full flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-1 font-mono">
                        <div class="flex flex-1 gap-2">
                            <input type="text" class="nw-edit-name bg-slate-950 text-slate-200 border border-slate-800/80 rounded-lg px-2.5 py-1 text-xs flex-1 focus:border-cyan-500 outline-none" value="${item.name}" placeholder="Item Name">
                            <select class="nw-edit-cat bg-slate-950 text-slate-300 border border-slate-800/80 rounded-lg px-2 py-1 text-[11px] focus:border-cyan-500 outline-none">
                                ${categoryOptions}
                            </select>
                        </div>
                        <div class="flex items-center gap-2">
                            <input type="number" step="0.01" min="0" class="nw-edit-amount w-28 bg-slate-950 text-emerald-400 font-bold border border-slate-800/80 rounded-lg px-2.5 py-1 text-xs focus:border-cyan-500 outline-none tabular-nums" value="${displayAmt}" placeholder="Amount">
                            <button class="nw-save-btn px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold transition">Save</button>
                            <button class="nw-cancel-btn px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-lg text-xs transition">Cancel</button>
                        </div>
                    </div>
                `;

                const btnSave = card.querySelector('.nw-save-btn');
                const btnCancel = card.querySelector('.nw-cancel-btn');
                const inputName = card.querySelector('.nw-edit-name');
                const inputCat = card.querySelector('.nw-edit-cat');
                const inputAmt = card.querySelector('.nw-edit-amount');

                btnCancel.onclick = (e) => {
                    e.stopPropagation();
                    this.playClickSound();
                    renderNormalState();
                };

                btnSave.onclick = (e) => {
                    e.stopPropagation();
                    this.playClickSound();
                    const newName = inputName.value.trim();
                    const newCat = inputCat.value;
                    const newAmt = inputAmt.value;
                    if (manager.editItem(item.id, newName, newCat, newAmt)) {
                        renderNormalState();
                    }
                };
            };

            renderNormalState();
            container.appendChild(card);
        });
    }
}
