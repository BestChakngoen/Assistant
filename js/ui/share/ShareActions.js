import { ShareUI } from './ShareUI.js';
import { ShareDatabase } from './ShareDatabase.js';
import { ShareFeedRenderer } from './ShareFeedRenderer.js';

function detectMimeType(filename, mimeType) {
    if (mimeType && mimeType !== 'application/octet-stream') return mimeType;
    const ext = (filename || '').split('.').pop().toLowerCase();
    const map = {
        jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif',
        webp: 'image/webp', svg: 'image/svg+xml', bmp: 'image/bmp', ico: 'image/x-icon',
        jfif: 'image/jpeg', avif: 'image/avif', tiff: 'image/tiff', tif: 'image/tiff',
        pdf: 'application/pdf', mp4: 'video/mp4', webm: 'video/webm',
        mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg',
        doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    };
    return map[ext] || mimeType || 'application/octet-stream';
}

export class ShareActions {
    static bindEvents(shareManager) {
        if (shareManager.dom.btnShareText) {
            shareManager.dom.btnShareText.onclick = () => this.shareText(shareManager);
        }

        if (shareManager.dom.btnClearShare) {
            shareManager.dom.btnClearShare.onclick = () => this.clearHistory(shareManager);
        }

        if (shareManager.dom.fileDropzone) {
            shareManager.dom.fileDropzone.onclick = () => {
                if (shareManager.dom.fileInput) shareManager.dom.fileInput.click();
            };

            shareManager.dom.fileDropzone.ondragover = (e) => {
                e.preventDefault();
                shareManager.dom.fileDropzone.classList.add('border-cyan-500', 'bg-cyan-500/5');
            };

            shareManager.dom.fileDropzone.ondragleave = (e) => {
                e.preventDefault();
                shareManager.dom.fileDropzone.classList.remove('border-cyan-500', 'bg-cyan-500/5');
            };

            shareManager.dom.fileDropzone.ondrop = (e) => {
                e.preventDefault();
                shareManager.dom.fileDropzone.classList.remove('border-cyan-500', 'bg-cyan-500/5');
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    this.uploadFiles(shareManager, files);
                }
            };
        }

        if (shareManager.dom.fileInput) {
            shareManager.dom.fileInput.onchange = () => {
                const files = shareManager.dom.fileInput.files;
                if (files.length > 0) {
                    this.uploadFiles(shareManager, files);
                }
            };
        }

