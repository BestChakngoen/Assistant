import Utils from '../utils.js';
import SleepChart from './sleepChart.js';

export default class SleepUI {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.viewOffset = 0;
        
        this.cacheDOM();
        this.bindEvents();
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
    }

    initDate() {
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
    }

    onStateUpdate() {
        const targetDate = this.dom.dateInput ? this.dom.dateInput.value : null;
        this.loadDate(targetDate);
    }

    changePage(delta) {
        this.viewOffset += delta;
        if (this.viewOffset < 0) this.viewOffset = 0;
        this.renderGraph();
    }

    loadDate(dateStr) {
        if(!dateStr) return;
        
        const entry = this.stateManager.getEntry(dateStr);
        
        if (entry) {
            this.dom.bedTimeInput.value = entry.bedTime;
            this.dom.wakeTimeInput.value = entry.wakeTime;
            this.dom.btnRecord.innerText = "Update Sleep Log";
            this.dom.btnDelete.classList.remove('hidden');
            this.updateVisuals(entry.duration, entry.bedTime, entry.wakeTime);
        } else {
            this.dom.bedTimeInput.value = this.stateManager.targets.bedTime.ideal;
            this.dom.wakeTimeInput.value = this.stateManager.targets.wakeTime.ideal;
            this.dom.btnRecord.innerText = "Save Sleep Log";
            this.dom.btnDelete.classList.add('hidden');
            this.updateVisuals(0, this.stateManager.targets.bedTime.ideal, this.stateManager.targets.wakeTime.ideal);
        }
        
        this.renderGraph();
    }

    recordSleep() {
        const dateStr = this.dom.dateInput.value;
        if(!dateStr) return;

        const duration = Utils.calculateDuration(this.dom.bedTimeInput.value, this.dom.wakeTimeInput.value);
        
        const success = this.stateManager.recordSleep(dateStr, this.dom.bedTimeInput.value, this.dom.wakeTimeInput.value, duration);
        if(!success) return;

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
        this.stateManager.deleteSleep(dateStr);
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
            
            const isDurationHealthy = duration >= this.stateManager.targets.duration.min && duration <= this.stateManager.targets.duration.max;
            this.dom.progressCircle.style.stroke = isDurationHealthy ? '#22c55e' : '#ef4444';
        }

        const calculateStats = (value, min, max, ideal) => {
            const isInRange = value >= min && value <= max;
            const deviation = ((value - ideal) / ideal) * 100;
            return { isInRange, deviation };
        };

        const durStats = calculateStats(duration, this.stateManager.targets.duration.min, this.stateManager.targets.duration.max, this.stateManager.targets.duration.ideal);

        const getMins = (t) => {
            const [h, m] = t.split(':').map(Number);
            let mins = h * 60 + m;
            if (mins < 720) mins += 1440; 
            return mins;
        };
        
        const bedTimeMins = getMins(bedTime);
        const bedMin = getMins(this.stateManager.targets.bedTime.min);
        const bedMax = getMins(this.stateManager.targets.bedTime.max);
        const bedIdeal = getMins(this.stateManager.targets.bedTime.ideal);
        const bedStats = calculateStats(bedTimeMins, bedMin, bedMax, bedIdeal);

        const getWakeMins = (t) => {
            const [h, m] = t.split(':').map(Number);
            return h * 60 + m;
        };
        
        const wakeTimeMins = getWakeMins(wakeTime);
        const wakeMin = getWakeMins(this.stateManager.targets.wakeTime.min);
        const wakeMax = getWakeMins(this.stateManager.targets.wakeTime.max);
        const wakeIdeal = getWakeMins(this.stateManager.targets.wakeTime.ideal);
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
        const selectedDate = this.dom.dateInput ? this.dom.dateInput.value : null;
        SleepChart.render(this.dom.patternChart, this.stateManager, this.viewOffset, selectedDate, (delta) => this.changePage(delta));
    }
}
