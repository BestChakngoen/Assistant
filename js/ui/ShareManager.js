import { ShareDatabase } from './share/ShareDatabase.js';
import { ShareCloud } from './share/ShareCloud.js';
import { ShareUI } from './share/ShareUI.js';
import { ShareFeedRenderer } from './share/ShareFeedRenderer.js';
import { ShareActions } from './share/ShareActions.js';

/**
 * ShareManager - File Sharing & Cloud Sync Coordinator
 * Refactored under OOP & SOLID principles:
 * Delegates database, cloud sync, UI dialogs, feed rendering, and user actions to specialized sub-modules.
 */
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
        this.starredIds = new Set();
        this.selectedIds = new Set();
        this.dbStore = ShareDatabase.createDBStore();
    }

    async init() {
        console.log('Initializing ShareManager with Supabase...');
        
        // 1. Setup DOM Elements
        this.dom = {
            panel: document.getElementById('share-panel'),
            syncStatus: document.getElementById('sync-status'),
            syncStatusText: document.getElementById('sync-status-text'),
            textInput: document.getElementById('share-text-input'),
            textTitleInput: document.getElementById('share-text-title'),
            btnShareText: document.getElementById('btn-share-text'),
            fileInput: document.getElementById('share-file-input'),
            fileTitleInput: document.getElementById('share-file-title'),
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
            cloudUsageBar: document.getElementById('cloud-usage-bar'),
            selectAllCheckbox: document.getElementById('share-select-all'),
            selectedCountText: document.getElementById('share-selected-count'),
            btnDeleteSelected: document.getElementById('btn-delete-selected')
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

        // 5. Load Starred and Items
        this.loadStarred();
        await this.loadItems();

        // 6. Update Lucide Icons for dynamic content
        if (window.lucide) window.lucide.createIcons();

        // 7. Update browser storage usage estimate
        await this.updateStorageEstimate();
    }

    async initIndexedDB() {
        try {
            await this.dbStore.open();
            console.log('IndexedDB ShareFilesDB initialized successfully.');
        } catch (e) {
            console.error('Failed to initialize IndexedDB:', e);
        }
    }

    async detectMode() {
        return ShareCloud.detectMode(this);
    }

    setStandaloneMode() {
        return ShareCloud.setStandaloneMode(this);
    }

    setupRealtime() {
        return ShareCloud.setupRealtime(this);
    }

    generateQRCode(text) {
        return ShareUI.generateQRCode(this.dom ? this.dom.qrContainer : null, text);
    }

    bindEvents() {
        return ShareActions.bindEvents(this);
    }

    async loadItems() {
        return ShareActions.loadItems(this);
    }

    async loadItemsFromIndexedDB() {
        return ShareActions.loadItemsFromIndexedDB(this);
    }

    async shareText() {
        return ShareActions.shareText(this);
    }

    async saveLocalItem(item) {
        return ShareActions.saveLocalItem(this, item);
    }

    async uploadFiles(files) {
        return ShareActions.uploadFiles(this, files);
    }

    async uploadLocalFile(file, customTitle = '') {
        return ShareActions.uploadLocalFile(this, file, customTitle);
    }

    async clearHistory() {
        return ShareActions.clearHistory(this);
    }

    async clearLocalHistory() {
        return ShareActions.clearLocalHistory(this);
    }

    async deleteItem(item) {
        return ShareActions.deleteItem(this, item);
    }

    async deleteLocalItem(item) {
        return ShareActions.deleteLocalItem(this, item);
    }

    playSound(name) {
        return ShareUI.playSound(name);
    }

    loadStarred() {
        return ShareFeedRenderer.loadStarred(this);
    }

    saveStarred() {
        return ShareFeedRenderer.saveStarred(this);
    }

    toggleStar(itemId) {
        return ShareFeedRenderer.toggleStar(this, itemId);
    }

    toggleSelectAll(checked) {
        return ShareFeedRenderer.toggleSelectAll(this, checked);
    }

    updateSelectedUI() {
        return ShareFeedRenderer.updateSelectedUI(this);
    }

    async deleteSelectedItems() {
        return ShareActions.deleteSelectedItems(this);
    }

    async deleteLocalSelectedItems(selectedList) {
        return ShareActions.deleteLocalSelectedItems(this, selectedList);
    }

    enterEditMode(item, card, bodyEl) {
        return ShareFeedRenderer.enterEditMode(this, item, card, bodyEl);
    }

    async updateItem(item, newData) {
        return ShareFeedRenderer.updateItem(this, item, newData);
    }

    formatSize(bytes) {
        return ShareUI.formatSize(bytes);
    }

    formatTime(timestamp) {
        return ShareUI.formatTime(timestamp);
    }

    showToast(title, message, type = 'error') {
        return ShareUI.showToast(title, message, type);
    }

    async updateStorageEstimate() {
        return ShareCloud.updateStorageEstimate(this);
    }

    renderFeed() {
        return ShareFeedRenderer.renderFeed(this);
    }

    blobToBase64(blob) {
        return ShareDatabase.blobToBase64(blob);
    }

    dataURLtoBlob(dataurl) {
        return ShareDatabase.dataURLtoBlob(dataurl);
    }

    async exportBackup() {
        return ShareDatabase.exportBackup(this);
    }

    async importBackup(file) {
        return ShareDatabase.importBackup(this, file);
    }

    showConfirmModal(options) {
        return ShareUI.showConfirmModal(options);
    }

    showLoadingModal(title, message) {
        return ShareUI.showLoadingModal(this, title, message);
    }

    async hideLoadingModal() {
        return ShareUI.hideLoadingModal(this);
    }
}
