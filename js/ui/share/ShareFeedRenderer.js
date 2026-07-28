import { ShareUI } from './ShareUI.js';

export class ShareFeedRenderer {
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
        if (shareManager.starredIds.has(itemId)) shareManager.starredIds.delete(itemId);
        else shareManager.starredIds.add(itemId);
        this.saveStarred(shareManager);
        this.renderFeed(shareManager);
    }

    static toggleSelectAll(shareManager, checked) {
        if (!shareManager.dom.feed) return;
        const visibleCards = Array.from(shareManager.dom.feed.querySelectorAll('[data-share-type]')).filter(el => el.style.display !== 'none');
        visibleCards.forEach(card => {
            const id = card.dataset.itemId;
            if (id) {
                if (checked) shareManager.selectedIds.add(id);
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
                const chk = card.querySelector('.share-item-checkbox');
                if (chk) chk.checked = isSelected;

                if (isSelected) {
                    card.classList.add('share-card-selected', 'border-cyan-500/50', 'bg-cyan-950/20');
                } else {
                    card.classList.remove('share-card-selected', 'border-cyan-500/50', 'bg-cyan-950/20');
                }
            });
        }
    }

    static enterEditMode(shareManager, item, card, bodyEl) {
        const originalHTML = bodyEl.innerHTML;
        bodyEl.innerHTML = `
            <div class="flex flex-col gap-2 p-2 bg-slate-900/90 rounded-lg border border-cyan-500/40">
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

        btnCancel.onclick = () => {
            ShareUI.playSound('mouse-click');
            bodyEl.innerHTML = originalHTML;
            if (window.lucide) window.lucide.createIcons();
        };
        btnSave.onclick = async () => {
            ShareUI.playSound('mouse-click');
            const newContent = inputContent.value.trim();
            const newTitle = inputTitle ? inputTitle.value.trim() : '';
            if (!newContent) return;

            if (item.type === 'text') await shareManager.updateItem(item, { text: newContent, title: newTitle });
            else await shareManager.updateItem(item, { filename: newContent, title: newTitle });
            this.renderFeed(shareManager);
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

    static renderFeed(shareManager) {
        if (!shareManager.dom.feed) return;
        shareManager.dom.feed.innerHTML = '';

        if (shareManager.items.length === 0) {
            shareManager.dom.feed.innerHTML = `
                <div class="flex flex-col items-center justify-center h-full text-slate-500 py-20">
                    <i data-lucide="inbox" class="w-12 h-12 mb-3 stroke-1 animate-bounce"></i>
                    <p class="text-sm font-bold">No items shared yet</p>
                    <p class="text-xs text-slate-600 mt-1">Send a message or drop a file to start sharing</p>
                </div>
            `;
            if (window.lucide) window.lucide.createIcons();
            const badge = document.getElementById('share-count-badge');
            if (badge) badge.textContent = '0';
            return;
        }

        shareManager.items.forEach(item => {
            const isStarred = shareManager.starredIds.has(item.id);
            const isSelected = shareManager.selectedIds.has(item.id);

            const card = document.createElement('div');
            card.dataset.itemId = item.id;
            if (isStarred) card.dataset.starred = 'true';

            card.className = `glass-panel p-4 rounded-xl border flex flex-col gap-3 relative group transition-all ${
                isSelected ? 'share-card-selected border-cyan-500/50 bg-cyan-950/20' : 'border-slate-800/80 bg-slate-950/20 hover:border-slate-800'
            }`;

            let shareType = item.type;
            if (item.type === 'text') {
                const isLink = /^(https?:\/\/[^\s]+)$/i.test(item.text.trim());
                if (isLink) shareType = 'link';
            } else if (item.type === 'file' && item.mimetype) {
                const mime = item.mimetype.toLowerCase();
                const name = (item.filename || '').toLowerCase();
                if (mime.startsWith('image/')) shareType = 'image';
                else if (mime.startsWith('video/')) shareType = 'video';
                else if (mime.startsWith('audio/')) shareType = 'audio';
                else if (mime === 'application/pdf' || name.endsWith('.pdf')) shareType = 'pdf';
                else if (mime.includes('word') || mime.includes('document') || name.endsWith('.docx') || name.endsWith('.doc')) shareType = 'docx';
                else shareType = 'file';
            } else if (item.type === 'file') {
                shareType = 'file';
            }
            card.dataset.shareType = shareType;
            
            const header = document.createElement('div');
            header.className = 'flex items-center justify-between border-b border-slate-900/60 pb-2';
            
            const infoDiv = document.createElement('div');
            infoDiv.className = 'flex items-center gap-2 text-[10px] font-mono text-slate-500';
            
            const chkSelect = document.createElement('input');
            chkSelect.type = 'checkbox';
            chkSelect.className = 'share-item-checkbox w-3.5 h-3.5 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0 focus:ring-offset-0 cursor-pointer accent-cyan-500 shrink-0 mr-0.5';
            chkSelect.checked = isSelected;
            chkSelect.onclick = (e) => {
                e.stopPropagation();
                if (chkSelect.checked) shareManager.selectedIds.add(item.id);
                else shareManager.selectedIds.delete(item.id);
                this.updateSelectedUI(shareManager);
            };
            infoDiv.appendChild(chkSelect);
            
            const typeIcon = document.createElement('i');
            typeIcon.className = 'w-3.5 h-3.5';
            
            if (item.type === 'text') {
                typeIcon.setAttribute('data-lucide', 'message-square');
                infoDiv.appendChild(typeIcon);
                
                const isLink = /^(https?:\/\/[^\s]+)$/i.test(item.text.trim());
                const typeText = isLink ? 'LINK SHARE' : 'TEXT NOTE';

                if (item.title) {
                    const labelSpan = document.createElement('span');
                    labelSpan.innerText = typeText;
                    infoDiv.appendChild(labelSpan);

                    const titleBadge = document.createElement('span');
                    titleBadge.className = 'font-bold text-cyan-300 truncate max-w-[140px] sm:max-w-[220px] bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20';
                    titleBadge.title = item.title;
                    titleBadge.innerText = item.title;
                    infoDiv.appendChild(titleBadge);
                } else {
                    infoDiv.appendChild(document.createTextNode(typeText));
                }
            } else {
                typeIcon.setAttribute('data-lucide', 'file');
                infoDiv.appendChild(typeIcon);
                
                const ext = item.filename.split('.').pop().toUpperCase();
                const typeText = `FILE SHARE (${ext})`;

                if (item.title) {
                    const labelSpan = document.createElement('span');
                    labelSpan.innerText = typeText;
                    infoDiv.appendChild(labelSpan);

                    const titleBadge = document.createElement('span');
                    titleBadge.className = 'font-bold text-cyan-300 truncate max-w-[140px] sm:max-w-[220px] bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20';
                    titleBadge.title = item.title;
                    titleBadge.innerText = item.title;
                    infoDiv.appendChild(titleBadge);
                } else {
                    infoDiv.appendChild(document.createTextNode(typeText));
                }
            }

            const timeSpan = document.createElement('span');
            timeSpan.innerText = ShareUI.formatTime(item.timestamp);
            infoDiv.appendChild(timeSpan);
            
            header.appendChild(infoDiv);

            const actionDiv = document.createElement('div');
            actionDiv.className = 'flex items-center gap-1.5';

            if (item.type === 'text') {
                const btnCopy = document.createElement('button');
                btnCopy.className = 'p-1 hover:bg-slate-800/50 hover:text-cyan-400 rounded transition text-slate-500';
                btnCopy.title = 'Copy text';
                btnCopy.innerHTML = '<i data-lucide="copy" class="w-3.5 h-3.5"></i>';
                btnCopy.onclick = () => {
                    navigator.clipboard.writeText(item.text);
                    btnCopy.innerHTML = '<i data-lucide="check" class="w-3.5 h-3.5 text-green-400"></i>';
                    setTimeout(() => {
                        btnCopy.innerHTML = '<i data-lucide="copy" class="w-3.5 h-3.5"></i>';
                        if (window.lucide) window.lucide.createIcons();
                    }, 2000);
                    if (window.lucide) window.lucide.createIcons();
                };
                actionDiv.appendChild(btnCopy);
            } else {
                const btnDownload = document.createElement('a');
                btnDownload.className = 'p-1 hover:bg-slate-800/50 hover:text-cyan-400 rounded transition text-slate-500';
                btnDownload.title = 'Download file';
                btnDownload.innerHTML = '<i data-lucide="download" class="w-3.5 h-3.5"></i>';
                
                if (shareManager.mode === 'online' && item.url) {
                    btnDownload.href = item.url;
                    btnDownload.download = item.filename;
                } else if (item.blob) {
                    btnDownload.href = URL.createObjectURL(item.blob);
                    btnDownload.download = item.filename;
                }
                
                actionDiv.appendChild(btnDownload);
            }

            const btnEdit = document.createElement('button');
            btnEdit.className = 'p-1 hover:bg-slate-800/50 hover:text-emerald-400 rounded transition text-slate-500';
            btnEdit.title = 'Edit item';
            btnEdit.innerHTML = '<i data-lucide="pencil" class="w-3.5 h-3.5"></i>';
            btnEdit.onclick = () => {
                ShareUI.playSound('mouse-click');
                this.enterEditMode(shareManager, item, card, body);
            };
            actionDiv.appendChild(btnEdit);

            const btnStar = document.createElement('button');
            btnStar.className = `p-1 rounded transition ${isStarred ? 'text-amber-400 hover:text-amber-300 hover:bg-amber-500/10' : 'text-slate-500 hover:text-amber-400 hover:bg-slate-800/50'}`;
            btnStar.title = isStarred ? 'Unstar item' : 'Star item';
            if (isStarred) {
                btnStar.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
            } else {
                btnStar.innerHTML = `<i data-lucide="star" class="w-3.5 h-3.5"></i>`;
            }
            btnStar.onclick = () => this.toggleStar(shareManager, item.id);
            actionDiv.appendChild(btnStar);

            const btnDelete = document.createElement('button');
            btnDelete.className = 'p-1 hover:bg-slate-800/50 hover:text-red-400 rounded transition text-slate-500';
            btnDelete.title = 'Delete item';
            btnDelete.innerHTML = '<i data-lucide="trash-2" class="w-3.5 h-3.5"></i>';
            btnDelete.onclick = () => shareManager.deleteItem(item);
            actionDiv.appendChild(btnDelete);

            header.appendChild(actionDiv);
            card.appendChild(header);

            const body = document.createElement('div');
            body.className = 'text-sm text-slate-200';

            if (item.type === 'text') {
                const isLink = /^(https?:\/\/[^\s]+)$/i.test(item.text.trim());
                if (isLink) {
                    const a = document.createElement('a');
                    a.href = item.text.trim();
                    a.target = '_blank';
                    a.className = 'text-cyan-400 hover:underline flex items-center gap-1.5 break-all font-mono text-xs';
                    a.innerHTML = `
                        <span>${item.text.trim()}</span>
                        <i data-lucide="external-link" class="w-3.5 h-3.5 shrink-0"></i>
                    `;
                    body.appendChild(a);
                } else {
                    const p = document.createElement('p');
                    p.className = 'whitespace-pre-wrap select-text selection:bg-cyan-500/20';
                    p.innerText = item.text;
                    body.appendChild(p);
                }
            } else {
                const fileContainer = document.createElement('div');
                fileContainer.className = 'flex flex-col gap-3';
                
                const fileMeta = document.createElement('div');
                fileMeta.className = 'flex items-center gap-3 bg-slate-950/40 p-3 rounded-lg border border-slate-900/60';
                
                const fileIcon = document.createElement('div');
                fileIcon.className = 'w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center text-cyan-400 border border-slate-800';
                
                let lucideIcon = 'file';
                const mime = (item.mimetype || '').toLowerCase();
                const name = (item.filename || '').toLowerCase();
                if (mime.startsWith('image/')) lucideIcon = 'image';
                else if (mime.startsWith('video/')) lucideIcon = 'video';
                else if (mime.startsWith('audio/')) lucideIcon = 'music';
                else if (mime === 'application/pdf' || name.endsWith('.pdf')) lucideIcon = 'file-text';
                else if (mime.includes('zip') || mime.includes('tar') || mime.includes('rar') || name.endsWith('.zip') || name.endsWith('.rar')) lucideIcon = 'folder-archive';
                
                fileIcon.innerHTML = `<i data-lucide="${lucideIcon}" class="w-5 h-5"></i>`;
                fileMeta.appendChild(fileIcon);

                const fileDetails = document.createElement('div');
                fileDetails.className = 'flex-1 overflow-hidden';
                
                const fileNameP = document.createElement('p');
                fileNameP.className = 'text-xs font-bold text-slate-350 truncate';
                fileNameP.innerText = item.filename;
                fileDetails.appendChild(fileNameP);

                const fileSizeP = document.createElement('p');
                fileSizeP.className = 'text-[10px] text-slate-500 font-mono mt-0.5';
                fileSizeP.innerText = ShareUI.formatSize(item.size);
                fileDetails.appendChild(fileSizeP);

                fileMeta.appendChild(fileDetails);
                fileContainer.appendChild(fileMeta);

                const fileUrl = (shareManager.mode === 'online' && item.url) ? item.url : (item.blob ? URL.createObjectURL(item.blob) : '');
                
                if (fileUrl && item.mimetype) {
                    const mimeLower = item.mimetype.toLowerCase();
                    if (mimeLower.startsWith('image/')) {
                        const img = document.createElement('img');
                        img.src = fileUrl;
                        img.alt = item.filename;
                        img.className = 'max-h-[250px] max-w-full rounded-lg bg-slate-950/40 border border-slate-900 object-contain hover:scale-[1.01] transition-transform cursor-zoom-in';
                        img.onclick = () => window.open(fileUrl, '_blank');
                        fileContainer.appendChild(img);
                    } else if (mimeLower.startsWith('video/')) {
                        const video = document.createElement('video');
                        video.src = fileUrl;
                        video.controls = true;
                        video.preload = 'metadata';
                        video.className = 'max-h-[300px] w-full rounded-lg bg-black/60 border border-slate-900';
                        fileContainer.appendChild(video);
                    } else if (mimeLower.startsWith('audio/')) {
                        const audio = document.createElement('audio');
                        audio.src = fileUrl;
                        audio.controls = true;
                        audio.className = 'w-full h-9 rounded-lg bg-slate-950/40 border border-slate-900 mt-1';
                        fileContainer.appendChild(audio);
                    }
                }

                body.appendChild(fileContainer);
            }

            card.appendChild(body);
            shareManager.dom.feed.appendChild(card);
        });

        if (window.lucide) window.lucide.createIcons();

        const badge = document.getElementById('share-count-badge');
        if (badge) badge.textContent = shareManager.items.length;
    }
}
