import { DiagramManager } from '../DiagramManager.js';

export class UIStrategyLab {
    static initStrategyLab(uiManager) {
        uiManager.diagram = new DiagramManager('diagram-canvas', 'canvas-container');

        this.updateStrategyLabTime();
        setInterval(() => this.updateStrategyLabTime(), 1000);

        this.initPdfViewer();
    }

    static initPdfViewer() {
        const urlInput = document.getElementById('pdf-firebase-url');
        const saveBtn = document.getElementById('pdf-btn-save');
        const iframe = document.getElementById('pdf-viewer-iframe');
        const placeholder = document.getElementById('pdf-placeholder');

        if (!urlInput || !saveBtn || !iframe || !placeholder) return;

        const setIframeSource = (url) => {
            if (url && !url.includes('#') && (url.toLowerCase().endsWith('.pdf') || url.endsWith('financial_bible.pdf'))) {
                iframe.src = `${url}#zoom=page-width`;
            } else {
                iframe.src = url;
            }
        };

        const savedUrl = localStorage.getItem('firebase_strategy_pdf_url') || 'assets/financial_bible.pdf';
        if (savedUrl) {
            urlInput.value = savedUrl;
            setIframeSource(savedUrl);
            iframe.classList.remove('hidden');
            placeholder.classList.add('hidden');
        }

        saveBtn.addEventListener('click', () => {
            const url = urlInput.value.trim();
            if (url) {
                localStorage.setItem('firebase_strategy_pdf_url', url);
                setIframeSource(url);
                iframe.classList.remove('hidden');
                placeholder.classList.add('hidden');
                
                saveBtn.innerText = 'SAVED!';
                saveBtn.classList.remove('text-cyan-400', 'border-cyan-500/30', 'bg-cyan-500/10', 'hover:bg-cyan-500/20');
                saveBtn.classList.add('text-green-400', 'border-green-500/30', 'bg-green-500/10', 'hover:bg-green-500/20');
                setTimeout(() => {
                    saveBtn.innerText = 'SAVE';
                    saveBtn.classList.remove('text-green-400', 'border-green-500/30', 'bg-green-500/10', 'hover:bg-green-500/20');
                    saveBtn.classList.add('text-cyan-400', 'border-cyan-500/30', 'bg-cyan-500/10', 'hover:bg-cyan-500/20');
                }, 2000);
            } else {
                localStorage.removeItem('firebase_strategy_pdf_url');
                iframe.src = '';
                iframe.classList.add('hidden');
                placeholder.classList.remove('hidden');
            }
        });
    }

    static updateStrategyLabTime() {
        const localTimeEl = document.getElementById('session-local-time');
        if (!localTimeEl) return;

        const now = new Date();
        const optionTime = { timeZone: 'Asia/Bangkok', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
        const localTimeString = now.toLocaleTimeString('th-TH', optionTime);
        localTimeEl.innerText = localTimeString;

        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: 'Asia/Bangkok',
            hour: 'numeric',
            hour12: false
        });
        const currentHour = parseInt(formatter.format(now), 10);

        const tokyoEl = document.getElementById('session-tokyo');
        const londonEl = document.getElementById('session-london');
        const nyEl = document.getElementById('session-ny');

        if (tokyoEl) {
            const isTokyoOpen = currentHour >= 7 && currentHour < 15;
            tokyoEl.className = isTokyoOpen 
                ? "text-xs font-mono font-bold px-2 py-1 rounded bg-green-500/20 text-green-400 border border-green-500/30 shadow-[0_0_10px_rgba(34,197,94,0.2)]" 
                : "text-xs font-mono font-bold px-2 py-1 rounded bg-slate-800/80 text-slate-500 border border-slate-800";
            tokyoEl.innerText = isTokyoOpen ? "ACTIVE" : "CLOSED";
        }

        if (londonEl) {
            const isLondonOpen = currentHour >= 14 && currentHour < 22;
            londonEl.className = isLondonOpen 
                ? "text-xs font-mono font-bold px-2 py-1 rounded bg-green-500/20 text-green-400 border border-green-500/30 shadow-[0_0_10px_rgba(34,197,94,0.2)]" 
                : "text-xs font-mono font-bold px-2 py-1 rounded bg-slate-800/80 text-slate-500 border border-slate-800";
            londonEl.innerText = isLondonOpen ? "ACTIVE" : "CLOSED";
        }

        if (nyEl) {
            const isNyOpen = currentHour >= 19 || currentHour < 3;
            nyEl.className = isNyOpen 
                ? "text-xs font-mono font-bold px-2 py-1 rounded bg-green-500/20 text-green-400 border border-green-500/30 shadow-[0_0_10px_rgba(34,197,94,0.2)]" 
                : "text-xs font-mono font-bold px-2 py-1 rounded bg-slate-800/80 text-slate-500 border border-slate-800";
            nyEl.innerText = isNyOpen ? "ACTIVE" : "CLOSED";
        }
    }
}
