/**
 * PhonkItemManager.js - Floating Platforms & HP Potion Items Subsystem
 * Manages mid-air floating platforms and health potion bottle spawning, rendering, & collection
 */
import { PHONK_CONFIG } from './PhonkConfig.js';

export class PhonkItemManager {
    constructor(ctx, config) {
        this.ctx = ctx;
        this.W = config.W;
        this.H = config.H;
        this.GROUND = config.GROUND;

        this.floatingPlatforms = [];
        this.hpPotions = [];
        this.blastItems = [];
        this.giantItems = [];
        this.energyOrbs = [];
        this.magnetItems = [];
        this.isPotionApproaching = false;
    }

    reset() {
        this.floatingPlatforms = [];
        this.hpPotions = [];
        this.blastItems = [];
        this.giantItems = [];
        this.energyOrbs = [];
        this.magnetItems = [];
        this.isPotionApproaching = false;
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

    spawnFloatingPlatform() {
        const platW = 110 + Math.random() * 90;
        const heights = [this.GROUND - 65, this.GROUND - 115];
        const platY = heights[Math.floor(Math.random() * heights.length)];
        
        const lastPlat = this.floatingPlatforms[this.floatingPlatforms.length - 1];
        const platX = this.W + 20;
        if (!lastPlat || lastPlat.x + lastPlat.w < this.W - 80) {
            this.floatingPlatforms.push({
                x: platX,
                y: platY,
                w: platW,
                h: 4
            });
            this.spawnGuidingPath('platform_trail', platX, { platY, platW });
        }
    }

    spawnHpPotion() {
        this.isPotionApproaching = false;
        const heights = [this.GROUND - 50, this.GROUND - 100];
        const potY = heights[Math.floor(Math.random() * heights.length)];
        this.hpPotions.push({
            x: this.W + 40,
            y: potY,
            w: 22,
            h: 26,
            floatT: 0
        });
    }

    spawnBlastItem() {
        const heights = [this.GROUND - 60, this.GROUND - 105];
        const itemY = heights[Math.floor(Math.random() * heights.length)];
        this.blastItems.push({
            x: this.W + 40,
            y: itemY,
            w: 26,
            h: 28,
            floatT: Math.random() * Math.PI * 2
        });
    }

    spawnGiantItem() {
        const heights = [this.GROUND - 65, this.GROUND - 110];
        const itemY = heights[Math.floor(Math.random() * heights.length)];
        this.giantItems.push({
            x: this.W + 40,
            y: itemY,
            w: 26,
            h: 28,
            floatT: Math.random() * Math.PI * 2
        });
    }

    spawnEnergyOrbs() {
        const count = 4 + Math.floor(Math.random() * 3);
        const startY = this.GROUND - (35 + Math.random() * 60);
        const isArch = Math.random() > 0.5;
        for (let i = 0; i < count; i++) {
            const arcY = isArch ? Math.sin((i / (count - 1)) * Math.PI) * 35 : 0;
            this.energyOrbs.push({
                x: this.W + 20 + i * 26,
                y: startY - arcY,
                r: 6,
                pulseT: Math.random() * Math.PI * 2,
                isGold: Math.random() > 0.75
            });
        }
    }

    spawnMagnetItem() {
        const heights = [this.GROUND - 60, this.GROUND - 105];
        const itemY = heights[Math.floor(Math.random() * heights.length)];
        this.magnetItems.push({
            x: this.W + 40,
            y: itemY,
            w: 26,
            h: 28,
            floatT: Math.random() * Math.PI * 2
        });
    }

    spawnRandomPowerUpAt(x, y) {
        const roll = Math.random();
        const blastChance = PHONK_CONFIG.BLAST.SPAWN_CHANCE || 0.18;
        const giantChance = PHONK_CONFIG.GIANT.SPAWN_CHANCE || 0.15;

        if (roll < blastChance) {
            this.blastItems.push({ x, y, w: 26, h: 28, floatT: Math.random() * Math.PI * 2 });
        } else if (roll < blastChance + giantChance) {
            this.giantItems.push({ x, y, w: 26, h: 28, floatT: Math.random() * Math.PI * 2 });
        } else {
            this.magnetItems.push({ x, y, w: 26, h: 28, floatT: Math.random() * Math.PI * 2 });
        }
    }

    spawnGuidingPath(pattern, startX, param = {}) {
        if (this.isPotionApproaching) return;

        if (pattern === 'pit_arc') {
            const pitW = param.pitW || 90;
            const orbCount = 7;
            const apexY = this.GROUND - 80;
            const baseY = this.GROUND - 25;

            for (let i = 0; i < orbCount; i++) {
                const t = i / (orbCount - 1);
                const ox = startX - 25 + t * (pitW + 50);
                const oy = baseY - Math.sin(t * Math.PI) * (baseY - apexY);
                this.energyOrbs.push({
                    x: ox,
                    y: oy,
                    r: 6,
                    pulseT: Math.random() * Math.PI * 2,
                    isGold: i === 3
                });
            }

            if (Math.random() < 0.25) {
                const apexX = startX + pitW / 2;
                this.spawnRandomPowerUpAt(apexX, apexY - 18);
            }
        } else if (pattern === 'spike_arc') {
            const spikeW = param.width || 30;
            const orbCount = 5;
            const apexY = this.GROUND - 70;
            const baseY = this.GROUND - 20;

            for (let i = 0; i < orbCount; i++) {
                const t = i / (orbCount - 1);
                const ox = startX - 20 + t * (spikeW + 40);
                const oy = baseY - Math.sin(t * Math.PI) * (baseY - apexY);
                this.energyOrbs.push({
                    x: ox,
                    y: oy,
                    r: 6,
                    pulseT: Math.random() * Math.PI * 2,
                    isGold: i === 2
                });
            }
        } else if (pattern === 'slide_line') {
            const width = param.width || 45;
            const orbCount = 5;
            const slideY = this.GROUND - 10;

            for (let i = 0; i < orbCount; i++) {
                const ox = startX - 10 + i * (width / 4);
                this.energyOrbs.push({
                    x: ox,
                    y: slideY,
                    r: 6,
                    pulseT: Math.random() * Math.PI * 2,
                    isGold: false
                });
            }
        } else if (pattern === 'platform_trail') {
            const platX = startX;
            const platY = param.platY || (this.GROUND - 65);
            const platW = param.platW || 120;
            const spacing = 22;
            const orbCount = Math.max(3, Math.floor((platW - 16) / spacing));

            for (let i = 0; i < orbCount; i++) {
                this.energyOrbs.push({
                    x: platX + 10 + i * spacing,
                    y: platY - 16,
                    r: 6,
                    pulseT: Math.random() * Math.PI * 2,
                    isGold: i % 3 === 0
                });
            }

            if (Math.random() < 0.35) {
                this.spawnRandomPowerUpAt(platX + platW / 2, platY - 42);
            }
        } else {
            this.spawnGroundRunTrail(startX, 180);
        }
    }

    spawnGroundRunTrail(startX, length = 220) {
        if (this.isPotionApproaching) return;
        const spacing = 24;
        const orbCount = Math.max(4, Math.floor(length / spacing));
        const groundY = this.GROUND - 18;

        for (let i = 0; i < orbCount; i++) {
            this.energyOrbs.push({
                x: startX + i * spacing,
                y: groundY,
                r: 6,
                pulseT: Math.random() * Math.PI * 2,
                isGold: i % 4 === 0
            });
        }
    }

    filterSafeFromObstacles(obstacles) {
        if (!obstacles || obstacles.length === 0) return;
        const isCloseToObstacle = (itemX, itemY, marginX = 45, marginY = 32) => {
            return obstacles.some(ob => {
                const obCenterX = ob.x + ob.w / 2;
                const obCenterY = ob.y + ob.h / 2;
                const dx = Math.abs(itemX - obCenterX);
                const dy = Math.abs(itemY - obCenterY);
                return dx < (ob.w / 2 + marginX) && dy < (ob.h / 2 + marginY);
            });
        };

        this.energyOrbs = this.energyOrbs.filter(orb => !isCloseToObstacle(orb.x, orb.y, 28, 22));
        this.blastItems = this.blastItems.filter(item => !isCloseToObstacle(item.x + item.w / 2, item.y + item.h / 2, 48, 36));
        this.giantItems = this.giantItems.filter(item => !isCloseToObstacle(item.x + item.w / 2, item.y + item.h / 2, 48, 36));
        this.magnetItems = this.magnetItems.filter(item => !isCloseToObstacle(item.x + item.w / 2, item.y + item.h / 2, 48, 36));
        this.hpPotions = this.hpPotions.filter(pot => !isCloseToObstacle(pot.x + pot.w / 2, pot.y + pot.h / 2, 48, 36));
    }

    drawFloatingPlatforms() {
        const ctx = this.ctx;
        for (const plat of this.floatingPlatforms) {
            ctx.save();
            this.glowRect(plat.x, plat.y, plat.w, 3, PHONK_CONFIG.COLORS.PLATFORM_ORANGE, 16);
            this.glowRect(plat.x, plat.y - 1, plat.w, 2, '#ffaa00', 8);

            this.glowRect(plat.x - 3, plat.y - 2, 4, 6, PHONK_CONFIG.COLORS.CYAN_NEON, 10);
            this.glowRect(plat.x + plat.w - 1, plat.y - 2, 4, 6, PHONK_CONFIG.COLORS.CYAN_NEON, 10);
            ctx.restore();
        }
    }

    drawHpPotions() {
        const ctx = this.ctx;
        for (const pot of this.hpPotions) {
            ctx.save();
            pot.floatT += 0.06;
            const floatY = pot.y + Math.sin(pot.floatT) * 4;

            ctx.shadowColor = '#22c55e';
            ctx.shadowBlur = 14;

            // Bottle Cap
            this.px(pot.x + 7, floatY, 8, 4, '#e2e8f0');
            // Glass Bottle Body
            this.px(pot.x + 3, floatY + 4, 16, 20, '#065f46');
            // Green Health Liquid Fill
            this.glowRect(pot.x + 5, floatY + 8, 12, 14, '#22c55e', 8);
            // White Plus Cross Symbol
            this.px(pot.x + 9, floatY + 11, 4, 8, '#ffffff');
            this.px(pot.x + 7, floatY + 13, 8, 4, '#ffffff');

            ctx.restore();
        }
    }

    drawBlastItems() {
        const ctx = this.ctx;
        for (const item of this.blastItems) {
            ctx.save();
            item.floatT += 0.08;
            const floatY = item.y + Math.sin(item.floatT) * 5;

            ctx.shadowColor = '#fde047';
            ctx.shadowBlur = 18;

            // Outer Glowing Gold Capsule
            this.glowRect(item.x + 2, floatY + 2, 22, 24, '#eab308', 12);
            this.glowRect(item.x + 4, floatY + 4, 18, 20, '#fde047', 8);

            // Lightning Bolt Symbol in center
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = '#ffffff';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.moveTo(item.x + 15, floatY + 5);
            ctx.lineTo(item.x + 9, floatY + 14);
            ctx.lineTo(item.x + 14, floatY + 14);
            ctx.lineTo(item.x + 10, floatY + 23);
            ctx.lineTo(item.x + 17, floatY + 13);
            ctx.lineTo(item.x + 12, floatY + 13);
            ctx.closePath();
            ctx.fill();

            // Floating Text "⚡ BLAST"
            ctx.font = 'bold 9px monospace';
            ctx.fillStyle = '#fde047';
            ctx.textAlign = 'center';
            ctx.shadowColor = '#fde047';
            ctx.shadowBlur = 8;
            ctx.fillText('⚡ BLAST', item.x + 13, floatY - 5);

            ctx.restore();
        }
    }

    drawGiantItems() {
        const ctx = this.ctx;
        for (const item of this.giantItems) {
            ctx.save();
            item.floatT += 0.07;
            const floatY = item.y + Math.sin(item.floatT) * 5;

            ctx.shadowColor = '#c084fc';
            ctx.shadowBlur = 20;

            // Outer Glowing Purple Mega Capsule
            this.glowRect(item.x + 2, floatY + 2, 22, 24, '#9333ea', 14);
            this.glowRect(item.x + 4, floatY + 4, 18, 20, '#c084fc', 8);

            // Glowing Growth Core Icon (Up Arrow / Plus Star)
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = '#ffffff';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(item.x + 13, floatY + 14, 5, 0, Math.PI * 2);
            ctx.fill();

            // Floating Text "🔮 MEGA"
            ctx.font = 'bold 9px monospace';
            ctx.fillStyle = '#e9d5ff';
            ctx.textAlign = 'center';
            ctx.shadowColor = '#c084fc';
            ctx.shadowBlur = 8;
            ctx.fillText('🔮 MEGA', item.x + 13, floatY - 5);

            ctx.restore();
        }
    }

    drawEnergyOrbs() {
        const ctx = this.ctx;
        for (const orb of this.energyOrbs) {
            ctx.save();
            orb.pulseT += 0.1;
            const pulseR = orb.r + Math.sin(orb.pulseT) * 1.5;
            const color = orb.isGold ? PHONK_CONFIG.ORB.GOLD_COLOR : PHONK_CONFIG.ORB.CYAN_COLOR;

            ctx.shadowColor = color;
            ctx.shadowBlur = 12;

            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(Math.round(orb.x), Math.round(orb.y), pulseR, 0, Math.PI * 2);
            ctx.fill();

            // Inner White Core
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(Math.round(orb.x - 1), Math.round(orb.y - 1), pulseR * 0.4, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }
    }

    drawMagnetItems() {
        const ctx = this.ctx;
        for (const item of this.magnetItems) {
            ctx.save();
            item.floatT += 0.06;
            const floatY = item.y + Math.sin(item.floatT) * 6;

            ctx.shadowColor = '#ff0055';
            ctx.shadowBlur = 20;

            // Outer Capsule Frame
            this.glowRect(item.x + 2, floatY + 2, 22, 24, '#991b1b', 14);
            this.glowRect(item.x + 4, floatY + 4, 18, 20, '#ef4444', 8);

            // Glowing Magnet Icon (Red & Cyan U-Shape)
            this.glowRect(item.x + 7, floatY + 7, 4, 12, '#ff0055', 6);
            this.glowRect(item.x + 15, floatY + 7, 4, 12, '#00f0ff', 6);
            this.glowRect(item.x + 7, floatY + 16, 12, 4, '#dc2626', 4);

            // Floating Label
            ctx.font = 'bold 9px monospace';
            ctx.fillStyle = '#fca5a5';
            ctx.textAlign = 'center';
            ctx.shadowColor = '#ef4444';
            ctx.shadowBlur = 8;
            ctx.fillText('🧲 MAGNET', item.x + 13, floatY - 5);

            ctx.restore();
        }
    }

    checkPotionCollection(player) {
        const px_ = player.x;
        const py_ = player.y;
        const pw = player.w;
        const ph = player.h;

        for (let i = this.hpPotions.length - 1; i >= 0; i--) {
            const pot = this.hpPotions[i];
            if (px_ < pot.x + pot.w && px_ + pw > pot.x && py_ < pot.y + pot.h && py_ + ph > pot.y) {
                this.hpPotions.splice(i, 1);
                return true;
            }
        }
        return false;
    }

    checkBlastCollection(player) {
        const px_ = player.x;
        const py_ = player.y;
        const pw = player.w;
        const ph = player.h;

        for (let i = this.blastItems.length - 1; i >= 0; i--) {
            const item = this.blastItems[i];
            if (px_ < item.x + item.w && px_ + pw > item.x && py_ < item.y + item.h && py_ + ph > item.y) {
                this.blastItems.splice(i, 1);
                return true;
            }
        }
        return false;
    }

    checkGiantCollection(player) {
        const px_ = player.x;
        const py_ = player.y;
        const pw = player.w;
        const ph = player.h;

        for (let i = this.giantItems.length - 1; i >= 0; i--) {
            const item = this.giantItems[i];
            if (px_ < item.x + item.w && px_ + pw > item.x && py_ < item.y + item.h && py_ + ph > item.y) {
                this.giantItems.splice(i, 1);
                return true;
            }
        }
        return false;
    }

    checkMagnetCollection(player) {
        const px_ = player.x;
        const py_ = player.y;
        const pw = player.w;
        const ph = player.h;

        for (let i = this.magnetItems.length - 1; i >= 0; i--) {
            const item = this.magnetItems[i];
            if (px_ < item.x + item.w && px_ + pw > item.x && py_ < item.y + item.h && py_ + ph > item.y) {
                this.magnetItems.splice(i, 1);
                return true;
            }
        }
        return false;
    }

    checkOrbCollection(player, particleFx) {
        const px_ = player.x;
        const py_ = player.y;
        const pw = player.w;
        const ph = player.h;

        let collectedCount = 0;
        for (let i = this.energyOrbs.length - 1; i >= 0; i--) {
            const orb = this.energyOrbs[i];
            if (px_ < orb.x + orb.r && px_ + pw > orb.x - orb.r && py_ < orb.y + orb.r && py_ + ph > orb.y - orb.r) {
                if (particleFx) particleFx.spawnOrbParticles(orb.x, orb.y);
                this.energyOrbs.splice(i, 1);
                collectedCount++;
            }
        }
        return collectedCount;
    }

    applyMagnetPull(player) {
        const targetX = player.x + player.w / 2;
        const targetY = player.y + player.h / 2;
        const pullRadius = PHONK_CONFIG.MAGNET.PULL_RADIUS || 550;
        const basePullSpeed = PHONK_CONFIG.MAGNET.PULL_SPEED || 11;

        const pullItem = (item) => {
            const dx = targetX - item.x;
            const dy = targetY - item.y;
            const dist = Math.hypot(dx, dy);
            
            // Allow items behind player (dx > 0 / item.x < targetX) to be pulled forward guaranteed
            const maxRadius = item.x < targetX ? 850 : pullRadius;

            if (dist < maxRadius && dist > 1) {
                // If item is behind player, boost magnetic pull speed to easily overcome screen scrolling speed
                const speedBoost = item.x < targetX ? 18 : 0;
                const effectivePullSpeed = basePullSpeed + speedBoost;

                item.x += (dx / dist) * effectivePullSpeed;
                item.y += (dy / dist) * effectivePullSpeed;
            }
        };

        this.energyOrbs.forEach(pullItem);
        this.hpPotions.forEach(pullItem);
        this.blastItems.forEach(pullItem);
        this.giantItems.forEach(pullItem);
        this.magnetItems.forEach(pullItem);
    }
}
