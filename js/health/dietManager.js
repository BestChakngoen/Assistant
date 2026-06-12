export default class DietManager {
    constructor(firebaseManager) {
        this.fb = firebaseManager;
        this.state = {
            currentFoodType: 'meal', 
            targetCalories: 2000, 
            foodLog: []
        };
        this.editId = null; 
        
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

        this.fb.subscribe('diet', (data) => {
            if (data) {
                const today = getThaiDate();
                if(data.foodLog) {
                    this.state.foodLog = data.foodLog
                        .map(item => ({
                            ...item,
                            date: item.date || today, 
                            calories: parseInt(item.calories) 
                        }))
                        .filter(item => !isNaN(item.calories)); 
                }
                if(data.targetCalories) this.state.targetCalories = Number(data.targetCalories) || 2000;
            }
            
            if(this.dom.dateInput && !this.dom.dateInput.value) {
                this.dom.dateInput.value = getThaiDate();
            }
            this.render();
        });
    }

    saveData() {
        this.fb.saveData('diet', {
            targetCalories: this.state.targetCalories,
            foodLog: this.state.foodLog
        });
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

        if(this.dom.chartContainer) {
            this.dom.chartContainer.addEventListener('click', (e) => {
                const btn = e.target.closest('button');
                if(!btn) return;
                if(btn.id === 'btnPrevDietPage') this.changePage(1);
                if(btn.id === 'btnNextDietPage') this.changePage(-1);
            });
        }
    }

    changePage(delta) {
        this.viewOffset += delta;
        if (this.viewOffset < 0) this.viewOffset = 0;
        this.renderWeeklyChart();
    }

    setFoodType(type) {
        this.state.currentFoodType = type;
        Object.keys(this.dom.btnTypes).forEach(key => {
            const btn = this.dom.btnTypes[key];
            if (key === type) {
                btn.className = "flex-1 py-1.5 rounded-md text-[10px] font-bold transition-all flex items-center justify-center gap-1 bg-cyan-600 text-white shadow-sm";
            } else {
                btn.className = "flex-1 py-1.5 rounded-md text-[10px] font-bold transition-all flex items-center justify-center gap-1 text-slate-500 hover:text-slate-300";
            }
        });
    }

    setTarget(newTarget) {
        this.state.targetCalories = newTarget;
        this.saveData();
        this.render();
    }

    editFood(id) {
        const item = this.state.foodLog.find(x => x.id === id);
        if(!item) return;
        
        this.editId = id;
        this.dom.foodName.value = item.name;
        this.dom.foodCal.value = item.calories;
        this.setFoodType(item.category);
        
        this.dom.btnAdd.innerText = "บันทึกแก้ไข";
        this.dom.btnAdd.classList.add('bg-blue-600', 'text-white');
        this.dom.btnCancelEdit.classList.remove('hidden');
    }

    cancelEdit() {
        this.editId = null;
        this.dom.foodName.value = '';
        this.dom.foodCal.value = '';
        
        this.dom.btnAdd.innerText = "บันทึกรายการ";
        this.dom.btnAdd.classList.remove('bg-blue-600', 'text-white');
        this.dom.btnCancelEdit.classList.add('hidden');
    }

    addFood() {
        const name = this.dom.foodName.value;
        const calVal = parseInt(this.dom.foodCal.value);
        const dateStr = this.dom.dateInput.value;
        
        if (!name || isNaN(calVal) || !dateStr) return;

        if (this.editId) {
            const itemIndex = this.state.foodLog.findIndex(x => x.id === this.editId);
            if(itemIndex > -1) {
                this.state.foodLog[itemIndex] = {
                    ...this.state.foodLog[itemIndex],
                    name: name,
                    calories: calVal,
                    category: this.state.currentFoodType,
                    date: dateStr 
                };
            }
            this.cancelEdit();
        } else {
            const newItem = {
                id: Date.now(),
                date: dateStr,
                name: name,
                calories: calVal,
                category: this.state.currentFoodType
            };
            this.state.foodLog.push(newItem);
        }
        
        this.dom.foodName.value = '';
        this.dom.foodCal.value = '';
        
        this.viewOffset = 0;
        this.saveData();
        this.render();
    }

    removeFood(id) {
        this.state.foodLog = this.state.foodLog.filter(x => x.id !== id);
        if(this.editId === id) this.cancelEdit();
        this.saveData();
        this.render();
    }

    render() {
        const selectedDate = this.dom.dateInput.value;
        const dailyLogs = this.state.foodLog.filter(item => item.date === selectedDate);

        this.renderList(dailyLogs);
        this.renderProgress(dailyLogs);
    }

    renderList(dailyLogs) {
        if(!this.dom.foodCount) return;
        this.dom.foodCount.innerText = `${dailyLogs.length} รายการ`;

        if (dailyLogs.length === 0) {
             this.dom.listContainer.innerHTML = `
                <div class="h-48 flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-800 rounded-3xl mt-4">
                    <i data-lucide="cookie" class="mb-4 opacity-50 w-10 h-10 text-cyan-400"></i>
                    <span class="text-sm font-medium">ไม่มีรายการสำหรับวันที่เลือก</span>
                </div>`;
        } else {
            this.dom.listContainer.innerHTML = dailyLogs.map(item => {
                let icon, colorClass;
                if(item.category === 'meal') { icon='utensils'; colorClass='bg-green-950/30 text-green-400 border border-green-500/20'; }
                else if(item.category === 'drink') { icon='coffee'; colorClass='bg-blue-950/30 text-blue-400 border border-blue-500/20'; }
                else { icon='cookie'; colorClass='bg-yellow-950/30 text-yellow-400 border border-yellow-500/20'; }

                return `
                    <div class="flex items-center justify-between p-4 bg-slate-900/40 rounded-2xl border border-slate-800 group hover:border-slate-700 transition-colors">
                        <div class="flex items-center gap-4">
                            <div class="p-3 rounded-xl ${colorClass}">
                                <i data-lucide="${icon}" class="w-5 h-5"></i>
                            </div>
                            <div>
                                <div class="text-sm sm:text-base font-bold text-white">${item.name}</div>
                                <div class="text-[10px] text-slate-400 mt-1">
                                    ${item.category === 'meal' ? 'มื้อหลัก' : item.category === 'drink' ? 'เครื่องดื่ม' : 'ของว่าง'}
                                </div>
                            </div>
                        </div>
                        <div class="flex items-center gap-3">
                            <span class="text-lg font-mono font-bold text-cyan-400 mr-4">${item.calories || 0} kcal</span>
                            <button data-action="edit" data-id="${item.id}" class="text-slate-500 hover:text-cyan-400 p-2 transition" title="แก้ไข">
                                <i data-lucide="edit-2" class="w-4 h-4"></i>
                            </button>
                            <button data-action="delete" data-id="${item.id}" class="text-slate-500 hover:text-red-400 p-2 transition" title="ลบ">
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
        const target = this.state.targetCalories || 2000;

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
        const dailyMap = {};
        this.state.foodLog.forEach(log => {
            if (!dailyMap[log.date]) {
                dailyMap[log.date] = { date: log.date, total: 0, meal: 0, drink: 0, snack: 0 };
            }
            const cal = log.calories || 0;
            dailyMap[log.date].total += cal;
            if (log.category === 'meal') dailyMap[log.date].meal += cal;
            if (log.category === 'drink') dailyMap[log.date].drink += cal;
            if (log.category === 'snack') dailyMap[log.date].snack += cal;
        });

        const sortedHistory = Object.values(dailyMap).sort((a, b) => new Date(a.date) - new Date(b.date));
        
        const totalRecords = sortedHistory.length;
        const pageSize = 7;
        const totalPages = Math.ceil(totalRecords / pageSize) || 1;

        if (this.viewOffset >= totalPages) this.viewOffset = totalPages - 1;
        if (this.viewOffset < 0) this.viewOffset = 0;

        const currentPageIndex = Math.max(0, (totalPages - 1) - this.viewOffset);
        const startIndex = currentPageIndex * pageSize;
        const endIndex = startIndex + pageSize;

        const rawPageData = sortedHistory.slice(startIndex, endIndex);
        
        const maxVal = Math.max(...rawPageData.map(x => x.total), (this.state.targetCalories || 2000) * 1.1) || 2000;
        const selectedDate = this.dom.dateInput.value;

        const formatDate = (dStr) => {
            if(!dStr) return "-";
            const [_y, m, d] = dStr.split('-');
            const months = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];
            return `${parseInt(d)} ${months[parseInt(m)-1]}`;
        };

        const hasData = rawPageData.length > 0;
        const startLabel = hasData ? formatDate(rawPageData[0].date) : "-";
        const endLabel = hasData ? formatDate(rawPageData[rawPageData.length-1].date) : "-";
        const rangeLabel = hasData ? `${startLabel} - ${endLabel}` : "ยังไม่มีข้อมูล";

        const barsHTML = rawPageData.map((d) => {
            const dayNum = parseInt(d.date.split('-')[2]);
            const monthNum = parseInt(d.date.split('-')[1]);
            const displayDate = `${dayNum}/${monthNum}`;
            const isSelected = d.date === selectedDate;
            const total = d.total || 1; 

            return `
                <div class="flex-1 flex flex-col items-center gap-2 z-10 group relative h-full justify-end">
                    <div class="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 border border-slate-700 text-white text-xs p-2 rounded pointer-events-none whitespace-nowrap z-20 font-mono font-medium shadow-lg">
                        ${d.total} kcal
                    </div>
                    <div class="w-full max-w-[32px] sm:max-w-[48px] bg-slate-800 rounded-t-md overflow-hidden flex flex-col-reverse relative transition-height duration-500 ${isSelected ? 'ring-2 ring-cyan-500' : ''}" style="height: ${isNaN((d.total / maxVal) * 100) ? 0 : (d.total / maxVal) * 100}%">
                            <div class="bg-green-500 w-full" style="height: ${isNaN((d.meal/total)*100) ? 0 : (d.meal/total)*100}%"></div>
                            <div class="bg-blue-400 w-full" style="height: ${isNaN((d.drink/total)*100) ? 0 : (d.drink/total)*100}%"></div>
                            <div class="bg-yellow-500 w-full" style="height: ${isNaN((d.snack/total)*100) ? 0 : (d.snack/total)*100}%"></div>
                    </div>
                    <span class="text-xs ${isSelected ? 'font-bold text-cyan-400' : 'text-slate-500'} whitespace-nowrap">${displayDate}</span>
                </div>
            `;
        }).join('');

        const targetY = isNaN((this.state.targetCalories/maxVal)*100) ? 0 : (this.state.targetCalories/maxVal)*100;

        this.dom.chartContainer.innerHTML = `
            <div class="p-6 bg-slate-900/30 rounded-3xl border border-slate-800 w-full">
                <div class="flex justify-between items-center mb-6">
                    <h4 class="text-xs uppercase tracking-wider text-slate-300 font-bold flex items-center gap-2">
                        <i data-lucide="bar-chart-3" class="w-5 h-5 text-cyan-400"></i> สถิติแคลอรี่สะสม (${rawPageData.length}/${totalRecords})
                    </h4>
                    <div class="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl p-1">
                        <button id="btnPrevDietPage" class="p-2 hover:bg-slate-800 rounded-lg text-slate-400 transition-all ${this.viewOffset >= totalPages - 1 ? 'text-slate-700 cursor-not-allowed' : ''}" ${this.viewOffset >= totalPages - 1 ? 'disabled' : ''}>
                            <i data-lucide="chevron-left" class="w-4 h-4"></i>
                        </button>
                        <span class="text-xs font-bold text-slate-300 px-3 min-w-[100px] text-center">
                            ${rangeLabel}
                        </span>
                        <button id="btnNextDietPage" class="p-2 hover:bg-slate-800 rounded-lg text-slate-400 transition-all ${this.viewOffset <= 0 ? 'text-slate-700 cursor-not-allowed' : ''}" ${this.viewOffset <= 0 ? 'disabled' : ''}>
                            <i data-lucide="chevron-right" class="w-4 h-4"></i>
                        </button>
                    </div>
                </div>
                <div class="flex items-end justify-between h-[250px] gap-4 pb-4 border-b-2 border-slate-800 relative">
                    <div class="absolute w-full border-t-2 border-dashed border-slate-700/50 z-0 opacity-50" style="bottom: ${targetY}%"></div>
                    ${barsHTML}
                </div>
                <div class="flex justify-center gap-5 text-xs text-slate-400 font-medium mt-4">
                    <div class="flex items-center gap-2"><div class="w-3 h-3 rounded-full bg-green-500"></div>มื้อหลัก</div>
                    <div class="flex items-center gap-2"><div class="w-3 h-3 rounded-full bg-blue-400"></div>เครื่องดื่ม</div>
                    <div class="flex items-center gap-2"><div class="w-3 h-3 rounded-full bg-yellow-500"></div>ของว่าง</div>
                </div>
            </div>
        `;
        if (window.lucide) window.lucide.createIcons();
    }
}
