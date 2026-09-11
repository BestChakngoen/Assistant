import { ShareUI } from '../ui/share/ShareUI.js';
import { NotificationScheduler } from './NotificationScheduler.js';

/**
 * NotificationAlertService.js - Alert Dispatcher & Timer Scheduler
 * Handles due-reminder checks, audio playback, native web notifications,
 * browser permission requests, and history log creation.
 * Adheres strictly to SRP and Clean Code standards.
 */

export class NotificationAlertService {
    constructor() {
        this.schedulerInterval = null;
    }

    startScheduler(onCheckDue, intervalMs = 15000) {
        this.stopScheduler();
        this.schedulerInterval = setInterval(() => {
            if (typeof onCheckDue === 'function') {
                onCheckDue();
            }
        }, intervalMs);
    }

    stopScheduler() {
        if (this.schedulerInterval) {
            clearInterval(this.schedulerInterval);
            this.schedulerInterval = null;
        }
    }

    triggerAlert(item, historyList) {
        // 1. In-App Sound
        if (item.sound !== false) {
            ShareUI.playSound('success');
        }

        // 2. In-App Toast
        const desc = NotificationScheduler.formatScheduleDescription(item);
        ShareUI.showToast(`Reminder: ${item.title}`, item.notes || desc, 'info');

        // 3. Native Browser Web Notification
        if (item.browserNotif !== false && 'Notification' in window && Notification.permission === 'granted') {
            try {
                new window.Notification(item.title, {
                    body: item.notes || desc,
                    icon: 'favicon.ico',
                    tag: `reminder-${item.id}`
                });
            } catch (e) {
                console.warn('Native notification failed:', e);
            }
        }

        // 4. Log to history
        if (Array.isArray(historyList)) {
            historyList.unshift({
                id: 'log_' + Date.now(),
                reminderId: item.id,
                title: item.title,
                category: item.category,
                scheduleDesc: desc,
                triggeredAt: Date.now()
            });
        }
    }

    async requestBrowserPermission(onStateChanged) {
        if (!('Notification' in window)) {
            ShareUI.showToast('Not Supported', 'Browser notifications not supported on this browser', 'info');
            return;
        }

        try {
            const permission = await Notification.requestPermission();
            if (typeof onStateChanged === 'function') {
                onStateChanged(permission);
            }

            if (permission === 'granted') {
                ShareUI.showToast('Notifications Enabled', 'Desktop & mobile browser alerts are now active', 'success');
                try {
                    new Notification('Notifications Active', {
                        body: 'Assistant alerts will now notify you on schedule.',
                        icon: 'favicon.ico'
                    });
                } catch (e) {}
            } else if (permission === 'denied') {
                ShareUI.showToast('Permission Denied', 'Please allow notifications in browser settings', 'error');
            }
        } catch (e) {
            console.error('Failed to request notification permission:', e);
        }
    }

    updateBrowserNotifButton(btnEl, labelEl) {
        if (!btnEl || !labelEl) return;

        if (!('Notification' in window)) {
            labelEl.innerText = 'Alerts Unsupported';
            btnEl.classList.add('opacity-50', 'cursor-not-allowed');
            return;
        }

        if (Notification.permission === 'granted') {
            labelEl.innerText = 'Alerts Enabled';
            btnEl.classList.remove('text-slate-300');
            btnEl.classList.add('text-emerald-400', 'bg-emerald-500/10');
        } else if (Notification.permission === 'denied') {
            labelEl.innerText = 'Alerts Blocked';
            btnEl.classList.add('text-rose-400');
        } else {
            labelEl.innerText = 'Enable Alerts';
            btnEl.classList.remove('text-emerald-400', 'bg-emerald-500/10');
            btnEl.classList.add('text-slate-300');
        }
    }
}
