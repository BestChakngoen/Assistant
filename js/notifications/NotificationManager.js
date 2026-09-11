import { NotificationScheduler } from './NotificationScheduler.js';
import { NotificationRenderer } from './NotificationRenderer.js';
import { NotificationModalPicker } from './NotificationModalPicker.js';
import { NotificationStorage } from './NotificationStorage.js';
import { NotificationAlertService } from './NotificationAlertService.js';
import { NotificationFormModal } from './NotificationFormModal.js';
import { ShareUI } from '../ui/share/ShareUI.js';

/**
 * NotificationManager - Coordinates reminders, schedules, and alert triggers (Refactored Facade).
 * Orchestrates NotificationStorage, NotificationAlertService, NotificationFormModal, and NotificationModalPicker.
 * Adheres strictly to SOLID, Clean Code, and Zero Regression standards.
 */
export class NotificationManager {
    constructor(app = null) {
        this.app = app;
        this.storageKey = 'assistant_notifications_data';
        this.storage = new NotificationStorage(this.storageKey);
        this.alertService = new NotificationAlertService();
        this.formModal = new NotificationFormModal();
        this.picker = new NotificationModalPicker();

        this.data = {
            reminders: [],
            history: [],
            updatedAt: Date.now()
        };

        this.state = {
            filter: 'all',
            category: 'all',
            search: '',
            editingId: null
        };

        this.dom = {
            panel: null,
            listContainer: null,
            historyContainer: null,
            historyList: null,
            btnOpenAdd: null,
            btnCloseModal: null,
            btnCancelModal: null,
            btnClearHistory: null,
            btnBrowserNotif: null,
            browserNotifBtnLabel: null,
            categoryFilter: null,
            searchInput: null,
            headerBtn: null,
            headerBadge: null
        };
    }

    get onSave() {
        return this.storage.onSave;
    }

    set onSave(fn) {
        this.storage.onSave = fn;
    }

    init() {
        this.cacheDom();
        this.formModal.init();
        this.picker.init();
        this.loadFromStorage();
        this.seedInitialRemindersIfEmpty();
        this.bindEvents();
        this.updateBrowserNotifButtonState();
        this.render();
        this.startScheduler();
    }

    cacheDom() {
        this.dom.panel = document.getElementById('notifications-panel');
        this.dom.listContainer = document.getElementById('notifications-list-container');
        this.dom.historyContainer = document.getElementById('notifications-history-container');
        this.dom.historyList = document.getElementById('notif-history-list');
        this.dom.btnOpenAdd = document.getElementById('btn-open-add-reminder');
        this.dom.btnCloseModal = document.getElementById('btn-close-reminder-modal');
        this.dom.btnCancelModal = document.getElementById('btn-cancel-reminder');
        this.dom.btnClearHistory = document.getElementById('btn-clear-notif-history');
        this.dom.btnBrowserNotif = document.getElementById('btn-request-browser-notif');
        this.dom.browserNotifBtnLabel = document.getElementById('browser-notif-btn-label');
        this.dom.categoryFilter = document.getElementById('notif-category-filter');
        this.dom.searchInput = document.getElementById('notif-search-input');
        this.dom.headerBtn = document.getElementById('btn-header-notifications');
        this.dom.headerBadge = document.getElementById('header-notification-badge');
    }

