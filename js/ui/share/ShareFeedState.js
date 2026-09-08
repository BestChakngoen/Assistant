/**
 * ShareFeedState.js - Feed Starred, Selection & Edit Mode State Manager
 * Handles starred persistence, batch card selection, and inline editing workflows.
 */
import { ShareUI } from './ShareUI.js';

export class ShareFeedState {
    static loadStarred(shareManager) {
        try {
            const raw = localStorage.getItem('shareStarredIds');
            if (raw) shareManager.starredIds = new Set(JSON.parse(raw));
        } catch (e) {
            shareManager.starredIds = new Set();
        }
    }

    static saveStarred(shareManager) {
        try {
            localStorage.setItem('shareStarredIds', JSON.stringify([...shareManager.starredIds]));
        } catch (e) {}
    }

    static toggleStar(shareManager, itemId) {
        this.exitEditMode(shareManager);
        const isStarred = !shareManager.starredIds.has(itemId);

        if (isStarred) {
            shareManager.starredIds.add(itemId);
        } else {
            shareManager.starredIds.delete(itemId);
        }
        this.saveStarred(shareManager);

        // In-place update of target card without destroying the feed DOM
        const card = shareManager.dom.feed?.querySelector(`[data-item-id="${itemId}"]`);
        if (card) {
            if (isStarred) {
                card.dataset.starred = 'true';
            } else {
                delete card.dataset.starred;
            }

            const btnStar = card.querySelector('[data-star-btn="true"]');
            if (btnStar) {
                btnStar.className = `p-1 rounded transition ${isStarred ? 'text-amber-400 hover:text-amber-300 hover:bg-amber-500/10' : 'text-slate-500 hover:text-amber-400 hover:bg-slate-800/50'}`;
                btnStar.title = isStarred ? 'Unstar item' : 'Star item';
                if (isStarred) {
                    btnStar.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
                } else {
                    btnStar.innerHTML = '<i data-lucide="star" class="w-3.5 h-3.5"></i>';
                    if (window.lucide) window.lucide.createIcons();
                }
            }

            // If currently filtering by starred, hide the card when unstarred
            if (shareManager.currentFilter === 'starred' && !isStarred) {
                card.style.display = 'none';
            }
        }
    }

    static toggleSelectAll(shareManager, forceChecked) {
        if (!shareManager.dom.feed) return;
        const visibleCards = Array.from(shareManager.dom.feed.querySelectorAll('[data-share-type]')).filter(el => el.style.display !== 'none');
        if (visibleCards.length === 0) return;

        let shouldSelectAll;
        if (typeof forceChecked === 'boolean') {
            shouldSelectAll = forceChecked;
        } else {
            const allSelected = visibleCards.every(card => shareManager.selectedIds.has(card.dataset.itemId));
            shouldSelectAll = !allSelected;
        }

        visibleCards.forEach(card => {
            const id = card.dataset.itemId;
            if (id) {
                if (shouldSelectAll) shareManager.selectedIds.add(id);
                else shareManager.selectedIds.delete(id);
            }
        });
        this.updateSelectedUI(shareManager);
    }

    static updateSelectedUI(shareManager) {
        const count = shareManager.selectedIds.size;
        if (shareManager.dom.selectedCountText) shareManager.dom.selectedCountText.textContent = count;
        if (shareManager.dom.btnDeleteSelected) {
            if (count > 0) shareManager.dom.btnDeleteSelected.classList.remove('hidden');
            else shareManager.dom.btnDeleteSelected.classList.add('hidden');
        }

        if (shareManager.dom.feed) {
            const cards = shareManager.dom.feed.querySelectorAll('[data-item-id]');
            cards.forEach(card => {
                const itemId = card.dataset.itemId;
                const isSelected = shareManager.selectedIds.has(itemId);

                if (isSelected) {
                    card.classList.add('share-card-selected', 'border-cyan-500/50', 'bg-cyan-950/20');
                    card.classList.remove('border-slate-800/80', 'bg-slate-950/20');
                } else {
                    card.classList.remove('share-card-selected', 'border-cyan-500/50', 'bg-cyan-950/20');
                    card.classList.add('border-slate-800/80', 'bg-slate-950/20');
                }
            });
        }
    }

