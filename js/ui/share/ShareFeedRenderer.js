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
        this.exitEditMode(shareManager);
        if (shareManager.starredIds.has(itemId)) shareManager.starredIds.delete(itemId);
        else shareManager.starredIds.add(itemId);
        this.saveStarred(shareManager);
        this.renderFeed(shareManager);
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
        // Exit any active edit mode first
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

            card.className = `glass-panel p-4 rounded-xl border flex flex-col gap-3 relative group transition-all cursor-pointer select-none ${
                isSelected ? 'share-card-selected border-cyan-500/50 bg-cyan-950/20' : 'border-slate-800/80 bg-slate-950/20 hover:border-slate-700/80 hover:bg-slate-900/30'
            }`;

            card.onclick = (e) => {
                if (e.target.closest('button, a, input, textarea, video, audio, .cursor-zoom-in, .edit-title-input, .edit-text-input')) {
                    return;
                }
                ShareUI.playSound('mouse-click');
                if (shareManager.selectedIds.has(item.id)) {
                    shareManager.selectedIds.delete(item.id);
                } else {
                    shareManager.selectedIds.add(item.id);
                }
                this.updateSelectedUI(shareManager);
            };

            let shareType = item.type;
            if (item.type === 'text') {
                const isLink = /^(https?:\/\/[^\s]+)$/i.test(item.text.trim());
                if (isLink) shareType = 'link';
            } else if (item.type === 'file') {
                const mime = (item.mimetype || '').toLowerCase();
                const name = (item.filename || '').toLowerCase();
                const ext = name.split('.').pop();
                const isImg = mime.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'jfif', 'ico', 'tiff', 'heic', 'avif'].includes(ext);

                if (isImg) shareType = 'image';
                else if (mime.startsWith('video/') || ['mp4', 'webm', 'mov', 'mkv', 'avi'].includes(ext)) shareType = 'video';
                else if (mime.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'm4a', 'flac'].includes(ext)) shareType = 'audio';
                else if (mime === 'application/pdf' || name.endsWith('.pdf')) shareType = 'pdf';
                else if (mime.includes('word') || mime.includes('document') || name.endsWith('.docx') || name.endsWith('.doc')) shareType = 'docx';
                else shareType = 'file';
            }
            card.dataset.shareType = shareType;
            
            const header = document.createElement('div');
            header.className = 'flex items-start sm:items-center justify-between gap-2 border-b border-slate-900/60 pb-2';
            
            const infoDiv = document.createElement('div');
            infoDiv.className = 'flex items-center gap-2 text-[10px] font-mono text-slate-500 flex-wrap flex-1 min-w-0';

            const typeGroup = document.createElement('div');
            typeGroup.className = 'flex items-center gap-1.5 shrink-0';

            const titleTimeGroup = document.createElement('div');
            titleTimeGroup.className = 'flex items-center gap-2 min-w-0 max-w-full';

            const typeIcon = document.createElement('i');
            typeIcon.className = 'w-3.5 h-3.5 shrink-0';

            let typeText = '';
            if (item.type === 'text') {
                typeIcon.setAttribute('data-lucide', 'message-square');
                const isLink = /^(https?:\/\/[^\s]+)$/i.test(item.text.trim());
                typeText = isLink ? 'LINK SHARE' : 'TEXT NOTE';
            } else {
                typeIcon.setAttribute('data-lucide', 'file');
                const ext = item.filename.split('.').pop().toUpperCase();
                typeText = `FILE SHARE (${ext})`;
            }

            const labelSpan = document.createElement('span');
            labelSpan.className = 'shrink-0 font-bold text-slate-400';
            labelSpan.innerText = typeText;

            typeGroup.appendChild(typeIcon);
            typeGroup.appendChild(labelSpan);

            if (item.title) {
                const titleBadge = document.createElement('span');
                titleBadge.className = 'font-bold text-cyan-300 truncate max-w-[120px] sm:max-w-[220px] bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20 shrink';
                titleBadge.title = item.title;
                titleBadge.innerText = item.title;
                titleTimeGroup.appendChild(titleBadge);
            }

            const timeSpan = document.createElement('span');
            timeSpan.className = 'text-slate-500/80 shrink-0';
            timeSpan.innerText = ShareUI.formatTime(item.timestamp);
            titleTimeGroup.appendChild(timeSpan);

            infoDiv.appendChild(typeGroup);
            infoDiv.appendChild(titleTimeGroup);
            
            header.appendChild(infoDiv);

            const actionDiv = document.createElement('div');
            actionDiv.className = 'flex items-center gap-1.5 shrink-0';

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
                
                let downloadUrl = '';
                if (item.blob) {
                    try { downloadUrl = URL.createObjectURL(item.blob); } catch(e) {}
                }
                if (!downloadUrl && item.url) {
                    downloadUrl = item.url;
                }
                if (downloadUrl) {
                    btnDownload.href = downloadUrl;
                    btnDownload.download = item.filename || 'download';
                }
                
                actionDiv.appendChild(btnDownload);
            }

            const btnEdit = document.createElement('button');
            btnEdit.className = 'btn-edit-item-trigger p-1 hover:bg-slate-800/50 hover:text-emerald-400 rounded transition text-slate-500';
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
                const ext = name.split('.').pop() || '';
                const isImg = mime.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'jfif', 'ico', 'tiff', 'heic', 'avif'].includes(ext);

                if (isImg) lucideIcon = 'image';
                else if (mime.startsWith('video/') || ['mp4', 'webm', 'mov', 'mkv', 'avi'].includes(ext)) lucideIcon = 'video';
                else if (mime.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'm4a', 'flac'].includes(ext)) lucideIcon = 'music';
                else if (mime === 'application/pdf' || name.endsWith('.pdf')) lucideIcon = 'file-text';
                else if (mime.includes('zip') || mime.includes('tar') || mime.includes('rar') || ['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) lucideIcon = 'folder-archive';
                
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

                let fileUrl = '';
                if (item.blob) {
                    try { fileUrl = URL.createObjectURL(item.blob); } catch (e) {}
                }
                if (!fileUrl && item.base64Data) {
                    fileUrl = item.base64Data;
                }
                if (!fileUrl && item.url) {
                    const hostUrl = shareManager.hostUrl || '';
                    if (shareManager.mode === 'online' && hostUrl && item.url.startsWith('/')) {
                        fileUrl = hostUrl.replace(/\/+$/, '') + item.url;
                    } else {
                        fileUrl = item.url;
                    }
                }

                // If online mode with Supabase and we have a path/filename, automatically resolve signedUrl or blob
                if (isImg && shareManager.mode === 'online' && shareManager.supabase && (!item.blob && !item.base64Data)) {
                    let path = item.uniqueFilename;
                    if (!path && item.url) {
                        try {
                            const urlObj = new URL(item.url);
                            const parts = urlObj.pathname.split('/shared-files/');
                            if (parts.length > 1) path = decodeURIComponent(parts[1]);
                            else path = urlObj.pathname.split('/').pop();
                        } catch (e) { path = item.url.split('/').pop(); }
                    }
                    if (!path) path = item.filename;

                    if (path) {
                        // Request Signed URL valid for 10 years (315,360,000 seconds)
                        shareManager.supabase.storage.from('shared-files').createSignedUrl(path, 315360000).then(res => {
                            if (res.data?.signedUrl) {
                                const cardEl = document.querySelector(`[data-item-id="${item.id}"]`);
                                if (cardEl) {
                                    const imgEl = cardEl.querySelector('img');
                                    const imgWrapperEl = cardEl.querySelector('.group\\/img');
                                    if (imgEl) imgEl.src = res.data.signedUrl;
                                    if (imgWrapperEl) {
                                        imgWrapperEl.onclick = (e) => {
                                            e.stopPropagation();
                                            ShareUI.playSound('mouse-click');
                                            ShareUI.showImageModal(res.data.signedUrl, item.filename || 'Shared Image');
                                        };
                                    }
                                }
                            }
                        }).catch(() => {});
                    }
                }
                
                if (fileUrl) {
                    if (isImg) {
                        const imgWrapper = document.createElement('div');
                        imgWrapper.className = 'relative group/img overflow-hidden rounded-xl bg-slate-950/60 border border-slate-800/80 inline-block max-w-full cursor-pointer transition-all hover:border-cyan-500/50 shadow-md';
                        
                        const img = document.createElement('img');
                        img.src = fileUrl;
                        img.alt = item.filename || 'Shared image';
                        img.className = 'max-h-[280px] max-w-full rounded-xl object-contain transition-transform duration-300 group-hover/img:scale-[1.02]';
                        
                        img.onerror = async () => {
                            if (item.blob && (item.blob instanceof Blob || item.blob instanceof File)) {
                                try {
                                    const fallbackBlobUrl = URL.createObjectURL(item.blob);
                                    if (img.src !== fallbackBlobUrl) {
                                        img.src = fallbackBlobUrl;
                                        imgWrapper.onclick = (e) => {
                                            e.stopPropagation();
                                            ShareUI.playSound('mouse-click');
                                            ShareUI.showImageModal(fallbackBlobUrl, item.filename || 'Shared Image');
                                        };
                                        return;
                                    }
                                } catch (e) {}
                            }
                            if (item.base64Data && img.src !== item.base64Data) {
                                img.src = item.base64Data;
                                imgWrapper.onclick = (e) => {
                                    e.stopPropagation();
                                    ShareUI.playSound('mouse-click');
                                    ShareUI.showImageModal(item.base64Data, item.filename || 'Shared Image');
                                };
                                return;
                            }

                            // If Online mode with Supabase, attempt downloading file blob directly
                            if (shareManager.mode === 'online' && shareManager.supabase) {
                                try {
                                    let path = item.uniqueFilename;
                                    if (!path && item.url) {
                                        try {
                                            const urlObj = new URL(item.url);
                                            const parts = urlObj.pathname.split('/shared-files/');
                                            if (parts.length > 1) {
                                                path = decodeURIComponent(parts[1]);
                                            } else {
                                                path = urlObj.pathname.split('/').pop();
                                            }
                                        } catch (e) {
                                            path = item.url.split('/').pop();
                                        }
                                    }
                                    if (!path) path = item.filename;

                                    if (path) {
                                        let blobData = null;
                                        let dlErr = null;
                                        
                                        // Try direct download first
                                        const res = await shareManager.supabase
                                            .storage
                                            .from('shared-files')
                                            .download(path);
                                        blobData = res.data;
                                        dlErr = res.error;

                                        // Fallback: try createSignedUrl if download failed
                                        if (dlErr || !blobData) {
                                            const { data: signedData } = await shareManager.supabase
                                                .storage
                                                .from('shared-files')
                                                .createSignedUrl(path, 3600);
                                            
                                            if (signedData?.signedUrl && img.src !== signedData.signedUrl) {
                                                img.src = signedData.signedUrl;
                                                imgWrapper.onclick = (e) => {
                                                    e.stopPropagation();
                                                    ShareUI.playSound('mouse-click');
                                                    ShareUI.showImageModal(signedData.signedUrl, item.filename || 'Shared Image');
                                                };
                                                return;
                                            }
                                        }
                                        
                                         if (!dlErr && blobData) {
                                            item.blob = blobData;
                                            const downloadedBlobUrl = URL.createObjectURL(blobData);
                                            img.src = downloadedBlobUrl;
                                            imgWrapper.onclick = (e) => {
                                                e.stopPropagation();
                                                ShareUI.playSound('mouse-click');
                                                ShareUI.showImageModal(downloadedBlobUrl, item.filename || 'Shared Image');
                                            };
                                            return;
                                        }
                                    }
                                } catch (storageErr) {
                                    console.warn('Supabase blob download fallback failed:', storageErr);
                                }
                            }

                            // Check local IndexedDB storage for offline/cached blob as final fallback
                            try {
                                if (shareManager.dbStore && item.id) {
                                    const localRecord = await shareManager.dbStore.get(item.id);
                                    if (localRecord && localRecord.blob) {
                                        const localBlobUrl = URL.createObjectURL(localRecord.blob);
                                        img.src = localBlobUrl;
                                        imgWrapper.onclick = (e) => {
                                            e.stopPropagation();
                                            ShareUI.playSound('mouse-click');
                                            ShareUI.showImageModal(localBlobUrl, item.filename || 'Shared Image');
                                        };
                                        return;
                                    }
                                }
                            } catch (localErr) {}

                            imgWrapper.className = 'p-3.5 bg-slate-950/80 border border-amber-500/30 rounded-xl flex items-center gap-3 text-amber-300 text-xs font-mono max-w-full';
                            imgWrapper.onclick = null;
                            imgWrapper.innerHTML = `
                                <i data-lucide="shield-alert" class="w-5 h-5 text-amber-400 shrink-0"></i>
                                <div class="min-w-0">
                                    <p class="font-bold text-slate-200 truncate">${item.filename || 'Image'}</p>
                                    <p class="text-[10px] text-amber-400/90 mt-0.5 leading-tight">Blocked by AdBlocker / Network (net::ERR_BLOCKED_BY_CLIENT). Disable extension or use Local Storage.</p>
                                </div>
                            `;
                            if (window.lucide) window.lucide.createIcons();
                        };

                        const zoomOverlay = document.createElement('div');
                        zoomOverlay.className = 'absolute inset-0 bg-slate-950/50 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center pointer-events-none rounded-xl';
                        zoomOverlay.innerHTML = `
                            <div class="px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-cyan-400/40 text-cyan-300 text-xs font-mono font-bold flex items-center gap-2 shadow-xl">
                                <i data-lucide="zoom-in" class="w-4 h-4 text-cyan-400"></i>
                                <span>Click to View Image</span>
                            </div>
                        `;

                        imgWrapper.onclick = (e) => {
                            e.stopPropagation();
                            ShareUI.playSound('mouse-click');
                            ShareUI.showImageModal(img.src || fileUrl, item.filename || 'Shared Image');
                        };

                        imgWrapper.appendChild(img);
                        imgWrapper.appendChild(zoomOverlay);
                        fileContainer.appendChild(imgWrapper);
                    } else if (mime.startsWith('video/') || ['mp4', 'webm', 'mov', 'mkv', 'avi'].includes(ext)) {
                        const video = document.createElement('video');
                        video.src = fileUrl;
                        video.controls = true;
                        video.preload = 'metadata';
                        video.className = 'max-h-[300px] w-full rounded-lg bg-black/60 border border-slate-900';
                        fileContainer.appendChild(video);
                    } else if (mime.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'm4a', 'flac'].includes(ext)) {
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
