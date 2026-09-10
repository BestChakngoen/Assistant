import { WeatherService } from './WeatherService.js';
import { ComfortScoreCalculator } from './ComfortScoreCalculator.js';
import { ShareUI } from '../ui/share/ShareUI.js';

/**
 * AirQualityManager - Main Controller for Daily Air Quality & Weather Dashboard.
 * Integrates WeatherService data, ComfortScoreCalculator logic, and UI rendering.
 */
export class AirQualityManager {
    constructor() {
        this.currentCityId = 'bangkok';
        this.currentLat = 13.7563;
        this.currentLon = 100.5018;
        this.currentLocationName = 'Bangkok, Thailand';
        this.lastFetchTime = 0;
        this.data = null;
        this.isRefreshing = false;

        this.dom = {};
    }

    init() {
        this.cacheDom();
        if (!this.dom.panel) return;
        this.bindEvents();
        this.loadCurrentLocation();
    }

    cacheDom() {
        this.dom.panel = document.getElementById('air-panel');
        this.dom.citySelect = document.getElementById('air-city-select');
        this.dom.btnGps = document.getElementById('btn-air-gps');
        this.dom.btnRefresh = document.getElementById('btn-air-refresh');
        this.dom.refreshIcon = document.getElementById('air-refresh-icon');
        this.dom.updatedBadge = document.getElementById('air-updated-badge');

        // Hero Card
        this.dom.locationName = document.getElementById('air-location-name');
        this.dom.heroCondition = document.getElementById('air-hero-condition');
        this.dom.heroIconContainer = document.getElementById('air-hero-icon-container');
        this.dom.heroTemp = document.getElementById('air-hero-temp');
        this.dom.heroFeelsLike = document.getElementById('air-hero-feels-like');
        this.dom.heroHighLow = document.getElementById('air-hero-high-low');

        // Quick badges
        this.dom.quickPm25 = document.getElementById('air-quick-pm25');
        this.dom.quickUv = document.getElementById('air-quick-uv');
        this.dom.quickHumidity = document.getElementById('air-quick-humidity');

        // Score Card
        this.dom.scoreNumber = document.getElementById('air-score-number');
        this.dom.scoreGradeBadge = document.getElementById('air-score-grade-badge');
        this.dom.gaugeCircle = document.getElementById('air-gauge-circle');
        this.dom.scoreStatus = document.getElementById('air-score-status');
        this.dom.scoreDesc = document.getElementById('air-score-desc');

        // Advisories & Metrics
        this.dom.advisoriesGrid = document.getElementById('air-advisories-grid');
        this.dom.hourlyStrip = document.getElementById('air-hourly-strip');

        // Metric detail elements
        this.dom.metricPm25Val = document.getElementById('air-card-pm25-val');
        this.dom.metricPm25Status = document.getElementById('air-card-pm25-status');
        this.dom.metricUvVal = document.getElementById('air-card-uv-val');
        this.dom.metricUvStatus = document.getElementById('air-card-uv-status');
        this.dom.metricHumidityVal = document.getElementById('air-card-humidity-val');
        this.dom.metricHumidityStatus = document.getElementById('air-card-humidity-status');
        this.dom.metricWindVal = document.getElementById('air-card-wind-val');
        this.dom.metricWindStatus = document.getElementById('air-card-wind-status');
        this.dom.metricPressureVal = document.getElementById('air-card-pressure-val');
        this.dom.metricPressureStatus = document.getElementById('air-card-pressure-status');
        this.dom.metricRainVal = document.getElementById('air-card-rain-val');
        this.dom.metricRainStatus = document.getElementById('air-card-rain-status');
    }

    bindEvents() {
        // City selection
        if (this.dom.citySelect) {
            this.dom.citySelect.addEventListener('change', (e) => {
                const city = WeatherService.CITIES.find(c => c.id === e.target.value);
                if (city) {
                    this.currentCityId = city.id;
                    this.currentLat = city.lat;
                    this.currentLon = city.lon;
                    this.currentLocationName = city.name;
                    this.loadData(true);
                }
            });
        }

        // GPS Auto-detect
        if (this.dom.btnGps) {
            this.dom.btnGps.addEventListener('click', () => this.detectGpsLocation());
        }

        // Manual Refresh
        if (this.dom.btnRefresh) {
            this.dom.btnRefresh.addEventListener('click', () => this.loadData(true));
        }
    }

