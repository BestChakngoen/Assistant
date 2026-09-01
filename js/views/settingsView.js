/**
 * settingsView.js - System Settings & Health Data Modal Template
 */
export const settingsViewHtml = `
    <div id="settings-panel" class="hidden flex-col gap-6 animate-fade-in pb-10">
        <div class="glass-panel p-6 rounded-2xl border border-slate-700 bg-slate-900/50">
            <h2 class="text-xl font-mono font-bold text-white mb-6 flex items-center gap-2">
                <svg class="w-5 h-5 text-slate-400" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"></path>
                    <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Z"></path>
                </svg>
                Settings
            </h2>
            
            <div class="flex flex-col gap-6 mb-6">
                <!-- Quota Dashboard Card (Full Width) -->
                <div class="w-full bg-[#161b22] p-6 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-5">
                    <div>
                        <div class="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
                            <div class="flex items-center gap-2">
                                <i data-lucide="activity" class="w-5 h-5 text-cyan-400"></i>
                                <h3 class="font-mono text-sm font-bold text-white uppercase tracking-wider">Cloud Quota & Storage Usage</h3>
                            </div>
                            <!-- Countdown timer to daily reset -->
                            <div class="flex items-center gap-1.5 px-3 py-1 bg-slate-900/80 border border-slate-800 rounded-full text-[11px] font-mono text-amber-400">
                                <i data-lucide="clock" class="w-3.5 h-3.5 animate-pulse"></i>
                                <span>Reset In: <strong id="quota-reset-timer" class="text-amber-300">--h --m --s</strong></span>
                            </div>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono">
                            <!-- 1. Firebase Firestore Reads -->
                            <div class="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/60">
                                <div class="flex justify-between items-center text-xs mb-1.5">
                                    <span class="font-bold text-slate-200">Firebase Firestore (Reads & Realtime)</span>
                                    <span id="txt-quota-firestore-reads" class="text-slate-400 text-[11px]">Loading...</span>
                                </div>
                                <div class="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                                    <div id="bar-quota-firestore-reads" class="bg-amber-500 h-full rounded-full transition-all duration-500" style="width: 0%"></div>
                                </div>
                                <p class="text-[10px] text-slate-500 mt-1">Used for: <strong>Trade History, Health & Diet Records</strong> (Free Quota: 50,000 Reads/Day)</p>
                            </div>

                            <!-- 2. Firebase Firestore Writes -->
                            <div class="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/60">
                                <div class="flex justify-between items-center text-xs mb-1.5">
                                    <span class="font-bold text-slate-200">Firebase Firestore (Writes & Updates)</span>
                                    <span id="txt-quota-firestore-writes" class="text-slate-400 text-[11px]">Loading...</span>
                                </div>
                                <div class="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                                    <div id="bar-quota-firestore-writes" class="bg-orange-500 h-full rounded-full transition-all duration-500" style="width: 0%"></div>
                                </div>
                                <p class="text-[10px] text-slate-500 mt-1">Used for: <strong>Add/Edit/Delete Trades & Health Logs</strong> (Free Quota: 20,000 Writes/Day)</p>
                            </div>

                            <!-- 3. Supabase File Storage -->
                            <div class="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/60">
                                <div class="flex justify-between items-center text-xs mb-1.5">
                                    <span class="font-bold text-slate-200">Supabase Cloud Storage</span>
                                    <span id="txt-quota-supabase-storage" class="text-slate-400 text-[11px]">Loading...</span>
                                </div>
                                <div class="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                                    <div id="bar-quota-supabase-storage" class="bg-cyan-500 h-full rounded-full transition-all duration-500" style="width: 0%"></div>
                                </div>
                                <p class="text-[10px] text-slate-500 mt-1">Used for: <strong>Image files & attachments in Share Files Bucket</strong> (Free Quota: 1.0 GB)</p>
                            </div>

                            <!-- 4. Supabase Net Worth Database -->
                            <div class="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/60">
                                <div class="flex justify-between items-center text-xs mb-1.5">
                                    <span class="font-bold text-slate-200">Supabase Database (Net Worth & Items)</span>
                                    <span id="txt-quota-supabase-db" class="text-slate-400 text-[11px]">Loading...</span>
                                </div>
                                <div class="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                                    <div id="bar-quota-supabase-db" class="bg-emerald-500 h-full rounded-full transition-all duration-500" style="width: 0%"></div>
                                </div>
                                <p class="text-[10px] text-slate-500 mt-1">Used for: <strong>Net Worth asset data & shared_items text table</strong> (Free Quota: 500 MB)</p>
                            </div>

                            <!-- 5. Browser LocalStorage -->
                            <div class="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/60">
                                <div class="flex justify-between items-center text-xs mb-1.5">
                                    <span class="font-bold text-slate-200">Browser LocalStorage</span>
                                    <span id="txt-quota-localstorage" class="text-slate-400 text-[11px]">Loading...</span>
                                </div>
                                <div class="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                                    <div id="bar-quota-localstorage" class="bg-purple-500 h-full rounded-full transition-all duration-500" style="width: 0%"></div>
                                </div>
                                <p class="text-[10px] text-slate-500 mt-1">Used for: <strong>User Preferences, Offline Snapshots & Local Cache</strong> (Limit: ~5.0 MB)</p>
                            </div>

                            <!-- 6. Browser IndexedDB Storage -->
                            <div class="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/60">
                                <div class="flex justify-between items-center text-xs mb-1.5">
                                    <span class="font-bold text-slate-200">Browser IndexedDB Storage</span>
                                    <span id="txt-quota-indexeddb" class="text-slate-400 text-[11px]">Loading...</span>
                                </div>
                                <div class="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                                    <div id="bar-quota-indexeddb" class="bg-indigo-500 h-full rounded-full transition-all duration-500" style="width: 0%"></div>
                                </div>
                                <p class="text-[10px] text-slate-500 mt-1">Used for: <strong>Offline Share Files, Blob Database & Local Cache</strong> (Browser Allotted Storage)</p>
                            </div>
                        </div>

                        <!-- Quota Warning Banner (Displayed when quota is exceeded) -->
                        <div id="quota-warning-banner" class="hidden mt-4 p-4 rounded-xl bg-red-950/40 border border-red-500/30 text-xs font-mono text-slate-200 space-y-1">
                            <div class="flex items-center gap-2 text-red-400 font-bold">
                                <i data-lucide="shield-alert" class="w-4 h-4 shrink-0"></i>
                                <span>Cloud Quota Limit Exceeded</span>
                            </div>
                            <p id="quota-warning-banner-msg" class="text-slate-300 text-[11px] leading-relaxed pl-6">
                                Daily cloud resource quota has been exhausted. Read/write operations are temporarily blocked until reset at 00:00 UTC.
                            </p>
                        </div>
                    </div>
                </div>

                <!-- Danger Zone Card (Moved to Bottom) -->
                <div class="w-full bg-[#161b22] p-5 rounded-2xl border border-red-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h3 class="font-mono text-sm font-bold text-red-400 mb-1 uppercase tracking-wider">Danger Zone</h3>
                        <p class="text-xs text-slate-400">Permanent actions. Cleaning data and signing out.</p>
                    </div>
                    <div class="flex flex-wrap sm:flex-nowrap gap-3 w-full sm:w-auto">
                        <button id="btnDataManage" class="btn-press bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-slate-300 text-xs px-4 py-2.5 rounded-xl font-mono font-bold whitespace-nowrap">
                            MANAGE HEALTH DATA
                        </button>
                        <button id="btn-reset" class="btn-press bg-red-950/20 hover:bg-red-900/40 border border-red-900 text-red-400 text-xs px-4 py-2.5 rounded-xl font-mono font-bold whitespace-nowrap">
                            WIPE ALL TRADES
                        </button>
                        <button id="btn-logout" class="btn-press bg-red-650 hover:bg-red-500 text-white text-xs px-4 py-2.5 rounded-xl font-mono font-bold flex items-center justify-center gap-2 whitespace-nowrap">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                            </svg>
                            LOGOUT
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Health Data Management Modal -->
    <div id="dataManageModal" class="hidden fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
        <div class="glass-panel p-6 rounded-3xl shadow-xl max-w-sm w-full border border-slate-800">
            <div class="flex justify-between items-center mb-6">
                <h3 class="text-lg font-bold text-white font-mono flex items-center gap-2">
                    <i data-lucide="database" class="w-5 h-5 text-cyan-400"></i> Manage Health Data
                </h3>
                <button id="btnCloseDataManage" class="text-slate-400 hover:text-white transition">
                    <i data-lucide="x" class="w-5 h-5"></i>
                </button>
            </div>
            <div class="space-y-4 font-mono">
                <div>
                    <label class="block text-xs font-bold text-slate-400 mb-2">Select Target Month to Wipe</label>
                    <input type="month" id="deleteMonthInput" class="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-white font-mono focus:border-cyan-500 outline-none">
                </div>
                <div>
                    <label class="block text-xs font-bold text-slate-400 mb-2">Select Data Types to Wipe</label>
                    <div class="space-y-2 bg-slate-900/30 p-3 rounded-xl border border-slate-800/50">
                        <label class="flex items-center gap-3 cursor-pointer select-none">
                            <input type="checkbox" id="chkDeleteSleep" class="rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-cyan-500" checked>
                            <span class="text-sm text-slate-300 font-bold">Sleep Analysis</span>
                        </label>
                        <label class="flex items-center gap-3 cursor-pointer select-none">
                            <input type="checkbox" id="chkDeleteBody" class="rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-cyan-500" checked>
                            <span class="text-sm text-slate-300 font-bold">Body & Trends</span>
                        </label>
                        <label class="flex items-center gap-3 cursor-pointer select-none">
                            <input type="checkbox" id="chkDeleteDiet" class="rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-cyan-500" checked>
                            <span class="text-sm text-slate-300 font-bold">Food Journal</span>
                        </label>
                    </div>
                </div>
                <button id="btnConfirmDeleteData" class="w-full bg-red-600 hover:bg-red-500 text-white py-3 rounded-xl font-bold shadow-lg shadow-red-500/20 transition btn-press">
                    Wipe All Selected Month Data
                </button>
            </div>
        </div>
    </div>
`;
