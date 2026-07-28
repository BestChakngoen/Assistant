/**
 * tradeTrackView.js - Trade Track & Journal Component Template
 */
export const tradeTrackViewHtml = `
    <div id="journal-panel" class="animate-fade-in flex flex-col gap-6">
        <!-- Stats -->
        <div class="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div class="glass-panel p-4 rounded-xl border-l-4 border-blue-500 col-span-2 md:col-span-1">
                <p class="text-xs text-slate-400 uppercase tracking-widest mb-1">Balance</p>
                <h2 id="summary-balance" class="text-2xl font-mono font-bold text-blue-400">0.00</h2>
                <span class="text-xs text-slate-500">Total Equity</span>
            </div>
            <div
                class="glass-panel p-4 rounded-xl border-l-4 border-slate-500 col-span-2 md:col-span-1 relative group">
                <div class="flex justify-between items-start">
                    <div>
                        <p class="text-xs text-slate-400 uppercase tracking-widest mb-1">Fund</p>
                        <h2 id="summary-fund" class="text-2xl font-mono font-bold text-white">0.00</h2>
                        <span class="text-xs text-slate-500">Net Deposit</span>
                    </div>
                    <div
                        class="flex flex-col gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <button id="btn-quick-deposit"
                            class="w-6 h-6 rounded bg-blue-500/20 text-blue-400 hover:bg-blue-500 hover:text-white flex items-center justify-center text-xs border border-blue-500/30">+</button>
                        <button id="btn-quick-withdraw"
                            class="w-6 h-6 rounded bg-orange-500/20 text-orange-400 hover:bg-orange-500 hover:text-white flex items-center justify-center text-xs border border-orange-500/30">-</button>
                    </div>
                </div>
            </div>
            <div class="glass-panel p-4 rounded-xl border-l-4 border-cyan-500 col-span-2 md:col-span-1">
                <p class="text-xs text-slate-400 uppercase tracking-widest mb-1">Net Profit</p>
                <h2 id="summary-profit" class="text-2xl font-mono font-bold text-white">0.00</h2>
                <span class="text-xs text-slate-500" id="summary-roi">0% ROI</span>
            </div>
            <div class="glass-panel p-4 rounded-xl border-l-4 border-purple-500 col-span-2 md:col-span-1">
                <p class="text-xs text-slate-400 uppercase tracking-widest mb-1">Win Rate</p>
                <h2 id="summary-winrate" class="text-2xl font-mono font-bold text-white">0%</h2>
                <span id="summary-wincount" class="text-xs text-slate-500">0W - 0L</span>
            </div>
            <div class="glass-panel p-4 rounded-xl border-l-4 border-amber-400 col-span-2 md:col-span-1">
                <p class="text-xs text-slate-400 uppercase tracking-widest mb-1">Total Trades</p>
                <h2 id="summary-totaltrades" class="text-2xl font-mono font-bold text-white">0</h2>
                <span class="text-xs text-slate-500">Total number of trades</span>
            </div>
            <div class="glass-panel p-4 rounded-xl border-l-4 border-emerald-500 col-span-2 md:col-span-1">
                <p class="text-xs text-slate-400 uppercase tracking-widest mb-1">Expected Return</p>
                <h2 id="summary-expectancy" class="text-2xl font-mono font-bold text-white">0.00</h2>
                <span class="text-xs text-slate-500">Expectancy per trade</span>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Input Area -->
            <div id="trade-left-col" class="lg:col-span-2 flex flex-col gap-6">
                <div class="glass-panel p-6 rounded-2xl border-t-4 border-cyan-500">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="font-mono font-bold text-lg text-cyan-400 flex items-center gap-2">
                            <span class="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>
                            LOG TRANSACTION
                        </h3>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                        <div class="md:col-span-3">
                            <div class="flex justify-between items-center mb-1">
                                <label class="block text-xs text-slate-500">DATE</label>
                                <button id="btn-set-today" class="text-[10px] text-cyan-400 hover:text-cyan-300 underline cursor-pointer font-mono font-bold tracking-wider">TODAY</button>
                            </div>
                            <input type="date" id="input-date" class="w-full px-3 py-2 rounded-lg font-mono">
                        </div>
                        <div class="md:col-span-3">
                            <label class="block text-xs text-slate-500 mb-1">TYPE / RESULT</label>
                            <select id="input-type" class="w-full px-3 py-2 rounded-lg font-mono">
                                <option value="WIN" class="text-green-400">TRADE WIN (+)</option>
                                <option value="LOSS" class="text-red-400">TRADE LOSS (-)</option>
                                <option value="DEPOSIT" class="text-blue-400 font-bold">DEPOSIT (ฝาก)</option>
                                <option value="WITHDRAW" class="text-orange-400 font-bold">WITHDRAW (ถอน)</option>
                            </select>
                        </div>
                        <div class="md:col-span-3">
                            <label class="block text-xs text-slate-500 mb-1">ASSET</label>
                            <select id="input-asset" class="w-full px-3 py-2 rounded-lg font-mono text-white">
                                <option value="BTC/USD">BTC/USD</option>
                                <option value="XAU/USD">GOLD (XAU)</option>
                                <option value="USOIL">OIL (USOIL)</option>
                                <option value="EUR/USD">EUR/USD</option>
                            </select>
                        </div>
                        <div class="md:col-span-3">
                            <label class="block text-xs text-slate-500 mb-1">AMOUNT (USD)</label>
                            <input type="number" id="input-amount" placeholder="0.00" min="0" step="0.01"
                                class="w-full px-3 py-2 rounded-lg font-mono text-green-400 font-bold">
                        </div>
                    </div>

                    <button id="btn-add-trade"
                        class="w-full mt-4 btn-press bg-cyan-600 hover:bg-cyan-500 text-white py-3 rounded-lg font-bold font-mono shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2">
                        <span>CONFIRM RECORD</span>
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M5 13l4 4L19 7"></path>
                        </svg>
                    </button>
                </div>

                <!-- Chart -->
                <div class="glass-panel p-6 rounded-2xl">
                    <div class="flex justify-between items-center mb-4">
                        <div class="flex items-center gap-4">
                            <h3 class="font-mono font-bold text-lg text-slate-300">DAILY PERFORMANCE</h3>
                            <!-- CHART NAVIGATION -->
                            <div class="flex gap-1 bg-slate-800 rounded-lg p-1 border border-slate-700">
                                <button id="chart-prev" class="p-1 px-2 hover:bg-slate-700 hover:text-cyan-400 transition text-slate-400 rounded" title="Previous Days">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
                                </button>
                                <button id="chart-next" class="p-1 px-2 hover:bg-slate-700 hover:text-cyan-400 transition text-slate-400 rounded disabled:opacity-30 disabled:cursor-not-allowed" title="Recent Days">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                                </button>
                            </div>
                        </div>
                        <div class="flex gap-2">
                            <span class="flex items-center text-xs text-slate-400"><span
                                    class="w-2 h-2 rounded-full bg-green-500 mr-1"></span> Profit</span>
                            <span class="flex items-center text-xs text-slate-400"><span
                                    class="w-2 h-2 rounded-full bg-red-500 mr-1"></span> Loss</span>
                        </div>
                    </div>
                    <div class="relative w-full h-[300px]">
                        <canvas id="pnlChart" class="absolute inset-0 w-full h-full"></canvas>
                        <canvas id="tradesChart"
                            class="absolute inset-0 w-full h-full pointer-events-none"></canvas>
                    </div>
                </div>
            </div>

            <!-- Right Panel -->
            <div id="trade-right-col" class="lg:col-span-1 flex flex-col gap-6">
                <div id="trade-commits-panel" class="glass-panel flex-1 rounded-2xl flex flex-col overflow-hidden">
                    <!-- Header Area -->
                    <div class="bg-slate-900/50 border-b border-slate-700 p-4 pb-3">
                        <div class="flex justify-between items-center mb-3">
                            <h3 class="font-mono font-bold text-slate-300 flex items-center gap-1.5">
                                <svg class="w-4 h-4 text-slate-400" viewBox="0 0 16 16" fill="currentColor">
                                    <path d="M10.5 7.75a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Zm1.43.07a4.002 4.002 0 0 1-7.86 0H.75a.75.75 0 0 1 0-1.5h3.32a4.002 4.002 0 0 1 7.86 0h3.32a.75.75 0 0 1 0 1.5h-3.32Z"></path>
                                </svg>
                                COMMITS (HISTORY)
                            </h3>
                            <span class="text-[10px] bg-[#21262d] text-[#8b949e] border border-[#30363d] px-2 py-0.5 rounded-full font-mono font-bold">LIVE</span>
                        </div>
                        <!-- TABS -->
                        <div class="flex bg-[#0d1117] p-1 rounded-lg border border-[#30363d]">
                            <button id="hist-tab-trades" class="flex-1 py-1.5 rounded-md text-[10px] md:text-xs font-mono font-bold transition-all bg-[#21262d] text-white shadow-sm border border-[#30363d]">TRADES (P&L)</button>
                            <button id="hist-tab-transfers" class="flex-1 py-1.5 rounded-md text-[10px] md:text-xs font-mono font-bold transition-all text-[#8b949e] hover:text-white">DEPOSIT / WITHDRAW</button>
                        </div>
                    </div>

                    <div id="history-list" class="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
                        <div class="text-center text-slate-500 py-10 text-sm loading-pulse">Syncing...</div>
                    </div>
                </div>

                <!-- Data Management Card -->
                <div class="glass-panel p-6 rounded-2xl border-t-4 border-cyan-500 bg-[#0d1117]/50">
                    <div>
                        <h3 class="font-mono text-sm font-bold text-slate-300 mb-2 uppercase tracking-wider">CSV Data Operations</h3>
                        <p class="text-xs text-slate-400 mb-4">Export or import your trading journal database in CSV format.</p>
                    </div>
                    <div class="flex gap-3 mt-4">
                        <button id="btn-export" class="flex-1 btn-press bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-white text-xs py-3 rounded-xl font-mono font-bold">
                            EXPORT CSV
                        </button>
                        <button id="btn-import-trigger" class="flex-1 btn-press bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-white text-xs py-3 rounded-xl font-mono font-bold">
                            IMPORT CSV
                        </button>
                        <input type="file" id="file-import" accept=".csv" class="hidden">
                    </div>
                </div>
            </div>
        </div>

        <!-- CYBER PHONK RUNNER GAME -->
        <div class="glass-panel rounded-2xl overflow-hidden border border-purple-500/30" style="background: linear-gradient(135deg, #0a0015 0%, #0d0020 50%, #080010 100%);">
            <div class="p-4 border-b border-purple-500/20 flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <span class="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></span>
                    <h3 class="font-mono font-bold text-purple-400 tracking-widest text-sm uppercase">⚡ CYBER PHONK RUNNER — Kill Time Protocol</h3>
                </div>
                <div class="flex items-center gap-4">
                    <div class="text-right">
                        <p class="text-[9px] text-slate-400 font-mono font-bold uppercase tracking-widest">HIGH SCORE</p>
                        <p id="game-hi-score" class="text-lg font-mono font-bold text-yellow-300" style="text-shadow: 0 0 10px rgba(253, 224, 71, 0.6);">000000</p>
                    </div>
                    <div class="text-right hidden">
                        <p class="text-[9px] text-slate-400 font-mono font-bold uppercase tracking-widest">SCORE</p>
                        <p id="game-score" class="text-lg font-mono font-bold text-cyan-300" style="text-shadow: 0 0 10px rgba(6, 182, 212, 0.65);">000000</p>
                    </div>
                </div>
            </div>
            <div class="relative flex justify-center" style="background: #04000a;">
                <canvas id="phonkRunnerCanvas" width="1100" height="260"
                    style="image-rendering: pixelated; image-rendering: crisp-edges; cursor: pointer; width: 100%; border: 1px solid rgba(168,85,247,0.3); border-radius: 8px; box-shadow: 0 0 30px rgba(168,85,247,0.2), 0 0 60px rgba(0,200,255,0.1);">
                </canvas>
            </div>
            <div class="px-4 pb-3 flex items-center justify-between">
                <p class="text-[10px] text-slate-600 font-mono">SPACE / ↑ / TAP = JUMP &nbsp;|&nbsp; DOUBLE JUMP UNLOCKED</p>
                <div class="flex items-center gap-2">
                    <button id="game-mute-btn" title="Toggle Sound"
                        onclick="window.__phonkToggleMute && window.__phonkToggleMute()"
                        class="text-sm px-2 py-0.5 rounded border border-purple-500/40 text-purple-400 hover:bg-purple-500/10 transition font-mono">🔊</button>
                    <div id="game-level-badge" class="text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-purple-500/40 text-purple-400">LVL 1</div>
                </div>
            </div>
        </div>
    </div>
`;
