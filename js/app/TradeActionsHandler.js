import { ShareUI } from '../ui/share/ShareUI.js';

export class TradeActionsHandler {
    constructor(app) {
        this.app = app;
        this.DEFAULT_ASSETS = ['BTC/USD', 'XAU/USD', 'USOIL', 'EUR/USD'];
        setTimeout(() => this.loadAssets(), 0);
    }

    getAssets() {
        try {
            const raw = localStorage.getItem('tradeTrackAssets');
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            }
        } catch (e) {}
        return [...this.DEFAULT_ASSETS];
    }

    loadAssets() {
        const select = document.getElementById('input-asset');
        if (!select) return;
        const assets = this.getAssets();
        const currentVal = select.value;
        select.innerHTML = '';
        assets.forEach(asset => {
            const opt = document.createElement('option');
            opt.value = asset;
            opt.textContent = asset;
            select.appendChild(opt);
        });
        if (assets.includes(currentVal)) {
            select.value = currentVal;
        } else if (assets.length > 0) {
            select.value = assets[0];
        }
    }

    saveAssets(assets) {
        try {
            localStorage.setItem('tradeTrackAssets', JSON.stringify(assets));
        } catch (e) {}
        this.loadAssets();
    }

    addAsset(newAssetSymbol) {
        if (!newAssetSymbol) return false;
        const symbol = newAssetSymbol.trim().toUpperCase();
        if (!symbol) return false;
        const assets = this.getAssets();
        if (!assets.includes(symbol)) {
            assets.push(symbol);
            this.saveAssets(assets);
            const select = document.getElementById('input-asset');
            if (select) select.value = symbol;
            ShareUI.playSound('success');
            return true;
        } else {
            ShareUI.showToast('Duplicate Asset', `"${symbol}" is already in your asset list.`, 'error');
            return false;
        }
    }

    deleteAsset(symbol) {
        let assets = this.getAssets();
        if (assets.length <= 1) {
            ShareUI.showToast('Limit Reached', 'You must keep at least one asset type.', 'error');
            return false;
        }
        assets = assets.filter(a => a !== symbol);
        this.saveAssets(assets);
        ShareUI.playSound('remove');
        return true;
    }

    showManageAssetsModal() {
        ShareUI.playSound('mouse-click');
        const existing = document.getElementById('trade-assets-modal');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.id = 'trade-assets-modal';
        overlay.className = 'share-overlay';
        overlay.innerHTML = `
            <div class="share-modal-card max-w-md w-full" style="max-width: 440px;">
                <div class="p-6 flex flex-col gap-4 text-left">
                    <div class="flex justify-between items-center border-b border-slate-800 pb-3">
                        <div class="flex items-center gap-2">
                            <i data-lucide="layers" class="w-5 h-5 text-cyan-400"></i>
                            <h3 class="text-sm font-mono font-bold text-white uppercase tracking-wider">Manage Asset Types</h3>
                        </div>
                        <button id="btn-close-assets-modal" class="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition">
                            <i data-lucide="x" class="w-5 h-5"></i>
                        </button>
                    </div>

                    <div class="flex flex-col gap-2">
                        <label class="text-xs text-cyan-400 font-mono font-bold uppercase">Add New Asset Symbol</label>
                        <div class="flex gap-2">
                            <input type="text" id="new-asset-input" placeholder="e.g. ETH/USD, SET50..." class="flex-1 bg-slate-950 text-slate-100 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono focus:border-cyan-500 focus:outline-none uppercase">
                            <button id="btn-add-asset-submit" class="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-bold transition flex items-center gap-1">
                                <i data-lucide="plus" class="w-4 h-4"></i> Add
                            </button>
                        </div>
                    </div>

                    <div class="flex flex-col gap-2 mt-2">
                        <label class="text-xs text-slate-400 font-mono font-bold uppercase">Current Asset Categories</label>
                        <div id="asset-list-container" class="max-h-48 overflow-y-auto flex flex-col gap-1.5 pr-1">
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        if (window.lucide) window.lucide.createIcons();

        const renderModalAssetList = () => {
            const container = overlay.querySelector('#asset-list-container');
            if (!container) return;
            const assets = this.getAssets();
            container.innerHTML = '';
            assets.forEach(asset => {
                const itemEl = document.createElement('div');
                itemEl.className = 'flex justify-between items-center p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80 text-xs font-mono text-slate-200 hover:border-slate-700 transition';
                itemEl.innerHTML = `
                    <span class="font-bold text-cyan-300">${asset}</span>
                    <button class="btn-delete-asset-item p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition" title="Delete ${asset}">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                `;
                const btnDel = itemEl.querySelector('.btn-delete-asset-item');
                btnDel.onclick = () => {
                    if (this.deleteAsset(asset)) {
                        renderModalAssetList();
                    }
                };
                container.appendChild(itemEl);
            });
            if (window.lucide) window.lucide.createIcons();
        };

        renderModalAssetList();

        requestAnimationFrame(() => {
            overlay.classList.add('share-overlay-visible');
            const card = overlay.querySelector('.share-modal-card');
            if (card) card.classList.add('share-modal-card-visible');
        });

        const closeModal = () => {
            ShareUI.playSound('mouse-click');
            overlay.classList.remove('share-overlay-visible');
            const card = overlay.querySelector('.share-modal-card');
            if (card) card.classList.remove('share-modal-card-visible');
            setTimeout(() => overlay.remove(), 200);
        };

        const btnClose = overlay.querySelector('#btn-close-assets-modal');
        if (btnClose) btnClose.onclick = closeModal;

        const inputNew = overlay.querySelector('#new-asset-input');
        const btnAdd = overlay.querySelector('#btn-add-asset-submit');

        const submitNewAsset = () => {
            if (inputNew && inputNew.value.trim()) {
                if (this.addAsset(inputNew.value)) {
                    inputNew.value = '';
                    renderModalAssetList();
                }
            }
        };

        if (btnAdd) btnAdd.onclick = submitNewAsset;
        if (inputNew) {
            inputNew.onkeydown = (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    submitNewAsset();
                }
            };
        }

        overlay.onclick = (e) => {
            if (e.target === overlay) closeModal();
        };
    }

    async handleAddTrade() {
        ShareUI.playSound('mouse-click');
        if (!this.app.auth.currentUser) return;
        const dom = this.app.ui.dom.inputs;
        const date = dom.date ? dom.date.value : '';
        const asset = (dom.asset && dom.asset.disabled) ? 'CASH' : (dom.asset ? dom.asset.value : 'BTC/USD');
        const type = dom.type ? dom.type.value : 'WIN';
        let amount = parseFloat(dom.amount ? dom.amount.value : '');

        if (!date || isNaN(amount) || amount <= 0) {
            ShareUI.playSound('mouse-click');
            await ShareUI.showAlertModal({
                title: 'Missing Input Data',
                message: 'Please select a valid transaction date and enter a positive trade amount (USD) before confirming.',
                icon: 'alert-circle',
                iconColor: 'text-cyan-400'
            });
            return;
        }

        amount = Math.abs(amount);
        if (type === 'LOSS' || type === 'WITHDRAW') amount = -amount;

        const ts = Date.now();
        const trade = {
            id: ts,
            order_index: ts,
            date, asset, type, amount,
            timestamp: new Date().toISOString()
        };

        await this.app.data.addTrade(this.app.auth.currentUser.uid, trade);
        if (dom.amount) dom.amount.value = '';
        if (dom.date) dom.date.value = this.app.getThaiDateString(); 
        ShareUI.playSound('success');
    }

    async handleDelete(id) {
        const confirmed = await ShareUI.showConfirmModal({
            icon: 'trash-2',
            iconColor: 'text-red-400',
            title: 'Delete Record',
            message: 'Are you sure you want to delete this trade record permanently?',
            confirmLabel: 'Delete',
            confirmClass: 'bg-red-600 hover:bg-red-500 text-white'
        });
        if (confirmed) {
            const trade = this.app.trades.find(t => t.firestoreId === id);
            await this.app.data.deleteTrade(this.app.auth.currentUser.uid, id, trade);
        }
    }

    async handleReset() {
        const confirmed = await ShareUI.showConfirmModal({
            icon: 'alert-triangle',
            iconColor: 'text-red-400',
            title: 'Wipe All Data',
            message: 'Are you sure you want to wipe ALL trade history permanently? This action cannot be undone.',
            confirmLabel: 'Wipe All Data',
            confirmClass: 'bg-red-600 hover:bg-red-500 text-white'
        });
        if (confirmed) {
            await this.app.data.resetAll(this.app.auth.currentUser.uid, this.app.trades);
        }
    }

    handleExport() {
        if (this.app.trades.length === 0) return;
        let csv = "Date,Asset,Type,Amount\n" + this.app.trades.map(t => `${t.date},${t.asset},${t.type},${t.amount}`).join('\n');
        const link = document.createElement("a");
        link.href = encodeURI("data:text/csv;charset=utf-8," + csv);
        link.download = "trades.csv";
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
    }

    handleImport(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (event) => {
            const items = this.app.data.parseCSV(event.target.result);
            if (items && confirm(`Import ${items.length} items?`)) {
                for (const item of items) {
                    await this.app.data.addTrade(this.app.auth.currentUser.uid, item);
                }
                alert("Import Complete");
                e.target.value = '';
            }
        };
        reader.readAsText(file);
    }
}
