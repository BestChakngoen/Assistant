export class ShareDatabase {
    static createDBStore() {
        return {
            dbName: 'ShareFilesDB',
            version: 1,
            db: null,
            open() {
                return new Promise((resolve, reject) => {
                    const request = indexedDB.open(this.dbName, this.version);
                    request.onerror = () => reject(request.error);
                    request.onsuccess = () => {
                        this.db = request.result;
                        resolve();
                    };
                    request.onupgradeneeded = (e) => {
                        const db = e.target.result;
                        if (!db.objectStoreNames.contains('items')) {
                            db.createObjectStore('items', { keyPath: 'id' });
                        }
                    };
                });
            },
            getAll() {
                return new Promise((resolve, reject) => {
                    const tx = this.db.transaction('items', 'readonly');
                    const store = tx.objectStore('items');
                    const request = store.getAll();
                    request.onsuccess = () => resolve(request.result);
                    request.onerror = () => reject(request.error);
                });
            },
            add(item) {
                return new Promise((resolve, reject) => {
                    const tx = this.db.transaction('items', 'readwrite');
                    const store = tx.objectStore('items');
                    const request = store.put(item);
                    request.onsuccess = () => resolve();
                    request.onerror = () => reject(request.error);
                });
            },
            delete(id) {
                return new Promise((resolve, reject) => {
                    const tx = this.db.transaction('items', 'readwrite');
                    const store = tx.objectStore('items');
                    const request = store.delete(id);
                    request.onsuccess = () => resolve();
                    request.onerror = () => reject(request.error);
                });
            },
            clear() {
                return new Promise((resolve, reject) => {
                    const tx = this.db.transaction('items', 'readwrite');
                    const store = tx.objectStore('items');
                    const request = store.clear();
                    request.onsuccess = () => resolve();
                    request.onerror = () => reject(request.error);
                });
            }
        };
    }

    static blobToBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    static dataURLtoBlob(dataurl) {
        const arr = dataurl.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new Blob([u8arr], { type: mime });
    }

    static async exportBackup(shareManager) {
        if (shareManager.items.length === 0) {
            alert('No data to export.');
            return;
        }

        const originalText = shareManager.dom.btnExportBackup.innerHTML;
        shareManager.dom.btnExportBackup.disabled = true;
        shareManager.dom.btnExportBackup.innerHTML = '<i data-lucide="loader" class="w-3.5 h-3.5 animate-spin"></i> Preparing backup...';
        if (window.lucide) window.lucide.createIcons();

        try {
            const backupItems = [];
            for (const item of shareManager.items) {
                const backupItem = { ...item };
                if (item.type === 'file') {
                    try {
                        let blob = item.blob;
                        if (!blob && item.url) {
                            const fetchUrl = shareManager.mode === 'online' ? (shareManager.hostUrl + item.url) : item.url;
                            const res = await fetch(fetchUrl);
                            if (res.ok) {
                                blob = await res.blob();
                            }
                        }
                        if (blob) {
                            const base64Data = await this.blobToBase64(blob);
                            backupItem.base64Data = base64Data;
                            delete backupItem.blob;
                        }
                    } catch (fileErr) {
                        console.error('Failed to serialize file for backup:', item.filename, fileErr);
                    }
                }
                backupItems.push(backupItem);
            }

            const jsonString = JSON.stringify(backupItems, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const downloadAnchor = document.createElement('a');
            downloadAnchor.href = url;
            downloadAnchor.download = `tradetracker_share_backup_${Date.now()}.json`;
            document.body.appendChild(downloadAnchor);
            downloadAnchor.click();
            downloadAnchor.remove();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Export failed:', err);
            alert('Error exporting data: ' + err.message);
        } finally {
            shareManager.dom.btnExportBackup.disabled = false;
            shareManager.dom.btnExportBackup.innerHTML = originalText;
            if (window.lucide) window.lucide.createIcons();
        }
    }

    static async importBackup(shareManager, file) {
        if (!file) return;

        const confirmed = await shareManager.showConfirmModal({
            icon: 'download-cloud',
            iconColor: 'text-blue-400',
            title: 'Import Backup',
            message: 'Items from the backup file will be added to your current list. Duplicates may appear if items already exist.',
            confirmLabel: 'Import',
            confirmClass: 'bg-blue-500 hover:bg-blue-400 text-white'
        });
        if (!confirmed) return;

        const originalText = shareManager.dom.btnImportBackupTrigger.innerHTML;
        shareManager.dom.btnImportBackupTrigger.disabled = true;
        shareManager.dom.btnImportBackupTrigger.innerHTML = '<i data-lucide="loader" class="w-3.5 h-3.5 animate-spin"></i> Importing...';
        if (window.lucide) window.lucide.createIcons();

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const importedItems = JSON.parse(e.target.result);
                if (!Array.isArray(importedItems)) {
                    alert('Invalid backup file format.');
                    return;
                }

                const itemsToImport = [...importedItems].reverse();

                for (const item of itemsToImport) {
                    if (item.type === 'file' && item.base64Data) {
                        const blob = this.dataURLtoBlob(item.base64Data);
                        item.blob = new File([blob], item.filename, { type: blob.type });
                        delete item.base64Data;
                    }

                    if (shareManager.mode === 'online') {
                        if (item.type === 'text') {
                            await fetch('/api/message', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ text: item.text })
                            });
                        } else if (item.type === 'file' && item.blob) {
                            await fetch(`/api/upload?filename=${encodeURIComponent(item.filename)}`, {
                                method: 'POST',
                                body: item.blob
                            });
                        }
                    } else {
                        await shareManager.dbStore.add(item);
                    }
                }

                alert('Successfully imported ' + importedItems.length + ' items.');
                await shareManager.loadItems();
            } catch (err) {
                console.error('Import failed:', err);
                alert('Error importing data: ' + err.message);
            } finally {
                shareManager.dom.btnImportBackupTrigger.disabled = false;
                shareManager.dom.btnImportBackupTrigger.innerHTML = originalText;
                if (window.lucide) window.lucide.createIcons();
            }
        };
        reader.onerror = () => {
            alert('Failed to read backup file.');
            shareManager.dom.btnImportBackupTrigger.disabled = false;
            shareManager.dom.btnImportBackupTrigger.innerHTML = originalText;
            if (window.lucide) window.lucide.createIcons();
        };
        reader.readAsText(file);
    }
}
