import { loginViewHtml } from './loginView.js';
import { sidebarViewHtml } from './sidebarView.js';
import { headerViewHtml } from './headerView.js';
import { tradeTrackViewHtml } from '../trade/tradeTrackView.js';
import { marketViewHtml } from '../market/marketView.js';
import { calendarViewHtml } from '../wiki/calendarView.js';
import { strategyViewHtml } from '../strategy/strategyView.js';
import { healthViewHtml } from '../health/healthView.js';
import { netWorthViewHtml } from '../networth/netWorthView.js';
import { shareViewHtml } from '../share/shareView.js';
import { gameViewHtml } from '../game/gameView.js';
import { settingsViewHtml } from '../settings/settingsView.js';
import { toolsViewHtml } from '../tools/toolsView.js';
import { airQualityViewHtml } from '../air/airQualityView.js';
import { notificationViewHtml } from '../notifications/notificationView.js';

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
            airQualityViewHtml,
            netWorthViewHtml,
            shareViewHtml,
            toolsViewHtml,
            notificationViewHtml,
            gameViewHtml,
            settingsViewHtml
        ].join('\n');
    }

    if (window.lucide) {
        window.lucide.createIcons();
    }
}
