/**
 * netWorthView.js - Net Worth Tracker Component Template (100% English)
 */
export const netWorthViewHtml = `
    <!-- NET WORTH PANEL -->
    <div id="networth-panel" class="hidden flex-1 flex-col space-y-6">
        <!-- HEADER / TITLE -->
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800/80">
            <div>
                <h2 class="text-xl font-mono font-bold text-white flex items-center gap-2">
                    <i data-lucide="wallet" class="w-6 h-6 text-emerald-400"></i>
                    <span>NET WORTH TRACKER</span>
                </h2>
                <p class="text-xs text-slate-400 font-mono mt-1">Track your total assets, liabilities, and overall financial net worth</p>
            </div>
            <div class="flex items-center gap-3">
                <span id="nw-cloud-status" class="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-3 py-1.5 rounded-xl border border-cyan-500/20 font-bold flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                    <span>SUPABASE CONNECTED</span>
                </span>
            </div>
        </div>

        <!-- WEEKLY UPDATE ALERT BANNER CONTAINER -->
        <div id="nw-weekly-alert-container"></div>

        <!-- SUMMARY STATS CARDS -->
        <div class="flex flex-col gap-4">
            <!-- Net Worth (Top Hero Card - Centered, No Icon) -->
            <div class="glass-panel p-6 sm:p-8 rounded-2xl border-0 bg-gradient-to-r from-cyan-950/40 via-slate-900/80 to-cyan-950/40 flex flex-col items-center justify-center text-center shadow-xl shadow-cyan-500/10 relative">
                <!-- Currency Toggle Button at Top-Right -->
                <div class="absolute top-3 right-3 sm:top-4 sm:right-4">
                    <button id="nw-currency-toggle" title="Toggle Currency (THB / USD)" class="flex items-center gap-1.5 bg-slate-900/80 hover:bg-slate-800/90 px-3 py-1 rounded-xl text-[10px] font-mono font-bold transition cursor-pointer select-none">
                        <span id="nw-curr-thb" class="text-cyan-400 font-extrabold">THB</span>
                        <span class="text-slate-600 font-normal">|</span>
                        <span id="nw-curr-usd" class="text-slate-400">USD</span>
                    </button>
                </div>
                <p class="text-xs sm:text-sm text-slate-400 font-mono uppercase tracking-widest font-bold">TOTAL NET WORTH</p>
                <h3 id="nw-net-worth" class="text-2xl sm:text-4xl font-mono font-bold text-cyan-400 mt-2">฿0</h3>
            </div>

            <!-- Assets & Liabilities Side-by-Side (Centered, No Icons) -->
            <div class="grid grid-cols-2 gap-3 sm:gap-4">
                <!-- Total Assets -->
                <div class="glass-panel p-4 sm:p-5 rounded-2xl border-0 flex flex-col items-center justify-center text-center">
                    <p class="text-[10px] sm:text-xs text-slate-400 font-mono uppercase tracking-wider font-bold">Total Assets</p>
                    <h3 id="nw-total-assets" class="text-lg sm:text-2xl font-mono font-bold text-emerald-400 mt-2">฿0</h3>
                    <span class="text-[9px] sm:text-[10px] text-slate-500 font-mono mt-1 hidden xs:block">Cash, Bank, Investments & Properties</span>
                </div>

                <!-- Total Liabilities -->
                <div class="glass-panel p-4 sm:p-5 rounded-2xl border-0 flex flex-col items-center justify-center text-center">
                    <p class="text-[10px] sm:text-xs text-slate-400 font-mono uppercase tracking-wider font-bold">Total Liabilities</p>
                    <h3 id="nw-total-liabilities" class="text-lg sm:text-2xl font-mono font-bold text-red-400 mt-2">฿0</h3>
                    <span class="text-[9px] sm:text-[10px] text-slate-500 font-mono mt-1 hidden xs:block">Debts, Credit Cards & Loans</span>
                </div>
            </div>
        </div>

        <!-- MAIN FORM & TABLE GRID -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- INPUT FORM -->
            <div class="lg:col-span-1 glass-panel p-6 rounded-2xl border-0 flex flex-col gap-4">
                <h3 class="font-mono font-bold text-sm text-emerald-400 flex items-center gap-2">
                    <i data-lucide="plus-circle" class="w-4 h-4"></i>
                    <span>ADD ASSET / LIABILITY</span>
                </h3>

                <!-- ITEM NAME -->
                <div>
                    <label class="block text-xs font-mono text-slate-400 mb-1">ITEM NAME</label>
                    <input type="text" id="nw-input-name" placeholder="e.g. Savings Account, Apple Stock, Car Loan"
                        class="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-slate-200 text-xs font-mono focus:border-emerald-500 focus:outline-none">
                </div>

                <!-- CATEGORY & TYPE -->
                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="block text-xs font-mono text-slate-400 mb-1">TYPE</label>
                        <select id="nw-input-type" class="w-full px-3 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-slate-200 text-xs font-mono focus:border-emerald-500 focus:outline-none">
                            <option value="ASSET" class="text-emerald-400">ASSET</option>
                            <option value="LIABILITY" class="text-red-400">LIABILITY</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-xs font-mono text-slate-400 mb-1">CATEGORY</label>
                        <select id="nw-input-category" class="w-full px-3 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-slate-200 text-xs font-mono focus:border-emerald-500 focus:outline-none">
                            <option value="Cash & Bank">Cash & Bank</option>
                            <option value="Investments">Investments</option>
                            <option value="Real Estate & Vehicle">Real Estate & Vehicle</option>
                            <option value="Valuables & Crypto">Valuables & Crypto</option>
                            <option value="Credit & Debt">Credit & Debt</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                </div>

                <!-- VALUE -->
                <div>
                    <label id="nw-label-amount" class="block text-xs font-mono text-slate-400 mb-1">AMOUNT (VALUE)</label>
                    <input type="number" id="nw-input-amount" placeholder="0.00" min="0" step="0.01"
                        class="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-emerald-400 text-sm font-mono font-bold focus:border-emerald-500 focus:outline-none">
                </div>

                <!-- CONFIRM BUTTON -->
                <button id="nw-btn-add"
                    class="w-full mt-2 btn-press bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-bold font-mono shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 text-xs">
                    <i data-lucide="check" class="w-4 h-4"></i>
                    <span>ADD TO PORTFOLIO</span>
                </button>
            </div>

            <!-- ASSET / LIABILITY RECORDS LIST TABLE -->
            <div class="lg:col-span-2 glass-panel p-6 rounded-2xl border-0 flex flex-col justify-between">
                <div>
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="font-mono font-bold text-sm text-slate-300 flex items-center gap-2">
                            <i data-lucide="list" class="w-4 h-4 text-cyan-400"></i>
                            <span>PORTFOLIO ASSETS & LIABILITIES</span>
                        </h3>
                        <div class="flex gap-2">
                            <button id="nw-filter-all" class="px-2.5 py-1 text-[10px] font-mono font-bold rounded-lg bg-cyan-500/20 text-cyan-400">ALL</button>
                            <button id="nw-filter-asset" class="px-2.5 py-1 text-[10px] font-mono font-bold rounded-lg bg-slate-800 text-slate-400 hover:text-emerald-400 transition">ASSETS</button>
                            <button id="nw-filter-liability" class="px-2.5 py-1 text-[10px] font-mono font-bold rounded-lg bg-slate-800 text-slate-400 hover:text-red-400 transition">LIABILITIES</button>
                        </div>
                    </div>

                    <!-- RECORD ITEMS CONTAINER -->
                    <div id="nw-items-list" class="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                        <div class="text-center text-slate-500 py-12 text-xs font-mono">No financial items recorded yet.</div>
                    </div>
                </div>

                <div class="border-t border-slate-800/80 pt-3 mt-4 flex justify-between items-center text-xs font-mono text-slate-500">
                    <span id="nw-items-count">0 items registered</span>
                    <button id="nw-btn-clear-all" class="text-slate-500 hover:text-red-400 transition text-[10px]">Clear All Records</button>
                </div>
            </div>
        </div>

        <!-- CHARTS SECTION: 2 PIE CHARTS (ASSETS & LIABILITIES BY CATEGORY) & 52-WEEK HISTORY CHART -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- ASSETS BY CATEGORY PIE CHART -->
            <div class="glass-panel p-6 rounded-2xl border-0 flex flex-col items-center justify-between">
                <div class="w-full flex items-center justify-between mb-2">
                    <h3 class="font-mono font-bold text-xs text-slate-300 flex items-center gap-2">
                        <i data-lucide="pie-chart" class="w-4 h-4 text-emerald-400"></i>
                        <span>ASSETS BY CATEGORY</span>
                    </h3>
                </div>
                <div class="relative w-full h-[220px] flex items-center justify-center">
                    <canvas id="nwAssetPieChart"></canvas>
                </div>
            </div>

            <!-- LIABILITIES BY CATEGORY PIE CHART -->
            <div class="glass-panel p-6 rounded-2xl border-0 flex flex-col items-center justify-between">
                <div class="w-full flex items-center justify-between mb-2">
                    <h3 class="font-mono font-bold text-xs text-slate-300 flex items-center gap-2">
                        <i data-lucide="pie-chart" class="w-4 h-4 text-red-400"></i>
                        <span>LIABILITIES BY CATEGORY</span>
                    </h3>
                </div>
                <div class="relative w-full h-[220px] flex items-center justify-center">
                    <canvas id="nwLiabilityPieChart"></canvas>
                </div>
            </div>

            <!-- 52-WEEK NET WORTH HISTORY LINE CHART -->
            <div class="glass-panel p-6 rounded-2xl border-0 flex flex-col justify-between">
                <div class="w-full flex items-center justify-between mb-2">
                    <h3 class="font-mono font-bold text-xs text-slate-300 flex items-center gap-2">
                        <i data-lucide="trending-up" class="w-4 h-4 text-cyan-400"></i>
                        <span>52-WEEK HISTORY</span>
                    </h3>
                    <span class="text-[10px] font-mono text-slate-500">Weekly Snapshots</span>
                </div>
                <div class="relative w-full h-[220px]">
                    <canvas id="nwHistoryChart" class="w-full h-full"></canvas>
                </div>
            </div>
        </div>
    </div>
`;
