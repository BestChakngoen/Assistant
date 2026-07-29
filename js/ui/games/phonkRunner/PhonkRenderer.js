/**
 * PhonkRenderer.js - Pure Canvas Overlay & HUD Renderer
 * Encapsulates HUD, HP slide bar, ground line, scanlines, and screen overlays for Phonk Runner
 */
import { PHONK_CONFIG } from './PhonkConfig.js';

export class PhonkRenderer {
    constructor(ctx, config) {
        this.ctx = ctx;
        this.W = config.W;
        this.H = config.H;
        this.GROUND = config.GROUND;
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

    drawGround(entities) {
        const pits = entities.pits;
        let currentX = 0;

        for (const pit of pits) {
            if (pit.x > currentX) {
                const segW = pit.x - currentX;
                // Pure Glowing Neon Orange Line Platform (Exact Flush Y = GROUND)
                this.glowRect(currentX, this.GROUND, segW, 3, PHONK_CONFIG.COLORS.PLATFORM_ORANGE, 16);
                this.glowRect(currentX, this.GROUND - 1, segW, 2, '#ffaa00', 8);
            }
            currentX = pit.x + pit.w;
        }

        if (currentX < this.W) {
            const segW = this.W - currentX;
            // Pure Glowing Neon Orange Line Platform (Exact Flush Y = GROUND)
            this.glowRect(currentX, this.GROUND, segW, 3, PHONK_CONFIG.COLORS.PLATFORM_ORANGE, 16);
            this.glowRect(currentX, this.GROUND - 1, segW, 2, '#ffaa00', 8);
        }

        entities.drawPits();
    }

    drawHpBar(player) {
        const ctx = this.ctx;
        ctx.save();
        const barW = 150;
        const barH = 10;
        const barX = 15;
        const barY = 12;

        // Outer Capsule Frame at Top-Left
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.fillRect(barX - 3, barY - 3, barW + 6, barH + 6);
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX - 3, barY - 3, barW + 6, barH + 6);

        // Inner Fill ratio
        const ratio = Math.max(0, player.hp / player.maxHp);
        const fillW = Math.round(barW * ratio);

        let hpColor = '#22c55e';
        if (ratio < 0.25) hpColor = '#ff0055';
        else if (ratio < 0.5) hpColor = '#eab308';

        if (fillW > 0) {
            this.glowRect(barX, barY, fillW, barH, hpColor, 10);
        }
        ctx.restore();
    }

    drawScore(score) {
        const ctx = this.ctx;
        ctx.save();
        ctx.font = 'bold 12px monospace';
        ctx.shadowColor = PHONK_CONFIG.COLORS.SCORE_GOLD || '#fde047';
        ctx.shadowBlur = 8;
        ctx.fillStyle = '#fde047';
        ctx.fillText('SCORE: ' + Math.floor(score).toString().padStart(6, '0'), 15, 38);
        ctx.restore();
    }

    drawDistanceProgressBar(distanceScore, intervalM = 1000) {
        const ctx = this.ctx;
        ctx.save();
        const barW = 200;
        const barH = 8;
        const barX = this.W / 2 - barW / 2;
        const barY = 12;

        // Progress Bar Frame
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.fillRect(barX - 2, barY - 2, barW + 4, barH + 4);
        ctx.strokeStyle = 'rgba(192, 132, 252, 0.5)';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX - 2, barY - 2, barW + 4, barH + 4);

        // Milestone Progress Ratio (0 to 1000m reset loop)
        const currentDist = distanceScore % intervalM;
        const ratio = Math.min(1, Math.max(0, currentDist / intervalM));
        const fillW = Math.round(barW * ratio);

        if (fillW > 0) {
            this.glowRect(barX, barY, fillW, barH, PHONK_CONFIG.COLORS.CYAN_NEON, 8);
        }

        // Mini Runner Icon moving along the progress bar
        const runnerX = barX + fillW;
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 8;
        ctx.fillRect(runnerX - 3, barY - 3, 6, 14);

        // Target HP Potion Icon at the right end of the progress bar
        const potX = barX + barW + 10;
        const potY = barY - 4;
        ctx.shadowColor = '#22c55e';
        ctx.shadowBlur = 12;
        ctx.fillStyle = '#065f46';
        ctx.fillRect(potX, potY, 12, 16);
        this.glowRect(potX + 2, potY + 4, 8, 10, '#22c55e', 6);

