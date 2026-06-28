export class ShareManager {
    constructor() {
        this.supabaseUrl = 'https://ujjwaxdwemrdszyatgxw.supabase.co';
        this.supabaseKey = 'sb_publishable_Zov-pzfGxNS9yUAGwfhMEg_9PxBeYG3';
        this.supabase = null;
        this.mode = 'standalone'; // 'standalone' (IndexedDB) or 'online' (Cloud Sync)
        this.hostUrl = (typeof window !== 'undefined' && window.location) ? window.location.href : 'http://localhost:8888';
        this.items = [];
        this.db = null;
        this.channel = null;
    }

    async init() {
        console.log('Initializing ShareManager with Supabase...');
        
        // 1. Setup DOM Elements
        this.dom = {
            panel: document.getElementById('share-panel'),
            syncStatus: document.getElementById('sync-status'),
            syncStatusText: document.getElementById('sync-status-text'),
            textInput: document.getElementById('share-text-input'),
            btnShareText: document.getElementById('btn-share-text'),
            fileInput: document.getElementById('share-file-input'),
            fileDropzone: document.getElementById('file-dropzone'),
            qrCard: document.getElementById('qr-sharing-card'),
            qrContainer: document.getElementById('qrcode'),
            hostUrlDisplay: document.getElementById('host-url-display'),
            btnClearShare: document.getElementById('btn-clear-share'),
            btnExportBackup: document.getElementById('btn-export-backup'),
            btnImportBackupTrigger: document.getElementById('btn-import-backup-trigger'),
            importBackupFile: document.getElementById('import-backup-file'),
            feed: document.getElementById('share-feed'),
            storageIndicator: document.getElementById('local-storage-indicator'),
            storageUsageText: document.getElementById('storage-usage-text'),
            storageUsageBar: document.getElementById('storage-usage-bar'),
            cloudIndicator: document.getElementById('cloud-storage-indicator'),
            cloudUsageText: document.getElementById('cloud-usage-text'),
            cloudUsageBar: document.getElementById('cloud-usage-bar')
        };

        if (!this.dom.panel) {
            console.error('Share panel element not found in DOM');
            return;
        }

        // Initialize Supabase Client if available
        if (typeof window !== 'undefined' && window.supabase) {
            try {
                this.supabase = window.supabase.createClient(this.supabaseUrl, this.supabaseKey);
            } catch (err) {
                console.error('Failed to initialize Supabase client:', err);
            }
        } else {
            console.warn('Supabase JS library not loaded. Falling back to local offline storage.');
        }

        // 2. Initialize database for standalone mode fallback
        await this.initIndexedDB();

        // 3. Detect mode (Online Cloud vs. Standalone)
        await this.detectMode();

        // 4. Bind Events
        this.bindEvents();

        // 5. Load Items
        await this.loadItems();

        // 6. Update Lucide Icons for dynamic content
        if (window.lucide) window.lucide.createIcons();

        // 7. Update browser storage usage estimate
        await this.updateStorageEstimate();
    }

    async initIndexedDB() {
        this.dbStore = {
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

        try {
            await this.dbStore.open();
            console.log('IndexedDB ShareFilesDB initialized successfully.');
        } catch (e) {
            console.error('Failed to initialize IndexedDB:', e);
        }
    }

    async detectMode() {
        if (this.supabase) {
            this.mode = 'online';
            this.dom.syncStatusText.innerText = 'CLOUD SYNC ACTIVE';
            this.dom.syncStatus.className = 'px-3.5 py-1.5 rounded-full text-xs font-mono font-bold flex items-center gap-2 bg-green-500/10 border border-green-500/20 text-green-400';
            this.dom.syncStatus.querySelector('span').className = 'w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse';

            // Display cloud URL
            this.dom.hostUrlDisplay.innerText = this.hostUrl;

            // Setup Supabase Realtime Channel
            this.setupRealtime();
        } else {
            this.setStandaloneMode();
        }

        // Generate QR code for sharing current page
        this.generateQRCode(this.hostUrl);
    }

    setStandaloneMode() {
        this.mode = 'standalone';
        this.hostUrl = (typeof window !== 'undefined' && window.location) ? window.location.href : 'http://localhost:8888';
        
        this.dom.syncStatusText.innerText = 'STANDALONE MODE (OFFLINE)';
        this.dom.syncStatus.className = 'px-3.5 py-1.5 rounded-full text-xs font-mono font-bold flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-400';
        this.dom.syncStatus.querySelector('span').className = 'w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse';
        
        this.dom.hostUrlDisplay.innerText = 'STANDALONE - ONLY PERSISTS LOCALLY';
    }

    setupRealtime() {
        if (this.channel) this.supabase.removeChannel(this.channel);

        this.channel = this.supabase
            .channel('schema-db-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'shared_items' },
                (payload) => {
                    console.log('Realtime change received:', payload);
                    if (payload.eventType === 'INSERT') {
                        if (!this.items.some(item => item.id === payload.new.id)) {
                            this.items.unshift(payload.new);
                            this.renderFeed();
                        }
                    } else if (payload.eventType === 'DELETE') {
                        // Keep items that weren't deleted
                        this.items = this.items.filter(item => item.id !== payload.old.id);
                        this.renderFeed();
                    } else if (payload.eventType === 'UPDATE') {
                        const idx = this.items.findIndex(item => item.id === payload.new.id);
                        if (idx !== -1) {
                            this.items[idx] = payload.new;
                            this.renderFeed();
                        }
                    }
                }
            )
            .subscribe((status) => {
                console.log('Realtime subscription status:', status);
            });
    }

    generateQRCode(text) {
        if (!this.dom.qrContainer) return;
        this.dom.qrContainer.innerHTML = '';
        
        if (window.QRCode) {
            try {
                new window.QRCode(this.dom.qrContainer, {
                    text: text,
                    width: 140,
                    height: 140,
                    colorDark: "#080b11",
                    colorLight: "#ffffff",
                    correctLevel: window.QRCode.CorrectLevel.H
                });
            } catch (e) {
                console.error('QR Code generation failed:', e);
                this.dom.qrContainer.innerHTML = '<span class="text-xs text-red-400">QR Generation Error</span>';
            }
        } else {
            this.dom.qrContainer.innerHTML = '<span class="text-xs text-slate-400 font-mono">QRCode.js is not loaded</span>';
        }
    }

    bindEvents() {
        // Send Text
        this.dom.btnShareText.onclick = () => this.shareText();

        // Clear History
        this.dom.btnClearShare.onclick = () => this.clearHistory();

        // File Selection Click
        this.dom.fileDropzone.onclick = () => this.dom.fileInput.click();

        // Dropzone Drag & Drop
        this.dom.fileDropzone.ondragover = (e) => {
            e.preventDefault();
            this.dom.fileDropzone.classList.add('border-cyan-500', 'bg-cyan-500/5');
        };

        this.dom.fileDropzone.ondragleave = (e) => {
            e.preventDefault();
            this.dom.fileDropzone.classList.remove('border-cyan-500', 'bg-cyan-500/5');
        };

        this.dom.fileDropzone.ondrop = (e) => {
            e.preventDefault();
            this.dom.fileDropzone.classList.remove('border-cyan-500', 'bg-cyan-500/5');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.uploadFiles(files);
            }
        };

        // File Input Change
        this.dom.fileInput.onchange = () => {
            const files = this.dom.fileInput.files;
            if (files.length > 0) {
                this.uploadFiles(files);
            }
        };

        // Handle text enter key (Ctrl + Enter to send)
        this.dom.textInput.onkeydown = (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                e.preventDefault();
                this.shareText();
            }
        };

        // Backup Actions
        this.dom.btnExportBackup.onclick = () => this.exportBackup();
        this.dom.btnImportBackupTrigger.onclick = () => this.dom.importBackupFile.click();
        this.dom.importBackupFile.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                this.importBackup(file);
                this.dom.importBackupFile.value = ''; // Reset
            }
        };
    }

    async loadItems() {
        if (this.mode === 'online') {
            try {
                const { data, error } = await this.supabase
                    .from('shared_items')
                    .select('*')
                    .order('timestamp', { ascending: false });
                
                if (error) throw error;
                this.items = data || [];
            } catch (e) {
                console.error('Failed to load Supabase items, using IndexedDB:', e);
                await this.loadItemsFromIndexedDB();
            }
        } else {
            await this.loadItemsFromIndexedDB();
        }
        this.renderFeed();
        await this.updateStorageEstimate();
    }

    async loadItemsFromIndexedDB() {
        try {
            const localItems = await this.dbStore.getAll();
            this.items = localItems.reverse();
        } catch (e) {
            console.error('Failed to load items from IndexedDB:', e);
            this.items = [];
        }
    }

    async shareText() {
        const text = this.dom.textInput.value.trim();
        if (!text) return;

        const newItem = {
            id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            type: 'text',
            text: text,
            timestamp: Date.now()
        };

        if (this.mode === 'online') {
            try {
                const { error } = await this.supabase
                    .from('shared_items')
                    .insert([newItem]);
                
                if (error) {
                    alert(`Supabase Error: ${error.message || error.details || JSON.stringify(error)}`);
                    throw error;
                }
                this.dom.textInput.value = '';
            } catch (e) {
                console.error('Failed online send, saving to local database:', e);
                await this.saveLocalItem(newItem);
            }
        } else {
            await this.saveLocalItem(newItem);
        }
    }

    async saveLocalItem(item) {
        try {
            await this.dbStore.add(item);
            this.items.unshift(item);
            this.dom.textInput.value = '';
            this.renderFeed();
            await this.updateStorageEstimate();
        } catch (e) {
            console.error('Failed to write to local database:', e);
        }
    }

    async uploadFiles(files) {
        for (const file of files) {
            // Check for file size limit (50 MB)
            const maxSizeBytes = 50 * 1024 * 1024;
            if (file.size > maxSizeBytes) {
                this.showToast(
                    'Upload Limit Exceeded',
                    `"${file.name}" is ${this.formatSize(file.size)}. The maximum upload size limit is 50 MB per file.`,
                    'error'
                );
                continue;
            }

            if (this.mode === 'online') {
                try {
                    // Safe alphanumeric filename
                    const safeFilename = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
                    const uniqueFilename = `${Date.now()}_${safeFilename}`;

                    // 1. Upload file binary directly to Supabase storage bucket 'shared-files'
                    const { data: uploadData, error: uploadError } = await this.supabase
                        .storage
                        .from('shared-files')
                        .upload(uniqueFilename, file, {
                            cacheControl: '3600',
                            upsert: false
                        });
                    
                    if (uploadError) throw uploadError;

                    // 2. Obtain its public URL
                    const { data: urlData } = this.supabase
                        .storage
                        .from('shared-files')
                        .getPublicUrl(uniqueFilename);

                    const publicUrl = urlData?.publicUrl || '';

                    // 3. Insert record metadata into shared_items table
                    const newItem = {
                        id: 'file_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                        type: 'file',
                        filename: file.name,
                        uniqueFilename: uniqueFilename,
                        size: file.size,
                        mimetype: file.type,
                        url: publicUrl,
                        timestamp: Date.now()
                    };

                    const { error: insertError } = await this.supabase
                        .from('shared_items')
                        .insert([newItem]);

                    if (insertError) throw insertError;
                    console.log('Uploaded successfully to Supabase:', file.name);
                    
                    // Update capacity display after successful upload
                    await this.updateStorageEstimate();
                } catch (e) {
                    console.error('Supabase upload failed, saving to local browser storage:', e);
                    await this.uploadLocalFile(file);
                }
            } else {
                await this.uploadLocalFile(file);
            }
        }
        
        // Reset file input
        this.dom.fileInput.value = '';
    }

    async uploadLocalFile(file) {
        const newItem = {
            id: 'local_file_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            type: 'file',
            filename: file.name,
            size: file.size,
            mimetype: file.type,
            blob: file, // Native File/Blob object
            timestamp: Date.now()
        };
        await this.dbStore.add(newItem);
        this.items.unshift(newItem);
        this.renderFeed();
        await this.updateStorageEstimate();
    }

    async clearHistory() {
        if (!confirm('Are you sure you want to clear all shared history?')) return;

        if (this.mode === 'online') {
            try {
                // Delete all database entries
                const { error: deleteError } = await this.supabase
                    .from('shared_items')
                    .delete()
                    .gt('timestamp', 0);
                
                if (deleteError) throw deleteError;

                // Empty storage bucket files
                const { data: fileList, error: listError } = await this.supabase
                    .storage
                    .from('shared-files')
                    .list();
                
                if (!listError && fileList && fileList.length > 0) {
                    const pathsToDelete = fileList.map(f => f.name);
                    await this.supabase
                        .storage
                        .from('shared-files')
                        .remove(pathsToDelete);
                }

                this.items = [];
                this.renderFeed();
            } catch (e) {
                console.error('Supabase clear failed, clearing local IndexedDB:', e);
                await this.clearLocalHistory();
            }
        } else {
            await this.clearLocalHistory();
        }
    }

    async clearLocalHistory() {
        try {
            await this.dbStore.clear();
            this.items = [];
            this.renderFeed();
            await this.updateStorageEstimate();
        } catch (e) {
            console.error('Failed to clear IndexedDB:', e);
        }
    }

    formatSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) + ' | ' + date.toLocaleDateString('en-US');
    }

    showToast(title, message, type = 'error') {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'fixed bottom-6 left-6 z-50 flex flex-col gap-3 max-w-sm w-full';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        const isError = type === 'error';
        
        toast.className = `glass-panel p-4 rounded-xl border ${
            isError ? 'border-red-500/30 bg-red-950/20' : 'border-green-500/30 bg-green-950/20'
        } bg-slate-950/80 shadow-2xl flex gap-3 items-start transition-all duration-300 transform translate-y-2 opacity-0`;

        const icon = isError ? 'alert-triangle' : 'check-circle';
        const iconColor = isError ? 'text-red-400' : 'text-green-400';

        toast.innerHTML = `
            <div class="p-1.5 rounded-lg bg-slate-900/60 ${iconColor} shrink-0">
                <i data-lucide="${icon}" class="w-5 h-5"></i>
            </div>
            <div class="flex-1 min-w-0">
                <h4 class="text-xs font-mono font-bold text-white uppercase tracking-wider">${title}</h4>
                <p class="text-xs text-slate-400 mt-1 leading-relaxed">${message}</p>
            </div>
            <button class="text-slate-500 hover:text-slate-350 transition-colors shrink-0" onclick="this.parentElement.remove()">
                <i data-lucide="x" class="w-3.5 h-3.5"></i>
            </button>
        `;

        container.appendChild(toast);
        if (window.lucide) window.lucide.createIcons();

        // Trigger animation
        requestAnimationFrame(() => {
            toast.classList.remove('translate-y-2', 'opacity-0');
        });

        // Auto remove after 6 seconds
        setTimeout(() => {
            toast.classList.add('opacity-0', 'translate-y-2');
            setTimeout(() => toast.remove(), 300);
        }, 6000);
    }

    async updateStorageEstimate() {
        if (this.mode === 'online' && this.supabase) {
            // Hide local storage, show cloud storage
            if (this.dom.storageIndicator) this.dom.storageIndicator.classList.add('hidden');
            if (this.dom.cloudIndicator) this.dom.cloudIndicator.classList.remove('hidden');

            try {
                // Fetch list of files in the bucket
                const { data: fileList, error } = await this.supabase
                    .storage
                    .from('shared-files')
                    .list();

                if (error) throw error;

                const totalBytes = (fileList || []).reduce((acc, file) => acc + (file.metadata?.size || 0), 0);
                const cloudQuotaBytes = 1024 * 1024 * 1024; // 1 GB free tier
                const percentage = parseFloat(((totalBytes / cloudQuotaBytes) * 100).toFixed(2));

                if (this.dom.cloudUsageText) {
                    this.dom.cloudUsageText.innerText = `${this.formatSize(totalBytes)} / ${this.formatSize(cloudQuotaBytes)} (${percentage}%)`;
                }

                if (this.dom.cloudUsageBar) {
                    this.dom.cloudUsageBar.style.width = `${percentage}%`;
                    if (percentage > 90) {
                        this.dom.cloudUsageBar.className = 'bg-gradient-to-r from-red-500 to-rose-600 h-1.5 rounded-full transition-all duration-500';
                    } else if (percentage > 70) {
                        this.dom.cloudUsageBar.className = 'bg-gradient-to-r from-amber-500 to-orange-500 h-1.5 rounded-full transition-all duration-500';
                    } else {
                        this.dom.cloudUsageBar.className = 'bg-gradient-to-r from-emerald-500 to-teal-500 h-1.5 rounded-full transition-all duration-500';
                    }
                }
            } catch (err) {
                console.warn('Failed to calculate Supabase storage size:', err);
                if (this.dom.cloudUsageText) {
                    this.dom.cloudUsageText.innerText = 'Unable to fetch cloud usage';
                }
            }
        } else {
            // Hide cloud storage, show local storage
            if (this.dom.cloudIndicator) this.dom.cloudIndicator.classList.add('hidden');

            if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
                try {
                    const estimate = await navigator.storage.estimate();
                    const usage = estimate.usage || 0;
                    const quota = estimate.quota || 0;
                    
                    const percentage = quota > 0 ? parseFloat(((usage / quota) * 100).toFixed(2)) : 0;
                    
                    if (this.dom.storageUsageText) {
                        this.dom.storageUsageText.innerText = `${this.formatSize(usage)} / ${this.formatSize(quota)} (${percentage}%)`;
                    }
                    
                    if (this.dom.storageUsageBar) {
                        this.dom.storageUsageBar.style.width = `${percentage}%`;
                        
                        // Dynamic coloring based on usage percentage
                        if (percentage > 90) {
                            this.dom.storageUsageBar.className = 'bg-gradient-to-r from-red-500 to-rose-600 h-1.5 rounded-full transition-all duration-500';
                        } else if (percentage > 70) {
                            this.dom.storageUsageBar.className = 'bg-gradient-to-r from-amber-500 to-orange-500 h-1.5 rounded-full transition-all duration-500';
                        } else {
                            this.dom.storageUsageBar.className = 'bg-gradient-to-r from-cyan-500 to-blue-500 h-1.5 rounded-full transition-all duration-500';
                        }
                    }
                    
                    if (this.dom.storageIndicator) {
                        this.dom.storageIndicator.classList.remove('hidden');
                    }
                } catch (e) {
                    console.warn('Storage estimate API failed:', e);
                    if (this.dom.storageIndicator) {
                        this.dom.storageIndicator.classList.add('hidden');
                    }
                }
            } else {
                if (this.dom.storageIndicator) {
                    this.dom.storageIndicator.classList.add('hidden');
                }
            }
        }
    }

    renderFeed() {
        this.dom.feed.innerHTML = '';

        if (this.items.length === 0) {
            this.dom.feed.innerHTML = `
                <div class="flex flex-col items-center justify-center h-full text-slate-500 py-20">
                    <i data-lucide="inbox" class="w-12 h-12 mb-3 stroke-1 animate-bounce"></i>
                    <p class="text-sm font-bold">No items shared yet</p>
                    <p class="text-xs text-slate-600 mt-1">Send a message or drop a file to start sharing</p>
                </div>
            `;
            if (window.lucide) window.lucide.createIcons();
            // reset badge
            const badge = document.getElementById('share-count-badge');
            if (badge) badge.textContent = '0';
            return;
        }

        this.items.forEach(item => {
            const card = document.createElement('div');
            card.className = 'glass-panel p-4 rounded-xl border border-slate-800/80 bg-slate-950/20 hover:border-slate-800 flex flex-col gap-3 relative group transition-all';

            // Determine the share type for filtering
            let shareType = item.type; // 'text' or 'file'
            if (item.type === 'text') {
                const isLink = /^(https?:\/\/[^\s]+)$/i.test(item.text.trim());
                if (isLink) shareType = 'link';
            } else if (item.type === 'file' && item.mimetype) {
                const mime = item.mimetype.toLowerCase();
                const name = (item.filename || '').toLowerCase();
                if (mime.startsWith('image/')) {
                    shareType = 'image';
                } else if (mime.startsWith('video/')) {
                    shareType = 'video';
                } else if (mime.startsWith('audio/')) {
                    shareType = 'audio';
                } else if (mime === 'application/pdf' || name.endsWith('.pdf')) {
                    shareType = 'pdf';
                } else if (mime.includes('word') || mime.includes('document') || name.endsWith('.docx') || name.endsWith('.doc')) {
                    shareType = 'docx';
                } else {
                    shareType = 'file'; // Fallback to other files
                }
            } else if (item.type === 'file') {
                shareType = 'file'; // Fallback if no mimetype exists
            }
            card.dataset.shareType = shareType;
            
            // Header
            const header = document.createElement('div');
            header.className = 'flex items-center justify-between border-b border-slate-900/60 pb-2';
            
            const infoDiv = document.createElement('div');
            infoDiv.className = 'flex items-center gap-2 text-[10px] font-mono text-slate-500';
            
            // Icon representing type
            const typeIcon = document.createElement('i');
            typeIcon.className = 'w-3.5 h-3.5';
            
            if (item.type === 'text') {
                typeIcon.setAttribute('data-lucide', 'message-square');
                infoDiv.appendChild(typeIcon);
                
                // Detect link
                const isLink = /^(https?:\/\/[^\s]+)$/i.test(item.text.trim());
                infoDiv.appendChild(document.createTextNode(isLink ? 'LINK SHARE' : 'TEXT NOTE'));
            } else {
                typeIcon.setAttribute('data-lucide', 'file');
                infoDiv.appendChild(typeIcon);
                
                const ext = item.filename.split('.').pop().toUpperCase();
                infoDiv.appendChild(document.createTextNode(`FILE SHARE (${ext})`));
            }

            const timeSpan = document.createElement('span');
            timeSpan.innerText = this.formatTime(item.timestamp);
            infoDiv.appendChild(timeSpan);
            
            header.appendChild(infoDiv);

            // Copy/Download quick action
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
                
                if (this.mode === 'online' && item.url) {
                    btnDownload.href = item.url;
                    btnDownload.download = item.filename;
                } else if (item.blob) {
                    btnDownload.href = URL.createObjectURL(item.blob);
                    btnDownload.download = item.filename;
                }
                
                actionDiv.appendChild(btnDownload);
            }

            header.appendChild(actionDiv);
            card.appendChild(header);

            // Body content rendering
            const body = document.createElement('div');
            body.className = 'text-sm text-slate-200';

            if (item.type === 'text') {
                // Link checker
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
                // File rendering
                const fileContainer = document.createElement('div');
                fileContainer.className = 'flex flex-col gap-3';
                
                // General File Meta
                const fileMeta = document.createElement('div');
                fileMeta.className = 'flex items-center gap-3 bg-slate-950/40 p-3 rounded-lg border border-slate-900/60';
                
                const fileIcon = document.createElement('div');
                fileIcon.className = 'w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center text-cyan-400 border border-slate-800';
                
                // Mime-type based icons
                let lucideIcon = 'file';
                if (item.mimetype.startsWith('image/')) lucideIcon = 'image';
                else if (item.mimetype.startsWith('video/')) lucideIcon = 'video';
                else if (item.mimetype.startsWith('audio/')) lucideIcon = 'music';
                else if (item.mimetype === 'application/pdf') lucideIcon = 'file-text';
                else if (item.mimetype.includes('zip') || item.mimetype.includes('tar') || item.mimetype.includes('rar')) lucideIcon = 'folder-archive';
                
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
                fileSizeP.innerText = this.formatSize(item.size);
                fileDetails.appendChild(fileSizeP);

                fileMeta.appendChild(fileDetails);
                fileContainer.appendChild(fileMeta);

                // Inline Player Rendering
                const fileUrl = (this.mode === 'online' && item.url) ? item.url : (item.blob ? URL.createObjectURL(item.blob) : '');
                
                if (fileUrl) {
                    if (item.mimetype.startsWith('image/')) {
                        // Image preview
                        const img = document.createElement('img');
                        img.src = fileUrl;
                        img.alt = item.filename;
                        img.className = 'max-h-[250px] max-w-full rounded-lg bg-slate-950/40 border border-slate-900 object-contain hover:scale-[1.01] transition-transform cursor-zoom-in';
                        img.onclick = () => window.open(fileUrl, '_blank');
                        fileContainer.appendChild(img);
                    } else if (item.mimetype.startsWith('video/')) {
                        // Video Player
                        const video = document.createElement('video');
                        video.src = fileUrl;
                        video.controls = true;
                        video.preload = 'metadata';
                        video.className = 'max-h-[300px] w-full rounded-lg bg-black/60 border border-slate-900';
                        fileContainer.appendChild(video);
                    } else if (item.mimetype.startsWith('audio/')) {
                        // Audio Player
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
            this.dom.feed.appendChild(card);
        });

        // Initialize newly created lucide icons
        if (window.lucide) window.lucide.createIcons();

        // Update the count badge (total visible)
        const badge = document.getElementById('share-count-badge');
        if (badge) badge.textContent = this.items.length;
    }

    blobToBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    dataURLtoBlob(dataurl) {
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

    async exportBackup() {
        if (this.items.length === 0) {
            alert('No data to export.');
            return;
        }

        const originalText = this.dom.btnExportBackup.innerHTML;
        this.dom.btnExportBackup.disabled = true;
        this.dom.btnExportBackup.innerHTML = '<i data-lucide="loader" class="w-3.5 h-3.5 animate-spin"></i> Preparing backup...';
        if (window.lucide) window.lucide.createIcons();

        try {
            const backupItems = [];
            for (const item of this.items) {
                const backupItem = { ...item };
                if (item.type === 'file') {
                    try {
                        let blob = item.blob;
                        if (!blob && item.url) {
                            const fetchUrl = this.mode === 'online' ? (this.hostUrl + item.url) : item.url;
                            const res = await fetch(fetchUrl);
                            if (res.ok) {
                                blob = await res.blob();
                            }
                        }
                        if (blob) {
                            const base64Data = await this.blobToBase64(blob);
                            backupItem.base64Data = base64Data;
                            delete backupItem.blob; // Do not serialize Blob raw object
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
            this.dom.btnExportBackup.disabled = false;
            this.dom.btnExportBackup.innerHTML = originalText;
            if (window.lucide) window.lucide.createIcons();
        }
    }

    async importBackup(file) {
        if (!file) return;

        if (!confirm('The backup data will be added to your list. Are you sure you want to import it?')) {
            return;
        }

        const originalText = this.dom.btnImportBackupTrigger.innerHTML;
        this.dom.btnImportBackupTrigger.disabled = true;
        this.dom.btnImportBackupTrigger.innerHTML = '<i data-lucide="loader" class="w-3.5 h-3.5 animate-spin"></i> Importing...';
        if (window.lucide) window.lucide.createIcons();

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const importedItems = JSON.parse(e.target.result);
                if (!Array.isArray(importedItems)) {
                    alert('Invalid backup file format.');
                    return;
                }

                // Process in reverse to maintain correct order in feed (oldest first)
                const itemsToImport = [...importedItems].reverse();

                for (const item of itemsToImport) {
                    if (item.type === 'file' && item.base64Data) {
                        const blob = this.dataURLtoBlob(item.base64Data);
                        item.blob = new File([blob], item.filename, { type: blob.type });
                        delete item.base64Data;
                    }

                    if (this.mode === 'online') {
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
                        await this.dbStore.add(item);
                    }
                }

                alert('Successfully imported ' + importedItems.length + ' items.');
                await this.loadItems();
            } catch (err) {
                console.error('Import failed:', err);
                alert('Error importing data: ' + err.message);
            } finally {
                this.dom.btnImportBackupTrigger.disabled = false;
                this.dom.btnImportBackupTrigger.innerHTML = originalText;
                if (window.lucide) window.lucide.createIcons();
            }
        };
        reader.onerror = () => {
            alert('Failed to read backup file.');
            this.dom.btnImportBackupTrigger.disabled = false;
            this.dom.btnImportBackupTrigger.innerHTML = originalText;
            if (window.lucide) window.lucide.createIcons();
        };
        reader.readAsText(file);
    }
}
