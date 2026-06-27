export default class GlobalSaveManager {
    constructor() {
        this.btnSaveAll = document.getElementById('btnSaveAllGlobal');
        this.btnSleep = document.getElementById('btnRecordSleep');
        this.btnBody = document.getElementById('btnRecordWeight');
        this.btnDiet = document.getElementById('btnAddFood');
        
        this.bindEvents();
    }

    bindEvents() {
        if (this.btnSaveAll) {
            this.btnSaveAll.addEventListener('click', () => this.handleSaveAll());
        }
    }

    handleSaveAll() {
        if (this.btnSleep) this.btnSleep.click();
        if (this.btnBody) this.btnBody.click();
        if (this.btnDiet) this.btnDiet.click();
        
        const originalHTML = this.btnSaveAll.innerHTML;
        this.btnSaveAll.innerHTML = `<i data-lucide="check-circle" class="w-4 h-4"></i><span class="text-xs sm:text-sm tracking-wide font-mono">ALL DATA SAVED</span>`;
        if (window.lucide) window.lucide.createIcons();
        
        setTimeout(() => {
            this.btnSaveAll.innerHTML = originalHTML;
            if (window.lucide) window.lucide.createIcons();
        }, 2000);
    }
}
