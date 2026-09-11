/**
 * headerView.js - Header Bar & Clock Badge Template
 */
export const headerViewHtml = `
    <header class="h-16 border-b border-slate-800/60 bg-[#0d121f]/80 backdrop-blur-md flex items-center justify-between px-6 shrink-0 z-30">
        <div class="flex items-center gap-4">
            <!-- Hamburger button for mobile (44x44px hit target) -->
            <button onclick="window.toggleSidebar()" class="lg:hidden size-11 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-300 flex items-center justify-center transition-colors" aria-label="Toggle Navigation">
                <i data-lucide="menu" class="size-5"></i>
            </button>
            <!-- Exchange rate widget -->
            <div class="flex items-center gap-2 bg-slate-900/60 px-3.5 py-1.5 rounded-full border border-slate-800/50">
                <span class="text-[10px] text-amber-500 font-bold tracking-wider uppercase">USD/THB</span>
                <span id="thb-rate" class="price-text text-white text-xs font-mono font-bold tabular-nums">Loading...</span>
            </div>
        </div>

        <div class="flex items-center gap-3 sm:gap-4">
            <div class="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 text-cyan-400 font-mono text-xs font-bold">
                <i data-lucide="calendar-clock" class="size-4 text-cyan-400 shrink-0"></i>
                <span id="header-date" class="text-slate-200 font-semibold tabular-nums">--/--/----</span>
                <span class="text-cyan-500/50 font-normal">|</span>
                <span id="header-time" class="text-cyan-400 font-extrabold tracking-wider tabular-nums">--:--:--</span>
            </div>

            <!-- Quick Notifications Bell Shortcut -->
            <button id="btn-header-notifications" type="button" onclick="if(window.app && window.app.ui){ window.app.ui.switchTab('notifications'); if(window.notificationManager) window.notificationManager.render(); }" class="btn-press size-10 rounded-xl bg-slate-900/60 hover:bg-slate-800 text-slate-300 hover:text-cyan-400 flex items-center justify-center transition-colors relative cursor-pointer" title="Go to Notifications" aria-label="Notifications">
                <i data-lucide="bell" class="size-4"></i>
                <span id="header-notification-badge" class="hidden absolute -top-1 -right-1 size-4 rounded-full bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center animate-pulse">0</span>
            </button>

            <!-- Hidden element to satisfy main.js user-display-name binding -->
            <span id="user-display-name" class="hidden"></span>
        </div>
    </header>
`;
