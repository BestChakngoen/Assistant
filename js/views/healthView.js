/**
 * healthView.js - Health Track Component Template
 */
export const healthViewHtml = `
    <div id="health-menu-container" class="w-full hidden flex-col gap-6 animate-fade-in pb-10">
        <!-- Health Sub-Tabs & Save All Data -->
        <div class="max-w-4xl mx-auto w-full flex flex-col sm:flex-row items-center gap-4">
            <div class="flex-1 bg-slate-900/80 p-1.5 rounded-2xl flex gap-1 border border-slate-800 shadow-inner backdrop-blur-sm w-full">
                <button class="nav-tab flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2" data-target="section-sleep">
                    <i data-lucide="moon" class="w-4 h-4"></i> Sleep Analysis
                </button>
                <button class="nav-tab flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2" data-target="section-body">
                    <i data-lucide="activity" class="w-4 h-4"></i> Body & Trends
                </button>
                <button class="nav-tab flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2" data-target="section-diet">
                    <i data-lucide="utensils" class="w-4 h-4"></i> Food Journal
                </button>
            </div>
            <button id="btnSaveAllGlobal" class="bg-cyan-600 hover:bg-cyan-500 text-white px-5 py-2.5 rounded-2xl shadow-xl shadow-cyan-500/10 hover:scale-105 transition-all flex items-center gap-2 font-bold border border-cyan-400/30 btn-press shrink-0 text-xs sm:text-sm font-mono whitespace-nowrap self-stretch sm:self-auto justify-center">
                <i data-lucide="save" class="w-4 h-4"></i>
                <span>SAVE ALL DATA</span>
            </button>
        </div>

        <!-- Health Content Sections -->
        <div class="w-full relative min-h-[600px]">
            
            <!-- Sub-Tab 1: Sleep Analysis -->
            <div id="section-sleep" class="tab-section glass-panel rounded-3xl p-6 shadow-sm border border-slate-800 h-full flex flex-col gap-6">
                <div class="flex items-center gap-3 shrink-0">
                    <div class="p-2.5 rounded-2xl bg-slate-900/50 text-cyan-400">
                        <i data-lucide="moon" class="w-5 h-5"></i>
                    </div>
                    <h3 class="text-lg font-mono font-bold text-cyan-400 tracking-wide">Sleep Analysis</h3>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
                    <div class="flex flex-col gap-6">
                        <div class="flex flex-col sm:flex-row justify-between items-center bg-slate-900/30 p-6 rounded-2xl border border-slate-800">
                            <div class="text-center sm:text-left mb-4 sm:mb-0">
                                <span class="block text-xs text-slate-400 font-bold uppercase mb-1">Sleep Duration</span>
                                <div class="flex items-baseline gap-2 justify-center sm:justify-start">
                                    <span id="sleepDurationText" class="text-4xl font-mono font-bold text-cyan-400">0.0</span>
                                    <span class="text-sm text-slate-400 font-bold">hrs</span>
                                </div>
                                <div class="text-[10px] mt-2 inline-flex items-center px-2 py-1 rounded-md bg-slate-800 text-slate-400 font-bold">
                                    Target: <span class="font-mono font-bold mx-1 text-cyan-400">7.5 - 9.0</span> hrs
                                </div>
                            </div>
                            
                            <div class="relative w-24 h-24 flex items-center justify-center">
                                <svg class="w-full h-full transform -rotate-90">
                                    <circle cx="48" cy="48" r="40" stroke="#1e293b" stroke-width="6" fill="transparent" />
                                    <circle id="sleepProgressCircle" cx="48" cy="48" r="40" stroke="#38bdf8" stroke-width="6" fill="transparent" 
                                        stroke-dasharray="251.2" stroke-dashoffset="251.2" stroke-linecap="round" />
                                </svg>
                                <i data-lucide="moon" class="absolute text-cyan-400 w-5 h-5"></i>
                            </div>
                        </div>

                        <div class="bg-slate-900/30 p-4 rounded-2xl border border-slate-800">
                            <div class="flex items-center justify-between mb-4">
                                <h4 class="text-xs uppercase tracking-wider text-slate-400 font-bold flex items-center gap-2">
                                    <i data-lucide="calendar" class="w-4 h-4 text-cyan-400"></i> Log Date
                                </h4>
                                <input type="date" id="sleepDateInput" class="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white">
                            </div>

                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-xs font-bold text-slate-400 mb-2">Bedtime</label>
                                    <input type="time" id="bedTimeInput" class="w-full rounded-xl py-2 px-3 text-white font-mono text-sm bg-slate-900 border border-slate-800 focus:border-cyan-500">
                                    <div class="text-[9px] text-slate-500 mt-1 text-right">Target: <span class="font-mono">21:30</span></div>
                                </div>
                                <div>
                                    <label class="block text-xs font-bold text-slate-400 mb-2">Wake-up Time</label>
                                    <input type="time" id="wakeTimeInput" class="w-full rounded-xl py-2 px-3 text-white font-mono text-sm bg-slate-900 border border-slate-800 focus:border-cyan-500">
                                    <div class="text-[9px] text-slate-500 mt-1 text-right">Target: <span class="font-mono">05:30</span></div>
                                </div>
                            </div>
                        </div>

                        <div class="flex gap-2">
                            <button id="btnRecordSleep" class="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white py-3 rounded-xl text-sm font-bold shadow-lg shadow-cyan-500/20 btn-press">
                                Save Sleep Log
                            </button>
                            <button id="btnDeleteSleep" class="w-1/3 px-4 py-3 bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-xs hover:bg-red-500 hover:text-white transition-colors font-bold flex justify-center items-center gap-2 btn-press">
                                <i data-lucide="trash-2" class="w-4 h-4"></i> Delete today's log
                            </button>
                        </div>
                    </div>

                    <div class="flex flex-col mt-4 lg:mt-0 gap-6">
                        <div id="sleepPatternChart" class="p-4 bg-slate-900/20 rounded-2xl border border-slate-800 flex-1 min-h-[300px]"></div>
                        <div class="space-y-4 pt-4 border-t border-slate-800" id="sleepDeviations"></div>
                    </div>
                </div>
            </div>

            <!-- Sub-Tab 2: Body & Trends -->
            <div id="section-body" class="tab-section hidden glass-panel rounded-3xl p-6 shadow-sm border border-slate-800 h-full flex flex-col gap-6">
                <div class="flex items-center gap-3 shrink-0">
                    <div class="p-2.5 rounded-2xl bg-slate-900/50 text-cyan-400">
                        <i data-lucide="activity" class="w-5 h-5"></i>
                    </div>
                    <h3 class="text-lg font-mono font-bold text-cyan-400 tracking-wide">Body & Trends</h3>
                </div>

                <div class="flex justify-end">
                    <input type="date" id="bodyDateInput" class="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white">
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
                    <div class="flex flex-col gap-4">
                        <div class="grid grid-cols-4 gap-2">
                            <div>
                                <label class="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Weight (kg)</label>
                                <input type="number" id="weightInput" step="0.1" class="w-full rounded-xl py-2 px-1 text-center font-mono font-bold text-white bg-slate-900 border border-slate-800 focus:border-cyan-500" placeholder="0.0">
                            </div>
                            <div>
                                <label class="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Height (cm)</label>
                                <input type="number" id="heightInput" class="w-full rounded-xl py-2 px-1 text-center font-mono font-bold text-white bg-slate-900 border border-slate-800 focus:border-cyan-500">
                            </div>
                            <div>
                                <label class="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Age</label>
                                <input type="number" id="ageInput" class="w-full rounded-xl py-2 px-1 text-center font-mono font-bold text-white bg-slate-900 border border-slate-800 focus:border-cyan-500">
                            </div>
                            <div class="bg-slate-900/30 border border-slate-800 rounded-xl p-1 flex flex-col items-center justify-center shadow-sm">
                                <span class="text-[9px] text-slate-500 font-bold">BMI</span>
                                <span id="bmiValue" class="text-base font-mono font-black text-cyan-400 leading-none">-</span>
                                <span id="bmiLabel" class="text-[9px] font-bold text-slate-400">-</span>
                            </div>
                        </div>

                        <div class="flex gap-2">
                            <button id="btnRecordWeight" class="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white py-3 rounded-xl text-sm font-bold shadow-lg shadow-cyan-500/20 btn-press">
                                Save Weight Log
                            </button>
                            <button id="btnDeleteWeight" class="w-1/3 px-4 py-3 bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-xs hover:bg-red-500 hover:text-white transition-colors font-bold flex justify-center items-center gap-2 btn-press">
                                 <i data-lucide="trash-2" class="w-4 h-4"></i> Delete today's log
                            </button>
                        </div>

                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Gender</label>
                                <div class="relative">
                                    <select id="genderInput" class="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded-xl py-2 pl-3 pr-8 text-xs font-bold text-white appearance-none cursor-pointer">
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                    </select>
                                    <i data-lucide="chevron-down" class="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none"></i>
                                </div>
                            </div>
                            <div>
                                <label class="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Activity Level</label>
                                <div class="relative">
                                    <select id="activityLevelInput" class="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded-xl py-2 pl-3 pr-8 text-xs font-bold text-white appearance-none cursor-pointer">
                                        <option value="1.2">Sedentary (Office job)</option>
                                        <option value="1.375">Moderately active (1-3 days/week)</option>
                                        <option value="1.55">Highly active (3-5 days/week)</option>
                                        <option value="1.725">Extremely active (6-7 days/week)</option>
                                    </select>
                                    <i data-lucide="chevron-down" class="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none"></i>
                                </div>
                            </div>
                        </div>

                        <div class="flex items-center justify-between bg-slate-900/30 p-3 rounded-xl border border-slate-800">
                            <label class="text-xs font-bold text-slate-300 flex items-center gap-2">
                                <i data-lucide="target" class="w-4 h-4 text-cyan-400"></i> Target Weight
                            </label>
                            <div class="flex items-center gap-2">
                                <input type="number" id="targetWeightInput" step="0.1" class="w-20 bg-slate-900 border border-slate-800 rounded-lg py-1 px-2 text-center font-mono font-bold text-white focus:border-cyan-500 text-sm">
                                <span class="text-xs text-slate-400 font-bold">kg</span>
                            </div>
                        </div>

                        <div class="flex items-center justify-between px-1 mt-2">
                            <h4 class="text-xs font-bold text-slate-300 flex items-center gap-2">
                                <i data-lucide="trending-up" class="w-4 h-4 text-cyan-400"></i> Weight Trend
                            </h4>
                            <div class="flex items-center gap-3">
                                <div class="flex items-center bg-slate-950 rounded-xl p-0.5 border border-slate-800 text-[9px] font-mono font-bold shrink-0">
                                    <button id="btnChartRange30d" class="px-2.5 py-1 rounded-lg text-cyan-400 bg-cyan-500/10 transition-all">30 DAYS</button>
                                    <button id="btnChartRangeYear" class="px-2.5 py-1 rounded-lg text-slate-400 hover:text-slate-200 transition-all">YEARLY</button>
                                </div>

                                <div class="flex items-center gap-1 bg-slate-900/50 rounded-xl p-1 border border-slate-800">
                                    <button id="btnPrevMonth" class="p-1 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
                                        <i data-lucide="chevron-left" class="w-3.5 h-3.5"></i>
                                    </button>
                                    <span id="chartMonthLabel" class="text-[10px] font-mono font-bold text-slate-300 min-w-[70px] text-center">...</span>
                                    <button id="btnNextMonth" class="p-1 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
                                        <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <div id="weightChartContainer" class="h-[300px] min-h-[300px] relative overflow-hidden bg-slate-900/10 rounded-2xl border border-slate-800/50 p-4"></div>
                    </div>

                    <div class="flex flex-col gap-6">
                        <div class="grid grid-cols-3 gap-2">
                            <div class="p-4 bg-slate-900/30 rounded-2xl border border-slate-800 flex flex-col items-center justify-center text-center">
                                <span class="text-[10px] text-slate-400 font-bold mb-1">Basal BMR</span>
                                <div class="whitespace-nowrap"><span id="bmrValue" class="text-xl font-mono font-bold text-white">0</span><span class="text-[9px] text-slate-500 ml-1 font-bold">kcal</span></div>
                            </div>
                            <div class="p-4 bg-slate-900/30 rounded-2xl border border-slate-800 flex flex-col items-center justify-center text-center">
                                <span class="text-[10px] text-slate-400 font-bold mb-1">Total TDEE</span>
                                <div class="whitespace-nowrap"><span id="tdeeValue" class="text-xl font-mono font-bold text-white">0</span><span class="text-[9px] text-slate-500 ml-1 font-bold">kcal</span></div>
                            </div>
                            <div class="p-4 bg-slate-900/30 rounded-2xl border border-slate-800 relative overflow-hidden flex flex-col items-center justify-center text-center">
                                <span class="text-[10px] text-slate-400 font-bold mb-1">Intake Target</span>
                                <div class="whitespace-nowrap"><span id="targetCalValue" class="text-xl font-mono font-bold text-cyan-400">0</span><span class="text-[9px] text-slate-500 ml-1 font-bold">kcal</span></div>
                                <div id="targetIndicator" class="absolute top-1 right-1 text-[8px] px-1.5 py-0.5 rounded-full font-bold hidden"></div>
                            </div>
                        </div>

                        <div class="bg-slate-900/80 border border-slate-800 text-slate-200 rounded-2xl p-5 relative overflow-hidden shadow-lg shadow-cyan-500/5">
                            <div class="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                            <div class="relative z-10">
                                <div class="flex justify-between items-end mb-3">
                                    <div>
                                        <span class="text-xs text-slate-400 block mb-1 font-bold">Total Intake Today</span>
                                        <span id="totalCalToday" class="text-3xl font-mono font-bold text-white">0</span>
                                        <span class="text-xs text-slate-400">kcal</span>
                                    </div>
                                    <div class="text-right">
                                        <span id="calDeviationText" class="text-lg font-mono font-bold text-cyan-400">0%</span>
                                    </div>
                                </div>
                                <div class="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden mb-3 border border-slate-800">
                                    <div id="mainCalProgress" class="h-full bg-cyan-500 rounded-full transition-width" style="width: 0%"></div>
                                </div>
                                <div class="w-full h-2 rounded-full overflow-hidden flex bg-slate-950/50">
                                    <div id="mealBar" class="bg-green-500 h-full transition-width" style="width: 0%"></div>
                                    <div id="drinkBar" class="bg-blue-400 h-full transition-width" style="width: 0%"></div>
                                    <div id="snackBar" class="bg-yellow-500 h-full transition-width" style="width: 0%"></div>
                                </div>
                            </div>
                        </div>

                        <div id="weeklyChartContainer" class="flex-1 mt-auto pt-6 border-t border-slate-800"></div>
                    </div>
                </div>
            </div>

            <!-- Sub-Tab 3: Food Journal -->
            <div id="section-diet" class="tab-section hidden glass-panel rounded-3xl p-6 shadow-sm border border-slate-800 h-full flex flex-col gap-6">
                <div class="flex items-center gap-3 shrink-0">
                    <div class="p-2.5 rounded-2xl bg-slate-900/50 text-cyan-400">
                        <i data-lucide="utensils" class="w-5 h-5"></i>
                    </div>
                    <h3 class="text-lg font-mono font-bold text-cyan-400 tracking-wide">Food Journal</h3>
                </div>

                <div class="flex items-center justify-between mb-2">
                    <label class="text-xs font-bold text-slate-400 uppercase">Select Date</label>
                    <input type="date" id="dietDateInput" class="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white">
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 h-full min-h-0">
                    <div class="flex flex-col gap-6">
                        <div class="bg-slate-900/30 p-5 rounded-2xl border border-slate-800">
                            <h4 class="text-xs uppercase tracking-wider text-slate-400 font-bold mb-4 flex items-center gap-2">
                                <i data-lucide="plus" class="w-4 h-4 text-cyan-400"></i> Add / Edit Food Entry
                            </h4>
                            <div class="flex flex-col gap-3 mb-4">
                                <input type="text" id="foodName" placeholder="Food name..." class="w-full rounded-lg py-2.5 px-3 text-sm bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white font-medium">
                                <div class="flex gap-2">
                                    <input type="number" id="foodCal" placeholder="kcal" class="w-24 rounded-lg py-2.5 px-3 text-sm bg-slate-950 border border-slate-800 focus:border-cyan-500 font-mono font-bold text-cyan-400">
                                    
                                    <div class="flex-1 flex bg-slate-950 rounded-lg p-1 gap-1 border border-slate-800">
                                        <button id="btn-meal" class="flex-1 py-1.5 rounded-md text-[10px] font-bold transition-all flex items-center justify-center gap-1 bg-cyan-600 text-white shadow-sm" data-type="meal" title="Meal">
                                            <i data-lucide="utensils" class="w-3.5 h-3.5"></i>
                                        </button>
                                        <button id="btn-drink" class="flex-1 py-1.5 rounded-md text-[10px] font-bold transition-all flex items-center justify-center gap-1 text-slate-500 hover:text-slate-300" data-type="drink" title="Drink">
                                            <i data-lucide="coffee" class="w-3.5 h-3.5"></i>
                                        </button>
                                        <button id="btn-snack" class="flex-1 py-1.5 rounded-md text-[10px] font-bold transition-all flex items-center justify-center gap-1 text-slate-500 hover:text-slate-300" data-type="snack" title="Snack">
                                            <i data-lucide="cookie" class="w-3.5 h-3.5"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <button id="btnAddFood" class="w-full bg-cyan-600 hover:bg-cyan-500 text-white py-3 rounded-xl text-sm font-bold shadow-lg shadow-cyan-500/20 transition-all btn-press">
                                Save Entry
                            </button>
                            <button id="btnCancelEditFood" class="hidden w-full bg-slate-800 text-slate-300 py-2.5 rounded-xl text-sm transition-colors mt-2 font-bold hover:bg-slate-700 btn-press">
                                Cancel Edit
                            </button>
                        </div>
                    </div>
                    
                    <div class="flex flex-col h-full min-h-0">
                        <div class="flex justify-between items-center mb-3 px-1 shrink-0">
                            <h4 class="text-sm font-mono font-bold text-slate-300">Entries for Selected Date</h4>
                            <span id="foodCount" class="text-xs text-slate-500 font-bold">0 items</span>
                        </div>
                        <div id="foodListContainer" class="flex-1 overflow-y-auto pr-1 space-y-2 min-h-[250px] md:h-full md:max-h-[500px]"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
`;
