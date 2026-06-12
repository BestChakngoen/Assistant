import Utils from './utils.js';

export default class BodyManager {
    constructor(firebaseManager, onTargetChange) {
        this.fb = firebaseManager;
        this.state = {
            weight: 65, 
            height: 170, 
            age: 28, 
            gender: 'male', 
            activityLevel: 1.2, 
            targetWeight: 60, 
            weightHistory: [] 
        };
        this.chartViewDate = new Date(); 

        this.onTargetChange = onTargetChange;
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

        this.fb.subscribe('body', (data) => {
            if (data) {
                this.state = { ...this.state, ...data };
                if(this.state.weightHistory && Array.isArray(this.state.weightHistory)) {
                    this.state.weightHistory = this.state.weightHistory.filter(h => !isNaN(h.weight));
                }
                this.updateInputs();
            }
            
            if(this.dom.dateInput) {
                const targetDate = this.dom.dateInput.value || getThaiDate();
                this.loadDate(targetDate);
            }
            
            this.render();
        });
    }

    saveData() {
        this.fb.saveData('body', this.state);
    }

    updateInputs() {
        if(this.dom.height) this.dom.height.value = this.state.height;
        if(this.dom.age) this.dom.age.value = this.state.age;
        if(this.dom.gender) this.dom.gender.value = this.state.gender;
        if(this.dom.activityLevel) this.dom.activityLevel.value = this.state.activityLevel;
        if(this.dom.targetWeight) this.dom.targetWeight.value = this.state.targetWeight;
    }

    cacheDOM() {
        this.dom = {
            dateInput: document.getElementById('bodyDateInput'),
            weight: document.getElementById('weightInput'),
            btnRecordWeight: document.getElementById('btnRecordWeight'),
            btnDeleteWeight: document.getElementById('btnDeleteWeight'),
            height: document.getElementById('heightInput'),
            age: document.getElementById('ageInput'),
            gender: document.getElementById('genderInput'),
            activityLevel: document.getElementById('activityLevelInput'),
            targetWeight: document.getElementById('targetWeightInput'),
            
            weightChartContainer: document.getElementById('weightChartContainer'),
            btnPrevMonth: document.getElementById('btnPrevMonth'),
            btnNextMonth: document.getElementById('btnNextMonth'),
            chartMonthLabel: document.getElementById('chartMonthLabel'),

            bmiValue: document.getElementById('bmiValue'),
            bmiLabel: document.getElementById('bmiLabel'),
            bmrValue: document.getElementById('bmrValue'),
            tdeeValue: document.getElementById('tdeeValue'), 
            targetCalValue: document.getElementById('targetCalValue'),
            targetIndicator: document.getElementById('targetIndicator')
        };
    }

    bindEvents() {
        if(this.dom.dateInput) {
            this.dom.dateInput.addEventListener('change', (e) => this.loadDate(e.target.value));
        }

        if(this.dom.btnRecordWeight) {
            this.dom.btnRecordWeight.addEventListener('click', () => this.recordWeight());
        }

        if(this.dom.btnDeleteWeight) {
            this.dom.btnDeleteWeight.addEventListener('click', () => this.deleteWeight());
        }

        if(this.dom.btnPrevMonth) {
            this.dom.btnPrevMonth.addEventListener('click', () => this.changeMonth(-1));
        }
        if(this.dom.btnNextMonth) {
            this.dom.btnNextMonth.addEventListener('click', () => this.changeMonth(1));
        }

        const updateState = (key, val) => {
            this.state[key] = key === 'gender' ? val : Number(val);
            this.saveData();
            this.render(); 
        };

        if(this.dom.height) this.dom.height.addEventListener('change', (e) => updateState('height', e.target.value));
        if(this.dom.age) this.dom.age.addEventListener('change', (e) => updateState('age', e.target.value));
        if(this.dom.gender) this.dom.gender.addEventListener('change', (e) => updateState('gender', e.target.value));
        if(this.dom.activityLevel) this.dom.activityLevel.addEventListener('change', (e) => updateState('activityLevel', e.target.value));
        if(this.dom.targetWeight) this.dom.targetWeight.addEventListener('change', (e) => updateState('targetWeight', e.target.value));
    }

