/**
 * shareView.js - Share Files Component Template
 */
export const shareViewHtml = `
    <div id="share-panel" class="hidden flex-col gap-6 animate-fade-in pb-10">
        <!-- Header section with connection status -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
                <h2 class="text-2xl font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 flex items-center gap-2.5">
                    <i data-lucide="share-2" class="w-6 h-6 text-cyan-400"></i>
                    Share Files Center
                </h2>
            </div>
            
            <div class="flex items-center gap-3">
                <div id="sync-status" class="px-3.5 py-1.5 rounded-full text-xs font-mono font-bold flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-400">
                    <span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                    <span id="sync-status-text">STANDALONE MODE</span>
                </div>
            </div>
        </div>

        <!-- Main grid: Left: upload & write; Right: list of items -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:items-start">
            <!-- Left panel: Input Area -->
            <div id="share-left-col" class="lg:col-span-5 space-y-6">
                <!-- Text / Link sharing -->
                <div class="glass-panel p-6 rounded-2xl border border-slate-800/80 bg-slate-900/40">
                    <h3 class="text-sm font-mono font-bold text-white mb-4 flex items-center gap-2">
                        <i data-lucide="message-square" class="w-4 h-4 text-cyan-400"></i>
                        Text & Links
                    </h3>
                    <div class="space-y-3">
                        <input id="share-text-title" type="text" placeholder="Title / Label (optional)" class="w-full px-3 py-2 rounded-xl text-slate-200 bg-slate-950/60 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none text-xs font-mono transition-all placeholder:text-slate-600">
                        <textarea id="share-text-input" placeholder="Type text, link, or note here to share..." class="w-full h-28 px-3 py-2 rounded-xl text-slate-200 bg-slate-950/60 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none resize-none text-sm transition-all" style="font-family: inherit;"></textarea>
                        <button id="btn-share-text" class="w-full btn-press flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono font-bold py-2.5 rounded-xl border border-cyan-400/30 shadow-lg shadow-cyan-500/10">
                            <i data-lucide="send" class="w-4 h-4"></i>
                            <span>SEND TEXT</span>
                        </button>
                    </div>
                </div>

                <!-- File sharing dropzone -->
                <div class="glass-panel p-6 rounded-2xl border border-slate-800/80 bg-slate-900/40">
                    <h3 class="text-sm font-mono font-bold text-white mb-4 flex items-center gap-2">
                        <i data-lucide="upload" class="w-4 h-4 text-cyan-400"></i>
                        Upload Files
                    </h3>
                    <div class="space-y-3">
                        <input id="share-file-title" type="text" placeholder="Custom file title / label (optional)" class="w-full px-3 py-2 rounded-xl text-slate-200 bg-slate-950/60 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none text-xs font-mono transition-all placeholder:text-slate-600">
                        <div id="file-dropzone" class="border-2 border-dashed border-slate-850 hover:border-cyan-500/50 bg-slate-950/40 hover:bg-slate-900/30 rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[140px] group">
                            <input type="file" id="share-file-input" class="hidden" multiple>
                            <div class="w-11 h-11 rounded-full bg-slate-900/50 border border-slate-800 flex items-center justify-center text-slate-500 group-hover:text-cyan-400 group-hover:border-cyan-500/30 transition-all mb-2.5">
                                <i data-lucide="file-plus" class="w-5 h-5"></i>
                            </div>
                            <p class="text-xs font-bold text-slate-300">Drag & drop files here or click to select</p>
                        </div>
                    </div>

                    <!-- Local Storage quota indicator -->
                    <div id="local-storage-indicator" class="mt-4 p-3 bg-slate-950/60 rounded-xl border border-slate-800/60 flex flex-col gap-2 hidden">
                        <div class="flex items-center justify-between text-xs">
                            <span class="text-slate-400 flex items-center gap-1.5 font-mono">
                                <i data-lucide="hard-drive" class="w-3.5 h-3.5 text-cyan-400"></i>
                                Browser Storage
                            </span>
                            <span id="storage-usage-text" class="text-slate-400 font-mono text-[10px]">Calculating...</span>
                        </div>
                        <div class="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                            <div id="storage-usage-bar" class="bg-gradient-to-r from-cyan-500 to-blue-500 h-1.5 rounded-full transition-all duration-500" style="width: 0%"></div>
                        </div>
                    </div>

                    <!-- Cloud Storage quota indicator (Supabase) -->
                    <div id="cloud-storage-indicator" class="mt-4 p-3 bg-slate-950/60 rounded-xl border border-slate-800/60 flex flex-col gap-2 hidden">
                        <div class="flex items-center justify-between text-xs">
                            <span class="text-slate-400 flex items-center gap-1.5 font-mono">
                                <i data-lucide="cloud" class="w-3.5 h-3.5 text-emerald-400"></i>
                                Cloud Storage (1 GB)
                            </span>
                            <span id="cloud-usage-text" class="text-slate-400 font-mono text-[10px]">Calculating...</span>
                        </div>
                        <div class="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                            <div id="cloud-usage-bar" class="bg-gradient-to-r from-emerald-500 to-teal-500 h-1.5 rounded-full transition-all duration-500" style="width: 0%"></div>
                        </div>
                    </div>
                </div>

                <!-- QR Code Device Sharing Panel -->
                <div id="qr-sharing-card" class="glass-panel p-6 rounded-2xl border border-slate-800/80 bg-slate-900/40 flex flex-col items-center text-center">
                    <h3 class="text-sm font-mono font-bold text-white mb-3 self-start flex items-center gap-2">
                        <i data-lucide="qr-code" class="w-4 h-4 text-cyan-400"></i>
                        Connect Device
                    </h3>
                    
                    <div class="p-4 bg-white rounded-xl shadow-lg relative group">
                        <div id="qrcode" class="w-[140px] h-[140px] flex items-center justify-center">
                            <span class="text-xs text-slate-400 font-mono">Generating...</span>
                        </div>
                    </div>
                    <div class="mt-3 text-xs font-mono font-bold text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20 break-all select-all" id="host-url-display">
                        Detecting Host URL...
                    </div>
                </div>
            </div>

            <!-- Right panel: Shared Feed -->
            <div class="lg:col-span-7 flex flex-col">
                <div id="share-right-panel" class="glass-panel p-6 rounded-2xl border border-slate-800/80 bg-slate-900/40 flex flex-col overflow-hidden">

                    <div class="flex items-center justify-between pb-4 border-b border-slate-800/60 mb-3 shrink-0">
                        <div class="flex items-center gap-2.5">
                            <label class="flex items-center gap-1.5 cursor-pointer text-slate-400 hover:text-slate-200 transition select-none" title="Select All Items">
                                <input type="checkbox" id="share-select-all" class="w-4 h-4 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0 focus:ring-offset-0 cursor-pointer accent-cyan-500">
                            </label>
                            <i data-lucide="list" class="w-4 h-4 text-cyan-400"></i>
                            <h3 class="text-sm font-mono font-bold text-white">Shared Items</h3>
                            <span id="share-count-badge" class="ml-1 text-[10px] font-mono font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/25 px-1.5 py-0.5 rounded-full">0</span>
                        </div>
                        <div class="flex items-center gap-3">
                            <button id="btn-delete-selected" class="hidden text-xs text-rose-400 hover:text-rose-300 font-bold transition flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/25 hover:bg-rose-500/20 px-2.5 py-1 rounded-lg">
                                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                                Delete Selected (<span id="share-selected-count">0</span>)
                            </button>
                            <button id="btn-export-backup" class="text-xs text-cyan-400 hover:text-cyan-300 font-bold transition flex items-center gap-1.5">
                                <i data-lucide="download" class="w-3.5 h-3.5"></i>
                                Export
                            </button>
                            <button id="btn-import-backup-trigger" class="text-xs text-blue-400 hover:text-blue-300 font-bold transition flex items-center gap-1.5">
                                <i data-lucide="upload-cloud" class="w-3.5 h-3.5"></i>
                                Import
                            </button>
                            <input type="file" id="import-backup-file" class="hidden" accept=".json">
                            <span class="text-slate-800">|</span>
                            <button id="btn-clear-share" class="text-xs text-red-400 hover:text-red-300 font-bold transition flex items-center gap-1.5">
                                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                                Clear
                            </button>
                        </div>
                    </div>

                    <div id="share-filter-bar" class="flex items-center gap-2 flex-wrap pb-3 mb-3 border-b border-slate-800/50 shrink-0">
                        <button data-filter="all"     class="share-filter-btn active-filter flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold font-mono transition-all border border-cyan-500/40 bg-cyan-500/15 text-cyan-400">
                            <i data-lucide="layout-grid" class="w-3 h-3"></i> All
                        </button>
                        <button data-filter="starred" class="share-filter-btn flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold font-mono transition-all border border-slate-700 bg-slate-800/50 text-slate-400 hover:border-amber-500/40 hover:text-amber-400">
                            <i data-lucide="star" class="w-3 h-3"></i> Starred
                        </button>
                        <button data-filter="text"    class="share-filter-btn flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold font-mono transition-all border border-slate-700 bg-slate-800/50 text-slate-400 hover:border-violet-500/40 hover:text-violet-400">
                            <i data-lucide="type" class="w-3 h-3"></i> Text
                        </button>
                        <button data-filter="link"    class="share-filter-btn flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold font-mono transition-all border border-slate-700 bg-slate-800/50 text-slate-400 hover:border-blue-500/40 hover:text-blue-400">
                            <i data-lucide="link" class="w-3 h-3"></i> Links
                        </button>
                        <button data-filter="image"   class="share-filter-btn flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold font-mono transition-all border border-slate-700 bg-slate-800/50 text-slate-400 hover:border-pink-500/40 hover:text-pink-400">
                            <i data-lucide="image" class="w-3 h-3"></i> Images
                        </button>
                        <button data-filter="docx"    class="share-filter-btn flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold font-mono transition-all border border-slate-700 bg-slate-800/50 text-slate-400 hover:border-blue-400/40 hover:text-blue-400">
                            <i data-lucide="file-text" class="w-3 h-3"></i> DOCX
                        </button>
                        <button data-filter="pdf"     class="share-filter-btn flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold font-mono transition-all border border-slate-700 bg-slate-800/50 text-slate-400 hover:border-red-500/40 hover:text-red-400">
                            <i data-lucide="file-text" class="w-3 h-3"></i> PDF
                        </button>
                        <button data-filter="video"   class="share-filter-btn flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold font-mono transition-all border border-slate-700 bg-slate-800/50 text-slate-400 hover:border-purple-500/40 hover:text-purple-400">
                            <i data-lucide="video" class="w-3 h-3"></i> Video
                        </button>
                        <button data-filter="audio"   class="share-filter-btn flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold font-mono transition-all border border-slate-700 bg-slate-800/50 text-slate-400 hover:border-emerald-500/40 hover:text-emerald-400">
                            <i data-lucide="music" class="w-3 h-3"></i> Audio
                        </button>
                        <button data-filter="file"    class="share-filter-btn flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold font-mono transition-all border border-slate-700 bg-slate-800/50 text-slate-400 hover:border-amber-500/40 hover:text-amber-400">
                            <i data-lucide="file" class="w-3 h-3"></i> Other Files
                        </button>
                        <div class="ml-auto">
                            <input id="share-search" type="text" placeholder="Search..." class="text-xs font-mono bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-300 focus:border-cyan-500 outline-none w-36 placeholder-slate-600 transition">
                        </div>
                    </div>

                    <div id="share-feed" class="flex-1 min-h-0 overflow-y-auto space-y-3 pr-1">
                        <div class="flex flex-col items-center justify-center h-full text-slate-500">
                            <i data-lucide="inbox" class="w-10 h-10 mb-2 stroke-1 animate-bounce"></i>
                            <p class="text-sm">No items shared yet</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
`;
