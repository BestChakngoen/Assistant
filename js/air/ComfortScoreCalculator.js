/**
 * ComfortScoreCalculator.js - Pure mathematical logic for calculating Human Living Comfort & Air Quality Score.
 * Follows SOLID principles: Pure calculation module isolated from DOM rendering.
 */
export class ComfortScoreCalculator {
    /**
     * Calculates composite Human Living Comfort Score (0-100) based on all environmental factors.
     * @param {Object} metrics - { pm25, temp, apparentTemp, humidity, uvIndex, windSpeed, precipitationProb }
     * @returns {Object} Score details, rating, advice, and factor breakdowns.
     */
    static calculate(metrics = {}) {
        const pm25 = typeof metrics.pm25 === 'number' ? metrics.pm25 : 15;
        const temp = typeof metrics.temp === 'number' ? metrics.temp : 26;
        const apparentTemp = typeof metrics.apparentTemp === 'number' ? metrics.apparentTemp : temp;
        const humidity = typeof metrics.humidity === 'number' ? metrics.humidity : 50;
        const uvIndex = typeof metrics.uvIndex === 'number' ? metrics.uvIndex : 3;
        const windSpeed = typeof metrics.windSpeed === 'number' ? metrics.windSpeed : 10;
        const precipitationProb = typeof metrics.precipitationProb === 'number' ? metrics.precipitationProb : 0;

        // 1. PM2.5 Factor (Max 35 points) - Highest impact on respiratory health
        let pm25Score = 35;
        if (pm25 <= 12) {
            pm25Score = 35; // WHO Ideal
        } else if (pm25 <= 25) {
            pm25Score = 35 - ((pm25 - 12) / 13) * 6; // 29 - 35
        } else if (pm25 <= 37.5) {
            pm25Score = 29 - ((pm25 - 25) / 12.5) * 8; // 21 - 29
        } else if (pm25 <= 50) {
            pm25Score = 21 - ((pm25 - 37.5) / 12.5) * 9; // 12 - 21
        } else if (pm25 <= 75) {
            pm25Score = 12 - ((pm25 - 50) / 25) * 8; // 4 - 12
        } else {
            pm25Score = Math.max(0, 4 - ((pm25 - 75) / 50) * 4); // 0 - 4
        }

        // 2. Thermal Comfort / Heat Index Factor (Max 25 points)
        let heatScore = 25;
        if (apparentTemp >= 21 && apparentTemp <= 27) {
            heatScore = 25; // Optimum thermal comfort
        } else if (apparentTemp > 27 && apparentTemp <= 32) {
            heatScore = 25 - ((apparentTemp - 27) / 5) * 6; // 19 - 25
        } else if (apparentTemp > 32 && apparentTemp <= 38) {
            heatScore = 19 - ((apparentTemp - 32) / 6) * 8; // 11 - 19
        } else if (apparentTemp > 38 && apparentTemp <= 44) {
            heatScore = 11 - ((apparentTemp - 38) / 6) * 7; // 4 - 11
        } else if (apparentTemp > 44) {
            heatScore = Math.max(0, 4 - ((apparentTemp - 44) / 6) * 4);
        } else if (apparentTemp < 21) {
            // Cooler weather
            if (apparentTemp >= 16) {
                heatScore = 22;
            } else if (apparentTemp >= 10) {
                heatScore = 17;
            } else {
                heatScore = Math.max(0, 12 - (10 - apparentTemp) * 1.5);
            }
        }

        // 3. UV Radiation Factor (Max 15 points)
        let uvScore = 15;
        if (uvIndex <= 2) {
            uvScore = 15; // Low
        } else if (uvIndex <= 5) {
            uvScore = 15 - ((uvIndex - 2) / 3) * 3; // 12 - 15 (Moderate)
        } else if (uvIndex <= 7) {
            uvScore = 12 - ((uvIndex - 5) / 2) * 4; // 8 - 12 (High)
        } else if (uvIndex <= 10) {
            uvScore = 8 - ((uvIndex - 7) / 3) * 5; // 3 - 8 (Very High)
        } else {
            uvScore = Math.max(0, 3 - ((uvIndex - 10) / 3) * 3); // 0 - 3 (Extreme)
        }

        // 4. Relative Humidity Factor (Max 15 points)
        let humidityScore = 15;
        if (humidity >= 45 && humidity <= 60) {
            humidityScore = 15; // Optimum
        } else if (humidity >= 35 && humidity < 45) {
            humidityScore = 13;
        } else if (humidity > 60 && humidity <= 72) {
            humidityScore = 12;
        } else if (humidity > 72 && humidity <= 82) {
            humidityScore = 7;
        } else {
            humidityScore = 3;
        }

        // 5. Wind & Rain Adverse Weather Factor (Max 10 points)
        let windRainScore = 10;
        // Rain deduction
        if (precipitationProb > 20) {
            windRainScore -= Math.min(6, ((precipitationProb - 20) / 80) * 6);
        }
        // Wind deduction (extreme wind or completely stagnant air)
        if (windSpeed > 35) {
            windRainScore -= Math.min(4, ((windSpeed - 35) / 30) * 4);
        } else if (windSpeed < 2) {
            windRainScore -= 1; // Stagnant air allows pollutants to linger
        }
        windRainScore = Math.max(0, Math.min(10, windRainScore));

        // Total Composite Score (0 - 100)
        const totalScore = Math.round(
            Math.max(0, Math.min(100, pm25Score + heatScore + uvScore + humidityScore + windRainScore))
        );

        // Rating Evaluation
        const rating = this.evaluateRating(totalScore);

        // Actionable Lifestyle Advisories
        const advisories = this.generateAdvisories({
            pm25,
            apparentTemp,
            uvIndex,
            humidity,
            precipitationProb,
            totalScore
        });

        return {
            totalScore,
            rating,
            breakdown: {
                pm25: Math.round(pm25Score),
                heat: Math.round(heatScore),
                uv: Math.round(uvScore),
                humidity: Math.round(humidityScore),
                windRain: Math.round(windRainScore)
            },
            advisories
        };
    }

