/**
 * calendarView.js - Economic Calendar & News Feed Component Template
 */
export const calendarViewHtml = `
    <div id="news-panel" class="hidden flex-col gap-4 h-[800px] animate-fade-in">
        <div class="glass-panel p-4 rounded-2xl h-full border border-slate-700 flex flex-col gap-3">
            <div class="flex items-center gap-2 border-b border-slate-800 pb-3 shrink-0">
                <span class="w-2.5 h-2.5 bg-yellow-400 rounded-full animate-pulse"></span>
                <h3 class="font-mono font-bold text-base sm:text-lg text-yellow-400 tracking-wide">ECONOMIC CALENDAR & NEWS FEED</h3>
            </div>
            <!-- TradingView Widget Container -->
            <div class="tradingview-widget-container flex-1 w-full" id="economic-calendar-container">
                <div class="tradingview-widget-container__widget w-full h-full"></div>
            </div>
        </div>
    </div>
`;
