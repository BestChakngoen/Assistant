export default class DataManager {
    constructor(firebaseManager) {
        this.fb = firebaseManager;
        this.cacheDOM();
        this.bindEvents();
    }

    cacheDOM() {
        this.dom = {
            btnOpen: document.getElementById('btnDataManage'),
            btnClose: document.getElementById('btnCloseDataManage'),
            modal: document.getElementById('dataManageModal'),
            monthInput: document.getElementById('deleteMonthInput'),
            chkSleep: document.getElementById('chkDeleteSleep'),
            chkBody: document.getElementById('chkDeleteBody'),
            chkDiet: document.getElementById('chkDeleteDiet'),
            btnConfirm: document.getElementById('btnConfirmDeleteData')
        };
    }

    bindEvents() {
        if (this.dom.btnOpen) {
            this.dom.btnOpen.addEventListener('click', () => this.openModal());
        }
        if (this.dom.btnClose) {
            this.dom.btnClose.addEventListener('click', () => this.closeModal());
        }
        if (this.dom.btnConfirm) {
            this.dom.btnConfirm.addEventListener('click', () => this.handleDelete());
        }
    }

    openModal() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        if (this.dom.monthInput) {
            this.dom.monthInput.value = `${year}-${month}`;
        }
        if (this.dom.modal) {
            this.dom.modal.classList.remove('hidden');
        }
    }

    closeModal() {
        if (this.dom.modal) {
            this.dom.modal.classList.add('hidden');
        }
    }

    async handleDelete() {
        if (!this.dom.monthInput || !this.dom.monthInput.value) return;

        const [targetYear, targetMonth] = this.dom.monthInput.value.split('-');

        if (this.dom.chkSleep && this.dom.chkSleep.checked) {
            await this.deleteForCollection('sleep', 'history', targetYear, targetMonth);
        }
        
        if (this.dom.chkBody && this.dom.chkBody.checked) {
            await this.deleteForCollection('body', 'weightHistory', targetYear, targetMonth);
        }
        
        if (this.dom.chkDiet && this.dom.chkDiet.checked) {
            await this.deleteForCollection('diet', 'foodLog', targetYear, targetMonth);
        }

        this.closeModal();
    }

    async deleteForCollection(collectionName, historyKey, year, month) {
        const data = await this.fb.loadData(collectionName);
        if (data && data[historyKey] && Array.isArray(data[historyKey])) {
            data[historyKey] = data[historyKey].filter(item => {
                if (!item.date) return true;
                const [itemYear, itemMonth] = item.date.split('-');
                return !(itemYear === year && itemMonth === month);
            });
            
            if (collectionName === 'body') {
                data[historyKey].sort((a, b) => new Date(a.date) - new Date(b.date));
                const len = data[historyKey].length;
                if (len > 0) {
                    data.weight = data[historyKey][len - 1].weight;
                }
            }
            
            await this.fb.saveData(collectionName, data);
        }
    }
}
