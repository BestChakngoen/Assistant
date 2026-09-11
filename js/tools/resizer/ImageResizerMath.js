/**
 * ImageResizerMath - Pure mathematical and dimension calculations for image resizing.
 */
export class ImageResizerMath {
    /**
     * Calculates proportional height given target width and aspect ratio.
     * @param {number} width
     * @param {number} aspectRatio
     * @returns {number}
     */
    static calculateHeightFromWidth(width, aspectRatio) {
        if (!aspectRatio || aspectRatio <= 0) return width;
        return Math.max(1, Math.round(width / aspectRatio));
    }

    /**
     * Calculates proportional width given target height and aspect ratio.
     * @param {number} height
     * @param {number} aspectRatio
     * @returns {number}
     */
    static calculateWidthFromHeight(height, aspectRatio) {
        if (!aspectRatio || aspectRatio <= 0) return height;
        return Math.max(1, Math.round(height * aspectRatio));
    }

    /**
     * Computes the scale factor ratio between current and original dimensions.
     * @param {number} currentDim
     * @param {number} originalDim
     * @returns {number}
     */
    static calculateScaleFactor(currentDim, originalDim) {
        if (!originalDim || originalDim <= 0) return 1.0;
        return Math.round((currentDim / originalDim) * 100) / 100;
    }

    /**
     * Steps scale factor with precision rounding and bounds clamping.
     * @param {number} currentScale
     * @param {number} delta
     * @param {number} min
     * @param {number} max
     * @returns {number}
     */
    static stepScaleFactor(currentScale, delta, min = 0.1, max = 5.0) {
        const nextScale = Math.round((currentScale + delta) * 10) / 10;
        return Math.max(min, Math.min(max, nextScale));
    }

    /**
     * Computes dimensions from original size and a scale factor.
     * @param {number} originalWidth
     * @param {number} originalHeight
     * @param {number} scaleFactor
     * @returns {{ width: number, height: number }}
     */
    static calculateScaledDimensions(originalWidth, originalHeight, scaleFactor) {
        return {
            width: Math.max(1, Math.round(originalWidth * scaleFactor)),
            height: Math.max(1, Math.round(originalHeight * scaleFactor))
        };
    }

    /**
     * Formats raw byte size into a human-readable string.
     * @param {number} bytes
     * @returns {string}
     */
    static formatBytes(bytes) {
        if (!bytes || bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }
}
