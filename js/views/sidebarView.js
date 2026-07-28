/**
 * sidebarView.js - Sidebar Navigation Component Template
 */
export const sidebarViewHtml = `
    <aside id="sidebar" class="fixed inset-y-0 left-0 z-50 w-64 bg-[#0d121f] border-r border-slate-800/60 flex flex-col justify-between transition-transform duration-300 -translate-x-full lg:translate-x-0">
        <!-- Sidebar Header / Logo -->
        <div class="p-6 border-b border-slate-800/60">
            <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                    <i data-lucide="activity" class="w-5 h-5 text-white"></i>
                </div>
                <div>
                    <h1 class="text-base font-bold font-mono text-white tracking-wider">Infomation</h1>
                    <span class="text-[10px] text-cyan-400 font-bold uppercase tracking-widest">Workspace</span>
                </div>
            </div>
        </div>

        <!-- Navigation Links -->
        <nav class="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto" id="repo-tabs-container">
            <!-- Code (Journal/Dashboard) -->
            <button id="tab-code" class="w-full flex items-center gap-3 px-4 py-3 border-l-4 border-cyan-500 bg-cyan-500/10 text-cyan-400 font-bold text-sm rounded-r-xl transition-all btn-press">
                <i data-lucide="layout-dashboard" class="w-4 h-4"></i>
                <span>Trade Track</span>
            </button>
            <!-- Issues (Strategy Lab) -->
            <button id="tab-issues" class="w-full flex items-center gap-3 px-4 py-3 border-l-4 border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30 text-sm rounded-r-xl transition-all btn-press">
                <i data-lucide="check-square" class="w-4 h-4"></i>
                <span>Strategy Lab</span>
            </button>
            <!-- Actions (Market) -->
            <button id="tab-actions" class="w-full flex items-center gap-3 px-4 py-3 border-l-4 border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30 text-sm rounded-r-xl transition-all btn-press">
                <i data-lucide="line-chart" class="w-4 h-4"></i>
                <span>Market Center</span>
            </button>
            <!-- Wiki (News) -->
            <button id="tab-wiki" class="w-full flex items-center gap-3 px-4 py-3 border-l-4 border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30 text-sm rounded-r-xl transition-all btn-press">
                <i data-lucide="newspaper" class="w-4 h-4"></i>
                <span>News Feed</span>
            </button>
            <!-- Pull Requests (Health Track) -->
            <button id="tab-pulls" class="w-full flex items-center gap-3 px-4 py-3 border-l-4 border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30 text-sm rounded-r-xl transition-all btn-press">
                <i data-lucide="heart" class="w-4 h-4"></i>
                <span>Health Track</span>
            </button>
            <!-- Share Files -->
            <button id="tab-share" class="w-full flex items-center gap-3 px-4 py-3 border-l-4 border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30 text-sm rounded-r-xl transition-all btn-press">
                <i data-lucide="share-2" class="w-4 h-4"></i>
                <span>Share Files</span>
            </button>
            <!-- Learning Others -->
            <button id="tab-learning" onclick="window.toggleLearningMenu()" class="w-full flex items-center justify-between px-4 py-3 border-l-4 border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30 text-sm rounded-r-xl transition-all btn-press">
                <div class="flex items-center gap-3">
                    <i data-lucide="graduation-cap" class="w-4 h-4"></i>
                    <span>Learning Others</span>
                </div>
                <i data-lucide="chevron-down" id="learning-chevron" class="w-4 h-4 transition-transform duration-200"></i>
            </button>
            <div id="learning-submenu" class="hidden pl-8 pr-2 py-1.5 space-y-1 bg-[#090d16]/30 border-l border-slate-800/60 ml-5 mt-1 rounded-l-md">
                <a href="learning-others/website-app.html" class="block py-2 px-3 text-xs text-slate-400 hover:text-cyan-400 hover:bg-slate-800/20 rounded-lg transition-all flex items-center gap-2">
                    <span class="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
                    <span>Software</span>
                </a>
                <a href="learning-others/electronics.html" class="block py-2 px-3 text-xs text-slate-400 hover:text-cyan-400 hover:bg-slate-800/20 rounded-lg transition-all flex items-center gap-2">
                    <span class="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                    <span>Electricity</span>
                </a>
                <a href="learning-others/agriculture.html" class="block py-2 px-3 text-xs text-slate-400 hover:text-cyan-400 hover:bg-slate-800/20 rounded-lg transition-all flex items-center gap-2">
                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span>Agriculture</span>
                </a>
            </div>
            <!-- Settings -->
            <button id="tab-settings" class="w-full flex items-center gap-3 px-4 py-3 border-l-4 border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30 text-sm rounded-r-xl transition-all btn-press">
                <i data-lucide="settings" class="w-4 h-4"></i>
                <span>System Settings</span>
            </button>
        </nav>

        <!-- User Info / Profile -->
        <div class="p-4 border-t border-slate-800/60 bg-[#0a0d16]/40 flex items-center justify-between">
            <div class="flex items-center gap-2.5 overflow-hidden">
                <div class="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                    <i data-lucide="user" class="w-4 h-4 text-slate-400"></i>
                </div>
                <div class="overflow-hidden">
                    <p id="top-user-display" class="text-xs font-bold text-slate-200 truncate font-mono">guest</p>
                    <span class="text-[9px] text-green-400 font-mono font-bold tracking-wider flex items-center gap-1">
                        <span class="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                        ONLINE
                    </span>
                </div>
            </div>
        </div>
    </aside>
`;