        ctx.restore();
    }

    drawPauseButton(isPaused) {
        const ctx = this.ctx;
        ctx.save();
        const btnW = 34;
        const btnH = 24;
        const btnX = this.W - 48;
        const btnY = 10;

        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.fillRect(btnX, btnY, btnW, btnH);
        ctx.strokeStyle = PHONK_CONFIG.COLORS.CYAN_NEON;
        ctx.lineWidth = 1;
        ctx.strokeRect(btnX, btnY, btnW, btnH);

        ctx.font = 'bold 12px monospace';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.shadowColor = PHONK_CONFIG.COLORS.CYAN_NEON;
        ctx.shadowBlur = 6;
        ctx.fillText(isPaused ? '▶' : '❚❚', btnX + btnW / 2, btnY + 16);
        ctx.textAlign = 'left';
        ctx.restore();
    }

    drawPauseScreen() {
        const ctx = this.ctx;
        ctx.save();
        ctx.globalAlpha = 0.72;
        ctx.fillStyle = '#04000a';
        ctx.fillRect(0, 0, this.W, this.H);
        ctx.globalAlpha = 1;
        ctx.textAlign = 'center';
        ctx.font = 'bold 20px monospace';
        ctx.shadowColor = PHONK_CONFIG.COLORS.CYAN_NEON;
        ctx.shadowBlur = 20;
        ctx.fillStyle = PHONK_CONFIG.COLORS.CYAN_NEON;
        ctx.fillText('// GAME PAUSED //', this.W / 2, this.H / 2 - 10);
        ctx.font = '11px monospace';
        ctx.fillStyle = '#e9d5ff';
        ctx.shadowColor = PHONK_CONFIG.COLORS.PURPLE_NEON;
        ctx.shadowBlur = 10;
        ctx.fillText('[ PRESS P / CLICK PAUSE BUTTON TO RESUME ]', this.W / 2, this.H / 2 + 18);
        ctx.textAlign = 'left';
        ctx.restore();
    }

    drawScanlines() {
        const ctx = this.ctx;
        ctx.save();
        ctx.globalAlpha = 0.02;
        ctx.fillStyle = '#000';
        for (let y = 0; y < this.H; y += 4) {
            ctx.fillRect(0, y, this.W, 1);
        }
        const vg = ctx.createRadialGradient(this.W / 2, this.H / 2, this.H * 0.4, this.W / 2, this.H / 2, this.H);
        vg.addColorStop(0, 'transparent');
        vg.addColorStop(1, 'rgba(0,0,0,0.25)');
        ctx.globalAlpha = 1;
        ctx.fillStyle = vg;
        ctx.fillRect(0, 0, this.W, this.H);
        ctx.restore();
    }

    drawDeathScreen(score, deathTimer, frame, hiScore = 0, isNewRecord = false) {
        if (deathTimer <= 15) return;
        const ctx = this.ctx;
        ctx.save();
        ctx.globalAlpha = Math.min((deathTimer - 15) / 15, 0.78);
        ctx.fillStyle = '#08000f';
        ctx.fillRect(0, 0, this.W, this.H);
        ctx.globalAlpha = 1;
        ctx.textAlign = 'center';
        ctx.font = 'bold 20px monospace';
        ctx.shadowColor = PHONK_CONFIG.COLORS.DANGER_RED;
        ctx.shadowBlur = 24;
        ctx.fillStyle = PHONK_CONFIG.COLORS.DANGER_RED;
        ctx.fillText('// UNIT-808 CAPTURED //', this.W / 2, this.H / 2 - 32);

        ctx.font = 'bold 13px monospace';
        ctx.fillStyle = PHONK_CONFIG.COLORS.PURPLE_NEON;
        ctx.shadowColor = PHONK_CONFIG.COLORS.PURPLE_NEON;
        ctx.shadowBlur = 12;
        ctx.fillText('FINAL SCORE: ' + Math.floor(score).toString().padStart(6, '0'), this.W / 2, this.H / 2 - 10);

        ctx.font = 'bold 12px monospace';
        if (isNewRecord) {
            ctx.fillStyle = '#fde047';
            ctx.shadowColor = '#fde047';
            ctx.shadowBlur = 18;
            ctx.fillText('🏆 NEW HIGH SCORE: ' + Math.floor(hiScore).toString().padStart(6, '0') + ' 🏆', this.W / 2, this.H / 2 + 10);
        } else {
            ctx.fillStyle = '#fef08a';
            ctx.shadowColor = '#eab308';
            ctx.shadowBlur = 10;
            ctx.fillText('HIGH SCORE: ' + Math.floor(hiScore).toString().padStart(6, '0'), this.W / 2, this.H / 2 + 10);
        }

        if (Math.floor(frame / 30) % 2 === 0) {
            ctx.font = '11px monospace';
            ctx.fillStyle = '#67e8f9';
            ctx.shadowColor = PHONK_CONFIG.COLORS.CYAN_NEON;
            ctx.shadowBlur = 10;
            ctx.fillText('[ PRESS SPACE / TAP TO ESCAPE AGAIN ]', this.W / 2, this.H / 2 + 34);
        }
        ctx.textAlign = 'left';
        ctx.restore();
    }

    drawIdleScreen(frame, hiScore = 0) {
        const ctx = this.ctx;
        ctx.save();
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = '#04000a';
        ctx.fillRect(0, 0, this.W, this.H);
        ctx.globalAlpha = 1;
        ctx.font = 'bold 18px monospace';
        ctx.shadowColor = PHONK_CONFIG.COLORS.PURPLE_NEON;
        ctx.shadowBlur = 20;
        ctx.fillStyle = PHONK_CONFIG.COLORS.PURPLE_NEON;
        ctx.textAlign = 'center';
        const glitch = frame % 20 < 2;
        ctx.fillText(glitch ? '⚡ UNIT-808: LAB ESCAPE ⚡' : '⚡ UNIT-808: LAB ESCAPE ⚡', this.W / 2 + (glitch ? 3 : 0), this.H / 2 - 20);

        ctx.font = 'bold 12px monospace';
        ctx.fillStyle = '#fde047';
        ctx.shadowColor = '#fde047';
        ctx.shadowBlur = 12;
        ctx.fillText('🏆 HIGH SCORE: ' + Math.floor(hiScore).toString().padStart(6, '0'), this.W / 2, this.H / 2 + 2);

        ctx.font = '10px monospace';
        ctx.fillStyle = PHONK_CONFIG.COLORS.CYAN_NEON;
        ctx.shadowColor = PHONK_CONFIG.COLORS.CYAN_NEON;
        ctx.shadowBlur = 8;
        ctx.fillText('SPACE / ⬆️ = JUMP  |  SHIFT / ⬇️ = SLIDE  |  DODGE PITS & OVERHEAD LASERS', this.W / 2, this.H / 2 + 24);
        ctx.textAlign = 'left';
        ctx.restore();
    }
}
