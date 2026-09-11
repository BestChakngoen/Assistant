/**
 * DatePicker.js - Mini-Calendar Schedule Picker
 * Handles calendar grid generation, month navigation, and collapsible popover.
 * Adheres strictly to SRP, Clean Code, and Strict No White Borders.
 */

export class DatePicker {
    constructor() {
        this.selectedDate = new Date().toISOString().split('T')[0];
        this.calYear = new Date().getFullYear();
        this.calMonth = new Date().getMonth(); // 0 - 11
        this.isOpen = false;

        this.dom = {
            btnToggle: null,
            dropdown: null,
            chevron: null,
            input: null,
            display: null,
            monthYear: null,
            daysGrid: null,
            btnPrev: null,
            btnNext: null,
            btnToday: null
        };
    }

    init(onMutualClose) {
        this.cacheDom();
        this.bindEvents(onMutualClose);
    }

    cacheDom() {
        this.dom.btnToggle = document.getElementById('btn-toggle-date-picker');
        this.dom.dropdown = document.getElementById('date-picker-dropdown');
        this.dom.chevron = document.getElementById('date-picker-chevron');
        this.dom.input = document.getElementById('reminder-date-input');
        this.dom.display = document.getElementById('cal-date-display');
        this.dom.monthYear = document.getElementById('cal-month-year');
        this.dom.daysGrid = document.getElementById('cal-days-grid');
        this.dom.btnPrev = document.getElementById('btn-cal-prev');
        this.dom.btnNext = document.getElementById('btn-cal-next');
        this.dom.btnToday = document.getElementById('btn-cal-today');
    }

    bindEvents(onMutualClose) {
        // Toggle Popover
        if (this.dom.btnToggle) {
            this.dom.btnToggle.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggle(onMutualClose);
            });
        }

        // Calendar Month Navigation
        if (this.dom.btnPrev) {
            this.dom.btnPrev.addEventListener('click', (e) => {
                e.preventDefault();
                this.calMonth--;
                if (this.calMonth < 0) {
                    this.calMonth = 11;
                    this.calYear--;
                }
                this.renderCalendarGrid();
            });
        }

        if (this.dom.btnNext) {
            this.dom.btnNext.addEventListener('click', (e) => {
                e.preventDefault();
                this.calMonth++;
                if (this.calMonth > 11) {
                    this.calMonth = 0;
                    this.calYear++;
                }
                this.renderCalendarGrid();
            });
        }

        if (this.dom.btnToday) {
            this.dom.btnToday.addEventListener('click', (e) => {
                e.preventDefault();
                const now = new Date();
                this.calYear = now.getFullYear();
                this.calMonth = now.getMonth();
                const todayStr = now.toISOString().split('T')[0];
                this.setDate(todayStr);
                this.close(); // Auto-collapse to clean input box
            });
        }

        // Calendar Day Selection Delegation - Auto collapse on selection
        if (this.dom.daysGrid) {
            this.dom.daysGrid.addEventListener('click', (e) => {
                const dayBtn = e.target.closest('.cal-day-btn');
                if (!dayBtn || dayBtn.disabled) return;
                const dateVal = dayBtn.getAttribute('data-date');
                if (dateVal) {
                    this.setDate(dateVal);
                    this.close(); // Auto-collapse to clean input box
                }
            });
        }

        // Close on outside click
        document.addEventListener('click', (e) => {
            if (this.isOpen) {
                const field = document.getElementById('freq-field-date');
                if (field && !field.contains(e.target)) {
                    this.close();
                }
            }
        });
    }

    toggle(onMutualClose) {
        if (this.isOpen) {
            this.close();
        } else {
            this.open(onMutualClose);
        }
    }

    open(onMutualClose) {
        if (typeof onMutualClose === 'function') {
            onMutualClose();
        }
        if (!this.dom.dropdown) return;
        this.dom.dropdown.classList.remove('hidden');
        this.isOpen = true;
        if (this.dom.chevron) {
            this.dom.chevron.classList.add('rotate-180');
        }
        this.renderCalendarGrid();
    }

    close() {
        if (!this.dom.dropdown) return;
        this.dom.dropdown.classList.add('hidden');
        this.isOpen = false;
        if (this.dom.chevron) {
            this.dom.chevron.classList.remove('rotate-180');
        }
    }

    setDate(dateStr) {
        if (!dateStr) dateStr = new Date().toISOString().split('T')[0];
        this.selectedDate = dateStr;

        const parts = dateStr.split('-');
        if (parts.length === 3) {
            this.calYear = parseInt(parts[0], 10);
            this.calMonth = parseInt(parts[1], 10) - 1;
        }

        if (this.dom.input) this.dom.input.value = dateStr;
        this.updateDisplay();
        this.renderCalendarGrid();
    }

    updateDisplay() {
        if (!this.dom.display) return;
        try {
            const d = new Date(this.selectedDate + 'T00:00:00');
            const options = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' };
            this.dom.display.innerText = d.toLocaleDateString('en-US', options);
        } catch (e) {
            this.dom.display.innerText = this.selectedDate;
        }
    }

    renderCalendarGrid() {
        if (!this.dom.daysGrid || !this.dom.monthYear) return;

        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        this.dom.monthYear.innerText = `${monthNames[this.calMonth]} ${this.calYear}`;

        // Monday-based index: 0 = Mo, 1 = Tu ... 6 = Su
        const firstDayObj = new Date(this.calYear, this.calMonth, 1);
        let firstDayIndex = firstDayObj.getDay() - 1;
        if (firstDayIndex < 0) firstDayIndex = 6;

        const daysInCurrentMonth = new Date(this.calYear, this.calMonth + 1, 0).getDate();
        const daysInPrevMonth = new Date(this.calYear, this.calMonth, 0).getDate();

        const todayStr = new Date().toISOString().split('T')[0];
        let html = '';

        // Previous month trailing days
        for (let i = firstDayIndex - 1; i >= 0; i--) {
            const dayNum = daysInPrevMonth - i;
            html += `<span class="size-8 flex items-center justify-center rounded-lg text-slate-700 opacity-40 select-none text-[11px]">${dayNum}</span>`;
        }

        // Current month active days
        for (let day = 1; day <= daysInCurrentMonth; day++) {
            const mStr = String(this.calMonth + 1).padStart(2, '0');
            const dStr = String(day).padStart(2, '0');
            const dateVal = `${this.calYear}-${mStr}-${dStr}`;

            const isSelected = (dateVal === this.selectedDate);
            const isToday = (dateVal === todayStr);

            const activeClass = isSelected
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                : (isToday ? 'bg-cyan-500/10 text-cyan-400 font-bold' : 'text-slate-300 hover:bg-slate-800 hover:text-white');

            html += `
                <button type="button" class="cal-day-btn size-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${activeClass}" data-date="${dateVal}">
                    ${day}
                </button>
            `;
        }

        // Next month leading days to complete grid row (multiple of 7)
        const totalRendered = firstDayIndex + daysInCurrentMonth;
        const remaining = (7 - (totalRendered % 7)) % 7;
        for (let d = 1; d <= remaining; d++) {
            html += `<span class="size-8 flex items-center justify-center rounded-lg text-slate-700 opacity-40 select-none text-[11px]">${d}</span>`;
        }

        this.dom.daysGrid.innerHTML = html;
    }
}
