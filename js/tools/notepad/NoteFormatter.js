/**
 * NoteFormatter.js - Utility for text formatting in textarea (Quick Note & Scratchpad).
 * Handles bold wrapping, divider lines, and cursor preservation.
 * Adheres strictly to SOLID and Single Responsibility Principle (SRP).
 */
export class NoteFormatter {
    /**
     * Applies or toggles bold formatting on selected text or inserts bold markers.
     * Shortcut: Ctrl+B / Cmd+B
     * @param {HTMLTextAreaElement} textarea 
     * @returns {boolean} whether text was modified
     */
    static applyBold(textarea) {
        if (!textarea) return false;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const value = textarea.value;
        const selectedText = value.substring(start, end);

        // Check if selected text itself is wrapped in **
        if (selectedText.startsWith('**') && selectedText.endsWith('**') && selectedText.length >= 4) {
            // Unwrap
            const unwrapped = selectedText.slice(2, -2);
            textarea.value = value.substring(0, start) + unwrapped + value.substring(end);
            textarea.selectionStart = start;
            textarea.selectionEnd = start + unwrapped.length;
        } else if (start >= 2 && end <= value.length - 2 && value.substring(start - 2, start) === '**' && value.substring(end, end + 2) === '**') {
            // Outer markers exist
            textarea.value = value.substring(0, start - 2) + selectedText + value.substring(end + 2);
            textarea.selectionStart = start - 2;
            textarea.selectionEnd = start - 2 + selectedText.length;
        } else if (selectedText.length > 0) {
            // Wrap selected text
            const wrapped = `**${selectedText}**`;
            textarea.value = value.substring(0, start) + wrapped + value.substring(end);
            textarea.selectionStart = start + 2;
            textarea.selectionEnd = end + 2;
        } else {
            // Empty selection: insert **** and position cursor in middle
            const inserted = '****';
            textarea.value = value.substring(0, start) + inserted + value.substring(end);
            textarea.selectionStart = start + 2;
            textarea.selectionEnd = start + 2;
        }

        textarea.focus();
        return true;
    }

    /**
     * Inserts a horizontal divider line (---) at the end of the current line.
     * Shortcut: Ctrl+Shift+H / Cmd+Shift+H
     * @param {HTMLTextAreaElement} textarea 
     * @returns {boolean} whether text was modified
     */
    static insertDivider(textarea) {
        if (!textarea) return false;

        const cursor = textarea.selectionStart;
        const value = textarea.value;

        // Find the end of current line
        let lineEnd = value.indexOf('\n', cursor);
        if (lineEnd === -1) {
            lineEnd = value.length;
        }

        const before = value.substring(0, lineEnd);
        const after = value.substring(lineEnd);

        // Ensure clean separation with newline before divider if needed
        const prefix = before.length > 0 && !before.endsWith('\n') ? '\n' : '';
        const dividerText = `${prefix}---\n`;

        textarea.value = before + dividerText + after;
        const newCursorPos = lineEnd + dividerText.length;
        textarea.selectionStart = newCursorPos;
        textarea.selectionEnd = newCursorPos;

        textarea.focus();
        return true;
    }
}
