import { ShareUI } from '../ui/share/ShareUI.js';
import { NotificationScheduler } from './NotificationScheduler.js';

/**
 * NotificationFormModal.js - Reminder Form & Modal Lifecycle Manager
 * Handles modal open/close transitions, frequency field visibility,
 * and form field extraction & validation.
 * Adheres strictly to SRP and Clean Code standards.
 */

export class NotificationFormModal {
    constructor() {
        this.dom = {
            modal: null,
            form: null,
            titleEl: null,
            idInput: null,
            titleInput: null,
            notesInput: null,
            catSelect: null,
            priSelect: null,
            freqSelect: null,
            dateInput: null,
            timeInput: null,
            soundCheck: null,
            browserCheck: null,
            dayOfMonthInput: null,
            intervalInput: null,
            fieldDate: null,
            fieldTime: null,
            fieldWeekdays: null,
            fieldMonthly: null,
            fieldInterval: null
        };
    }

    init() {
        this.dom.modal = document.getElementById('modal-reminder');
        this.dom.form = document.getElementById('form-reminder');
        this.dom.titleEl = document.getElementById('modal-reminder-title');
        this.dom.idInput = document.getElementById('reminder-id');
        this.dom.titleInput = document.getElementById('reminder-title-input');
        this.dom.notesInput = document.getElementById('reminder-notes-input');
        this.dom.catSelect = document.getElementById('reminder-category-select');
        this.dom.priSelect = document.getElementById('reminder-priority-select');
        this.dom.freqSelect = document.getElementById('reminder-freq-select');
        this.dom.dateInput = document.getElementById('reminder-date-input');
        this.dom.timeInput = document.getElementById('reminder-time-input');
        this.dom.soundCheck = document.getElementById('reminder-sound-check');
        this.dom.browserCheck = document.getElementById('reminder-browser-check');
        this.dom.dayOfMonthInput = document.getElementById('reminder-dayofmonth-input');
        this.dom.intervalInput = document.getElementById('reminder-interval-input');

        this.dom.fieldDate = document.getElementById('freq-field-date');
        this.dom.fieldTime = document.getElementById('freq-field-time');
        this.dom.fieldWeekdays = document.getElementById('freq-field-weekdays');
        this.dom.fieldMonthly = document.getElementById('freq-field-monthly');
        this.dom.fieldInterval = document.getElementById('freq-field-interval');
    }

    updateFrequencyFields(freq) {
        if (!this.dom.fieldDate) return;
        this.dom.fieldDate.classList.toggle('hidden', freq !== 'once');
        this.dom.fieldTime.classList.toggle('hidden', freq === 'interval');
        this.dom.fieldWeekdays.classList.toggle('hidden', freq !== 'weekly');
        this.dom.fieldMonthly.classList.toggle('hidden', freq !== 'monthly');
        this.dom.fieldInterval.classList.toggle('hidden', freq !== 'interval');
    }

    open(reminder = null, picker = null) {
        if (!this.dom.modal || !this.dom.form) return;

        if (this.dom.titleEl) {
            this.dom.titleEl.innerText = reminder ? 'Edit Reminder / Alert' : 'Add Reminder / Alert';
        }
        if (this.dom.idInput) this.dom.idInput.value = reminder ? reminder.id : '';
        if (this.dom.titleInput) this.dom.titleInput.value = reminder ? reminder.title : '';
        if (this.dom.notesInput) this.dom.notesInput.value = reminder ? (reminder.notes || '') : '';
        if (this.dom.catSelect) this.dom.catSelect.value = reminder ? reminder.category : 'trading';
        if (this.dom.priSelect) this.dom.priSelect.value = reminder ? reminder.priority : 'normal';

        const freq = reminder ? (reminder.type || 'once') : 'daily';
        if (this.dom.freqSelect) this.dom.freqSelect.value = freq;
        this.updateFrequencyFields(freq);

        const todayStr = new Date().toISOString().split('T')[0];
        const initDate = reminder && reminder.date ? reminder.date : todayStr;
        const initTime = reminder && reminder.time ? reminder.time : '09:00';
        const initDayOfMonth = reminder && reminder.dayOfMonth ? reminder.dayOfMonth : 1;
        const initInterval = reminder && reminder.intervalHours ? reminder.intervalHours : 2;

        if (picker) {
            if (typeof picker.closeAllDropdowns === 'function') {
                picker.closeAllDropdowns();
            }
            picker.setDate(initDate);
            picker.setTime(initTime);
            picker.setDayOfMonth(initDayOfMonth);
            picker.setInterval(initInterval);
        }

        if (this.dom.soundCheck) {
            this.dom.soundCheck.checked = reminder ? reminder.sound !== false : true;
        }
        if (this.dom.browserCheck) {
            this.dom.browserCheck.checked = reminder ? reminder.browserNotif !== false : true;
        }

        // Weekly Days Checkboxes
        const days = reminder && Array.isArray(reminder.days) ? reminder.days : [1];
        document.querySelectorAll('input[name="weekly-day"]').forEach(cb => {
            cb.checked = days.includes(parseInt(cb.value, 10));
        });

        this.dom.modal.style.display = 'flex';
        this.dom.modal.classList.remove('hidden');
        this.dom.modal.classList.add('flex');

        if (window.lucide && typeof window.lucide.createIcons === 'function') {
            window.lucide.createIcons();
        }

        if (this.dom.titleInput) {
            setTimeout(() => this.dom.titleInput.focus(), 50);
        }
    }

    close(picker = null) {
        if (!this.dom.modal) return;
        if (picker && typeof picker.closeAllDropdowns === 'function') {
            picker.closeAllDropdowns();
        }

        this.dom.modal.style.display = 'none';
        this.dom.modal.classList.add('hidden');
        this.dom.modal.classList.remove('flex');

        if (this.dom.form) this.dom.form.reset();
    }

    extractFormData() {
        const title = this.dom.titleInput?.value.trim();
        if (!title) {
            ShareUI.showToast('Validation Error', 'Reminder title is required', 'error');
            return null;
        }

        const selectedDays = [];
        document.querySelectorAll('input[name="weekly-day"]:checked').forEach(cb => {
            selectedDays.push(parseInt(cb.value, 10));
        });

        const reminderData = {
            title,
            notes: this.dom.notesInput?.value.trim() || '',
            category: this.dom.catSelect?.value || 'trading',
            priority: this.dom.priSelect?.value || 'normal',
            type: this.dom.freqSelect?.value || 'once',
            date: this.dom.dateInput?.value || '',
            time: this.dom.timeInput?.value || '09:00',
            days: selectedDays.length > 0 ? selectedDays : [1],
            dayOfMonth: parseInt(this.dom.dayOfMonthInput?.value || '1', 10),
            intervalHours: parseInt(this.dom.intervalInput?.value || '2', 10),
            sound: this.dom.soundCheck ? this.dom.soundCheck.checked : true,
            browserNotif: this.dom.browserCheck ? this.dom.browserCheck.checked : true,
            enabled: true,
            updatedAt: Date.now()
        };

        reminderData.nextDueAt = NotificationScheduler.calculateNextDue(reminderData);
        return reminderData;
    }
}
