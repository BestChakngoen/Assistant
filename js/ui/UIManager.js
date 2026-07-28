// --- FILE 4: UI MANAGER ---
import { DiagramManager } from './DiagramManager.js';
import { ShareManager } from './ShareManager.js';
import { UIChartEngine } from './uimanager/UIChartEngine.js';
import { UIStatsCalculator } from './uimanager/UIStatsCalculator.js';
import { UIHistoryRenderer } from './uimanager/UIHistoryRenderer.js';
import { UIStrategyLab } from './uimanager/UIStrategyLab.js';
import { UINavigation } from './uimanager/UINavigation.js';

/**
 * UIManager - Main User Interface Coordinator
 * Refactored under OOP & SOLID principles:
 * Delegates Chart engine, Trade Statistics, History rendering, Strategy Lab, and Navigation to specialized sub-modules.
 */
export class UIManager {
    constructor() {
        this.dom = {
            loginScreen: document.getElementById('login-screen'),
            appContent: document.getElementById('app-content'),
            displayName: document.getElementById('user-display-name'),
            errorBox: document.getElementById('auth-error-box'),
            domainDisplay: document.getElementById('domain-display'),
            loginStatus: document.getElementById('login-status'),
            panels: {
                journal: document.getElementById('journal-panel'),
                market: document.getElementById('market-panel'),
                news: document.getElementById('news-panel')
            },
            inputs: {
                date: document.getElementById('input-date'),
                asset: document.getElementById('input-asset'),
                type: document.getElementById('input-type'),
                amount: document.getElementById('input-amount')
            },
            displays: {
                thb: document.getElementById('thb-rate')
            },
            list: document.getElementById('history-list'),
            notes: {
                title: document.getElementById('note-title'),
                list: document.getElementById('note-list'),
                input: document.getElementById('note-input'),
                btnAdd: document.getElementById('btn-add-note'),
                btnSave: document.getElementById('btn-save-note')
            },
            chartControls: {
                prev: document.getElementById('chart-prev'),
                next: document.getElementById('chart-next')
            },
            historyTabs: {
                trades: document.getElementById('hist-tab-trades'),
                transfers: document.getElementById('hist-tab-transfers')
            }
        };
        this.chart = null;
        this.tradesChart = null;
        this.periodStatsEl = null;

        this.chartState = {
            pageIndex: 0,
            limit: 7,
            data: null
        };

        this.historyState = {
            filter: 'TRADES',
            data: [],
            onDelete: null
        };

        this.initChart();
        this.initTradesChart();
        this.initChartControls();
        this.initHistoryTabs();
        this.initStrategyLab();
        this.setTheme('cyberpunk');

        this.share = new ShareManager();
        this.share.init();
    }

    initChart() {
        return UIChartEngine.initChart(this);
    }

    initTradesChart() {
        return UIChartEngine.initTradesChart(this);
    }

    initChartControls() {
        return UIChartEngine.initChartControls(this);
    }

    shiftChart(delta) {
        return UIChartEngine.shiftChart(this, delta);
    }

    initHistoryTabs() {
        return UIHistoryRenderer.initHistoryTabs(this);
    }

    setHistoryFilter(filter) {
        return UIHistoryRenderer.setHistoryFilter(this, filter);
    }

    showLogin(show) {
        return UINavigation.showLogin(this, show);
    }

    showAuthError(isDomainError) {
        return UINavigation.showAuthError(this, isDomainError);
    }

    updatePriceDisplay(price) {
        return UIStatsCalculator.updatePriceDisplay(price);
    }

    updateTHB(rate) {
        return UIStatsCalculator.updateTHB(this, rate);
    }

    renderTradeList(trades, onDelete) {
        return UIHistoryRenderer.renderTradeList(this, trades, onDelete);
    }

    renderInternalHistoryList() {
        return UIHistoryRenderer.renderInternalHistoryList(this);
    }

    renderNotes(data, onDeleteItem) {
        return UIHistoryRenderer.renderNotes(this, data, onDeleteItem);
    }

    updateStats(trades) {
        return UIStatsCalculator.updateStats(this, trades);
    }

    renderChart() {
        return UIChartEngine.renderChart(this);
    }

    updateCloudStats(meta) {
        return UIStatsCalculator.updateCloudStats(meta);
    }

    setTheme(theme) {
        const body = document.body;
        if (theme === 'minimalist') {
            body.classList.remove('theme-cyberpunk');
            body.classList.add('theme-minimalist');
        } else {
            body.classList.remove('theme-minimalist');
            body.classList.add('theme-cyberpunk');
        }
        return UINavigation.setTheme(this, theme);
    }

    switchTab(tabName) {
        return UINavigation.switchTab(this, tabName);
    }

    toggleInputStyle() {
        return UINavigation.toggleInputStyle(this);
    }

    switchMainMenu(menuName) {
        return UINavigation.switchMainMenu(this, menuName);
    }

    initStrategyLab() {
        return UIStrategyLab.initStrategyLab(this);
    }

    initPdfViewer() {
        return UIStrategyLab.initPdfViewer();
    }

    updateStrategyLabTime() {
        return UIStrategyLab.updateStrategyLabTime();
    }
}