    detectGpsLocation() {
        if (!navigator.geolocation) {
            ShareUI.showToast('GPS Error', 'Geolocation is not supported by your browser', 'error');
            return;
        }

        ShareUI.showToast('Locating...', 'Detecting your GPS position...', 'info');

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                this.currentLat = pos.coords.latitude;
                this.currentLon = pos.coords.longitude;
                this.currentLocationName = `GPS Location (${this.currentLat.toFixed(2)}, ${this.currentLon.toFixed(2)})`;

                if (this.dom.citySelect) {
                    // Check if GPS matches a known city within 0.5 deg
                    const closeCity = WeatherService.CITIES.find(
                        c => Math.hypot(c.lat - this.currentLat, c.lon - this.currentLon) < 0.5
                    );
                    if (closeCity) {
                        this.dom.citySelect.value = closeCity.id;
                        this.currentLocationName = closeCity.name;
                    }
                }

                this.loadData(true);
                ShareUI.showToast('Location Found', `Updated for ${this.currentLocationName}`, 'success');
            },
            (err) => {
                console.warn('Geolocation failed:', err);
                ShareUI.showToast('GPS Error', 'Could not obtain GPS coordinates. Using preset city.', 'error');
            },
            { timeout: 10000, maximumAge: 60000 }
        );
    }

    async loadCurrentLocation() {
        await this.loadData(false);
    }

    refreshIfStale() {
        const TEN_MINUTES = 10 * 60 * 1000;
        if (Date.now() - this.lastFetchTime > TEN_MINUTES) {
            this.loadData(false);
        }
    }

    async loadData(forceRefresh = false) {
        if (this.isRefreshing) return;
        this.isRefreshing = true;

        if (this.dom.refreshIcon) {
            this.dom.refreshIcon.classList.add('animate-spin');
        }

        try {
            const data = await WeatherService.fetchEnvironmentData(this.currentLat, this.currentLon, forceRefresh);
            this.data = data;
            this.lastFetchTime = Date.now();
            this.render();
        } catch (err) {
            console.error('Failed to load air & weather data:', err);
            ShareUI.showToast('Error', 'Failed to retrieve environmental data', 'error');
        } finally {
            this.isRefreshing = false;
            if (this.dom.refreshIcon) {
                this.dom.refreshIcon.classList.remove('animate-spin');
            }
        }
    }

    render() {
        if (!this.data) return;

        const { current, hourly } = this.data;

        // Calculate score
        const assessment = ComfortScoreCalculator.calculate({
            pm25: current.pm25,
            temp: current.temp,
            apparentTemp: current.apparentTemp,
            humidity: current.humidity,
            uvIndex: current.uvIndex,
            windSpeed: current.windSpeed,
            precipitationProb: current.precipitationProb
        });

        // 1. Render Top Header & Badges
        if (this.dom.locationName) this.dom.locationName.textContent = this.currentLocationName;
        if (this.dom.updatedBadge) {
            const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
            this.dom.updatedBadge.textContent = `Updated ${timeStr}`;
        }

        // 2. Render Hero Card
        if (this.dom.heroCondition) this.dom.heroCondition.textContent = current.condition;
        if (this.dom.heroTemp) this.dom.heroTemp.textContent = current.temp;
        if (this.dom.heroFeelsLike) this.dom.heroFeelsLike.textContent = `${current.apparentTemp}°C`;
        if (this.dom.heroHighLow) this.dom.heroHighLow.textContent = `${current.tempMax}°C / ${current.tempMin}°C`;

        if (this.dom.heroIconContainer) {
            this.dom.heroIconContainer.innerHTML = `<i data-lucide="${current.icon}" class="w-10 h-10 sm:w-12 sm:h-12"></i>`;
        }

        // Quick badges
        if (this.dom.quickPm25) {
            const aqiText = current.usAqi ? ` (AQI ${current.usAqi})` : '';
            this.dom.quickPm25.textContent = `${current.pm25} µg/m³${aqiText}`;
            this.dom.quickPm25.className = `text-sm font-mono font-bold mt-0.5 ${current.pm25 <= 25 ? 'text-emerald-400' : current.pm25 <= 50 ? 'text-amber-400' : 'text-rose-400'}`;
        }

        if (this.dom.quickUv) {
            const uvLevel = current.uvIndex <= 0 ? 'Night' : current.uvIndex <= 2 ? 'Low' : current.uvIndex <= 5 ? 'Moderate' : current.uvIndex <= 7 ? 'High' : 'Very High';
            this.dom.quickUv.textContent = `${current.uvIndex} (${uvLevel})`;
            this.dom.quickUv.className = `text-sm font-mono font-bold mt-0.5 ${current.uvIndex <= 0 ? 'text-slate-400' : current.uvIndex <= 5 ? 'text-emerald-400' : current.uvIndex <= 7 ? 'text-amber-400' : 'text-rose-400'}`;
        }

        if (this.dom.quickHumidity) {
            this.dom.quickHumidity.textContent = `${current.humidity}%`;
        }

        // 3. Render Human Living Comfort Score Card
        const { totalScore, rating, advisories } = assessment;

        if (this.dom.scoreNumber) this.dom.scoreNumber.textContent = totalScore;
        if (this.dom.scoreGradeBadge) {
            this.dom.scoreGradeBadge.textContent = `GRADE ${rating.grade}`;
            this.dom.scoreGradeBadge.className = `px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${rating.bgClass} ${rating.textClass}`;
        }

        if (this.dom.scoreStatus) {
            this.dom.scoreStatus.textContent = rating.statusText;
            this.dom.scoreStatus.className = `text-sm font-bold font-sans ${rating.textClass}`;
        }

        if (this.dom.scoreDesc) {
            this.dom.scoreDesc.textContent = rating.label === 'Excellent'
                ? 'Prime environmental conditions. Clean air and great thermal comfort.'
                : rating.label === 'Good'
                ? 'Pleasant weather and safe air quality for daily outdoor living.'
                : rating.label === 'Moderate'
                ? 'Mild atmospheric stress. Sensitive individuals should take note.'
                : rating.label === 'Poor'
                ? 'Elevated dust or heat stress. Limit prolonged outdoor exposure.'
                : 'Hazardous environmental strain. Stay indoors with air purifiers.';
        }

        // Animated SVG Gauge Circle
        if (this.dom.gaugeCircle) {
            const circumference = 2 * Math.PI * 68; // ~427.26
            const offset = circumference * (1 - totalScore / 100);
            this.dom.gaugeCircle.style.strokeDashoffset = offset;
            this.dom.gaugeCircle.setAttribute('stroke', rating.strokeColor);
        }

        // 4. Render Actionable Lifestyle Advisories
        if (this.dom.advisoriesGrid) {
            this.dom.advisoriesGrid.innerHTML = advisories.map(adv => `
                <div class="p-4 rounded-2xl bg-slate-900/40 space-y-2 flex flex-col justify-between">
                    <div class="flex items-center justify-between">
                        <span class="text-[11px] font-mono font-semibold text-slate-400 uppercase tracking-wider">${adv.title}</span>
                        <div class="p-1.5 rounded-lg bg-slate-950/60 text-cyan-400">
                            <i data-lucide="${adv.icon}" class="w-4 h-4"></i>
                        </div>
                    </div>
                    <div>
                        <span class="inline-block px-2 py-0.5 rounded-md text-xs font-mono font-bold ${adv.badgeClass}">
                            ${adv.status}
                        </span>
                        <p class="text-[11px] font-sans text-slate-400 mt-1.5 line-clamp-2">${adv.detail}</p>
                    </div>
                </div>
            `).join('');
        }

        // 5. Render Detailed Metrics
        if (this.dom.metricPm25Val) this.dom.metricPm25Val.textContent = `${current.pm25} µg/m³`;
        if (this.dom.metricPm25Status) {
            const aqiText = current.usAqi ? `AQI ${current.usAqi}` : '';
            let qualityLabel = 'Good (WHO)';
            let colorClass = 'text-emerald-400';
            if (current.pm25 > 50 || current.usAqi > 150) {
                qualityLabel = 'Unhealthy';
                colorClass = 'text-rose-400';
            } else if (current.pm25 > 37.5 || current.usAqi > 100) {
                qualityLabel = 'Unhealthy for Sensitive';
                colorClass = 'text-orange-400';
            } else if (current.pm25 > 25 || current.usAqi > 50) {
                qualityLabel = 'Moderate';
                colorClass = 'text-amber-400';
            }
            this.dom.metricPm25Status.textContent = aqiText ? `${aqiText} • ${qualityLabel}` : qualityLabel;
            this.dom.metricPm25Status.className = `text-[11px] font-mono ${colorClass}`;
        }

        if (this.dom.metricUvVal) this.dom.metricUvVal.textContent = current.uvIndex;
        if (this.dom.metricUvStatus) {
            this.dom.metricUvStatus.textContent = current.uvIndex <= 0 ? 'Zero (Night)' : current.uvIndex <= 2 ? 'Low (Safe)' : current.uvIndex <= 5 ? 'Moderate' : current.uvIndex <= 7 ? 'High Risk' : current.uvIndex <= 10 ? 'Very High' : 'Extreme';
            this.dom.metricUvStatus.className = `text-[11px] font-mono ${current.uvIndex <= 0 ? 'text-slate-400' : current.uvIndex <= 2 ? 'text-emerald-400' : current.uvIndex <= 5 ? 'text-cyan-400' : current.uvIndex <= 7 ? 'text-amber-400' : 'text-rose-400'}`;
        }

        if (this.dom.metricHumidityVal) this.dom.metricHumidityVal.textContent = `${current.humidity}%`;
        if (this.dom.metricHumidityStatus) {
            this.dom.metricHumidityStatus.textContent = current.humidity >= 85
                ? 'High (Rainy/Humid)'
                : current.humidity >= 45 && current.humidity <= 65
                ? 'Ideal Comfort'
                : current.humidity > 65
                ? 'Humid & Sticky'
                : 'Dry Air';
        }

        if (this.dom.metricWindVal) {
            this.dom.metricWindVal.textContent = `${current.windSpeed} km/h`;
        }
        if (this.dom.metricWindStatus) {
            const gustPart = current.windGusts > current.windSpeed ? `Gust ${current.windGusts}k` : '';
            const dirPart = current.windCompass || '';
            const details = [gustPart, dirPart].filter(Boolean).join(' • ');
            this.dom.metricWindStatus.textContent = details ? details : (current.windSpeed < 5 ? 'Calm' : 'Gentle Breeze');
        }

        if (this.dom.metricPressureVal) this.dom.metricPressureVal.textContent = `${current.pressure} hPa`;
        if (this.dom.metricPressureStatus) {
            this.dom.metricPressureStatus.textContent = current.pressure >= 1013 ? 'High (Sea Level)' : 'Normal (Sea Level)';
        }

        if (this.dom.metricRainVal) this.dom.metricRainVal.textContent = `${current.precipitationProb}%`;
        if (this.dom.metricRainStatus) {
            this.dom.metricRainStatus.textContent = current.precipitationProb < 20 ? 'Low Chance' : current.precipitationProb < 60 ? 'Scattered Showers' : 'Rain Likely';
            this.dom.metricRainStatus.className = `text-[11px] font-mono ${current.precipitationProb < 20 ? 'text-emerald-400' : current.precipitationProb < 60 ? 'text-amber-400' : 'text-cyan-400'}`;
        }

        // 6. Render 24-Hour Hourly Timeline
        if (this.dom.hourlyStrip && Array.isArray(hourly)) {
            this.dom.hourlyStrip.innerHTML = hourly.map((h, idx) => `
                <div class="p-3.5 rounded-2xl ${idx === 0 ? 'bg-cyan-500/15' : 'bg-slate-900/40'} flex flex-col items-center justify-center text-center shrink-0 w-24 space-y-2">
                    <span class="text-xs font-mono ${idx === 0 ? 'text-cyan-400 font-bold' : 'text-slate-400 font-medium'}">${idx === 0 ? 'Now' : h.time}</span>
                    <div class="${idx === 0 ? 'text-cyan-300' : 'text-cyan-400'} my-0.5">
                        <i data-lucide="${h.icon}" class="w-5 h-5"></i>
                    </div>
                    <span class="text-sm font-mono font-bold text-white">${h.temp}°C</span>
                    <div class="flex items-center gap-1 text-[10px] font-mono ${h.pm25 <= 25 ? 'text-emerald-400' : 'text-amber-400'}">
                        <span>PM</span>
                        <span class="font-bold">${h.pm25}</span>
                    </div>
                </div>
            `).join('');
        }

        // Refresh icons
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }
}
