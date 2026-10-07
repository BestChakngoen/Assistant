/**
 * PhonkObstacles.js - Obstacles, Pits & Collision Detection Subsystem
 * Manages Spikes, High Drones, High Lasers, Ground Walls, Pit Holes, and AABB Collision
 */
import { PHONK_CONFIG } from './PhonkConfig.js';

export class PhonkObstacles {
    constructor(ctx, config) {
        this.ctx = ctx;
        this.W = config.W;
        this.H = config.H;
        this.GROUND = config.GROUND;

        this.obstacles = [];
        this.pits = [];
    }

    reset() {
        this.obstacles = [];
        this.pits = [];
    }

    px(x, y, w, h, color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
    }

    glowRect(x, y, w, h, color, blur) {
        this.ctx.save();
        this.ctx.shadowColor = color;
        this.ctx.shadowBlur = blur;
        this.ctx.fillStyle = color;
        this.ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
        this.ctx.restore();
    }

    spawnObstacleOrPit(level, itemManager) {
        // Safe Zone: Stop spawning obstacles & pits when HP Potion is approaching or active on screen
        if (itemManager && (itemManager.isPotionApproaching || itemManager.hpPotions.length > 0)) return;

        // Spawn Floating Platforms via itemManager if available
        if (itemManager && Math.random() < (PHONK_CONFIG.SPAWN.FLOATING_PLATFORM_CHANCE || 0.35)) {
            itemManager.spawnFloatingPlatform();
        }

        const roll = Math.random();
        
        const lastObstacle = this.obstacles[this.obstacles.length - 1];
        const lastPit = this.pits[this.pits.length - 1];
        const lastX = Math.max(
            lastObstacle ? lastObstacle.x + lastObstacle.w : 0,
            lastPit ? lastPit.x + lastPit.w : 0
        );

        if (lastX > this.W - 140) return;

        // Pit spawn check
        if (roll < PHONK_CONFIG.SPAWN.PIT_CHANCE) {
            const pitW = Math.min(130, PHONK_CONFIG.SPAWN.PIT_MIN_WIDTH + Math.random() * (PHONK_CONFIG.SPAWN.PIT_MAX_BONUS_WIDTH + level * 5));
            const pitX = this.W + 20;
            this.pits.push({ x: pitX, w: pitW });
            if (itemManager) {
                itemManager.spawnGuidingPath('pit_arc', pitX, { pitW });
            }
            return;
        }

        // All 4 obstacle types ('spike', 'high_drone', 'wall', 'high_laser') available from Level 1
        const types = ['spike', 'high_drone', 'wall', 'high_laser'];
        const type = types[Math.floor(Math.random() * types.length)];

        if (type === 'spike') {
            const count = 1 + Math.floor(Math.random() * (level < 5 ? 2 : 3));
            const width = count * 22;
            for (let i = 0; i < count; i++) {
                this.obstacles.push({
                    x: this.W + i * 22,
                    y: this.GROUND - 24,
                    w: 18,
                    h: 24,
                    type: 'spike'
                });
            }
            if (itemManager) {
                itemManager.spawnGuidingPath('spike_arc', this.W, { width });
            }
        } else if (type === 'high_drone' || type === 'high_laser') {
            const overheadY = this.GROUND - 50;
            const width = type === 'high_laser' ? 48 : 34;
            this.obstacles.push({
                x: this.W,
                y: overheadY,
                w: width,
                h: 16,
                type: type,
                floatT: 0
            });
            if (itemManager) {
                itemManager.spawnGuidingPath('slide_line', this.W, { width });
            }
        } else {
            this.obstacles.push({
                x: this.W,
                y: this.GROUND - 44,
                w: 18,
                h: 44,
                type: 'wall'
            });
            if (itemManager) {
                itemManager.spawnGuidingPath('spike_arc', this.W, { width: 18 });
            }
        }
    }

    isOverPit(x, w) {
        const footCenter = x + w / 2;
        for (const pit of this.pits) {
            // Player only falls if pit width is >= player body width (pit.w >= w)
            if (pit.w >= w && footCenter >= pit.x + 6 && footCenter <= pit.x + pit.w - 6) {
                return true;
            }
        }
        return false;
    }

    checkCollision(player) {
        const px_ = player.x + 3;
        const py_ = player.y + 3;
        const pw = player.w - 6;
        const ph = player.h - 5;

        for (const ob of this.obstacles) {
            let ox = ob.x;
            let oy = ob._ry !== undefined ? ob._ry : ob.y;
            let ow = ob.w;
            let oh = ob.h;

            ox += 2;
            ow -= 4;

            if (px_ < ox + ow && px_ + pw > ox && py_ < oy + oh && py_ + ph > oy) {
                return true;
            }
        }
        return false;
    }

