import { ShareUI } from './ShareUI.js';
import { ShareFeedState } from './ShareFeedState.js';
import { ShareMediaResolver } from './ShareMediaResolver.js';

/**
 * ShareFeedRenderer.js - Feed DOM Card Rendering Coordinator
 * Solid OOP: Delegates starred/edit/selection state to ShareFeedState, media resolution to ShareMediaResolver.
 */
export class ShareFeedRenderer {
    static loadStarred(shareManager) {
        return ShareFeedState.loadStarred(shareManager);
    }

    static saveStarred(shareManager) {
        return ShareFeedState.saveStarred(shareManager);
    }

    static toggleStar(shareManager, itemId) {
        return ShareFeedState.toggleStar(shareManager, itemId);
    }

    static toggleSelectAll(shareManager, forceChecked) {
        return ShareFeedState.toggleSelectAll(shareManager, forceChecked);
    }

    static updateSelectedUI(shareManager) {
        return ShareFeedState.updateSelectedUI(shareManager);
    }

    static exitEditMode(shareManager) {
        return ShareFeedState.exitEditMode(shareManager);
    }

    static enterEditMode(shareManager, item, card, bodyEl) {
        return ShareFeedState.enterEditMode(shareManager, item, card, bodyEl);
    }

    static updateItem(shareManager, item, newData) {
        return ShareFeedState.updateItem(shareManager, item, newData);
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

            card.className = `glass-panel p-4 rounded-xl flex flex-col gap-3 relative group transition-all cursor-pointer select-none ${
                isSelected ? 'share-card-selected ring-1 ring-cyan-500/50 bg-cyan-950/25 shadow-lg shadow-cyan-950/30' : 'bg-slate-950/30 hover:bg-slate-900/50'
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
                ShareFeedState.updateSelectedUI(shareManager);
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
            timeSpan.className = 'text-slate-500/80 shrink-0 tabular-nums';
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
                btnDownload.className = 'p-1 hover:bg-slate-800/50 hover:text-cyan-400 rounded transition text-slate-500 cursor-pointer';
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
                btnDownload.onclick = (e) => {
                    e.preventDefault();
                    ShareUI.downloadFileToDevice(downloadUrl, item.filename || 'download', item.blob);
                };
                
                actionDiv.appendChild(btnDownload);
            }

            const btnEdit = document.createElement('button');
            btnEdit.className = 'btn-edit-item-trigger p-1 hover:bg-slate-800/50 hover:text-emerald-400 rounded transition text-slate-500';
            btnEdit.title = 'Edit item';
            btnEdit.innerHTML = '<i data-lucide="pencil" class="w-3.5 h-3.5"></i>';
            btnEdit.onclick = () => {
                ShareUI.playSound('mouse-click');
                ShareFeedState.enterEditMode(shareManager, item, card, body);
            };
            actionDiv.appendChild(btnEdit);

            const btnStar = document.createElement('button');
            btnStar.dataset.starBtn = 'true';
            btnStar.className = `p-1 rounded transition ${isStarred ? 'text-amber-400 hover:text-amber-300 hover:bg-amber-500/10' : 'text-slate-500 hover:text-amber-400 hover:bg-slate-800/50'}`;
            btnStar.title = isStarred ? 'Unstar item' : 'Star item';
            if (isStarred) {
                btnStar.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
            } else {
                btnStar.innerHTML = '<i data-lucide="star" class="w-3.5 h-3.5"></i>';
            }
            btnStar.onclick = () => ShareFeedState.toggleStar(shareManager, item.id);
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
                fileSizeP.className = 'text-[10px] text-slate-500 font-mono mt-0.5 tabular-nums';
                fileSizeP.innerText = ShareUI.formatSize(item.size);
                fileDetails.appendChild(fileSizeP);

                fileMeta.appendChild(fileDetails);
                fileContainer.appendChild(fileMeta);

                const fileUrl = ShareMediaResolver.resolveFileUrl(item, shareManager);

                if (isImg) {
                    ShareMediaResolver.initSignedUrl(item, shareManager);
                }
                
                if (fileUrl) {
                    if (isImg) {
                        const imgWrapper = document.createElement('div');
                        imgWrapper.className = 'relative group/img overflow-hidden rounded-xl bg-slate-950/60 border border-slate-800/80 inline-block max-w-full cursor-pointer transition-all hover:border-cyan-500/50 shadow-md';
                        
                        const img = document.createElement('img');
                        img.src = fileUrl;
                        img.alt = item.filename || 'Shared image';
                        img.className = 'max-h-[280px] max-w-full rounded-xl object-contain transition-transform duration-300 group-hover/img:scale-[1.02]';
                        
                        img.onerror = () => ShareMediaResolver.handleImageFallback(img, imgWrapper, item, shareManager);

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
