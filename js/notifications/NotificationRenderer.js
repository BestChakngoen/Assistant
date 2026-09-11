import { NotificationScheduler } from './NotificationScheduler.js';

/**
 * NotificationRenderer - Handles DOM rendering and UI updates for notifications and reminders.
 * Strictly decoupled from business logic and state management.
 */
export class NotificationRenderer {
    static escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    static getPriorityBadge(priority) {
        switch (priority) {
            case 'high':
                return `<span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold text-rose-400 bg-rose-500/15 flex items-center gap-1"><i data-lucide="flame" class="size-3"></i>Urgent</span>`;
            case 'low':
                return `<span class="px-2 py-0.5 rounded-full text-[10px] font-mono text-slate-400 bg-slate-800/60">Low</span>`;
            case 'normal':
            default:
                return `<span class="px-2 py-0.5 rounded-full text-[10px] font-mono text-cyan-400 bg-cyan-500/10">Normal</span>`;
        }
    }

    static getCategoryBadge(category) {
        const cat = (category || 'general').toLowerCase();
        const config = {
            trading: { color: 'text-emerald-400 bg-emerald-500/10', icon: 'trending-up' },
            health: { color: 'text-rose-400 bg-rose-500/10', icon: 'heart' },
            routine: { color: 'text-cyan-400 bg-cyan-500/10', icon: 'repeat' },
            finance: { color: 'text-amber-400 bg-amber-500/10', icon: 'wallet' },
            general: { color: 'text-slate-300 bg-slate-800/50', icon: 'tag' }
        };
        const c = config[cat] || config.general;
        return `<span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold ${c.color} flex items-center gap-1"><i data-lucide="${c.icon}" class="size-3"></i>${cat.toUpperCase()}</span>`;
    }

    static renderCards(container, reminders, handlers = {}) {
        if (!container) return;

        if (!reminders || reminders.length === 0) {
            container.innerHTML = `
                <div class="col-span-full py-12 flex flex-col items-center justify-center text-center p-6 rounded-3xl bg-slate-900/20 text-slate-500">
                    <div class="size-14 rounded-2xl bg-slate-900/60 flex items-center justify-center mb-3 text-slate-600">
                        <i data-lucide="bell-off" class="size-7"></i>
                    </div>
                    <p class="text-sm font-mono font-medium text-slate-300">No reminders found</p>
                    <p class="text-xs font-mono text-slate-500 mt-1 max-w-sm">Create a new routine or alert to automate your schedule.</p>
                </div>
            `;
            if (window.lucide && typeof window.lucide.createIcons === 'function') {
                window.lucide.createIcons();
            }
            return;
        }

        let html = '';
        for (const item of reminders) {
            const isRecurring = item.type && item.type !== 'once';
            const scheduleDesc = NotificationScheduler.formatScheduleDescription(item);
            const relativeTime = NotificationScheduler.formatRelativeTime(item.nextDueAt);
            const isOverdue = item.nextDueAt && item.nextDueAt < Date.now() && item.enabled;

            html += `
                <div class="glass-panel p-5 rounded-3xl bg-slate-900/40 hover:bg-slate-900/60 transition-all flex flex-col justify-between gap-4 group/card relative ${!item.enabled ? 'opacity-60 grayscale-[40%]' : ''}" data-id="${item.id}">
                    <!-- Card Top -->
                    <div class="flex flex-col gap-2.5">
                        <div class="flex items-center justify-between gap-2">
                            <div class="flex items-center gap-1.5 flex-wrap">
                                ${this.getCategoryBadge(item.category)}
                                ${this.getPriorityBadge(item.priority)}
                                ${isRecurring ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-mono text-cyan-400 bg-cyan-500/10 flex items-center gap-1"><i data-lucide="refresh-cw" class="size-2.5"></i>Routine</span>` : ''}
                            </div>
                            <!-- Active toggle switch -->
                            <label class="relative inline-flex items-center cursor-pointer" title="${item.enabled ? 'Pause Reminder' : 'Activate Reminder'}">
                                <input type="checkbox" class="sr-only peer btn-toggle-reminder" data-id="${item.id}" ${item.enabled ? 'checked' : ''}>
                                <div class="w-8 h-4 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-cyan-500"></div>
                            </label>
                        </div>

                        <!-- Title -->
                        <h4 class="text-sm font-bold font-mono text-white break-words ${item.enabled ? '' : 'line-through text-slate-400'}">${this.escapeHtml(item.title)}</h4>

                        <!-- Notes / Description if present -->
                        ${item.notes ? `<p class="text-xs font-mono text-slate-400 break-words line-clamp-2 leading-relaxed">${this.escapeHtml(item.notes)}</p>` : ''}
                    </div>

                    <!-- Card Bottom Details & Timing -->
                    <div class="pt-3 border-t border-slate-800/40 flex flex-col gap-2.5">
                        <!-- Timing Badges -->
                        <div class="flex items-center justify-between text-xs font-mono">
                            <div class="flex items-center gap-1.5 text-slate-400 truncate max-w-[65%]" title="${scheduleDesc}">
                                <i data-lucide="${isRecurring ? 'repeat' : 'clock'}" class="size-3.5 text-slate-500 shrink-0"></i>
                                <span class="truncate text-[11px]">${scheduleDesc}</span>
                            </div>
                            <span class="text-[11px] font-bold shrink-0 ${isOverdue ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}">${relativeTime}</span>
                        </div>

                        <!-- Action Toolbar -->
                        <div class="flex items-center justify-between pt-1">
                            <div class="flex items-center gap-1.5">
                                <button type="button" class="btn-snooze-reminder p-1.5 rounded-lg bg-slate-800/40 hover:bg-slate-800 text-slate-400 hover:text-amber-300 transition-all text-xs font-mono flex items-center gap-1" data-id="${item.id}" title="Snooze 15 minutes">
                                    <i data-lucide="alarm-clock" class="size-3"></i>
                                    <span class="text-[10px]">+15m</span>
                                </button>
                                <button type="button" class="btn-complete-reminder p-1.5 rounded-lg bg-slate-800/40 hover:bg-slate-800 text-slate-400 hover:text-emerald-400 transition-all text-xs font-mono flex items-center gap-1" data-id="${item.id}" title="Trigger / Mark Done">
                                    <i data-lucide="check-circle" class="size-3"></i>
                                    <span class="text-[10px]">Done</span>
                                </button>
                            </div>
                            <div class="flex items-center gap-1">
                                <button type="button" class="btn-edit-reminder p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-800/50 transition-all" data-id="${item.id}" title="Edit Reminder">
                                    <i data-lucide="pencil" class="size-3.5"></i>
                                </button>
                                <button type="button" class="btn-delete-reminder p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all" data-id="${item.id}" title="Delete Reminder">
                                    <i data-lucide="trash-2" class="size-3.5"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        container.innerHTML = html;

        if (window.lucide && typeof window.lucide.createIcons === 'function') {
            window.lucide.createIcons();
        }
    }

