export default class SleepState {
    constructor(firebaseManager) {
        this.fb = firebaseManager;
        this.state = { history: [] };
        
        this.targets = { 
            duration: { min: 7.5, max: 9.0, ideal: 8.25 },
            bedTime: { min: '21:00', max: '22:00', ideal: '21:30' },
            wakeTime: { min: '05:00', max: '06:00', ideal: '05:30' }
        };
        this.onStateChange = null;
    }

    init() {
        this.fb.subscribe('sleep', (data) => {
            if (data) {
                this.state = { ...this.state, ...data };
                if (this.state.history && Array.isArray(this.state.history)) {
                    this.state.history = this.state.history.filter(h => !isNaN(h.duration));
                }
                if (this.onStateChange) this.onStateChange();
            }
        });
    }

    save() {
        this.fb.saveData('sleep', this.state);
    }

    getEntry(dateStr) {
        return this.state.history.find(h => h.date === dateStr);
    }

    recordSleep(dateStr, bedTime, wakeTime, duration) {
        if (!dateStr || isNaN(duration)) return false;

        this.state.history = this.state.history.filter(h => h.date !== dateStr);
        this.state.history.push({ 
            date: dateStr,
            bedTime: bedTime, 
            wakeTime: wakeTime, 
            duration: duration 
        });
        this.state.history.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        this.save();
        if (this.onStateChange) this.onStateChange();
        return true;
    }

    deleteSleep(dateStr) {
        this.state.history = this.state.history.filter(h => h.date !== dateStr);
        this.save();
        if (this.onStateChange) this.onStateChange();
    }
}
