/**
 * layoutSync.js - Handles responsive column height synchronization and share feed filtering.
 */

export function syncTradeColHeight() {
    const leftCol = document.getElementById('trade-left-col');
    const commitsPanel = document.getElementById('trade-commits-panel');
    const csvCard = document.querySelector('#trade-right-col .glass-panel:last-of-type');
    if (!leftCol || !commitsPanel) return;

    commitsPanel.style.transition = 'none';
    const leftH = leftCol.offsetHeight;
    const csvH = csvCard ? (csvCard.offsetHeight + 24) : 0;
    const targetH = Math.max(leftH - csvH, 200);

    commitsPanel.style.height = targetH + 'px';
    commitsPanel.style.maxHeight = targetH + 'px';
}

export function syncSharePanelHeight() {
    const leftCol = document.getElementById('share-left-col');
    const rightPanel = document.getElementById('share-right-panel');
    if (!leftCol || !rightPanel) return;
    const h = leftCol.offsetHeight;
    if (h > 0) {
        rightPanel.style.height = h + 'px';
        rightPanel.style.maxHeight = h + 'px';
    }
}

let activeShareFilter = 'all';

export function applyShareFilter() {
    const feed = document.getElementById('share-feed');
    if (!feed) return;
    const searchEl = document.getElementById('share-search');
    const search = (searchEl ? searchEl.value : '').toLowerCase();
    const items = feed.querySelectorAll('[data-share-type]');
    let visible = 0;
    
    items.forEach(el => {
        const type = (el.dataset.shareType || '').toLowerCase();
        const text = el.textContent.toLowerCase();
        let typeMatch;
        if (activeShareFilter === 'all') {
            typeMatch = true;
        } else if (activeShareFilter === 'starred') {
            typeMatch = el.dataset.starred === 'true';
        } else {
            typeMatch = type === activeShareFilter;
        }
        const searchMatch = !search || text.includes(search);
        const show = typeMatch && searchMatch;
        el.style.display = show ? '' : 'none';
        if (show) visible++;
    });

    const badge = document.getElementById('share-count-badge');
    if (badge) badge.textContent = visible;

    let emptyEl = feed.querySelector('.share-empty-state');
    if (items.length === 0 || visible === 0) {
        if (!emptyEl) {
            emptyEl = document.createElement('div');
            emptyEl.className = 'share-empty-state flex flex-col items-center justify-center py-16 text-slate-500';
            const label = activeShareFilter === 'all' ? 'No items shared yet'
                : activeShareFilter === 'starred' ? 'No starred items yet — click ★ on a card to star it'
                : 'No ' + activeShareFilter + ' items found';
            emptyEl.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="w-10 h-10 mb-2 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 7h18M3 12h18M3 17h18"/></svg><p class="text-sm">${label}</p>`;
            feed.appendChild(emptyEl);
        }
        emptyEl.style.display = '';
    } else if (emptyEl) {
        emptyEl.style.display = 'none';
    }

    if (window.shareManager && typeof window.shareManager.updateSelectedUI === 'function') {
        window.shareManager.updateSelectedUI();
    }
}

export function activateShareFilter(btn) {
    activeShareFilter = btn.dataset.filter;
    document.querySelectorAll('.share-filter-btn').forEach(b => {
        const active = b === btn;
        b.classList.toggle('active-filter', active);
        b.classList.toggle('bg-cyan-500/15', active);
        b.classList.toggle('border-cyan-500/40', active);
        b.classList.toggle('text-cyan-400', active);
        b.classList.toggle('bg-slate-800/50', !active);
        b.classList.toggle('border-slate-700', !active);
        b.classList.toggle('text-slate-400', !active);
    });
    applyShareFilter();
}

export function initLayoutSync() {
    syncTradeColHeight();
    syncSharePanelHeight();

    const tradeLeftCol = document.getElementById('trade-left-col');
    if (tradeLeftCol && window.ResizeObserver) {
        new ResizeObserver(syncTradeColHeight).observe(tradeLeftCol);
    }

    const shareLeftCol = document.getElementById('share-left-col');
    if (shareLeftCol && window.ResizeObserver) {
        new ResizeObserver(syncSharePanelHeight).observe(shareLeftCol);
    }

    window.addEventListener('resize', () => {
        syncTradeColHeight();
        syncSharePanelHeight();
    });

    document.addEventListener('click', e => {
        const btn = e.target.closest('.share-filter-btn');
        if (btn) activateShareFilter(btn);
    });

    document.addEventListener('input', e => {
        if (e.target.id === 'share-search') applyShareFilter();
    });

    const feedObserver = new MutationObserver(() => applyShareFilter());
    const feed = document.getElementById('share-feed');
    if (feed) feedObserver.observe(feed, { childList: true, subtree: false });
}
