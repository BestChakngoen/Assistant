export default class DetoxState {
    constructor(firebaseManager) {
        this.fb = firebaseManager;
        
        this.LOCKED_HABITS = [
            "บันทึกข้อมูลสุขภาพ",
            "ไม่ดูสื่อลามกอนาจาร",
            "ไม่ไถฟีดมือถือ",
            "ไม่ดูคลิปวิดีโอแบบไร้จุดหมาย",
            "ไม่ดูคลิปวิดีโอขณะกินข้าว",
            "ไม่อ่านคอมเมนต์ในโซเซียล"
        ];
        
        this.HABIT_POINTS = {
            "บันทึกข้อมูลสุขภาพ": 1,
            "ไม่ดูสื่อลามกอนาจาร": 4,
            "ไม่ไถฟีดมือถือ": 2,
            "ไม่ดูคลิปวิดีโอแบบไร้จุดหมาย": 3,
            "ไม่ดูคลิปวิดีโอขณะกินข้าว": 2,
            "ไม่อ่านคอมเมนต์ในโซเซียล": 1
        };

        this.state = {
            history: [] 
        };
        this.onStateChange = null;
    }

    init() {
        this.fb.subscribe('detox', (data) => {
            if (data && data.history) {
                this.state.history = data.history;
                if (this.onStateChange) this.onStateChange();
            }
        });
    }

    save() {
        if (this.state.history.length > 0) {
            this.state.updatedAt = Date.now();
            this.fb.saveData('detox', {
                history: this.state.history,
                updatedAt: this.state.updatedAt
            });
        }
    }
    
    resetData() {
        this.state.history = [];
        this.state.updatedAt = Date.now();
        this.fb.saveData('detox', {
            history: this.state.history,
            updatedAt: this.state.updatedAt,
            isExplicitlyCleared: true
        });
        if (this.onStateChange) this.onStateChange();
    }

    getOrCreateEntry(dateStr) {
        let entry = this.state.history.find(h => h.date === dateStr);
        if (!entry) {
            entry = { date: dateStr, completed: [] };
            this.state.history.push(entry);
        }
        if (!entry.completed) entry.completed = [];
        return entry;
    }

    getEntry(dateStr) {
        return this.state.history.find(h => h.date === dateStr) || { completed: [] };
    }

    toggleHabitCompletion(dateStr, habitStr, isChecked) {
        let entry = this.getOrCreateEntry(dateStr);
        
        if (isChecked) {
            if (!entry.completed.includes(habitStr)) entry.completed.push(habitStr);
        } else {
            entry.completed = entry.completed.filter(h => h !== habitStr);
            if (habitStr === "บันทึกข้อมูลสุขภาพ") {
                entry.completed = [];
            }
        }
        
        this.save();
        if (this.onStateChange) this.onStateChange();
    }

    calculateTotalEXP() {
        if (this.state.history.length === 0) return 0;

        const sorted = [...this.state.history].sort((a,b) => new Date(a.date) - new Date(b.date));
        const firstDate = new Date(sorted[0].date);
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        const endDate = new Date(todayStr);

        let totalExp = 0;
        let currentDate = new Date(firstDate);

        while (currentDate <= endDate) {
            const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
            
            const entry = this.state.history.find(h => h.date === dateStr);
            let earned = 0;
            
            if (entry && entry.completed && entry.completed.includes("บันทึกข้อมูลสุขภาพ")) {
                entry.completed.forEach(habit => {
                    if (this.HABIT_POINTS[habit]) earned += this.HABIT_POINTS[habit];
                });
                totalExp += earned;
            } else {
                totalExp -= 13;
            }
            
            if (totalExp < 0) totalExp = 0;
            currentDate.setDate(currentDate.getDate() + 1);
        }

        return totalExp;
    }

    calculateStreak() {
        if (this.state.history.length === 0) return 0;

        const sorted = [...this.state.history].sort((a,b) => new Date(b.date) - new Date(a.date));
        
        let streak = 0;
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        
        const yest = new Date(today);
        yest.setDate(yest.getDate() - 1);
        const yestStr = `${yest.getFullYear()}-${String(yest.getMonth() + 1).padStart(2, '0')}-${String(yest.getDate()).padStart(2, '0')}`;

        let currentDateStr = todayStr;
        let foundToday = false;

        for (let entry of sorted) {
            if (entry.date === currentDateStr || (!foundToday && entry.date === yestStr)) {
                if (entry.date === yestStr && !foundToday) {
                    currentDateStr = yestStr;
                }
                foundToday = true;

                const isHealthLogged = entry.completed && entry.completed.includes("บันทึกข้อมูลสุขภาพ");
                if (isHealthLogged) {
                    streak++;
                    const prev = new Date(currentDateStr);
                    prev.setDate(prev.getDate() - 1);
                    currentDateStr = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}-${String(prev.getDate()).padStart(2, '0')}`;
                } else {
                    break;
                }
            } else if (new Date(entry.date) > new Date(currentDateStr)) {
                continue;
            } else {
                break;
            }
        }
        return streak;
    }
}