    loadDate(dateStr) {
        if(!dateStr) return;
        const entry = this.state.weightHistory?.find(h => h.date === dateStr);
        
        if(entry) {
            this.dom.weight.value = entry.weight;
            this.dom.btnRecordWeight.innerText = "อัปเดตน้ำหนัก";
            this.dom.btnDeleteWeight.classList.remove('hidden');
        } else {
            this.dom.weight.value = this.state.weight; 
            this.dom.btnRecordWeight.innerText = "บันทึกน้ำหนัก";
            this.dom.btnDeleteWeight.classList.add('hidden');
        }
        this.render();
    }

    recordWeight() {
        const dateStr = this.dom.dateInput.value;
        const currentWeight = Number(this.dom.weight.value);
        if(!currentWeight || isNaN(currentWeight) || !dateStr) return;

        this.state.weightHistory = this.state.weightHistory || [];
        this.state.weightHistory = this.state.weightHistory.filter(h => h.date !== dateStr);
        this.state.weightHistory.push({ date: dateStr, weight: currentWeight });
        
        this.state.weightHistory.sort((a, b) => new Date(a.date) - new Date(b.date));

        const lastEntry = this.state.weightHistory[this.state.weightHistory.length - 1];
        if(lastEntry) this.state.weight = lastEntry.weight;

        this.saveData();
        this.loadDate(dateStr); 
        
        this.chartViewDate = new Date(dateStr);
        
        const originalText = this.dom.btnRecordWeight.innerText;
        this.dom.btnRecordWeight.innerText = "เรียบร้อย!";
        this.dom.btnRecordWeight.classList.add('bg-green-600', 'text-white');
        setTimeout(() => {
            this.dom.btnRecordWeight.innerText = "อัปเดตน้ำหนัก";
            this.dom.btnRecordWeight.classList.remove('bg-green-600', 'text-white');
            this.render(); 
        }, 1500);
    }

    deleteWeight() {
        const dateStr = this.dom.dateInput.value;

        this.state.weightHistory = this.state.weightHistory.filter(h => h.date !== dateStr);
        
        const lastEntry = this.state.weightHistory[this.state.weightHistory.length - 1];
        if(lastEntry) this.state.weight = lastEntry.weight;

        this.saveData();
        this.loadDate(dateStr);
    }

    changeMonth(delta) {
        this.chartViewDate.setMonth(this.chartViewDate.getMonth() + delta);
        this.renderWeightChart();
    }

    render() {
        const bmi = Utils.calculateBMI(this.state.weight, this.state.height);
        
        let bmiInfo = { label: 'ปกติ', color: 'text-green-400' };
        if (bmi < 18.5) bmiInfo = { label: 'ผอม', color: 'text-red-400' };
        else if (bmi >= 23 && bmi < 25) bmiInfo = { label: 'ท้วม', color: 'text-yellow-400' };
        else if (bmi >= 25 && bmi < 30) bmiInfo = { label: 'อ้วน', color: 'text-orange-400' };
        else if (bmi >= 30) bmiInfo = { label: 'อ้วนมาก', color: 'text-red-400' };

        if(this.dom.bmiValue) this.dom.bmiValue.innerText = isNaN(bmi) ? '-' : bmi.toFixed(1);
        if(this.dom.bmiLabel) {
            this.dom.bmiLabel.innerText = isNaN(bmi) ? '-' : bmiInfo.label;
            this.dom.bmiLabel.className = `text-[10px] font-bold mt-1 uppercase ${bmiInfo.color}`;
        }

        const bmr = Utils.calculateBMR(this.state.weight, this.state.height, this.state.age, this.state.gender);
        const tdee = Utils.calculateTDEE(bmr, this.state.activityLevel);

        let targetCal = tdee;

        if (this.state.targetWeight < this.state.weight) {
            targetCal = Math.max(1200, tdee - 500);
        } else if (this.state.targetWeight > this.state.weight) {
            targetCal = tdee + 500;
        }

        if(this.dom.bmrValue) this.dom.bmrValue.innerText = isNaN(bmr) ? '0' : Math.round(bmr).toLocaleString();
        if(this.dom.tdeeValue) this.dom.tdeeValue.innerText = isNaN(tdee) ? '0' : Math.round(tdee).toLocaleString();
        if(this.dom.targetCalValue) this.dom.targetCalValue.innerText = isNaN(targetCal) ? '0' : Math.round(targetCal).toLocaleString();

        this.renderWeightChart();

        if(this.onTargetChange) this.onTargetChange(Math.round(targetCal));
    }

