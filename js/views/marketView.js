/**
 * marketView.js - Market Center Component Template
 */
export const marketViewHtml = `
    <div id="market-panel" class="hidden flex flex-col gap-6 pb-20">
        <!-- SCREEN 1: Full-height viewport containing Toolbar and Chart (Fills 100% of window down to exact pixel) -->
        <div id="market-chart-section" style="height: calc(100vh - 112px); min-height: calc(100vh - 112px);" class="h-[calc(100vh-96px)] md:h-[calc(100vh-112px)] min-h-[calc(100vh-96px)] md:min-h-[calc(100vh-112px)] flex flex-col gap-3 shrink-0">
            <!-- Asset Slide Bar Toolbar -->
            <div class="flex items-center gap-2 shrink-0">
                <div class="flex-1 min-w-0 flex items-center gap-2 glass-panel p-2.5 rounded-xl custom-slide-bar whitespace-nowrap" id="market-assets-container">
                    <span class="px-3 text-slate-400 font-mono text-xs uppercase tracking-wider hidden md:inline shrink-0 font-bold">ASSET:</span>
                    <!-- Buttons injected by MarketWidgetManager -->
                </div>
                <button onclick="window.toggleChartFullscreen && window.toggleChartFullscreen()" title="ขยายกราฟเต็มจอ (Fullscreen)" class="btn-press hidden sm:flex items-center gap-1.5 px-3 py-2.5 rounded-xl glass-panel bg-slate-900/60 hover:bg-slate-800 text-slate-300 hover:text-cyan-400 border border-slate-800 text-xs font-mono shrink-0 transition-all">
                    <i data-lucide="maximize" class="w-3.5 h-3.5"></i>
                    <span class="font-bold">FULLSCREEN</span>
                </button>
                <button onclick="document.getElementById('market-asset-info-section')?.scrollIntoView({ behavior: 'smooth' })" title="เลื่อนลงดูข้อมูลสินทรัพย์" class="btn-press hidden sm:flex items-center gap-1.5 px-3 py-2.5 rounded-xl glass-panel bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-mono shrink-0 transition-all shadow-[0_0_10px_rgba(6,182,212,0.1)]">
                    <i data-lucide="book-open" class="w-3.5 h-3.5"></i>
                    <span class="font-bold">INTEL</span>
                    <i data-lucide="arrow-down" class="w-3 h-3"></i>
                </button>
            </div>

            <!-- Live TradingView Chart Container (Expands to 100% of remaining screen height) -->
            <div id="tv-chart-wrapper" class="glass-panel rounded-2xl overflow-hidden border border-slate-800 flex-1 min-h-0 relative w-full">
                <div id="tv-chart-container" style="width: 100%; height: 100%; min-height: 100%;" class="w-full h-full"></div>
            </div>
        </div>

        <!-- SCREEN 2: PUSHED COMPLETELY BELOW THE FOLD (ต้องเลื่อน Scroll ลงมาเท่านั้นถึงจะเห็น) -->
        <div id="market-asset-info-section" class="flex flex-col gap-4 pt-4 shrink-0">
            <!-- Scroll Indicator Divider -->
            <div class="flex items-center justify-center gap-2 text-slate-500 hover:text-cyan-400 transition-colors py-2 cursor-pointer select-none" onclick="document.getElementById('market-asset-info-card')?.scrollIntoView({ behavior: 'smooth' })">
                <i data-lucide="chevron-down" class="w-4 h-4 animate-bounce text-cyan-400"></i>
                <span class="font-mono text-xs tracking-wider">เลื่อนลงเพื่อดูข้อมูลเชิงลึกและบทวิเคราะห์สินทรัพย์ (Asset Intel & Knowledge)</span>
                <i data-lucide="chevron-down" class="w-4 h-4 animate-bounce text-cyan-400"></i>
            </div>

            <!-- Dynamic Asset Knowledge Intel Card -->
            <div id="market-asset-info-card" class="glass-panel p-6 rounded-2xl border border-slate-800 transition-all duration-300 shrink-0">
                <!-- Dynamically populated by MarketWidgetManager -->
            </div>
        </div>
    </div>
`;
