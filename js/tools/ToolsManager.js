import { QRCodeTool } from './qrcode/QRCodeTool.js';
import { ImageResizerTool } from './resizer/ImageResizerTool.js';
import { PdfConverterTool } from './pdf/PdfConverterTool.js';
import { NotePadTool } from './notepad/NotePadTool.js';
import { TableGridTool } from './table/TableGridTool.js';

/**
 * ToolsManager - Central manager for utility tools and features in the Assistant workspace.
 */
export class ToolsManager {
    constructor() {
        this.qrCodeTool = new QRCodeTool();
        this.imageResizerTool = new ImageResizerTool();
        this.pdfConverterTool = new PdfConverterTool();
        this.notePadTool = new NotePadTool();
        this.tableGridTool = new TableGridTool();
    }

    init() {
        this.qrCodeTool.init();
        this.imageResizerTool.init();
        this.pdfConverterTool.init();
        this.notePadTool.init();
        this.tableGridTool.init();
    }
}
