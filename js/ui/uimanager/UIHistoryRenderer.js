export class UIHistoryRenderer {
    static initHistoryTabs(uiManager) {
        if (uiManager.dom.historyTabs.trades) {
            uiManager.dom.historyTabs.trades.onclick = () => this.setHistoryFilter(uiManager, 'TRADES');
        }
        if (uiManager.dom.historyTabs.transfers) {
            uiManager.dom.historyTabs.transfers.onclick = () => this.setHistoryFilter(uiManager, 'TRANSFERS');
        }
    }

    static setHistoryFilter(uiManager, filter) {
        uiManager.historyState.filter = filter;
        
        const t = uiManager.dom.historyTabs.trades;
        const f = uiManager.dom.historyTabs.transfers;
        const activeClasses = ['bg-slate-700', 'text-cyan-400', 'shadow-sm'];
        const inactiveClasses = ['text-slate-500', 'hover:text-slate-300'];

        if (t && f) {
            if (filter === 'TRADES') {
                t.classList.add(...activeClasses);
                t.classList.remove(...inactiveClasses);
                f.classList.remove(...activeClasses);
                f.classList.add(...inactiveClasses);
            } else {
                f.classList.add(...activeClasses);
                f.classList.remove(...inactiveClasses);
                t.classList.remove(...activeClasses);
                t.classList.add(...inactiveClasses);
            }
        }

        this.renderInternalHistoryList(uiManager);
    }

    static renderTradeList(uiManager, trades, onDelete) {
        uiManager.historyState.data = trades;
        uiManager.historyState.onDelete = onDelete;
        this.renderInternalHistoryList(uiManager);
    }

    static renderInternalHistoryList(uiManager) {
        if (!uiManager.dom.list) return;
        uiManager.dom.list.innerHTML = '';
        const { data, filter, onDelete } = uiManager.historyState;

        const filteredTrades = data.filter(t => {
            const type = t.type || (t.amount >= 0 ? 'WIN' : 'LOSS');
            if (filter === 'TRADES') {
                return type === 'WIN' || type === 'LOSS';
            } else {
                return type === 'DEPOSIT' || type === 'WITHDRAW';
            }
        });

        if (filteredTrades.length === 0) {
            uiManager.dom.list.innerHTML = '<div class="text-center text-slate-500 py-10 text-sm">No data found in this category.</div>';
            return;
        }

        filteredTrades.forEach(t => {
            let borderClass = 'border-green-500', textClass = 'text-green-400', label = 'WIN';
            let type = t.type || (t.amount >= 0 ? 'WIN' : 'LOSS');
            const dateStr = (t.date && typeof t.date === 'string' && t.date.match(/^\d{4}-\d{2}-\d{2}/)) ? t.date : 'N/A';

            if (type === 'LOSS') { borderClass = 'border-red-500'; textClass = 'text-red-400'; label = 'LOSS'; }
            else if (type === 'DEPOSIT') { borderClass = 'border-blue-500'; textClass = 'text-blue-400'; label = 'DEPOSIT'; }
            else if (type === 'WITHDRAW') { borderClass = 'border-orange-500'; textClass = 'text-orange-400'; label = 'WITHDRAW'; }

            const div = document.createElement('div');
            div.className = `bg-slate-800/50 p-3 rounded-lg border-l-4 flex justify-between items-center group hover:bg-slate-800 transition ${borderClass}`;
            div.innerHTML = `
                <div>
                    <div class="flex items-center gap-2">
                        <span class="font-bold font-mono text-slate-200">${t.asset}</span>
                        <span class="text-xs text-slate-500 bg-slate-900 px-1 rounded">${dateStr}</span>
                    </div>
                    <div class="text-xs ${textClass} font-bold">${label}</div>
                </div>
                <div class="flex items-center gap-3">
                    <span class="font-mono font-bold text-lg ${textClass}">${t.amount > 0 ? '+' : ''}${Math.abs(t.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    <button class="delete-btn opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition" data-id="${t.firestoreId}">✕</button>
                </div>`;

            div.querySelector('.delete-btn').onclick = () => {
                if (typeof onDelete === 'function') onDelete(t.firestoreId);
            };
            uiManager.dom.list.appendChild(div);
        });
    }

    static renderNotes(uiManager, data, onDeleteItem) {
        const { title, list } = uiManager.dom.notes;
        
        if (title && data.title !== undefined && document.activeElement !== title) {
            title.value = data.title;
        }

        if (!list) return;
        list.innerHTML = '';
        if (data.items && data.items.length > 0) {
            data.items.forEach((item, index) => {
                const li = document.createElement('li');
                li.className = 'flex items-start gap-2 group';
                li.innerHTML = `
                    <span class="text-amber-500 mt-1.5">•</span>
                    <span class="flex-1 text-slate-300 text-sm leading-relaxed font-mono">${item}</span>
                    <button class="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition px-2" data-index="${index}">✕</button>
                `;
                li.querySelector('button').onclick = () => {
                    if (typeof onDeleteItem === 'function') onDeleteItem(index);
                };
                list.appendChild(li);
            });
        } else {
            list.innerHTML = '<li class="text-slate-600 text-xs italic">No items yet. Add one below.</li>';
        }
    }
}
