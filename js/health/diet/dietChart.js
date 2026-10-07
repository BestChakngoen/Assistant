export default class DietChart {
    static render(container, stateManager, viewOffset, selectedDate, onChangePage) {
        if (!container) return;

        const dailyMap = {};
        stateManager.state.foodLog.forEach(log => {
            if (!dailyMap[log.date]) {
                dailyMap[log.date] = { date: log.date, total: 0, meal: 0, drink: 0, snack: 0 };
            }
            const cal = log.calories || 0;
            dailyMap[log.date].total += cal;
            if (log.category === 'meal') dailyMap[log.date].meal += cal;
            if (log.category === 'drink') dailyMap[log.date].drink += cal;
            if (log.category === 'snack') dailyMap[log.date].snack += cal;
        });

        const sortedHistory = Object.values(dailyMap).sort((a, b) => new Date(a.date) - new Date(b.date));
        
        const totalRecords = sortedHistory.length;
        const pageSize = 7;
        const totalPages = Math.ceil(totalRecords / pageSize) || 1;

        let currentOffset = viewOffset;
        if (currentOffset >= totalPages) currentOffset = totalPages - 1;
        if (currentOffset < 0) currentOffset = 0;

        const currentPageIndex = Math.max(0, (totalPages - 1) - currentOffset);
        const startIndex = currentPageIndex * pageSize;
        const endIndex = startIndex + pageSize;

        const rawPageData = sortedHistory.slice(startIndex, endIndex);
        
        const maxVal = Math.max(...rawPageData.map(x => x.total), (stateManager.state.targetCalories || 2000) * 1.1) || 2000;

        const formatDate = (dStr) => {
            if(!dStr) return "-";
            const [_y, m, d] = dStr.split('-');
            const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
            return `${parseInt(d)} ${months[parseInt(m)-1]}`;
        };

        const hasData = rawPageData.length > 0;
        const startLabel = hasData ? formatDate(rawPageData[0].date) : "-";
        const endLabel = hasData ? formatDate(rawPageData[rawPageData.length-1].date) : "-";
        const rangeLabel = hasData ? `${startLabel} - ${endLabel}` : "No Data";

        const barsHTML = rawPageData.map((d) => {
            const dayNum = parseInt(d.date.split('-')[2]);
            const monthNum = parseInt(d.date.split('-')[1]);
            const displayDate = `${dayNum}/${monthNum}`;
            const isSelected = d.date === selectedDate;
            const total = d.total || 1;
            const barPct = isNaN((d.total / maxVal) * 100) ? 0 : (d.total / maxVal) * 100;

            return `
                <div class="flex-1 flex flex-col items-center gap-2 z-10 group relative h-full justify-end">
                    <div class="w-full max-w-[32px] sm:max-w-[48px] bg-slate-800 rounded-t-md overflow-visible flex flex-col-reverse relative transition-height duration-500 ${isSelected ? 'ring-2 ring-cyan-500' : ''}" style="height: ${barPct}%">
                        <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 scale-90 group-hover:scale-100 origin-bottom pointer-events-none z-30 whitespace-nowrap">
                            <div class="bg-slate-900 text-white text-[10px] font-mono font-bold px-2 py-1 rounded-lg shadow-xl flex flex-col items-center gap-0.5 tabular-nums">
                                <span class="text-cyan-400">${d.total} kcal</span>
                                <div class="flex gap-1.5 text-[9px]">
                                    <span class="text-green-400">${d.meal || 0}M</span>
                                    <span class="text-blue-400">${d.drink || 0}D</span>
                                    <span class="text-yellow-400">${d.snack || 0}S</span>
                                </div>
                            </div>
                            <div class="size-2 bg-slate-900 rotate-45 mx-auto -mt-1"></div>
                        </div>
                        <div class="overflow-hidden w-full h-full flex flex-col-reverse rounded-t-md">
                            <div class="bg-green-500 w-full" style="height: ${isNaN((d.meal/total)*100) ? 0 : (d.meal/total)*100}%"></div>
                            <div class="bg-blue-400 w-full" style="height: ${isNaN((d.drink/total)*100) ? 0 : (d.drink/total)*100}%"></div>
                            <div class="bg-yellow-500 w-full" style="height: ${isNaN((d.snack/total)*100) ? 0 : (d.snack/total)*100}%"></div>
                        </div>
                    </div>
                    <span class="text-xs ${isSelected ? 'font-bold text-cyan-400' : 'text-slate-500'} whitespace-nowrap">${displayDate}</span>
                </div>
            `;
        }).join('');

        const targetY = isNaN((stateManager.state.targetCalories/maxVal)*100) ? 0 : (stateManager.state.targetCalories/maxVal)*100;

        container.innerHTML = `
            <div class="p-6 bg-slate-900/30 rounded-3xl w-full">
                <div class="flex justify-between items-center mb-6">
                    <h4 class="text-xs uppercase tracking-wider text-slate-300 font-bold flex items-center gap-2">
                        <i data-lucide="bar-chart-3" class="size-5 text-cyan-400"></i> Calorie Intake History (${rawPageData.length}/${totalRecords})
                    </h4>
                    <div class="flex items-center gap-2 bg-slate-950 rounded-xl p-1">
                        <button id="btnPrevDietPage" class="size-8 flex items-center justify-center hover:bg-slate-800 rounded-lg text-slate-400 transition-all ${currentOffset >= totalPages - 1 ? 'text-slate-700 cursor-not-allowed' : ''}" ${currentOffset >= totalPages - 1 ? 'disabled' : ''}>
                            <i data-lucide="chevron-left" class="size-4"></i>
                        </button>
                        <span class="text-xs font-bold text-slate-300 px-3 min-w-[100px] text-center tabular-nums">
                            ${rangeLabel}
                        </span>
                        <button id="btnNextDietPage" class="size-8 flex items-center justify-center hover:bg-slate-800 rounded-lg text-slate-400 transition-all ${currentOffset <= 0 ? 'text-slate-700 cursor-not-allowed' : ''}" ${currentOffset <= 0 ? 'disabled' : ''}>
                            <i data-lucide="chevron-right" class="size-4"></i>
                        </button>
                    </div>
                </div>
                <div class="flex items-end justify-between h-[250px] gap-4 pb-4 pt-8 border-b-2 border-slate-800/80 relative overflow-visible">
                    <div class="absolute w-full border-t border-dashed border-cyan-500/30 z-0 opacity-60" style="bottom: ${targetY}%"></div>
                    ${barsHTML}
                </div>
                <div class="flex justify-center gap-5 text-xs text-slate-400 font-medium mt-4">
                    <div class="flex items-center gap-2"><div class="w-3 h-3 rounded-full bg-green-500"></div>Meal</div>
                    <div class="flex items-center gap-2"><div class="w-3 h-3 rounded-full bg-blue-400"></div>Drink</div>
                    <div class="flex items-center gap-2"><div class="w-3 h-3 rounded-full bg-yellow-500"></div>Snack</div>
                </div>
            </div>
        `;
        if (window.lucide) window.lucide.createIcons();

        // Bind events
        document.getElementById('btnPrevDietPage')?.addEventListener('click', () => onChangePage(1));
        document.getElementById('btnNextDietPage')?.addEventListener('click', () => onChangePage(-1));
    }
}
