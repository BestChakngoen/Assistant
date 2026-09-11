import { ShareUI } from '../../ui/share/ShareUI.js';

/**
 * TableExporter.js - Table Data Export Utilities
 * Handles CSV (UTF-8 with BOM), Markdown, and TSV formats.
 * Adheres strictly to SRP and Clean Code standards.
 */

export class TableExporter {
    static generateTSV(data) {
        if (!data || !data.headers || !data.rows) return '';
        const headerLine = data.headers.join('\t');
        const rowLines = data.rows.map(row => row.join('\t'));
        return [headerLine, ...rowLines].join('\n');
    }

    static exportCsv(data) {
        try {
            const escapeCsvCell = (val) => {
                const s = (val ?? '').toString();
                if (s.includes('"') || s.includes(',') || s.includes('\n') || s.includes('\r')) {
                    return `"${s.replace(/"/g, '""')}"`;
                }
                return s;
            };

            const headerLine = data.headers.map(escapeCsvCell).join(',');
            const rowLines = data.rows.map(row => row.map(escapeCsvCell).join(','));
            const csvContent = '\uFEFF' + [headerLine, ...rowLines].join('\r\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const safeTitle = (data.title || 'quick_table')
                .trim()
                .toLowerCase()
                .replace(/[^a-z0-9_\-\u0E00-\u0E7F]+/g, '_')
                .replace(/^_+|_+$/g, '') || 'quick_table';
            const filename = `${safeTitle}_${Date.now()}.csv`;

            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error('Export CSV failed:', e);
            ShareUI.showToast('Export Failed', 'Could not export CSV file', 'error');
        }
    }

    static exportMarkdown(data) {
        try {
            const headers = data.headers.map(h => (h || '').trim());
            const dividers = headers.map(() => '---');

            const formatMdRow = (cells) => {
                return '| ' + cells.map(c => (c || '').replace(/\|/g, '\\|').replace(/\r?\n/g, '<br>')).join(' | ') + ' |';
            };

            const lines = [
                formatMdRow(headers),
                formatMdRow(dividers),
                ...data.rows.map(r => formatMdRow(r))
            ];

            const titleText = data.title ? `# ${data.title}\n\n` : '';
            const mdContent = titleText + lines.join('\n');

            const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const safeTitle = (data.title || 'quick_table')
                .trim()
                .toLowerCase()
                .replace(/[^a-z0-9_\-\u0E00-\u0E7F]+/g, '_')
                .replace(/^_+|_+$/g, '') || 'quick_table';
            const filename = `${safeTitle}_${Date.now()}.md`;

            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error('Export Markdown failed:', e);
            ShareUI.showToast('Export Failed', 'Could not export Markdown file', 'error');
        }
    }
}
