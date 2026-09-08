/**
 * ShareUploader.js - File Upload Pipeline & Abort Controller Manager
 * Handles multi-file uploads to Supabase Storage with local IndexedDB fallback and progress modals.
 */
import { ShareUI } from './ShareUI.js';

export function detectMimeType(filename, mimeType) {
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

export class ShareUploader {
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
            shareManager.loadItems();
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
}
