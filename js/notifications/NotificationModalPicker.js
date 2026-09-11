import { DatePicker } from './pickers/DatePicker.js';
import { TimeWheelPicker } from './pickers/TimeWheelPicker.js';
import { MonthlyDayPicker } from './pickers/MonthlyDayPicker.js';
import { IntervalStepper } from './pickers/IntervalStepper.js';

/**
 * NotificationModalPicker.js - Interactive Schedule Pickers Coordinator (Facade)
 * Orchestrates DatePicker, TimeWheelPicker, MonthlyDayPicker, and IntervalStepper.
 * Adheres strictly to SOLID, Clean Code, and Zero Regression standards.
 */
export class NotificationModalPicker {
    constructor() {
        this.datePicker = new DatePicker();
        this.timePicker = new TimeWheelPicker();
        this.monthlyPicker = new MonthlyDayPicker();
        this.intervalStepper = new IntervalStepper();
    }

    get selectedDate() {
        return this.datePicker.selectedDate;
    }

    get selectedHour() {
        return this.timePicker.selectedHour;
    }

    get selectedMinute() {
        return this.timePicker.selectedMinute;
    }

    get intervalHours() {
        return this.intervalStepper.intervalHours;
    }

    get dayOfMonth() {
        return this.monthlyPicker.dayOfMonth;
    }

    get isDateDropdownOpen() {
        return this.datePicker.isOpen;
    }

    get isTimeDropdownOpen() {
        return this.timePicker.isOpen;
    }

    get isMonthlyDropdownOpen() {
        return this.monthlyPicker.isOpen;
    }

    init() {
        this.datePicker.init(() => {
            this.timePicker.close();
            this.monthlyPicker.close();
        });

        this.timePicker.init(() => {
            this.datePicker.close();
            this.monthlyPicker.close();
        });

        this.monthlyPicker.init(() => {
            this.datePicker.close();
            this.timePicker.close();
        });

        this.intervalStepper.init();
    }

    // ==========================================
    // DELEGATED CONTROLS & API PRESERVATION
    // ==========================================

    setDate(dateStr) {
        this.datePicker.setDate(dateStr);
    }

    setTime(timeStr) {
        this.timePicker.setTime(timeStr);
    }

    setDayOfMonth(day) {
        this.monthlyPicker.setDayOfMonth(day);
    }

    setInterval(hours) {
        this.intervalStepper.setInterval(hours);
    }

    toggleDatePicker() {
        this.datePicker.toggle(() => {
            this.timePicker.close();
            this.monthlyPicker.close();
        });
    }

    openDatePicker() {
        this.datePicker.open(() => {
            this.timePicker.close();
            this.monthlyPicker.close();
        });
    }

    closeDatePicker() {
        this.datePicker.close();
    }

    toggleTimePicker() {
        this.timePicker.toggle(() => {
            this.datePicker.close();
            this.monthlyPicker.close();
        });
    }

    openTimePicker() {
        this.timePicker.open(() => {
            this.datePicker.close();
            this.monthlyPicker.close();
        });
    }

    closeTimePicker() {
        this.timePicker.close();
    }

    toggleMonthlyPicker() {
        this.monthlyPicker.toggle(() => {
            this.datePicker.close();
            this.timePicker.close();
        });
    }

    openMonthlyPicker() {
        this.monthlyPicker.open(() => {
            this.datePicker.close();
            this.timePicker.close();
        });
    }

    closeMonthlyPicker() {
        this.monthlyPicker.close();
    }

    closeAllDropdowns() {
        this.datePicker.close();
        this.timePicker.close();
        this.monthlyPicker.close();
    }
}
