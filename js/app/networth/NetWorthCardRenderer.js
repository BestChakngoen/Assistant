/**
 * NetWorthCardRenderer.js - DOM Card Rendering, Modals & Audio Subsystem
 * Handles UI templates, inline edit forms, delete confirmation modal, and alert modals.
 */
import { NetWorthDragHandler } from './NetWorthDragHandler.js';
import { NetWorthVolatileAssetService } from './NetWorthVolatileAssetService.js';
import { NetWorthPortfolioService } from './NetWorthPortfolioService.js';

export class NetWorthCardRenderer {
    static showFinnhubKeyModal(onSaved) {
        const existing = document.getElementById('nw-finnhub-modal');
        if (existing) existing.remove();

        const currentKey = NetWorthVolatileAssetService.getFinnhubApiKey();
        const overlay = document.createElement('div');
        overlay.id = 'nw-finnhub-modal';
        overlay.className = 'share-overlay';
        overlay.innerHTML = `
            <div class="share-modal-card">
                <div class="share-modal-body text-left">
                    <div class="flex items-center gap-3 mb-2">
                        <div class="w-10 h-10 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center shrink-0">
                            <i data-lucide="key" class="w-5 h-5"></i>
                        </div>
                        <div>
                            <h3 class="font-mono font-bold text-sm text-slate-100">Finnhub API Key</h3>
                            <p class="text-[10px] font-mono text-slate-400">Live US Stock Quotes (AAPL, TSLA, NVDA)</p>
                        </div>
                    </div>
                    <p class="text-xs font-mono text-slate-400 mb-2">Enter your free Finnhub API Key to fetch real-time US stock prices from any device.</p>
                    <a href="https://finnhub.io/register" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 text-[11px] font-mono text-cyan-400 hover:text-cyan-300 hover:underline mb-3">
                        <span>Get Free Key (finnhub.io)</span>
                        <i data-lucide="external-link" class="w-3 h-3"></i>
                    </a>
                    <input type="text" id="input-finnhub-key" placeholder="Paste your API key here..." value="${currentKey}"
                        class="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-cyan-300 focus:border-cyan-500 outline-none mb-4">
                    <div class="share-modal-actions flex gap-2">
                        <button id="btn-finnhub-save" class="share-modal-btn share-modal-btn-confirm bg-cyan-600 hover:bg-cyan-500 text-white flex-1 py-2 rounded-xl font-bold font-mono text-xs cursor-pointer">
                            Save Key
                        </button>
                        <button id="btn-finnhub-cancel" class="share-modal-btn share-modal-btn-cancel bg-slate-800 hover:bg-slate-700 text-slate-400 px-4 py-2 rounded-xl font-bold font-mono text-xs cursor-pointer">
                            Cancel
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

        const btnSave = overlay.querySelector('#btn-finnhub-save');
        const btnCancel = overlay.querySelector('#btn-finnhub-cancel');
        const inputKey = overlay.querySelector('#input-finnhub-key');

        if (btnCancel) btnCancel.onclick = close;
        if (btnSave && inputKey) {
            btnSave.onclick = () => {
                this.playClickSound();
                const key = inputKey.value.trim();
                NetWorthVolatileAssetService.setFinnhubApiKey(key);
                close();
                if (typeof onSaved === 'function') onSaved(key);
                if (window.ShareUI && window.ShareUI.showToast) {
                    window.ShareUI.showToast('Key Saved', key ? 'Finnhub API Key updated' : 'Finnhub API Key cleared', 'success');
                }
            };
        }

        overlay.onclick = (e) => {
            if (e.target === overlay) close();
        };
    }
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

    static playSuccessSound() {
        try {
            const sound = new Audio('assets/Sounds/success.mp3');
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

    static showCreatePortfolioModal(manager, onCreated) {
        const existing = document.getElementById('nw-create-portfolio-modal');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.id = 'nw-create-portfolio-modal';
        overlay.className = 'share-overlay';
        overlay.innerHTML = `
            <div class="share-modal-card">
                <div class="share-modal-body text-left">
                    <div class="flex items-center gap-3 mb-3">
                        <div class="w-10 h-10 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center shrink-0">
                            <i data-lucide="folder-plus" class="w-5 h-5"></i>
                        </div>
                        <div>
                            <h3 class="font-mono font-bold text-sm text-slate-100">Create New Portfolio</h3>
                            <p class="text-[10px] font-mono text-slate-400">Organize assets into custom portfolio groups</p>
                        </div>
                    </div>
                    <label class="block text-xs font-mono text-slate-400 mb-1.5">PORTFOLIO NAME</label>
                    <input type="text" id="input-portfolio-name" placeholder="e.g. Retirement, Emergency Fund, DCA..."
                        class="w-full px-3 py-2.5 bg-slate-900 border-0 rounded-xl text-xs font-mono text-cyan-300 placeholder-slate-600 focus:ring-1 focus:ring-cyan-500 outline-none mb-4">
                    <div class="share-modal-actions flex gap-2">
                        <button id="btn-portfolio-save" class="share-modal-btn share-modal-btn-confirm bg-cyan-600 hover:bg-cyan-500 text-white flex-1 py-2 rounded-xl font-bold font-mono text-xs cursor-pointer border-0">
                            Create Portfolio
                        </button>
                        <button id="btn-portfolio-cancel" class="share-modal-btn share-modal-btn-cancel bg-slate-800 hover:bg-slate-700 text-slate-400 px-4 py-2 rounded-xl font-bold font-mono text-xs cursor-pointer border-0">
                            Cancel
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
            const input = overlay.querySelector('#input-portfolio-name');
            if (input) input.focus();
        });

        const close = () => {
            this.playClickSound();
            overlay.classList.remove('share-overlay-visible');
            const card = overlay.querySelector('.share-modal-card');
            if (card) card.classList.remove('share-modal-card-visible');
            setTimeout(() => overlay.remove(), 200);
        };

        const btnSave = overlay.querySelector('#btn-portfolio-save');
        const btnCancel = overlay.querySelector('#btn-portfolio-cancel');
        const inputName = overlay.querySelector('#input-portfolio-name');

        if (btnCancel) btnCancel.onclick = close;

        const handleSave = () => {
            const name = inputName ? inputName.value.trim() : '';
            if (!name) {
                this.showAppleAlertModal('Name Required', 'Please enter a name for the new portfolio.');
                return;
            }
            const success = NetWorthPortfolioService.addPortfolio(manager, name);
            if (!success) {
                this.showAppleAlertModal('Already Exists', `A portfolio named "${name}" already exists.`);
                return;
            }
            this.playClickSound();
            close();
            if (typeof onCreated === 'function') onCreated(name);
            if (window.ShareUI && window.ShareUI.showToast) {
                window.ShareUI.showToast('Portfolio Created', `Created "${name}" successfully`, 'success');
            }
        };

        if (btnSave) btnSave.onclick = handleSave;
        if (inputName) {
            inputName.onkeydown = (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSave();
                }
            };
        }

        overlay.onclick = (e) => {
            if (e.target === overlay) close();
        };
    }

    static showDeletePortfolioModal(manager, portfolioName, itemCount = 0) {
        const existing = document.getElementById('nw-delete-portfolio-modal');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.id = 'nw-delete-portfolio-modal';
        overlay.className = 'share-overlay';
        overlay.innerHTML = `
            <div class="share-modal-card">
                <div class="share-modal-body">
                    <div class="share-modal-icon-badge text-rose-400 bg-rose-500/10">
                        <i data-lucide="folder-x" class="w-8 h-8"></i>
                    </div>
                    <h3 class="share-modal-title">Delete Portfolio</h3>
                    <p class="share-modal-message">Are you sure you want to delete <strong class="text-white">${portfolioName}</strong>? Any items in this folder (${itemCount} items) will be moved back to <strong class="text-cyan-400">Main Portfolio</strong>.</p>
                    <div class="share-modal-divider"></div>
                    <div class="share-modal-actions flex gap-3">
                        <button id="btn-nw-del-port-cancel" class="share-modal-btn share-modal-btn-cancel flex-1 py-2.5 rounded-xl font-bold font-mono text-xs cursor-pointer border-0">
                            Cancel
                        </button>
                        <button id="btn-nw-del-port-confirm" class="share-modal-btn share-modal-btn-confirm bg-rose-600 hover:bg-rose-500 text-white flex-1 py-2.5 rounded-xl font-bold font-mono text-xs cursor-pointer border-0">
                            Delete Folder
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

        const btnCancel = overlay.querySelector('#btn-nw-del-port-cancel');
        const btnConfirm = overlay.querySelector('#btn-nw-del-port-confirm');

        if (btnCancel) {
            btnCancel.onclick = () => {
                this.playClickSound();
                close();
            };
        }

        if (btnConfirm) {
            btnConfirm.onclick = () => {
                this.playClickSound();
                NetWorthPortfolioService.deletePortfolio(manager, portfolioName);
                close();
                this.playRemoveSound();
                manager.populatePortfolioDropdowns();
                manager.render();
                if (window.ShareUI && window.ShareUI.showToast) {
                    window.ShareUI.showToast('Portfolio Deleted', `"${portfolioName}" removed, items moved to Main Portfolio`, 'info');
                }
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

        if (manager.items.length === 0) {
            container.className = 'flex-1 min-h-0 overflow-y-auto space-y-2 pr-1 flex items-center justify-center';
            container.style.maxHeight = '';
            container.style.overflowY = '';
            container.innerHTML = '<div class="text-center text-slate-500 py-12 text-xs font-mono">No financial items recorded yet.</div>';
            return;
        }

        if (filtered.length === 0) {
            container.className = 'flex-1 min-h-0 overflow-y-auto space-y-2 pr-1 flex items-center justify-center';
            container.style.maxHeight = '';
            container.style.overflowY = '';
            container.innerHTML = '<div class="text-center text-slate-500 py-12 text-xs font-mono">No financial items recorded in this view.</div>';
            return;
        }

        container.className = 'flex-1 min-h-0 overflow-y-auto space-y-2.5 pr-1 select-none nw-items-scroll';
        container.style.maxHeight = '';
        container.style.overflowY = '';
        container.innerHTML = '';

        const allPortfolios = NetWorthPortfolioService.getPortfolios(manager);
        const grouped = {};
        allPortfolios.forEach(p => {
            grouped[p] = [];
        });

        filtered.forEach(item => {
            const p = item.portfolio || NetWorthPortfolioService.DEFAULT_PORTFOLIO;
            if (!grouped[p]) {
                grouped[p] = [];
            }
            grouped[p].push(item);
        });

        const symbol = manager.currency === 'THB' ? '฿' : '$';

        // In filter !== 'ALL', only display portfolios that have matching items
        const portfoliosToRender = manager.filter === 'ALL'
            ? allPortfolios
            : allPortfolios.filter(p => (grouped[p] && grouped[p].length > 0));

        portfoliosToRender.forEach(pName => {
            const groupItems = grouped[pName] || [];
            const metrics = NetWorthPortfolioService.calculatePortfolioMetrics(manager, groupItems);
            const isCollapsed = NetWorthPortfolioService.isCollapsed(pName);
            const isDefault = pName === NetWorthPortfolioService.DEFAULT_PORTFOLIO;

            const groupEl = document.createElement('div');
            groupEl.className = 'nw-portfolio-group rounded-2xl bg-slate-900/40 p-2.5 sm:p-3 transition-all border-0';
            groupEl.dataset.portfolio = pName;

            // Accordion Header
            const header = document.createElement('div');
            header.className = 'nw-portfolio-header flex items-center justify-between gap-2 p-2 rounded-xl hover:bg-slate-800/40 cursor-pointer select-none transition border-0';
            header.dataset.portfolio = pName;

            const pnlBadgeHtml = metrics.hasVolatile ? (() => {
                const isProfit = metrics.subtotalPnl >= 0;
                const sign = isProfit ? '+' : '';
                const pnlClass = isProfit ? 'text-emerald-400 bg-emerald-500/15' : 'text-rose-400 bg-rose-500/15';
                const pnlIcon = isProfit ? 'trending-up' : 'trending-down';
                return `<span class="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded inline-flex items-center gap-1 tabular-nums ${pnlClass}">
                    <i data-lucide="${pnlIcon}" class="w-2.5 h-2.5"></i>
                    <span>${sign}${metrics.pnlPercent.toFixed(2)}%</span>
                </span>`;
            })() : '';

            header.innerHTML = `
                <div class="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
                    <button type="button" class="nw-btn-toggle-portfolio text-slate-400 hover:text-cyan-400 transition shrink-0 p-1 rounded-lg border-0 bg-transparent cursor-pointer">
                        <i data-lucide="${isCollapsed ? 'chevron-right' : 'chevron-down'}" class="w-4 h-4"></i>
                    </button>
                    <div class="w-7 h-7 rounded-lg bg-cyan-500/15 text-cyan-400 flex items-center justify-center shrink-0">
                        <i data-lucide="${isCollapsed ? 'folder' : 'folder-open'}" class="w-3.5 h-3.5"></i>
                    </div>
                    <div class="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-wrap">
                        <span class="font-mono font-bold text-xs sm:text-sm text-slate-200 truncate max-w-[110px] xs:max-w-[180px] sm:max-w-none">${pName}</span>
                        <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 shrink-0">${metrics.itemCount} items</span>
                        ${!isDefault ? `
                        <button type="button" class="nw-btn-delete-portfolio text-slate-600 hover:text-rose-400 p-1.5 rounded-lg transition shrink-0 cursor-pointer border-0 bg-transparent" data-portfolio="${pName}" title="Delete portfolio folder (items move to Main Portfolio)">
                            <i data-lucide="trash-2" class="w-3 h-3"></i>
                        </button>
                        ` : ''}
                    </div>
                </div>

                <div class="flex items-center gap-2 sm:gap-3 shrink-0 text-right">
                    <div>
                        <span class="font-mono font-bold text-xs sm:text-sm block ${metrics.subtotalNet >= 0 ? 'text-emerald-400' : 'text-rose-400'} tabular-nums">
                            ${metrics.subtotalNet >= 0 ? '+' : '-'}${symbol}${Math.abs(metrics.subtotalNet).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        ${pnlBadgeHtml}
                    </div>
                </div>
            `;

            // Handle Header Clicks
            header.onclick = (e) => {
                const delBtn = e.target.closest('.nw-btn-delete-portfolio');
                if (delBtn) {
                    e.stopPropagation();
                    this.playClickSound();
                    this.showDeletePortfolioModal(manager, pName, groupItems.length);
                    return;
                }
                this.playClickSound();
                NetWorthPortfolioService.toggleCollapsed(pName);
                this.renderList(manager);
                if (window.lucide) window.lucide.createIcons();
            };

            groupEl.appendChild(header);

            // Group Items container
            const itemsContainer = document.createElement('div');
            itemsContainer.className = `nw-portfolio-items space-y-2 mt-2 ${isCollapsed ? 'hidden' : ''}`;

            if (groupItems.length === 0) {
                const emptyNotice = document.createElement('div');
                emptyNotice.className = 'text-center text-slate-500 py-3 text-[11px] font-mono';
                emptyNotice.innerText = 'No items in this portfolio yet. Add or edit records to assign here.';
                itemsContainer.appendChild(emptyNotice);
            } else {
                groupItems.forEach((item, idxInGroup) => {
                    const card = this.createItemCard(manager, item, idxInGroup, groupItems);
                    itemsContainer.appendChild(card);
                });
            }

            groupEl.appendChild(itemsContainer);
            container.appendChild(groupEl);
        });

        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    static createItemCard(manager, item, index, groupItems) {
        const isAsset = item.type === 'ASSET';
        const textClass = isAsset ? 'text-emerald-400' : 'text-red-400';
        const typeLabel = isAsset ? 'ASSET' : 'LIABILITY';
        const convertedAmt = manager.getItemConvertedAmount(item);
        const symbol = manager.currency === 'THB' ? '฿' : '$';

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
            ? 'bg-amber-950/20 shadow-[0_0_10px_rgba(245,158,11,0.15)]' 
            : 'bg-slate-900/60 hover:bg-slate-800/60';

        const card = document.createElement('div');
        card.className = `p-2.5 sm:p-3.5 rounded-xl ${borderClass} flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 group nw-item-card transition border-0`;
        card.dataset.index = index;
        card.dataset.id = item.id;
        card.dataset.portfolio = item.portfolio || NetWorthPortfolioService.DEFAULT_PORTFOLIO;

        const isVolatile = !!item.isVolatile;

        const renderNormalState = () => {
            const outdatedBadge = isOutdated 
                ? `<span class="text-[9px] font-mono font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded flex items-center gap-1 shrink-0" title="Not updated for over 7 days"><i data-lucide="clock" class="w-2.5 h-2.5"></i> >7d outdated</span>` 
                : '';

            const volatileBadge = isVolatile && item.symbol
                ? `<span class="text-[9px] font-mono font-bold text-cyan-300 bg-cyan-500/15 px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0">${item.symbol}</span>`
                : '';

            const volatileSubline = isVolatile
                ? `<div class="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 mt-0.5 flex-wrap">
                    <span class="text-slate-300 font-bold">${item.quantity} units</span>
                    <span class="text-slate-600">•</span>
                    <span>@$${(item.currentPrice || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</span>
                    <span class="text-slate-600">•</span>
                    <span class="text-amber-400/90">Cost: $${(item.avgCost || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</span>
                   </div>`
                : '';

            const pnlBadge = isVolatile && typeof item.unrealizedPnlPercent === 'number'
                ? (() => {
                    const isProfit = (item.unrealizedPnl || 0) >= 0;
                    const pnlSign = isProfit ? '+' : '';
                    const pnlColorClass = isProfit ? 'text-emerald-400 bg-emerald-500/15' : 'text-rose-400 bg-rose-500/15';
                    const pnlIcon = isProfit ? 'trending-up' : 'trending-down';
                    const rawPnl = manager.currency === 'USD' ? (item.unrealizedPnl || 0) : (item.unrealizedPnlThb || (item.unrealizedPnl || 0) * manager.exchangeRate);
                    const displayPnl = Math.abs(rawPnl);
                    return `<span class="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded flex items-center gap-1 tabular-nums ${pnlColorClass} shrink-0" title="Unrealized Profit/Loss">
                        <i data-lucide="${pnlIcon}" class="w-2.5 h-2.5"></i>
                        <span>${pnlSign}${item.unrealizedPnlPercent.toFixed(2)}% (${isProfit ? '+' : '-'}${symbol}${displayPnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</span>
                    </span>`;
                })()
                : '';

            const quickRefreshBtn = isVolatile
                ? `<button class="nw-refresh-single-btn size-7 sm:size-6 flex items-center justify-center rounded-lg text-slate-500 hover:text-cyan-400 hover:bg-slate-800 transition text-xs cursor-pointer border-0 bg-transparent shrink-0" data-id="${item.id}" title="Refresh Live Price">
                    <i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i>
                   </button>`
                : '';

            card.innerHTML = `
                <!-- ROW 1 (Mobile: Left Entity Info & Right Amount / Desktop: Left Entity Details) -->
                <div class="flex items-center justify-between sm:justify-start gap-2 sm:gap-2.5 min-w-0 sm:flex-1">
                    <div class="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1 sm:flex-initial">
                        <div class="nw-drag-handle p-1.5 -m-1 text-slate-500 hover:text-cyan-400 cursor-grab active:cursor-grabbing shrink-0 transition flex items-center justify-center touch-none" title="Press & drag or hold to reorder">
                            <i data-lucide="grip-vertical" class="w-4 h-4 pointer-events-none"></i>
                        </div>
                        <div class="min-w-0 flex-1">
                            <div class="flex items-center gap-1.5 flex-wrap">
                                <span class="font-bold font-mono text-slate-200 text-xs truncate max-w-[150px] xs:max-w-[220px] sm:max-w-none">${item.name}</span>
                                <span class="text-[9px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded shrink-0">${item.category}</span>
                                ${volatileBadge}
                                ${outdatedBadge}
                            </div>
                            <div class="hidden sm:block">
                                ${volatileSubline ? volatileSubline : `<span class="text-[10px] font-mono font-bold ${textClass}">${typeLabel}</span>`}
                            </div>
                        </div>
                    </div>

                    <!-- Mobile Converted Amount -->
                    <div class="sm:hidden text-right shrink-0">
                        <span class="font-mono font-bold text-xs ${textClass} tabular-nums">
                            ${isAsset ? '+' : '-'}${symbol}${convertedAmt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                    </div>
                </div>

                <!-- ROW 2 (Mobile: Subline + PnL + Actions / Desktop: Converted Amount + PnL + Actions) -->
                <div class="flex items-center justify-between sm:justify-end gap-2 sm:gap-2.5 pt-1.5 sm:pt-0 border-t border-slate-800/40 sm:border-0 shrink-0 w-full sm:w-auto">
                    <!-- Mobile Subline -->
                    <div class="sm:hidden min-w-0 flex-1">
                        ${volatileSubline ? volatileSubline : `<span class="text-[10px] font-mono font-bold ${textClass}">${typeLabel}</span>`}
                    </div>

                    <!-- Desktop Amount & PnL -->
                    <div class="text-right flex items-center sm:flex-col sm:items-end gap-1.5 sm:gap-0 shrink-0">
                        <span class="hidden sm:block font-mono font-bold text-sm ${textClass} tabular-nums">
                            ${isAsset ? '+' : '-'}${symbol}${convertedAmt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        ${pnlBadge}
                    </div>

                    <!-- Action Buttons -->
                    <div class="flex items-center gap-1 shrink-0">
                        ${quickRefreshBtn}
                        <button class="edit-nw-btn size-7 sm:size-6 flex items-center justify-center rounded-lg text-slate-500 hover:text-cyan-400 hover:bg-slate-800 transition text-xs cursor-pointer border-0 bg-transparent" data-id="${item.id}" title="Edit Record">
                            <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
                        </button>
                        <button class="delete-nw-btn size-7 sm:size-6 flex items-center justify-center rounded-lg text-slate-600 hover:text-rose-400 hover:bg-slate-800 transition text-xs cursor-pointer border-0 bg-transparent" data-id="${item.id}" title="Delete Record">✕</button>
                    </div>
                </div>
            `;

            // Custom Pointer Drag Tracking for 6-dot grip handle within group or cross-portfolio move
            NetWorthDragHandler.attachDragListeners(manager, card, item, index, groupItems);

            const btnRefreshSingle = card.querySelector('.nw-refresh-single-btn');
            if (btnRefreshSingle) {
                btnRefreshSingle.onclick = async (e) => {
                    e.stopPropagation();
                    this.playClickSound();
                    const icon = btnRefreshSingle.querySelector('svg, i');
                    if (icon) icon.classList.add('animate-spin');
                    try {
                        const res = await manager.updateSingleVolatilePrice(item.id);
                        if (res && res.success) {
                            if (window.ShareUI && window.ShareUI.showToast) {
                                window.ShareUI.showToast('Price Updated', `${res.symbol}: $${res.price.toLocaleString()}`, 'success');
                            }
                        } else {
                            if (window.ShareUI && window.ShareUI.showToast) {
                                window.ShareUI.showToast('Fetch Error', res?.error || 'Failed to fetch price', 'error');
                            }
                        }
                    } finally {
                        if (icon) icon.classList.remove('animate-spin');
                    }
                };
            }

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
            const categories = ['Cash & Bank', 'Stocks / ETFs', 'Crypto', 'Real Estate & Vehicle', 'Credit & Debt', 'Other'];
            const currentCat = item.category === 'Investments' ? 'Stocks / ETFs' : (item.category === 'Valuables & Crypto' ? 'Crypto' : (item.category === 'Valuables' ? 'Other' : item.category));
            const categoryOptions = categories.map(cat => `<option value="${cat}" ${currentCat === cat ? 'selected' : ''}>${cat}</option>`).join('');
            const displayAmt = convertedAmt.toFixed(2);

            const portfolios = NetWorthPortfolioService.getPortfolios(manager);
            const currentPortfolio = item.portfolio || NetWorthPortfolioService.DEFAULT_PORTFOLIO;
            const portfolioOptions = portfolios.map(p => `<option value="${p}" ${currentPortfolio === p ? 'selected' : ''}>${p}</option>`).join('');

            if (isVolatile) {
                card.innerHTML = `
                    <div class="w-full flex flex-col gap-2.5 p-1 font-mono text-xs">
                        <div class="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-4 gap-2">
                            <input type="text" class="nw-edit-name bg-slate-950 text-slate-200 rounded-lg px-2.5 py-1 text-xs focus:ring-1 focus:ring-cyan-500 outline-none border-0" value="${item.name}" placeholder="Item Name">
                            <select class="nw-edit-cat bg-slate-950 text-slate-300 rounded-lg px-2 py-1 text-[11px] focus:ring-1 focus:ring-cyan-500 outline-none border-0">
                                ${categoryOptions}
                            </select>
                            <select class="nw-edit-portfolio bg-slate-950 text-cyan-300 rounded-lg px-2 py-1 text-[11px] focus:ring-1 focus:ring-cyan-500 outline-none border-0" title="Portfolio Group">
                                ${portfolioOptions}
                            </select>
                            <input type="text" class="nw-edit-symbol bg-slate-950 text-cyan-300 font-bold uppercase rounded-lg px-2.5 py-1 text-xs focus:ring-1 focus:ring-cyan-500 outline-none border-0" value="${item.symbol || ''}" placeholder="Symbol (e.g. BTC)">
                        </div>
                        <div class="grid grid-cols-1 xs:grid-cols-3 gap-2">
                            <div>
                                <label class="text-[9px] text-slate-500 block mb-0.5">Holding Units</label>
                                <input type="number" step="any" class="nw-edit-qty w-full bg-slate-950 text-slate-200 rounded-lg px-2 py-1 text-xs focus:ring-1 focus:ring-cyan-500 outline-none tabular-nums border-0" value="${item.quantity || 0}" placeholder="Units">
                            </div>
                            <div>
                                <label class="text-[9px] text-slate-500 block mb-0.5">Avg Cost ($)</label>
                                <input type="number" step="any" class="nw-edit-avg-cost w-full bg-slate-950 text-amber-300 font-bold rounded-lg px-2 py-1 text-xs focus:ring-1 focus:ring-amber-500 outline-none tabular-nums border-0" value="${item.avgCost || 0}" placeholder="Cost">
                            </div>
                            <div>
                                <label class="text-[9px] text-slate-500 block mb-0.5">Market Price ($)</label>
                                <input type="number" step="any" class="nw-edit-price w-full bg-slate-950 text-emerald-400 font-bold rounded-lg px-2 py-1 text-xs focus:ring-1 focus:ring-emerald-500 outline-none tabular-nums border-0" value="${item.currentPrice || 0}" placeholder="Price">
                            </div>
                        </div>
                        <div class="flex items-center justify-end gap-2 pt-1">
                            <button class="nw-save-volatile-btn px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold transition cursor-pointer border-0">Save Changes</button>
                            <button class="nw-cancel-btn px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-lg text-xs transition cursor-pointer border-0">Cancel</button>
                        </div>
                    </div>
                `;

                const btnSaveVolatile = card.querySelector('.nw-save-volatile-btn');
                if (btnSaveVolatile) {
                    btnSaveVolatile.onclick = (e) => {
                        e.stopPropagation();
                        this.playClickSound();
                        const newName = card.querySelector('.nw-edit-name').value.trim();
                        const newCat = card.querySelector('.nw-edit-cat').value;
                        const newPort = card.querySelector('.nw-edit-portfolio').value;
                        const newSym = card.querySelector('.nw-edit-symbol').value.trim();
                        const newQty = parseFloat(card.querySelector('.nw-edit-qty').value);
                        const newCost = parseFloat(card.querySelector('.nw-edit-avg-cost').value);
                        const newPrice = parseFloat(card.querySelector('.nw-edit-price').value);

                        if (manager.editVolatileItem(item.id, {
                            name: newName,
                            category: newCat,
                            portfolio: newPort,
                            symbol: newSym,
                            quantity: newQty,
                            avgCost: newCost,
                            currentPrice: newPrice
                        })) {
                            manager.render();
                        }
                    };
                }
            } else {
                card.innerHTML = `
                    <div class="w-full flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-1 font-mono">
                        <div class="grid grid-cols-1 xs:grid-cols-3 gap-2 flex-1">
                            <input type="text" class="nw-edit-name bg-slate-950 text-slate-200 rounded-lg px-2.5 py-1 text-xs focus:ring-1 focus:ring-cyan-500 outline-none border-0" value="${item.name}" placeholder="Item Name">
                            <select class="nw-edit-cat bg-slate-950 text-slate-300 rounded-lg px-2 py-1 text-[11px] focus:ring-1 focus:ring-cyan-500 outline-none border-0">
                                ${categoryOptions}
                            </select>
                            <select class="nw-edit-portfolio bg-slate-950 text-cyan-300 rounded-lg px-2 py-1 text-[11px] focus:ring-1 focus:ring-cyan-500 outline-none border-0" title="Portfolio Group">
                                ${portfolioOptions}
                            </select>
                        </div>
                        <div class="flex items-center justify-end gap-2">
                            <input type="number" step="0.01" min="0" class="nw-edit-amount w-full sm:w-28 bg-slate-950 text-emerald-400 font-bold rounded-lg px-2.5 py-1 text-xs focus:ring-1 focus:ring-cyan-500 outline-none tabular-nums border-0" value="${displayAmt}" placeholder="Amount">
                            <button class="nw-save-btn px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold transition cursor-pointer border-0">Save</button>
                            <button class="nw-cancel-btn px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-lg text-xs transition cursor-pointer border-0">Cancel</button>
                        </div>
                    </div>
                `;

                const btnSave = card.querySelector('.nw-save-btn');
                if (btnSave) {
                    btnSave.onclick = (e) => {
                        e.stopPropagation();
                        this.playClickSound();
                        const newName = card.querySelector('.nw-edit-name').value.trim();
                        const newCat = card.querySelector('.nw-edit-cat').value;
                        const newPort = card.querySelector('.nw-edit-portfolio').value;
                        const newAmt = card.querySelector('.nw-edit-amount').value;
                        if (manager.editItem(item.id, newName, newCat, newAmt, newPort)) {
                            manager.render();
                        }
                    };
                }
            }

            const btnCancel = card.querySelector('.nw-cancel-btn');
            if (btnCancel) {
                btnCancel.onclick = (e) => {
                    e.stopPropagation();
                    this.playClickSound();
                    renderNormalState();
                };
            }
        };

        renderNormalState();
        return card;
    }
}
