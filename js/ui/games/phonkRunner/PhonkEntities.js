/**
 * PhonkEntities.js - Player, Obstacle Manager, Particle System & Collision Engine
 */
export class PhonkEntities {
    constructor(ctx, config) {
        this.ctx = ctx;
        this.W = config.W;
        this.H = config.H;
        this.GROUND = config.GROUND;

        this.player = {
            x: 80,
            y: this.GROUND,
            w: 20,
            h: 28,
            vy: 0,
            jumps: 0,
            maxJumps: 2,
            animFrame: 0,
            animTimer: 0,
            dead: false,
            deathTimer: 0,
        };

        this.obstacles = [];
        this.particles = [];
    }

    reset() {
        this.obstacles = [];
        this.particles = [];
        this.player.y = this.GROUND;
        this.player.vy = 0;
        this.player.jumps = 0;
        this.player.dead = false;
        this.player.deathTimer = 0;
        this.player.animFrame = 0;
        this.player.animTimer = 0;
    }

    px(x, y, w, h, color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(Math.round(x), Math.round(y), w, h);
    }

    glowRect(x, y, w, h, color, blur) {
        this.ctx.save();
        this.ctx.shadowColor = color;
        this.ctx.shadowBlur = blur;
        this.ctx.fillStyle = color;
        this.ctx.fillRect(Math.round(x), Math.round(y), w, h);
        this.ctx.restore();
    }

    spawnObstacle(level) {
        const types = ['spike', 'drone', 'wall'];
        const type = types[Math.floor(Math.random() * (level < 5 ? 2 : 3))];
        if (type === 'spike') {
            const maxCount = level < 6 ? 2 : 3;
            const count = 1 + Math.floor(Math.random() * maxCount);
            for (let i = 0; i < count; i++) {
                this.obstacles.push({ x: this.W + i * 24, y: this.GROUND, w: 16, h: 22, type: 'spike' });
            }
        } else if (type === 'drone') {
            const flyH = this.GROUND - 55 - Math.random() * 35;
            this.obstacles.push({ x: this.W, y: flyH, w: 28, h: 14, type: 'drone', floatT: 0 });
        } else {
            this.obstacles.push({ x: this.W, y: this.GROUND - 38, w: 12, h: 38, type: 'wall' });
        }
    }

    spawnJumpParticles() {
        for (let i = 0; i < 6; i++) {
            this.particles.push({
                x: this.player.x + this.player.w / 2,
                y: this.player.y + this.player.h,
                vx: (Math.random() - 0.5) * 3,
                vy: Math.random() * 2 + 0.5,
                life: 25,
                color: Math.random() > 0.5 ? '#a855f7' : '#06b6d4',
                size: 2 + Math.random() * 2
            });
        }
    }

    spawnDeathParticles() {
        for (let i = 0; i < 18; i++) {
            this.particles.push({
                x: this.player.x + this.player.w / 2,
                y: this.player.y + this.player.h / 2,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                life: 40,
                color: ['#f43f5e', '#a855f7', '#f97316', '#06b6d4'][Math.floor(Math.random() * 4)],
                size: 2 + Math.random() * 4
            });
        }
    }

