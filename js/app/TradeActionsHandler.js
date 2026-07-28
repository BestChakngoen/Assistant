/**
 * TradeActionsHandler - Manages trade operations, database wipes, and CSV import/export.
 */
export class TradeActionsHandler {
    constructor(app) {
        this.app = app;
    }

    async handleAddTrade() {
        if (!this.app.auth.currentUser) return;
        const dom = this.app.ui.dom.inputs;
        const date = dom.date.value;
        const asset = dom.asset.disabled ? 'CASH' : dom.asset.value;
        const type = dom.type.value;
        let amount = parseFloat(dom.amount.value);

        if (!date || isNaN(amount)) { alert("Check inputs"); return; }

        amount = Math.abs(amount);
        if (type === 'LOSS' || type === 'WITHDRAW') amount = -amount;

        const ts = Date.now();
        const trade = {
            id: ts,
            order_index: ts,
            date, asset, type, amount,
            timestamp: new Date().toISOString()
        };

        await this.app.data.addTrade(this.app.auth.currentUser.uid, trade);
        dom.amount.value = '';
        
        dom.date.value = this.app.getThaiDateString(); 
    }

    async handleDelete(id) {
        if (confirm('Delete record?')) {
            const trade = this.app.trades.find(t => t.firestoreId === id);
            await this.app.data.deleteTrade(this.app.auth.currentUser.uid, id, trade);
        }
    }

    async handleReset() {
        if (confirm('Wipe ALL data?')) {
            await this.app.data.resetAll(this.app.auth.currentUser.uid, this.app.trades);
        }
    }

    handleExport() {
        if (this.app.trades.length === 0) return;
        let csv = "Date,Asset,Type,Amount\n" + this.app.trades.map(t => `${t.date},${t.asset},${t.type},${t.amount}`).join('\n');
        const link = document.createElement("a");
        link.href = encodeURI("data:text/csv;charset=utf-8," + csv);
        link.download = "trades.csv";
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
    }

    handleImport(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (event) => {
            const items = this.app.data.parseCSV(event.target.result);
            if (items && confirm(`Import ${items.length} items?`)) {
                for (const item of items) {
                    await this.app.data.addTrade(this.app.auth.currentUser.uid, item);
                }
                alert("Import Complete");
                e.target.value = '';
            }
        };
        reader.readAsText(file);
    }
}
