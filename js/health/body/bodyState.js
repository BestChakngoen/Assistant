export default class BodyState {
    constructor(firebaseManager) {
        this.fb = firebaseManager;
        this.state = {
            weight: 65,
            height: 170,
            age: 28,
            gender: 'male',
            activityLevel: 1.2,
            targetWeight: 60,
            weightHistory: []
        };
        this.onStateChange = null;
    }

    init() {
        this.fb.subscribe('body', (data) => {
            if (data) {
                this.state = { ...this.state, ...data };
                if (this.state.weightHistory && Array.isArray(this.state.weightHistory)) {
                    this.state.weightHistory = this.state.weightHistory.filter(h => !isNaN(h.weight));
                }
                if (this.onStateChange) this.onStateChange();
            }
        });
    }

    save() {
        this.fb.saveData('body', this.state);
    }

    updateField(key, val) {
        this.state[key] = key === 'gender' ? val : Number(val);
        this.save();
        if (this.onStateChange) this.onStateChange();
    }

    recordWeight(dateStr, currentWeight) {
        if (!currentWeight || isNaN(currentWeight) || !dateStr) return false;

        this.state.weightHistory = this.state.weightHistory || [];
        this.state.weightHistory = this.state.weightHistory.filter(h => h.date !== dateStr);
        this.state.weightHistory.push({ date: dateStr, weight: currentWeight });
        
        this.state.weightHistory.sort((a, b) => new Date(a.date) - new Date(b.date));

        const lastEntry = this.state.weightHistory[this.state.weightHistory.length - 1];
        if (lastEntry) this.state.weight = lastEntry.weight;

        this.save();
        if (this.onStateChange) this.onStateChange();
        return true;
    }

    deleteWeight(dateStr) {
        if (!this.state.weightHistory) return;
        this.state.weightHistory = this.state.weightHistory.filter(h => h.date !== dateStr);
        
        const lastEntry = this.state.weightHistory[this.state.weightHistory.length - 1];
        if (lastEntry) this.state.weight = lastEntry.weight;

        this.save();
        if (this.onStateChange) this.onStateChange();
    }

    getEntryByDate(dateStr) {
        return this.state.weightHistory?.find(h => h.date === dateStr) || null;
    }
}
