import { QRCodeTool } from './QRCodeTool.js';
import { ImageResizerTool } from './ImageResizerTool.js';

/**
 * ToolsManager - Central manager for utility tools and features in the Assistant workspace.
 */
export class ToolsManager {
    constructor() {
        this.qrCodeTool = new QRCodeTool();
        this.imageResizerTool = new ImageResizerTool();
    }

    init() {
        this.qrCodeTool.init();
        this.imageResizerTool.init();
    }
}