    checkCollision() {
        const px_ = this.player.x + 4;
        const py_ = this.player.y + 4;
        const pw = this.player.w - 8;
        const ph = this.player.h - 6;

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

    drawPlayer() {
        const ctx = this.ctx;
        const player = this.player;
        const px_ = Math.round(player.x);
        const py_ = Math.round(player.y);
        const pw = player.w;
        const ph = player.h;
        const airborne = player.y < this.GROUND - 1;

        ctx.save();
        ctx.shadowColor = '#a855f7';
        ctx.shadowBlur = 14;

        if (player.dead) {
            const t = player.deathTimer / 30;
            const pieces = [[0,0,10,14],[10,0,10,14],[0,14,10,14],[10,14,10,14]];
            pieces.forEach((p, i) => {
                const dx = (i % 2 === 0 ? -1 : 1) * t * 15;
                const dy = -t * 10 + t * t * 20;
                ctx.globalAlpha = 1 - t;
                this.px(px_ + p[0] + dx, py_ + p[1] + dy, p[2], p[3], i % 2 === 0 ? '#a855f7' : '#06b6d4');
            });
            ctx.globalAlpha = 1;
            ctx.restore();
            return;
        }

        if (airborne) {
            this.px(px_ + 2, py_, pw - 4, ph, '#7c3aed');
            this.px(px_ + 4, py_ + 2, 4, ph - 4, '#a855f7');
            this.px(px_ + 4, py_ + 3, pw - 8, 6, '#06b6d4');
            this.glowRect(px_ + 4, py_ + 3, pw - 8, 6, '#06b6d4', 8);
            this.glowRect(px_ + 2, py_ + ph - 2, 4, 4, '#f97316', 10);
            this.glowRect(px_ + pw - 6, py_ + ph - 2, 4, 4, '#f97316', 10);
        } else {
            const af = player.animFrame;
            this.px(px_ + 2, py_ + 2, pw - 4, ph - 6, '#7c3aed');
            this.px(px_ + 4, py_ + 4, 4, ph - 10, '#a855f7');
            this.px(px_ + 4, py_ + 4, pw - 8, 5, '#06b6d4');
            this.glowRect(px_ + 4, py_ + 4, pw - 8, 5, '#06b6d4', 6);
            this.px(px_ + 3, py_, pw - 6, 5, '#5b21b6');
            const legY = py_ + ph - 4;
            if (af < 2) {
                this.px(px_ + 3, legY, 5, 4, '#4c1d95');
                this.px(px_ + pw - 8, legY - 2, 5, 6, '#4c1d95');
            } else {
                this.px(px_ + 3, legY - 2, 5, 6, '#4c1d95');
                this.px(px_ + pw - 8, legY, 5, 4, '#4c1d95');
            }
            this.glowRect(px_, py_ + 6, 2, 12, '#a855f7', 5);
            this.glowRect(px_ + pw - 2, py_ + 6, 2, 12, '#06b6d4', 5);
        }

        ctx.restore();
    }

    drawObstacle(ob, frame) {
        const ctx = this.ctx;
        ctx.save();

        if (ob.type === 'spike') {
            ctx.shadowColor = '#f43f5e';
            ctx.shadowBlur = 10;
            const hw = ob.w / 2;
            for (let i = 0; i < ob.w; i++) {
                const colH = Math.round((ob.h * (i < hw ? i / hw : (ob.w - i) / hw)));
                ctx.fillStyle = i % 3 === 0 ? '#f43f5e' : '#be123c';
                ctx.fillRect(Math.round(ob.x + i), Math.round(ob.y + ob.h - colH), 1, colH);
            }
            this.glowRect(ob.x, ob.y + ob.h - 2, ob.w, 2, '#f43f5e', 8);
        } else if (ob.type === 'drone') {
            ob.floatT += 0.05;
            const floatY = ob.y + Math.sin(ob.floatT) * 5;
            ctx.shadowColor = '#06b6d4';
            ctx.shadowBlur = 14;
            this.px(ob.x + 6, floatY + 3, ob.w - 12, ob.h - 6, '#0e7490');
            this.px(ob.x + 8, floatY + 5, ob.w - 16, ob.h - 10, '#06b6d4');
            const rotorPhase = Math.sin(frame * 0.6) * 3;
            this.glowRect(ob.x, floatY, 6, 2, '#67e8f9', 8);
            this.glowRect(ob.x + ob.w - 6, floatY, 6, 2, '#67e8f9', 8);
            this.glowRect(ob.x + rotorPhase, floatY + 2, 6, 1, '#a5f3fc', 5);
            this.glowRect(ob.x + ob.w - 6 - rotorPhase, floatY + 2, 6, 1, '#a5f3fc', 5);
            if (Math.floor(frame / 10) % 2 === 0) {
                this.glowRect(ob.x + ob.w / 2 - 2, floatY + ob.h - 4, 4, 4, '#f43f5e', 10);
            }
            ob._ry = floatY;
        } else if (ob.type === 'wall') {
            ctx.shadowColor = '#f97316';
            ctx.shadowBlur = 12;
            for (let wy = ob.y; wy < this.GROUND + 28; wy += 8) {
                const bright = (wy + frame) % 24 < 12;
                this.px(ob.x, wy, ob.w, 8, bright ? '#7c2d12' : '#431407');
                this.px(ob.x + 1, wy, 2, 7, '#ea580c');
            }
            this.glowRect(ob.x, ob.y, 2, this.GROUND + 28 - ob.y, '#f97316', 8);
            this.glowRect(ob.x + ob.w - 2, ob.y, 2, this.GROUND + 28 - ob.y, '#f97316', 8);
            this.glowRect(ob.x - 2, ob.y - 4, ob.w + 4, 4, '#f97316', 12);
        }
        ctx.restore();
    }

    drawParticles() {
        const ctx = this.ctx;
        this.particles.forEach(p => {
            ctx.save();
            ctx.globalAlpha = p.life / 40;
            this.glowRect(p.x, p.y, p.size, p.size, p.color, 6);
            ctx.restore();
        });
    }
}
