/**
 * WeatherService.js - Handles Open-Meteo Weather & Air Quality API requests, caching, and geolocation.
 * Free, non-commercial, zero-API-key required.
 */
export class WeatherService {
    static CITIES = [
        { id: 'bangkok', name: 'Bangkok, Thailand', lat: 13.7563, lon: 100.5018 },
        { id: 'chiangmai', name: 'Chiang Mai, Thailand', lat: 18.7883, lon: 98.9853 },
        { id: 'phuket', name: 'Phuket, Thailand', lat: 7.8804, lon: 98.3923 },
        { id: 'khonkaen', name: 'Khon Kaen, Thailand', lat: 16.4322, lon: 102.8236 },
        { id: 'chonburi', name: 'Chonburi, Thailand', lat: 13.3611, lon: 100.9847 },
        { id: 'tokyo', name: 'Tokyo, Japan', lat: 35.6762, lon: 139.6503 },
        { id: 'singapore', name: 'Singapore', lat: 1.3521, lon: 103.8198 },
        { id: 'london', name: 'London, UK', lat: 51.5074, lon: -0.1278 },
        { id: 'newyork', name: 'New York, USA', lat: 40.7128, lon: -74.0060 }
    ];

    static CACHE_DURATION_MS = 15 * 60 * 1000; // 15 minutes

    /**
     * Fetches combined weather and air quality data for given coordinates.
     * @param {number} lat - Latitude
     * @param {number} lon - Longitude
     * @param {boolean} forceRefresh - Bypass cache if true
     */
    static async fetchEnvironmentData(lat, lon, forceRefresh = false) {
        const cacheKey = `assistant_env_cache_v3_${lat.toFixed(3)}_${lon.toFixed(3)}`;

        if (!forceRefresh) {
            const cached = this.getFromCache(cacheKey);
            if (cached) return cached;
        }

        try {
            const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,precipitation_probability,weather_code,wind_speed_10m,wind_gusts_10m,wind_direction_10m,pressure_msl,surface_pressure,uv_index,is_day&hourly=temperature_2m,weather_code,precipitation_probability,uv_index,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min,uv_index_max&timezone=auto`;
            const airQualityUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=pm10,pm2_5,european_aqi,us_aqi&hourly=pm2_5,us_aqi&timezone=auto`;

            const [weatherRes, airRes] = await Promise.all([
                fetch(weatherUrl),
                fetch(airQualityUrl)
            ]);

            if (!weatherRes.ok || !airRes.ok) {
                throw new Error(`API HTTP Error: Weather ${weatherRes.status}, Air ${airRes.status}`);
            }

            const weatherData = await weatherRes.json();
            const airData = await airRes.json();

            const combined = this.normalizeData(weatherData, airData, lat, lon);
            this.saveToCache(cacheKey, combined);
            return combined;
        } catch (err) {
            console.warn('WeatherService API failed or offline. Using fallback data:', err);
            return this.getFallbackData(lat, lon);
        }
    }

    /**
     * Converts wind degrees to compass cardinal direction.
     */
    static getCompassDirection(deg) {
        if (deg == null) return 'N';
        const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
        const val = Math.floor((deg / 22.5) + 0.5);
        return directions[val % 16] || 'N';
    }

    /**
     * Formats and normalizes API payload into standardized structure.
     */
    static normalizeData(weather, air, lat, lon) {
        const currentW = weather.current || {};
        const dailyW = weather.daily || {};
        const currentAir = air.current || {};
        const hourlyW = weather.hourly || {};
        const hourlyAir = air.hourly || {};

        const weatherCode = currentW.weather_code ?? 0;
        const isDay = currentW.is_day ?? 1;
        const condition = this.getWeatherCondition(weatherCode, isDay);

        // Build 24-hour forecast starting from the exact current local hour
        const hourlyForecast = [];
        const hoursList = hourlyW.time || [];
        const currentTargetHour = currentW.time ? currentW.time.slice(0, 13) : '';
        let startIndex = currentTargetHour ? hoursList.findIndex(t => t.startsWith(currentTargetHour)) : -1;
        if (startIndex < 0) {
            const localIsoHour = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 13);
            startIndex = hoursList.findIndex(t => t.startsWith(localIsoHour));
            if (startIndex < 0) startIndex = 0;
        }