    static exitEditMode(shareManager) {
        if (shareManager.editingState) {
            try {
                const { bodyEl, originalHTML } = shareManager.editingState;
                if (bodyEl && document.body.contains(bodyEl)) {
                    bodyEl.innerHTML = originalHTML;
                    if (window.lucide) window.lucide.createIcons();
                }
            } catch (e) {}
            shareManager.editingState = null;
        }
    }

    static enterEditMode(shareManager, item, card, bodyEl) {
        this.exitEditMode(shareManager);

        const originalHTML = bodyEl.innerHTML;
        shareManager.editingState = { item, card, bodyEl, originalHTML };

        bodyEl.innerHTML = `
            <div class="flex flex-col gap-2 p-2 bg-slate-900/90 rounded-lg border border-cyan-500/40 edit-container-box">
                ${item.type === 'file' ? `
                    <label class="text-[10px] text-cyan-400 font-mono">EDIT TITLE:</label>
                    <input type="text" class="edit-title-input w-full bg-slate-950 text-slate-200 border border-slate-800 rounded px-2.5 py-1 text-xs focus:border-cyan-500 focus:outline-none" value="${item.title || ''}" placeholder="Title...">
                    <label class="text-[10px] text-cyan-400 font-mono mt-1">EDIT FILENAME:</label>
                    <input type="text" class="edit-text-input w-full bg-slate-950 text-slate-200 border border-slate-800 rounded px-2.5 py-1 text-xs focus:border-cyan-500 focus:outline-none" value="${item.filename || ''}">
                ` : `
                    <label class="text-[10px] text-cyan-400 font-mono">EDIT TITLE:</label>
                    <input type="text" class="edit-title-input w-full bg-slate-950 text-slate-200 border border-slate-800 rounded px-2.5 py-1 text-xs focus:border-cyan-500 focus:outline-none" value="${item.title || ''}" placeholder="Title...">
                    <label class="text-[10px] text-cyan-400 font-mono mt-1">EDIT CONTENT:</label>
                    <textarea class="edit-text-input w-full bg-slate-950 text-slate-200 border border-slate-800 rounded p-2 text-xs font-mono focus:border-cyan-500 focus:outline-none resize-none" rows="3">${item.text || ''}</textarea>
                `}
                <div class="flex justify-end gap-2 mt-1">
                    <button class="btn-cancel-edit px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition">Cancel</button>
                    <button class="btn-save-edit px-2.5 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition">Save</button>
                </div>
            </div>
        `;

        const btnCancel = bodyEl.querySelector('.btn-cancel-edit');
        const btnSave = bodyEl.querySelector('.btn-save-edit');
        const inputContent = bodyEl.querySelector('.edit-text-input');
        const inputTitle = bodyEl.querySelector('.edit-title-input');

        btnCancel.onclick = (e) => {
            if (e) e.stopPropagation();
            ShareUI.playSound('mouse-click');
            this.exitEditMode(shareManager);
        };
        btnSave.onclick = async (e) => {
            if (e) e.stopPropagation();
            ShareUI.playSound('mouse-click');
            const newContent = inputContent.value.trim();
            const newTitle = inputTitle ? inputTitle.value.trim() : '';
            if (!newContent) return;

            shareManager.editingState = null;
            if (item.type === 'text') await this.updateItem(shareManager, item, { text: newContent, title: newTitle });
            else await this.updateItem(shareManager, item, { filename: newContent, title: newTitle });
            shareManager.renderFeed();
        };
    }

    static async updateItem(shareManager, item, newData) {
        Object.assign(item, newData);
        if (shareManager.mode === 'online') {
            try {
                const payload = {};
                if (item.type === 'text') payload.text = item.text;
                if (item.type === 'file') payload.filename = item.filename;
                if (item.title !== undefined) payload.title = item.title;

                let { error } = await shareManager.supabase.from('shared_items').update(payload).eq('id', item.id);
                if (error && error.message && error.message.includes('title')) {
                    delete payload.title;
                    const res = await shareManager.supabase.from('shared_items').update(payload).eq('id', item.id);
                    error = res.error;
                }
                if (error) throw error;
            } catch (e) {
                await shareManager.dbStore.add(item);
            }
        } else {
            await shareManager.dbStore.add(item);
        }
    }
}
