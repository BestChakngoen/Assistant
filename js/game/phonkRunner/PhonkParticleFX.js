/**
 * PhonkParticleFX.js - Particle Generator & Renderer Subsystem
 * Manages Jump, Slide, Death, and Heal particle effects for Phonk Runner
 */
import { PHONK_CONFIG } from './PhonkConfig.js';

export class PhonkParticleFX {
    constructor(ctx) {
        this.ctx = ctx;
        this.particles = [];
    }

    reset() {
        this.particles = [];
    }

    glowRect(x, y, w, h, color, blur) {
        const ctx = this.ctx;
        ctx.save();
        ctx.shadowColor = color;
        ctx.shadowBlur = blur;
        ctx.fillStyle = color;
        ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
        ctx.restore();
    }

    spawnJumpParticles(player, jumpCount = 1) {
        const isSecond = jumpCount >= 2;
        const particleCount = isSecond ? 18 : 12;
        const blastX = player.x + player.w / 2;
        const blastY = player.y + player.h - 4;

        // Downward & Outward Blast Thruster Particles
        for (let i = 0; i < particleCount; i++) {
            this.particles.push({
                x: blastX + (Math.random() - 0.5) * 16,
                y: blastY,
                vx: (Math.random() - 0.5) * (isSecond ? 8 : 5),
                vy: Math.random() * 4 + (isSecond ? 2 : 1.5),
                life: isSecond ? 26 : 20,
                color: isSecond 
                    ? (Math.random() > 0.4 ? '#fde047' : PHONK_CONFIG.COLORS.PURPLE_NEON)
                    : (Math.random() > 0.5 ? PHONK_CONFIG.COLORS.CYAN_NEON : PHONK_CONFIG.COLORS.CYAN_LIGHT),
                size: (isSecond ? 3 : 2) + Math.random() * 4
            });
        }

        // Horizontal Sonic Shockwave Blast Ring Trails
        for (let i = 0; i < (isSecond ? 6 : 4); i++) {
            const dir = i % 2 === 0 ? -1 : 1;
            this.particles.push({
                x: blastX,
                y: blastY + (Math.random() - 0.5) * 6,
                vx: dir * (Math.random() * 6 + 4),
                vy: (Math.random() - 0.5) * 1.5,
                life: 16,
                color: isSecond ? '#fde047' : '#00f0ff',
                size: 3 + Math.random() * 3
            });
        }
    }

    spawnSlideParticles(player) {
        if (Math.random() > 0.3) return;
        this.particles.push({
            x: player.x - 2,
            y: player.y + player.h - 3,
            vx: -Math.random() * 3 - 2,
            vy: (Math.random() - 0.5) * 1.5,
            life: 14,
            color: Math.random() > 0.4 ? PHONK_CONFIG.COLORS.CYAN_NEON : PHONK_CONFIG.COLORS.CYAN_LIGHT,
            size: 2 + Math.random() * 2
        });
    }

    spawnDeathParticles(player) {
        for (let i = 0; i < 24; i++) {
            this.particles.push({
                x: player.x + player.w / 2,
                y: player.y + player.h / 2,
                vx: (Math.random() - 0.5) * 9,
                vy: (Math.random() - 0.5) * 9,
                life: 42,
                color: [PHONK_CONFIG.COLORS.DANGER_RED, PHONK_CONFIG.COLORS.PURPLE_NEON, PHONK_CONFIG.COLORS.CYAN_LIGHT, PHONK_CONFIG.COLORS.OBSTACLE_YELLOW][Math.floor(Math.random() * 4)],
                size: 2 + Math.random() * 4
            });
        }
    }

    spawnHealParticles(player) {
        for (let i = 0; i < 14; i++) {
            this.particles.push({
                x: player.x + Math.random() * player.w,
                y: player.y + Math.random() * player.h,
                vx: (Math.random() - 0.5) * 3,
                vy: -Math.random() * 3 - 1,
                life: 30,
                color: Math.random() > 0.4 ? '#22c55e' : '#4ade80',
                size: 2 + Math.random() * 3
            });
        }
    }

    spawnBlastParticles(player) {
        for (let i = 0; i < 3; i++) {
            this.particles.push({
                x: player.x - Math.random() * 15,
                y: player.y + Math.random() * player.h,
                vx: -Math.random() * 8 - 4,
                vy: (Math.random() - 0.5) * 3,
                life: 20,
                color: Math.random() > 0.5 ? '#fde047' : '#00f0ff',
                size: 3 + Math.random() * 4
            });
        }
    }

    spawnOrbParticles(x, y) {
        for (let i = 0; i < 6; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                life: 18,
                color: Math.random() > 0.4 ? PHONK_CONFIG.ORB.CYAN_COLOR : PHONK_CONFIG.ORB.GOLD_COLOR,
                size: 2 + Math.random() * 3
            });
        }
    }

    draw() {
        const ctx = this.ctx;
        this.particles.forEach(p => {
            ctx.save();
            ctx.globalAlpha = Math.max(0, p.life / 40);
            this.glowRect(p.x, p.y, p.size, p.size, p.color, 6);
            ctx.restore();
        });
    }
}
