import Utils from './utils.js';

export default class SleepManager {
    constructor(firebaseManager) {
        this.fb = firebaseManager;
        this.state = { history: [] };
        
        this.targets = { 
            duration: { min: 7.5, max: 9.0, ideal: 8.25 },
            bedTime: { min: '21:00', max: '22:00', ideal: '21:30' },
            wakeTime: { min: '05:00', max: '06:00', ideal: '05:30' }
        };
        
        this.viewOffset = 0;

        this.cacheDOM();
        this.bindEvents();
        this.initData(); 
    }

    initData() {
        const getThaiDate = () => {
            const now = new Date();
            const thaiTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));
            const year = thaiTime.getFullYear();
            const month = String(thaiTime.getMonth() + 1).padStart(2, '0');
            const day = String(thaiTime.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        if(this.dom.dateInput) {
            this.dom.dateInput.value = getThaiDate();
        }

        if(this.dom.targetLabel) {
            this.dom.targetLabel.innerText = "7.30 - 9.00";
        }

        this.fb.subscribe('sleep', (data) => {
            if (data) {
                this.state = { ...this.state, ...data };
                if(this.state.history && Array.isArray(this.state.history)) {
                    this.state.history = this.state.history.filter(h => !isNaN(h.duration));
                }
            }
            
            if(this.dom.dateInput) {
                const targetDate = this.dom.dateInput.value || getThaiDate();
                this.loadDate(targetDate);
            }
        });
    }

    saveData() {
        this.fb.saveData('sleep', this.state);
    }

    cacheDOM() {
        this.dom = {
            dateInput: document.getElementById('sleepDateInput'),
            bedTimeInput: document.getElementById('bedTimeInput'),
            wakeTimeInput: document.getElementById('wakeTimeInput'),
            durationText: document.getElementById('sleepDurationText'),
            targetLabel: document.getElementById('sleepDurationText')?.parentNode?.nextElementSibling?.querySelector('span'),
            progressCircle: document.getElementById('sleepProgressCircle'),
            deviations: document.getElementById('sleepDeviations'),
            patternChart: document.getElementById('sleepPatternChart'),
            btnRecord: document.getElementById('btnRecordSleep'),
            btnDelete: document.getElementById('btnDeleteSleep')
        };
    }

    bindEvents() {
        if(this.dom.dateInput) {
            this.dom.dateInput.addEventListener('change', (e) => this.loadDate(e.target.value));
        }

        if(this.dom.btnRecord) {
            this.dom.btnRecord.addEventListener('click', () => this.recordSleep());
        }

        if(this.dom.btnDelete) {
            this.dom.btnDelete.addEventListener('click', () => this.deleteSleep());
        }
        
        const liveUpdate = () => {
             const duration = Utils.calculateDuration(this.dom.bedTimeInput.value, this.dom.wakeTimeInput.value);
             if (!isNaN(duration)) {
                this.updateVisuals(duration, this.dom.bedTimeInput.value, this.dom.wakeTimeInput.value);
             }
        };
        if(this.dom.bedTimeInput) this.dom.bedTimeInput.addEventListener('input', liveUpdate);
        if(this.dom.wakeTimeInput) this.dom.wakeTimeInput.addEventListener('input', liveUpdate);

        if(this.dom.patternChart) {
            this.dom.patternChart.addEventListener('click', (e) => {
                const btn = e.target.closest('button');
                if(!btn) return;
                
                if(btn.id === 'btnPrevPage') {
                    this.changePage(1);
                } else if(btn.id === 'btnNextPage') {
                    this.changePage(-1);
                }
            });
        }
    }

    changePage(delta) {
        this.viewOffset += delta;
        if (this.viewOffset < 0) this.viewOffset = 0;
        this.renderGraph();
    }

    loadDate(dateStr) {
        if(!dateStr) return;
        
        const entry = this.state.history.find(h => h.date === dateStr);
        
        if (entry) {
            this.dom.bedTimeInput.value = entry.bedTime;
            this.dom.wakeTimeInput.value = entry.wakeTime;
            this.dom.btnRecord.innerText = "Update Sleep Log";
            this.dom.btnDelete.classList.remove('hidden');
            this.updateVisuals(entry.duration, entry.bedTime, entry.wakeTime);
        } else {
            this.dom.bedTimeInput.value = this.targets.bedTime.ideal;
            this.dom.wakeTimeInput.value = this.targets.wakeTime.ideal;
            this.dom.btnRecord.innerText = "Save Sleep Log";
            this.dom.btnDelete.classList.add('hidden');
            this.updateVisuals(0, this.targets.bedTime.ideal, this.targets.wakeTime.ideal);
        }
        
        this.renderGraph();
    }

