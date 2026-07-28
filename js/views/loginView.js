/**
 * loginView.js - Login Screen & Identity Verification Template
 */
export const loginViewHtml = `
    <div id="login-screen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-[#0b1121] bg-opacity-95 backdrop-blur-sm">
        <div
            class="glass-panel p-8 rounded-2xl max-w-md w-full text-center border border-cyan-500/30 relative overflow-hidden">
            <div
                class="absolute inset-0 pointer-events-none opacity-20 bg-gradient-to-b from-transparent via-cyan-500 to-transparent h-[20%] w-full animate-scan">
            </div>

            <h1
                class="text-4xl font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 neon-text mb-2">
                SYSTEM ACCESS
            </h1>
            <p class="text-slate-400 text-sm tracking-[0.2em] mb-8 uppercase">Identity Verification Required</p>

            <div class="space-y-4">
                <button id="btn-login"
                    class="w-full btn-press group relative flex items-center justify-center gap-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 hover:border-cyan-400 text-white py-4 rounded-xl transition-all shadow-lg hover:shadow-cyan-500/20">
                    <svg class="w-6 h-6" viewBox="0 0 24 24">
                        <path fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    <span class="font-mono font-bold tracking-wider group-hover:text-cyan-400">LOGIN WITH GOOGLE</span>
                </button>
                
                <!-- GUEST LOGIN BUTTON -->
                <button id="btn-login-guest"
                    class="w-full btn-press group relative flex items-center justify-center gap-3 bg-slate-800/50 hover:bg-slate-700 border border-slate-600 hover:border-slate-400 text-slate-400 py-3 rounded-xl transition-all shadow-lg hover:shadow-slate-500/20">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                    </svg>
                    <span class="font-mono font-bold tracking-wider group-hover:text-slate-200">CONTINUE AS GUEST</span>
                </button>
            </div>

            <div id="auth-error-box" class="hidden mt-6 pt-4 border-t border-red-500/50">
                <p class="text-[12px] text-red-400 font-bold mb-2 uppercase tracking-wide animate-pulse">⚠️ DOMAIN NOT AUTHORIZED</p>
                <div class="bg-red-900/20 p-3 rounded-lg border border-red-500/50 text-center relative group cursor-pointer"
                    id="btn-copy-domain">
                    <p class="text-[10px] text-slate-400 mb-1">Please add this domain to Firebase Console:</p>
                    <div id="domain-display" class="font-mono text-xs text-white break-all font-bold select-all">...</div>
                    <div
                        class="absolute inset-0 bg-red-500/10 opacity-0 group-hover:opacity-100 transition flex items-center justify-center backdrop-blur-sm rounded-lg">
                        <span class="text-xs font-bold text-white">CLICK TO COPY</span>
                    </div>
                </div>
            </div>

            <p id="login-status" class="mt-4 text-xs text-slate-500 font-mono"></p>
        </div>
    </div>
`;
