/**
 * notificationView.js - Full-page Notifications & Reminders view template
 */
export const notificationViewHtml = `
    <div id="notifications-panel" class="hidden flex-col gap-6 w-full max-w-7xl mx-auto">
        <!-- Top Banner / Header -->
        <div class="glass-panel p-6 sm:p-7 rounded-3xl bg-slate-900/40 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div class="flex items-center gap-3.5">
                <div class="size-11 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-blue-600/20 text-cyan-400 flex items-center justify-center shrink-0">
                    <i data-lucide="bell" class="size-6"></i>
                </div>
                <div>
                    <div class="flex items-center gap-2">
                        <h2 class="text-xl font-bold font-mono text-white tracking-wide">Notifications & Reminders</h2>
                        <span id="notif-sync-badge" class="px-2 py-0.5 rounded-full text-[10px] font-mono text-emerald-400 bg-emerald-500/10 flex items-center gap-1">
                            <span class="size-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            Cloud Sync
                        </span>
                    </div>
                </div>
            </div>

            <!-- Header Action Controls -->
            <div class="flex flex-wrap items-center gap-2.5">
                <button id="btn-request-browser-notif" type="button" class="btn-press px-3.5 py-2 rounded-xl bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 hover:text-white text-xs font-mono flex items-center gap-2 transition-all cursor-pointer">
                    <i data-lucide="shield-alert" class="size-3.5 text-cyan-400"></i>
                    <span id="browser-notif-btn-label">Desktop Alerts</span>
                </button>
                <button id="btn-open-add-reminder" type="button" class="btn-press px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 font-mono text-xs font-bold flex items-center gap-2 transition-all cursor-pointer">
                    <i data-lucide="plus" class="size-4"></i>
                    <span>New Reminder</span>
                </button>
            </div>
        </div>

        <!-- 4-Stat Metric Cards -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <!-- Active Reminders -->
            <div class="glass-panel p-4 rounded-2xl bg-slate-900/30 flex flex-col justify-between">
                <div class="flex items-center justify-between text-xs text-slate-400 font-mono">
                    <span>ACTIVE</span>
                    <i data-lucide="bell-ring" class="size-4 text-cyan-400"></i>
                </div>
                <div class="mt-2">
                    <span id="stat-notif-active" class="text-2xl font-mono font-bold text-white tabular-nums">0</span>
                    <span class="text-xs text-slate-500 ml-1">reminders</span>
                </div>
            </div>

            <!-- Due Today -->
            <div class="glass-panel p-4 rounded-2xl bg-slate-900/30 flex flex-col justify-between">
                <div class="flex items-center justify-between text-xs text-slate-400 font-mono">
                    <span>DUE TODAY</span>
                    <i data-lucide="calendar" class="size-4 text-amber-400"></i>
                </div>
                <div class="mt-2">
                    <span id="stat-notif-today" class="text-2xl font-mono font-bold text-amber-400 tabular-nums">0</span>
                    <span class="text-xs text-slate-500 ml-1">scheduled</span>
                </div>
            </div>

            <!-- Recurring Routines -->
            <div class="glass-panel p-4 rounded-2xl bg-slate-900/30 flex flex-col justify-between">
                <div class="flex items-center justify-between text-xs text-slate-400 font-mono">
                    <span>ROUTINES</span>
                    <i data-lucide="repeat" class="size-4 text-emerald-400"></i>
                </div>
                <div class="mt-2">
                    <span id="stat-notif-routine" class="text-2xl font-mono font-bold text-emerald-400 tabular-nums">0</span>
                    <span class="text-xs text-slate-500 ml-1">repeating</span>
                </div>
            </div>

            <!-- History Logs -->
            <div class="glass-panel p-4 rounded-2xl bg-slate-900/30 flex flex-col justify-between">
                <div class="flex items-center justify-between text-xs text-slate-400 font-mono">
                    <span>HISTORY</span>
                    <i data-lucide="history" class="size-4 text-blue-400"></i>
                </div>
                <div class="mt-2">
                    <span id="stat-notif-history" class="text-2xl font-mono font-bold text-slate-200 tabular-nums">0</span>
                    <span class="text-xs text-slate-500 ml-1">triggered</span>
                </div>
            </div>
        </div>

        <!-- Filter & Search Controls -->
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-slate-900/30 p-3 rounded-2xl">
            <!-- Filter Tabs -->
            <div class="flex items-center gap-1.5 overflow-x-auto auto-hide-scrollbar" id="notif-filter-tabs">
                <button type="button" data-filter="all" class="notif-filter-btn px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-cyan-500/20 text-cyan-400 transition-all">All</button>
                <button type="button" data-filter="active" class="notif-filter-btn px-3 py-1.5 rounded-xl text-xs font-mono text-slate-400 hover:text-white transition-all">Active</button>
                <button type="button" data-filter="routine" class="notif-filter-btn px-3 py-1.5 rounded-xl text-xs font-mono text-slate-400 hover:text-white transition-all">Routines (Recurring)</button>
                <button type="button" data-filter="history" class="notif-filter-btn px-3 py-1.5 rounded-xl text-xs font-mono text-slate-400 hover:text-white transition-all">History Logs</button>
            </div>

            <div class="flex items-center gap-2">
                <!-- Category Select Filter -->
                <select id="notif-category-filter" class="px-3 py-1.5 rounded-xl bg-slate-950/70 text-slate-300 text-xs font-mono outline-none focus:ring-1 focus:ring-cyan-500/40 cursor-pointer">
                    <option value="all">All Categories</option>
                    <option value="trading">Trading</option>
                    <option value="health">Health</option>
                    <option value="routine">Routine</option>
                    <option value="finance">Finance</option>
                    <option value="general">General</option>
                </select>

                <!-- Search input -->
                <div class="relative">
                    <input id="notif-search-input" type="text" placeholder="Search reminders..." class="w-40 sm:w-52 pl-8 pr-3 py-1.5 rounded-xl bg-slate-950/70 text-slate-200 placeholder:text-slate-500 text-xs font-mono outline-none focus:ring-1 focus:ring-cyan-500/40">
                    <i data-lucide="search" class="size-3.5 text-slate-500 absolute left-2.5 top-2.5"></i>
                </div>
            </div>
        </div>

        <!-- Reminders List Container -->
        <div id="notifications-list-container" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <!-- Populated dynamically by NotificationRenderer -->
        </div>

        <!-- History Log Table Container (Visible when filter is 'history') -->
        <div id="notifications-history-container" class="hidden flex-col gap-3">
            <div class="flex items-center justify-between">
                <span class="text-xs font-mono text-slate-400">Triggered Alert History</span>
                <button id="btn-clear-notif-history" type="button" class="text-xs font-mono text-rose-400 hover:text-rose-300 transition-colors flex items-center gap-1">
                    <i data-lucide="trash-2" class="size-3"></i>
                    <span>Clear History</span>
                </button>
            </div>
            <div id="notif-history-list" class="flex flex-col gap-2"></div>
        </div>
    </div>

    <!-- Create/Edit Reminder Modal -->
    <div id="modal-reminder" class="fixed inset-0 z-50 hidden items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md" style="display: none;">
        <div class="max-w-lg w-full bg-[#0d121f] rounded-3xl p-6 flex flex-col gap-5 border-0 shadow-2xl shadow-cyan-950/50 relative">
            <!-- Modal Header -->
            <div class="flex items-center justify-between pb-3 border-b border-slate-800/60">
                <div class="flex items-center gap-2.5">
                    <div class="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
                        <i data-lucide="clock" class="size-5"></i>
                    </div>
                    <div>
                        <h3 id="modal-reminder-title" class="text-base font-bold font-mono text-white">Add Reminder / Alert</h3>
                        <p class="text-[11px] font-mono text-slate-400">Schedule one-time or recurring notifications</p>
                    </div>
                </div>
                <button id="btn-close-reminder-modal" type="button" class="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all cursor-pointer">
                    <i data-lucide="x" class="size-5"></i>
                </button>
            </div>

            <!-- Modal Form Fields -->
            <form id="form-reminder" class="flex flex-col gap-4">
                <input type="hidden" id="reminder-id" value="">

                <!-- Title -->
                <div class="flex flex-col gap-1.5">
                    <label for="reminder-title-input" class="text-xs font-mono text-slate-300 font-medium">Title <span class="text-rose-400">*</span></label>
                    <input id="reminder-title-input" type="text" required placeholder="e.g. Review Pre-Market Levels, Record Journal, Water Intake..." class="w-full px-4 py-2.5 rounded-xl bg-slate-950/70 text-slate-100 placeholder:text-slate-600 outline-none focus:ring-1 focus:ring-cyan-500/40 text-xs font-mono">
                </div>

                <!-- Description Notes -->
                <div class="flex flex-col gap-1.5">
                    <label for="reminder-notes-input" class="text-xs font-mono text-slate-300 font-medium">Notes / Details (Optional)</label>
                    <textarea id="reminder-notes-input" rows="2" placeholder="Add checklist, context or instructions..." class="w-full px-4 py-2.5 rounded-xl bg-slate-950/70 text-slate-100 placeholder:text-slate-600 outline-none focus:ring-1 focus:ring-cyan-500/40 text-xs font-mono resize-none"></textarea>
                </div>

                <!-- Category & Priority (2-col) -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div class="flex flex-col gap-1.5">
                        <label for="reminder-category-select" class="text-xs font-mono text-slate-300 font-medium">Category</label>
                        <select id="reminder-category-select" class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 text-slate-100 outline-none focus:ring-1 focus:ring-cyan-500/40 text-xs font-mono cursor-pointer">
                            <option value="trading">Trading</option>
                            <option value="health">Health</option>
                            <option value="routine">Routine</option>
                            <option value="finance">Finance</option>
                            <option value="general">General</option>
                        </select>
                    </div>

                    <div class="flex flex-col gap-1.5">
                        <label for="reminder-priority-select" class="text-xs font-mono text-slate-300 font-medium">Priority</label>
                        <select id="reminder-priority-select" class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 text-slate-100 outline-none focus:ring-1 focus:ring-cyan-500/40 text-xs font-mono cursor-pointer">
                            <option value="normal">Normal Priority</option>
                            <option value="high">High (Urgent)</option>
                            <option value="low">Low</option>
                        </select>
                    </div>
                </div>

                <!-- Schedule Frequency / Recurrence -->
                <div class="flex flex-col gap-2 p-3.5 rounded-2xl bg-slate-950/50">
                    <label for="reminder-freq-select" class="text-xs font-mono text-cyan-400 font-semibold flex items-center gap-1.5">
                        <i data-lucide="repeat" class="size-3.5"></i>
                        <span>Schedule Frequency</span>
                    </label>

                    <select id="reminder-freq-select" class="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 text-slate-100 outline-none focus:ring-1 focus:ring-cyan-500/40 text-xs font-mono cursor-pointer">
                        <option value="once">One-Time</option>
                        <option value="daily">Daily</option>
                        <option value="weekdays">Weekdays</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="interval">Hourly Interval</option>
                    </select>

                    <!-- Dynamic Fields based on freq -->
                    <!-- 1. Collapsible Date Picker (Clean trigger box + Calendar dropdown) -->
                    <div id="freq-field-date" class="flex flex-col gap-1.5 mt-1">
                        <label class="text-[11px] font-mono text-slate-400">Date</label>
                        <button id="btn-toggle-date-picker" type="button" class="btn-press w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-900 text-slate-100 text-xs font-mono transition-all cursor-pointer">
                            <span class="flex items-center gap-2">
                                <i data-lucide="calendar" class="size-4 text-cyan-400"></i>
                                <span id="cal-date-display" class="tabular-nums">--/--/----</span>
                            </span>
                            <i data-lucide="chevron-down" id="date-picker-chevron" class="size-4 text-slate-400 transition-transform duration-200"></i>
                        </button>
                        <input id="reminder-date-input" type="hidden" value="">

                        <div id="date-picker-dropdown" class="hidden p-3 rounded-2xl bg-slate-900/95 flex flex-col gap-2.5 mt-1">
                            <div class="flex items-center justify-between">
                                <button id="btn-cal-prev" type="button" class="btn-press p-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer">
                                    <i data-lucide="chevron-left" class="size-4"></i>
                                </button>
                                <span id="cal-month-year" class="text-xs font-mono font-bold text-slate-200">Month YYYY</span>
                                <div class="flex items-center gap-1.5">
                                    <button id="btn-cal-today" type="button" class="btn-press px-2 py-0.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-[10px] font-mono font-bold text-cyan-400 transition-all cursor-pointer">
                                        Today
                                    </button>
                                    <button id="btn-cal-next" type="button" class="btn-press p-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer">
                                        <i data-lucide="chevron-right" class="size-4"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="grid grid-cols-7 gap-1 text-center text-[10px] font-mono text-slate-500 font-bold">
                                <span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span><span>Su</span>
                            </div>
                            <div id="cal-days-grid" class="grid grid-cols-7 gap-1 text-center font-mono text-xs">
                                <!-- Populated dynamically -->
                            </div>
                        </div>
                    </div>

                    <!-- 2. Collapsible Time Picker (Clean trigger box + Mobile Drum Roller) -->
                    <div id="freq-field-time" class="flex flex-col gap-1.5 mt-1">
                        <label class="text-[11px] font-mono text-slate-400">Time</label>
                        <button id="btn-toggle-time-picker" type="button" class="btn-press w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-900 text-slate-100 text-xs font-mono transition-all cursor-pointer">
                            <span class="flex items-center gap-2">
                                <i data-lucide="clock" class="size-4 text-cyan-400"></i>
                                <span id="time-picker-display" class="font-bold text-cyan-400 text-sm tracking-wider tabular-nums">09:00</span>
                            </span>
                            <i data-lucide="chevron-down" id="time-picker-chevron" class="size-4 text-slate-400 transition-transform duration-200"></i>
                        </button>
                        <input id="reminder-time-input" type="hidden" value="09:00">

                        <div id="time-picker-dropdown" class="hidden p-3 rounded-2xl bg-slate-900/95 flex flex-col gap-3 mt-1">
                            <div class="wheel-picker-container">
                                <div class="wheel-picker-lens"></div>

                                <!-- Hours (00 - 23) -->
                                <div class="wheel-column" id="wheel-hours-col">
                                    <div class="wheel-spacer"></div>
                                    <div id="wheel-hours-list" class="flex flex-col"></div>
                                    <div class="wheel-spacer"></div>
                                </div>

                                <div class="wheel-separator">:</div>

                                <!-- Minutes (00 - 59) -->
                                <div class="wheel-column" id="wheel-mins-col">
                                    <div class="wheel-spacer"></div>
                                    <div id="wheel-mins-list" class="flex flex-col"></div>
                                    <div class="wheel-spacer"></div>
                                </div>
                            </div>

                            <button id="btn-time-picker-done" type="button" class="btn-press w-full py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-400 font-mono text-xs font-bold transition-all text-center cursor-pointer">
                                Confirm Time (<span id="time-picker-confirm-val">09:00</span>)
                            </button>
                        </div>
                    </div>

                    <!-- Weekly Days Selector -->
                    <div id="freq-field-weekdays" class="hidden flex-col gap-1 mt-1">
                        <span class="text-[11px] font-mono text-slate-400">Select Days</span>
                        <div class="flex items-center gap-1.5 flex-wrap">
                            <label class="px-2.5 py-1 rounded-lg bg-slate-900 text-[11px] font-mono text-slate-300 cursor-pointer has-[:checked]:bg-cyan-500/20 has-[:checked]:text-cyan-400">
                                <input type="checkbox" name="weekly-day" value="1" class="hidden" checked> Mon
                            </label>
                            <label class="px-2.5 py-1 rounded-lg bg-slate-900 text-[11px] font-mono text-slate-300 cursor-pointer has-[:checked]:bg-cyan-500/20 has-[:checked]:text-cyan-400">
                                <input type="checkbox" name="weekly-day" value="2" class="hidden" checked> Tue
                            </label>
                            <label class="px-2.5 py-1 rounded-lg bg-slate-900 text-[11px] font-mono text-slate-300 cursor-pointer has-[:checked]:bg-cyan-500/20 has-[:checked]:text-cyan-400">
                                <input type="checkbox" name="weekly-day" value="3" class="hidden" checked> Wed
                            </label>
                            <label class="px-2.5 py-1 rounded-lg bg-slate-900 text-[11px] font-mono text-slate-300 cursor-pointer has-[:checked]:bg-cyan-500/20 has-[:checked]:text-cyan-400">
                                <input type="checkbox" name="weekly-day" value="4" class="hidden" checked> Thu
                            </label>
                            <label class="px-2.5 py-1 rounded-lg bg-slate-900 text-[11px] font-mono text-slate-300 cursor-pointer has-[:checked]:bg-cyan-500/20 has-[:checked]:text-cyan-400">
                                <input type="checkbox" name="weekly-day" value="5" class="hidden" checked> Fri
                            </label>
                            <label class="px-2.5 py-1 rounded-lg bg-slate-900 text-[11px] font-mono text-slate-300 cursor-pointer has-[:checked]:bg-cyan-500/20 has-[:checked]:text-cyan-400">
                                <input type="checkbox" name="weekly-day" value="6" class="hidden"> Sat
                            </label>
                            <label class="px-2.5 py-1 rounded-lg bg-slate-900 text-[11px] font-mono text-slate-300 cursor-pointer has-[:checked]:bg-cyan-500/20 has-[:checked]:text-cyan-400">
                                <input type="checkbox" name="weekly-day" value="0" class="hidden"> Sun
                            </label>
                        </div>
                    </div>

                    <!-- 3. Collapsible Day of Month (1 - 31) Picker (Clean trigger box + Dropdown Grid) -->
                    <div id="freq-field-monthly" class="hidden flex-col gap-1.5 mt-1">
                        <label class="text-[11px] font-mono text-slate-400">Day of Month</label>
                        <button id="btn-toggle-monthly-picker" type="button" class="btn-press w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-900 text-slate-100 text-xs font-mono transition-all cursor-pointer">
                            <span class="flex items-center gap-2">
                                <i data-lucide="calendar-days" class="size-4 text-cyan-400"></i>
                                <span>Day <span id="monthly-day-display" class="font-bold text-cyan-400 tabular-nums">1</span> of every month</span>
                            </span>
                            <i data-lucide="chevron-down" id="monthly-picker-chevron" class="size-4 text-slate-400 transition-transform duration-200"></i>
                        </button>
                        <input id="reminder-dayofmonth-input" type="hidden" value="1">

                        <div id="monthly-picker-dropdown" class="hidden p-3 rounded-2xl bg-slate-900/95 flex flex-col gap-2 mt-1">
                            <div class="flex items-center justify-between text-[11px] font-mono text-slate-400 px-1">
                                <span>Select Day (1 - 31)</span>
                                <span class="text-cyan-400 text-[10px]">Monthly Repeat</span>
                            </div>
                            <div id="monthly-days-grid" class="grid grid-cols-7 gap-1.5 text-center font-mono text-xs">
                                <!-- Populated with buttons 1 to 31 -->
                            </div>
                        </div>
                    </div>

                    <!-- 4. Repeat Every N Hours Stepper (+ / -) -->
                    <div id="freq-field-interval" class="hidden flex-col gap-2 mt-1">
                        <label class="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                            <i data-lucide="timer" class="size-3.5 text-cyan-400"></i>
                            <span>Repeat Every (Hours)</span>
                        </label>
                        <input id="reminder-interval-input" type="hidden" value="2">
                        <div class="p-3 rounded-2xl bg-slate-900/90 flex flex-col gap-2.5">
                            <div class="flex items-center justify-between gap-3">
                                <button id="btn-interval-minus" type="button" class="btn-press size-10 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white flex items-center justify-center transition-all cursor-pointer shrink-0" title="Decrease 1 Hour">
                                    <i data-lucide="minus" class="size-4"></i>
                                </button>
                                <div class="flex flex-col items-center">
                                    <div class="flex items-baseline gap-1">
                                        <span id="interval-hours-display" class="text-2xl font-mono font-bold text-cyan-400 tabular-nums">2</span>
                                        <span class="text-xs font-mono text-slate-400">hours</span>
                                    </div>
                                    <span id="interval-desc-preview" class="text-[10px] font-mono text-slate-500">Every 2 hours</span>
                                </div>
                                <button id="btn-interval-plus" type="button" class="btn-press size-10 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white flex items-center justify-center transition-all cursor-pointer shrink-0" title="Increase 1 Hour">
                                    <i data-lucide="plus" class="size-4"></i>
                                </button>
                            </div>
                            <!-- Quick presets -->
                            <div class="flex items-center justify-center gap-1.5 pt-2 border-t border-slate-800/40 flex-wrap">
                                <button type="button" class="btn-interval-preset px-2.5 py-1 rounded-lg bg-slate-800/50 hover:bg-slate-800 text-[11px] font-mono text-slate-400 hover:text-cyan-400 transition-all cursor-pointer" data-val="1">1h</button>
                                <button type="button" class="btn-interval-preset px-2.5 py-1 rounded-lg bg-slate-800/50 hover:bg-slate-800 text-[11px] font-mono text-slate-400 hover:text-cyan-400 transition-all cursor-pointer" data-val="2">2h</button>
                                <button type="button" class="btn-interval-preset px-2.5 py-1 rounded-lg bg-slate-800/50 hover:bg-slate-800 text-[11px] font-mono text-slate-400 hover:text-cyan-400 transition-all cursor-pointer" data-val="3">3h</button>
                                <button type="button" class="btn-interval-preset px-2.5 py-1 rounded-lg bg-slate-800/50 hover:bg-slate-800 text-[11px] font-mono text-slate-400 hover:text-cyan-400 transition-all cursor-pointer" data-val="4">4h</button>
                                <button type="button" class="btn-interval-preset px-2.5 py-1 rounded-lg bg-slate-800/50 hover:bg-slate-800 text-[11px] font-mono text-slate-400 hover:text-cyan-400 transition-all cursor-pointer" data-val="6">6h</button>
                                <button type="button" class="btn-interval-preset px-2.5 py-1 rounded-lg bg-slate-800/50 hover:bg-slate-800 text-[11px] font-mono text-slate-400 hover:text-cyan-400 transition-all cursor-pointer" data-val="8">8h</button>
                                <button type="button" class="btn-interval-preset px-2.5 py-1 rounded-lg bg-slate-800/50 hover:bg-slate-800 text-[11px] font-mono text-slate-400 hover:text-cyan-400 transition-all cursor-pointer" data-val="12">12h</button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Alert Channels (Sound & Desktop) -->
                <div class="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 text-xs font-mono text-slate-300">
                    <label class="flex items-center gap-2 cursor-pointer">
                        <input id="reminder-sound-check" type="checkbox" checked class="rounded bg-slate-800 text-cyan-500 focus:ring-0">
                        <span>Chime Sound</span>
                    </label>
                    <label class="flex items-center gap-2 cursor-pointer">
                        <input id="reminder-browser-check" type="checkbox" checked class="rounded bg-slate-800 text-cyan-500 focus:ring-0">
                        <span>Browser Notification</span>
                    </label>
                </div>

                <!-- Submit / Cancel Buttons -->
                <div class="flex items-center justify-end gap-3 pt-2">
                    <button id="btn-cancel-reminder" type="button" class="btn-press px-4 py-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-700/60 text-slate-400 hover:text-white text-xs font-mono transition-all">Cancel</button>
                    <button type="submit" class="btn-press px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono transition-all shadow-lg shadow-cyan-500/20">Save Reminder</button>
                </div>
            </form>
        </div>
    </div>
`;
