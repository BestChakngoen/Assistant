import { ShareUI } from './ShareUI.js';
import { ShareDatabase } from './ShareDatabase.js';

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

        if (shareManager.dom.selectAllCheckbox) {
            shareManager.dom.selectAllCheckbox.onchange = (e) => shareManager.toggleSelectAll(e.target.checked);
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
    }

    static async loadItems(shareManager) {
        if (shareManager.mode === 'online') {
            try {
                const { data, error } = await shareManager.supabase
                    .from('shared_items')
                    .select('*')
                    .order('timestamp', { ascending: false });
                
                if (error) throw error;
                shareManager.items = data || [];
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
        try {
            const localItems = await shareManager.dbStore.getAll();
            shareManager.items = localItems.reverse();
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
            timestamp: Date.now()
        };

        if (shareManager.mode === 'online') {
            try {
                let payload = { ...newItem };
                let { error } = await shareManager.supabase
                    .from('shared_items')
                    .insert([payload]);
                
                if (error && error.message && error.message.includes('title')) {
                    delete payload.title;
                    const res = await shareManager.supabase.from('shared_items').insert([payload]);
                    error = res.error;
                }

                if (error) throw error;
                shareManager.dom.textInput.value = '';
                if (shareManager.dom.textTitleInput) shareManager.dom.textTitleInput.value = '';
                ShareUI.playSound('success');
            } catch (e) {
                console.error('Failed online send, saving to local database:', e);
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

        const loadingTitle = files.length > 1 ? `Uploading ${files.length} Files` : 'Uploading File';
        ShareUI.showLoadingModal(shareManager, loadingTitle, 'Please wait while your files are being uploaded...');

        try {
            for (const file of files) {
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

                let success = false;
                if (shareManager.mode === 'online') {
                    try {
                        const safeFilename = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
                        const uniqueFilename = `${Date.now()}_${safeFilename}`;

                        const { error: uploadError } = await shareManager.supabase
                            .storage
                            .from('shared-files')
                            .upload(uniqueFilename, file, { cacheControl: '3600', upsert: false });
                        
                        if (uploadError) throw uploadError;

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
                            mimetype: file.type,
                            url: publicUrl,
                            timestamp: Date.now()
                        };

                        let payload = { ...newItem };
                        let { error: insertError } = await shareManager.supabase
                            .from('shared_items')
                            .insert([payload]);

                        if (insertError && insertError.message && insertError.message.includes('title')) {
                            delete payload.title;
                            const res = await shareManager.supabase.from('shared_items').insert([payload]);
                            insertError = res.error;
                        }

                        if (insertError) throw insertError;
                        await shareManager.updateStorageEstimate();
                        success = true;
                    } catch (e) {
                        console.error('Supabase upload failed, saving to local browser storage:', e);
                        success = await this.uploadLocalFile(shareManager, file, customTitle);
                    }
                } else {
                    success = await this.uploadLocalFile(shareManager, file, customTitle);
                }

                if (success) uploadedCount++; else failedCount++;
            }
        } finally {
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
        const newItem = {
            id: 'local_file_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            type: 'file',
            title: customTitle,
            filename: file.name,
            size: file.size,
            mimetype: file.type,
            blob: file,
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
                if (shareManager.dom.selectAllCheckbox) shareManager.dom.selectAllCheckbox.checked = false;
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
            if (shareManager.dom.selectAllCheckbox) shareManager.dom.selectAllCheckbox.checked = false;
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

                try {
                    await fetch('/api/delete', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: item.id })
                    });
                } catch (err) {}

                shareManager.items = shareManager.items.filter(i => i.id !== item.id);
                shareManager.selectedIds.delete(item.id);
                shareManager.updateSelectedUI();
                shareManager.renderFeed();
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
                if (shareManager.dom.selectAllCheckbox) shareManager.dom.selectAllCheckbox.checked = false;
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
        if (shareManager.dom.selectAllCheckbox) shareManager.dom.selectAllCheckbox.checked = false;
        shareManager.updateSelectedUI();
        shareManager.renderFeed();
        await shareManager.updateStorageEstimate();
        ShareUI.playSound('remove');
    }
}