    bindEvents() {
        // Modal Open / Close
        if (this.dom.btnOpenAdd) {
            this.dom.btnOpenAdd.addEventListener('click', () => this.openModal());
        }
        if (this.dom.btnCloseModal) {
            this.dom.btnCloseModal.addEventListener('click', () => this.closeModal());
        }
        if (this.dom.btnCancelModal) {
            this.dom.btnCancelModal.addEventListener('click', () => this.closeModal());
        }

        // Close modal when clicking overlay background
        if (this.formModal.dom.modal) {
            this.formModal.dom.modal.addEventListener('click', (e) => {
                if (e.target === this.formModal.dom.modal) this.closeModal();
            });
        }

        // Form Submit (Create / Update)
        if (this.formModal.dom.form) {
            this.formModal.dom.form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleFormSubmit();
            });
        }

        // Frequency Selector Change -> show/hide fields
        if (this.formModal.dom.freqSelect) {
            this.formModal.dom.freqSelect.addEventListener('change', (e) => {
                this.updateFrequencyFields(e.target.value);
            });
        }

        // Filter Tabs Click (All, Active, Routine, History)
        const tabContainer = document.getElementById('notif-filter-tabs');
        if (tabContainer) {
            tabContainer.addEventListener('click', (e) => {
                const btn = e.target.closest('.notif-filter-btn');
                if (!btn) return;
                const filter = btn.getAttribute('data-filter');
                if (filter) {
                    this.state.filter = filter;
                    tabContainer.querySelectorAll('.notif-filter-btn').forEach(b => {
                        b.classList.remove('bg-cyan-500/20', 'text-cyan-400', 'font-bold');
                        b.classList.add('text-slate-400');
                    });
                    btn.classList.add('bg-cyan-500/20', 'text-cyan-400', 'font-bold');
                    btn.classList.remove('text-slate-400');
                    this.render();
                }
            });
        }

        // Category Filter
        if (this.dom.categoryFilter) {
            this.dom.categoryFilter.addEventListener('change', (e) => {
                this.state.category = e.target.value;
                this.render();
            });
        }

        // Search Input
        if (this.dom.searchInput) {
            this.dom.searchInput.addEventListener('input', (e) => {
                this.state.search = e.target.value.toLowerCase().trim();
                this.render();
            });
        }

        // Clear History
        if (this.dom.btnClearHistory) {
            this.dom.btnClearHistory.addEventListener('click', () => {
                this.data.history = [];
                this.handleDataChange();
                this.render();
            });
        }

        // Browser Notification Permission Request Button
        if (this.dom.btnBrowserNotif) {
            this.dom.btnBrowserNotif.addEventListener('click', async () => {
                await this.requestBrowserNotificationPermission();
            });
        }

        // Reminder Card Actions (Event Delegation)
        if (this.dom.listContainer) {
            this.dom.listContainer.addEventListener('click', (e) => this.handleCardAction(e));
            this.dom.listContainer.addEventListener('change', (e) => {
                if (e.target.classList.contains('btn-toggle-reminder')) {
                    const id = e.target.getAttribute('data-id');
                    this.toggleReminder(id, e.target.checked);
                }
            });
        }

        // Header Bell Icon Direct Shortcut to Notification Page
        if (this.dom.headerBtn) {
            this.dom.headerBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const ui = (this.app && this.app.ui) || (window.app && window.app.ui);
                if (ui) {
                    ui.switchTab('notifications');
                    this.render();
                }
            });
        }
    }

    updateFrequencyFields(freq) {
        this.formModal.updateFrequencyFields(freq);
    }

    openModal(reminder = null) {
        this.state.editingId = reminder ? reminder.id : null;
        this.formModal.open(reminder, this.picker);
    }

    closeModal() {
        this.state.editingId = null;
        this.formModal.close(this.picker);
    }

    handleFormSubmit() {
        const reminderData = this.formModal.extractFormData();
        if (!reminderData) return;

        if (this.state.editingId) {
            // Update existing
            const idx = this.data.reminders.findIndex(r => r.id === this.state.editingId);
            if (idx !== -1) {
                this.data.reminders[idx] = {
                    ...this.data.reminders[idx],
                    ...reminderData
                };
            }
        } else {
            // Create new
            const newReminder = {
                id: 'notif_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
                createdAt: Date.now(),
                lastTriggeredAt: 0,
                ...reminderData
            };
            this.data.reminders.unshift(newReminder);
        }

        this.closeModal();
        this.handleDataChange();
        this.render();

        // If browser notification is requested, ask permission immediately if not asked
        if (reminderData.browserNotif && 'Notification' in window && Notification.permission === 'default') {
            this.requestBrowserNotificationPermission();
        }
    }

    handleCardAction(e) {
        // Snooze
        const snoozeBtn = e.target.closest('.btn-snooze-reminder');
        if (snoozeBtn) {
            const id = snoozeBtn.getAttribute('data-id');
            this.snoozeReminder(id, 15);
            return;
        }

        // Complete / Done
        const completeBtn = e.target.closest('.btn-complete-reminder');
        if (completeBtn) {
            const id = completeBtn.getAttribute('data-id');
            this.markReminderDone(id);
            return;
        }

        // Edit
        const editBtn = e.target.closest('.btn-edit-reminder');
        if (editBtn) {
            const id = editBtn.getAttribute('data-id');
            const reminder = this.data.reminders.find(r => r.id === id);
            if (reminder) this.openModal(reminder);
            return;
        }

        // Delete
        const delBtn = e.target.closest('.btn-delete-reminder');
        if (delBtn) {
            const id = delBtn.getAttribute('data-id');
            this.deleteReminder(id);
        }
    }

    toggleReminder(id, enabled) {
        const item = this.data.reminders.find(r => r.id === id);
        if (!item) return;

        item.enabled = enabled;
        if (enabled) {
            item.nextDueAt = NotificationScheduler.calculateNextDue(item);
        }
        this.handleDataChange();
        this.render();
    }

    snoozeReminder(id, minutes = 15) {
        const item = this.data.reminders.find(r => r.id === id);
        if (!item) return;

        item.nextDueAt = Date.now() + minutes * 60 * 1000;
        item.enabled = true;
        this.handleDataChange();
        this.render();
        ShareUI.showToast('Snoozed', `Snoozed "${item.title}" for ${minutes} minutes`, 'info');
    }

    markReminderDone(id) {
        const item = this.data.reminders.find(r => r.id === id);
        if (!item) return;

        // Log into history
        this.data.history.unshift({
            id: 'log_' + Date.now(),
            reminderId: item.id,
            title: item.title,
            category: item.category,
            scheduleDesc: NotificationScheduler.formatScheduleDescription(item),
            triggeredAt: Date.now()
        });

        // Turn off switch immediately for both one-time and routines
        item.enabled = false;
        item.lastTriggeredAt = Date.now();

        this.handleDataChange();
        this.render();
        ShareUI.playSound('mouse-click');
    }

    deleteReminder(id) {
        const idx = this.data.reminders.findIndex(r => r.id === id);
        if (idx === -1) return;
        this.data.reminders.splice(idx, 1);
        this.handleDataChange();
        this.render();
    }

    startScheduler() {
        this.alertService.startScheduler(() => this.checkDueReminders(), 15000);
    }

    checkDueReminders() {
        const now = Date.now();
        let changed = false;

        for (const item of this.data.reminders) {
            if (!item.enabled) continue;
            if (item.nextDueAt && item.nextDueAt <= now) {
                this.triggerAlert(item);

                // Recalculate or disable
                if (item.type === 'once') {
                    item.enabled = false;
                } else {
                    item.lastTriggeredAt = now;
                    item.nextDueAt = NotificationScheduler.calculateNextDue(item);
                }
                changed = true;
            }
        }

        if (changed) {
            this.handleDataChange();
            this.render();
        }
    }

    triggerAlert(item) {
        this.alertService.triggerAlert(item, this.data.history);
    }

    async requestBrowserNotificationPermission() {
        await this.alertService.requestBrowserPermission(() => {
            this.updateBrowserNotifButtonState();
        });
    }

    updateBrowserNotifButtonState() {
        this.alertService.updateBrowserNotifButton(this.dom.btnBrowserNotif, this.dom.browserNotifBtnLabel);
    }

    render() {
        const reminders = this.getFilteredReminders();

        // Toggle list container vs history container
        if (this.state.filter === 'history') {
            if (this.dom.listContainer) this.dom.listContainer.classList.add('hidden');
            if (this.dom.historyContainer) this.dom.historyContainer.classList.remove('hidden');
            NotificationRenderer.renderHistoryList(this.dom.historyList, this.data.history);
        } else {
            if (this.dom.listContainer) this.dom.listContainer.classList.remove('hidden');
            if (this.dom.historyContainer) this.dom.historyContainer.classList.add('hidden');
            NotificationRenderer.renderCards(this.dom.listContainer, reminders);
        }

        // Metrics & Stats
        const now = Date.now();
        const endOfToday = new Date();
        endOfToday.setHours(23, 59, 59, 999);

        const activeCount = this.data.reminders.filter(r => r.enabled).length;
        const dueTodayCount = this.data.reminders.filter(r => r.enabled && r.nextDueAt && r.nextDueAt <= endOfToday.getTime()).length;
        const routineCount = this.data.reminders.filter(r => r.type && r.type !== 'once').length;
        const historyCount = this.data.history.length;
        const activeDueCount = this.data.reminders.filter(r => r.enabled && r.nextDueAt && r.nextDueAt <= now).length;

        NotificationRenderer.updateStats({
            activeCount,
            dueTodayCount,
            routineCount,
            historyCount,
            activeDueCount
        });
    }

    getFilteredReminders() {
        return this.data.reminders.filter(item => {
            if (this.state.filter === 'active' && !item.enabled) return false;
            if (this.state.filter === 'routine' && item.type === 'once') return false;
            if (this.state.category !== 'all' && (item.category || '').toLowerCase() !== this.state.category) return false;

            if (this.state.search) {
                const titleMatch = (item.title || '').toLowerCase().includes(this.state.search);
                const notesMatch = (item.notes || '').toLowerCase().includes(this.state.search);
                if (!titleMatch && !notesMatch) return false;
            }

            return true;
        }).sort((a, b) => {
            if (a.enabled !== b.enabled) return a.enabled ? -1 : 1;
            return (a.nextDueAt || 0) - (b.nextDueAt || 0);
        });
    }

    handleDataChange() {
        this.data.updatedAt = Date.now();
        this.saveToStorage();
    }

    saveToStorage() {
        this.storage.save(this.data);
    }

    loadFromStorage() {
        const loaded = this.storage.load();
        if (loaded) {
            this.data = loaded;
        }
    }

    syncFromCloud(cloudData) {
        const merged = this.storage.syncFromCloud(this.data, cloudData);
        if (merged) {
            this.data = merged;
            this.render();
        }
    }

    seedInitialRemindersIfEmpty() {
        this.storage.seedInitialRemindersIfEmpty(this.data);
    }
}