    recordSleep() {
        const dateStr = this.dom.dateInput.value;
        if(!dateStr) return;

        const duration = Utils.calculateDuration(this.dom.bedTimeInput.value, this.dom.wakeTimeInput.value);
        
        if(isNaN(duration)) {
            return;
        }

        this.state.history = this.state.history.filter(h => h.date !== dateStr);
        
        this.state.history.push({ 
            date: dateStr,
            bedTime: this.dom.bedTimeInput.value, 
            wakeTime: this.dom.wakeTimeInput.value, 
            duration: duration 
        });

        this.state.history.sort((a, b) => new Date(a.date) - new Date(b.date));

        this.saveData();
        this.viewOffset = 0; 
        this.loadDate(dateStr); 
        
        const originalText = this.dom.btnRecord.innerText;
        this.dom.btnRecord.innerText = "Success!";
        this.dom.btnRecord.classList.add('bg-green-600', 'text-white');
        setTimeout(() => {
            this.dom.btnRecord.innerText = "Update Sleep Log";
            this.dom.btnRecord.classList.remove('bg-green-600', 'text-white');
        }, 1000);
    }

    deleteSleep() {
        const dateStr = this.dom.dateInput.value;
        this.state.history = this.state.history.filter(h => h.date !== dateStr);
        this.saveData();
        this.loadDate(dateStr);
    }

    updateVisuals(duration, bedTime, wakeTime) {
        if(isNaN(duration)) duration = 0;
        
        const hours = Math.floor(duration);
        const minutes = Math.round((duration - hours) * 60);
        const minutesStr = minutes.toString().padStart(2, '0');
        if(this.dom.durationText) this.dom.durationText.innerText = `${hours}.${minutesStr}`;
        
        if(this.dom.progressCircle) {
            const circumference = 251.2;
            const offset = circumference - (Math.min(duration/10, 1) * circumference);
            this.dom.progressCircle.style.strokeDashoffset = offset;
            
            const isDurationHealthy = duration >= this.targets.duration.min && duration <= this.targets.duration.max;
            this.dom.progressCircle.style.stroke = isDurationHealthy ? '#22c55e' : '#ef4444';
        }

        const calculateStats = (value, min, max, ideal) => {
            const isInRange = value >= min && value <= max;
            const deviation = ((value - ideal) / ideal) * 100;
            return { isInRange, deviation };
        };

        const durStats = calculateStats(duration, this.targets.duration.min, this.targets.duration.max, this.targets.duration.ideal);

        const getMins = (t) => {
            const [h, m] = t.split(':').map(Number);
            let mins = h * 60 + m;
            if (mins < 720) mins += 1440; 
            return mins;
        };
        
        const bedTimeMins = getMins(bedTime);
        const bedMin = getMins(this.targets.bedTime.min);
        const bedMax = getMins(this.targets.bedTime.max);
        const bedIdeal = getMins(this.targets.bedTime.ideal);
        const bedStats = calculateStats(bedTimeMins, bedMin, bedMax, bedIdeal);

        const getWakeMins = (t) => {
            const [h, m] = t.split(':').map(Number);
            return h * 60 + m;
        };
        
        const wakeTimeMins = getWakeMins(wakeTime);
        const wakeMin = getWakeMins(this.targets.wakeTime.min);
        const wakeMax = getWakeMins(this.targets.wakeTime.max);
        const wakeIdeal = getWakeMins(this.targets.wakeTime.ideal);
        const wakeStats = calculateStats(wakeTimeMins, wakeMin, wakeMax, wakeIdeal);

        const renderBar = (label, stats) => {
            const isPositive = stats.deviation >= 0;
            const displayVal = isNaN(stats.deviation) ? 0 : Math.abs(stats.deviation);
            const width = Math.min(displayVal * 2, 50);
            
            const textColor = stats.isInRange ? 'text-green-400' : 'text-red-400';
            const barColor = stats.isInRange ? 'bg-green-500' : 'bg-red-500';
            
            const barStyle = isPositive ? `ml-auto mr-[50%]` : `mr-auto ml-[50%]`;
            const sign = stats.deviation > 0 ? '+' : stats.deviation < 0 ? '-' : '';

            return `
                <div class="mb-4">
                    <div class="flex justify-between text-sm mb-2 text-slate-400 font-bold">
                        <span>${label}</span>
                        <span class="font-mono text-base ${textColor}">
                            ${sign}${displayVal.toFixed(1)}%
                        </span>
                    </div>
                    <div class="relative h-3 bg-slate-800 rounded-full overflow-hidden flex items-center justify-center">
                        <div class="absolute w-[1px] h-full bg-slate-600 z-10"></div>
                        <div class="h-full rounded-full ${barColor} ${barStyle}" style="width: ${width}%"></div>
                    </div>
                </div>
            `;
        };

        if(this.dom.deviations) {
            this.dom.deviations.innerHTML = `
                <h4 class="text-sm uppercase tracking-wider text-slate-300 font-bold mb-5 flex items-center gap-2">
                    <i data-lucide="percent" class="w-5 h-5 text-cyan-400"></i>Sleep Deviation
                </h4>
                ${renderBar("Sleep Duration", durStats)}
                ${renderBar("Bedtime", bedStats)}
                ${renderBar("Wake-up Time", wakeStats)}
            `;
            if (window.lucide) window.lucide.createIcons();
        }
    }