    /**
     * Determines rating tier based on numerical score.
     */
    static evaluateRating(score) {
        if (score >= 90) {
            return {
                grade: 'A+',
                label: 'Excellent',
                statusText: 'Optimal Living Conditions',
                color: 'emerald',
                textClass: 'text-emerald-400',
                bgClass: 'bg-emerald-500/15',
                borderClass: 'border-emerald-500/30',
                strokeColor: '#34d399'
            };
        } else if (score >= 75) {
            return {
                grade: 'A',
                label: 'Good',
                statusText: 'Comfortable & Safe',
                color: 'cyan',
                textClass: 'text-cyan-400',
                bgClass: 'bg-cyan-500/15',
                borderClass: 'border-cyan-500/30',
                strokeColor: '#22d3ee'
            };
        } else if (score >= 55) {
            return {
                grade: 'B',
                label: 'Moderate',
                statusText: 'Minor Environmental Fatigue',
                color: 'amber',
                textClass: 'text-amber-400',
                bgClass: 'bg-amber-500/15',
                borderClass: 'border-amber-500/30',
                strokeColor: '#fbbf24'
            };
        } else if (score >= 35) {
            return {
                grade: 'C',
                label: 'Poor',
                statusText: 'Substandard Air or High Heat',
                color: 'orange',
                textClass: 'text-orange-400',
                bgClass: 'bg-orange-500/15',
                borderClass: 'border-orange-500/30',
                strokeColor: '#fb923c'
            };
        } else {
            return {
                grade: 'D',
                label: 'Hazardous',
                statusText: 'Extreme Environmental Stress',
                color: 'rose',
                textClass: 'text-rose-400',
                bgClass: 'bg-rose-500/15',
                borderClass: 'border-rose-500/30',
                strokeColor: '#f43f5e'
            };
        }
    }

