/**
 * PhonkPlayer.js - Robot Unit-808 Character State & Renderer
 * Encapsulates Unit-808 state, jump/slide animations, hit recoil, and pixel-art rendering
 */
import { PHONK_CONFIG } from './PhonkConfig.js';

export class PhonkPlayer {
    constructor(GROUND) {
        this.GROUND = GROUND;
        this.reset();
    }

    reset() {
        this.x = PHONK_CONFIG.CHARACTER.SPAWN_X;
        this.y = this.GROUND - PHONK_CONFIG.CHARACTER.STAND_H;
        this.w = PHONK_CONFIG.CHARACTER.STAND_W;
        this.h = PHONK_CONFIG.CHARACTER.STAND_H;
        this.vy = 0;
        this.jumps = 0;
        this.maxJumps = PHONK_CONFIG.PHYSICS.MAX_JUMPS;
        this.animFrame = 0;
        this.animTimer = 0;
        this.dead = false;
        this.deathTimer = 0;
        this.isSliding = false;
        this.fallingInPit = false;
        this.spinAngle = 0;
        this.hp = PHONK_CONFIG.HP.MAX_HP;
        this.maxHp = PHONK_CONFIG.HP.MAX_HP;
        this.invincibleTimer = 0;
        this.hitRecoiling = 0;
        this.blastTimer = 0;
        this.giantTimer = 0;
        this.magnetTimer = 0;
        this.currentScale = 1.0;
    }

    updateScale(targetScale) {
        // Smooth lerp transition towards targetScale (growth & shrink animation)
        this.currentScale += (targetScale - this.currentScale) * 0.12;

        const baseW = this.isSliding ? PHONK_CONFIG.CHARACTER.SLIDE_W : PHONK_CONFIG.CHARACTER.STAND_W;
        const baseH = this.isSliding ? PHONK_CONFIG.CHARACTER.SLIDE_H : PHONK_CONFIG.CHARACTER.STAND_H;

        this.w = baseW * this.currentScale;
        this.h = baseH * this.currentScale;
    }

    px(ctx, x, y, w, h, color) {
        ctx.fillStyle = color;
        ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
    }

    glowRect(ctx, x, y, w, h, color, blur) {
        ctx.save();
        ctx.shadowColor = color;
        ctx.shadowBlur = blur;
        ctx.fillStyle = color;
        ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
        ctx.restore();
    }

