/**
 * gameView.js - Game Panel View Component Template
 */
export const gameViewHtml = `
    <!-- GAME PANEL -->
    <div id="game-panel" class="hidden flex-1 space-y-6">
        <!-- CYBER PHONK RUNNER GAME -->
        <div class="glass-panel rounded-2xl overflow-hidden border border-purple-500/30 w-full" style="background: linear-gradient(135deg, #0a0015 0%, #0d0020 50%, #080010 100%);">
            <div class="p-4 border-b border-purple-500/20 flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <span class="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></span>
                    <h3 class="font-mono font-bold text-purple-400 tracking-widest text-sm uppercase">⚡ CYBER PHONK RUNNER — Kill Time Protocol</h3>
                </div>
                <div class="flex items-center gap-4">
                    <div class="text-right">
                        <p class="text-[9px] text-slate-400 font-mono font-bold uppercase tracking-widest">HIGH SCORE</p>
                        <p id="game-hi-score" class="text-lg font-mono font-bold text-yellow-300" style="text-shadow: 0 0 10px rgba(253, 224, 71, 0.6);">000000</p>
                    </div>
                    <div class="text-right hidden">
                        <p class="text-[9px] text-slate-400 font-mono font-bold uppercase tracking-widest">SCORE</p>
                        <p id="game-score" class="text-lg font-mono font-bold text-cyan-300" style="text-shadow: 0 0 10px rgba(6, 182, 212, 0.65);">000000</p>
                    </div>
                </div>
            </div>
            <div class="relative flex justify-center" style="background: #04000a;">
                <canvas id="phonkRunnerCanvas" width="1100" height="260"
                    style="image-rendering: pixelated; image-rendering: crisp-edges; cursor: pointer; width: 100%; border: 1px solid rgba(168,85,247,0.3); border-radius: 8px; box-shadow: 0 0 30px rgba(168,85,247,0.2), 0 0 60px rgba(0,200,255,0.1);">
                </canvas>
            </div>
            <div class="px-4 py-3 border-t border-purple-500/20 flex flex-col gap-3">
                <!-- Mobile 2-Handed Landscape Touch Control Buttons -->
                <div id="phonk-mobile-btn-container" class="flex items-center w-full md:hidden">
                    <div class="flex-1 flex justify-center items-center">
                        <button id="btn-game-jump" class="w-32 py-2.5 bg-slate-900/80 backdrop-blur-md border border-purple-500/50 rounded-full text-purple-300 font-mono font-bold text-xs tracking-widest shadow-md hover:bg-purple-950/90 hover:border-purple-400 hover:text-white hover:shadow-[0_0_18px_rgba(192,132,252,0.55)] hover:-translate-y-0.5 active:bg-purple-600 active:text-white active:scale-90 active:translate-y-0 transition-all duration-200 flex items-center justify-center select-none touch-none cursor-pointer">
                            JUMP
                        </button>
                    </div>
                    <div class="flex-1 flex justify-center items-center">
                        <button id="btn-game-slide" class="w-32 py-2.5 bg-slate-900/80 backdrop-blur-md border border-cyan-500/50 rounded-full text-cyan-300 font-mono font-bold text-xs tracking-widest shadow-md hover:bg-cyan-950/90 hover:border-cyan-400 hover:text-white hover:shadow-[0_0_18px_rgba(0,240,255,0.55)] hover:-translate-y-0.5 active:bg-cyan-600 active:text-white active:scale-90 active:translate-y-0 transition-all duration-200 flex items-center justify-center select-none touch-none cursor-pointer">
                            SLIDE
                        </button>
                    </div>
                </div>

                <div class="flex items-center justify-between gap-2">
                    <p class="text-[10px] text-slate-400 font-mono">SPACE / ↑ = JUMP (LEFT TOUCH) &nbsp;|&nbsp; SHIFT / ↓ = SLIDE (RIGHT TOUCH)</p>
                    <div class="flex items-center gap-3">
                        <button id="game-mute-btn" title="Toggle Sound"
                            onclick="window.__phonkToggleMute && window.__phonkToggleMute()"
                            class="text-sm px-2 py-0.5 rounded border border-purple-500/40 text-purple-400 hover:bg-purple-500/10 transition font-mono">🔊</button>
                        <div id="game-level-badge" class="text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-purple-500/40 text-purple-400">LVL 1</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
`;
