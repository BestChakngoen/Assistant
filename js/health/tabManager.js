export default class TabManager {
    constructor() {
        this.tabs = document.querySelectorAll('.nav-tab');
        this.sections = document.querySelectorAll('.tab-section');
        if (this.tabs.length > 0) {
            this.bindEvents();
            this.activateTab(this.tabs[0]);
        }
    }

    bindEvents() {
        this.tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.activateTab(e.currentTarget);
            });
        });
    }

    activateTab(selectedTab) {
        if (!selectedTab) return;

        this.tabs.forEach(tab => {
            tab.classList.remove('bg-slate-800', 'text-cyan-400', 'border-cyan-500/30', 'shadow-[0_0_10px_rgba(56,189,248,0.15)]');
            tab.classList.add('text-slate-400', 'hover:text-slate-200');
        });

        selectedTab.classList.remove('text-slate-400', 'hover:text-slate-200');
        selectedTab.classList.add('bg-slate-800', 'text-cyan-400', 'border-cyan-500/30', 'shadow-[0_0_10px_rgba(56,189,248,0.15)]');

        const targetId = selectedTab.getAttribute('data-target');
        
        this.sections.forEach(section => {
            if (section.id === targetId) {
                section.classList.remove('hidden');
                section.classList.add('flex');
            } else {
                section.classList.add('hidden');
                section.classList.remove('flex');
            }
        });
    }
}
