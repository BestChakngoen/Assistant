import DietChart from './dietChart.js';

export default class DietUI {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.editId = null;
        this.viewOffset = 0;
        
        this.cacheDOM();
        this.bindEvents();
    }

    cacheDOM() {
        this.dom = {
            dateInput: document.getElementById('dietDateInput'),
            foodName: document.getElementById('foodName'),
            foodCal: document.getElementById('foodCal'),
            btnAdd: document.getElementById('btnAddFood'),
            btnCancelEdit: document.getElementById('btnCancelEditFood'),
            btnTypes: {
                meal: document.getElementById('btn-meal'),
                drink: document.getElementById('btn-drink'),
                snack: document.getElementById('btn-snack')
            },
            foodCount: document.getElementById('foodCount'),
            listContainer: document.getElementById('foodListContainer'),
            totalCalText: document.getElementById('totalCalToday'),
            calDeviationText: document.getElementById('calDeviationText'),
            mainProgress: document.getElementById('mainCalProgress'),
            bars: {
                meal: document.getElementById('mealBar'),
                drink: document.getElementById('drinkBar'),
                snack: document.getElementById('snackBar')
            },
            chartContainer: document.getElementById('weeklyChartContainer')
        };
    }

    bindEvents() {
        if(this.dom.dateInput) {
            this.dom.dateInput.addEventListener('change', () => {
                this.cancelEdit(); 
                this.render();
            });
        }
        if(this.dom.btnTypes.meal) {
            Object.keys(this.dom.btnTypes).forEach(type => {
                this.dom.btnTypes[type].addEventListener('click', () => this.setFoodType(type));
            });
        }
        if(this.dom.btnAdd) this.dom.btnAdd.addEventListener('click', () => this.addFood());
        if(this.dom.btnCancelEdit) this.dom.btnCancelEdit.addEventListener('click', () => this.cancelEdit());

        if (this.dom.listContainer) {
            this.dom.listContainer.addEventListener('click', (e) => {
                const btn = e.target.closest('button');
                if (!btn) return;
                const action = btn.getAttribute('data-action');
                const id = Number(btn.getAttribute('data-id'));
                if (action === 'edit') this.editFood(id);
                if (action === 'delete') this.removeFood(id);
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
        const getThaiDate = () => {
            const now = new Date();
            const thaiTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));
            const year = thaiTime.getFullYear();
            const month = String(thaiTime.getMonth() + 1).padStart(2, '0');
            const day = String(thaiTime.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        if(this.dom.dateInput && !this.dom.dateInput.value) {
            this.dom.dateInput.value = getThaiDate();
        }
        this.render();
    }

    changePage(delta) {
        this.viewOffset += delta;
        if (this.viewOffset < 0) this.viewOffset = 0;
        this.renderWeeklyChart();
    }

    setFoodType(type) {
        this.stateManager.setFoodType(type);
        Object.keys(this.dom.btnTypes).forEach(key => {
            const btn = this.dom.btnTypes[key];
            if (key === type) {
                btn.className = "flex-1 py-1.5 rounded-md text-[10px] font-bold transition-all flex items-center justify-center gap-1 bg-cyan-600 text-white shadow-sm";
            } else {
                btn.className = "flex-1 py-1.5 rounded-md text-[10px] font-bold transition-all flex items-center justify-center gap-1 text-slate-500 hover:text-slate-300";
            }
        });
    }

    editFood(id) {
        const item = this.stateManager.state.foodLog.find(x => x.id === id);
        if(!item) return;
        
        this.editId = id;
        this.dom.foodName.value = item.name;
        this.dom.foodCal.value = item.calories;
        this.setFoodType(item.category);
        
        this.dom.btnAdd.innerText = "Save Edit";
        this.dom.btnAdd.classList.add('bg-blue-600', 'text-white');
        this.dom.btnCancelEdit.classList.remove('hidden');
    }

    cancelEdit() {
        this.editId = null;
        this.dom.foodName.value = '';
        this.dom.foodCal.value = '';
        
        this.dom.btnAdd.innerText = "Save Entry";
        this.dom.btnAdd.classList.remove('bg-blue-600', 'text-white');
        this.dom.btnCancelEdit.classList.add('hidden');
    }

    addFood() {
        const name = this.dom.foodName.value;
        const calVal = parseInt(this.dom.foodCal.value);
        const dateStr = this.dom.dateInput.value;
        
        if (!name || isNaN(calVal) || !dateStr) return;

        if (this.editId) {
            this.stateManager.editFood(this.editId, dateStr, name, calVal);
            this.cancelEdit();
        } else {
            this.stateManager.addFood(dateStr, name, calVal);
        }
        
        this.dom.foodName.value = '';
        this.dom.foodCal.value = '';
        
        this.viewOffset = 0;
        this.render();
    }

    removeFood(id) {
        this.stateManager.removeFood(id);
        if(this.editId === id) this.cancelEdit();
        this.render();
    }

    render() {
        if (!this.dom.dateInput) return;
        const selectedDate = this.dom.dateInput.value;
        const dailyLogs = this.stateManager.getDailyLogs(selectedDate);

        this.renderList(dailyLogs);
        this.renderProgress(dailyLogs);
    }

    renderList(dailyLogs) {
        if(!this.dom.foodCount) return;
        this.dom.foodCount.innerText = `${dailyLogs.length} items`;

        if (dailyLogs.length === 0) {
             this.dom.listContainer.innerHTML = `
                <div class="h-48 flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-800 rounded-3xl mt-4">
                    <i data-lucide="cookie" class="mb-4 opacity-50 w-10 h-10 text-cyan-400"></i>
                    <span class="text-sm font-medium">No entries for selected date</span>
                </div>`;
        } else {
            this.dom.listContainer.innerHTML = dailyLogs.map(item => {
                let icon, colorClass;
                if(item.category === 'meal') { icon='utensils'; colorClass='bg-green-950/30 text-green-400 border border-green-500/20'; }
                else if(item.category === 'drink') { icon='coffee'; colorClass='bg-blue-950/30 text-blue-400 border border-blue-500/20'; }
                else { icon='cookie'; colorClass='bg-yellow-950/30 text-yellow-400 border border-yellow-500/20'; }

                return `
                    <div class="flex items-center justify-between p-4 bg-slate-900/40 rounded-2xl group hover:bg-slate-900/70 transition-colors">
                        <div class="flex items-center gap-4">
                            <div class="p-3 rounded-xl ${colorClass}">
                                <i data-lucide="${icon}" class="size-5"></i>
                            </div>
                            <div>
                                <div class="text-sm sm:text-base font-bold text-white">${item.name}</div>
                                <div class="text-[10px] text-slate-400 mt-1">
                                    ${item.category === 'meal' ? 'Meal' : item.category === 'drink' ? 'Drink' : 'Snack'}
                                </div>
                            </div>
                        </div>
                        <div class="flex items-center gap-3">
                            <span class="text-lg font-mono font-bold text-cyan-400 mr-4 tabular-nums">${item.calories || 0} kcal</span>
                            <button data-action="edit" data-id="${item.id}" class="text-slate-500 hover:text-cyan-400 p-2 transition" title="Edit">
                                <i data-lucide="edit-2" class="w-4 h-4"></i>
                            </button>
                            <button data-action="delete" data-id="${item.id}" class="text-slate-500 hover:text-red-400 p-2 transition" title="Delete">
                                <i data-lucide="trash-2" class="w-4 h-4"></i>
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        }
        if (window.lucide) window.lucide.createIcons();
    }

    renderProgress(dailyLogs) {
        if(!this.dom.totalCalText) return;

        const mealCals = dailyLogs.filter(f => f.category === 'meal').reduce((a, b) => a + (b.calories || 0), 0);
        const drinkCals = dailyLogs.filter(f => f.category === 'drink').reduce((a, b) => a + (b.calories || 0), 0);
        const snackCals = dailyLogs.filter(f => f.category === 'snack').reduce((a, b) => a + (b.calories || 0), 0);
        const total = mealCals + drinkCals + snackCals;
        const target = this.stateManager.state.targetCalories || 2000;

        this.dom.totalCalText.innerText = total;
        const deviation = target > 0 ? ((total - target) / target) * 100 : 0;
        this.dom.calDeviationText.innerText = `${deviation > 0 ? '+' : ''}${isNaN(deviation) ? 0 : deviation.toFixed(1)}%`;
        
        let devColor = 'text-green-300';
        if (deviation > 10) devColor = 'text-red-400';
        else if (deviation > 0) devColor = 'text-yellow-400';
        this.dom.calDeviationText.className = `text-lg font-mono font-bold ${devColor}`;

        const mainPct = target > 0 ? Math.min((total / target) * 100, 100) : 0;
        this.dom.mainProgress.style.width = `${isNaN(mainPct) ? 0 : mainPct}%`;
        this.dom.mainProgress.style.backgroundColor = `#06b6d4`;

        if (total > 0) {
            this.dom.bars.meal.style.width = `${(mealCals / total) * 100}%`;
            this.dom.bars.drink.style.width = `${(drinkCals / total) * 100}%`;
            this.dom.bars.snack.style.width = `${(snackCals / total) * 100}%`;
        } else {
            Object.values(this.dom.bars).forEach(bar => bar.style.width = '0%');
        }

        this.renderWeeklyChart();
    }

    renderWeeklyChart() {
        const selectedDate = this.dom.dateInput ? this.dom.dateInput.value : null;
        DietChart.render(this.dom.chartContainer, this.stateManager, this.viewOffset, selectedDate, (delta) => this.changePage(delta));
    }
}