    draw(ctx, frame, particleFx) {
        const baseW = this.isSliding ? PHONK_CONFIG.CHARACTER.SLIDE_W : PHONK_CONFIG.CHARACTER.STAND_W;
        const baseH = this.isSliding ? PHONK_CONFIG.CHARACTER.SLIDE_H : PHONK_CONFIG.CHARACTER.STAND_H;

        const px_ = Math.round(this.x);
        const py_ = Math.round(this.y + (this.h - baseH));
        const pw = baseW;
        const ph = baseH;
        const airborne = this.y < this.GROUND - this.h - 1;

        ctx.save();

        // GIANT POWER-UP MODE EFFECTS
        if (this.giantTimer > 0) {
            this.giantTimer--;
            ctx.shadowColor = '#c084fc';
            ctx.shadowBlur = 28 * this.currentScale;
        }

        // Smooth Foot-Anchored Scale Transform for Body & Jet Boost Flame
        if (Math.abs(this.currentScale - 1.0) > 0.01) {
            const footX = px_ + pw / 2;
            const footY = py_ + ph;
            ctx.translate(footX, footY);
            ctx.scale(this.currentScale, this.currentScale);
            ctx.translate(-footX, -footY);
        }

        // MAGNET POWER-UP MODE EFFECTS
        if (this.magnetTimer > 0) {
            this.magnetTimer--;
            const pulseR = 24 + Math.sin(frame * 0.2) * 6;
            ctx.save();
            ctx.shadowColor = frame % 10 < 5 ? '#ff0055' : '#00f0ff';
            ctx.shadowBlur = 18;
            ctx.strokeStyle = frame % 10 < 5 ? 'rgba(255, 0, 85, 0.7)' : 'rgba(0, 240, 255, 0.7)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(px_ + pw / 2, py_ + ph / 2, pulseR, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        // BLAST POWER-UP MODE EFFECTS (Jet flame drawn inside foot-scaled space for perfect alignment!)
        if (this.blastTimer > 0) {
            this.blastTimer--;

            // Supersonic jet flame proportionally attached to center-back thruster
            const jetLength = 24 + Math.sin(frame * 0.8) * 8;
            this.glowRect(ctx, px_ - jetLength, py_ + ph / 2 - 4, jetLength, 8, '#fde047', 18);
            this.glowRect(ctx, px_ - jetLength + 6, py_ + ph / 2 - 2, jetLength - 6, 4, '#00f0ff', 12);
            this.glowRect(ctx, px_ - jetLength + 12, py_ + ph / 2 - 1, jetLength - 12, 2, '#ffffff', 8);

            ctx.shadowColor = '#fde047';
            ctx.shadowBlur = 24;

            if (particleFx) particleFx.spawnBlastParticles(this);
        }

        if (this.dead) {
            const t = this.deathTimer / 30;
            const pieces = [
                [0, 0, 12, 12, PHONK_CONFIG.COLORS.CYAN_LIGHT],
                [12, 0, 12, 12, PHONK_CONFIG.COLORS.PURPLE_NEON],
                [0, 12, 12, 12, PHONK_CONFIG.COLORS.DANGER_RED],
                [12, 12, 12, 12, '#64748b']
            ];
            pieces.forEach((pc, i) => {
                const dx = (i % 2 === 0 ? -1.2 : 1.2) * t * 20;
                const dy = -t * 12 + t * t * 25;
                ctx.globalAlpha = Math.max(0, 1 - t);
                this.px(ctx, px_ + pc[0] + dx, py_ + pc[1] + dy, pc[2], pc[3], pc[4]);
            });
            ctx.globalAlpha = 1;
            ctx.restore();
            return;
        }

        // Invincibility i-frame flashing (ONLY during post-collision damage recoil!)
        if (this.invincibleTimer > 0 && this.blastTimer <= 0 && this.giantTimer <= 0) {
            this.invincibleTimer--;
            if (Math.floor(frame / 3) % 2 === 0) {
                ctx.globalAlpha = 0.35;
            }
        }

        // Hit recoil effect
        if (this.hitRecoiling > 0) {
            this.hitRecoiling--;
            ctx.translate(-5, 0);
            ctx.shadowColor = PHONK_CONFIG.COLORS.DANGER_RED;
            ctx.shadowBlur = 24;
        }

        // SLIDING
        if (this.isSliding && !airborne) {
            ctx.shadowColor = PHONK_CONFIG.COLORS.CYAN_NEON;
            ctx.shadowBlur = 14;

            this.px(ctx, px_ + 4, py_ + 4, pw - 8, ph - 6, '#334155');
            this.px(ctx, px_ + 8, py_ + 2, 18, 10, '#475569');
            this.px(ctx, px_ + pw - 8, py_ + 4, 6, 5, PHONK_CONFIG.COLORS.CYAN_NEON);
            this.glowRect(ctx, px_ + pw - 6, py_ + 5, 4, 3, PHONK_CONFIG.COLORS.CYAN_LIGHT, 8);
            this.glowRect(ctx, px_ + 12, py_ + 6, 5, 5, PHONK_CONFIG.COLORS.PURPLE_NEON, 10);
            this.px(ctx, px_, py_ + ph - 5, pw - 4, 5, '#64748b');

            this.glowRect(ctx, px_ - 8, py_ + ph - 8, 10, 6, PHONK_CONFIG.COLORS.CYAN_NEON, 14);
            this.glowRect(ctx, px_ - 14, py_ + ph - 6, 8, 3, PHONK_CONFIG.COLORS.CYAN_LIGHT, 10);

            if (particleFx) particleFx.spawnSlideParticles(this);
            ctx.restore();
            return;
        }

        // DOUBLE JUMP
        if (airborne && this.jumps >= 2) {
            // Supersonic Sprinting Afterimage Ghosting Trail in Blast Mode during Double Jump
            if (this.blastTimer > 0) {
                ctx.save();
                ctx.globalAlpha = 0.45;
                this.glowRect(ctx, px_ - 14, py_, pw, ph, '#fde047', 16);
                ctx.globalAlpha = 0.25;
                this.glowRect(ctx, px_ - 26, py_, pw, ph, '#00f0ff', 12);
                ctx.restore();
            }

            this.spinAngle = (this.spinAngle + 0.35) % (Math.PI * 2);
            ctx.translate(px_ + pw / 2, py_ + ph / 2);
            ctx.rotate(this.spinAngle);

            ctx.shadowColor = this.blastTimer > 0 ? '#fde047' : PHONK_CONFIG.COLORS.PURPLE_NEON;
            ctx.shadowBlur = 18;
            this.px(ctx, -10, -12, 20, 24, '#334155');
            this.glowRect(ctx, -6, -6, 12, 12, PHONK_CONFIG.COLORS.PURPLE_NEON, 14);
            this.glowRect(ctx, -8, -2, 16, 4, PHONK_CONFIG.COLORS.CYAN_NEON, 10);

            ctx.restore();
            return;
        }

        // SINGLE JUMP
        if (airborne) {
            // Supersonic Sprinting Afterimage Ghosting Trail in Blast Mode during Single Jump
            if (this.blastTimer > 0) {
                ctx.save();
                ctx.globalAlpha = 0.45;
                this.glowRect(ctx, px_ - 14, py_, pw, ph, '#fde047', 16);
                ctx.globalAlpha = 0.25;
                this.glowRect(ctx, px_ - 26, py_, pw, ph, '#00f0ff', 12);
                ctx.restore();
            }

            ctx.shadowColor = this.blastTimer > 0 ? '#fde047' : PHONK_CONFIG.COLORS.CYAN_LIGHT;
            ctx.shadowBlur = 16;

            this.px(ctx, px_ + 4, py_ + 4, 16, 22, '#334155');
            this.px(ctx, px_ + 6, py_ + 2, 12, 8, '#475569');
            this.glowRect(ctx, px_ + 10, py_ + 4, 8, 4, PHONK_CONFIG.COLORS.CYAN_NEON, 12);
            this.glowRect(ctx, px_ + 8, py_ + 12, 6, 6, PHONK_CONFIG.COLORS.PURPLE_NEON, 14);
            this.px(ctx, px_ + 4, py_ + 24, 6, 8, '#64748b');
            this.px(ctx, px_ + 12, py_ + 22, 6, 10, '#475569');
            this.glowRect(ctx, px_ + 4, py_ + 30, 5, 4, '#f97316', 12);
            this.glowRect(ctx, px_ + 12, py_ + 30, 5, 4, '#f97316', 12);

            ctx.restore();
            return;
        }

        // RUNNING
        ctx.shadowColor = this.blastTimer > 0 ? '#fde047' : PHONK_CONFIG.COLORS.PURPLE_NEON;
        ctx.shadowBlur = this.blastTimer > 0 ? 24 : 12;

        // Supersonic Sprinting Afterimage Ghosting Trail in Blast Mode
        if (this.blastTimer > 0) {
            ctx.save();
            ctx.globalAlpha = 0.4;
            this.glowRect(ctx, px_ - 12, py_, pw, ph, '#fde047', 16);
            ctx.globalAlpha = 0.22;
            this.glowRect(ctx, px_ - 24, py_, pw, ph, '#00f0ff', 12);
            ctx.restore();
        }

        const af = this.animFrame;

        this.px(ctx, px_ + 6, py_, 12, 9, '#475569');
        this.glowRect(ctx, px_ + 11, py_ + 2, 7, 4, PHONK_CONFIG.COLORS.CYAN_NEON, 10);
        this.px(ctx, px_ + 4, py_ + 9, 16, 4, '#64748b');
        this.px(ctx, px_ + 5, py_ + 12, 14, 12, '#334155');
        this.glowRect(ctx, px_ + 9, py_ + 14, 5, 5, PHONK_CONFIG.COLORS.PURPLE_NEON, 12);

        if (af === 0 || af === 2) {
            this.px(ctx, px_ + 1, py_ + 13, 4, 9, '#475569');
            this.px(ctx, px_ + 18, py_ + 14, 4, 8, '#64748b');
        } else {
            this.px(ctx, px_ + 2, py_ + 15, 4, 7, '#475569');
            this.px(ctx, px_ + 17, py_ + 12, 4, 10, '#64748b');
        }

        const legY = py_ + 24;
        if (af === 0) {
            this.px(ctx, px_ + 4, legY, 5, 10, '#475569');
            this.px(ctx, px_ + 14, legY, 5, 8, '#64748b');
            this.glowRect(ctx, px_ + 14, legY + 8, 6, 2, PHONK_CONFIG.COLORS.CYAN_NEON, 6);
        } else if (af === 1) {
            this.px(ctx, px_ + 2, legY, 6, 7, '#475569');
            this.px(ctx, px_ + 12, legY + 2, 6, 8, '#64748b');
            this.glowRect(ctx, px_ + 12, legY + 8, 6, 2, PHONK_CONFIG.COLORS.CYAN_NEON, 6);
        } else if (af === 2) {
            this.px(ctx, px_ + 13, legY, 5, 10, '#475569');
            this.px(ctx, px_ + 5, legY, 5, 8, '#64748b');
            this.glowRect(ctx, px_ + 5, legY + 8, 6, 2, PHONK_CONFIG.COLORS.CYAN_NEON, 6);
        } else {
            this.px(ctx, px_ + 11, legY, 6, 7, '#475569');
            this.px(ctx, px_ + 3, legY + 2, 6, 8, '#64748b');
            this.glowRect(ctx, px_ + 3, legY + 8, 6, 2, PHONK_CONFIG.COLORS.CYAN_NEON, 6);
        }

        ctx.restore();
    }
}
