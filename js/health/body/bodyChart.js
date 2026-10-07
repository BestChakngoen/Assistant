export default class BodyChart {
    static render(container, dom, state, chartViewDate, chartRange, selectedDate) {
        if (!container) return;

        const viewYear = chartViewDate.getFullYear();
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        
        let chartData = [];
        let xTicks = [];
        let points = '';
        let areaPoints = '';
        let dots = '';
        let xLabels = '';
        let minW = state.targetWeight - 4;
        let maxW = state.targetWeight + 4;

        // Toggle Month Navigator buttons visibility and text based on chartRange
        if (chartRange === '30d') {
            if (dom.btnPrevMonth) dom.btnPrevMonth.classList.add('invisible');
            if (dom.btnNextMonth) dom.btnNextMonth.classList.add('invisible');
            if (dom.chartMonthLabel) {
                dom.chartMonthLabel.innerText = "Last 30 Days";
            }

            const sortedHistory = [...(state.weightHistory || [])]
                .filter(h => !isNaN(h.weight) && h.date)
                .sort((a, b) => new Date(a.date) - new Date(b.date));
            
            chartData = sortedHistory.slice(-30);

            if (chartData.length > 0) {
                const weights = chartData.map(d => d.weight);
                minW = Math.min(...weights, state.targetWeight) - 1.5;
                maxW = Math.max(...weights, state.targetWeight) + 1.5;
            }
            const yRange = maxW - minW || 1;

            points = chartData.map((d, index) => {
                const x = 8 + (index / (chartData.length - 1 || 1)) * 90;
                const y = 10 + (1 - (d.weight - minW) / yRange) * 70;
                return `${x},${y}`;
            }).join(' ');

            if (chartData.length > 0) {
                const firstX = 8;
                const lastX = 98;
                areaPoints = `${firstX},80 ${points} ${lastX},80`;
            }

            if (chartData.length > 0) {
                const step = (chartData.length - 1) / 4;
                for (let i = 0; i <= 4; i++) {
                    const index = Math.round(i * step);
                    if (chartData[index]) {
                        const d = new Date(chartData[index].date);
                        const label = `${d.getDate()} ${monthNames[d.getMonth()]}`;
                        const xPos = 8 + (index / (chartData.length - 1 || 1)) * 90;
                        xTicks.push({ label: label, x: xPos });
                    }
                }
            }
        } else {
            if (dom.btnPrevMonth) dom.btnPrevMonth.classList.remove('invisible');
            if (dom.btnNextMonth) dom.btnNextMonth.classList.remove('invisible');
            if (dom.chartMonthLabel) {
                dom.chartMonthLabel.innerText = `Year ${viewYear}`;
            }

            chartData = [...(state.weightHistory || [])]
                .filter(h => {
                    if (isNaN(h.weight) || !h.date) return false;
                    const d = new Date(h.date);
                    return d.getFullYear() === viewYear;
                })
                .sort((a, b) => new Date(a.date) - new Date(b.date));

            if (chartData.length > 0) {
                const weights = chartData.map(d => d.weight);
                minW = Math.min(...weights, state.targetWeight) - 1.5;
                maxW = Math.max(...weights, state.targetWeight) + 1.5;
            }
            const yRange = maxW - minW || 1;

            const startOfYear = new Date(viewYear, 0, 1);
            const endOfYear = new Date(viewYear, 11, 31);
            const totalMs = endOfYear - startOfYear || 1;

            points = chartData.map(d => {
                const dateVal = new Date(d.date);
                const msPassed = dateVal - startOfYear;
                const x = 8 + (msPassed / totalMs) * 90;
                const y = 10 + (1 - (d.weight - minW) / yRange) * 70;
                return `${x},${y}`;
            }).join(' ');

            if (chartData.length > 0) {
                const firstDate = new Date(chartData[0].date);
                const firstX = 8 + ((firstDate - startOfYear) / totalMs) * 90;
                const lastDate = new Date(chartData[chartData.length - 1].date);
                const lastX = 8 + ((lastDate - startOfYear) / totalMs) * 90;
                areaPoints = `${firstX},80 ${points} ${lastX},80`;
            }

            xTicks = [
                { label: 'Jan', x: 8 },
                { label: 'Apr', x: 30.5 },
                { label: 'Jul', x: 53 },
                { label: 'Oct', x: 75.5 },
                { label: 'Dec', x: 98 }
            ];
        }

        const yRange = maxW - minW || 1;
        const targetY = 10 + (1 - (state.targetWeight - minW) / yRange) * 70;
        const clampedTargetY = Math.min(Math.max(targetY, 10), 80);

        const gridLines = `
            <!-- Horizontal Grid Lines -->
            <line x1="8" y1="10" x2="98" y2="10" stroke="#1e293b" stroke-width="0.75" stroke-dasharray="2 2" />
            <line x1="8" y1="45" x2="98" y2="45" stroke="#1e293b" stroke-width="0.75" stroke-dasharray="2 2" />
            <line x1="8" y1="80" x2="98" y2="80" stroke="#1e293b" stroke-width="0.75" stroke-dasharray="2 2" />
            
            <!-- Vertical Grid Lines -->
            ${xTicks.map(t => `<line x1="${t.x}" y1="10" x2="${t.x}" y2="80" stroke="#1e293b" stroke-width="0.5" stroke-opacity="0.3" />`).join('')}
        `;

        dots = chartData.map((d, index) => {
            let x;
            if (chartRange === '30d') {
                x = 8 + (index / (chartData.length - 1 || 1)) * 90;
            } else {
                const dateVal = new Date(d.date);
                const startOfYear = new Date(viewYear, 0, 1);
                const endOfYear = new Date(viewYear, 11, 31);
                const totalMs = endOfYear - startOfYear || 1;
                x = 8 + ((dateVal - startOfYear) / totalMs) * 90;
            }
            const y = 10 + (1 - (d.weight - minW) / yRange) * 70;
            const isSelected = d.date === selectedDate;
            const tooltipClass = y < 35 ? 'top-6' : 'bottom-6';

            const dateLabel = new Date(d.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: '2-digit' });

            return `
                <div class="absolute w-3 h-3 rounded-full border-2 border-slate-950 shadow-md group hover:scale-150 transition-all duration-300 cursor-pointer flex items-center justify-center animate-fade-in"
                     style="left: ${x}%; top: ${y}%; transform: translate(-50%, -50%); background-color: #06b6d4;"
                     onclick="document.getElementById('bodyDateInput').value = '${d.date}'; document.getElementById('bodyDateInput').dispatchEvent(new Event('change'));"
                     title="Date ${dateLabel}: ${d.weight} kg">
                     ${isSelected ? '<span class="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>' : ''}
                     <div class="absolute ${tooltipClass} left-1/2 -translate-x-1/2 scale-0 group-hover:scale-100 transition-all duration-200 bg-slate-950/95 border border-slate-800 text-[10px] font-mono font-bold text-slate-200 px-2 py-1 rounded shadow-xl pointer-events-none whitespace-nowrap z-50">
                         ${d.weight} kg (${dateLabel})
                     </div>
                </div>
            `;
        }).join('');

        const yLabels = `
            <div class="absolute left-0 text-[8px] font-mono text-slate-500 -translate-y-1/2" style="top: 10%;">${maxW.toFixed(1)}</div>
            <div class="absolute left-0 text-[8px] font-mono text-slate-500 -translate-y-1/2" style="top: 45%;">${((minW + maxW) / 2).toFixed(1)}</div>
            <div class="absolute left-0 text-[8px] font-mono text-slate-500 -translate-y-1/2" style="top: 80%;">${minW.toFixed(1)}</div>
        `;

        xLabels = xTicks.map(t => `
            <div class="absolute text-[8px] font-mono text-slate-500 -translate-x-1/2 mt-1" style="left: ${t.x}%; top: 82%;">
                ${t.label}
            </div>
        `).join('');

        container.innerHTML = `
            <div class="relative h-full w-full animate-fade-in">
                <div class="absolute w-full z-0" style="top: ${clampedTargetY}%;">
                    <div class="border-t-2 border-dashed border-green-500/50 w-[98%] ml-[2%]"></div>
                    <span class="absolute right-[2%] -top-4.5 text-[8px] text-green-400 font-bold bg-slate-950/90 border border-green-500/20 px-1.5 py-0.5 rounded shadow-sm font-mono">Target ${state.targetWeight}</span>
                </div>
                
                <div class="absolute left-0 -top-3 text-[8px] font-mono text-slate-600">kg</div>

                <svg class="absolute inset-0 w-full h-full z-0 overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
                    <defs>
                        <linearGradient id="weightAreaGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stop-color="#06b6d4" stop-opacity="0.25"/>
                            <stop offset="100%" stop-color="#06b6d4" stop-opacity="0.0"/>
                        </linearGradient>
                    </defs>
                    
                    ${gridLines}
                    ${areaPoints ? `<polygon points="${areaPoints}" fill="url(#weightAreaGrad)" />` : ''}
                    ${points ? `<polyline points="${points}" fill="none" style="stroke: #06b6d4;" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke" />` : ''}
                </svg>

                ${yLabels}
                ${xLabels}
                ${dots}
            </div>
        `;
        
        if (window.lucide) window.lucide.createIcons();
    }
}
