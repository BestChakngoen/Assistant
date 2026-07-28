/**
 * strategyView.js - Strategy Lab (Diagram Canvas, Position Calculator & Playbook PDF) Template
 */
export const strategyViewHtml = `
    <div id="strategy-menu-container" class="w-full hidden flex-col gap-6 animate-fade-in pb-10">
        <!-- Diagram Board Panel -->
        <div class="glass-panel p-4 rounded-2xl border-t-4 border-cyan-500 flex flex-col h-[calc(100vh-160px)] min-h-[700px]">
            <div class="flex flex-wrap items-center justify-between gap-4 mb-3 shrink-0">
                <div class="flex items-center gap-2">
                    <span class="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>
                    <h3 class="font-mono font-bold text-lg text-cyan-400">STRATEGY LAB (DIAGRAM)</h3>
                </div>
                <!-- Canvas Controls -->
                <div class="flex items-center gap-2 bg-slate-900/85 p-1 rounded-xl border border-slate-800/80">
                    <button id="diagram-btn-zoom-out" class="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition" title="Zoom Out">
                        <i data-lucide="zoom-out" class="w-4 h-4"></i>
                    </button>
                    <span id="diagram-zoom-percent" class="font-mono text-xs text-slate-300 min-w-[3.5rem] text-center font-bold">100%</span>
                    <button id="diagram-btn-zoom-in" class="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition" title="Zoom In">
                        <i data-lucide="zoom-in" class="w-4 h-4"></i>
                    </button>
                    <div class="w-px h-4 bg-slate-800"></div>
                    <button id="diagram-btn-reset-zoom" class="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition" title="Reset view">
                        <i data-lucide="maximize-2" class="w-4 h-4"></i>
                    </button>
                    <div class="w-px h-4 bg-slate-800"></div>
                    <button id="diagram-btn-undo" class="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition" title="Undo (Ctrl+Z)">
                        <i data-lucide="undo" class="w-4 h-4"></i>
                    </button>
                    <button id="diagram-btn-redo" class="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition" title="Redo (Ctrl+Y)">
                        <i data-lucide="redo" class="w-4 h-4"></i>
                    </button>
                    <div class="w-px h-4 bg-slate-800"></div>
                    <button id="diagram-btn-clear" class="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition" title="Clear board">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                    <div class="w-px h-4 bg-slate-800"></div>
                    <button id="diagram-btn-help" class="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition" title="Shortcuts Info">
                        <i data-lucide="help-circle" class="w-4 h-4"></i>
                    </button>
                </div>
            </div>

            <!-- Toolbar -->
            <div class="flex flex-wrap items-center gap-3 bg-slate-900/40 p-2 rounded-xl border border-slate-800/60 mb-3 shrink-0">
                <div class="flex items-center bg-slate-950 rounded-lg p-0.5 border border-slate-800">
                    <button data-tool="select" class="tool-btn active bg-slate-800 text-cyan-400 p-1.5 rounded-md transition" title="Select / Move (V)">
                        <i data-lucide="mouse-pointer" class="w-4 h-4"></i>
                    </button>
                    <button data-tool="pan" class="tool-btn p-1.5 rounded-md text-slate-400 hover:text-cyan-400 transition" title="Pan (H / Spacebar)">
                        <i data-lucide="hand" class="w-4 h-4"></i>
                    </button>
                    <button data-tool="pencil" class="tool-btn p-1.5 rounded-md text-slate-400 hover:text-cyan-400 transition" title="Pencil (O)">
                        <i data-lucide="pencil" class="w-4 h-4"></i>
                    </button>
                    <button data-tool="line" class="tool-btn p-1.5 rounded-md text-slate-400 hover:text-cyan-400 transition" title="Line (L)">
                        <i data-lucide="minus" class="w-4 h-4"></i>
                    </button>
                    <button data-tool="arrow" class="tool-btn p-1.5 rounded-md text-slate-400 hover:text-cyan-400 transition" title="Connector / Arrow (U)">
                        <i data-lucide="arrow-up-right" class="w-4 h-4"></i>
                    </button>
                    <button data-tool="rect" class="tool-btn p-1.5 rounded-md text-slate-400 hover:text-cyan-400 transition" title="Rectangle (T)">
                        <i data-lucide="square" class="w-4 h-4"></i>
                    </button>
                    <button data-tool="circle" class="tool-btn p-1.5 rounded-md text-slate-400 hover:text-cyan-400 transition" title="Circle (C)">
                        <i data-lucide="circle" class="w-4 h-4"></i>
                    </button>
                    <button data-tool="diamond" class="tool-btn p-1.5 rounded-md text-slate-400 hover:text-cyan-400 transition" title="Decision / Diamond (Y)">
                        <i data-lucide="diamond" class="w-4 h-4"></i>
                    </button>
                    <button data-tool="parallelogram" class="tool-btn p-1.5 rounded-md text-slate-400 hover:text-cyan-400 transition" title="Input-Output / Parallelogram (P)">
                        <i data-lucide="italic" class="w-4 h-4"></i>
                    </button>
                    <button data-tool="text" class="tool-btn p-1.5 rounded-md text-slate-400 hover:text-cyan-400 transition" title="Text (W)">
                        <i data-lucide="type" class="w-4 h-4"></i>
                    </button>
                    <button data-tool="eraser" class="tool-btn p-1.5 rounded-md text-slate-400 hover:text-cyan-400 transition" title="Eraser (E)">
                        <i data-lucide="eraser" class="w-4 h-4"></i>
                    </button>
                </div>

                <!-- Color Palette -->
                <div class="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
                    <button data-color="#22c55e" class="color-btn w-5 h-5 rounded-md bg-green-500 border border-transparent active-color border-cyan-400 scale-110" title="Green"></button>
                    <button data-color="#ef4444" class="color-btn w-5 h-5 rounded-md bg-red-500 border border-transparent" title="Red"></button>
                    <button data-color="#38bdf8" class="color-btn w-5 h-5 rounded-md bg-sky-400 border border-transparent" title="Blue"></button>
                    <button data-color="#eab308" class="color-btn w-5 h-5 rounded-md bg-yellow-500 border border-transparent" title="Yellow"></button>
                    <button data-color="#ec4899" class="color-btn w-5 h-5 rounded-md bg-pink-500 border border-transparent" title="Pink"></button>
                    <button data-color="#ffffff" class="color-btn w-5 h-5 rounded-md bg-white border border-transparent" title="White"></button>
                </div>

                <!-- Stroke width -->
                <div class="flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
                    <span class="text-[9px] font-mono text-slate-500 uppercase font-bold">Stroke</span>
                    <select id="diagram-select-width" class="bg-transparent border-none text-xs text-white font-mono outline-none cursor-pointer">
                        <option value="2">2px</option>
                        <option value="4" selected>4px</option>
                        <option value="6">6px</option>
                        <option value="8">8px</option>
                    </select>
                </div>

                <!-- Fill Shape -->
                <label class="flex items-center gap-1.5 cursor-pointer select-none">
                    <input type="checkbox" id="diagram-toggle-fill" class="w-3.5 h-3.5 rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-cyan-500">
                    <span class="text-[10px] font-mono text-slate-500 uppercase font-bold">Fill Shape</span>
                </label>
            </div>

            <!-- Canvas Container -->
            <div id="canvas-container" class="relative flex-1 bg-slate-950/80 rounded-xl border border-slate-800 overflow-hidden">
                <canvas id="diagram-canvas" class="absolute inset-0 w-full h-full"></canvas>
                <div class="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                <div class="absolute bottom-3 right-3 pointer-events-none text-[10px] font-mono text-slate-400 bg-slate-950/80 px-2 py-1.5 rounded-lg border border-slate-800/80 flex gap-2">
                    <span>Double click to edit/create text</span>
                    <span>•</span>
                    <span>[Del] to delete shape</span>
                </div>
            </div>
        </div>

        <!-- Diagram Shortcuts Modal -->
        <div id="diagram-help-modal" class="hidden fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
            <div class="glass-panel p-6 rounded-3xl shadow-xl max-w-md w-full border border-slate-800">
                <div class="flex justify-between items-center mb-4 border-b border-slate-800 pb-3">
                    <h3 class="text-base font-bold text-cyan-400 font-mono flex items-center gap-2">
                        <i data-lucide="keyboard" class="w-5 h-5 text-cyan-400"></i> คีย์ลัดเครื่องมือ Diagram
                    </h3>
                    <button id="diagram-btn-close-help" class="text-slate-400 hover:text-white transition">
                        <i data-lucide="x" class="w-5 h-5"></i>
                    </button>
                </div>
                <div class="space-y-2.5 max-h-[400px] overflow-y-auto pr-1 text-slate-300 text-xs font-mono">
                    <div class="flex justify-between border-b border-slate-900/50 pb-1.5">
                        <span class="text-slate-400">Select / Move (เลือกจับวัตถุ)</span>
                        <span class="bg-slate-900 px-2 py-0.5 rounded text-cyan-400 font-bold border border-slate-850">V / A</span>
                    </div>
                    <div class="flex justify-between border-b border-slate-900/50 pb-1.5">
                        <span class="text-slate-400">Pan Board (เลื่อนบอร์ด)</span>
                        <span class="bg-slate-900 px-2 py-0.5 rounded text-cyan-400 font-bold border border-slate-850">H / Spacebar</span>
                    </div>
                    <div class="flex justify-between border-b border-slate-900/50 pb-1.5">
                        <span class="text-slate-400">Freehand Pencil (วาดดินสอ)</span>
                        <span class="bg-slate-900 px-2 py-0.5 rounded text-cyan-400 font-bold border border-slate-850">O</span>
                    </div>
                    <div class="flex justify-between border-b border-slate-900/50 pb-1.5">
                        <span class="text-slate-400">Straight Line (เส้นตรง)</span>
                        <span class="bg-slate-900 px-2 py-0.5 rounded text-cyan-400 font-bold border border-slate-850">L</span>
                    </div>
                    <div class="flex justify-between border-b border-slate-900/50 pb-1.5">
                        <span class="text-slate-400">Arrow Connector (เส้นลูกศร)</span>
                        <span class="bg-slate-900 px-2 py-0.5 rounded text-cyan-400 font-bold border border-slate-850">U</span>
                    </div>
                    <div class="flex justify-between border-b border-slate-900/50 pb-1.5">
                        <span class="text-slate-400">Rectangle (สี่เหลี่ยม / Toggle Fill)</span>
                        <span class="bg-slate-900 px-2 py-0.5 rounded text-cyan-400 font-bold border border-slate-850">T</span>
                    </div>
                    <div class="flex justify-between border-b border-slate-900/50 pb-1.5">
                        <span class="text-slate-400">Circle (วงกลม / Toggle Fill)</span>
                        <span class="bg-slate-900 px-2 py-0.5 rounded text-cyan-400 font-bold border border-slate-850">C</span>
                    </div>
                    <div class="flex justify-between border-b border-slate-900/50 pb-1.5">
                        <span class="text-slate-400">Decision Diamond (รูปเพชร / Toggle Fill)</span>
                        <span class="bg-slate-900 px-2 py-0.5 rounded text-cyan-400 font-bold border border-slate-850">Y</span>
                    </div>
                    <div class="flex justify-between border-b border-slate-900/50 pb-1.5">
                        <span class="text-slate-400">Parallelogram (ด้านขนาน / Toggle Fill)</span>
                        <span class="bg-slate-900 px-2 py-0.5 rounded text-cyan-400 font-bold border border-slate-850">P</span>
                    </div>
                    <div class="flex justify-between border-b border-slate-900/50 pb-1.5">
                        <span class="text-slate-400">Text Label (ข้อความ)</span>
                        <span class="bg-slate-900 px-2 py-0.5 rounded text-cyan-400 font-bold border border-slate-850">W</span>
                    </div>
                    <div class="flex justify-between border-b border-slate-900/50 pb-1.5">
                        <span class="text-slate-400">Eraser Tool (ยางลบ)</span>
                        <span class="bg-slate-900 px-2 py-0.5 rounded text-cyan-400 font-bold border border-slate-850">E</span>
                    </div>
                    <div class="flex justify-between border-b border-slate-900/50 pb-1.5">
                        <span class="text-slate-400">Delete Shape (ลบวัตถุที่เลือก)</span>
                        <span class="bg-slate-900 px-2 py-0.5 rounded text-red-400 font-bold border border-slate-850">Del / Backspace</span>
                    </div>
                    <div class="flex justify-between border-b border-slate-900/50 pb-1.5">
                        <span class="text-slate-400">Undo Action (ย้อนกลับ)</span>
                        <span class="bg-slate-900 px-2 py-0.5 rounded text-cyan-400 font-bold border border-slate-850">Ctrl + Z</span>
                    </div>
                    <div class="flex justify-between border-b border-slate-900/50 pb-1.5">
                        <span class="text-slate-400">Redo Action (ทำซ้ำ)</span>
                        <span class="bg-slate-900 px-2 py-0.5 rounded text-cyan-400 font-bold border border-slate-850">Ctrl + Y</span>
                    </div>
                    <div class="flex justify-between border-b border-slate-900/50 pb-1.5">
                        <span class="text-slate-400">Duplicate Shape (ก๊อปปี้คัดลอก)</span>
                        <span class="bg-slate-900 px-2 py-0.5 rounded text-cyan-400 font-bold border border-slate-850">Hold D + Drag</span>
                    </div>
                    <div class="flex justify-between pb-1">
                        <span class="text-slate-400">Edit Text (แก้ไขข้อความ)</span>
                        <span class="bg-slate-900 px-2 py-0.5 rounded text-cyan-400 font-bold border border-slate-850">Double Click</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Position Calculator Sub-Section -->
        <div id="calc-panel" class="w-full mt-6 animate-fade-in pb-6">
            <div class="flex flex-col gap-6">
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                    <!-- LEFT COLUMN: ACCOUNT SETTINGS & BIAS -->
                    <div class="glass-panel p-6 rounded-2xl border-t-4 border-pink-500 flex flex-col justify-between">
                        <div class="flex items-center gap-2 border-b border-slate-800 pb-3 mb-4">
                            <span class="w-2.5 h-2.5 bg-pink-500 rounded-full animate-pulse"></span>
                            <h3 class="font-mono font-bold text-base text-pink-400 tracking-wider">POSITION SIZING</h3>
                        </div>

                        <div class="space-y-4 flex-1 flex flex-col justify-center">
                            <div class="grid grid-cols-3 gap-2">
                                <div>
                                    <label class="block text-[9px] text-slate-500 mb-1 font-bold">BALANCE</label>
                                    <input type="text" id="risk-balance"
                                        class="w-full px-2 py-2 rounded-lg font-mono text-xs text-blue-400 font-bold bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-blue-400/60 text-center"
                                        placeholder="Auto">
                                </div>
                                <div>
                                    <label class="block text-[9px] text-slate-500 mb-1 font-bold">RISK (%)</label>
                                    <input type="number" id="risk-percent" value="2" step="0.5"
                                        class="w-full px-2 py-2 rounded-lg font-mono text-xs text-red-400 font-bold bg-slate-950 border border-slate-900 focus:border-red-500 focus:ring-1 focus:ring-red-500 text-center">
                                </div>
                                <div>
                                    <label class="block text-[9px] text-slate-500 mb-1 font-bold">R:R RATIO</label>
                                    <input type="number" id="risk-rr-ratio" value="2" step="0.5"
                                        class="w-full px-2 py-2 rounded-lg font-mono text-xs text-green-400 font-bold bg-slate-950 border border-slate-900 focus:border-green-500 focus:ring-1 focus:ring-green-500 text-center">
                                </div>
                            </div>

                            <div class="grid grid-cols-4 gap-2 items-end">
                                <div class="col-span-2">
                                    <label class="block text-[9px] text-slate-500 mb-1 font-bold">ASSET</label>
                                    <select id="risk-asset"
                                        class="w-full px-2 py-2 rounded-lg font-mono text-xs text-white bg-slate-950 border border-slate-800">
                                        <option value="BTC" data-size="1">BTC/USD (1 Coin)</option>
                                        <option value="XAU" data-size="100">GOLD (100 Oz)</option>
                                        <option value="EUR" data-size="100000">EUR/USD (100k Unit)</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="block text-[9px] text-slate-500 mb-1 font-bold">LEVERAGE</label>
                                    <input type="number" id="risk-leverage" value="400"
                                        class="w-full px-2 py-2 rounded-lg font-mono text-xs text-center text-slate-300 bg-slate-950 border border-slate-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                                        title="Leverage">
                                </div>
                                <div>
                                    <label class="block text-[9px] text-slate-500 mb-1 font-bold">SPREAD (PTS)</label>
                                    <input type="number" id="risk-spread" value="0" step="0.1" min="0"
                                        class="w-full px-2 py-2 rounded-lg font-mono text-xs text-center text-yellow-500 bg-slate-950 border border-slate-800 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500"
                                        title="Spread in points">
                                </div>
                            </div>

                            <div>
                                <label class="block text-[9px] text-slate-500 mb-1 font-bold">BIAS DIRECTION</label>
                                <div class="flex gap-2">
                                    <label class="flex-1 cursor-pointer group">
                                        <input type="radio" name="risk-side" value="LONG" class="peer hidden" checked>
                                        <div
                                            class="py-2 text-center rounded-lg border border-slate-800 text-slate-500 bg-slate-950 peer-checked:bg-green-600 peer-checked:text-white peer-checked:border-green-500 peer-checked:shadow-[0_0_10px_rgba(22,163,74,0.3)] transition-all font-mono font-bold text-xs flex items-center justify-center gap-2">
                                            <span class="w-1.5 h-1.5 rounded-full bg-green-400 group-hover:animate-pulse"></span>
                                            LONG / BUY
                                        </div>
                                    </label>
                                    <label class="flex-1 cursor-pointer group">
                                        <input type="radio" name="risk-side" value="SHORT" class="peer hidden">
                                        <div
                                            class="py-2 text-center rounded-lg border border-slate-800 text-slate-500 bg-slate-950 peer-checked:bg-red-600 peer-checked:text-white peer-checked:border-red-500 peer-checked:shadow-[0_0_10px_rgba(220,38,38,0.3)] transition-all font-mono font-bold text-xs flex items-center justify-center gap-2">
                                            <span class="w-1.5 h-1.5 rounded-full bg-red-400 group-hover:animate-pulse"></span>
                                            SHORT / SELL
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- RIGHT COLUMN: TARGET PRICE SETTINGS (ENTRY, SL, TP) -->
                    <div class="glass-panel p-6 rounded-2xl border-t-4 border-pink-500 flex flex-col justify-between">
                        <div class="flex items-center gap-2 border-b border-slate-800 pb-3 mb-4">
                            <span class="w-2.5 h-2.5 bg-pink-500 rounded-full animate-pulse"></span>
                            <h3 class="font-mono font-bold text-base text-pink-400 tracking-wider">ENTRY & TARGETS</h3>
                        </div>

                        <div class="space-y-4 flex-1 flex flex-col justify-center">
                            <div>
                                <label class="block text-[9px] text-slate-500 mb-1 font-bold">ENTRY PRICE</label>
                                <input type="text" id="risk-entry" placeholder="Entry"
                                    class="w-full px-3 py-2.5 rounded-lg font-mono text-sm font-bold text-center text-blue-300 border border-blue-900/50 bg-slate-950 focus:border-blue-400 focus:ring-1 focus:ring-blue-400">
                            </div>
                            <div class="grid grid-cols-2 gap-2">
                                <div>
                                    <label class="block text-[9px] text-slate-500 mb-1 font-bold">STOP LOSS (SL)</label>
                                    <input type="text" id="risk-sl" placeholder="SL"
                                        class="w-full px-3 py-2.5 rounded-lg font-mono text-sm font-bold text-center text-red-300 border border-red-900/50 bg-slate-950 focus:border-red-400 focus:ring-1 focus:ring-red-400">
                                </div>
                                <div>
                                    <label class="block text-[9px] text-slate-500 mb-1 font-bold">TAKE PROFIT (TP)</label>
                                    <input type="text" id="risk-tp" placeholder="TP"
                                        class="w-full px-3 py-2.5 rounded-lg font-mono text-sm font-bold text-center text-green-300 border border-green-900/50 bg-slate-950 focus:border-green-400 focus:ring-1 focus:ring-green-400">
                                </div>
                            </div>
                            <div class="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-900">
                                <div class="text-[10px] font-mono text-slate-500">
                                    SL Distance: <span id="dist-sl-val" class="font-bold text-red-400">-</span>
                                </div>
                                <div class="text-[10px] font-mono text-slate-500">
                                    TP Distance: <span id="dist-tp-val" class="font-bold text-emerald-400">-</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- BOTTOM ROW: RESULTS & METRICS -->
                <div class="w-full">
                    <div class="glass-panel p-6 rounded-2xl border-t-4 border-pink-500 flex flex-col justify-between relative overflow-hidden bg-slate-950/20">
                        <div>
                            <div class="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
                                <span class="text-xs text-slate-400 font-mono font-bold tracking-wider">CALCULATION RESULTS</span>
                                <span class="text-[9px] bg-pink-500/20 text-pink-400 font-mono font-bold px-2 py-0.5 rounded border border-pink-500/20">RISK CONTROL ACTIVE</span>
                            </div>
                            
                            <div class="grid grid-cols-1 md:grid-cols-4 gap-6 py-4">
                                <div class="glass-panel p-5 rounded-xl border-l-4 border-pink-500 bg-slate-950/40">
                                    <p class="text-[10px] text-slate-500 uppercase tracking-widest mb-1 font-bold">Recommended Position</p>
                                    <div class="flex items-baseline gap-2">
                                        <h2 id="res-lot" class="text-3xl font-mono font-bold text-pink-400">0.00</h2>
                                        <span class="text-xs text-slate-500 font-mono">LOTS</span>
                                    </div>
                                </div>

                                <div class="glass-panel p-5 rounded-xl border-l-4 border-blue-500 bg-slate-950/40">
                                    <p class="text-[10px] text-slate-500 uppercase tracking-widest mb-1 font-bold">Margin Required</p>
                                    <h2 id="res-margin" class="text-3xl font-mono font-bold text-blue-400">$0.00</h2>
                                    <span class="text-[10px] text-slate-500 font-mono">Capital Allocated</span>
                                </div>

                                <div class="glass-panel p-5 rounded-xl border-l-4 border-red-500 bg-slate-950/40">
                                    <p class="text-[10px] text-slate-500 uppercase tracking-widest mb-1 font-bold">Risk Amount</p>
                                    <h2 id="res-risk-amt" class="text-3xl font-mono font-bold text-red-400">$0.00</h2>
                                    <span class="text-[10px] text-slate-500 font-mono">Loss if SL hit</span>
                                </div>

                                <div class="glass-panel p-5 rounded-xl border-l-4 border-emerald-400 bg-slate-950/40">
                                    <p class="text-[10px] text-slate-500 uppercase tracking-widest mb-1 font-bold">Reward Amount</p>
                                    <h2 id="res-reward-amt" class="text-3xl font-mono font-bold text-emerald-400">$0.00</h2>
                                    <span class="text-[10px] text-slate-500 font-mono">Profit if TP hit</span>
                                </div>
                            </div>
                        </div>

                        <div class="mt-4 pt-4 border-t border-slate-800 text-xs text-slate-500 font-mono leading-relaxed flex justify-end items-center">
                            <div class="flex items-center gap-2">
                                <span class="text-[10px] text-slate-500">ACTUAL R:R:</span>
                                <span id="res-rr" class="font-bold text-sm text-yellow-400 font-mono">1 : 2.00</span>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>

        <!-- Trading Sessions Panel (Bottom) -->
        <div class="glass-panel p-6 rounded-2xl border-t-4 border-amber-500">
            <div class="flex items-center justify-between mb-4">
                <div class="flex items-center gap-2">
                    <span class="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></span>
                    <h3 class="font-mono font-bold text-lg text-amber-400">TRADING SESSIONS (TH)</h3>
                </div>
                <div class="flex items-center gap-2 text-xs font-mono text-slate-400">
                    <span>Local Time (Thai):</span>
                    <span id="session-local-time" class="text-cyan-400 font-bold text-sm">--:--:--</span>
                </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div class="p-4 rounded-xl bg-slate-900/40 border border-slate-800 flex justify-between items-center">
                    <div>
                        <h4 class="font-bold text-sm text-slate-300">Tokyo Session (Asia)</h4>
                        <p class="text-[10px] text-slate-500">07:00 - 15:00 (เวลาไทย)</p>
                    </div>
                    <span id="session-tokyo" class="text-xs font-mono font-bold px-2 py-1 rounded bg-slate-800/80 text-slate-500 border border-slate-800">CLOSED</span>
                </div>
                <div class="p-4 rounded-xl bg-slate-900/40 border border-slate-800 flex justify-between items-center">
                    <div>
                        <h4 class="font-bold text-sm text-slate-300">London Session (Europe)</h4>
                        <p class="text-[10px] text-slate-500">14:00 - 22:00 (เวลาไทย)</p>
                    </div>
                    <span id="session-london" class="text-xs font-mono font-bold px-2 py-1 rounded bg-slate-800/80 text-slate-500 border border-slate-800">CLOSED</span>
                </div>
                <div class="p-4 rounded-xl bg-slate-900/40 border border-slate-800 flex justify-between items-center">
                    <div>
                        <h4 class="font-bold text-sm text-slate-300">New York Session (US)</h4>
                        <p class="text-[10px] text-slate-500">19:00 - 03:00 (เวลาไทย)</p>
                    </div>
                    <span id="session-ny" class="text-xs font-mono font-bold px-2 py-1 rounded bg-slate-800/80 text-slate-500 border border-slate-800">CLOSED</span>
                </div>
            </div>
        </div>

        <!-- PDF Viewer Panel -->
        <div class="glass-panel p-4 rounded-2xl border-t-4 border-cyan-500 mt-6 flex flex-col">
            <div class="flex flex-wrap items-center justify-between gap-4 mb-3">
                <div class="flex items-center gap-2">
                    <i data-lucide="file-text" class="w-5 h-5 text-cyan-400"></i>
                    <h3 class="font-mono font-bold text-lg text-cyan-400">STRATEGY PLAYBOOK (PDF)</h3>
                </div>
                <div class="flex items-center gap-2 flex-1 max-w-md justify-end">
                    <input type="text" id="pdf-firebase-url" 
                        class="px-3 py-1.5 rounded-lg font-mono text-xs text-cyan-400 bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 placeholder:text-slate-600 text-left w-full"
                        placeholder="e.g. assets/financial_bible.pdf or external direct URL...">
                    <button id="pdf-btn-save" class="px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 hover:text-white border border-cyan-500/30 transition text-xs font-mono font-bold shrink-0">
                        SAVE
                    </button>
                </div>
            </div>

            <div id="pdf-frame-container" class="relative bg-slate-950/80 rounded-xl border border-slate-800 overflow-hidden h-[calc(100vh-120px)] min-h-[850px] flex items-center justify-center">
                <iframe id="pdf-viewer-iframe" class="w-full h-full border-none hidden" src=""></iframe>
                <div id="pdf-placeholder" class="text-center p-6 flex flex-col items-center gap-3">
                    <i data-lucide="file-warning" class="w-12 h-12 text-slate-500"></i>
                    <p class="font-mono text-xs text-slate-400">No PDF configured. Paste your hosted PDF URL or local file path (e.g., assets/financial_bible.pdf) above to view it.</p>
                </div>
            </div>
        </div>
    </div>
`;
