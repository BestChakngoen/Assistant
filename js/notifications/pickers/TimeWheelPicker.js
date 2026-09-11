/**
 * TimeWheelPicker.js - Mobile-Style Drum Roller Time Picker
 * Handles dual-column wheel scroll snapping (00-23 hours, 00-59 minutes),
 * center highlight lens, live value synchronization, and popover toggle.
 * Adheres strictly to SRP, Clean Code, and Strict No White Borders.
 */

export class TimeWheelPicker {
    constructor() {
        this.selectedHour = 9;
        this.selectedMinute = 0;
        this.isOpen = false;

        this.dom = {
            btnToggle: null,
            dropdown: null,
            chevron: null,
            input: null,
            display: null,
            btnDone: null,
            confirmVal: null,
            hoursCol: null,
            hoursList: null,
            minsCol: null,
            minsList: null
        };
    }

    init(onMutualClose) {
        this.cacheDom();
        this.buildColumns();
        this.bindEvents(onMutualClose);
        this.setupScrollListeners();
    }

    cacheDom() {
        this.dom.btnToggle = document.getElementById('btn-toggle-time-picker');
        this.dom.dropdown = document.getElementById('time-picker-dropdown');
        this.dom.chevron = document.getElementById('time-picker-chevron');
        this.dom.input = document.getElementById('reminder-time-input');
        this.dom.display = document.getElementById('time-picker-display');
        this.dom.btnDone = document.getElementById('btn-time-picker-done');
        this.dom.confirmVal = document.getElementById('time-picker-confirm-val');
        this.dom.hoursCol = document.getElementById('wheel-hours-col');
        this.dom.hoursList = document.getElementById('wheel-hours-list');
        this.dom.minsCol = document.getElementById('wheel-mins-col');
        this.dom.minsList = document.getElementById('wheel-mins-list');
    }

    buildColumns() {
        if (!this.dom.hoursList || !this.dom.minsList) return;

        // Build Hours (00 - 23)
        let hoursHtml = '';
        for (let h = 0; h < 24; h++) {
            const hStr = String(h).padStart(2, '0');
            hoursHtml += `<div class="wheel-item" data-hour="${h}">${hStr}</div>`;
        }
        this.dom.hoursList.innerHTML = hoursHtml;

        // Build Minutes (00 - 59)
        let minsHtml = '';
        for (let m = 0; m < 60; m++) {
            const mStr = String(m).padStart(2, '0');
            minsHtml += `<div class="wheel-item" data-min="${m}">${mStr}</div>`;
        }
        this.dom.minsList.innerHTML = minsHtml;
    }

    bindEvents(onMutualClose) {
        // Toggle Accordion / Dropdown
        if (this.dom.btnToggle) {
            this.dom.btnToggle.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggle(onMutualClose);
            });
        }

        // Done / Confirm Button inside Dropdown
        if (this.dom.btnDone) {
            this.dom.btnDone.addEventListener('click', (e) => {
                e.preventDefault();
                this.close();
            });
        }

        // Direct Item Click (Smooth Roll to Lens)
        if (this.dom.hoursList) {
            this.dom.hoursList.addEventListener('click', (e) => {
                const item = e.target.closest('.wheel-item');
                if (!item) return;
                const h = parseInt(item.getAttribute('data-hour'), 10);
                if (!isNaN(h)) {
                    this.selectedHour = h;
                    this.scrollWheelTo('hour', h, true);
                    this.updateDisplay();
                    this.highlightWheelItem('hour', h);
                }
            });
        }

        if (this.dom.minsList) {
            this.dom.minsList.addEventListener('click', (e) => {
                const item = e.target.closest('.wheel-item');
                if (!item) return;
                const m = parseInt(item.getAttribute('data-min'), 10);
                if (!isNaN(m)) {
                    this.selectedMinute = m;
                    this.scrollWheelTo('min', m, true);
                    this.updateDisplay();
                    this.highlightWheelItem('min', m);
                }
            });
        }

        // Close on outside click
        document.addEventListener('click', (e) => {
            if (this.isOpen) {
                const field = document.getElementById('freq-field-time');
                if (field && !field.contains(e.target)) {
                    this.close();
                }
            }
        });
    }

    setupScrollListeners() {
        if (this.dom.hoursCol) {
            this.dom.hoursCol.addEventListener('scroll', () => {
                if (!this.isOpen) return;
                const scrollTop = this.dom.hoursCol.scrollTop;
                const h = Math.max(0, Math.min(23, Math.round(scrollTop / 36)));
                if (h !== this.selectedHour) {
                    this.selectedHour = h;
                    this.updateDisplay();
                    this.highlightWheelItem('hour', h);
                }
            }, { passive: true });
        }

        if (this.dom.minsCol) {
            this.dom.minsCol.addEventListener('scroll', () => {
                if (!this.isOpen) return;
                const scrollTop = this.dom.minsCol.scrollTop;
                const m = Math.max(0, Math.min(59, Math.round(scrollTop / 36)));
                if (m !== this.selectedMinute) {
                    this.selectedMinute = m;
                    this.updateDisplay();
                    this.highlightWheelItem('min', m);
                }
            }, { passive: true });
        }
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

        // Align wheels smoothly once visible
        requestAnimationFrame(() => {
            this.scrollWheelTo('hour', this.selectedHour, false);
            this.scrollWheelTo('min', this.selectedMinute, false);
            this.highlightWheelItem('hour', this.selectedHour);
            this.highlightWheelItem('min', this.selectedMinute);
        });
    }

    close() {
        if (!this.dom.dropdown) return;
        this.dom.dropdown.classList.add('hidden');
        this.isOpen = false;
        if (this.dom.chevron) {
            this.dom.chevron.classList.remove('rotate-180');
        }
    }

    scrollWheelTo(type, index, smooth = false) {
        const col = type === 'hour' ? this.dom.hoursCol : this.dom.minsCol;
        if (!col) return;
        const targetTop = index * 36;
        if (smooth) {
            col.scrollTo({ top: targetTop, behavior: 'smooth' });
        } else {
            col.scrollTop = targetTop;
        }
    }

    highlightWheelItem(type, index) {
        const list = type === 'hour' ? this.dom.hoursList : this.dom.minsList;
        if (!list) return;
        const attr = type === 'hour' ? 'data-hour' : 'data-min';
        list.querySelectorAll('.wheel-item').forEach(item => {
            const val = parseInt(item.getAttribute(attr), 10);
            item.classList.toggle('is-selected', val === index);
        });
    }

    setTime(timeStr) {
        if (!timeStr || !timeStr.includes(':')) timeStr = '09:00';
        const [h, m] = timeStr.split(':').map(n => parseInt(n, 10) || 0);

        this.selectedHour = Math.min(23, Math.max(0, h));
        this.selectedMinute = Math.min(59, Math.max(0, m));

        this.updateDisplay();
        this.highlightWheelItem('hour', this.selectedHour);
        this.highlightWheelItem('min', this.selectedMinute);

        if (this.isOpen) {
            this.scrollWheelTo('hour', this.selectedHour, false);
            this.scrollWheelTo('min', this.selectedMinute, false);
        }
    }

    updateDisplay() {
        const hStr = String(this.selectedHour).padStart(2, '0');
        const mStr = String(this.selectedMinute).padStart(2, '0');
        const formatted = `${hStr}:${mStr}`;

        if (this.dom.input) this.dom.input.value = formatted;
        if (this.dom.display) this.dom.display.innerText = formatted;
        if (this.dom.confirmVal) this.dom.confirmVal.innerText = formatted;
    }
}
