/**
 * NetWorthPortfolioService.js - Custom Sub-Portfolios & Grouping Engine
 * Solid OOP, Single Responsibility, No God Object.
 */
export class NetWorthPortfolioService {
    static STORAGE_KEY_PORTFOLIOS = 'tradetracker_networth_custom_portfolios_v1';
    static STORAGE_KEY_COLLAPSED = 'tradetracker_networth_collapsed_portfolios_v1';
    static DEFAULT_PORTFOLIO = 'Main Portfolio';

    /**
     * Get unique list of portfolios.
     * @param {Object} manager - NetWorthManager instance
     * @returns {string[]}
     */
    static getPortfolios(manager) {
        let customList = [];
        try {
            const raw = localStorage.getItem(this.STORAGE_KEY_PORTFOLIOS);
            if (raw) customList = JSON.parse(raw);
        } catch (_) {}

        if (!Array.isArray(customList) || customList.length === 0) {
            customList = [this.DEFAULT_PORTFOLIO];
        }

        const set = new Set(customList);
        set.add(this.DEFAULT_PORTFOLIO);

        // Include any portfolio defined on existing items
        if (manager && Array.isArray(manager.items)) {
            manager.items.forEach(item => {
                if (item && item.portfolio && typeof item.portfolio === 'string' && item.portfolio.trim()) {
                    set.add(item.portfolio.trim());
                }
            });
        }

        const all = Array.from(set);
        return [
            this.DEFAULT_PORTFOLIO,
            ...all.filter(p => p !== this.DEFAULT_PORTFOLIO).sort((a, b) => a.localeCompare(b))
        ];
    }

    /**
     * Overwrite / synchronize portfolio list from cloud.
     * @param {Object} manager 
     * @param {string[]} portfolioList 
     */
    static setPortfolios(manager, portfolioList) {
        if (!Array.isArray(portfolioList)) return;
        const set = new Set(portfolioList.filter(p => typeof p === 'string' && p.trim()));
        set.add(this.DEFAULT_PORTFOLIO);

        // Include any portfolio defined on existing items
        if (manager && Array.isArray(manager.items)) {
            manager.items.forEach(item => {
                if (item && item.portfolio && typeof item.portfolio === 'string' && item.portfolio.trim()) {
                    set.add(item.portfolio.trim());
                }
            });
        }

        const all = Array.from(set);
        const sorted = [
            this.DEFAULT_PORTFOLIO,
            ...all.filter(p => p !== this.DEFAULT_PORTFOLIO).sort((a, b) => a.localeCompare(b))
        ];

        try {
            localStorage.setItem(this.STORAGE_KEY_PORTFOLIOS, JSON.stringify(sorted));
        } catch (_) {}
    }

    /**
     * Add a new custom portfolio.
     * @param {Object} manager - NetWorthManager instance
     * @param {string} name - Name of new portfolio
     * @returns {boolean}
     */
    static addPortfolio(manager, name) {
        if (!name || !name.trim()) return false;
        const cleanName = name.trim();
        const list = this.getPortfolios(manager);
        if (!list.includes(cleanName)) {
            list.push(cleanName);
            try {
                localStorage.setItem(this.STORAGE_KEY_PORTFOLIOS, JSON.stringify(list));
            } catch (_) {}
            if (manager && typeof manager.saveData === 'function') {
                manager.saveData();
            }
            return true;
        }
        return false;
    }

    /**
     * Delete a portfolio, moving its items back to 'Main Portfolio'.
     * @param {Object} manager - NetWorthManager instance
     * @param {string} name - Name of portfolio to delete
     */
    static deletePortfolio(manager, name) {
        if (!name || name === this.DEFAULT_PORTFOLIO) return false;

        // Move all items in this portfolio to Main Portfolio
        if (manager && Array.isArray(manager.items)) {
            manager.items.forEach(item => {
                if (item.portfolio === name) {
                    item.portfolio = this.DEFAULT_PORTFOLIO;
                }
            });
        }

        // Remove from custom list
        let list = this.getPortfolios(manager).filter(p => p !== name);
        try {
            localStorage.setItem(this.STORAGE_KEY_PORTFOLIOS, JSON.stringify(list));
            this.removeCollapsed(name);
        } catch (_) {}

        if (manager && typeof manager.saveData === 'function') {
            manager.saveData();
        }
        return true;
    }

    /**
     * Check if a portfolio accordion is collapsed.
     * @param {string} name 
     * @returns {boolean}
     */
    static isCollapsed(name) {
        try {
            const raw = localStorage.getItem(this.STORAGE_KEY_COLLAPSED);
            if (raw) {
                const collapsed = JSON.parse(raw);
                return Array.isArray(collapsed) && collapsed.includes(name);
            }
        } catch (_) {}
        return false;
    }

    /**
     * Toggle collapse state of a portfolio.
     * @param {string} name 
     * @returns {boolean} - true if now collapsed, false if expanded
     */
    static toggleCollapsed(name) {
        try {
            const raw = localStorage.getItem(this.STORAGE_KEY_COLLAPSED);
            let collapsed = raw ? JSON.parse(raw) : [];
            if (!Array.isArray(collapsed)) collapsed = [];

            let isNowCollapsed = false;
            if (collapsed.includes(name)) {
                collapsed = collapsed.filter(p => p !== name);
                isNowCollapsed = false;
            } else {
                collapsed.push(name);
                isNowCollapsed = true;
            }
            localStorage.setItem(this.STORAGE_KEY_COLLAPSED, JSON.stringify(collapsed));
            return isNowCollapsed;
        } catch (_) {
            return false;
        }
    }

