/**
 * airQualityView.js - Daily Air Quality & Weather Living Assessment Dashboard Template
 */
export const airQualityViewHtml = `
    <!-- AIR & CLIMATE DASHBOARD PANEL -->
    <div id="air-panel" class="hidden flex-col gap-6 animate-fade-in pb-16">
        <!-- TOP HEADER: Title & Location Controls -->
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-900/40 p-5 rounded-3xl">
            <div>
                <h2 class="text-2xl font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-blue-500 flex items-center gap-2.5">
                    <i data-lucide="cloud-sun" class="w-6 h-6 text-cyan-400"></i>
                    Air & Climate
                </h2>
            </div>

            <!-- Location & Action Controls -->
            <div class="flex flex-wrap items-center gap-2.5">
                <!-- City Selector -->
                <div class="relative">
                    <select id="air-city-select" class="px-3.5 py-2 pr-8 rounded-xl bg-slate-950/70 text-slate-200 outline-none focus:ring-2 focus:ring-cyan-500/30 text-xs font-mono transition-all cursor-pointer appearance-none">
                        <option value="bangkok" selected>Bangkok, Thailand</option>
                        <option value="chiangmai">Chiang Mai, Thailand</option>
                        <option value="phuket">Phuket, Thailand</option>
                        <option value="khonkaen">Khon Kaen, Thailand</option>
                        <option value="chonburi">Chonburi, Thailand</option>
                        <option value="tokyo">Tokyo, Japan</option>
                        <option value="singapore">Singapore</option>
                        <option value="london">London, UK</option>
                        <option value="newyork">New York, USA</option>
                    </select>
                    <i data-lucide="chevron-down" class="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"></i>
                </div>

                <!-- GPS Auto-Detect Button -->
                <button id="btn-air-gps" type="button" class="btn-press flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800/40 hover:bg-slate-800/80 text-cyan-400 hover:text-cyan-300 text-xs font-mono transition-all" title="Auto-detect Current Location">
                    <i data-lucide="crosshair" class="w-3.5 h-3.5"></i>
                    <span class="hidden sm:inline">GPS</span>
                </button>

                <!-- Refresh Button -->
                <button id="btn-air-refresh" type="button" class="btn-press flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-xs font-mono transition-all" title="Refresh weather data">
                    <i data-lucide="refresh-cw" id="air-refresh-icon" class="w-3.5 h-3.5"></i>
                    <span class="hidden sm:inline">Refresh</span>
                </button>

                <!-- Last Updated Time Badge -->
                <span id="air-updated-badge" class="px-3 py-2 rounded-xl text-[11px] font-mono bg-slate-950/60 text-slate-400">
                    Just now
                </span>
            </div>
        </div>

        <!-- MAIN TOP ROW: Hero Weather Card + Living Comfort Score Card -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <!-- Hero Weather Card (col 12 / lg 7) -->
            <div class="lg:col-span-7 p-6 sm:p-8 rounded-3xl bg-slate-900/40 flex flex-col justify-between relative overflow-hidden space-y-6">
                <!-- Background Ambient Glow -->
                <div class="absolute -right-16 -top-16 w-56 h-56 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

                <div class="flex items-start justify-between relative z-10">
                    <div>
                        <div class="flex items-center gap-2 text-cyan-400 text-xs font-mono font-bold tracking-wider uppercase">
                            <i data-lucide="map-pin" class="w-3.5 h-3.5"></i>
                            <span id="air-location-name">Bangkok, Thailand</span>
                        </div>
                        <h3 id="air-hero-condition" class="text-xl sm:text-2xl font-bold font-sans text-white mt-1">Partly Cloudy</h3>
                    </div>
                    <div id="air-hero-icon-container" class="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 shrink-0">
                        <i data-lucide="cloud-sun" class="w-10 h-10 sm:w-12 sm:h-12"></i>
                    </div>
                </div>

                <!-- Temperature & Stats -->
                <div class="flex flex-wrap items-baseline gap-6 relative z-10 pt-2">
                    <div class="flex items-baseline">
                        <span id="air-hero-temp" class="text-5xl sm:text-7xl font-mono font-bold text-white tracking-tighter tabular-nums">31</span>
                        <span class="text-2xl sm:text-3xl font-mono text-cyan-400 ml-1">°C</span>
                    </div>

                    <div class="space-y-1 text-xs font-mono text-slate-400">
                        <div class="flex items-center gap-2">
                            <span class="text-slate-500">Feels Like:</span>
                            <span id="air-hero-feels-like" class="text-slate-200 font-bold tabular-nums">35°C</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <span class="text-slate-500">High / Low:</span>
                            <span id="air-hero-high-low" class="text-slate-200 font-bold tabular-nums">34°C / 26°C</span>
                        </div>
                    </div>
                </div>

                <!-- Quick Environmental Overview Badges -->
                <div class="grid grid-cols-3 gap-3 pt-2 relative z-10">
                    <div class="p-3 rounded-2xl bg-slate-950/60 flex flex-col items-center justify-center text-center">
                        <span class="text-[10px] font-mono text-slate-500 uppercase tracking-wider">PM2.5 DUST</span>
                        <span id="air-quick-pm25" class="text-sm font-mono font-bold text-emerald-400 mt-0.5 tabular-nums">18 µg/m³</span>
                    </div>
                    <div class="p-3 rounded-2xl bg-slate-950/60 flex flex-col items-center justify-center text-center">
                        <span class="text-[10px] font-mono text-slate-500 uppercase tracking-wider">UV INDEX</span>
                        <span id="air-quick-uv" class="text-sm font-mono font-bold text-amber-400 mt-0.5 tabular-nums">6 (High)</span>
                    </div>
                    <div class="p-3 rounded-2xl bg-slate-950/60 flex flex-col items-center justify-center text-center">
                        <span class="text-[10px] font-mono text-slate-500 uppercase tracking-wider">HUMIDITY</span>
                        <span id="air-quick-humidity" class="text-sm font-mono font-bold text-cyan-400 mt-0.5 tabular-nums">65%</span>
                    </div>
                </div>
            </div>

            <!-- Daily Living Comfort Score Card (col 12 / lg 5) -->
            <div class="lg:col-span-5 p-6 sm:p-8 rounded-3xl bg-slate-900/40 flex flex-col items-center justify-between text-center relative overflow-hidden space-y-5">
                <div class="w-full flex items-center justify-between text-left">
                    <div class="flex items-center gap-2">
                        <i data-lucide="sparkles" class="w-4 h-4 text-cyan-400"></i>
                        <h4 class="text-xs font-mono font-bold text-white uppercase tracking-wider">Human Living Score</h4>
                    </div>
                    <span id="air-score-grade-badge" class="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-cyan-500/15 text-cyan-400">
                        GRADE A
                    </span>
                </div>

                <!-- Circular SVG Progress Gauge -->
                <div class="relative flex items-center justify-center my-2">
                    <svg class="w-44 h-44 transform -rotate-90" viewBox="0 0 160 160">
                        <!-- Background Circle Track -->
                        <circle cx="80" cy="80" r="68" stroke="currentColor" stroke-width="12" fill="transparent" class="text-slate-950/80" />
                        <!-- Animated Value Circle -->
                        <circle id="air-gauge-circle" cx="80" cy="80" r="68" stroke="#22d3ee" stroke-width="12" stroke-linecap="round" fill="transparent" stroke-dasharray="427.26" stroke-dashoffset="85" class="transition-all duration-1000 ease-out" />
                    </svg>

                    <!-- Center Score Display -->
                    <div class="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span id="air-score-number" class="text-5xl font-mono font-bold text-white tracking-tighter tabular-nums">80</span>
                        <span class="text-[10px] font-mono text-slate-400 uppercase tracking-widest mt-0.5">OUT OF 100</span>
                    </div>
                </div>

                <!-- Evaluation Text -->
                <div class="space-y-1 w-full">
                    <div id="air-score-status" class="text-sm font-bold font-sans text-cyan-400">Comfortable & Safe</div>
                    <p id="air-score-desc" class="text-xs text-slate-400 max-w-xs mx-auto">Pleasant weather and safe air quality for daily outdoor living.</p>
                </div>
            </div>
        </div>

        <!-- ACTIONABLE LIFESTYLE ADVISORY WIDGETS -->
        <div class="space-y-3">
            <h4 class="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider px-1 flex items-center gap-2">
                <i data-lucide="clipboard-check" class="w-4 h-4 text-cyan-400"></i>
                Daily Lifestyle Recommendations
            </h4>

            <div id="air-advisories-grid" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                <!-- Dynamically Populated by AirQualityManager -->
            </div>
        </div>

        <!-- DETAILED ENVIRONMENTAL METRICS (6 Cards) -->
        <div class="space-y-3">
            <h4 class="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider px-1 flex items-center gap-2">
                <i data-lucide="activity" class="w-4 h-4 text-cyan-400"></i>
                Detailed Environmental Metrics
            </h4>

            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <!-- PM2.5 & AQI Card -->
                <div class="p-5 rounded-2xl bg-slate-900/40 space-y-2">
                    <div class="flex items-center justify-between text-slate-400 text-xs font-mono">
                        <span>PM2.5 / AQI</span>
                        <i data-lucide="wind" class="w-4 h-4 text-cyan-400"></i>
                    </div>
                    <div id="air-card-pm25-val" class="text-xl font-mono font-bold text-white">--</div>
                    <div id="air-card-pm25-status" class="text-[11px] font-mono text-emerald-400">--</div>
                </div>

                <!-- UV Index Card -->
                <div class="p-5 rounded-2xl bg-slate-900/40 space-y-2">
                    <div class="flex items-center justify-between text-slate-400 text-xs font-mono">
                        <span>UV Index</span>
                        <i data-lucide="sun" class="w-4 h-4 text-amber-400"></i>
                    </div>
                    <div id="air-card-uv-val" class="text-xl font-mono font-bold text-white">--</div>
                    <div id="air-card-uv-status" class="text-[11px] font-mono text-slate-400">--</div>
                </div>

                <!-- Relative Humidity Card -->
                <div class="p-5 rounded-2xl bg-slate-900/40 space-y-2">
                    <div class="flex items-center justify-between text-slate-400 text-xs font-mono">
                        <span>Humidity</span>
                        <i data-lucide="droplets" class="w-4 h-4 text-blue-400"></i>
                    </div>
                    <div id="air-card-humidity-val" class="text-xl font-mono font-bold text-white">--</div>
                    <div id="air-card-humidity-status" class="text-[11px] font-mono text-cyan-400">--</div>
                </div>

                <!-- Wind Speed Card -->
                <div class="p-5 rounded-2xl bg-slate-900/40 space-y-2">
                    <div class="flex items-center justify-between text-slate-400 text-xs font-mono">
                        <span>Wind & Gusts</span>
                        <i data-lucide="navigation" class="w-4 h-4 text-teal-400"></i>
                    </div>
                    <div id="air-card-wind-val" class="text-xl font-mono font-bold text-white">--</div>
                    <div id="air-card-wind-status" class="text-[11px] font-mono text-slate-400">--</div>
                </div>

                <!-- Air Pressure Card -->
                <div class="p-5 rounded-2xl bg-slate-900/40 space-y-2">
                    <div class="flex items-center justify-between text-slate-400 text-xs font-mono">
                        <span>Pressure</span>
                        <i data-lucide="gauge" class="w-4 h-4 text-indigo-400"></i>
                    </div>
                    <div id="air-card-pressure-val" class="text-xl font-mono font-bold text-white">--</div>
                    <div id="air-card-pressure-status" class="text-[11px] font-mono text-slate-400">--</div>
                </div>

                <!-- Rain Probability Card -->
                <div class="p-5 rounded-2xl bg-slate-900/40 space-y-2">
                    <div class="flex items-center justify-between text-slate-400 text-xs font-mono">
                        <span>Rain Chance</span>
                        <i data-lucide="cloud-rain" class="w-4 h-4 text-cyan-400"></i>
                    </div>
                    <div id="air-card-rain-val" class="text-xl font-mono font-bold text-white">--</div>
                    <div id="air-card-rain-status" class="text-[11px] font-mono text-emerald-400">--</div>
                </div>
            </div>
        </div>

        <!-- 24-HOUR HOURLY FORECAST TIMELINE -->
        <div class="p-6 rounded-3xl bg-slate-900/40 space-y-4">
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                    <i data-lucide="clock" class="w-4 h-4 text-cyan-400"></i>
                    <h4 class="text-xs font-mono font-bold text-white uppercase tracking-wider">24-Hour Weather & PM2.5 Forecast</h4>
                </div>
                <div class="flex items-center gap-2">
                    <span class="text-[10px] font-mono text-slate-500 hidden sm:inline">Click & drag to scroll</span>
                    <span class="text-[11px] font-mono text-slate-500">Hourly Timeline</span>
                </div>
            </div>

            <!-- Horizontal Scrollable Strip (Hidden Scrollbar + Drag-to-Scroll) -->
            <div id="air-hourly-strip" class="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar select-none cursor-grab active:cursor-grabbing">
                <!-- Dynamically Populated -->
            </div>
        </div>
    </div>
`;
