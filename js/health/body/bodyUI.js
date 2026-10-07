import Utils from '../utils.js';
import BodyChart from './bodyChart.js';

export default class BodyUI {
    constructor(stateManager, onTargetChange) {
        this.stateManager = stateManager;
        this.onTargetChange = onTargetChange;
        this.chartViewDate = new Date();
        this.chartRange = '30d'; // '30d' or 'year'
        
        this.cacheDOM();
        this.bindEvents();
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
            btnRange30d: document.getElementById('btnChartRange30d'),
            btnRangeYear: document.getElementById('btnChartRangeYear'),

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

        if(this.dom.btnRange30d) {
            this.dom.btnRange30d.addEventListener('click', () => this.setChartRange('30d'));
        }
        if(this.dom.btnRangeYear) {
            this.dom.btnRangeYear.addEventListener('click', () => this.setChartRange('year'));
        }

        const updateState = (key, val) => {
            this.stateManager.updateField(key, val);
        };

        if(this.dom.height) this.dom.height.addEventListener('change', (e) => updateState('height', e.target.value));
        if(this.dom.age) this.dom.age.addEventListener('change', (e) => updateState('age', e.target.value));
        if(this.dom.gender) this.dom.gender.addEventListener('change', (e) => updateState('gender', e.target.value));
        if(this.dom.activityLevel) this.dom.activityLevel.addEventListener('change', (e) => updateState('activityLevel', e.target.value));
        if(this.dom.targetWeight) this.dom.targetWeight.addEventListener('change', (e) => updateState('targetWeight', e.target.value));
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
        this.updateInputs();
        const targetDate = this.dom.dateInput?.value;
        this.loadDate(targetDate);
        this.render();
    }

    updateInputs() {
        const state = this.stateManager.state;
        if(this.dom.height) this.dom.height.value = state.height;
        if(this.dom.age) this.dom.age.value = state.age;
        if(this.dom.gender) this.dom.gender.value = state.gender;
        if(this.dom.activityLevel) this.dom.activityLevel.value = state.activityLevel;
        if(this.dom.targetWeight) this.dom.targetWeight.value = state.targetWeight;
    }

    loadDate(dateStr) {
        if(!dateStr) return;
        const entry = this.stateManager.getEntryByDate(dateStr);
        const state = this.stateManager.state;
        
        if(entry) {
            this.dom.weight.value = entry.weight;
            this.dom.btnRecordWeight.innerText = "Update Weight Log";
            this.dom.btnDeleteWeight.classList.remove('hidden');
        } else {
            this.dom.weight.value = state.weight; 
            this.dom.btnRecordWeight.innerText = "Save Weight Log";
            this.dom.btnDeleteWeight.classList.add('hidden');
        }
        this.render();
    }

    recordWeight() {
        const dateStr = this.dom.dateInput.value;
        const currentWeight = Number(this.dom.weight.value);
        
        const success = this.stateManager.recordWeight(dateStr, currentWeight);
        if(!success) return;

        this.loadDate(dateStr); 
        this.chartViewDate = new Date(dateStr);
        
        const originalText = this.dom.btnRecordWeight.innerText;
        this.dom.btnRecordWeight.innerText = "Success!";
        this.dom.btnRecordWeight.classList.add('bg-green-600', 'text-white');
        setTimeout(() => {
            this.dom.btnRecordWeight.innerText = "Update Weight Log";
            this.dom.btnRecordWeight.classList.remove('bg-green-600', 'text-white');
            this.render(); 
        }, 1500);
    }

    deleteWeight() {
        const dateStr = this.dom.dateInput.value;
        this.stateManager.deleteWeight(dateStr);
        this.loadDate(dateStr);
    }

    changeMonth(delta) {
        if (this.chartRange === 'year') {
            this.chartViewDate.setFullYear(this.chartViewDate.getFullYear() + delta);
        } else {
            this.chartViewDate.setMonth(this.chartViewDate.getMonth() + delta);
        }
        this.render();
    }

    setChartRange(range) {
        this.chartRange = range;
        
        if (range === '30d') {
            if (this.dom.btnRange30d) {
                this.dom.btnRange30d.className = 'px-2.5 py-1 rounded-lg text-cyan-400 bg-cyan-500/10 transition-all';
            }
            if (this.dom.btnRangeYear) {
                this.dom.btnRangeYear.className = 'px-2.5 py-1 rounded-lg text-slate-400 hover:text-slate-200 transition-all';
            }
        } else {
            if (this.dom.btnRange30d) {
                this.dom.btnRange30d.className = 'px-2.5 py-1 rounded-lg text-slate-400 hover:text-slate-200 transition-all';
            }
            if (this.dom.btnRangeYear) {
                this.dom.btnRangeYear.className = 'px-2.5 py-1 rounded-lg text-cyan-400 bg-cyan-500/10 transition-all';
            }
        }
        
        this.render();
    }

    render() {
        const state = this.stateManager.state;
        const bmi = Utils.calculateBMI(state.weight, state.height);
        
        let bmiInfo = { label: 'Normal', color: 'text-green-400' };
        if (bmi < 18.5) bmiInfo = { label: 'Underweight', color: 'text-red-400' };
        else if (bmi >= 23 && bmi < 25) bmiInfo = { label: 'Overweight', color: 'text-yellow-400' };
        else if (bmi >= 25 && bmi < 30) bmiInfo = { label: 'Obese', color: 'text-orange-400' };
        else if (bmi >= 30) bmiInfo = { label: 'Extremely Obese', color: 'text-red-400' };

        if(this.dom.bmiValue) this.dom.bmiValue.innerText = isNaN(bmi) ? '-' : bmi.toFixed(1);
        if(this.dom.bmiLabel) {
            this.dom.bmiLabel.innerText = isNaN(bmi) ? '-' : bmiInfo.label;
            this.dom.bmiLabel.className = `text-[10px] font-bold mt-1 uppercase ${bmiInfo.color}`;
        }

        const bmr = Utils.calculateBMR(state.weight, state.height, state.age, state.gender);
        const tdee = Utils.calculateTDEE(bmr, state.activityLevel);

        let targetCal = tdee;

        if (state.targetWeight < state.weight) {
            targetCal = Math.max(1200, tdee - 500);
        } else if (state.targetWeight > state.weight) {
            targetCal = tdee + 500;
        }

        if(this.dom.bmrValue) this.dom.bmrValue.innerText = isNaN(bmr) ? '0' : Math.round(bmr).toLocaleString();
        if(this.dom.tdeeValue) this.dom.tdeeValue.innerText = isNaN(tdee) ? '0' : Math.round(tdee).toLocaleString();
        if(this.dom.targetCalValue) this.dom.targetCalValue.innerText = isNaN(targetCal) ? '0' : Math.round(targetCal).toLocaleString();

        const selectedDate = this.dom.dateInput ? this.dom.dateInput.value : null;
        BodyChart.render(this.dom.weightChartContainer, this.dom, state, this.chartViewDate, this.chartRange, selectedDate);

        if(this.onTargetChange) this.onTargetChange(Math.round(targetCal));
    }
}
