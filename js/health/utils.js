export default class Utils {
    static calculateDuration(start, end) {
        if (!start || !end) return 0;
        const [startH, startM] = start.split(':').map(Number);
        const [endH, endM] = end.split(':').map(Number);
        let startDate = new Date(0, 0, 0, startH, startM);
        let endDate = new Date(0, 0, 0, endH, endM);
        if (endDate < startDate) endDate.setDate(endDate.getDate() + 1);
        return (endDate - startDate) / (1000 * 60 * 60);
    }

    static calculateBMR(w, h, a, g) {
        const s = g === 'male' ? 5 : -161;
        return (10 * w) + (6.25 * h) - (5 * a) + s;
    }

    static calculateTDEE(bmr, activityLevel) {
        if (!bmr || !activityLevel) return 0;
        return bmr * activityLevel;
    }

    static calculateBMI(w, h) {
        if (!w || !h) return 0;
        const hm = h / 100;
        return w / (hm * hm);
    }

    static getMinutes(t) {
        const [h, m] = t.split(':').map(Number);
        return h * 60 + m;
    }

    static createDeviationBarHTML(label, value) {
        const isPositive = value >= 0;
        const displayVal = isNaN(value) ? 0 : value;
        const width = Math.min(Math.abs(displayVal) * 2, 50);
        const colorClass = displayVal === 0 ? 'text-slate-500' : isPositive ? 'text-green-400' : 'text-red-400';
        const barColor = isPositive ? 'bg-green-500' : 'bg-red-500';
        const barStyle = isPositive ? `ml-auto mr-[50%]` : `mr-auto ml-[50%]`;

        return `
            <div class="mb-4">
                <div class="flex justify-between text-sm mb-1 text-slate-400 font-bold">
                    <span>${label}</span>
                    <span class="font-mono font-bold ${colorClass}">
                        ${displayVal > 0 ? '+' : ''}${displayVal.toFixed(1)}%
                    </span>
                </div>
                <div class="relative h-2 bg-slate-800 rounded-full overflow-hidden flex items-center justify-center">
                    <div class="absolute w-[1px] h-full bg-slate-600 z-10"></div>
                    <div class="h-full rounded-full ${barColor} ${barStyle}" style="width: ${width}%"></div>
                </div>
            </div>
        `;
    }
}
