/**
 * netWorthView.js - Net Worth Tracker Component Template (100% English)
 */
export const netWorthViewHtml = `
    <!-- NET WORTH PANEL -->
    <div id="networth-panel" class="hidden flex-1 flex-col space-y-6">
        <!-- HEADER / TITLE -->
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/60 p-5 rounded-2xl border-0">
            <div>
                <h2 class="text-xl font-mono font-bold text-white flex items-center gap-2">
                    <i data-lucide="wallet" class="w-6 h-6 text-emerald-400"></i>
                    <span>NET WORTH TRACKER</span>
                </h2>
            </div>
            <div class="flex items-center gap-3">
                <span id="nw-cloud-status" class="text-xs font-mono text-green-400 bg-green-500/10 px-3 py-1.5 rounded-xl border-0 font-bold flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                    <span>CLOUD SYNC ACTIVE</span>
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
                <h3 id="nw-net-worth" class="text-2xl sm:text-4xl font-mono font-bold text-cyan-400 mt-2 tabular-nums">฿0</h3>
            </div>

            <!-- Assets & Liabilities Side-by-Side (Centered, No Icons) -->
            <div class="grid grid-cols-2 gap-3 sm:gap-4">
                <!-- Total Assets -->
                <div class="glass-panel p-4 sm:p-5 rounded-2xl border-0 flex flex-col items-center justify-center text-center">
                    <p class="text-[10px] sm:text-xs text-slate-400 font-mono uppercase tracking-wider font-bold">Total Assets</p>
                    <h3 id="nw-total-assets" class="text-lg sm:text-2xl font-mono font-bold text-emerald-400 mt-2 tabular-nums">฿0</h3>
                    <span class="text-[9px] sm:text-[10px] text-slate-500 font-mono mt-1 hidden xs:block">Cash, Bank, Stocks, Crypto & Properties</span>
                </div>

                <!-- Total Liabilities -->
                <div class="glass-panel p-4 sm:p-5 rounded-2xl border-0 flex flex-col items-center justify-center text-center">
                    <p class="text-[10px] sm:text-xs text-slate-400 font-mono uppercase tracking-wider font-bold">Total Liabilities</p>
                    <h3 id="nw-total-liabilities" class="text-lg sm:text-2xl font-mono font-bold text-red-400 mt-2 tabular-nums">฿0</h3>
                    <span class="text-[9px] sm:text-[10px] text-slate-500 font-mono mt-1 hidden xs:block">Debts, Credit Cards & Loans</span>
                </div>
            </div>

            <!-- Cash & Net Profit Side-by-Side (Centered, No Icons) -->
            <div class="grid grid-cols-2 gap-3 sm:gap-4">
                <!-- Liquid Cash -->
                <div class="glass-panel p-4 sm:p-5 rounded-2xl border-0 flex flex-col items-center justify-center text-center">
                    <p class="text-[10px] sm:text-xs text-slate-400 font-mono uppercase tracking-wider font-bold">Liquid Cash</p>
                    <h3 id="nw-total-cash" class="text-lg sm:text-2xl font-mono font-bold text-cyan-400 mt-2 tabular-nums">฿0</h3>
                    <span class="text-[9px] sm:text-[10px] text-slate-500 font-mono mt-1 hidden xs:block">Savings & Bank Accounts</span>
                </div>

                <!-- Net Profit (Unrealized P&L) -->
                <div class="glass-panel p-4 sm:p-5 rounded-2xl border-0 flex flex-col items-center justify-center text-center">
                    <p class="text-[10px] sm:text-xs text-slate-400 font-mono uppercase tracking-wider font-bold">Net Profit (P&L)</p>
                    <h3 id="nw-net-profit" class="text-lg sm:text-2xl font-mono font-bold text-emerald-400 mt-2 tabular-nums">+฿0</h3>
                    <span id="nw-net-profit-sub" class="text-[9px] sm:text-[10px] text-slate-500 font-mono mt-1 hidden xs:block">+0.00% Unrealized Return</span>
                </div>
            </div>
        </div>

        <!-- MAIN FORM & TABLE GRID -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <!-- INPUT FORM CONTAINER -->
            <div id="nw-card-form" class="lg:col-span-1 glass-panel p-5 sm:p-6 rounded-2xl border-0 flex flex-col gap-4 h-fit self-start">
                <div class="flex items-center justify-between">
                    <h3 class="font-mono font-bold text-sm text-emerald-400 flex items-center gap-2">
                        <i data-lucide="plus-circle" class="size-4"></i>
                        <span>ADD RECORD</span>
                    </h3>
                    <!-- TABS: Standard vs Market-Tracked -->
                    <div class="flex bg-slate-900/90 p-1 rounded-xl">
                        <button id="nw-tab-standard" type="button" class="px-2.5 py-1 text-[11px] font-mono font-bold rounded-lg bg-emerald-500/20 text-emerald-300 transition cursor-pointer">
                            Standard
                        </button>
                        <button id="nw-tab-volatile" type="button" class="px-2.5 py-1 text-[11px] font-mono font-bold rounded-lg text-slate-400 hover:text-cyan-300 transition cursor-pointer">
                            Market
                        </button>
                    </div>
                </div>

                <!-- PANEL 1: STANDARD ASSET / LIABILITY -->
                <div id="nw-panel-standard" class="space-y-3.5">
                    <!-- ITEM NAME -->
                    <div>
                        <label class="block text-xs font-mono text-slate-400 mb-1">ITEM NAME</label>
                        <input type="text" id="nw-input-name" placeholder="e.g. Savings Account, Car Loan, Condo"
                            class="w-full px-3.5 py-2.5 bg-slate-900/90 rounded-xl text-slate-200 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500">
                    </div>

                    <!-- CATEGORY & TYPE -->
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="block text-xs font-mono text-slate-400 mb-1">TYPE</label>
                            <select id="nw-input-type" class="w-full px-3 py-2.5 bg-slate-900/90 rounded-xl text-slate-200 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500">
                                <option value="ASSET" class="text-emerald-400">ASSET</option>
                                <option value="LIABILITY" class="text-red-400">LIABILITY</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-xs font-mono text-slate-400 mb-1">CATEGORY</label>
                            <select id="nw-input-category" class="w-full px-3 py-2.5 bg-slate-900/90 rounded-xl text-slate-200 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500">
                                <option value="Cash & Bank">Cash & Bank</option>
                                <option value="Real Estate & Vehicle">Real Estate & Vehicle</option>
                                <option value="Credit & Debt">Credit & Debt</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>

                    <!-- PORTFOLIO / GROUP -->
                    <div>
                        <div class="flex items-center justify-between mb-1">
                            <label class="block text-xs font-mono text-slate-400">PORTFOLIO / GROUP</label>
                            <button id="nw-btn-add-portfolio-quick" type="button" class="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer transition border-0">
                                <i data-lucide="folder-plus" class="w-3 h-3"></i>
                                <span>+ New</span>
                            </button>
                        </div>
                        <select id="nw-input-portfolio" class="w-full px-3 py-2.5 bg-slate-900/90 rounded-xl text-slate-200 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500 border-0">
                            <option value="Main Portfolio">Main Portfolio</option>
                        </select>
                    </div>

                    <!-- VALUE -->
                    <div id="nw-amount-wrap">
                        <label id="nw-label-amount" class="block text-xs font-mono text-slate-400 mb-1">AMOUNT (VALUE)</label>
                        <input type="number" id="nw-input-amount" placeholder="0.00" min="0" step="0.01"
                            class="w-full px-3.5 py-2.5 bg-slate-900/90 rounded-xl text-emerald-400 text-sm font-mono font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500 tabular-nums">
                    </div>

                    <!-- CONFIRM BUTTON STANDARD -->
                    <button id="nw-btn-add"
                        class="w-full mt-2 btn-press bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-bold font-mono shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 text-xs cursor-pointer">
                        <i data-lucide="check" class="size-4"></i>
                        <span>Add to Portfolio</span>
                    </button>
                </div>

                <!-- PANEL 2: MARKET-TRACKED / VOLATILE ASSET (STOCKS / ETFS / CRYPTO) -->
                <div id="nw-panel-volatile" class="hidden space-y-3">
                    <!-- SEARCH ASSISTANT -->
                    <div class="relative">
                        <div class="flex items-center justify-between mb-1">
                            <label class="block text-[10px] font-mono text-cyan-400 font-bold tracking-wider">SEARCH ASSET (ETF, STOCK, CRYPTO)</label>
                            <button id="nw-btn-finnhub-key" type="button" class="text-[10px] font-mono text-slate-400 hover:text-cyan-400 flex items-center gap-1 cursor-pointer transition" title="Finnhub API Key Settings">
                                <i data-lucide="key" class="w-3 h-3"></i>
                                <span>Finnhub Key</span>
                            </button>
                        </div>
                        <div class="relative">
                            <i data-lucide="search" class="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500"></i>
                            <input type="text" id="nw-search-asset" placeholder="Search VOO, QQQi, BTC, AAPL..." autocomplete="off"
                                class="w-full pl-9 pr-3 py-2.5 bg-slate-900/90 rounded-xl text-xs font-mono text-cyan-300 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500">
                        </div>

                        <!-- AUTOCOMPLETE DROPDOWN RESULTS -->
                        <div id="nw-search-dropdown" class="hidden absolute left-0 right-0 top-full mt-1 z-50 bg-slate-900/95 backdrop-blur-md rounded-xl shadow-2xl overflow-hidden max-h-56 overflow-y-auto">
                            <!-- Populated dynamically -->
                        </div>
                    </div>

                    <!-- SELECTED ASSET & TICKER INFO -->
                    <div class="grid grid-cols-2 gap-2.5">
                        <div>
                            <label class="block text-[10px] font-mono text-slate-400 mb-1">SYMBOL / TICKER</label>
                            <input type="text" id="nw-input-symbol" placeholder="e.g. VOO, BTC"
                                class="w-full px-3 py-2 bg-slate-900/90 rounded-xl text-xs font-mono text-cyan-300 uppercase font-bold focus:outline-none focus:ring-1 focus:ring-cyan-500">
                        </div>
                        <div>
                            <label class="block text-[10px] font-mono text-slate-400 mb-1">CATEGORY</label>
                            <div class="w-full px-3 py-2 bg-slate-900/90 rounded-xl text-xs font-mono flex items-center justify-between">
                                <span id="nw-text-category-volatile" class="text-cyan-300 font-bold truncate">Stocks / ETFs</span>
                                <span class="text-[9px] text-slate-500 font-normal">Auto</span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label class="block text-[10px] font-mono text-slate-400 mb-1">ASSET NAME</label>
                        <input type="text" id="nw-input-name-volatile" placeholder="e.g. Vanguard S&P 500 ETF"
                            class="w-full px-3 py-2 bg-slate-900/90 rounded-xl text-xs font-mono text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500">
                    </div>

                    <!-- HOLDINGS & COST (NO MANUAL MARKET PRICE INPUT) -->
                    <div class="grid grid-cols-2 gap-2.5">
                        <div>
                            <label class="block text-[10px] font-mono text-slate-400 mb-1">HOLDING UNITS (QTY)</label>
                            <input type="number" id="nw-input-qty" placeholder="0.00" min="0" step="any"
                                class="w-full px-3 py-2 bg-slate-900/90 rounded-xl text-xs font-mono text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500 tabular-nums">
                        </div>
                        <div>
                            <label class="block text-[10px] font-mono text-slate-400 mb-1">AVG BUY COST ($/฿)</label>
                            <input type="number" id="nw-input-avg-cost" placeholder="0.00" min="0" step="any"
                                class="w-full px-3 py-2 bg-slate-900/90 rounded-xl text-xs font-mono text-amber-300 font-bold focus:outline-none focus:ring-1 focus:ring-cyan-500 tabular-nums">
                        </div>
                    </div>

                    <!-- PORTFOLIO / GROUP (VOLATILE) -->
                    <div>
                        <div class="flex items-center justify-between mb-1">
                            <label class="block text-[10px] font-mono text-slate-400">PORTFOLIO / GROUP</label>
                            <button id="nw-btn-add-portfolio-volatile-quick" type="button" class="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer transition border-0">
                                <i data-lucide="folder-plus" class="w-3 h-3"></i>
                                <span>+ New</span>
                            </button>
                        </div>
                        <select id="nw-input-portfolio-volatile" class="w-full px-3 py-2 bg-slate-900/90 rounded-xl text-xs font-mono text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500 border-0">
                            <option value="Main Portfolio">Main Portfolio</option>
                        </select>
                    </div>

                    <!-- LIVE MARKET PRICE BADGE (AUTO-FETCHED, READONLY) -->
                    <div class="p-2.5 rounded-xl bg-slate-950/60 flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
                            <span class="text-[10px] font-mono text-slate-400">Live Market Price:</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <span id="nw-display-market-price" class="text-xs font-mono font-bold text-emerald-400 tabular-nums">Select asset</span>
                            <span id="nw-display-price-source" class="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 hidden">Auto</span>
                            <button id="nw-btn-refetch-market" type="button" class="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-cyan-300 transition cursor-pointer" title="Refresh Live Price">
                                <i data-lucide="refresh-cw" class="w-3 h-3"></i>
                            </button>
                        </div>
                    </div>

                    <!-- LIVE P&L AND VALUATION ESTIMATE -->
                    <div id="nw-volatile-preview" class="p-2.5 rounded-xl bg-slate-900/90 flex items-center justify-between text-xs font-mono">
                        <span class="text-slate-400 text-[10px]">Est. Value & P/L:</span>
                        <div class="text-right flex items-center gap-2">
                            <span id="nw-preview-val" class="font-bold text-slate-200 tabular-nums">฿0.00</span>
                            <span id="nw-preview-pnl" class="font-bold text-slate-400 text-[11px] tabular-nums">+0.00%</span>
                        </div>
                    </div>

                    <!-- CONFIRM BUTTON VOLATILE -->
                    <button id="nw-btn-add-volatile"
                        class="w-full mt-1 btn-press bg-cyan-600 hover:bg-cyan-500 text-white py-3 rounded-xl font-bold font-mono shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 text-xs cursor-pointer">
                        <i data-lucide="check" class="size-4"></i>
                        <span>Add Volatile Asset</span>
                    </button>
                </div>
            </div>

            <!-- ASSET / LIABILITY RECORDS LIST TABLE -->
            <div id="nw-card-records" class="lg:col-span-2 glass-panel p-3.5 sm:p-5 lg:p-6 rounded-2xl border-0 flex flex-col justify-between overflow-hidden">
                <!-- ROW 1: CARD TITLE & TOP-RIGHT BUTTONS (+ PORTFOLIO & REFRESH) -->
                <div class="flex items-center justify-between gap-2 mb-2.5 sm:mb-3 shrink-0 pr-3 sm:pr-4">
                    <h3 class="font-mono font-bold text-xs sm:text-sm text-slate-300 flex items-center gap-2 min-w-0">
                        <i data-lucide="list" class="size-4 text-cyan-400 shrink-0"></i>
                        <span class="truncate">PORTFOLIO ASSETS & LIABILITIES</span>
                    </h3>
                    <div class="flex items-center gap-1.5 shrink-0">
                        <button id="nw-btn-new-portfolio" class="px-2.5 sm:px-3 py-1.5 text-xs font-mono font-bold rounded-xl bg-cyan-950/60 text-cyan-400 hover:bg-cyan-900/80 transition flex items-center gap-1.5 cursor-pointer border-0 shrink-0" title="Create New Portfolio">
                            <i data-lucide="folder-plus" class="w-3.5 h-3.5"></i>
                            <span>+ Portfolio</span>
                        </button>
                        <button id="nw-btn-refresh-prices" class="px-2.5 py-1.5 text-xs font-mono font-bold rounded-xl bg-slate-900/80 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition flex items-center gap-1.5 cursor-pointer border-0 shrink-0" title="Auto-refresh all market prices">
                            <i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i>
                            <span class="hidden xs:inline">Refresh Prices</span>
                        </button>
                    </div>
                </div>

                <!-- ROW 2: FILTERS (ALL / ASSETS / LIABILITIES ALIGNED RIGHT TO MATCH ASSET LIST EDGE) -->
                <div class="flex items-center justify-end mb-3 sm:mb-4 shrink-0 pr-3 sm:pr-4">
                    <div class="flex items-center gap-1.5">
                        <button id="nw-filter-all" class="px-2.5 sm:px-3 py-1 text-xs font-mono font-bold rounded-xl bg-cyan-500/20 text-cyan-400 transition border-0 cursor-pointer text-center">ALL</button>
                        <button id="nw-filter-asset" class="px-2.5 sm:px-3 py-1 text-xs font-mono font-bold rounded-xl bg-slate-800/80 text-slate-400 hover:text-emerald-400 transition border-0 cursor-pointer text-center">ASSETS</button>
                        <button id="nw-filter-liability" class="px-2.5 sm:px-3 py-1 text-xs font-mono font-bold rounded-xl bg-slate-800/80 text-slate-400 hover:text-red-400 transition border-0 cursor-pointer text-center">LIABILITIES</button>
                    </div>
                </div>

                <!-- RECORD ITEMS CONTAINER (Expands to fill card height) -->
                <div id="nw-items-list" class="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1 nw-items-scroll">
                    <div class="text-center text-slate-500 py-12 text-xs font-mono">No financial items recorded yet.</div>
                </div>

                <div class="border-t border-slate-800/80 pt-3 mt-4 flex justify-between items-center text-xs font-mono text-slate-500 shrink-0">
                    <span id="nw-items-count" class="tabular-nums">0 items registered</span>
                    <button id="nw-btn-clear-all" class="text-slate-500 hover:text-red-400 transition text-xs py-1 px-2">Clear All Records</button>
                </div>
            </div>
        </div>

        <!-- CHARTS SECTION: 2 PIE CHARTS (ASSETS & LIABILITIES BY CATEGORY) -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
        </div>

        <!-- 52-WEEK NET WORTH HISTORY LINE CHART (FULL WIDTH BOTTOM SECTION) -->
        <div class="glass-panel p-6 rounded-2xl border-0 flex flex-col justify-between">
            <div class="w-full flex items-center justify-between mb-4">
                <h3 class="font-mono font-bold text-sm text-slate-300 flex items-center gap-2">
                    <i data-lucide="trending-up" class="w-4 h-4 text-cyan-400"></i>
                    <span>52-WEEK HISTORY</span>
                </h3>
                <span class="text-[10px] font-mono text-slate-500">Weekly Snapshots</span>
            </div>
            <div class="relative w-full h-[320px]">
                <canvas id="nwHistoryChart" class="w-full h-full"></canvas>
            </div>
        </div>
    </div>
`;
