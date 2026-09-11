/**
 * Pure calculation & layout math module for PDF page sizing, orientation, and image placement.
 */
export class PdfGeometry {
    /**
     * Calculates page dimensions, orientation, and image fit coordinates.
     *
     * @param {Object} params
     * @param {string} params.pageSizeSetting - 'a4' | 'fit' | 'letter'
     * @param {string} params.orientationSetting - 'auto' | 'p' | 'l'
     * @param {number} params.marginMm - Margins in millimeters
     * @param {number} params.imgWidth - Image width in pixels
     * @param {number} params.imgHeight - Image height in pixels
     * @returns {Object} Layout metrics
     */
    static calculatePageLayout({ pageSizeSetting = 'a4', orientationSetting = 'auto', marginMm = 0, imgWidth, imgHeight }) {
        let orientation = orientationSetting;
        if (orientation === 'auto') {
            orientation = (imgWidth > imgHeight) ? 'l' : 'p';
        }

        let pageWidthMm = 210;
        let pageHeightMm = 297;
        let formatLabel = 'A4';

        if (pageSizeSetting === 'letter') {
            pageWidthMm = 215.9;
            pageHeightMm = 279.4;
            formatLabel = 'Letter';
        } else if (pageSizeSetting === 'fit') {
            const pxToMm = 0.264583;
            pageWidthMm = (imgWidth * pxToMm) + (marginMm * 2);
            pageHeightMm = (imgHeight * pxToMm) + (marginMm * 2);
            orientation = (pageWidthMm > pageHeightMm) ? 'l' : 'p';
            formatLabel = 'Fit to Image';
        }

        if (pageSizeSetting !== 'fit') {
            if (orientation === 'l' && pageWidthMm < pageHeightMm) {
                const temp = pageWidthMm;
                pageWidthMm = pageHeightMm;
                pageHeightMm = temp;
            } else if (orientation === 'p' && pageWidthMm > pageHeightMm) {
                const temp = pageWidthMm;
                pageWidthMm = pageHeightMm;
                pageHeightMm = temp;
            }
        }

        const printableW = Math.max(1, pageWidthMm - (marginMm * 2));
        const printableH = Math.max(1, pageHeightMm - (marginMm * 2));

        const imgAspect = imgWidth / imgHeight;
        const printableAspect = printableW / printableH;

        let drawW = printableW;
        let drawH = printableH;

        if (imgAspect > printableAspect) {
            drawW = printableW;
            drawH = printableW / imgAspect;
        } else {
            drawH = printableH;
            drawW = printableH * imgAspect;
        }

        const drawX = marginMm + ((printableW - drawW) / 2);
        const drawY = marginMm + ((printableH - drawH) / 2);

        return {
            pageWidthMm,
            pageHeightMm,
            orientation,
            formatLabel,
            printableW,
            printableH,
            drawW,
            drawH,
            drawX,
            drawY
        };
    }

    /**
     * Compresses/converts an image element onto a white canvas and returns JPEG data URL.
     *
     * @param {Object} img - { width, height, imgElement, file, dataUrl }
     * @param {number} quality - JPEG quality 0.1 - 1.0
     * @returns {string} Data URL
     */
    static getProcessedImageData(img, quality = 0.85) {
        if (quality >= 0.99 && img.file && img.file.type === 'image/jpeg') {
            return img.dataUrl;
        }

        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img.imgElement, 0, 0);

        return canvas.toDataURL('image/jpeg', quality);
    }
}