        if (shareManager.dom.textInput) {
            shareManager.dom.textInput.onkeydown = (e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                    e.preventDefault();
                    this.shareText(shareManager);
                }
            };
        }

        if (shareManager.dom.btnExportBackup) {
            shareManager.dom.btnExportBackup.onclick = () => ShareDatabase.exportBackup(shareManager);
        }
        if (shareManager.dom.btnImportBackupTrigger && shareManager.dom.importBackupFile) {
            shareManager.dom.btnImportBackupTrigger.onclick = () => shareManager.dom.importBackupFile.click();
            shareManager.dom.importBackupFile.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    ShareDatabase.importBackup(shareManager, file);
                    shareManager.dom.importBackupFile.value = '';
                }
            };
        }

        if (shareManager.dom.btnToggleSelectAll) {
            shareManager.dom.btnToggleSelectAll.onclick = () => shareManager.toggleSelectAll();
        }
        if (shareManager.dom.btnDeleteSelected) {
            shareManager.dom.btnDeleteSelected.onclick = () => this.deleteSelectedItems(shareManager);
        }

        if (shareManager.dom.panel) {
            shareManager.dom.panel.addEventListener('click', (e) => {
                const clickable = e.target.closest('#btn-share-text, #btn-export-backup, #btn-import-backup-trigger, #btn-clear-share, #btn-delete-selected, #file-dropzone');
                if (clickable) ShareUI.playSound('mouse-click');
            });
        }

        // Global click listener to auto-exit edit mode when clicking outside active edit box or on filter buttons
        document.addEventListener('click', (e) => {
            if (shareManager.editingState) {
                const isInsideEditBox = e.target.closest('.edit-container-box') || e.target.closest('.btn-edit-item-trigger');
                if (!isInsideEditBox) {
                    ShareFeedRenderer.exitEditMode(shareManager);
                }
            }
        }, true);
    }

    static async loadItems(shareManager) {
        const uid = shareManager.currentUserId;
        if (shareManager.mode === 'online') {
            try {
                // 1. Try to query with user_id filtering
                let { data, error } = await shareManager.supabase
                    .from('shared_items')
                    .select('*')
                    .order('timestamp', { ascending: false });
                
                if (error) throw error;
                let items = data || [];

                // Filter by user_id if present in DB schema, otherwise show items gracefully
                if (uid && uid !== 'guest') {
                    const hasUserIdCol = items.length > 0 && ('user_id' in items[0]);
                    if (hasUserIdCol) {
                        items = items.filter(item => !item.user_id || item.user_id === uid);
                    }
                }

                try {
                    const localItems = await shareManager.dbStore.getAll();
                    const localBlobMap = new Map();
                    localItems.forEach(l => {
                        if (l.blob && (l.blob instanceof Blob || l.blob instanceof File)) {
                            if (l.id) localBlobMap.set(l.id, l.blob);
                            if (l.filename) localBlobMap.set(l.filename, l.blob);
                        }
                    });

                    items.forEach(item => {
                        if (item.type === 'file' && (!item.blob || !(item.blob instanceof Blob))) {
                            const cachedBlob = localBlobMap.get(item.id) || localBlobMap.get(item.filename);
                            if (cachedBlob) {
                                item.blob = cachedBlob;
                            }
                        }
                    });
                } catch (localErr) {
                    console.warn('Could not merge local IndexedDB blobs:', localErr);
                }

                shareManager.items = items;
            } catch (e) {
                console.error('Failed to load Supabase items, using IndexedDB:', e);
                await this.loadItemsFromIndexedDB(shareManager);
            }
        } else {
            await this.loadItemsFromIndexedDB(shareManager);
        }
        shareManager.renderFeed();
        await shareManager.updateStorageEstimate();
    }

    static async loadItemsFromIndexedDB(shareManager) {
        const uid = shareManager.currentUserId;
        try {
            const localItems = await shareManager.dbStore.getAll();
            // Migrate local items without user_id
            if (uid && uid !== 'guest') {
                localItems.forEach(item => {
                    if (!item.user_id) {
                        item.user_id = uid;
                        shareManager.dbStore.add(item);
                    }
                });
            }
            const userItems = localItems.filter(item => !item.user_id || item.user_id === uid);
            shareManager.items = userItems.reverse();
        } catch (e) {
            console.error('Failed to load items from IndexedDB:', e);
            shareManager.items = [];
        }
    }

    static async shareText(shareManager) {
        if (!shareManager.dom.textInput) return;
        const text = shareManager.dom.textInput.value.trim();
        if (!text) return;
        const title = shareManager.dom.textTitleInput ? shareManager.dom.textTitleInput.value.trim() : '';

        const newItem = {
            id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            type: 'text',
            text: text,
            title: title,
            user_id: shareManager.currentUserId,
            timestamp: Date.now()
        };

        if (shareManager.mode === 'online') {
            try {
                let payload = { ...newItem };
                let { error } = await shareManager.supabase
                    .from('shared_items')
                    .insert([payload]);
                
                if (error && error.message && (error.message.includes('user_id') || error.message.includes('title'))) {
                    if (error.message.includes('user_id')) delete payload.user_id;
                    if (error.message.includes('title')) delete payload.title;
                    const res = await shareManager.supabase.from('shared_items').insert([payload]);
                    error = res.error;
                }

                if (error) throw error;
                shareManager.dom.textInput.value = '';
                if (shareManager.dom.textTitleInput) shareManager.dom.textTitleInput.value = '';
                ShareUI.playSound('success');
                await this.loadItems(shareManager);
            } catch (e) {
                console.error('Failed Supabase send, saving to local database:', e);
                await this.saveLocalItem(shareManager, newItem);
            }
        } else {
            await this.saveLocalItem(shareManager, newItem);
        }
    }

    static async saveLocalItem(shareManager, item) {
        try {
            await shareManager.dbStore.add(item);
            shareManager.items.unshift(item);
            if (shareManager.dom.textInput) shareManager.dom.textInput.value = '';
            if (shareManager.dom.textTitleInput) shareManager.dom.textTitleInput.value = '';
            shareManager.renderFeed();
            await shareManager.updateStorageEstimate();
            ShareUI.playSound('success');
        } catch (e) {
            console.error('Failed to write to local database:', e);
        }
    }

    static async uploadFiles(shareManager, files) {
        if (!files || files.length === 0) return;
        const customTitle = shareManager.dom.fileTitleInput ? shareManager.dom.fileTitleInput.value.trim() : '';
        let uploadedCount = 0;
        let failedCount = 0;

        let isCancelled = false;
        shareManager.activeUploadController = new AbortController();

        const loadingTitle = files.length > 1 ? `Uploading ${files.length} Files` : 'Uploading File';
        ShareUI.showLoadingModal(shareManager, loadingTitle, 'Please wait while your files are being uploaded...', () => {
            isCancelled = true;
            if (shareManager.activeUploadController) {
                try { shareManager.activeUploadController.abort(); } catch (err) {}
            }
            ShareUI.showToast('Upload Cancelled', 'File upload was cancelled by user.', 'error');
        });

        try {
            for (const file of files) {
                if (isCancelled) break;
                const maxSizeBytes = 50 * 1024 * 1024;
                if (file.size > maxSizeBytes) {
                    ShareUI.showToast(
                        'Upload Limit Exceeded',
                        `"${file.name}" is ${ShareUI.formatSize(file.size)}. The maximum upload size limit is 50 MB per file.`,
                        'error'
                    );
                    failedCount++;
                    continue;
                }

                const mimeType = detectMimeType(file.name, file.type);
                let success = false;
                if (shareManager.mode === 'online') {
                    try {
                        if (isCancelled) break;
                        const safeFilename = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
                        const uniqueFilename = `${Date.now()}_${safeFilename}`;

                        const uploadOptions = { cacheControl: '3600', upsert: false };
                        if (shareManager.activeUploadController) {
                            uploadOptions.signal = shareManager.activeUploadController.signal;
                        }

                        const { error: uploadError } = await shareManager.supabase
                            .storage
                            .from('shared-files')
                            .upload(uniqueFilename, file, uploadOptions);
                        
                        if (uploadError) throw uploadError;
                        if (isCancelled) {
                            // Cleanup uploaded file from storage if user cancelled during upload
                            shareManager.supabase.storage.from('shared-files').remove([uniqueFilename]);
                            break;
                        }

                        const { data: urlData } = shareManager.supabase
                            .storage
                            .from('shared-files')
                            .getPublicUrl(uniqueFilename);

                        const publicUrl = urlData?.publicUrl || '';
                        const newItem = {
                            id: 'file_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                            type: 'file',
                            title: customTitle,
                            filename: file.name,
                            uniqueFilename: uniqueFilename,
                            size: file.size,
                            mimetype: mimeType,
                            url: publicUrl,
                            user_id: shareManager.currentUserId,
                            timestamp: Date.now()
                        };

                        if (isCancelled) {
                            shareManager.supabase.storage.from('shared-files').remove([uniqueFilename]);
                            break;
                        }

                        // Cache file blob locally in IndexedDB as fallback
                        try {
                            await shareManager.dbStore.add({ ...newItem, blob: file });
                        } catch (cacheErr) {}

                        let payload = { ...newItem };
                        let { error: insertError } = await shareManager.supabase
                            .from('shared_items')
                            .insert([payload]);

                        if (insertError && insertError.message && (insertError.message.includes('user_id') || insertError.message.includes('title'))) {
                            if (insertError.message.includes('user_id')) delete payload.user_id;
                            if (insertError.message.includes('title')) delete payload.title;
                            const res = await shareManager.supabase.from('shared_items').insert([payload]);
                            insertError = res.error;
                        }

                        if (insertError) throw insertError;
                        await shareManager.updateStorageEstimate();
                        success = true;
                    } catch (e) {
                        if (isCancelled || e.name === 'AbortError') {
                            console.log('Upload aborted by user');
                            break;
                        }
                        console.error('Supabase upload failed, saving to local browser storage:', e);
                        success = await this.uploadLocalFile(shareManager, file, customTitle);
                    }
                } else {
                    if (isCancelled) break;
                    success = await this.uploadLocalFile(shareManager, file, customTitle);
                }

                if (success) uploadedCount++; else failedCount++;
            }
        } finally {
            shareManager.activeUploadController = null;
            await ShareUI.hideLoadingModal(shareManager);
        }
        
        if (shareManager.dom.fileInput) shareManager.dom.fileInput.value = '';
        if (shareManager.dom.fileTitleInput) shareManager.dom.fileTitleInput.value = '';

        if (failedCount > 0 && uploadedCount === 0) {
            ShareUI.playSound('fail');
        } else if (uploadedCount > 0) {
            ShareUI.playSound('success');
            if (failedCount > 0) setTimeout(() => ShareUI.playSound('fail'), 400);
            this.loadItems(shareManager);
        }
    }

    static async uploadLocalFile(shareManager, file, customTitle = '') {
        const mimeType = detectMimeType(file.name, file.type);
        const newItem = {
            id: 'local_file_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            type: 'file',
            title: customTitle,
            filename: file.name,
            size: file.size,
            mimetype: mimeType,
            blob: file,
            user_id: shareManager.currentUserId,
            timestamp: Date.now()
        };
        try {
            await shareManager.dbStore.add(newItem);
            shareManager.items.unshift(newItem);
            shareManager.renderFeed();
            await shareManager.updateStorageEstimate();
            return true;
        } catch (e) {
            console.error('Upload local file failed:', e);
            return false;
        }
    }

    static async clearHistory(shareManager) {
        const confirmed = await shareManager.showConfirmModal({
            icon: 'trash-2',
            iconColor: 'text-red-400',
            title: 'Clear All History',
            message: 'This will permanently delete every shared item and file. Action cannot be undone.',
            confirmLabel: 'Clear All',
            confirmClass: 'bg-red-500 hover:bg-red-400 text-white'
        });
        if (!confirmed) return;

        if (shareManager.mode === 'online') {
            try {
                const { error: deleteError } = await shareManager.supabase
                    .from('shared_items')
                    .delete()
                    .gt('timestamp', 0);
                
                if (deleteError) throw deleteError;

                const { data: fileList, error: listError } = await shareManager.supabase
                    .storage
                    .from('shared-files')
                    .list();
                
                if (!listError && fileList && fileList.length > 0) {
                    const pathsToDelete = fileList.map(f => f.name);
                    await shareManager.supabase
                        .storage
                        .from('shared-files')
                        .remove(pathsToDelete);
                }

                shareManager.items = [];
                shareManager.selectedIds.clear();
                shareManager.updateSelectedUI();
                shareManager.renderFeed();
            } catch (e) {
                console.error('Supabase clear failed, clearing local IndexedDB:', e);
                await this.clearLocalHistory(shareManager);
            }
        } else {
            await this.clearLocalHistory(shareManager);
        }
    }

    static async clearLocalHistory(shareManager) {
        try {
            await shareManager.dbStore.clear();
            shareManager.items = [];
            shareManager.selectedIds.clear();
            shareManager.updateSelectedUI();
            shareManager.renderFeed();
            await shareManager.updateStorageEstimate();
        } catch (e) {
            console.error('Failed to clear IndexedDB:', e);
        }
    }

    static async deleteItem(shareManager, item) {
        const confirmed = await shareManager.showConfirmModal({
            icon: item.type === 'file' ? 'file-x' : 'message-square-x',
            iconColor: 'text-red-400',
            title: item.type === 'file' ? 'Delete File' : 'Delete Message',
            message: 'Are you sure you want to delete this item permanently?',
            confirmLabel: 'Delete',
            confirmClass: 'bg-red-500 hover:bg-red-400 text-white'
        });
        if (!confirmed) return;

        if (shareManager.mode === 'online') {
            try {
                const { error: dbError } = await shareManager.supabase
                    .from('shared_items')
                    .delete()
                    .eq('id', item.id);
                
                if (dbError) throw dbError;

                const storagePath = item.uniqueFilename || (item.url ? item.url.split('/').pop() : item.filename);
                if (item.type === 'file' && storagePath) {
                    const { error: storageError } = await shareManager.supabase
                        .storage
                        .from('shared-files')
                        .remove([storagePath]);
                    
                    if (storageError) console.warn('Supabase storage delete warning:', storageError);
                }

                shareManager.items = shareManager.items.filter(i => i.id !== item.id);
                shareManager.selectedIds.delete(item.id);
                shareManager.updateSelectedUI();
                shareManager.renderFeed();
                ShareUI.playSound('remove');
                await shareManager.updateStorageEstimate();
            } catch (e) {
                console.error('Supabase delete failed, trying local delete:', e);
                await this.deleteLocalItem(shareManager, item);
            }
        } else {
            await this.deleteLocalItem(shareManager, item);
        }
    }

    static async deleteLocalItem(shareManager, item) {
        try {
            await shareManager.dbStore.delete(item.id);
            shareManager.items = shareManager.items.filter(i => i.id !== item.id);
            shareManager.selectedIds.delete(item.id);
            shareManager.updateSelectedUI();
            shareManager.renderFeed();
            await shareManager.updateStorageEstimate();
            ShareUI.playSound('remove');
        } catch (e) {
            console.error('Failed to delete from local database:', e);
        }
    }

    static async deleteSelectedItems(shareManager) {
        const selectedList = Array.from(shareManager.selectedIds);
        if (selectedList.length === 0) return;
        const count = selectedList.length;

        const confirmed = await shareManager.showConfirmModal({
            icon: 'trash-2',
            iconColor: 'text-red-400',
            title: `Delete ${count} Selected Item${count > 1 ? 's' : ''}`,
            message: `Permanently delete ${count} selected item${count > 1 ? 's' : ''}?`,
            confirmLabel: `Delete (${count})`,
            confirmClass: 'bg-red-500 hover:bg-red-400 text-white'
        });
        if (!confirmed) return;

        if (shareManager.mode === 'online') {
            try {
                const itemsToDelete = shareManager.items.filter(i => shareManager.selectedIds.has(i.id));
                const storagePaths = itemsToDelete
                    .filter(i => i.type === 'file')
                    .map(i => i.uniqueFilename || (i.url ? i.url.split('/').pop() : i.filename))
                    .filter(Boolean);

                if (storagePaths.length > 0) {
                    await shareManager.supabase.storage.from('shared-files').remove(storagePaths);
                }

                await shareManager.supabase.from('shared_items').delete().in('id', selectedList);
                shareManager.items = shareManager.items.filter(i => !shareManager.selectedIds.has(i.id));
                shareManager.selectedIds.clear();
                shareManager.updateSelectedUI();
                shareManager.renderFeed();
                await shareManager.updateStorageEstimate();
                ShareUI.playSound('remove');
            } catch (e) {
                await this.deleteLocalSelectedItems(shareManager, selectedList);
            }
        } else {
            await this.deleteLocalSelectedItems(shareManager, selectedList);
        }
    }

    static async deleteLocalSelectedItems(shareManager, selectedList) {
        for (const id of selectedList) {
            await shareManager.dbStore.delete(id);
        }
        shareManager.items = shareManager.items.filter(i => !shareManager.selectedIds.has(i.id));
        shareManager.selectedIds.clear();
        shareManager.updateSelectedUI();
        shareManager.renderFeed();
        await shareManager.updateStorageEstimate();
        ShareUI.playSound('remove');
    }
}
