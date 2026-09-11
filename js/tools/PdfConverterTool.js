import { ShareUI } from '../ui/share/ShareUI.js';
import { initPdfJsWorker } from './pdf/pdfUtils.js';
import { ImageToPdfManager } from './pdf/ImageToPdfManager.js';
import { PdfToImageManager } from './pdf/PdfToImageManager.js';
import { PdfToTextManager } from './pdf/PdfToTextManager.js';

/**
 * PdfConverterTool - Central coordinator for PDF Studio features:
 * 1. Image to PDF generation & interactive document preview
 * 2. PDF page extraction to images & ZIP packaging
 * 3. PDF text extraction & statistics
 */
export class PdfConverterTool {
    constructor() {
        this.dom = {
            btnModeImg2Pdf: null,
            btnModePdf2Img: null,
            btnModePdf2Txt: null,
            btnClear: null,
            sectionImg2Pdf: null,
            sectionPdf2Img: null,
            sectionPdf2Txt: null
        };

        this.currentMode = 'img2pdf';

        // Sub-feature managers
        this.imageToPdfManager = new ImageToPdfManager();
        this.pdfToImageManager = new PdfToImageManager();
        this.pdfToTextManager = new PdfToTextManager();
    }

    init() {
        this.cacheDom();
        if (!this.dom.btnModeImg2Pdf) return;

        initPdfJsWorker();
        this.bindEvents();

        this.imageToPdfManager.init();
        this.pdfToImageManager.init();
        this.pdfToTextManager.init();
    }

    cacheDom() {
        this.dom.btnModeImg2Pdf = document.getElementById('btn-pdf-mode-img2pdf');
        this.dom.btnModePdf2Img = document.getElementById('btn-pdf-mode-pdf2img');
        this.dom.btnModePdf2Txt = document.getElementById('btn-pdf-mode-pdf2txt');
        this.dom.btnClear = document.getElementById('btn-pdf-clear');

        this.dom.sectionImg2Pdf = document.getElementById('pdf-section-img2pdf');
        this.dom.sectionPdf2Img = document.getElementById('pdf-section-pdf2img');
        this.dom.sectionPdf2Txt = document.getElementById('pdf-section-pdf2txt');
    }

    bindEvents() {
        this.dom.btnModeImg2Pdf.onclick = () => this.switchMode('img2pdf');
        this.dom.btnModePdf2Img.onclick = () => this.switchMode('pdf2img');
        this.dom.btnModePdf2Txt.onclick = () => this.switchMode('pdf2txt');
        this.dom.btnClear.onclick = () => this.resetAll();
    }

    switchMode(mode) {
        this.currentMode = mode;
        ShareUI.playSound('mouse-click');

        const activeClass = ['bg-cyan-500/20', 'text-cyan-300', 'font-bold', 'shadow-[0_0_10px_rgba(6,182,212,0.2)]'];
        const inactiveClass = ['bg-slate-800/40', 'text-slate-400', 'hover:bg-slate-800/70', 'hover:text-slate-200'];

        const setButtonState = (btn, isActive) => {
            if (!btn) return;
            if (isActive) {
                btn.classList.remove(...inactiveClass);
                btn.classList.add(...activeClass);
            } else {
                btn.classList.remove(...activeClass);
                btn.classList.add(...inactiveClass);
            }
        };

        setButtonState(this.dom.btnModeImg2Pdf, mode === 'img2pdf');
        setButtonState(this.dom.btnModePdf2Img, mode === 'pdf2img');
        setButtonState(this.dom.btnModePdf2Txt, mode === 'pdf2txt');

        this.dom.sectionImg2Pdf.classList.toggle('hidden', mode !== 'img2pdf');
        this.dom.sectionPdf2Img.classList.toggle('hidden', mode !== 'pdf2img');
        this.dom.sectionPdf2Txt.classList.toggle('hidden', mode !== 'pdf2txt');

        if (window.lucide) window.lucide.createIcons();
    }

    resetAll() {
        ShareUI.playSound('mouse-click');

        this.imageToPdfManager.reset();
        this.pdfToImageManager.reset();
        this.pdfToTextManager.reset();

        ShareUI.showToast('Reset', 'PDF Studio inputs cleared', 'info');
    }
}
