/**
 * TableStorage.js - Table Data Persistence & Cloud Synchronization
 * Handles LocalStorage operations, debounced saves, and Firestore cloud sync.
 * Adheres strictly to SRP and Clean Code standards.
 */

export class TableStorage {
    constructor(storageKey = 'assistant_quick_table_grid') {
        this.storageKey = storageKey;
        this.saveTimer = null;
        this.lastSavedTimestamp = 0;
        this.onSave = null;
    }

    load() {
        try {
            const raw = localStorage.getItem(this.storageKey);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed && Array.isArray(parsed.headers) && Array.isArray(parsed.rows)) {
                    this.lastSavedTimestamp = parsed.updatedAt || Date.now();
                    return {
                        title: parsed.title || '',
                        headers: parsed.headers.length > 0 ? parsed.headers : ['Column 1', 'Column 2', 'Column 3'],
                        rows: parsed.rows.length > 0 ? parsed.rows : [['', '', ''], ['', '', ''], ['', '', '']],
                        updatedAt: this.lastSavedTimestamp
                    };
                }
            }
        } catch (e) {
            console.error('Failed to load table data from localStorage:', e);
        }
        return null;
    }

    save(data, onStatusChange) {
        try {
            data.updatedAt = Date.now();
            this.lastSavedTimestamp = data.updatedAt;
            localStorage.setItem(this.storageKey, JSON.stringify(data));

            if (typeof onStatusChange === 'function') {
                onStatusChange('saved', data.updatedAt);
            }

            if (typeof this.onSave === 'function') {
                this.onSave(data);
            }
        } catch (e) {
            console.error('Failed to save table data to localStorage:', e);
            if (typeof onStatusChange === 'function') {
                onStatusChange('error');
            }
        }
    }

    scheduleSave(data, onStatusChange, delay = 400) {
        if (typeof onStatusChange === 'function') {
            onStatusChange('saving');
        }

        clearTimeout(this.saveTimer);
        this.saveTimer = setTimeout(() => {
            this.save(data, onStatusChange);
        }, delay);
    }

    mergeCloudData(currentData, cloudData, isEditing = false) {
        if (!cloudData) {
            // Push local data as initial seed if local exists and has content
            const hasContent = currentData.rows.some(r => r.some(c => c.trim() !== '')) || currentData.title;
            if (hasContent && typeof this.onSave === 'function') {
                this.onSave(currentData);
            }
            return null;
        }

        const cloudTime = typeof cloudData.updatedAt === 'number'
            ? cloudData.updatedAt
            : (cloudData.updatedAt ? new Date(cloudData.updatedAt).getTime() : 0);
        const localTime = this.lastSavedTimestamp || 0;

        // If user is actively editing and local changes are at least as new as cloud, do not overwrite
        if (isEditing && localTime >= cloudTime) {
            return null;
        }

        if (cloudTime > localTime && Array.isArray(cloudData.headers)) {
            let cloudRows = [];
            if (Array.isArray(cloudData.rows)) {
                cloudRows = cloudData.rows;
            } else if (typeof cloudData.rowsJson === 'string') {
                try {
                    cloudRows = JSON.parse(cloudData.rowsJson);
                } catch (e) {
                    cloudRows = [];
                }
            }

            this.lastSavedTimestamp = cloudTime;
            return {
                title: cloudData.title || '',
                headers: cloudData.headers.length > 0 ? cloudData.headers : ['Column 1', 'Column 2', 'Column 3'],
                rows: cloudRows.length > 0 ? cloudRows : [['', '', ''], ['', '', ''], ['', '', '']],
                updatedAt: cloudTime
            };
        }

        return null;
    }

    updateStatusBadge(dom, status, timestamp = null) {
        if (!dom || !dom.saveBadge) return;

        if (status === 'saving') {
            dom.saveBadge.className = 'flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400';
            dom.saveBadge.innerHTML = `
                <span class="size-1.5 rounded-full bg-amber-400 animate-ping"></span>
                <span>Saving...</span>
            `;
            return;
        }

        if (status === 'saved') {
            dom.saveBadge.className = 'flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400';
            dom.saveBadge.innerHTML = `
                <span class="size-1.5 rounded-full bg-emerald-400"></span>
                <span>Saved</span>
            `;

            if (dom.lastUpdated && timestamp) {
                const date = new Date(timestamp);
                const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                dom.lastUpdated.textContent = `Auto-saved at ${timeStr}`;
            }
            return;
        }

        if (status === 'error') {
            dom.saveBadge.className = 'flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/10 text-rose-400';
            dom.saveBadge.innerHTML = `
                <span class="size-1.5 rounded-full bg-rose-400"></span>
                <span>Sync Error</span>
            `;
            return;
        }

        // Ready state
        dom.saveBadge.className = 'flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800/60 text-slate-400';
        dom.saveBadge.innerHTML = `
            <span class="size-1.5 rounded-full bg-slate-500"></span>
            <span>Ready</span>
        `;
    }
}
