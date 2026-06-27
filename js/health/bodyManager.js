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
        this.chartRange = '30d'; // '30d' or 'year'

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
            this.dom.btnRecordWeight.innerText = "Update Weight Log";
            this.dom.btnDeleteWeight.classList.remove('hidden');
        } else {
            this.dom.weight.value = this.state.weight; 
            this.dom.btnRecordWeight.innerText = "Save Weight Log";
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

        this.state.weightHistory = this.state.weightHistory.filter(h => h.date !== dateStr);
        
        const lastEntry = this.state.weightHistory[this.state.weightHistory.length - 1];
        if(lastEntry) this.state.weight = lastEntry.weight;

        this.saveData();
        this.loadDate(dateStr);
    }

    changeMonth(delta) {
        if (this.chartRange === 'year') {
            this.chartViewDate.setFullYear(this.chartViewDate.getFullYear() + delta);
        } else {
            this.chartViewDate.setMonth(this.chartViewDate.getMonth() + delta);
        }
        this.renderWeightChart();
    }

    setChartRange(range) {
        this.chartRange = range;
        
        // Update range button active styles
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
        
        this.renderWeightChart();
    }

    render() {
        const bmi = Utils.calculateBMI(this.state.weight, this.state.height);
        
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
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        
        let chartData = [];
        let xTicks = [];
        let points = '';
        let areaPoints = '';
        let dots = '';
        let xLabels = '';
        let minW = this.state.targetWeight - 4;
        let maxW = this.state.targetWeight + 4;

        // Toggle Month Navigator buttons visibility and text based on chartRange
        if (this.chartRange === '30d') {
            if (this.dom.btnPrevMonth) this.dom.btnPrevMonth.classList.add('invisible');
            if (this.dom.btnNextMonth) this.dom.btnNextMonth.classList.add('invisible');
            if (this.dom.chartMonthLabel) {
                this.dom.chartMonthLabel.innerText = "Last 30 Days";
            }

            // Get last 30 recorded weight entries, sorted chronologically
            const sortedHistory = [...(this.state.weightHistory || [])]
                .filter(h => !isNaN(h.weight) && h.date)
                .sort((a, b) => new Date(a.date) - new Date(b.date));
            
            chartData = sortedHistory.slice(-30);

            if (chartData.length > 0) {
                const weights = chartData.map(d => d.weight);
                minW = Math.min(...weights, this.state.targetWeight) - 1.5;
                maxW = Math.max(...weights, this.state.targetWeight) + 1.5;
            }
            const yRange = maxW - minW || 1;

            // Sequential X mapping to keep spacing consistent
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

            // Generate X ticks for 30d mode (select 5 evenly spaced points)
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
            // 'year' mode
            if (this.dom.btnPrevMonth) this.dom.btnPrevMonth.classList.remove('invisible');
            if (this.dom.btnNextMonth) this.dom.btnNextMonth.classList.remove('invisible');
            if (this.dom.chartMonthLabel) {
                this.dom.chartMonthLabel.innerText = `Year ${viewYear}`;
            }

            // Filter weight history entries of the selected viewYear
            chartData = [...(this.state.weightHistory || [])]
                .filter(h => {
                    if (isNaN(h.weight) || !h.date) return false;
                    const d = new Date(h.date);
                    return d.getFullYear() === viewYear;
                })
                .sort((a, b) => new Date(a.date) - new Date(b.date));

            if (chartData.length > 0) {
                const weights = chartData.map(d => d.weight);
                minW = Math.min(...weights, this.state.targetWeight) - 1.5;
                maxW = Math.max(...weights, this.state.targetWeight) + 1.5;
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

            // X-axis ticks representing key periods of the year (quarters)
            xTicks = [
                { label: 'Jan', x: 8 },
                { label: 'Apr', x: 30.5 },
                { label: 'Jul', x: 53 },
                { label: 'Oct', x: 75.5 },
                { label: 'Dec', x: 98 }
            ];
        }

        const yRange = maxW - minW || 1;
        const targetY = 10 + (1 - (this.state.targetWeight - minW) / yRange) * 70;
        const clampedTargetY = Math.min(Math.max(targetY, 10), 80);

        // SVG lines (grid)
        const gridLines = `
            <!-- Horizontal Grid Lines -->
            <line x1="8" y1="10" x2="98" y2="10" stroke="#1e293b" stroke-width="0.75" stroke-dasharray="2 2" />
            <line x1="8" y1="45" x2="98" y2="45" stroke="#1e293b" stroke-width="0.75" stroke-dasharray="2 2" />
            <line x1="8" y1="80" x2="98" y2="80" stroke="#1e293b" stroke-width="0.75" stroke-dasharray="2 2" />
            
            <!-- Vertical Grid Lines -->
            ${xTicks.map(t => `<line x1="${t.x}" y1="10" x2="${t.x}" y2="80" stroke="#1e293b" stroke-width="0.5" stroke-opacity="0.3" />`).join('')}
        `;

        // Render HTML dot nodes
        dots = chartData.map((d, index) => {
            let x;
            if (this.chartRange === '30d') {
                x = 8 + (index / (chartData.length - 1 || 1)) * 90;
            } else {
                const dateVal = new Date(d.date);
                const startOfYear = new Date(viewYear, 0, 1);
                const endOfYear = new Date(viewYear, 11, 31);
                const totalMs = endOfYear - startOfYear || 1;
                x = 8 + ((dateVal - startOfYear) / totalMs) * 90;
            }
            const y = 10 + (1 - (d.weight - minW) / yRange) * 70;
            const isSelected = d.date === this.dom.dateInput.value;
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

        // Y-Axis Labels
        const yLabels = `
            <div class="absolute left-0 text-[8px] font-mono text-slate-500 -translate-y-1/2" style="top: 10%;">${maxW.toFixed(1)}</div>
            <div class="absolute left-0 text-[8px] font-mono text-slate-500 -translate-y-1/2" style="top: 45%;">${((minW + maxW) / 2).toFixed(1)}</div>
            <div class="absolute left-0 text-[8px] font-mono text-slate-500 -translate-y-1/2" style="top: 80%;">${minW.toFixed(1)}</div>
        `;

        // X-Axis Labels
        xLabels = xTicks.map(t => `
            <div class="absolute text-[8px] font-mono text-slate-500 -translate-x-1/2 mt-1" style="left: ${t.x}%; top: 82%;">
                ${t.label}
            </div>
        `).join('');

        this.dom.weightChartContainer.innerHTML = `
            <div class="relative h-full w-full animate-fade-in">
                <!-- Target Line -->
                <div class="absolute w-full z-0" style="top: ${clampedTargetY}%;">
                    <div class="border-t-2 border-dashed border-green-500/50 w-[98%] ml-[2%]"></div>
                    <span class="absolute right-[2%] -top-4.5 text-[8px] text-green-400 font-bold bg-slate-950/90 border border-green-500/20 px-1.5 py-0.5 rounded shadow-sm font-mono">Target ${this.state.targetWeight}</span>
                </div>
                
                <!-- Y-Axis Unit -->
                <div class="absolute left-0 -top-3 text-[8px] font-mono text-slate-600">kg</div>

                <svg class="absolute inset-0 w-full h-full z-0 overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
                    <defs>
                        <linearGradient id="weightAreaGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stop-color="#06b6d4" stop-opacity="0.25"/>
                            <stop offset="100%" stop-color="#06b6d4" stop-opacity="0.0"/>
                        </linearGradient>
                    </defs>
                    
                    <!-- Grid -->
                    ${gridLines}

                    <!-- Area under curve -->
                    ${areaPoints ? `<polygon points="${areaPoints}" fill="url(#weightAreaGrad)" />` : ''}

                    <!-- Line -->
                    ${points ? `<polyline points="${points}" fill="none" style="stroke: #06b6d4;" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke" />` : ''}
                </svg>

                <!-- Axis Labels -->
                ${yLabels}
                ${xLabels}

                <!-- Data Dots -->
                ${dots}
            </div>
        `;
        
        if (window.lucide) window.lucide.createIcons();
    }
}
