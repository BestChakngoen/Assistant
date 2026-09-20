import { TableCellParser } from './TableCellParser.js';

/**
 * TableGridRenderer.js - Table DOM Rendering & Presentation
 * Handles table header/body HTML generation, inline contenteditable,
 * cell focus navigation, and counter statistics.
 * Adheres strictly to SRP and Clean Code standards.
 */

export class TableGridRenderer {
    static escapeHtml(text) {
        if (!text) return '';
        return text
            .toString()
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    static renderHeader(tableHead, headers) {
        if (!tableHead) return;
        const colCount = Math.max(1, headers.length);
        let headHtml = `
            <tr class="bg-slate-950 text-slate-300 text-xs font-mono">
                <th class="w-10 py-2.5 px-3 text-center text-slate-500 font-normal select-none sticky top-0 left-0 z-30 bg-slate-950 border-b border-r border-slate-800/40">#</th>
        `;

        headers.forEach((header, colIdx) => {
            headHtml += `
                <th class="py-2 px-2 text-left font-normal align-middle sticky top-0 z-20 bg-slate-950 border-b border-slate-800/40" data-col="${colIdx}">
                    <div class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-900 transition-colors">
                        <span contenteditable="plaintext-only" spellcheck="false" class="table-header-editor outline-none min-w-[70px] font-bold text-slate-200 text-xs font-mono whitespace-nowrap block cursor-text" data-col="${colIdx}" title="Click to rename header">${this.escapeHtml(header)}</span>
                        ${colCount > 1 ? `
                            <button type="button" class="btn-del-col p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all shrink-0" data-col="${colIdx}" title="Delete Column">
                                <i data-lucide="x" class="size-3"></i>
                            </button>
                        ` : ''}
                    </div>
                </th>
            `;
        });

        headHtml += `
                <th class="w-10 py-2 px-2 text-center align-middle select-none sticky top-0 z-20 bg-slate-950 border-b border-slate-800/40">
                    <button id="btn-table-quick-add-col" type="button" class="p-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-all flex items-center justify-center mx-auto" title="Add New Column">
                        <i data-lucide="plus" class="size-3.5"></i>
                    </button>
                </th>
            </tr>
        `;

        tableHead.innerHTML = headHtml;
    }

    static renderBody(tableBody, rows) {
        if (!tableBody) return;
        let bodyHtml = '';
        rows.forEach((row, rowIdx) => {
            bodyHtml += `
                <tr class="group hover:bg-slate-800/20 transition-colors" data-row="${rowIdx}">
                    <td class="w-10 py-2.5 px-3 text-center text-slate-500 text-xs font-mono select-none sticky left-0 z-10 bg-slate-950 group-hover:bg-slate-900 border-b border-r border-slate-800/40 transition-colors">${rowIdx + 1}</td>
            `;

            row.forEach((cell, colIdx) => {
                bodyHtml += `
                    <td class="py-1.5 px-2 align-top border-b border-slate-800/20" data-row="${rowIdx}" data-col="${colIdx}">
                        ${TableCellParser.renderCellContent(cell, rowIdx, colIdx)}
                    </td>
                `;
            });

            bodyHtml += `
                    <td class="w-10 py-2 px-2 text-center align-middle select-none border-b border-slate-800/20">
                        <button type="button" class="btn-del-row p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all opacity-40 group-hover:opacity-100" data-row="${rowIdx}" title="Delete Row">
                            <i data-lucide="trash-2" class="size-3.5"></i>
                        </button>
                    </td>
                </tr>
            `;
        });

        tableBody.innerHTML = bodyHtml;
    }

    static switchToEditor(td, rowIdx, colIdx, currentVal) {
        if (!td) return;
        td.innerHTML = `
            <div contenteditable="plaintext-only" spellcheck="false" role="textbox" class="table-cell-editor outline-none min-w-[90px] whitespace-pre-wrap break-words px-3 py-2 text-xs font-mono text-slate-100 rounded-xl transition-all focus:bg-slate-900/90 focus:ring-1 focus:ring-emerald-500/40 cursor-text" data-row="${rowIdx}" data-col="${colIdx}">${this.escapeHtml(currentVal)}</div>
        `;
        const editor = td.querySelector('.table-cell-editor');
        if (editor) {
            editor.focus();
            const range = document.createRange();
            const sel = window.getSelection();
            range.selectNodeContents(editor);
            range.collapse(false);
            sel.removeAllRanges();
            sel.addRange(range);
        }
    }

    static focusCell(tableBody, row, col, switchToEditorFn) {
        const td = tableBody?.querySelector(`td[data-row="${row}"][data-col="${col}"]`);
        if (!td) return;
        let cell = td.querySelector('.table-cell-editor');
        if (!cell) {
            if (typeof switchToEditorFn === 'function') {
                switchToEditorFn(td, row, col);
            }
            return;
        }
        cell.focus();
        cell.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(cell);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
    }

    static updateStats(dom, data) {
        const numRows = data.rows.length;
        const numCols = data.headers.length;
        const numCells = numRows * numCols;

        if (dom.rowsCount) dom.rowsCount.textContent = `${numRows.toLocaleString()} rows`;
        if (dom.colsCount) dom.colsCount.textContent = `${numCols.toLocaleString()} columns`;
        if (dom.cellsCount) dom.cellsCount.textContent = `${numCells.toLocaleString()} cells`;
    }
}
