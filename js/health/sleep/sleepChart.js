export default class SleepChart {
    static render(container, stateManager, viewOffset, selectedDate, onChangePage) {
        if (!container) return;

        const sortedHistory = [...stateManager.state.history].sort((a,b) => new Date(a.date) - new Date(b.date));
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

        const normalizeTime = (t) => {
            const [h, m] = t.split(':').map(Number);
            let mins = h * 60 + m;
            if (mins < 720) mins += 1440; 
            return mins - 720; 
        };

        let timePoints = [
            normalizeTime(stateManager.targets.bedTime.ideal),
            normalizeTime(stateManager.targets.wakeTime.ideal)
        ];

        rawPageData.forEach(d => {
            if (d.bedTime && d.wakeTime) {
                timePoints.push(normalizeTime(d.bedTime));
                timePoints.push(normalizeTime(d.wakeTime));
            }
        });

        const minTime = Math.min(...timePoints);
        const maxTime = Math.max(...timePoints);
        
        const scaleMin = minTime - 60;
        const scaleMax = maxTime + 60;
        const scaleRange = scaleMax - scaleMin;

        const timeToPercent = (t) => {
            const val = normalizeTime(t);
            return ((val - scaleMin) / scaleRange) * 100;
        };

        const targetBedY = timeToPercent(stateManager.targets.bedTime.ideal);
        const targetWakeY = timeToPercent(stateManager.targets.wakeTime.ideal);

        const formatDate = (dStr) => {
            if (!dStr) return "-";
            const [_y, m, d] = dStr.split('-');
            const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
            return `${parseInt(d)} ${months[parseInt(m)-1]}`;
        };

        const hasData = rawPageData.length > 0;
        const startLabel = hasData ? formatDate(rawPageData[0].date) : "-";
        const endLabel = hasData ? formatDate(rawPageData[rawPageData.length-1].date) : "-";
        const rangeLabel = hasData ? `${startLabel} - ${endLabel}` : "No Data";

        const barsHTML = rawPageData.map(d => {
            const dayNum = parseInt(d.date.split('-')[2]);
            const monthNum = parseInt(d.date.split('-')[1]);
            const displayDate = `${dayNum}/${monthNum}`;
            const isSelected = d.date === selectedDate;

            const startY = timeToPercent(d.bedTime);
            const endY = timeToPercent(d.wakeTime);
            const height = endY - startY;
            const bgClass = isSelected ? 'bg-cyan-500 shadow-[0_0_10px_rgba(56,189,248,0.5)]' : 'bg-slate-700';
            const style = `top: ${startY}%; height: ${height}%`;

            return `
                <div class="flex-1 flex flex-col justify-end h-full max-w-[80px]">
                    <div class="relative w-full h-full group hover:bg-slate-800/50 transition-colors rounded-xl">
                        <div class="absolute w-6 sm:w-8 rounded-full left-1/2 -translate-x-1/2 transition-all hover:w-8 hover:sm:w-10 hover:z-10 ${bgClass}"
                                style="${style}"
                                title="${displayDate}: ${d.bedTime} - ${d.wakeTime} (${d.duration?.toFixed(2) || 0} hrs)">
                        </div>
                    </div>
                    <div class="h-8 flex items-center justify-center mt-2">
                        <span class="text-xs ${isSelected ? 'font-bold text-cyan-400' : 'text-slate-500'} whitespace-nowrap">
                            ${displayDate}
                        </span>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = `
            <div class="flex justify-between items-center mb-6">
                <h4 class="text-sm uppercase tracking-wider text-slate-300 font-bold flex items-center gap-2">
                    <i data-lucide="history" class="w-5 h-5 text-cyan-400"></i> Sleep History (${rawPageData.length}/${totalRecords})
                </h4>
                <div class="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl p-1">
                    <button id="btnPrevSleepPage" class="p-2 hover:bg-slate-800 rounded-lg text-slate-400 transition-all ${currentOffset >= totalPages - 1 ? 'text-slate-700 cursor-not-allowed' : ''}" ${currentOffset >= totalPages - 1 ? 'disabled' : ''}>
                        <i data-lucide="chevron-left" class="w-4 h-4"></i>
                    </button>
                    <span class="text-sm font-bold text-slate-300 px-3 min-w-[100px] text-center">
                        ${rangeLabel}
                    </span>
                    <button id="btnNextSleepPage" class="p-2 hover:bg-slate-800 rounded-lg text-slate-400 transition-all ${currentOffset <= 0 ? 'text-slate-700 cursor-not-allowed' : ''}" ${currentOffset <= 0 ? 'disabled' : ''}>
                        <i data-lucide="chevron-right" class="w-4 h-4"></i>
                    </button>
                </div>
            </div>
            
            <div class="flex h-[320px] w-full gap-4 mt-4">
                <div class="w-16 relative h-full border-r-2 border-slate-800 pb-10">
                     <div class="absolute right-2 text-xs font-bold text-cyan-400 font-mono bg-slate-950 px-2 py-0.5 rounded opacity-80" style="top: ${targetBedY}%; transform: translateY(-50%);">
                        ${stateManager.targets.bedTime.ideal}
                     </div>
                     <div class="absolute right-2 text-xs font-bold text-cyan-400 font-mono bg-slate-950 px-2 py-0.5 rounded opacity-80" style="top: ${targetWakeY}%; transform: translateY(-50%);">
                        ${stateManager.targets.wakeTime.ideal}
                     </div>
                </div>

                <div class="flex-1 flex flex-col h-full overflow-hidden">
                    <div class="relative flex-1 w-full bg-slate-900/20 rounded-r-3xl">
                        <div class="absolute w-full border-t border-dashed border-cyan-500/20 z-0 pointer-events-none" style="top: ${targetBedY}%"></div>
                        <div class="absolute w-full border-t border-dashed border-cyan-500/20 z-0 pointer-events-none" style="top: ${targetWakeY}%"></div>
                        <div class="absolute inset-0 flex justify-around gap-2 pt-4 pb-0">
                            ${barsHTML}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        if (window.lucide) window.lucide.createIcons();

        document.getElementById('btnPrevSleepPage')?.addEventListener('click', () => onChangePage(1));
        document.getElementById('btnNextSleepPage')?.addEventListener('click', () => onChangePage(-1));
    }
}
