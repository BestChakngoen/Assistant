/**
 * NotificationScheduler - Handles date/time calculation for recurring & one-time reminders.
 * Strictly adheres to Single Responsibility Principle (SRP).
 */
export class NotificationScheduler {
    /**
     * Calculate the next epoch timestamp (ms) when this reminder should trigger.
     */
    static calculateNextDue(reminder) {
        const now = new Date();
        const type = reminder.type || 'once';
        const timeStr = reminder.time || '09:00';
        const [hour, minute] = timeStr.split(':').map(n => parseInt(n, 10) || 0);

        if (type === 'once') {
            if (!reminder.date) return null;
            const due = new Date(`${reminder.date}T${timeStr}:00`);
            const dueTime = due.getTime();
            return isNaN(dueTime) ? null : dueTime;
        }

        if (type === 'daily') {
            const next = new Date(now);
            next.setHours(hour, minute, 0, 0);
            if (next.getTime() <= now.getTime()) {
                next.setDate(next.getDate() + 1);
            }
            return next.getTime();
        }

        if (type === 'weekdays') {
            let next = new Date(now);
            next.setHours(hour, minute, 0, 0);
            if (next.getTime() <= now.getTime() || next.getDay() === 0 || next.getDay() === 6) {
                do {
                    next.setDate(next.getDate() + 1);
                } while (next.getDay() === 0 || next.getDay() === 6);
            }
            return next.getTime();
        }

        if (type === 'weekly') {
            const days = Array.isArray(reminder.days) && reminder.days.length > 0 ? reminder.days : [1];
            let candidate = null;
            for (let i = 0; i <= 8; i++) {
                const next = new Date(now);
                next.setDate(next.getDate() + i);
                next.setHours(hour, minute, 0, 0);
                if (next.getTime() > now.getTime() && days.includes(next.getDay())) {
                    candidate = next.getTime();
                    break;
                }
            }
            return candidate;
        }

        if (type === 'monthly') {
            const dayOfMonth = Math.min(31, Math.max(1, parseInt(reminder.dayOfMonth || 1, 10)));
            let next = new Date(now.getFullYear(), now.getMonth(), dayOfMonth, hour, minute, 0, 0);
            if (next.getTime() <= now.getTime()) {
                next = new Date(now.getFullYear(), now.getMonth() + 1, dayOfMonth, hour, minute, 0, 0);
            }
            return next.getTime();
        }

        if (type === 'interval') {
            const hours = Math.max(1, parseInt(reminder.intervalHours || 1, 10));
            const lastTrigger = reminder.lastTriggeredAt || now.getTime();
            let nextTime = lastTrigger + hours * 3600 * 1000;
            if (nextTime <= now.getTime()) {
                nextTime = now.getTime() + hours * 3600 * 1000;
            }
            return nextTime;
        }

        return null;
    }

    /**
     * Human-readable schedule summary text
     */
    static formatScheduleDescription(reminder) {
        const type = reminder.type || 'once';
        const timeStr = reminder.time || '09:00';

        switch (type) {
            case 'daily':
                return `Every day at ${timeStr}`;
            case 'weekdays':
                return `Mon – Fri at ${timeStr}`;
            case 'weekly': {
                const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                const days = (reminder.days || []).map(d => dayNames[d] || d).join(', ');
                return `Weekly (${days || 'Mon'}) at ${timeStr}`;
            }
            case 'monthly':
                return `Monthly on day ${reminder.dayOfMonth || 1} at ${timeStr}`;
            case 'interval':
                return `Every ${reminder.intervalHours || 1} hour(s)`;
            case 'once':
            default:
                return reminder.date ? `${reminder.date} at ${timeStr}` : `Once at ${timeStr}`;
        }
    }

    /**
     * Relative time string (e.g. "in 15 mins", "in 2 hours", "Overdue")
     */
    static formatRelativeTime(targetTimestamp) {
        if (!targetTimestamp) return 'No due date';
        const now = Date.now();
        const diffMs = targetTimestamp - now;

        if (diffMs < -60000) {
            const minsAgo = Math.floor(Math.abs(diffMs) / 60000);
            if (minsAgo < 60) return `Overdue by ${minsAgo}m`;
            const hoursAgo = Math.floor(minsAgo / 60);
            if (hoursAgo < 24) return `Overdue by ${hoursAgo}h`;
            return `Overdue by ${Math.floor(hoursAgo / 24)}d`;
        }

        if (diffMs >= -60000 && diffMs <= 60000) {
            return 'Due right now';
        }

        const diffMinutes = Math.floor(diffMs / 60000);
        if (diffMinutes < 60) return `in ${diffMinutes}m`;

        const diffHours = Math.floor(diffMinutes / 60);
        if (diffHours < 24) return `in ${diffHours}h ${diffMinutes % 60}m`;

        const diffDays = Math.floor(diffHours / 24);
        if (diffDays === 1) return 'Tomorrow';
        if (diffDays < 7) return `in ${diffDays} days`;

        return new Date(targetTimestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    }
}