    static renderHistoryList(container, history = []) {
        if (!container) return;

        if (!history || history.length === 0) {
            container.innerHTML = `
                <div class="py-8 text-center text-xs font-mono text-slate-500 p-4 rounded-2xl bg-slate-900/20">
                    No triggered alerts logged yet.
                </div>
            `;
            return;
        }

        let html = '';
        for (const log of history.slice(0, 50)) {
            const timeStr = new Date(log.triggeredAt).toLocaleString('en-GB', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
            });

            html += `
                <div class="flex items-center justify-between p-3 rounded-2xl bg-slate-900/30 text-xs font-mono">
                    <div class="flex items-center gap-3 min-w-0">
                        <div class="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 shrink-0">
                            <i data-lucide="bell" class="size-3.5"></i>
                        </div>
                        <div class="flex flex-col min-w-0">
                            <span class="font-bold text-slate-200 truncate">${this.escapeHtml(log.title)}</span>
                            <span class="text-[10px] text-slate-500">${this.escapeHtml(log.scheduleDesc || 'Alert')}</span>
                        </div>
                    </div>
                    <span class="text-[11px] text-slate-400 tabular-nums shrink-0 ml-2">${timeStr}</span>
                </div>
            `;
        }

        container.innerHTML = html;

        if (window.lucide && typeof window.lucide.createIcons === 'function') {
            window.lucide.createIcons();
        }
    }

    static updateStats(stats) {
        const activeEl = document.getElementById('stat-notif-active');
        const todayEl = document.getElementById('stat-notif-today');
        const routineEl = document.getElementById('stat-notif-routine');
        const historyEl = document.getElementById('stat-notif-history');
        const sidebarBadgeEl = document.getElementById('tab-notif-badge');
        const headerBadgeEl = document.getElementById('header-notification-badge');

        if (activeEl) activeEl.innerText = stats.activeCount ?? 0;
        if (todayEl) todayEl.innerText = stats.dueTodayCount ?? 0;
        if (routineEl) routineEl.innerText = stats.routineCount ?? 0;
        if (historyEl) historyEl.innerText = stats.historyCount ?? 0;

        const count = stats.activeDueCount || stats.dueTodayCount || 0;

        if (sidebarBadgeEl) {
            if (count > 0) {
                sidebarBadgeEl.innerText = count > 99 ? '99+' : count;
                sidebarBadgeEl.classList.remove('hidden');
            } else {
                sidebarBadgeEl.classList.add('hidden');
            }
        }

        if (headerBadgeEl) {
            if (count > 0) {
                headerBadgeEl.innerText = count > 99 ? '99+' : count;
                headerBadgeEl.classList.remove('hidden');
            } else {
                headerBadgeEl.classList.add('hidden');
            }
        }
    }
}
