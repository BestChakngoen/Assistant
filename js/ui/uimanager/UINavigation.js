import { ShareFeedRenderer } from '../share/ShareFeedRenderer.js';

export class UINavigation {
    static showLogin(uiManager, show) {
        if (show) {
            if (uiManager.dom.loginScreen) uiManager.dom.loginScreen.classList.remove('hidden');
            if (uiManager.dom.appContent) {
                uiManager.dom.appContent.classList.add('hidden');
                uiManager.dom.appContent.classList.remove('flex');
            }
        } else {
            if (uiManager.dom.loginScreen) uiManager.dom.loginScreen.classList.add('hidden');
            if (uiManager.dom.appContent) {
                uiManager.dom.appContent.classList.remove('hidden');
                uiManager.dom.appContent.classList.add('flex');
            }
        }
    }

    static showAuthError(uiManager, isDomainError) {
        if (isDomainError) {
            if (uiManager.dom.errorBox) uiManager.dom.errorBox.classList.remove('hidden');
            if (uiManager.dom.domainDisplay) uiManager.dom.domainDisplay.innerText = window.location.hostname;
            if (uiManager.dom.loginStatus) uiManager.dom.loginStatus.innerText = "";
        } else {
            if (uiManager.dom.loginStatus) {
                uiManager.dom.loginStatus.innerText = "ACCESS DENIED";
                uiManager.dom.loginStatus.classList.add('text-red-500');
            }
        }
    }

    static setTheme(uiManager, theme) {
        const body = document.body;
        if (theme === 'minimalist') {
            body.classList.remove('theme-cyberpunk');
            body.classList.add('theme-minimalist');
        } else {
            body.classList.remove('theme-minimalist');
            body.classList.add('theme-cyberpunk');
        }
    }

    static switchTab(uiManager, tabName) {
        if (window.shareManager) {
            ShareFeedRenderer.exitEditMode(window.shareManager);
        }

        const panels = {
            code: document.getElementById('journal-panel'),
            issues: document.getElementById('strategy-menu-container'),
            pulls: document.getElementById('health-menu-container'),
            actions: document.getElementById('market-panel'),
            wiki: document.getElementById('news-panel'),
            share: document.getElementById('share-panel'),
            networth: document.getElementById('networth-panel'),
            game: document.getElementById('game-panel'),
            settings: document.getElementById('settings-panel')
        };
        
        const tabs = {
            code: document.getElementById('tab-code'),
            issues: document.getElementById('tab-issues'),
            pulls: document.getElementById('tab-pulls'),
            actions: document.getElementById('tab-actions'),
            wiki: document.getElementById('tab-wiki'),
            share: document.getElementById('tab-share'),
            networth: document.getElementById('tab-networth'),
            game: document.getElementById('tab-game'),
            settings: document.getElementById('tab-settings')
        };

        Object.keys(panels).forEach(key => {
            const panel = panels[key];
            const tab = tabs[key];
            if (!panel || !tab) return;

            if (key === tabName) {
                panel.classList.remove('hidden');
                if (key === 'code' || key === 'wiki' || key === 'settings' || key === 'share' || key === 'networth' || key === 'game') {
                    panel.classList.add('flex');
                } else if (key === 'pulls' || key === 'issues') {
                    panel.classList.add('flex', 'flex-col');
                }
                
                tab.classList.remove('border-transparent', 'text-slate-400', 'hover:text-slate-200', 'hover:bg-slate-800/30');
                tab.classList.add('border-cyan-500', 'bg-cyan-500/10', 'text-cyan-400', 'font-bold');
                
                if (key === 'issues') {
                    uiManager.updateStrategyLabTime();
                }
            } else {
                panel.classList.add('hidden');
                if (key === 'code' || key === 'wiki' || key === 'settings' || key === 'share' || key === 'networth' || key === 'game') {
                    panel.classList.remove('flex');
                } else if (key === 'pulls' || key === 'issues') {
                    panel.classList.remove('flex', 'flex-col');
                }
                
                tab.classList.remove('border-cyan-500', 'bg-cyan-500/10', 'text-cyan-400', 'font-bold');
                tab.classList.add('border-transparent', 'text-slate-400', 'hover:text-slate-200', 'hover:bg-slate-800/30');
            }
        });
    }

    static toggleInputStyle(uiManager) {
        if (!uiManager.dom.inputs.type || !uiManager.dom.inputs.amount || !uiManager.dom.inputs.asset) return;

        const type = uiManager.dom.inputs.type.value;
        const amt = uiManager.dom.inputs.amount;
        const asset = uiManager.dom.inputs.asset;

        if (type === 'WIN') amt.className = "w-full px-3 py-2 rounded-lg font-mono text-green-400 font-bold";
        else if (type === 'LOSS') amt.className = "w-full px-3 py-2 rounded-lg font-mono text-red-400 font-bold";
        else if (type === 'DEPOSIT') amt.className = "w-full px-3 py-2 rounded-lg font-mono text-blue-400 font-bold";
        else if (type === 'WITHDRAW') amt.className = "w-full px-3 py-2 rounded-lg font-mono text-orange-400 font-bold";

        if (type === 'DEPOSIT' || type === 'WITHDRAW') {
            asset.disabled = true;
            asset.classList.add('opacity-50', 'cursor-not-allowed');
        } else {
            asset.disabled = false;
            asset.classList.remove('opacity-50', 'cursor-not-allowed');
        }
    }

    static switchMainMenu(uiManager, menuName) {
        if (menuName === 'dashboard') this.switchTab(uiManager, 'code');
        else if (menuName === 'strategy') this.switchTab(uiManager, 'issues');
        else if (menuName === 'health') this.switchTab(uiManager, 'pulls');
    }
}
