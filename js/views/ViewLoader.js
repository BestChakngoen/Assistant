import { loginViewHtml } from './loginView.js';
import { sidebarViewHtml } from './sidebarView.js';
import { headerViewHtml } from './headerView.js';
import { tradeTrackViewHtml } from './tradeTrackView.js';
import { marketViewHtml } from './marketView.js';
import { calendarViewHtml } from './calendarView.js';
import { strategyViewHtml } from './strategyView.js';
import { healthViewHtml } from './healthView.js';
import { shareViewHtml } from './shareView.js';
import { settingsViewHtml } from './settingsView.js';

/**
 * ViewLoader - Synchronously mounts component templates into TrackerView container shell.
 */
export function initViewComponents() {
    const loginContainer = document.getElementById('login-view-mount');
    if (loginContainer) loginContainer.innerHTML = loginViewHtml;

    const sidebarContainer = document.getElementById('sidebar-view-mount');
    if (sidebarContainer) sidebarContainer.innerHTML = sidebarViewHtml;

    const headerContainer = document.getElementById('header-view-mount');
    if (headerContainer) headerContainer.innerHTML = headerViewHtml;

    const mainContainer = document.getElementById('main-view-mount');
    if (mainContainer) {
        mainContainer.innerHTML = [
            tradeTrackViewHtml,
            marketViewHtml,
            calendarViewHtml,
            strategyViewHtml,
            healthViewHtml,
            shareViewHtml,
            settingsViewHtml
        ].join('\n');
    }

    if (window.lucide) {
        window.lucide.createIcons();
    }
}