        for (let i = startIndex; i < Math.min(hoursList.length, startIndex + 24); i++) {
            const timeStr = hoursList[i];
            const dateObj = new Date(timeStr);
            const hourLabel = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', hour12: true });
            const hCode = hourlyW.weather_code ? hourlyW.weather_code[i] : 0;
            const hIsDay = hourlyW.is_day ? hourlyW.is_day[i] : 1;
            const hCond = this.getWeatherCondition(hCode, hIsDay);

            hourlyForecast.push({
                time: hourLabel,
                temp: Math.round(hourlyW.temperature_2m ? hourlyW.temperature_2m[i] : currentW.temperature_2m || 28),
                weatherCode: hCode,
                condition: hCond.label,
                icon: hCond.icon,
                rainProb: hourlyW.precipitation_probability ? hourlyW.precipitation_probability[i] : 0,
                pm25: hourlyAir.pm2_5 ? Math.round(hourlyAir.pm2_5[i]) : 15,
                uvIndex: hourlyW.uv_index ? Math.round(hourlyW.uv_index[i]) : 0,
                isDay: hIsDay
            });
        }

        // Real-time UV index: 0 if nighttime (isDay === 0), otherwise current uv_index
        let realTimeUv = 0;
        if (isDay === 1) {
            if (currentW.uv_index != null) {
                realTimeUv = Math.round(currentW.uv_index);
            } else if (hourlyW.uv_index && startIndex >= 0) {
                realTimeUv = Math.round(hourlyW.uv_index[startIndex] || 0);
            }
        }

        // Real-time precipitation probability
        const realTimeRainProb = currentW.precipitation_probability != null
            ? Math.round(currentW.precipitation_probability)
            : (hourlyW.precipitation_probability ? hourlyW.precipitation_probability[startIndex] || 0 : 0);

        // Wind speed, gusts and direction
        const windSpeed = Math.round(currentW.wind_speed_10m ?? 0);
        const windGusts = Math.round(currentW.wind_gusts_10m ?? windSpeed);
        const windDirection = currentW.wind_direction_10m ?? 0;
        const windCompass = this.getCompassDirection(windDirection);

        // Sea level pressure (standard MSLP reported by meteorologists)
        const pressureMsl = Math.round(currentW.pressure_msl ?? currentW.surface_pressure ?? 1012);

