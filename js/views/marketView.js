/**
 * marketView.js - Market Center Component Template
 */
export const marketViewHtml = `
    <div id="market-panel" class="hidden flex flex-col gap-4 h-[750px]">
        <div class="flex flex-wrap gap-2 items-center glass-panel p-2 rounded-xl" id="market-assets-container">
            <span class="px-3 text-slate-400 font-mono text-sm hidden md:inline">ASSET:</span>
            <!-- Buttons injected by MarketWidgetManager -->
        </div>
        <div class="glass-panel rounded-2xl overflow-hidden border border-slate-700 flex-1 relative">
            <div id="tv-chart-container" class="w-full h-full"></div>
        </div>
    </div>
`;