    static removeCollapsed(name) {
        try {
            const raw = localStorage.getItem(this.STORAGE_KEY_COLLAPSED);
            let collapsed = raw ? JSON.parse(raw) : [];
            if (Array.isArray(collapsed) && collapsed.includes(name)) {
                collapsed = collapsed.filter(p => p !== name);
                localStorage.setItem(this.STORAGE_KEY_COLLAPSED, JSON.stringify(collapsed));
            }
        } catch (_) {}
    }

    /**
     * Set collapsed state explicitly.
     * @param {string} name 
     * @param {boolean} collapsed 
     */
    static setCollapsed(name, collapsed = false) {
        try {
            const raw = localStorage.getItem(this.STORAGE_KEY_COLLAPSED);
            let list = raw ? JSON.parse(raw) : [];
            if (!Array.isArray(list)) list = [];
            if (collapsed) {
                if (!list.includes(name)) list.push(name);
            } else {
                list = list.filter(p => p !== name);
            }
            localStorage.setItem(this.STORAGE_KEY_COLLAPSED, JSON.stringify(list));
        } catch (_) {}
    }

    /**
     * Move an item directly to a new portfolio with optional insertion slot.
     * @param {Object} manager - NetWorthManager instance
     * @param {string} itemId - ID of item to move
     * @param {string} targetPortfolio - Target portfolio name
     * @param {Object|number|null} targetSlot - { beforeItemId, afterItemId } or index
     * @returns {boolean}
     */
    static moveItemToPortfolio(manager, itemId, targetPortfolio, targetSlot = null) {
        if (!manager || !Array.isArray(manager.items) || !itemId || !targetPortfolio) return false;
        const itemIdx = manager.items.findIndex(i => i.id === itemId);
        if (itemIdx === -1) return false;
        const [item] = manager.items.splice(itemIdx, 1);
        item.portfolio = targetPortfolio;
        item.updatedAt = new Date().toISOString();

        if (targetSlot && typeof targetSlot === 'object') {
            const { beforeItemId, afterItemId } = targetSlot;
            if (beforeItemId) {
                const bIdx = manager.items.findIndex(i => i.id === beforeItemId);
                if (bIdx !== -1) {
                    manager.items.splice(bIdx, 0, item);
                } else {
                    this._appendAfterTargetGroup(manager, item, targetPortfolio);
                }
            } else if (afterItemId) {
                const aIdx = manager.items.findIndex(i => i.id === afterItemId);
                if (aIdx !== -1) {
                    manager.items.splice(aIdx + 1, 0, item);
                } else {
                    this._appendAfterTargetGroup(manager, item, targetPortfolio);
                }
            } else {
                this._appendAfterTargetGroup(manager, item, targetPortfolio);
            }
        } else if (typeof targetSlot === 'number' && targetSlot >= 0) {
            const targetItems = manager.items.filter(i => (i.portfolio || this.DEFAULT_PORTFOLIO) === targetPortfolio);
            if (targetSlot < targetItems.length) {
                const beforeItem = targetItems[targetSlot];
                const realIdx = manager.items.indexOf(beforeItem);
                if (realIdx !== -1) {
                    manager.items.splice(realIdx, 0, item);
                } else {
                    this._appendAfterTargetGroup(manager, item, targetPortfolio);
                }
            } else {
                this._appendAfterTargetGroup(manager, item, targetPortfolio);
            }
        } else {
            this._appendAfterTargetGroup(manager, item, targetPortfolio);
        }

        this.setCollapsed(targetPortfolio, false); // Auto-expand target so user sees moved item
        return true;
    }

    static _appendAfterTargetGroup(manager, item, targetPortfolio) {
        const targetItems = manager.items.filter(i => (i.portfolio || this.DEFAULT_PORTFOLIO) === targetPortfolio);
        if (targetItems.length > 0) {
            const lastItem = targetItems[targetItems.length - 1];
            const realIdx = manager.items.indexOf(lastItem);
            if (realIdx !== -1) {
                manager.items.splice(realIdx + 1, 0, item);
                return;
            }
        }
        manager.items.push(item);
    }

    /**
     * Calculate metrics for a specific portfolio group.
     * @param {Object} manager 
     * @param {Array} items 
     * @returns {Object}
     */
    static calculatePortfolioMetrics(manager, items = []) {
        let subtotalAssets = 0;
        let subtotalLiabilities = 0;
        let subtotalCost = 0;
        let subtotalPnl = 0;
        let hasVolatile = false;

        const rate = manager.exchangeRate > 0 ? manager.exchangeRate : 35.5;

        items.forEach(item => {
            const convertedAmt = manager.getItemConvertedAmount(item);
            if (item.type === 'ASSET') subtotalAssets += convertedAmt;
            else if (item.type === 'LIABILITY') subtotalLiabilities += convertedAmt;

            if (item.isVolatile && item.symbol) {
                hasVolatile = true;
                const costRaw = (parseFloat(item.quantity) || 0) * (parseFloat(item.avgCost) || 0);
                const pnlRaw = parseFloat(item.unrealizedPnl) || 0;

                if (manager.currency === 'USD') {
                    subtotalCost += costRaw;
                    subtotalPnl += pnlRaw;
                } else {
                    subtotalCost += (costRaw * rate);
                    subtotalPnl += (item.unrealizedPnlThb || (pnlRaw * rate));
                }
            }
        });

        const subtotalNet = subtotalAssets - subtotalLiabilities;
        const pnlPercent = subtotalCost > 0 ? (subtotalPnl / subtotalCost) * 100 : 0;

        return {
            subtotalAssets,
            subtotalLiabilities,
            subtotalNet,
            subtotalCost,
            subtotalPnl,
            pnlPercent,
            hasVolatile,
            itemCount: items.length
        };
    }
}