    renderGraph() {
        if(!this.dom.patternChart) return;

        const sortedHistory = [...this.state.history].sort((a,b) => new Date(a.date) - new Date(b.date));
        const totalRecords = sortedHistory.length;
        const pageSize = 7;
        const totalPages = Math.ceil(totalRecords / pageSize) || 1;

        if (this.viewOffset >= totalPages) this.viewOffset = totalPages - 1;
        if (this.viewOffset < 0) this.viewOffset = 0;

        const currentPageIndex = Math.max(0, (totalPages - 1) - this.viewOffset);
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
            normalizeTime(this.targets.bedTime.ideal),
            normalizeTime(this.targets.wakeTime.ideal)
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

        const targetBedY = timeToPercent(this.targets.bedTime.ideal);
        const targetWakeY = timeToPercent(this.targets.wakeTime.ideal);
        const selectedDate = this.dom.dateInput.value;

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

        this.dom.patternChart.innerHTML = `
            <div class="flex justify-between items-center mb-6">
                <h4 class="text-sm uppercase tracking-wider text-slate-300 font-bold flex items-center gap-2">
                    <i data-lucide="history" class="w-5 h-5 text-cyan-400"></i> Sleep History (${rawPageData.length}/${totalRecords})
                </h4>
                <div class="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl p-1">
                    <button id="btnPrevPage" class="p-2 hover:bg-slate-800 rounded-lg text-slate-400 transition-all ${this.viewOffset >= totalPages - 1 ? 'text-slate-700 cursor-not-allowed' : ''}" ${this.viewOffset >= totalPages - 1 ? 'disabled' : ''}>
                        <i data-lucide="chevron-left" class="w-4 h-4"></i>
                    </button>
                    <span class="text-sm font-bold text-slate-300 px-3 min-w-[100px] text-center">
                        ${rangeLabel}
                    </span>
                    <button id="btnNextPage" class="p-2 hover:bg-slate-800 rounded-lg text-slate-400 transition-all ${this.viewOffset <= 0 ? 'text-slate-700 cursor-not-allowed' : ''}" ${this.viewOffset <= 0 ? 'disabled' : ''}>
                        <i data-lucide="chevron-right" class="w-4 h-4"></i>
                    </button>
                </div>
            </div>
            
            <div class="flex h-[320px] w-full gap-4 mt-4">
                <div class="w-16 relative h-full border-r-2 border-slate-800 pb-10">
                     <div class="absolute right-2 text-xs font-bold text-cyan-400 font-mono bg-slate-950 px-2 py-0.5 rounded opacity-80" style="top: ${targetBedY}%; transform: translateY(-50%);">
                        ${this.targets.bedTime.ideal}
                     </div>
                     <div class="absolute right-2 text-xs font-bold text-cyan-400 font-mono bg-slate-950 px-2 py-0.5 rounded opacity-80" style="top: ${targetWakeY}%; transform: translateY(-50%);">
                        ${this.targets.wakeTime.ideal}
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
    }
}
