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
        this.isHydrated = false; // Hydration Lock
        this.startedEmpty = false; // Flag to detect initial fresh state
    }

    load() {
        try {
            const raw = localStorage.getItem(this.storageKey);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed) {
                    this.lastSavedTimestamp = parsed.updatedAt || 0;
                    this.startedEmpty = false;
                    return parsed;
                }
            }
        } catch (e) {
            console.error('Failed to load table data from localStorage:', e);
        }
        this.startedEmpty = true;
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

            if (this.isHydrated && typeof this.onSave === 'function') {
                // Content Validation Guard
                const hasContent = data && (
                    data.title?.trim() ||
                    (data.rows && data.rows.some(r => r.some(c => c.trim() !== ''))) ||
                    (Array.isArray(data.sheets) && data.sheets.some(s => s.title?.trim() || (s.rows && s.rows.some(r => r.some(c => c.trim() !== '')))))
                );
                
                if (hasContent || data.isExplicitlyCleared) {
                    this.onSave(data);
                }
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
        this.isHydrated = true; // Mark as hydrated from cloud

        if (!cloudData) {
            // Push local data as initial seed if local exists and has content
            const hasContent = currentData && (
                currentData.title?.trim() ||
                (currentData.rows && currentData.rows.some(r => r.some(c => c.trim() !== ''))) ||
                (Array.isArray(currentData.sheets) && currentData.sheets.some(s => s.title?.trim() || (s.rows && s.rows.some(r => r.some(c => c.trim() !== '')))))
            );
            
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
        // UNLESS we started empty (so local changes are just typing on a blank grid before cloud loaded)
        if (isEditing && localTime >= cloudTime && !this.startedEmpty) {
            return null;
        }

        const localHasContent = currentData && (
            (Array.isArray(currentData.sheets) && currentData.sheets.some(s => s.title?.trim() || (s.rows && s.rows.some(r => r.some(c => c.trim() !== ''))))) ||
            currentData.title?.trim() ||
            (currentData.rows && currentData.rows.some(r => r.some(c => c.trim() !== '')))
        );

        const cloudHasContent = cloudData && (
            (Array.isArray(cloudData.sheets) && cloudData.sheets.some(s => s.title?.trim() || (s.rows && s.rows.some(r => r.some(c => c.trim() !== ''))))) ||
            cloudData.title?.trim() ||
            (cloudData.rows && cloudData.rows.some(r => r.some(c => c.trim() !== '')))
        );

        // If we started with empty local storage in this session, unconditionally accept cloud data.
        const shouldOverwriteLocal = this.startedEmpty || cloudTime > localTime || (!localHasContent && cloudHasContent);

        if (shouldOverwriteLocal) {
            this.startedEmpty = false;
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
                ...cloudData,
                title: cloudData.title || '',
                headers: cloudData.headers && cloudData.headers.length > 0 ? cloudData.headers : ['Column 1', 'Column 2', 'Column 3'],
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
