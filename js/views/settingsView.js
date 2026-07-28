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
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Danger Zone Card -->
                <div class="bg-[#161b22] p-4 rounded-xl border border-red-500/20 flex flex-col justify-between">
                    <div>
                        <h3 class="font-mono text-sm font-bold text-red-400 mb-2 uppercase tracking-wider">Danger Zone</h3>
                        <p class="text-xs text-slate-400 mb-4">Permanent actions. Cleaning data and signing out.</p>
                    </div>
                    <div class="flex flex-col gap-3 mt-4">
                        <button id="btnDataManage" class="w-full btn-press bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-slate-300 text-xs py-3 rounded-xl font-mono font-bold">
                            MANAGE HEALTH DATA
                        </button>
                        <div class="flex gap-3">
                            <button id="btn-reset" class="flex-1 btn-press bg-red-950/20 hover:bg-red-900/40 border border-red-900 text-red-400 text-xs py-3 rounded-xl font-mono font-bold">
                                WIPE ALL TRADES
                            </button>
                            <button id="btn-logout" class="flex-1 btn-press bg-red-650 hover:bg-red-500 text-white text-xs py-3 rounded-xl font-mono font-bold flex items-center justify-center gap-2">
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
    </div>

    <!-- Health Data Management Modal -->
    <div id="dataManageModal" class="hidden fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
        <div class="glass-panel p-6 rounded-3xl shadow-xl max-w-sm w-full border border-slate-800">
            <div class="flex justify-between items-center mb-6">
                <h3 class="text-lg font-bold text-white font-mono flex items-center gap-2">
                    <i data-lucide="database" class="w-5 h-5 text-cyan-400"></i> จัดการข้อมูลสุขภาพ
                </h3>
                <button id="btnCloseDataManage" class="text-slate-400 hover:text-white transition">
                    <i data-lucide="x" class="w-5 h-5"></i>
                </button>
            </div>
            <div class="space-y-4">
                <div>
                    <label class="block text-xs font-bold text-slate-400 mb-2">เลือกเดือนที่ต้องการลบข้อมูล</label>
                    <input type="month" id="deleteMonthInput" class="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-white font-mono focus:border-cyan-500 outline-none">
                </div>
                <div>
                    <label class="block text-xs font-bold text-slate-400 mb-2">เลือกข้อมูลที่จะลบ</label>
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
                    ลบข้อมูลทั้งหมดในเดือนที่เลือก
                </button>
            </div>
        </div>
    </div>
`;
