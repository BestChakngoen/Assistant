/**
 * headerView.js - Header Bar & Clock Badge Template
 */
export const headerViewHtml = `
    <header class="h-16 border-b border-slate-800/60 bg-[#0d121f]/80 backdrop-blur-md flex items-center justify-between px-6 shrink-0 z-30">
        <div class="flex items-center gap-4">
            <!-- Hamburger button for mobile -->
            <button onclick="window.toggleSidebar()" class="lg:hidden p-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-700 text-slate-300">
                <i data-lucide="menu" class="w-5 h-5"></i>
            </button>
            <!-- Exchange rate widget -->
            <div class="flex items-center gap-2 bg-slate-900/60 px-3.5 py-1.5 rounded-full border border-slate-800/80">
                <span class="text-[10px] text-amber-500 font-bold tracking-wider uppercase">USD/THB</span>
                <span id="thb-rate" class="price-text text-white text-xs font-mono font-bold">Loading...</span>
            </div>
        </div>

        <div class="flex items-center gap-4">
            <div class="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono text-xs font-bold shadow-[0_0_15px_rgba(6,182,212,0.15)]">
                <i data-lucide="calendar-clock" class="w-4 h-4 text-cyan-400 shrink-0"></i>
                <span id="header-date" class="text-slate-200 font-semibold">--/--/----</span>
                <span class="text-cyan-500/50 font-normal">|</span>
                <span id="header-time" class="text-cyan-400 font-extrabold tracking-wider">--:--:--</span>
            </div>
            <!-- Hidden element to satisfy main.js user-display-name binding -->
            <span id="user-display-name" class="hidden"></span>
        </div>
    </header>
`;
