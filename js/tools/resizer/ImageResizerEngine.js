/**
 * ImageResizerEngine - Canvas rendering, image file loading, and export engine.
 */
export class ImageResizerEngine {
    /**
     * Reads a File object and decodes it into an HTMLImageElement with dimensional metadata.
     * @param {File} file
     * @returns {Promise<Object>}
     */
    static loadImageFromFile(file) {
        return new Promise((resolve, reject) => {
            if (!file || !file.type.startsWith('image/')) {
                return reject(new Error('Invalid image file'));
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const originalWidth = img.naturalWidth || img.width;
                    const originalHeight = img.naturalHeight || img.height;
                    const aspectRatio = originalHeight > 0 ? (originalWidth / originalHeight) : 1;
                    const originalFileName = file.name.replace(/\.[^/.]+$/, '');

                    let defaultFormat = 'image/png';
                    if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
                        defaultFormat = 'image/jpeg';
                    } else if (file.type === 'image/webp') {
                        defaultFormat = 'image/webp';
                    }

                    resolve({
                        image: img,
                        originalWidth,
                        originalHeight,
                        aspectRatio,
                        originalFileSize: file.size,
                        originalFileName,
                        originalMimeType: file.type,
                        defaultFormat
                    });
                };
                img.onerror = () => reject(new Error('Failed to decode image'));
                img.src = e.target.result;
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
        });
    }

    /**
     * Renders an image onto an offscreen canvas with target dimensions and format, then returns a Blob.
     * @param {Object} params
     * @param {HTMLImageElement} params.image
     * @param {number} params.targetWidth
     * @param {number} params.targetHeight
     * @param {string} [params.format='image/png']
     * @param {number} [params.quality=0.9]
     * @returns {Promise<Blob>}
     */
    static renderToBlob({ image, targetWidth, targetHeight, format = 'image/png', quality = 0.9 }) {
        return new Promise((resolve, reject) => {
            if (!image) return reject(new Error('No image provided'));

            const targetW = Math.max(1, targetWidth);
            const targetH = Math.max(1, targetHeight);

            const canvas = document.createElement('canvas');
            canvas.width = targetW;
            canvas.height = targetH;
            const ctx = canvas.getContext('2d');

            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';

            // Draw white background if converting PNG with transparency to JPEG
            if (format === 'image/jpeg') {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, targetW, targetH);
            }

            ctx.drawImage(image, 0, 0, targetW, targetH);

            canvas.toBlob((blob) => {
                if (blob) {
                    resolve(blob);
                } else {
                    reject(new Error('Canvas toBlob failed'));
                }
            }, format, quality);
        });
    }

    /**
     * Downloads a blob with the formatted filename and cleans up the Object URL.
     * @param {Object} params
     * @param {Blob} params.blob
     * @param {string} params.baseFileName
     * @param {number} params.width
     * @param {number} params.height
     * @param {string} params.format
     * @returns {string} Downloaded filename
     */
    static downloadBlob({ blob, baseFileName = 'image', width, height, format = 'image/png' }) {
        const extMap = {
            'image/png': 'png',
            'image/jpeg': 'jpg',
            'image/webp': 'webp'
        };
        const ext = extMap[format] || 'png';
        const filename = `${baseFileName}_${width}x${height}.${ext}`;

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        return filename;
    }
}
