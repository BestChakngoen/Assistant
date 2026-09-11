/**
 * IntervalStepper.js - Hourly Interval Stepper (+ / -) & Presets
 * Handles interval value changes, step increment/decrement, and preset button selection.
 * Adheres strictly to SRP, Clean Code, and Strict No White Borders.
 */

export class IntervalStepper {
    constructor() {
        this.intervalHours = 2;

        this.dom = {
            input: null,
            display: null,
            preview: null,
            btnMinus: null,
            btnPlus: null,
            container: null
        };
    }

    init() {
        this.cacheDom();
        this.bindEvents();
    }

    cacheDom() {
        this.dom.input = document.getElementById('reminder-interval-input');
        this.dom.display = document.getElementById('interval-hours-display');
        this.dom.preview = document.getElementById('interval-desc-preview');
        this.dom.btnMinus = document.getElementById('btn-interval-minus');
        this.dom.btnPlus = document.getElementById('btn-interval-plus');
        this.dom.container = document.getElementById('freq-field-interval');
    }

    bindEvents() {
        if (this.dom.btnMinus) {
            this.dom.btnMinus.addEventListener('click', (e) => {
                e.preventDefault();
                this.setInterval(Math.max(1, this.intervalHours - 1));
            });
        }

        if (this.dom.btnPlus) {
            this.dom.btnPlus.addEventListener('click', (e) => {
                e.preventDefault();
                this.setInterval(Math.min(72, this.intervalHours + 1));
            });
        }

        if (this.dom.container) {
            this.dom.container.addEventListener('click', (e) => {
                const btn = e.target.closest('.btn-interval-preset');
                if (!btn) return;
                const val = parseInt(btn.getAttribute('data-val'), 10);
                if (!isNaN(val)) {
                    this.setInterval(val);
                }
            });
        }
    }

    setInterval(hours) {
        const val = Math.min(72, Math.max(1, parseInt(hours || 1, 10)));
        this.intervalHours = val;

        if (this.dom.input) this.dom.input.value = val;
        if (this.dom.display) this.dom.display.innerText = val;
        if (this.dom.preview) {
            this.dom.preview.innerText = val === 1 ? 'Every 1 hour' : `Every ${val} hours`;
        }

        // Highlight active preset button if match
        if (this.dom.container) {
            this.dom.container.querySelectorAll('.btn-interval-preset').forEach(b => {
                const bVal = parseInt(b.getAttribute('data-val'), 10);
                const match = (bVal === val);
                b.classList.toggle('bg-cyan-500/20', match);
                b.classList.toggle('text-cyan-400', match);
                b.classList.toggle('font-bold', match);
                b.classList.toggle('text-slate-400', !match);
            });
        }
    }
}
