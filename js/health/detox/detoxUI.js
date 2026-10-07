import DetoxHeatmap from './detoxHeatmap.js';

export default class DetoxUI {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.cacheDOM();
        this.bindEvents();
    }

    cacheDOM() {
        this.dom = {
            dateInput: document.getElementById('detoxDateInput'),
            streakDays: document.getElementById('detoxStreakDays'),
            checklist: document.getElementById('detoxChecklist'),
            detoxProgressDays: document.getElementById('detoxProgressDays'),
            detoxTargetDays: document.getElementById('detoxTargetDays'),
            brainPhaseText: document.getElementById('brainPhaseText'),
            detoxRankText: document.getElementById('detoxRankText'),
            detoxProgressBar: document.getElementById('detoxProgressBar'),
            heatmapMonthLabel: document.getElementById('heatmapMonthLabel'),
            detoxHeatmapGrid: document.getElementById('detoxHeatmapGrid'),
            btnResetDetox: document.getElementById('btnResetDetox')
        };
    }

    bindEvents() {
        if(this.dom.dateInput) {
            this.dom.dateInput.addEventListener('change', (e) => {
                this.loadDate(e.target.value);
            });
        }

        if(this.dom.btnResetDetox) {
            this.dom.btnResetDetox.addEventListener('click', () => {
                if (confirm("Are you sure you want to reset ALL Detox data? This cannot be undone.")) {
                    this.stateManager.resetData();
                }
            });
        }
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
    }

    onStateUpdate() {
        const targetDate = this.dom.dateInput ? this.dom.dateInput.value : null;
        this.loadDate(targetDate);
        this.updateStreak();
        this.updateBrainRecovery();
        this.renderHeatmap();
    }

    loadDate(dateStr) {
        if(!dateStr) return;
        const entry = this.stateManager.getEntry(dateStr);
        this.renderChecklist(entry);
    }

    renderChecklist(entry) {
        if(!this.dom.checklist) return;

        const isHealthLogged = entry.completed.includes("บันทึกข้อมูลสุขภาพ");

        const html = this.stateManager.LOCKED_HABITS.map(habit => {
            const isChecked = entry.completed.includes(habit);
            const isMandatory = habit === "บันทึกข้อมูลสุขภาพ";
            
            const isDisabled = !isMandatory && !isHealthLogged;
            
            const disabledContainerClass = isDisabled ? "opacity-50 grayscale" : "";
            const cursorClass = isDisabled ? "cursor-not-allowed" : "cursor-pointer";
            const borderClass = isChecked ? 'border-cyan-500/50 text-cyan-400' : 'border-slate-800 text-slate-300';
            const bgClass = isChecked ? 'bg-cyan-500 border-cyan-500' : 'bg-slate-950 border-slate-700';
            
            return `
                <div class="flex items-center justify-between p-2 rounded-xl bg-slate-900 border ${borderClass} transition-colors ${disabledContainerClass}">
                    <label class="flex items-center gap-3 flex-1 ${cursorClass}">
                        <div class="relative flex items-center justify-center w-5 h-5 shrink-0 rounded border ${bgClass}">
                            <input type="checkbox" class="opacity-0 absolute inset-0 detox-chk ${cursorClass}" data-habit="${habit}" ${isChecked ? 'checked' : ''} ${isDisabled ? 'disabled' : ''}>
                            ${isChecked ? '<i data-lucide="check" class="w-3 h-3 text-white pointer-events-none"></i>' : ''}
                        </div>
                        <span class="text-sm font-medium leading-tight ${isChecked ? 'line-through opacity-70' : ''}">${habit}</span>
                    </label>
                </div>
            `;
        }).join('');

        this.dom.checklist.innerHTML = html;
        if (window.lucide) window.lucide.createIcons();

        this.dom.checklist.querySelectorAll('.detox-chk').forEach(chk => {
            chk.addEventListener('change', (e) => {
                this.stateManager.toggleHabitCompletion(this.dom.dateInput.value, e.target.dataset.habit, e.target.checked);
            });
        });
    }

    updateStreak() {
        if (!this.dom.streakDays) return;
        const streak = this.stateManager.calculateStreak();
        this.dom.streakDays.innerText = streak;
    }

    updateBrainRecovery() {
        if (!this.dom.detoxProgressBar) return;
        
        const totalExp = this.stateManager.calculateTotalEXP();
        
        let rank = "INITIAL";
        let phase = "Crash & Cravings";
        let targetExp = 39;
        let prevTarget = 0;
        
        if (totalExp >= 1170) {
            rank = "AWAKENED";
            phase = "Sustainable";
            targetExp = Math.max(totalExp, 1170);
            prevTarget = 1170;
        } else if (totalExp >= 780) {
            rank = "MASTER";
            phase = "Full Reset";
            targetExp = 1170;
            prevTarget = 780;
        } else if (totalExp >= 273) {
            rank = "MONK";
            phase = "Deep Rewiring";
            targetExp = 780;
            prevTarget = 273;
        } else if (totalExp >= 91) {
            rank = "WARRIOR";
            phase = "Early Adaptation";
            targetExp = 273;
            prevTarget = 91;
        } else if (totalExp >= 39) {
            rank = "SURVIVOR";
            phase = "Acute Withdrawal";
            targetExp = 91;
            prevTarget = 39;
        }
        
        if (this.dom.detoxProgressDays) this.dom.detoxProgressDays.innerText = totalExp;
        if (this.dom.detoxTargetDays) this.dom.detoxTargetDays.innerText = targetExp;
        if (this.dom.brainPhaseText) this.dom.brainPhaseText.innerText = phase;
        
        let progressInTier = totalExp - prevTarget;
        let tierTotal = targetExp - prevTarget;
        let percentage = 100;
        
        if (tierTotal > 0) {
            percentage = Math.min((progressInTier / tierTotal) * 100, 100);
        }
        
        this.dom.detoxProgressBar.style.width = `${percentage}%`;
        
        if (this.dom.detoxRankText) {
            this.dom.detoxRankText.innerText = rank;
            this.dom.detoxRankText.className = "text-lg font-mono font-bold tracking-widest";
            if (rank === "AWAKENED") this.dom.detoxRankText.classList.add("text-yellow-300", "drop-shadow-[0_0_8px_rgba(253,224,71,0.8)]");
            else if (rank === "MASTER") this.dom.detoxRankText.classList.add("text-cyan-300", "drop-shadow-[0_0_5px_rgba(103,232,249,0.8)]");
            else if (rank === "MONK") this.dom.detoxRankText.classList.add("text-emerald-300");
            else if (rank === "WARRIOR") this.dom.detoxRankText.classList.add("text-emerald-500");
            else if (rank === "SURVIVOR") this.dom.detoxRankText.classList.add("text-teal-600");
            else this.dom.detoxRankText.classList.add("text-slate-400");
        }
    }

    renderHeatmap() {
        DetoxHeatmap.render(this.dom.detoxHeatmapGrid, this.dom.heatmapMonthLabel, this.stateManager);
    }
}
