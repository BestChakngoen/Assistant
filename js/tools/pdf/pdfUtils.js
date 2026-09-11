/**
 * Common PDF & DropZone utilities for PdfConverterTool.
 */

export function initPdfJsWorker() {
    if (typeof window !== 'undefined' && window.pdfjsLib && !window.pdfjsLib.GlobalWorkerOptions.workerSrc) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }
}

export function setupDropZone(dropZoneEl, fileInputEl, onFilesSelected) {
    if (!dropZoneEl || !fileInputEl) return;

    dropZoneEl.onclick = () => fileInputEl.click();

    fileInputEl.onchange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            onFilesSelected(Array.from(e.target.files));
            fileInputEl.value = '';
        }
    };

    ['dragenter', 'dragover'].forEach(name => {
        dropZoneEl.addEventListener(name, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZoneEl.classList.add('ring-2', 'ring-cyan-500/50', 'bg-slate-900/90');
        }, false);
    });

    ['dragleave', 'drop'].forEach(name => {
        dropZoneEl.addEventListener(name, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZoneEl.classList.remove('ring-2', 'ring-cyan-500/50', 'bg-slate-900/90');
        }, false);
    });

    dropZoneEl.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        if (dt && dt.files && dt.files.length > 0) {
            onFilesSelected(Array.from(dt.files));
        }
    }, false);
}

export function downloadDataUrl(dataUrl, filename) {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

export function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