    renderWeightChart() {
        if (!this.dom.weightChartContainer) return;

        const viewYear = this.chartViewDate.getFullYear();
        const viewMonth = this.chartViewDate.getMonth();
        
        const monthNames = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
        if(this.dom.chartMonthLabel) {
            this.dom.chartMonthLabel.innerText = `${monthNames[viewMonth]} ${viewYear + 543}`;
        }

        const monthlyData = (this.state.weightHistory || []).filter(h => {
            if(isNaN(h.weight)) return false;
            const d = new Date(h.date);
            return d.getFullYear() === viewYear && d.getMonth() === viewMonth;
        });

        const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
        let minDay = 1;
        let maxDay = daysInMonth;
        
        if (monthlyData.length > 1) {
             const days = monthlyData.map(d => new Date(d.date).getDate());
             minDay = Math.min(...days);
             maxDay = Math.max(...days);
        } else if (monthlyData.length === 1) {
             const day = new Date(monthlyData[0].date).getDate();
             minDay = Math.max(1, day - 2);
             maxDay = Math.min(daysInMonth, day + 2);
        }
        
        if (maxDay === minDay) {
            minDay = Math.max(1, minDay - 1);
            maxDay = Math.min(daysInMonth, maxDay + 1);
        }

        const xRange = maxDay - minDay;

        let minW, maxW;
        if(monthlyData.length > 0) {
            const weights = monthlyData.map(d => d.weight);
            minW = Math.min(...weights, this.state.targetWeight) - 2;
            maxW = Math.max(...weights, this.state.targetWeight) + 2;
        } else {
            minW = this.state.targetWeight - 5;
            maxW = this.state.targetWeight + 5;
        }
        const yRange = maxW - minW || 1;

        monthlyData.sort((a,b) => new Date(a.date) - new Date(b.date));

        const points = monthlyData.map(d => {
            const day = new Date(d.date).getDate();
            const x = ((day - minDay) / xRange) * 100;
            const y = 100 - ((d.weight - minW) / yRange) * 100;
            return `${x},${y}`;
        }).join(' ');

        const targetY = 100 - ((this.state.targetWeight - minW) / yRange) * 100;
        const clampedTargetY = Math.min(Math.max(targetY, 0), 100);

        const dots = monthlyData.map(d => {
            const day = new Date(d.date).getDate();
            const x = ((day - minDay) / xRange) * 100;
            const y = 100 - ((d.weight - minW) / yRange) * 100;
            const isSelected = d.date === this.dom.dateInput.value;
            
            return `
                <div class="absolute w-3 h-3 rounded-full border border-white ${isSelected ? 'w-4 h-4 z-10 ring-2 ring-cyan-500' : ''} group hover:scale-150 transition-transform cursor-pointer"
                     style="left: ${x}%; top: ${y}%; transform: translate(-50%, -50%); background-color: #06b6d4;"
                     title="วันที่ ${day}: ${d.weight}kg">
                </div>
            `;
        }).join('');

        this.dom.weightChartContainer.innerHTML = `
            <div class="relative h-full w-full">
                <div class="absolute w-full border-t-2 border-dashed border-green-500/50 z-0" style="top: ${clampedTargetY}%;">
                    <span class="absolute right-0 -top-5 text-xs text-green-400 font-bold bg-slate-950/80 px-2 py-0.5 rounded">เป้า ${this.state.targetWeight}</span>
                </div>
                
                <svg class="absolute inset-0 w-full h-full z-0 overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
                    <polyline points="${points}" fill="none" style="stroke: #06b6d4;" stroke-width="3" vector-effect="non-scaling-stroke" />
                </svg>

                ${dots}

                <div class="absolute -bottom-6 w-full flex justify-between text-xs text-slate-500 font-medium">
                    <span>${minDay}</span>
                    <span>${monthlyData.length > 0 ? 'ช่วงข้อมูล' : 'ไม่มีข้อมูล'}</span>
                    <span>${maxDay}</span>
                </div>
            </div>
        `;
        
        if (window.lucide) window.lucide.createIcons();
    }
}
