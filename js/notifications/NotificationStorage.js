import { NotificationScheduler } from './NotificationScheduler.js';

/**
 * NotificationStorage.js - Notification Data Persistence & Cloud Sync
 * Handles LocalStorage operations, seed data generation, and Firestore cloud sync.
 * Adheres strictly to SRP and Clean Code standards.
 */

export class NotificationStorage {
    constructor(storageKey = 'assistant_notifications_data') {
        this.storageKey = storageKey;
        this.onSave = null;
    }

    load() {
        try {
            const raw = localStorage.getItem(this.storageKey);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed && Array.isArray(parsed.reminders)) {
                    return {
                        reminders: parsed.reminders,
                        history: parsed.history || [],
                        updatedAt: parsed.updatedAt || Date.now()
                    };
                }
            }
        } catch (e) {
            console.error('Failed to load notifications from localStorage:', e);
        }
        return null;
    }

    save(data) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(data));
            if (typeof this.onSave === 'function') {
                this.onSave(data);
            }
        } catch (e) {
            console.error('Failed to save notifications to localStorage:', e);
        }
    }

    syncFromCloud(currentData, cloudData) {
        if (!cloudData) {
            if (currentData.reminders.length > 0 && typeof this.onSave === 'function') {
                this.onSave(currentData);
            }
            return null;
        }

        const cloudTime = typeof cloudData.updatedAt === 'number' ? cloudData.updatedAt : 0;
        if (cloudTime > (currentData.updatedAt || 0)) {
            const merged = {
                reminders: Array.isArray(cloudData.reminders) ? cloudData.reminders : [],
                history: Array.isArray(cloudData.history) ? cloudData.history : [],
                updatedAt: cloudTime
            };
            this.save(merged);
            return merged;
        }

        return null;
    }

    seedInitialRemindersIfEmpty(data) {
        if (data.reminders.length > 0) return;

        // Helpful default routine reminders for new users
        const now = new Date();
        data.reminders = [
            {
                id: 'notif_seed_1',
                title: 'Review Pre-Market Plan & Levels',
                notes: 'Check economic calendar, key support/resistance zones before trading.',
                category: 'trading',
                priority: 'high',
                type: 'weekdays',
                time: '08:30',
                days: [1, 2, 3, 4, 5],
                sound: true,
                browserNotif: true,
                enabled: true,
                createdAt: now.getTime(),
                lastTriggeredAt: 0,
                nextDueAt: NotificationScheduler.calculateNextDue({ type: 'weekdays', time: '08:30' })
            },
            {
                id: 'notif_seed_2',
                title: 'Daily Trade Log & Health Check',
                notes: 'Record closed trades, evaluate emotional discipline and sleep quality.',
                category: 'routine',
                priority: 'normal',
                type: 'daily',
                time: '21:00',
                sound: true,
                browserNotif: true,
                enabled: true,
                createdAt: now.getTime(),
                lastTriggeredAt: 0,
                nextDueAt: NotificationScheduler.calculateNextDue({ type: 'daily', time: '21:00' })
            },
            {
                id: 'notif_seed_3',
                title: 'Hydration & Posture Reset',
                notes: 'Drink water, stretch neck/shoulders, and take a 5-minute screen break.',
                category: 'health',
                priority: 'low',
                type: 'interval',
                intervalHours: 2,
                sound: true,
                browserNotif: true,
                enabled: true,
                createdAt: now.getTime(),
                lastTriggeredAt: 0,
                nextDueAt: Date.now() + 2 * 3600 * 1000
            }
        ];
        this.save(data);
    }
}
