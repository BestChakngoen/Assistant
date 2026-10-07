export default class DietState {
    constructor(firebaseManager) {
        this.fb = firebaseManager;
        this.state = {
            currentFoodType: 'meal',
            targetCalories: 2000,
            foodLog: []
        };
        this.onStateChange = null;
    }

    init() {
        const getThaiDate = () => {
            const now = new Date();
            const thaiTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));
            const year = thaiTime.getFullYear();
            const month = String(thaiTime.getMonth() + 1).padStart(2, '0');
            const day = String(thaiTime.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        this.fb.subscribe('diet', (data) => {
            if (data) {
                const today = getThaiDate();
                if(data.foodLog) {
                    this.state.foodLog = data.foodLog
                        .map(item => ({
                            ...item,
                            date: item.date || today, 
                            calories: parseInt(item.calories) 
                        }))
                        .filter(item => !isNaN(item.calories)); 
                }
                if(data.targetCalories) this.state.targetCalories = Number(data.targetCalories) || 2000;
                
                if (this.onStateChange) this.onStateChange();
            }
        });
    }

    save() {
        this.fb.saveData('diet', {
            targetCalories: this.state.targetCalories,
            foodLog: this.state.foodLog
        });
    }

    setTarget(newTarget) {
        this.state.targetCalories = newTarget;
        this.save();
        if (this.onStateChange) this.onStateChange();
    }

    setFoodType(type) {
        this.state.currentFoodType = type;
    }

    addFood(dateStr, name, calVal) {
        if (!name || isNaN(calVal) || !dateStr) return false;

        const newItem = {
            id: Date.now(),
            date: dateStr,
            name: name,
            calories: calVal,
            category: this.state.currentFoodType
        };
        this.state.foodLog.push(newItem);
        
        this.save();
        if (this.onStateChange) this.onStateChange();
        return true;
    }

    editFood(id, dateStr, name, calVal) {
        const itemIndex = this.state.foodLog.findIndex(x => x.id === id);
        if (itemIndex > -1) {
            this.state.foodLog[itemIndex] = {
                ...this.state.foodLog[itemIndex],
                name: name,
                calories: calVal,
                category: this.state.currentFoodType,
                date: dateStr 
            };
            this.save();
            if (this.onStateChange) this.onStateChange();
            return true;
        }
        return false;
    }

    removeFood(id) {
        this.state.foodLog = this.state.foodLog.filter(x => x.id !== id);
        this.save();
        if (this.onStateChange) this.onStateChange();
    }

    getDailyLogs(dateStr) {
        return this.state.foodLog.filter(item => item.date === dateStr);
    }
}
