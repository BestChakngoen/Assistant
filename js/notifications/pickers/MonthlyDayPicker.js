/**
 * MonthlyDayPicker.js - Day of Month (1 - 31) Schedule Picker
 * Handles 1-31 monthly grid rendering, day selection, active highlight,
 * and collapsible popover with auto-collapse.
 * Adheres strictly to SRP, Clean Code, and Strict No White Borders.
 */

export class MonthlyDayPicker {
    constructor() {
        this.dayOfMonth = 1;
        this.isOpen = false;

        this.dom = {
            btnToggle: null,
            dropdown: null,
            chevron: null,
            input: null,
            display: null,
            daysGrid: null
        };
    }

    init(onMutualClose) {
        this.cacheDom();
        this.buildGrid();
        this.bindEvents(onMutualClose);
    }

    cacheDom() {
        this.dom.btnToggle = document.getElementById('btn-toggle-monthly-picker');
        this.dom.dropdown = document.getElementById('monthly-picker-dropdown');
        this.dom.chevron = document.getElementById('monthly-picker-chevron');
        this.dom.input = document.getElementById('reminder-dayofmonth-input');
        this.dom.display = document.getElementById('monthly-day-display');
        this.dom.daysGrid = document.getElementById('monthly-days-grid');
    }

    buildGrid() {
        if (!this.dom.daysGrid) return;
        let html = '';
        for (let d = 1; d <= 31; d++) {
            html += `
                <button type="button" class="monthly-day-btn size-8 sm:size-9 rounded-xl flex items-center justify-center transition-all cursor-pointer text-slate-300 hover:bg-slate-800 hover:text-white" data-day="${d}">
                    ${d}
                </button>
            `;
        }
        this.dom.daysGrid.innerHTML = html;
    }

    bindEvents(onMutualClose) {
        // Toggle Popover
        if (this.dom.btnToggle) {
            this.dom.btnToggle.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggle(onMutualClose);
            });
        }

        // Day of Month Selection Delegation - Auto-collapse to clean input box
        if (this.dom.daysGrid) {
            this.dom.daysGrid.addEventListener('click', (e) => {
                const btn = e.target.closest('.monthly-day-btn');
                if (!btn) return;
                const d = parseInt(btn.getAttribute('data-day'), 10);
                if (!isNaN(d)) {
                    this.setDayOfMonth(d);
                    this.close(); // Auto-collapse to clean input box
                }
            });
        }

        // Close on outside click
        document.addEventListener('click', (e) => {
            if (this.isOpen) {
                const field = document.getElementById('freq-field-monthly');
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
    }

    close() {
        if (!this.dom.dropdown) return;
        this.dom.dropdown.classList.add('hidden');
        this.isOpen = false;
        if (this.dom.chevron) {
            this.dom.chevron.classList.remove('rotate-180');
        }
    }

    setDayOfMonth(day) {
        const d = Math.min(31, Math.max(1, parseInt(day || 1, 10)));
        this.dayOfMonth = d;

        if (this.dom.input) this.dom.input.value = d;
        if (this.dom.display) this.dom.display.innerText = d;

        if (this.dom.daysGrid) {
            this.dom.daysGrid.querySelectorAll('.monthly-day-btn').forEach(btn => {
                const btnDay = parseInt(btn.getAttribute('data-day'), 10);
                const isSelected = (btnDay === d);
                btn.classList.toggle('bg-cyan-500', isSelected);
                btn.classList.toggle('text-slate-950', isSelected);
                btn.classList.toggle('font-bold', isSelected);
                btn.classList.toggle('shadow-md', isSelected);
                btn.classList.toggle('shadow-cyan-500/20', isSelected);
                btn.classList.toggle('text-slate-300', !isSelected);
            });
        }
    }
}
