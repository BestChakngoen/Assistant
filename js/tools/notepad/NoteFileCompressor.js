/**
 * NoteFileCompressor.js - File Validation & Client-side Image Optimization
 * Compresses images to WebP/JPEG to stay well within Firebase Firestore & LocalStorage limits (<500 KB).
 * Adheres strictly to Single Responsibility Principle (SRP).
 */
export class NoteFileCompressor {
    static MAX_FILE_SIZE_BYTES = 500 * 1024; // 500 KB limit for smooth Cloud sync
    static MAX_IMAGE_DIMENSION = 1200;       // Max width/height in px
    static IMAGE_QUALITY = 0.82;             // WebP/JPEG quality

    /**
     * Validates whether a file is within the allowed size limit.
     * @param {File} file
     * @param {number} maxBytes
     * @returns {{ valid: boolean, error?: string }}
     */
    static validateFileSize(file, maxBytes = NoteFileCompressor.MAX_FILE_SIZE_BYTES) {
        if (!file) {
            return { valid: false, error: 'No file provided.' };
        }
        if (file.size > maxBytes) {
            const sizeKb = Math.round(file.size / 1024);
            const maxKb = Math.round(maxBytes / 1024);
            return {
                valid: false,
                error: `File "${file.name}" (${sizeKb} KB) exceeds maximum allowed size of ${maxKb} KB.`
            };
        }
        return { valid: true };
    }

    /**
     * Reads any file as a Base64 data URL.
     * @param {File} file
     * @returns {Promise<{ id: string, name: string, type: string, size: number, data: string, createdAt: number }>}
     */
    static readFileAsBase64(file) {
        return new Promise((resolve, reject) => {
            const validation = this.validateFileSize(file);
            if (!validation.valid) {
                return reject(new Error(validation.error));
            }

            const reader = new FileReader();
            reader.onload = () => {
                resolve({
                    id: 'file_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8),
                    name: file.name,
                    type: file.type || 'application/octet-stream',
                    size: file.size,
                    data: reader.result,
                    createdAt: Date.now()
                });
            };
            reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
            reader.readAsDataURL(file);
        });
    }

    /**
     * Compresses and resizes an image file to WebP (or JPEG fallback).
     * @param {File} file
     * @param {number} maxDimension
     * @param {number} quality
     * @returns {Promise<{ id: string, name: string, type: string, size: number, data: string, createdAt: number }>}
     */
    static compressImage(file, maxDimension = NoteFileCompressor.MAX_IMAGE_DIMENSION, quality = NoteFileCompressor.IMAGE_QUALITY) {
        return new Promise((resolve, reject) => {
            if (!file || !file.type.startsWith('image/')) {
                return reject(new Error('File is not a supported image.'));
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    try {
                        let { width, height } = img;

                        // Calculate aspect-ratio preserved dimensions
                        if (width > maxDimension || height > maxDimension) {
                            if (width > height) {
                                height = Math.round((height * maxDimension) / width);
                                width = maxDimension;
                            } else {
                                width = Math.round((width * maxDimension) / height);
                                height = maxDimension;
                            }
                        }

                        const canvas = document.createElement('canvas');
                        canvas.width = Math.max(width, 1);
                        canvas.height = Math.max(height, 1);
                        const ctx = canvas.getContext('2d');

                        // Clean rendering smoothing
                        ctx.imageSmoothingEnabled = true;
                        ctx.imageSmoothingQuality = 'high';
                        ctx.drawImage(img, 0, 0, width, height);

                        // Try webp first, fallback to jpeg if webp is not supported
                        let mimeType = 'image/webp';
                        let dataUrl = canvas.toDataURL(mimeType, quality);

                        // If webp unsupported or failed (returned empty/png), use jpeg
                        if (!dataUrl.startsWith('data:image/webp')) {
                            mimeType = 'image/jpeg';
                            dataUrl = canvas.toDataURL(mimeType, quality);
                        }

                        // Approximate bytes from base64 length
                        const base64Content = dataUrl.split(',')[1] || '';
                        const approxSize = Math.round((base64Content.length * 3) / 4);

                        // Second-pass downscale if image is still above 450KB
                        if (approxSize > 450 * 1024 && quality > 0.5) {
                            const secondPassQuality = 0.65;
                            dataUrl = canvas.toDataURL(mimeType, secondPassQuality);
                        }

                        resolve({
                            id: 'img_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8),
                            name: file.name.replace(/\.[^/.]+$/, "") + '.webp',
                            type: mimeType,
                            size: Math.round(((dataUrl.split(',')[1] || '').length * 3) / 4),
                            data: dataUrl,
                            createdAt: Date.now()
                        });
                    } catch (err) {
                        reject(err);
                    }
                };
                img.onerror = () => reject(new Error('Failed to load image file for compression.'));
                img.src = e.target.result;
            };
            reader.onerror = () => reject(new Error('Failed to read image file.'));
            reader.readAsDataURL(file);
        });
    }
}