    /**
     * Generates practical, human-centered lifestyle recommendations.
     */
    static generateAdvisories({ pm25, apparentTemp, uvIndex, precipitationProb, totalScore }) {
        // 1. Mask Wearing
        let mask = {
            title: 'Mask',
            icon: 'shield-alert',
            status: 'Optional',
            detail: 'Air is clean and fresh',
            badgeClass: 'bg-emerald-500/15 text-emerald-400'
        };
        if (pm25 > 50) {
            mask = {
                title: 'Mask',
                icon: 'shield-alert',
                status: 'Required (N95)',
                detail: 'Harmful dust level outdoors',
                badgeClass: 'bg-rose-500/15 text-rose-400'
            };
        } else if (pm25 > 25) {
            mask = {
                title: 'Mask',
                icon: 'shield-alert',
                status: 'Recommended',
                detail: 'Sensitive individuals should wear mask',
                badgeClass: 'bg-amber-500/15 text-amber-400'
            };
        }

        // 2. Outdoor Activities & Workouts
        let outdoor = {
            title: 'Outdoor Workout',
            icon: 'activity',
            status: 'Safe',
            detail: 'Ideal for running & cycling',
            badgeClass: 'bg-emerald-500/15 text-emerald-400'
        };
        if (totalScore < 40 || pm25 > 50 || apparentTemp > 40) {
            outdoor = {
                title: 'Outdoor Workout',
                icon: 'activity',
                status: 'Avoid',
                detail: 'High physical strain risk; exercise indoors',
                badgeClass: 'bg-rose-500/15 text-rose-400'
            };
        } else if (totalScore < 60 || pm25 > 35 || apparentTemp > 35) {
            outdoor = {
                title: 'Outdoor Workout',
                icon: 'activity',
                status: 'Moderate',
                detail: 'Limit high-intensity cardio outdoors',
                badgeClass: 'bg-amber-500/15 text-amber-400'
            };
        }

        // 3. Room Ventilation
        let ventilation = {
            title: 'Home Ventilation',
            icon: 'wind',
            status: 'Open Windows',
            detail: 'Great natural air circulation',
            badgeClass: 'bg-emerald-500/15 text-emerald-400'
        };
        if (pm25 > 35) {
            ventilation = {
                title: 'Home Ventilation',
                icon: 'wind',
                status: 'Keep Closed',
                detail: 'Run air purifiers indoors',
                badgeClass: 'bg-rose-500/15 text-rose-400'
            };
        }

        // 4. Sun Protection (UV)
        let sun;
        if (uvIndex <= 0) {
            sun = {
                title: 'Sun Protection',
                icon: 'moon',
                status: 'None Needed',
                detail: 'Nighttime / Zero UV exposure',
                badgeClass: 'bg-slate-800 text-slate-400'
            };
        } else if (uvIndex >= 8) {
            sun = {
                title: 'Sun Protection',
                icon: 'sun',
                status: 'SPF 50+ Required',
                detail: 'Wear hat, sunglasses & sunscreen',
                badgeClass: 'bg-rose-500/15 text-rose-400'
            };
        } else if (uvIndex >= 5) {
            sun = {
                title: 'Sun Protection',
                icon: 'sun',
                status: 'SPF 30+ Advised',
                detail: 'Apply sunscreen during midday',
                badgeClass: 'bg-amber-500/15 text-amber-400'
            };
        } else {
            sun = {
                title: 'Sun Protection',
                icon: 'sun',
                status: 'Low Risk',
                detail: 'No special protection needed',
                badgeClass: 'bg-emerald-500/15 text-emerald-400'
            };
        }

        // 5. Rain / Commute
        let rain = {
            title: 'Commute',
            icon: 'umbrella',
            status: 'Dry',
            detail: 'Clear roads, low rain chance',
            badgeClass: 'bg-emerald-500/15 text-emerald-400'
        };
        if (precipitationProb >= 60) {
            rain = {
                title: 'Commute',
                icon: 'umbrella',
                status: 'Rain Likely',
                detail: 'Carry an umbrella & drive carefully',
                badgeClass: 'bg-cyan-500/15 text-cyan-400'
            };
        } else if (precipitationProb >= 30) {
            rain = {
                title: 'Commute',
                icon: 'umbrella',
                status: 'Chance of Rain',
                detail: 'Scattered showers possible',
                badgeClass: 'bg-amber-500/15 text-amber-400'
            };
        }

        return [mask, outdoor, ventilation, sun, rain];
    }
}
