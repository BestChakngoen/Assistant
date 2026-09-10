/**
 * toolsView.js - Tools Center Component Template (Preview Below Controls Layout)
 */
export const toolsViewHtml = `
    <div id="tools-panel" class="hidden flex-col gap-10 animate-fade-in pb-16">
        <!-- Header section -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
                <h2 class="text-2xl font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 flex items-center gap-2.5">
                    <i data-lucide="wrench" class="w-6 h-6 text-cyan-400"></i>
                    Tools Center
                </h2>
            </div>
        </div>

        <!-- ========================================== -->
        <!-- TOOL 1: QR CODE GENERATOR                  -->
        <!-- ========================================== -->
        <div class="space-y-4">
            <!-- Top Card: Input & Controls -->
            <div class="w-full p-6 rounded-3xl bg-slate-900/40 space-y-4">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2.5">
                        <div class="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
                            <i data-lucide="qr-code" class="w-5 h-5"></i>
                        </div>
                        <div>
                            <h3 class="text-sm font-mono font-bold text-white tracking-wide">URL & Text to QR Code</h3>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <button id="btn-qr-clear" type="button" class="btn-press flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/40 hover:bg-red-500/20 text-slate-400 hover:text-red-400 text-xs font-mono transition-all" title="Clear text">
                            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                            <span>Clear</span>
                        </button>
                    </div>
                </div>

                <!-- Input Area -->
                <div class="space-y-2">
                    <label for="qr-text-input" class="block text-xs font-mono font-medium text-slate-400">
                        URL Link or Text Content
                    </label>
                    <div class="relative">
                        <textarea id="qr-text-input" rows="3" placeholder="Type or paste link or text here (e.g., https://example.com)..." class="w-full px-4 py-3 rounded-2xl bg-slate-950/70 text-slate-100 placeholder:text-slate-600 outline-none focus:bg-slate-950 focus:ring-2 focus:ring-cyan-500/30 text-sm font-sans transition-all resize-none"></textarea>
                    </div>
                    <div class="flex items-center justify-between text-[11px] text-slate-500 font-mono px-1">
                        <span id="qr-char-count">0 characters</span>
                    </div>
                </div>
            </div>

            <!-- Bottom Card: Live QR Preview & Actions -->
            <div class="w-full p-6 sm:p-8 rounded-3xl bg-slate-900/40 flex flex-col items-center justify-center space-y-6 text-center">
                <div class="w-full flex items-center justify-between pb-2 text-left">
                    <div class="flex items-center gap-2">
                        <i data-lucide="eye" class="w-4 h-4 text-cyan-400"></i>
                        <h4 class="text-xs font-mono font-bold text-white uppercase tracking-wider">QR Code Preview</h4>
                    </div>
                    <span id="qr-status-badge" class="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800/60 text-slate-400">
                        Waiting for input
                    </span>
                </div>

                <!-- QR Code Display Area -->
                <div class="relative flex items-center justify-center min-h-[260px] w-full">
                    <!-- Empty placeholder -->
                    <div id="qr-empty-placeholder" class="flex flex-col items-center justify-center p-8 text-slate-500 gap-3">
                        <div class="w-16 h-16 rounded-2xl bg-slate-950/60 flex items-center justify-center text-slate-600">
                            <i data-lucide="qr-code" class="w-8 h-8 opacity-40"></i>
                        </div>
                        <p class="text-xs font-sans text-slate-400 max-w-[240px]">Enter or paste text above to generate and preview your QR code</p>
                    </div>

                    <!-- Actual QR Code Mount -->
                    <div id="qr-code-wrapper" class="hidden flex-col items-center justify-center">
                        <div id="qr-code-output" class="bg-white p-5 rounded-2xl shadow-2xl flex items-center justify-center"></div>
                    </div>
                </div>

                <!-- Action Buttons -->
                <div class="w-full max-w-md flex flex-col sm:flex-row items-center gap-3 pt-2">
                    <button id="btn-qr-download" type="button" disabled class="w-full sm:flex-1 btn-press flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl font-mono font-bold text-sm bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:from-cyan-600 disabled:hover:to-blue-600">
                        <i data-lucide="download" class="w-4 h-4"></i>
                        <span>DOWNLOAD QR CODE (PNG)</span>
                    </button>
                    <button id="btn-qr-copy-link" type="button" disabled class="w-full sm:w-auto btn-press flex items-center justify-center gap-2 py-3 px-5 rounded-xl font-mono text-xs text-slate-300 hover:text-white bg-slate-800/30 hover:bg-slate-800/70 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                        <i data-lucide="copy" class="w-3.5 h-3.5"></i>
                        <span>Copy Link</span>
                    </button>
                </div>
            </div>
        </div>

        <!-- ========================================== -->
        <!-- TOOL 2: IMAGE RESIZER                      -->
        <!-- ========================================== -->
        <div class="space-y-4">
            <!-- Top Card: Upload & Resize Controls -->
            <div class="w-full p-6 rounded-3xl bg-slate-900/40 space-y-5">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2.5">
                        <div class="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
                            <i data-lucide="image" class="w-5 h-5"></i>
                        </div>
                        <div>
                            <h3 class="text-sm font-mono font-bold text-white tracking-wide">Image Resizer</h3>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <button id="btn-img-clear" type="button" class="btn-press flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/40 hover:bg-red-500/20 text-slate-400 hover:text-red-400 text-xs font-mono transition-all" title="Clear image">
                            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                            <span>Clear</span>
                        </button>
                    </div>
                </div>

                <!-- Drop Zone -->
                <div id="img-drop-zone" class="p-8 rounded-2xl bg-slate-950/70 hover:bg-slate-950/90 cursor-pointer flex flex-col items-center justify-center text-center gap-3 transition-all group">
                    <input id="img-file-input" type="file" accept="image/*" class="hidden">
                    <div class="w-14 h-14 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <i data-lucide="upload-cloud" class="w-7 h-7"></i>
                    </div>
                    <div>
                        <p class="text-sm font-mono font-medium text-slate-200">Click to browse or drag & drop image</p>
                        <p class="text-xs text-slate-500 mt-1">Supports PNG, JPG, WEBP or Paste (Ctrl+V)</p>
                    </div>
                </div>

                <!-- Image Info (Hidden until image loaded) -->
                <div id="img-info-container" class="hidden p-4 rounded-2xl bg-slate-950/50 flex flex-wrap items-center justify-between text-xs font-mono gap-3">
                    <div class="flex items-center gap-2 text-slate-300 truncate max-w-xs sm:max-w-md">
                        <i data-lucide="file-image" class="w-4 h-4 text-cyan-400 shrink-0"></i>
                        <span id="img-info-filename" class="truncate font-semibold">filename.png</span>
                    </div>
                    <div class="flex items-center gap-3 text-slate-400 text-xs">
                        <span id="img-info-dimensions">0 x 0 px</span>
                        <span class="w-1 h-1 rounded-full bg-slate-700"></span>
                        <span id="img-info-filesize">0 KB</span>
                    </div>
                </div>

                <!-- Resize Controls (Hidden until image loaded) -->
                <div id="img-controls-container" class="hidden space-y-5 pt-1">
                    <!-- 1. Format & Quality Options -->
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <!-- Format -->
                        <div class="space-y-1.5">
                            <label for="img-format-select" class="block text-xs font-mono text-slate-400">Output Format</label>
                            <select id="img-format-select" class="w-full px-4 py-2.5 rounded-xl bg-slate-950/70 text-slate-200 outline-none focus:ring-2 focus:ring-cyan-500/30 text-xs font-mono transition-all cursor-pointer">
                                <option value="image/png">PNG (Lossless)</option>
                                <option value="image/jpeg">JPG (Compressed)</option>
                                <option value="image/webp">WEBP (Modern)</option>
                            </select>
                        </div>

                        <!-- Quality Slider (visible for JPG / WEBP) -->
                        <div id="img-quality-container" class="hidden space-y-1.5">
                            <div class="flex items-center justify-between text-xs font-mono text-slate-400">
                                <span>Quality</span>
                                <span id="img-quality-value" class="text-cyan-400 font-bold">90%</span>
                            </div>
                            <input id="img-quality-slider" type="range" min="10" max="100" value="90" class="w-full accent-cyan-400 cursor-pointer pt-1">
                        </div>
                    </div>

                    <!-- 2. Quick Scale (Step +/- 10%) -->
                    <div class="space-y-2 pt-1">
                        <div class="flex items-center justify-between text-[11px] font-mono">
                            <span class="text-slate-500 uppercase tracking-wider">Quick Scale:</span>
                            <span id="img-current-scale" class="text-cyan-400 font-bold bg-cyan-500/10 px-2 py-0.5 rounded-md">Scale: 100%</span>
                        </div>
                        <div class="flex flex-wrap items-center gap-2">
                            <button id="btn-scale-down" type="button" class="btn-press flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800/40 hover:bg-slate-800/80 text-xs text-slate-200 hover:text-white transition-all font-mono font-bold" title="Decrease size by 10%">
                                <i data-lucide="minus" class="w-3.5 h-3.5 text-cyan-400"></i>
                                <span>-10%</span>
                            </button>
                            <button id="btn-scale-up" type="button" class="btn-press flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800/40 hover:bg-slate-800/80 text-xs text-slate-200 hover:text-white transition-all font-mono font-bold" title="Increase size by 10%">
                                <i data-lucide="plus" class="w-3.5 h-3.5 text-cyan-400"></i>
                                <span>+10%</span>
                            </button>
                            <button id="btn-scale-reset" type="button" class="btn-press px-4 py-2 rounded-xl bg-slate-800/30 hover:bg-slate-800/70 text-xs text-slate-300 transition-all font-mono" title="Reset to original 100%">
                                100% (Reset)
                            </button>
                        </div>
                    </div>

                    <!-- 3. Width, Height & Aspect Ratio Lock -->
                    <div class="space-y-1.5 pt-1">
                        <span class="text-[11px] font-mono text-slate-500 uppercase tracking-wider">Dimensions:</span>
                        <div class="grid grid-cols-1 sm:grid-cols-11 gap-4 items-center">
                            <!-- Width -->
                            <div class="sm:col-span-5 space-y-1.5">
                                <label for="img-input-width" class="block text-xs font-mono text-slate-400">Width (px)</label>
                                <input id="img-input-width" type="number" min="1" max="10000" placeholder="Width" class="w-full px-4 py-2.5 rounded-xl bg-slate-950/70 text-slate-100 placeholder:text-slate-600 outline-none focus:ring-2 focus:ring-cyan-500/30 text-sm font-mono transition-all">
                            </div>

                            <!-- Aspect Ratio Lock Toggle -->
                            <div class="sm:col-span-1 flex items-center justify-center pt-5">
                                <button id="btn-img-lock-ratio" type="button" class="p-2.5 rounded-xl text-cyan-400 bg-cyan-500/15 hover:bg-cyan-500/25 transition-all" title="Aspect ratio locked">
                                    <i data-lucide="lock" id="img-lock-icon" class="w-4 h-4"></i>
                                </button>
                            </div>

                            <!-- Height -->
                            <div class="sm:col-span-5 space-y-1.5">
                                <label for="img-input-height" class="block text-xs font-mono text-slate-400">Height (px)</label>
                                <input id="img-input-height" type="number" min="1" max="10000" placeholder="Height" class="w-full px-4 py-2.5 rounded-xl bg-slate-950/70 text-slate-100 placeholder:text-slate-600 outline-none focus:ring-2 focus:ring-cyan-500/30 text-sm font-mono transition-all">
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Bottom Card: Live Resized Preview & Download -->
            <div class="w-full p-6 sm:p-8 rounded-3xl bg-slate-900/40 flex flex-col items-center justify-center space-y-6 text-center">
                <div class="w-full flex items-center justify-between pb-2 text-left">
                    <div class="flex items-center gap-2">
                        <i data-lucide="eye" class="w-4 h-4 text-cyan-400"></i>
                        <h4 class="text-xs font-mono font-bold text-white uppercase tracking-wider">Resized Preview</h4>
                    </div>
                    <span id="img-status-badge" class="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800/60 text-slate-400">
                        Waiting for image
                    </span>
                </div>

                <!-- Image Display Area -->
                <div class="relative flex items-center justify-center min-h-[320px] w-full">
                    <!-- Empty placeholder -->
                    <div id="img-empty-placeholder" class="flex flex-col items-center justify-center p-12 text-slate-500 gap-3">
                        <div class="w-20 h-20 rounded-2xl bg-slate-950/60 flex items-center justify-center text-slate-600">
                            <i data-lucide="image" class="w-10 h-10 opacity-40"></i>
                        </div>
                        <p class="text-xs font-sans text-slate-400 max-w-[280px]">Upload or drag an image above to inspect resized output</p>
                    </div>

                    <!-- Actual Preview Container (Full Width & Spacious Height) -->
                    <div id="img-preview-container" class="hidden flex-col items-center justify-center w-full gap-4">
                        <div class="max-h-[520px] w-full overflow-hidden rounded-2xl bg-slate-950/60 p-4 flex items-center justify-center shadow-inner">
                            <img id="img-preview-image" alt="Preview" class="max-h-[480px] max-w-full w-auto object-contain rounded-xl shadow-2xl">
                        </div>
                        <div class="flex items-center gap-4 text-xs font-mono text-slate-400 bg-slate-950/40 px-4 py-2 rounded-xl">
                            <span id="img-preview-dimensions" class="text-slate-300 font-semibold">0 x 0 px</span>
                            <span class="w-1.5 h-1.5 rounded-full bg-slate-700"></span>
                            <span id="img-preview-filesize" class="text-cyan-400 font-bold">0 KB</span>
                        </div>
                    </div>
                </div>

                <!-- Action Buttons -->
                <div class="w-full max-w-md pt-2">
                    <button id="btn-img-download" type="button" disabled class="w-full btn-press flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl font-mono font-bold text-sm bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:from-cyan-600 disabled:hover:to-blue-600">
                        <i data-lucide="download" class="w-4 h-4"></i>
                        <span>DOWNLOAD RESIZED IMAGE</span>
                    </button>
                </div>
            </div>
        </div>
    </div>
`;
