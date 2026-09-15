/**
 * toolsView.js - Tools Center Component Template (Preview Below Controls Layout)
 */
export const toolsViewHtml = `
    <div id="tools-panel" class="hidden flex-col gap-10 animate-fade-in pb-16 w-full">
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
        <!-- TOP SECTION: QUICK NOTE & SCRATCHPAD       -->
        <!-- ========================================== -->
        <div id="tools-note-section" class="w-full">
            <div class="w-full p-6 sm:p-7 rounded-3xl bg-slate-900/40 flex flex-col space-y-4">
                <!-- Header -->
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div class="flex items-center gap-2.5">
                        <div class="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                            <i data-lucide="file-text" class="size-5"></i>
                        </div>
                        <div>
                            <h3 class="text-sm font-mono font-bold text-white tracking-wide flex items-center gap-2">
                                <span>Quick Note & Scratchpad</span>
                                <span id="note-save-badge" class="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800/60 text-slate-400">
                                    <span class="size-1.5 rounded-full bg-slate-500"></span>
                                    <span>Ready</span>
                                </span>
                            </h3>
                            <p class="text-[11px] font-mono text-slate-400">Instant blank sheet for quick notes, code snippets, and thoughts with auto-sync.</p>
                        </div>
                    </div>

                    <!-- Right Controls / Actions -->
                    <div class="flex items-center flex-wrap gap-2">
                        <span id="note-last-updated" class="text-[10px] font-mono text-slate-400 mr-1 hidden sm:inline-block"></span>
                        <button id="btn-note-copy" type="button" title="Copy note to clipboard" class="btn-press p-2 rounded-xl bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 hover:text-white transition-all flex items-center gap-1.5 text-xs font-mono">
                            <i data-lucide="copy" class="size-3.5"></i>
                            <span class="hidden md:inline">Copy</span>
                        </button>
                        <button id="btn-note-export-txt" type="button" title="Export as plain text (.txt)" class="btn-press p-2 rounded-xl bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 hover:text-white transition-all flex items-center gap-1.5 text-xs font-mono">
                            <i data-lucide="file-down" class="size-3.5"></i>
                            <span class="hidden md:inline">.TXT</span>
                        </button>
                        <button id="btn-note-export-md" type="button" title="Export as Markdown (.md)" class="btn-press p-2 rounded-xl bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 hover:text-white transition-all flex items-center gap-1.5 text-xs font-mono">
                            <i data-lucide="file-code" class="size-3.5"></i>
                            <span class="hidden md:inline">.MD</span>
                        </button>
                        <button id="btn-note-clear" type="button" title="Clear note" class="btn-press p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-all flex items-center gap-1.5 text-xs font-mono">
                            <i data-lucide="trash-2" class="size-3.5"></i>
                            <span class="hidden md:inline">Clear</span>
                        </button>
                    </div>
                </div>

                <!-- Note Title Input -->
                <div class="w-full">
                    <input id="note-title-input" type="text" placeholder="Note Title (Optional)..." maxlength="120" class="w-full px-4 py-2.5 rounded-xl bg-slate-950/70 text-slate-100 placeholder:text-slate-600 outline-none focus:bg-slate-950 focus:ring-2 focus:ring-amber-500/30 text-xs sm:text-sm font-mono font-semibold transition-all">
                </div>

                <!-- Note Content Textarea -->
                <div class="w-full relative">
                    <textarea id="note-content-input" rows="10" placeholder="Type or paste your notes here... Paste images (Ctrl+V) or drop files directly onto this sheet." class="w-full px-4 py-3 rounded-2xl bg-slate-950/70 text-slate-100 placeholder:text-slate-600 outline-none focus:bg-slate-950 focus:ring-2 focus:ring-amber-500/30 text-xs sm:text-sm font-mono leading-relaxed transition-all resize-y select-text"></textarea>
                </div>

                <!-- Smart Auto-Detected Media & Links Section (Hidden by default, shown automatically when media/links detected) -->
                <div id="note-smart-detector-container" class="hidden w-full flex flex-col space-y-3 pt-1">
                    <!-- Header Bar -->
                    <div class="flex items-center justify-between flex-wrap gap-2">
                        <div class="flex items-center gap-2">
                            <span class="p-1.5 rounded-xl bg-amber-500/10 text-amber-400">
                                <i data-lucide="sparkles" class="size-3.5"></i>
                            </span>
                            <span class="text-xs font-mono font-semibold text-slate-300">Auto-Detected Media & Links</span>
                            <span id="note-detected-badge" class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800/60 text-slate-400">0 detected</span>
                        </div>
                    </div>

                    <!-- Detected Items Container -->
                    <div class="w-full flex flex-col space-y-2">
                        <!-- Detected Links -->
                        <div id="note-detected-links" class="hidden flex flex-col space-y-1.5"></div>
                        <!-- Detected Images Grid -->
                        <div id="note-detected-images" class="hidden grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5"></div>
                        <!-- Detected Files List -->
                        <div id="note-detected-files" class="hidden flex flex-col space-y-1.5"></div>
                    </div>
                </div>

                <!-- Drop Zone Indicator (shown when dragging files over note) -->
                <div id="note-drop-zone" class="hidden w-full p-4 rounded-2xl bg-amber-500/10 text-amber-400 text-center text-xs font-mono flex items-center justify-center gap-2 transition-all">
                    <i data-lucide="upload-cloud" class="size-4 animate-bounce"></i>
                    <span>Drop image or file to insert into note automatically</span>
                </div>

                <!-- Footer Stats -->
                <div class="flex items-center justify-between pt-1 text-[11px] font-mono text-slate-400">
                    <div class="flex items-center gap-3">
                        <span id="note-chars-count" class="tabular-nums">0 characters</span>
                        <span class="size-1 rounded-full bg-slate-700"></span>
                        <span id="note-words-count" class="tabular-nums">0 words</span>
                        <span class="size-1 rounded-full bg-slate-700"></span>
                        <span id="note-lines-count" class="tabular-nums">0 lines</span>
                    </div>
                    <div class="flex items-center gap-1.5 text-[10px] text-slate-400">
                        <i data-lucide="cloud" class="size-3 text-cyan-400"></i>
                        <span>Firebase & Local Sync</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- ========================================== -->
        <!-- SECTION: FREEFORM DATA GRID & TABLE TOOL   -->
        <!-- ========================================== -->
        <div id="tools-table-section" class="w-full">
            <div class="w-full p-6 sm:p-7 rounded-3xl bg-slate-900/40 flex flex-col space-y-4">
                <!-- Header -->
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div class="flex items-center gap-2.5">
                        <div class="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                            <i data-lucide="table" class="size-5"></i>
                        </div>
                        <div>
                            <h3 class="text-sm font-mono font-bold text-white tracking-wide flex items-center gap-2">
                                <span>Freeform Data Table</span>
                                <span id="table-save-badge" class="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800/60 text-slate-400">
                                    <span class="size-1.5 rounded-full bg-slate-500"></span>
                                    <span>Ready</span>
                                </span>
                            </h3>
                            <p class="text-[11px] font-mono text-slate-400">Flexible grid with dynamic rows & columns, content-fit cells, and auto-sync.</p>
                        </div>
                    </div>

                    <!-- Right Controls / Actions -->
                    <div class="flex items-center flex-wrap gap-2">
                        <span id="table-last-updated" class="text-[10px] font-mono text-slate-400 mr-1 hidden sm:inline-block"></span>
                        <button id="btn-table-add-row" type="button" title="Add new row" class="btn-press p-2 rounded-xl bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 hover:text-white transition-all flex items-center gap-1.5 text-xs font-mono">
                            <i data-lucide="plus" class="size-3.5 text-emerald-400"></i>
                            <span>Add Row</span>
                        </button>
                        <button id="btn-table-add-col" type="button" title="Add new column" class="btn-press p-2 rounded-xl bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 hover:text-white transition-all flex items-center gap-1.5 text-xs font-mono">
                            <i data-lucide="columns" class="size-3.5 text-emerald-400"></i>
                            <span>Add Col</span>
                        </button>
                        <button id="btn-table-paste" type="button" title="Paste table from clipboard (Excel / Sheets)" class="btn-press p-2 rounded-xl bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 hover:text-white transition-all flex items-center gap-1.5 text-xs font-mono">
                            <i data-lucide="clipboard-paste" class="size-3.5"></i>
                            <span class="hidden md:inline">Paste</span>
                        </button>
                        <button id="btn-table-copy" type="button" title="Copy table as TSV / Markdown" class="btn-press p-2 rounded-xl bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 hover:text-white transition-all flex items-center gap-1.5 text-xs font-mono">
                            <i data-lucide="copy" class="size-3.5"></i>
                            <span class="hidden md:inline">Copy</span>
                        </button>
                        <button id="btn-table-export-csv" type="button" title="Export as CSV (.csv)" class="btn-press p-2 rounded-xl bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 hover:text-white transition-all flex items-center gap-1.5 text-xs font-mono">
                            <i data-lucide="file-spreadsheet" class="size-3.5"></i>
                            <span class="hidden md:inline">.CSV</span>
                        </button>
                        <button id="btn-table-export-md" type="button" title="Export as Markdown Table (.md)" class="btn-press p-2 rounded-xl bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 hover:text-white transition-all flex items-center gap-1.5 text-xs font-mono">
                            <i data-lucide="file-code" class="size-3.5"></i>
                            <span class="hidden md:inline">.MD</span>
                        </button>
                        <button id="btn-table-clear" type="button" title="Reset table" class="btn-press p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-all flex items-center gap-1.5 text-xs font-mono">
                            <i data-lucide="trash-2" class="size-3.5"></i>
                            <span class="hidden md:inline">Clear</span>
                        </button>
                    </div>
                </div>

                <!-- Table Title Input -->
                <div class="w-full">
                    <input id="table-title-input" type="text" placeholder="Table Title (Optional)..." maxlength="120" class="w-full px-4 py-2.5 rounded-xl bg-slate-950/70 text-slate-100 placeholder:text-slate-600 outline-none focus:bg-slate-950 focus:ring-2 focus:ring-emerald-500/30 text-xs sm:text-sm font-mono font-semibold transition-all">
                </div>

                <!-- Table Wrapper (Horizontal & Vertical Permanent Scrollbar for Large Data) -->
                <div id="table-scroll-wrapper" class="w-full max-h-[480px] sm:max-h-[540px] overflow-x-auto overflow-y-auto table-scroll-permanent rounded-2xl bg-slate-950/60 p-2 relative">
                    <table id="table-grid-element" class="w-auto min-w-full table-auto border-collapse">
                        <thead id="table-grid-head" class="sticky top-0 z-20 bg-slate-950"></thead>
                        <tbody id="table-grid-body"></tbody>
                    </table>

                    <!-- Quick Add Row Bottom Button -->
                    <button id="btn-table-quick-add-row" type="button" class="w-full py-2 rounded-xl bg-slate-900/30 hover:bg-slate-900/80 text-slate-400 hover:text-emerald-400 text-xs font-mono transition-all flex items-center justify-center gap-2 mt-2">
                        <i data-lucide="plus" class="size-3.5"></i>
                        <span>Add Row</span>
                    </button>
                </div>

                <!-- Footer Stats -->
                <div class="flex items-center justify-between pt-1 text-[11px] font-mono text-slate-400">
                    <div class="flex items-center gap-3">
                        <span id="table-rows-count" class="tabular-nums">0 rows</span>
                        <span class="size-1 rounded-full bg-slate-700"></span>
                        <span id="table-cols-count" class="tabular-nums">0 columns</span>
                        <span class="size-1 rounded-full bg-slate-700"></span>
                        <span id="table-cells-count" class="tabular-nums">0 cells</span>
                    </div>
                    <div class="flex items-center gap-1.5 text-[10px] text-slate-400">
                        <i data-lucide="cloud" class="size-3 text-emerald-400"></i>
                        <span>Firebase & Local Sync</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- ========================================== -->
        <!-- MIDDLE SECTION: 2-COLUMN GRID (QR & RESIZER) -->
        <!-- ========================================== -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-stretch">
            <!-- ========================================== -->
            <!-- COLUMN 1: QR CODE GENERATOR                -->
            <!-- ========================================== -->
            <div class="flex flex-col gap-6 h-full">
                <!-- Top Card: Input & Controls -->
                <div class="w-full p-6 sm:p-7 rounded-3xl bg-slate-900/40 flex flex-col justify-between space-y-4">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2.5">
                            <div class="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
                                <i data-lucide="qr-code" class="size-5"></i>
                            </div>
                            <div>
                                <h3 class="text-sm font-mono font-bold text-white tracking-wide">URL & Text to QR Code</h3>
                            </div>
                        </div>
                        <div class="flex items-center gap-2">
                            <button id="btn-qr-clear" type="button" class="btn-press flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/40 hover:bg-red-500/20 text-slate-400 hover:text-red-400 text-xs font-mono transition-all" title="Clear text">
                                <i data-lucide="trash-2" class="size-3.5"></i>
                                <span>Clear</span>
                            </button>
                        </div>
                    </div>

                    <!-- Input Area -->
                    <div class="space-y-2 flex-1 flex flex-col justify-end">
                        <label for="qr-text-input" class="block text-xs font-mono font-medium text-slate-400">
                            URL Link or Text Content
                        </label>
                        <div class="relative flex-1">
                            <textarea id="qr-text-input" rows="4" placeholder="Type or paste link or text here (e.g., https://example.com)..." class="w-full h-[120px] px-4 py-3 rounded-2xl bg-slate-950/70 text-slate-100 placeholder:text-slate-600 outline-none focus:bg-slate-950 focus:ring-2 focus:ring-cyan-500/30 text-sm font-sans transition-all resize-none"></textarea>
                        </div>
                        <div class="flex items-center justify-between text-[11px] text-slate-500 font-mono px-1 pt-0.5">
                            <span id="qr-char-count" class="tabular-nums">0 characters</span>
                            <span class="text-[10px] text-slate-500">Live Auto-Generation</span>
                        </div>
                    </div>

                    <!-- QR Size / Resolution Adjustment Controls -->
                    <div class="space-y-3 pt-3 border-t border-slate-800/60">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-1.5 text-xs font-mono text-slate-400">
                                <i data-lucide="maximize" class="size-3.5 text-cyan-400"></i>
                                <span>Output Resolution</span>
                            </div>
                            <span id="qr-size-badge" class="text-cyan-400 font-bold bg-cyan-500/10 px-2.5 py-0.5 rounded-md tabular-nums text-xs font-mono">
                                256 × 256 px
                            </span>
                        </div>

                        <!-- Size Slider -->
                        <div class="space-y-1">
                            <input id="qr-size-slider" type="range" min="128" max="1024" step="32" value="256" class="w-full accent-cyan-400 cursor-pointer">
                            <div class="flex items-center justify-between text-[10px] text-slate-500 font-mono px-0.5">
                                <span>128px</span>
                                <span>512px</span>
                                <span>1024px</span>
                            </div>
                        </div>

                        <!-- Quick Presets -->
                        <div class="flex flex-wrap items-center gap-1.5 pt-0.5">
                            <button type="button" data-qr-size="180" class="btn-qr-size-preset btn-press px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all bg-slate-800/40 hover:bg-slate-800 text-slate-400 hover:text-slate-200">
                                180px
                            </button>
                            <button type="button" data-qr-size="256" class="btn-qr-size-preset btn-press px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all bg-cyan-500/20 text-cyan-300 font-bold shadow-[0_0_8px_rgba(6,182,212,0.2)]">
                                256px
                            </button>
                            <button type="button" data-qr-size="384" class="btn-qr-size-preset btn-press px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all bg-slate-800/40 hover:bg-slate-800 text-slate-400 hover:text-slate-200">
                                384px
                            </button>
                            <button type="button" data-qr-size="512" class="btn-qr-size-preset btn-press px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all bg-slate-800/40 hover:bg-slate-800 text-slate-400 hover:text-slate-200">
                                512px
                            </button>
                            <button type="button" data-qr-size="1024" class="btn-qr-size-preset btn-press px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all bg-slate-800/40 hover:bg-slate-800 text-slate-400 hover:text-slate-200">
                                1024px
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Bottom Card: Live QR Preview & Actions -->
                <div class="w-full p-6 sm:p-7 rounded-3xl bg-slate-900/40 flex-1 flex flex-col justify-between space-y-6 text-center">
                    <div class="w-full flex items-center justify-between pb-2 text-left">
                        <div class="flex items-center gap-2">
                            <i data-lucide="eye" class="size-4 text-cyan-400"></i>
                            <h4 class="text-xs font-mono font-bold text-white uppercase tracking-wider">QR Code Preview</h4>
                        </div>
                        <span id="qr-status-badge" class="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800/60 text-slate-400">
                            Waiting for input
                        </span>
                    </div>

                    <!-- QR Code Display Area -->
                    <div class="relative flex items-center justify-center min-h-[320px] flex-1 w-full">
                        <!-- Empty placeholder -->
                        <div id="qr-empty-placeholder" class="flex flex-col items-center justify-center p-8 text-slate-500 gap-3">
                            <div class="size-16 rounded-2xl bg-slate-950/60 flex items-center justify-center text-slate-600">
                                <i data-lucide="qr-code" class="size-8 opacity-40"></i>
                            </div>
                            <p class="text-xs font-sans text-slate-400 max-w-[240px]">Enter or paste text above to generate and preview your QR code</p>
                        </div>

                        <!-- Actual QR Code Mount -->
                        <div id="qr-code-wrapper" class="hidden flex-col items-center justify-center">
                            <div id="qr-code-output" class="bg-white p-5 rounded-2xl shadow-2xl flex items-center justify-center max-w-full max-h-[320px] overflow-hidden [&>canvas]:max-h-[260px] [&>canvas]:max-w-full [&>canvas]:w-auto [&>canvas]:h-auto [&>img]:max-h-[260px] [&>img]:max-w-full [&>img]:w-auto [&>img]:h-auto"></div>
                        </div>
                    </div>

                    <!-- Action Buttons -->
                    <div class="w-full flex flex-col sm:flex-row items-center gap-3 pt-2">
                        <button id="btn-qr-download" type="button" disabled class="w-full sm:flex-1 btn-press flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl font-mono font-bold text-sm bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:from-cyan-600 disabled:hover:to-blue-600">
                            <i data-lucide="download" class="size-4"></i>
                            <span>DOWNLOAD QR CODE (PNG)</span>
                        </button>
                        <button id="btn-qr-copy-link" type="button" disabled class="w-full sm:w-auto btn-press flex items-center justify-center gap-2 py-3.5 px-5 rounded-xl font-mono text-xs text-slate-300 hover:text-white bg-slate-800/40 hover:bg-slate-800/80 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                            <i data-lucide="copy" class="size-3.5"></i>
                            <span>Copy Link</span>
                        </button>
                    </div>
                </div>
            </div>

            <!-- ========================================== -->
            <!-- COLUMN 2: IMAGE RESIZER                    -->
            <!-- ========================================== -->
            <div class="flex flex-col gap-6 h-full">
                <!-- Top Card: Upload & Resize Controls -->
                <div class="w-full p-6 sm:p-7 rounded-3xl bg-slate-900/40 flex flex-col justify-between space-y-4">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2.5">
                            <div class="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
                                <i data-lucide="image" class="size-5"></i>
                            </div>
                            <div>
                                <h3 class="text-sm font-mono font-bold text-white tracking-wide">Image Resizer</h3>
                            </div>
                        </div>
                        <div class="flex items-center gap-2">
                            <button id="btn-img-clear" type="button" class="btn-press flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/40 hover:bg-red-500/20 text-slate-400 hover:text-red-400 text-xs font-mono transition-all" title="Clear image">
                                <i data-lucide="trash-2" class="size-3.5"></i>
                                <span>Clear</span>
                            </button>
                        </div>
                    </div>

                    <!-- Drop Zone -->
                    <div class="space-y-2 flex-1 flex flex-col justify-end">
                        <span class="block text-xs font-mono font-medium text-slate-400">
                            Source Image Upload
                        </span>
                        <div id="img-drop-zone" class="h-[120px] p-4 rounded-2xl bg-slate-950/70 hover:bg-slate-950/90 cursor-pointer flex flex-col items-center justify-center text-center gap-2 transition-all group">
                            <input id="img-file-input" type="file" accept="image/*" class="hidden">
                            <div class="size-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <i data-lucide="upload-cloud" class="size-5"></i>
                            </div>
                            <div>
                                <p class="text-xs font-mono font-medium text-slate-200">Click to browse or drag & drop image</p>
                                <p class="text-[10px] text-slate-500 mt-0.5">Supports PNG, JPG, WEBP or Paste (Ctrl+V)</p>
                            </div>
                        </div>
                        <div class="flex items-center justify-between text-[11px] text-slate-500 font-mono px-1 pt-0.5">
                            <span>Auto Aspect Ratio</span>
                            <span class="text-[10px] text-slate-500">Lossless & High-DPI</span>
                        </div>
                    </div>

                    <!-- Image Info (Hidden until image loaded) -->
                    <div id="img-info-container" class="hidden p-3.5 rounded-2xl bg-slate-950/50 flex flex-wrap items-center justify-between text-xs font-mono gap-2">
                        <div class="flex items-center gap-2 text-slate-300 truncate max-w-xs sm:max-w-md">
                            <i data-lucide="file-image" class="size-4 text-cyan-400 shrink-0"></i>
                            <span id="img-info-filename" class="truncate font-semibold">filename.png</span>
                        </div>
                        <div class="flex items-center gap-3 text-slate-400 text-xs">
                            <span id="img-info-dimensions" class="tabular-nums">0 x 0 px</span>
                            <span class="size-1 rounded-full bg-slate-700"></span>
                            <span id="img-info-filesize" class="tabular-nums">0 KB</span>
                        </div>
                    </div>

                    <!-- Resize Controls (Hidden until image loaded) -->
                    <div id="img-controls-container" class="hidden space-y-4 pt-1">
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
                                    <span id="img-quality-value" class="text-cyan-400 font-bold tabular-nums">90%</span>
                                </div>
                                <input id="img-quality-slider" type="range" min="10" max="100" value="90" class="w-full accent-cyan-400 cursor-pointer pt-1">
                            </div>
                        </div>

                        <!-- 2. Quick Scale (Step +/- 10%) -->
                        <div class="space-y-2 pt-1">
                            <div class="flex items-center justify-between text-[11px] font-mono">
                                <span class="text-slate-500 uppercase tracking-wider">Quick Scale:</span>
                                <span id="img-current-scale" class="text-cyan-400 font-bold bg-cyan-500/10 px-2 py-0.5 rounded-md tabular-nums">Scale: 100%</span>
                            </div>
                            <div class="flex flex-wrap items-center gap-2">
                                <button id="btn-scale-down" type="button" class="btn-press flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800/40 hover:bg-slate-800/80 text-xs text-slate-200 hover:text-white transition-all font-mono font-bold" title="Decrease size by 10%">
                                    <i data-lucide="minus" class="size-3.5 text-cyan-400"></i>
                                    <span>-10%</span>
                                </button>
                                <button id="btn-scale-up" type="button" class="btn-press flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800/40 hover:bg-slate-800/80 text-xs text-slate-200 hover:text-white transition-all font-mono font-bold" title="Increase size by 10%">
                                    <i data-lucide="plus" class="size-3.5 text-cyan-400"></i>
                                    <span>+10%</span>
                                </button>
                                <button id="btn-scale-reset" type="button" class="btn-press px-3.5 py-1.5 rounded-xl bg-slate-800/30 hover:bg-slate-800/70 text-xs text-slate-300 transition-all font-mono" title="Reset to original 100%">
                                    100% (Reset)
                                </button>
                            </div>
                        </div>

                        <!-- 3. Width, Height & Aspect Ratio Lock -->
                        <div class="space-y-1.5 pt-1">
                            <span class="text-[11px] font-mono text-slate-500 uppercase tracking-wider">Dimensions:</span>
                            <div class="grid grid-cols-1 sm:grid-cols-11 gap-3 items-center">
                                <!-- Width -->
                                <div class="sm:col-span-5 space-y-1.5">
                                    <label for="img-input-width" class="block text-xs font-mono text-slate-400">Width (px)</label>
                                    <input id="img-input-width" type="number" min="1" max="10000" placeholder="Width" class="w-full px-3.5 py-2 rounded-xl bg-slate-950/70 text-slate-100 placeholder:text-slate-600 outline-none focus:ring-2 focus:ring-cyan-500/30 text-sm font-mono tabular-nums transition-all">
                                </div>

                                <!-- Aspect Ratio Lock Toggle -->
                                <div class="sm:col-span-1 flex items-center justify-center pt-5">
                                    <button id="btn-img-lock-ratio" type="button" class="p-2 rounded-xl text-cyan-400 bg-cyan-500/15 hover:bg-cyan-500/25 transition-all cursor-pointer" title="Aspect ratio locked">
                                        <i data-lucide="lock" id="img-lock-icon" class="size-4"></i>
                                    </button>
                                </div>

                                <!-- Height -->
                                <div class="sm:col-span-5 space-y-1.5">
                                    <label for="img-input-height" class="block text-xs font-mono text-slate-400">Height (px)</label>
                                    <input id="img-input-height" type="number" min="1" max="10000" placeholder="Height" class="w-full px-3.5 py-2 rounded-xl bg-slate-950/70 text-slate-100 placeholder:text-slate-600 outline-none focus:ring-2 focus:ring-cyan-500/30 text-sm font-mono tabular-nums transition-all">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Bottom Card: Live Resized Preview & Download -->
                <div class="w-full p-6 sm:p-7 rounded-3xl bg-slate-900/40 flex-1 flex flex-col justify-between space-y-6 text-center">
                    <div class="w-full flex items-center justify-between pb-2 text-left">
                        <div class="flex items-center gap-2">
                            <i data-lucide="eye" class="size-4 text-cyan-400"></i>
                            <h4 class="text-xs font-mono font-bold text-white uppercase tracking-wider">Resized Preview</h4>
                        </div>
                        <span id="img-status-badge" class="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800/60 text-slate-400">
                            Waiting for image
                        </span>
                    </div>

                    <!-- Image Display Area -->
                    <div class="relative flex items-center justify-center min-h-[320px] flex-1 w-full">
                        <!-- Empty placeholder -->
                        <div id="img-empty-placeholder" class="flex flex-col items-center justify-center p-8 text-slate-500 gap-3">
                            <div class="size-16 rounded-2xl bg-slate-950/60 flex items-center justify-center text-slate-600">
                                <i data-lucide="image" class="size-8 opacity-40"></i>
                            </div>
                            <p class="text-xs font-sans text-slate-400 max-w-[260px]">Upload or drag an image above to inspect resized output</p>
                        </div>

                        <!-- Actual Preview Container (Full Width & Spacious Height) -->
                        <div id="img-preview-container" class="hidden flex-col items-center justify-center w-full gap-4">
                            <div class="max-h-[500px] w-full overflow-hidden rounded-2xl bg-slate-950/60 p-4 flex items-center justify-center shadow-inner">
                                <img id="img-preview-image" alt="Preview" class="max-h-[440px] max-w-full w-auto object-contain rounded-xl shadow-2xl">
                            </div>
                            <div class="flex items-center gap-4 text-xs font-mono text-slate-400 bg-slate-950/40 px-4 py-2 rounded-xl">
                                <span id="img-preview-dimensions" class="text-slate-300 font-semibold tabular-nums">0 x 0 px</span>
                                <span class="size-1.5 rounded-full bg-slate-700"></span>
                                <span id="img-preview-filesize" class="text-cyan-400 font-bold tabular-nums">0 KB</span>
                            </div>
                        </div>
                    </div>

                    <!-- Action Buttons -->
                    <div class="w-full flex items-center justify-center pt-2">
                        <button id="btn-img-download" type="button" disabled class="w-full btn-press flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl font-mono font-bold text-sm bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:from-cyan-600 disabled:hover:to-blue-600">
                            <i data-lucide="download" class="size-4"></i>
                            <span>DOWNLOAD RESIZED IMAGE</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- ========================================== -->
        <!-- BOTTOM SECTION: PDF STUDIO (FULL WIDTH)    -->
        <!-- ========================================== -->
        <div class="w-full space-y-6 pt-2">
            <!-- Header Card with Mode Switcher -->
            <div class="w-full p-6 rounded-3xl bg-slate-900/40 space-y-5">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div class="flex items-center gap-2.5">
                        <div class="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
                            <i data-lucide="file-text" class="size-5"></i>
                        </div>
                        <div>
                            <h3 class="text-sm font-mono font-bold text-white tracking-wide">PDF Studio</h3>
                            <p class="text-xs text-slate-400 font-sans">Convert images to PDF, extract pages as images, or extract text</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <button id="btn-pdf-clear" type="button" class="btn-press flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800/40 hover:bg-red-500/20 text-slate-400 hover:text-red-400 text-xs font-mono transition-all" title="Reset PDF Studio">
                            <i data-lucide="trash-2" class="size-3.5"></i>
                            <span>Clear</span>
                        </button>
                    </div>
                </div>

                <!-- Mode Switcher Tabs -->
                <div class="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                    <button id="btn-pdf-mode-img2pdf" type="button" class="btn-press shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl font-mono text-xs transition-all bg-cyan-500/20 text-cyan-300 font-bold shadow-[0_0_10px_rgba(6,182,212,0.2)]">
                        <i data-lucide="images" class="size-4"></i>
                        <span>Images to PDF</span>
                    </button>
                    <button id="btn-pdf-mode-pdf2img" type="button" class="btn-press shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl font-mono text-xs transition-all bg-slate-800/40 text-slate-400 hover:bg-slate-800/70 hover:text-slate-200">
                        <i data-lucide="file-image" class="size-4"></i>
                        <span>PDF to Images</span>
                    </button>
                    <button id="btn-pdf-mode-pdf2txt" type="button" class="btn-press shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl font-mono text-xs transition-all bg-slate-800/40 text-slate-400 hover:bg-slate-800/70 hover:text-slate-200">
                        <i data-lucide="file-code" class="size-4"></i>
                        <span>PDF to Text</span>
                    </button>
                </div>
            </div>

            <!-- MODE 1: IMAGES TO PDF -->
            <div id="pdf-section-img2pdf" class="space-y-4">
                <!-- Drop Zone & Settings Card -->
                <div class="w-full p-6 rounded-3xl bg-slate-900/40 space-y-5">
                    <!-- Drop Zone -->
                    <div id="pdf-img-drop-zone" class="p-8 rounded-2xl bg-slate-950/70 hover:bg-slate-950/90 cursor-pointer flex flex-col items-center justify-center text-center gap-3 transition-all group">
                        <input id="pdf-img-file-input" type="file" accept="image/png, image/jpeg, image/webp, image/bmp, image/svg+xml" multiple class="hidden">
                        <div class="size-14 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <i data-lucide="upload-cloud" class="size-7"></i>
                        </div>
                        <div>
                            <p class="text-sm font-mono font-medium text-slate-200">Click to browse or drag & drop multiple images</p>
                            <p class="text-xs text-slate-500 mt-1">Supports JPG, PNG, WEBP, BMP, SVG (Batch upload supported)</p>
                        </div>
                    </div>

                    <!-- PDF Settings -->
                    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-1">
                        <!-- Page Size -->
                        <div class="space-y-1.5">
                            <label for="pdf-setting-size" class="block text-xs font-mono text-slate-400">Page Format</label>
                            <select id="pdf-setting-size" class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 text-slate-200 outline-none focus:ring-2 focus:ring-cyan-500/30 text-xs font-mono transition-all cursor-pointer">
                                <option value="a4">A4 (Standard 210 × 297 mm)</option>
                                <option value="fit">Fit to Image Size</option>
                                <option value="letter">US Letter (8.5 × 11 in)</option>
                            </select>
                        </div>

                        <!-- Orientation -->
                        <div class="space-y-1.5">
                            <label for="pdf-setting-orientation" class="block text-xs font-mono text-slate-400">Orientation</label>
                            <select id="pdf-setting-orientation" class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 text-slate-200 outline-none focus:ring-2 focus:ring-cyan-500/30 text-xs font-mono transition-all cursor-pointer">
                                <option value="auto">Auto (Match Image Ratio)</option>
                                <option value="p">Portrait (Vertical)</option>
                                <option value="l">Landscape (Horizontal)</option>
                            </select>
                        </div>

                        <!-- Margin -->
                        <div class="space-y-1.5">
                            <label for="pdf-setting-margin" class="block text-xs font-mono text-slate-400">Page Margins</label>
                            <select id="pdf-setting-margin" class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 text-slate-200 outline-none focus:ring-2 focus:ring-cyan-500/30 text-xs font-mono transition-all cursor-pointer">
                                <option value="0">None (0 mm - Full Bleed)</option>
                                <option value="10">Small (10 mm)</option>
                                <option value="20">Normal (20 mm)</option>
                            </select>
                        </div>

                        <!-- Quality -->
                        <div class="space-y-1.5">
                            <label for="pdf-setting-quality" class="block text-xs font-mono text-slate-400">Image Quality</label>
                            <select id="pdf-setting-quality" class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 text-slate-200 outline-none focus:ring-2 focus:ring-cyan-500/30 text-xs font-mono transition-all cursor-pointer">
                                <option value="1.0">Original (Best Quality)</option>
                                <option value="0.85">Balanced (Recommended)</option>
                                <option value="0.65">Compact (Smaller PDF Size)</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- 2-Column Split for Mode 1: Queue (5 cols) + Preview (7 cols) -->
                <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full items-stretch">
                    <!-- Left: Image Queue & Page Order (lg:col-span-5) -->
                    <div class="lg:col-span-5 w-full p-6 sm:p-7 rounded-3xl bg-slate-900/40 flex flex-col justify-start gap-4 h-full">
                        <div class="w-full flex items-center justify-between pb-1 text-left">
                            <div class="flex items-center gap-2">
                                <i data-lucide="layers" class="size-4 text-cyan-400"></i>
                                <h4 class="text-xs font-mono font-bold text-white uppercase tracking-wider">Page Order & Queue</h4>
                            </div>
                            <div class="flex items-center gap-2">
                                <span class="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono text-slate-500">
                                    <i data-lucide="grip-vertical" class="size-3 text-slate-500"></i>
                                    <span>Drag 6 dots or hold card to reorder</span>
                                </span>
                                <span id="pdf-img-count-badge" class="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800/60 text-slate-400 tabular-nums">
                                    0 images selected
                                </span>
                            </div>
                        </div>

                        <!-- Empty Placeholder -->
                        <div id="pdf-img-empty-placeholder" class="h-[510px] w-full rounded-2xl bg-slate-950/60 flex flex-col items-center justify-center p-10 text-slate-500 gap-3">
                            <div class="size-16 rounded-2xl bg-slate-900 flex items-center justify-center text-slate-600">
                                <i data-lucide="images" class="size-8 opacity-40"></i>
                            </div>
                            <p class="text-xs font-sans text-slate-400 max-w-[280px] text-center">Add one or more images above to organize pages and preview your PDF</p>
                        </div>

                        <!-- Images List Mount (Fixed Height Stable Viewport) -->
                        <div id="pdf-img-list-mount" class="hidden flex-col gap-3 w-full h-[510px] overflow-y-auto pr-1 min-h-0 auto-hide-scrollbar"></div>
                    </div>

                    <!-- Right: Live PDF Document Preview Card (lg:col-span-7) -->
                    <div class="lg:col-span-7 w-full p-6 sm:p-7 rounded-3xl bg-slate-900/40 flex flex-col justify-between space-y-6 text-center h-full">
                        <div class="w-full flex items-center justify-between pb-1 text-left">
                            <div class="flex items-center gap-2">
                                <i data-lucide="eye" class="size-4 text-cyan-400"></i>
                                <h4 class="text-xs font-mono font-bold text-white uppercase tracking-wider">PDF Document Preview</h4>
                            </div>
                            <div class="flex items-center gap-2">
                                <!-- Page Navigator -->
                                <div id="pdf-preview-nav" class="hidden items-center gap-1.5 bg-slate-950/80 px-2 py-1 rounded-xl">
                                    <button id="btn-pdf-prev-page" type="button" class="size-7 rounded-lg flex items-center justify-center hover:bg-slate-800 text-slate-400 hover:text-white transition-all disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer" title="Previous Page">
                                        <i data-lucide="chevron-left" class="size-4"></i>
                                    </button>
                                    <span id="pdf-preview-page-indicator" class="text-xs font-mono font-bold text-cyan-300 tabular-nums px-2">
                                        Page 1 / 1
                                    </span>
                                    <button id="btn-pdf-next-page" type="button" class="size-7 rounded-lg flex items-center justify-center hover:bg-slate-800 text-slate-400 hover:text-white transition-all disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer" title="Next Page">
                                        <i data-lucide="chevron-right" class="size-4"></i>
                                    </button>
                                </div>
                                <span id="pdf-preview-status-badge" class="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800/60 text-slate-400">
                                    Waiting for images
                                </span>
                            </div>
                        </div>

                        <!-- PDF Preview Display Area (Fixed Height Viewport to Prevent Layout Shift) -->
                        <div class="relative flex flex-col items-center justify-center w-full min-h-[510px]">
                            <!-- Empty Placeholder -->
                            <div id="pdf-preview-empty-placeholder" class="h-[510px] w-full rounded-2xl bg-slate-950/60 flex flex-col items-center justify-center p-12 text-slate-500 gap-3">
                                <div class="size-20 rounded-2xl bg-slate-900 flex items-center justify-center text-slate-600">
                                    <i data-lucide="file-search" class="size-10 opacity-40"></i>
                                </div>
                                <p class="text-xs font-sans text-slate-400 max-w-[280px]">Assembled PDF document preview will appear here in real time</p>
                            </div>

                            <!-- Active PDF Page Canvas Mount -->
                            <div id="pdf-preview-active-container" class="hidden flex-col items-center justify-center w-full gap-3.5">
                                <div class="h-[460px] w-full rounded-2xl bg-slate-950/80 p-4 sm:p-6 flex items-center justify-center shadow-2xl overflow-hidden">
                                    <canvas id="pdf-preview-canvas" class="max-h-[420px] max-w-full w-auto h-auto object-contain rounded-lg shadow-[0_0_30px_rgba(0,0,0,0.85)] cursor-zoom-in transition-all duration-200"></canvas>
                                </div>
                                <!-- Meta stats -->
                                <div class="flex items-center gap-4 text-xs font-mono text-slate-400 bg-slate-950/40 px-4 py-2 rounded-xl">
                                    <span id="pdf-preview-dimensions" class="text-slate-300 font-semibold tabular-nums">A4 Portrait</span>
                                    <span class="size-1.5 rounded-full bg-slate-700"></span>
                                    <span id="pdf-preview-page-count" class="text-cyan-400 font-bold tabular-nums">Page 1 of 1</span>
                                </div>
                            </div>
                        </div>

                        <!-- Action Buttons -->
                        <div class="w-full flex flex-col sm:flex-row items-center gap-3 pt-1">
                            <button id="btn-pdf-fullscreen-preview" type="button" disabled class="w-full sm:w-auto btn-press flex items-center justify-center gap-2 py-3.5 px-5 rounded-xl font-mono text-xs text-slate-300 hover:text-white bg-slate-800/40 hover:bg-slate-800/80 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                                <i data-lucide="maximize-2" class="size-4"></i>
                                <span>Fullscreen Preview</span>
                            </button>
                            <button id="btn-pdf-generate" type="button" disabled class="w-full sm:flex-1 btn-press flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl font-mono font-bold text-sm bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:from-cyan-600 disabled:hover:to-blue-600">
                                <i data-lucide="file-down" class="size-4"></i>
                                <span>DOWNLOAD PDF</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- MODE 2: PDF TO IMAGES -->
            <div id="pdf-section-pdf2img" class="hidden space-y-4">
                <!-- Upload & Options Card -->
                <div class="w-full p-6 rounded-3xl bg-slate-900/40 space-y-5">
                    <!-- PDF Drop Zone -->
                    <div id="pdf-file-drop-zone" class="p-8 rounded-2xl bg-slate-950/70 hover:bg-slate-950/90 cursor-pointer flex flex-col items-center justify-center text-center gap-3 transition-all group">
                        <input id="pdf-file-input" type="file" accept="application/pdf" class="hidden">
                        <div class="size-14 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <i data-lucide="file-up" class="size-7"></i>
                        </div>
                        <div>
                            <p class="text-sm font-mono font-medium text-slate-200">Click to browse or drag & drop a PDF document</p>
                            <p class="text-xs text-slate-500 mt-1">Extracts each page as a high-resolution PNG or JPG image</p>
                        </div>
                    </div>

                    <!-- PDF Loaded Info Bar -->
                    <div id="pdf-doc-info-bar" class="hidden p-4 rounded-2xl bg-slate-950/50 flex flex-wrap items-center justify-between text-xs font-mono gap-3">
                        <div class="flex items-center gap-2 text-slate-300 truncate max-w-xs sm:max-w-md">
                            <i data-lucide="file-text" class="size-4 text-cyan-400 shrink-0"></i>
                            <span id="pdf-doc-name" class="truncate font-semibold">document.pdf</span>
                        </div>
                        <div class="flex items-center gap-3 text-slate-400 text-xs">
                            <span id="pdf-doc-pages" class="tabular-nums">0 pages</span>
                            <span class="size-1 rounded-full bg-slate-700"></span>
                            <span id="pdf-doc-size" class="tabular-nums text-cyan-400 font-bold">0 KB</span>
                        </div>
                    </div>

                    <!-- Conversion Settings -->
                    <div id="pdf-doc-controls" class="hidden grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                        <div class="space-y-1.5">
                            <label for="pdf-extract-format" class="block text-xs font-mono text-slate-400">Export Image Format</label>
                            <select id="pdf-extract-format" class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 text-slate-200 outline-none focus:ring-2 focus:ring-cyan-500/30 text-xs font-mono transition-all cursor-pointer">
                                <option value="image/png">PNG (Lossless & Crisp)</option>
                                <option value="image/jpeg">JPG (Compressed & Small)</option>
                            </select>
                        </div>
                        <div class="space-y-1.5">
                            <label for="pdf-extract-scale" class="block text-xs font-mono text-slate-400">Resolution / DPI</label>
                            <select id="pdf-extract-scale" class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 text-slate-200 outline-none focus:ring-2 focus:ring-cyan-500/30 text-xs font-mono transition-all cursor-pointer">
                                <option value="1.5">Standard (1.5x / ~150 DPI - Fast)</option>
                                <option value="2.0">High-Res (2.0x / ~300 DPI - Sharp)</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- Rendered Pages Grid Card -->
                <div class="w-full p-6 sm:p-8 rounded-3xl bg-slate-900/40 flex flex-col space-y-6">
                    <div class="w-full flex items-center justify-between pb-1 text-left">
                        <div class="flex items-center gap-2">
                            <i data-lucide="layout-grid" class="size-4 text-cyan-400"></i>
                            <h4 class="text-xs font-mono font-bold text-white uppercase tracking-wider">Rendered Pages</h4>
                        </div>
                        <span id="pdf-pages-status-badge" class="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800/60 text-slate-400">
                            Waiting for PDF
                        </span>
                    </div>

                    <!-- Empty Placeholder -->
                    <div id="pdf-pages-empty-placeholder" class="flex flex-col items-center justify-center p-12 text-slate-500 gap-3">
                        <div class="size-20 rounded-2xl bg-slate-950/60 flex items-center justify-center text-slate-600">
                            <i data-lucide="file-image" class="size-10 opacity-40"></i>
                        </div>
                        <p class="text-xs font-sans text-slate-400 max-w-[280px] text-center">Upload a PDF above to preview and download pages as images</p>
                    </div>

                    <!-- Pages Grid Mount -->
                    <div id="pdf-pages-grid-mount" class="hidden grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full max-h-[600px] overflow-y-auto pr-1 auto-hide-scrollbar"></div>

                    <!-- Batch Action Buttons -->
                    <div class="w-full flex justify-center pt-2">
                        <button id="btn-pdf-download-zip" type="button" disabled class="w-full max-w-md btn-press flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl font-mono font-bold text-sm bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:from-cyan-600 disabled:hover:to-blue-600">
                            <i data-lucide="archive" class="size-4"></i>
                            <span>DOWNLOAD ALL PAGES (ZIP)</span>
                        </button>
                    </div>
                </div>
            </div>

            <!-- MODE 3: PDF TO TEXT -->
            <div id="pdf-section-pdf2txt" class="hidden space-y-4">
                <!-- Upload Card -->
                <div class="w-full p-6 rounded-3xl bg-slate-900/40 space-y-5">
                    <!-- Drop Zone -->
                    <div id="pdf-txt-drop-zone" class="p-8 rounded-2xl bg-slate-950/70 hover:bg-slate-950/90 cursor-pointer flex flex-col items-center justify-center text-center gap-3 transition-all group">
                        <input id="pdf-txt-file-input" type="file" accept="application/pdf" class="hidden">
                        <div class="size-14 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <i data-lucide="file-search" class="size-7"></i>
                        </div>
                        <div>
                            <p class="text-sm font-mono font-medium text-slate-200">Click to browse or drag & drop a PDF to extract text</p>
                            <p class="text-xs text-slate-500 mt-1">Extracts clean text content from all document pages</p>
                        </div>
                    </div>
                </div>

                <!-- Text Output Card -->
                <div class="w-full p-6 sm:p-8 rounded-3xl bg-slate-900/40 flex flex-col space-y-4">
                    <div class="w-full flex items-center justify-between pb-1 text-left">
                        <div class="flex items-center gap-2">
                            <i data-lucide="align-left" class="size-4 text-cyan-400"></i>
                            <h4 class="text-xs font-mono font-bold text-white uppercase tracking-wider">Extracted Text</h4>
                        </div>
                        <div class="flex items-center gap-3 text-[11px] font-mono text-slate-400">
                            <span id="pdf-txt-char-count" class="tabular-nums">0 characters</span>
                            <span class="size-1 rounded-full bg-slate-700"></span>
                            <span id="pdf-txt-word-count" class="tabular-nums">0 words</span>
                        </div>
                    </div>

                    <!-- Text Area -->
                    <textarea id="pdf-extracted-textarea" rows="12" placeholder="Extracted text from PDF will appear here..." class="w-full px-4 py-3 rounded-2xl bg-slate-950/70 text-slate-100 placeholder:text-slate-600 outline-none focus:bg-slate-950 focus:ring-2 focus:ring-cyan-500/30 text-xs sm:text-sm font-mono leading-relaxed transition-all resize-y select-text"></textarea>

                    <!-- Action Buttons -->
                    <div class="w-full flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
                        <button id="btn-pdf-copy-txt" type="button" disabled class="w-full sm:w-auto btn-press flex items-center justify-center gap-2 py-3 px-5 rounded-xl font-mono text-xs text-slate-300 hover:text-white bg-slate-800/40 hover:bg-slate-800/80 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                            <i data-lucide="copy" class="size-3.5"></i>
                            <span>Copy Text</span>
                        </button>
                        <button id="btn-pdf-download-txt" type="button" disabled class="w-full sm:w-auto btn-press flex items-center justify-center gap-2 py-3 px-5 rounded-xl font-mono text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-500/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                            <i data-lucide="download" class="size-3.5"></i>
                            <span>Download as .txt</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
`;
