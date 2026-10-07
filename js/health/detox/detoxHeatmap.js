export default class DetoxHeatmap {
    static render(container, monthLabelElement, stateManager) {
        if (!container) return;
        
        const now = new Date();
        const year = now.getFullYear();
        
        if (monthLabelElement) {
            monthLabelElement.innerText = `${year}`;
        }
        
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31);
        const startDayOfWeek = startDate.getDay();
        
        let html = '';
        
        for (let i = 0; i < startDayOfWeek; i++) {
            html += `<div class="w-2.5 h-2.5 rounded-[2px] bg-transparent"></div>`;
        }
        
        const todayStr = `${year}-${String(now.getMonth()+1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        
        let currentDate = new Date(startDate);
        const monthPositions = {};
        let dayCounter = startDayOfWeek;
        
        while (currentDate <= endDate) {
            const m = currentDate.getMonth();
            const d = currentDate.getDate();
            const dateStr = `${year}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            
            if (d === 1) {
                monthPositions[m] = Math.floor(dayCounter / 7);
            }
            
            const entry = stateManager.state.history.find(h => h.date === dateStr);
            let earned = 0;
            if (entry && entry.completed && entry.completed.includes("บันทึกข้อมูลสุขภาพ")) {
                entry.completed.forEach(habit => {
                    if (stateManager.HABIT_POINTS[habit]) earned += stateManager.HABIT_POINTS[habit];
                });
            }
            
            let colorClass = "bg-slate-800 border-slate-700"; 
            if (earned >= 1 && earned <= 3) colorClass = "bg-emerald-900/60 border-emerald-900";
            else if (earned >= 4 && earned <= 6) colorClass = "bg-emerald-800 border-emerald-700";
            else if (earned >= 7 && earned <= 9) colorClass = "bg-emerald-600 border-emerald-500";
            else if (earned >= 10 && earned <= 12) colorClass = "bg-emerald-400 border-emerald-300";
            else if (earned >= 13) colorClass = "bg-green-300 border-green-200 shadow-[0_0_5px_rgba(134,239,172,0.6)] z-10";
            
            const isFuture = currentDate > now;
            if (isFuture) colorClass = "bg-slate-900/50 border-slate-800/50";
            
            const isToday = dateStr === todayStr;
            const outlineClass = isToday ? "ring-1 ring-white/70 ring-offset-1 ring-offset-slate-950" : "";
            
            html += `<div class="w-2.5 h-2.5 rounded-[2px] border ${colorClass} ${outlineClass} transition-colors" title="${dateStr}: ${earned} pts"></div>`;
            
            currentDate.setDate(currentDate.getDate() + 1);
            dayCounter++;
        }
        
        container.innerHTML = html;
        
        const monthsRow = document.getElementById('heatmapMonthsRow');
        if (monthsRow) {
            const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            let monthsHtml = '';
            Object.keys(monthPositions).forEach(m => {
                const colIdx = monthPositions[m];
                const leftPos = colIdx * 14; 
                monthsHtml += `<span class="absolute" style="left: ${leftPos}px;">${monthNames[m]}</span>`;
            });
            monthsRow.innerHTML = monthsHtml;
        }
    }
}