    destroyCollidingObstacles(player, particleFX) {
        const px_ = player.x + 3;
        const py_ = player.y + 3;
        const pw = player.w - 6;
        const ph = player.h - 5;

        let destroyed = false;

        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const ob = this.obstacles[i];
            let ox = ob.x;
            let oy = ob._ry !== undefined ? ob._ry : ob.y;
            let ow = ob.w;
            let oh = ob.h;

            ox += 2;
            ow -= 4;

            if (px_ < ox + ow && px_ + pw > ox && py_ < oy + oh && py_ + ph > oy) {
                if (particleFX) {
                    for (let k = 0; k < 12; k++) {
                        particleFX.particles.push({
                            x: ob.x + ob.w / 2,
                            y: (ob._ry !== undefined ? ob._ry : ob.y) + ob.h / 2,
                            vx: (Math.random() - 0.5) * 9,
                            vy: (Math.random() - 0.5) * 9,
                            life: 25,
                            color: Math.random() > 0.5 ? '#fde047' : '#ff0055',
                            size: 3 + Math.random() * 4
                        });
                    }
                }
                this.obstacles.splice(i, 1);
                destroyed = true;
            }
        }
        return destroyed;
    }

    drawPits() {
        const ctx = this.ctx;
        for (const pit of this.pits) {
            ctx.save();
            this.glowRect(pit.x - 4, this.GROUND, 5, 14, PHONK_CONFIG.COLORS.DANGER_RED, 16);
            this.glowRect(pit.x + pit.w - 1, this.GROUND, 5, 14, PHONK_CONFIG.COLORS.DANGER_RED, 16);

            ctx.fillStyle = PHONK_CONFIG.COLORS.OBSTACLE_YELLOW;
            ctx.fillRect(Math.round(pit.x - 8), this.GROUND, 8, 3);
            ctx.fillRect(Math.round(pit.x + pit.w), this.GROUND, 8, 3);

            ctx.fillStyle = PHONK_CONFIG.COLORS.DANGER_RED;
            ctx.fillRect(Math.round(pit.x - 4), this.GROUND, 4, 3);
            ctx.fillRect(Math.round(pit.x + pit.w), this.GROUND, 4, 3);
            ctx.restore();
        }
    }

    drawObstacle(ob, frame) {
        const ctx = this.ctx;
        ctx.save();

        if (ob.type === 'spike') {
            ctx.shadowColor = PHONK_CONFIG.COLORS.DANGER_RED;
            ctx.shadowBlur = 18;
            const hw = ob.w / 2;

            for (let i = 0; i < ob.w; i++) {
                const colH = Math.round((ob.h * (i < hw ? i / hw : (ob.w - i) / hw)));
                ctx.fillStyle = i % 2 === 0 ? PHONK_CONFIG.COLORS.DANGER_RED : '#ff2266';
                ctx.fillRect(Math.round(ob.x + i), Math.round(ob.y + ob.h - colH), 1, colH);

                if (colH > ob.h - 6) {
                    ctx.fillStyle = (i === Math.floor(hw) || i === Math.floor(hw) - 1)
                        ? '#ffffff'
                        : PHONK_CONFIG.COLORS.OBSTACLE_YELLOW;
                    ctx.fillRect(Math.round(ob.x + i), Math.round(ob.y + ob.h - colH), 1, 3);
                }
            }

            this.glowRect(ob.x - 1, ob.y + ob.h - 3, ob.w + 2, 3, PHONK_CONFIG.COLORS.DANGER_RED, 12);
            this.glowRect(ob.x + ob.w / 2 - 2, ob.y + ob.h - 2, 4, 2, PHONK_CONFIG.COLORS.OBSTACLE_YELLOW, 8);

        } else if (ob.type === 'high_drone') {
            ob.floatT += 0.05;
            const floatY = ob.y + Math.sin(ob.floatT) * 4;

            ctx.shadowColor = PHONK_CONFIG.COLORS.CYAN_NEON;
            ctx.shadowBlur = 22;

            const beamAlpha = 0.25 + Math.sin(frame * 0.2) * 0.1;
            ctx.fillStyle = `rgba(0, 240, 255, ${beamAlpha})`;
            ctx.fillRect(Math.round(ob.x + 6), Math.round(floatY + ob.h), ob.w - 12, this.GROUND - floatY - ob.h);

            this.px(ob.x + 4, floatY + 2, ob.w - 8, ob.h - 4, '#0e7490');
            this.glowRect(ob.x + 8, floatY + 4, ob.w - 16, ob.h - 8, PHONK_CONFIG.COLORS.CYAN_NEON, 10);
            this.px(ob.x + 12, floatY + 6, ob.w - 24, ob.h - 12, '#ffffff');

            const rotorPhase = Math.sin(frame * 0.6) * 4;
            this.glowRect(ob.x - 2, floatY + 1, 7, 2, '#ffffff', 10);
            this.glowRect(ob.x + ob.w - 5, floatY + 1, 7, 2, '#ffffff', 10);
            this.glowRect(ob.x + rotorPhase, floatY + 3, 6, 2, PHONK_CONFIG.COLORS.CYAN_LIGHT, 8);
            this.glowRect(ob.x + ob.w - 6 - rotorPhase, floatY + 3, 6, 2, PHONK_CONFIG.COLORS.CYAN_LIGHT, 8);

            const strobeColor = Math.floor(frame / 8) % 2 === 0 ? PHONK_CONFIG.COLORS.OBSTACLE_YELLOW : PHONK_CONFIG.COLORS.DANGER_RED;
            this.glowRect(ob.x + ob.w / 2 - 3, floatY + ob.h - 4, 6, 4, strobeColor, 14);

            ob._ry = floatY;

        } else if (ob.type === 'high_laser') {
            ctx.shadowColor = PHONK_CONFIG.COLORS.DANGER_RED;
            ctx.shadowBlur = 24;

            this.px(ob.x - 2, ob.y - 2, 7, ob.h + 4, '#be123c');
            this.px(ob.x + ob.w - 5, ob.y - 2, 7, ob.h + 4, '#be123c');
            this.glowRect(ob.x - 1, ob.y + 4, 5, 8, PHONK_CONFIG.COLORS.CYAN_NEON, 10);
            this.glowRect(ob.x + ob.w - 4, ob.y + 4, 5, 8, PHONK_CONFIG.COLORS.CYAN_NEON, 10);

            const beamFlicker = Math.random() * 3;
            this.glowRect(ob.x + 4, ob.y + 3, ob.w - 8, 10 + beamFlicker, PHONK_CONFIG.COLORS.DANGER_RED, 20);
            this.px(ob.x + 4, ob.y + 5, ob.w - 8, 6, '#ff4488');
            this.px(ob.x + 4, ob.y + 7, ob.w - 8, 2, '#ffffff');

            ctx.save();
            ctx.fillStyle = '#090014';
            ctx.fillRect(Math.round(ob.x + ob.w / 2 - 24), Math.round(ob.y - 15), 48, 12);
            ctx.strokeStyle = PHONK_CONFIG.COLORS.OBSTACLE_YELLOW;
            ctx.lineWidth = 1;
            ctx.strokeRect(Math.round(ob.x + ob.w / 2 - 24), Math.round(ob.y - 15), 48, 12);

            ctx.fillStyle = PHONK_CONFIG.COLORS.OBSTACLE_YELLOW;
            ctx.font = 'bold 9px monospace';
            ctx.textAlign = 'center';
            ctx.shadowColor = PHONK_CONFIG.COLORS.OBSTACLE_YELLOW;
            ctx.shadowBlur = 6;
            ctx.fillText('⬇️ SLIDE', ob.x + ob.w / 2, ob.y - 6);
            ctx.restore();

            ob._ry = ob.y;

        } else if (ob.type === 'wall') {
            ctx.shadowColor = PHONK_CONFIG.COLORS.OBSTACLE_ORANGE;
            ctx.shadowBlur = 20;

            this.px(ob.x, ob.y, ob.w, this.GROUND - ob.y, PHONK_CONFIG.COLORS.OBSTACLE_ORANGE);

            for (let wy = ob.y + 2; wy < this.GROUND - 2; wy += 8) {
                const isYellow = (wy + frame * 2) % 16 < 8;
                this.px(ob.x + 2, wy, ob.w - 4, 6, isYellow ? PHONK_CONFIG.COLORS.OBSTACLE_YELLOW : '#7c2d12');
            }

            this.glowRect(ob.x - 2, ob.y - 4, ob.w + 4, 4, '#ffffff', 14);
            this.glowRect(ob.x, ob.y, 2, this.GROUND - ob.y, '#ffffff', 8);
            this.glowRect(ob.x + ob.w - 2, ob.y, 2, this.GROUND - ob.y, '#ffffff', 8);
        }

        ctx.restore();
    }
}
