/**
 * NoteHandler - Manages Notes state, optimistic UI updates, and saving notes.
 */
export class NoteHandler {
    constructor(app) {
        this.app = app;
        this.notes = { title: '', items: [] };
    }

    handleAddNoteItem() {
        const input = document.getElementById('note-input');
        if (!input) return;
        const text = input.value.trim();
        if (!text) return;
        
        if (!this.notes.items) this.notes.items = [];
        this.notes.items.push(text);
        
        // Optimistic UI Update
        this.app.ui.renderNotes(this.notes, (i) => this.handleDeleteNoteItem(i));
        input.value = '';
        input.focus();
    }

    handleDeleteNoteItem(index) {
        if (!this.notes.items) return;
        this.notes.items.splice(index, 1);
        this.app.ui.renderNotes(this.notes, (i) => this.handleDeleteNoteItem(i));
    }

    async handleSaveNotes() {
        if (!this.app.auth.currentUser) return;
        const btn = document.getElementById('btn-save-note');
        if (!btn) return;

        const originalText = btn.innerHTML;
        
        btn.innerText = 'SAVING...';
        btn.disabled = true;

        const titleEl = document.getElementById('note-title');
        if (titleEl) {
            this.notes.title = titleEl.value;
        }

        try {
            await this.app.data.saveNotes(this.app.auth.currentUser.uid, this.notes);
            btn.innerText = 'SAVED!';
            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }, 1500);
        } catch (e) {
            console.error('saveNotes error:', e);
            btn.innerText = 'ERROR';
            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }, 1500);
        }
    }
}