        return {
            timestamp: Date.now(),
            lat,
            lon,
            current: {
                temp: Math.round(currentW.temperature_2m ?? 28),
                apparentTemp: Math.round(currentW.apparent_temperature ?? 31),
                humidity: Math.round(currentW.relative_humidity_2m ?? 60),
                windSpeed,
                windGusts,
                windDirection,
                windCompass,
                pressure: pressureMsl,
                surfacePressure: Math.round(currentW.surface_pressure ?? 1012),
                precipitation: currentW.precipitation ?? 0,
                precipitationProb: realTimeRainProb,
                weatherCode,
                isDay,
                condition: condition.label,
                icon: condition.icon,
                tempMax: dailyW.temperature_2m_max ? Math.round(dailyW.temperature_2m_max[0]) : 33,
                tempMin: dailyW.temperature_2m_min ? Math.round(dailyW.temperature_2m_min[0]) : 24,
                uvIndex: realTimeUv,
                uvIndexMax: dailyW.uv_index_max ? Math.round(dailyW.uv_index_max[0]) : 0,
                pm25: currentAir.pm2_5 != null ? Math.round(currentAir.pm2_5) : 18,
                pm10: currentAir.pm10 != null ? Math.round(currentAir.pm10) : 32,
                usAqi: currentAir.us_aqi != null ? Math.round(currentAir.us_aqi) : (currentAir.pm2_5 ? Math.round(currentAir.pm2_5 * 3.5) : 50),
                europeanAqi: currentAir.european_aqi != null ? Math.round(currentAir.european_aqi) : null
            },
            hourly: hourlyForecast
        };
    }

    /**
     * WMO Weather interpretation codes with day/night awareness
     */
    static getWeatherCondition(code, isDay = 1) {
        switch (code) {
            case 0:
                return { label: 'Clear Sky', icon: isDay ? 'sun' : 'moon' };
            case 1:
                return { label: 'Mainly Clear', icon: isDay ? 'sun' : 'moon' };
            case 2:
                return { label: 'Partly Cloudy', icon: isDay ? 'cloud-sun' : 'cloud-moon' };
            case 3:
                return { label: 'Overcast', icon: 'cloud' };
            case 45:
            case 48:
                return { label: 'Foggy', icon: 'cloud-fog' };
            case 51:
            case 53:
            case 55:
                return { label: 'Drizzle', icon: 'cloud-drizzle' };
            case 61:
            case 63:
            case 65:
                return { label: 'Rain', icon: 'cloud-rain' };
            case 71:
            case 73:
            case 75:
                return { label: 'Snow', icon: 'snowflake' };
            case 80:
            case 81:
            case 82:
                return { label: 'Rain Showers', icon: 'cloud-rain' };
            case 95:
            case 96:
            case 99:
                return { label: 'Thunderstorm', icon: 'cloud-lightning' };
            default:
                return { label: 'Clear', icon: isDay ? 'sun' : 'moon' };
        }
    }

    static getFromCache(key) {
        try {
            const raw = localStorage.getItem(key);
            if (!raw) return null;
            const data = JSON.parse(raw);
            if (Date.now() - data.timestamp < this.CACHE_DURATION_MS) {
                return data;
            }
        } catch (e) {
            return null;
        }
        return null;
    }

    static saveToCache(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (e) {
            // Quota exceeded or private mode
        }
    }

    /**
     * Fallback mock data when user is offline or API fails
     */
    static getFallbackData(lat, lon) {
        const hours = [];
        const baseTemp = 30;
        const currentHour = new Date().getHours();
        const isCurrentDay = currentHour >= 6 && currentHour < 18 ? 1 : 0;
        const currentCond = this.getWeatherCondition(2, isCurrentDay);

        for (let i = 0; i < 24; i++) {
            const h = (currentHour + i) % 24;
            const hIsDay = h >= 6 && h < 18 ? 1 : 0;
            const hCond = this.getWeatherCondition(2, hIsDay);
            const hLabel = `${h % 12 || 12} ${h >= 12 ? 'PM' : 'AM'}`;
            hours.push({
                time: hLabel,
                temp: Math.round(baseTemp + Math.sin((i / 24) * Math.PI * 2) * 4),
                weatherCode: 2,
                condition: hCond.label,
                icon: hCond.icon,
                rainProb: 15,
                pm25: 18,
                uvIndex: hIsDay ? 5 : 0,
                isDay: hIsDay
            });
        }

        return {
            timestamp: Date.now(),
            lat,
            lon,
            isFallback: true,
            current: {
                temp: 31,
                apparentTemp: 35,
                humidity: 65,
                windSpeed: 11,
                windGusts: 18,
                windDirection: 190,
                windCompass: 'S',
                pressure: 1010,
                surfacePressure: 1008,
                precipitation: 0,
                precipitationProb: 15,
                weatherCode: 2,
                isDay: isCurrentDay,
                condition: currentCond.label,
                icon: currentCond.icon,
                tempMax: 34,
                tempMin: 26,
                uvIndex: isCurrentDay ? 7 : 0,
                uvIndexMax: 7,
                pm25: 14,
                pm10: 25,
                usAqi: 35
            },
            hourly: hours
        };
    }
}
