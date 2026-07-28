/**
 * PhonkGameEngine.js - Phonk Runner Core Game State & Loop Coordinator
 * Manages game loop, physics updates, HP drain, collision reactions, and state transitions
 */
import { PHONK_CONFIG } from './PhonkConfig.js';
import { PhonkAudioEngine } from './PhonkAudioEngine.js';
import { PhonkCityLandmarks } from './PhonkCityLandmarks.js';
import { PhonkEntities } from './PhonkEntities.js';
import { PhonkRenderer } from './PhonkRenderer.js';
import { PhonkInputHandler } from './PhonkInputHandler.js';

export class PhonkGameEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        this.W = PHONK_CONFIG.CANVAS.W;
        this.H = PHONK_CONFIG.CANVAS.H;
        this.GROUND = this.H - PHONK_CONFIG.CANVAS.GROUND_OFFSET;
        this.GRAVITY = PHONK_CONFIG.PHYSICS.GRAVITY;
        this.JUMP_V = PHONK_CONFIG.PHYSICS.JUMP_V;

        this.STAND_H = PHONK_CONFIG.CHARACTER.STAND_H;
        this.STAND_W = PHONK_CONFIG.CHARACTER.STAND_W;
        this.SLIDE_H = PHONK_CONFIG.CHARACTER.SLIDE_H;
        this.SLIDE_W = PHONK_CONFIG.CHARACTER.SLIDE_W;

        this.audio = new PhonkAudioEngine();
        this.city = new PhonkCityLandmarks(this.ctx, { W: this.W, H: this.H, GROUND: this.GROUND });
        this.entities = new PhonkEntities(this.ctx, { W: this.W, H: this.H, GROUND: this.GROUND });
        this.renderer = new PhonkRenderer(this.ctx, { W: this.W, H: this.H, GROUND: this.GROUND });

        this.state = 'idle';
        this.score = 0;
        this.distance = 0;
        this.hiScore = parseInt(localStorage.getItem('phonkRunnerHi') || '0');
        this.frame = 0;
        this.speed = PHONK_CONFIG.PHYSICS.INITIAL_SPEED;
        this.spawnTimer = 0;
        this.spawnInterval = PHONK_CONFIG.SPAWN.BASE_INTERVAL;
        this.level = 1;
        this.runStartTime = Date.now();
        this.rafId = null;
        this.lastPotionKm = 0;
        this.hitScreenShakeTimer = 0;
        this.isPaused = false;

        this.layers = [
            { x: 0, speed: 0.2, draw: (ox) => this.city.drawFarCity(ox, this.frame) },
            { x: 0, speed: 0.5, draw: (ox) => this.city.drawMidCity(ox, this.frame) },
            { x: 0, speed: 0.8, draw: (ox) => this.city.drawNearCity(ox, this.frame) },
        ];

        this.input = new PhonkInputHandler(this.canvas, {
            onJump: () => this.pressJump(),
            onSlide: () => this.pressSlide(),
            onReleaseSlide: () => this.releaseSlide(),
            onTogglePause: () => this.togglePause()
        });

        this.loop = this.loop.bind(this);
        this.loop();
    }

    togglePause() {
        if (this.state === 'running') {
            this.state = 'paused';
            this.isPaused = true;
            this.audio.stopBGM();
        } else if (this.state === 'paused') {
            this.state = 'running';
            this.isPaused = false;
            this.audio.startBGM();
        }
    }

    pressJump() {
        if (this.state === 'idle') { this.startGame(); return; }
        if (this.state === 'paused') { this.togglePause(); return; }
        if (this.state === 'dead') { this.resetGame(); return; }

        const p = this.entities.player;
        if (p.dead || p.y > this.H) return;

        if (p.isSliding) {
            this.releaseSlide();
        }

        if (p.jumps < p.maxJumps) {
            p.vy = this.JUMP_V;
            const isDouble = p.jumps >= 1;
            p.jumps++;
            p.fallingInPit = false;
            this.entities.spawnJumpParticles(p.jumps);
            this.audio.playJumpSfx(isDouble);
        }
    }

    pressSlide() {
        if (this.state === 'idle') { this.startGame(); return; }
        if (this.state === 'paused') return;
        if (this.state === 'dead') { this.resetGame(); return; }

        const p = this.entities.player;
        if (p.fallingInPit) return;

        p.isSliding = true;
        p.w = this.SLIDE_W;
        p.h = this.SLIDE_H;

        const airborne = p.y < this.GROUND - this.STAND_H - 1;
        if (!airborne) {
            p.y = this.GROUND - this.SLIDE_H;
        }
    }

    releaseSlide() {
        const p = this.entities.player;
        p.isSliding = false;
        p.w = this.STAND_W;
        p.h = this.STAND_H;

        const airborne = p.y < this.GROUND - this.STAND_H - 1;
        if (!airborne && !p.fallingInPit) {
            p.y = this.GROUND - this.STAND_H;
        }
    }

    startGame() {
        this.state = 'running';
        this.isPaused = false;
        this.runStartTime = Date.now();
        this.audio.startBGM();
    }

    resetGame() {
        this.score = 0;
        this.distance = 0;
        this.speed = PHONK_CONFIG.PHYSICS.INITIAL_SPEED;
        this.spawnTimer = 0;
        this.spawnInterval = PHONK_CONFIG.SPAWN.BASE_INTERVAL;
        this.level = 1;
        this.frame = 0;
        this.runStartTime = Date.now();
        this.lastPotionKm = 0;
        this.hitScreenShakeTimer = 0;
        this.isPaused = false;
        this.entities.reset();
        this.city.resetQueues();

        this.layers.forEach(l => { l.x = 0; });
        this.updateHUD();
        this.state = 'running';
        this.audio.stopBGM();
        this.audio.startBGM();
    }

    killPlayer(reason = 'collision') {
        const p = this.entities.player;
        if (p.dead) return;
        p.dead = true;
        this.state = 'dead';
        this.isPaused = false;
        this.audio.stopBGM();
        this.audio.playDeathSfx();
        this.entities.spawnDeathParticles();
        if (this.score > this.hiScore) {
            this.hiScore = this.score;
            localStorage.setItem('phonkRunnerHi', this.hiScore);
        }
        this.updateHUD();
    }

    updateHUD() {
        const pad = n => String(Math.floor(n)).padStart(6, '0');
        const scoreEl = document.getElementById('game-score');
        const hiScoreEl = document.getElementById('game-hi-score');
        const levelEl = document.getElementById('game-level-badge');
        if (scoreEl) scoreEl.textContent = pad(this.score);
        if (hiScoreEl) hiScoreEl.textContent = pad(this.hiScore);
        if (levelEl) levelEl.textContent = 'LVL ' + this.level;
    }

    updatePhysics() {
        const p = this.entities.player;

        if (this.state === 'running') {
            this.distance += this.speed * PHONK_CONFIG.PHYSICS.SCORE_MULTIPLIER;
            
            // Cookie Run HP Drain over time
            const drainRate = (PHONK_CONFIG.HP.DRAIN_PER_SEC || 1.6) / 60;
            p.hp = Math.max(0, p.hp - drainRate);
            if (p.hp <= 0 && !p.dead) {
                this.killPlayer('hp_drain');
            }

            // Check if HP Potion milestone is approaching
            const intervalM = PHONK_CONFIG.HP.POTION_INTERVAL_M || 1000;
            const leadDistM = PHONK_CONFIG.HP.POTION_LEAD_DIST_M || 100;
            const distInKm = this.distance % intervalM;
            if (this.distance >= leadDistM && distInKm >= intervalM - leadDistM) {
                this.entities.isPotionApproaching = true;
            } else {
                this.entities.isPotionApproaching = false;
            }

            // Spawn HP Potions every 1000m
            const currentKm = Math.floor(this.distance / intervalM);
            if (currentKm > this.lastPotionKm) {
                this.lastPotionKm = currentKm;
                this.entities.spawnHpPotion();
            }

            // Level increases based on distance
            const distStep = PHONK_CONFIG.PHYSICS.DISTANCE_PER_LEVEL || 5000;
            this.level = Math.min(PHONK_CONFIG.PHYSICS.MAX_LEVEL, 1 + Math.floor(this.distance / distStep));

            // Dynamic Player Hitbox & Render Scaling (Smooth Growth & Shrink Lerp Animation)
            const targetScale = p.giantTimer > 0 ? (PHONK_CONFIG.GIANT.SCALE_FACTOR || 1.85) : 1.0;
            this.entities.updateScale(targetScale);

            // Slowdown penalty recovery over INVINCIBLE_FRAMES or Blast Speed Multiplier
            const baseSpeed = PHONK_CONFIG.PHYSICS.INITIAL_SPEED + (this.level - 1) * 0.8;
            if (p.blastTimer > 0) {
                this.speed = baseSpeed * (PHONK_CONFIG.BLAST.SPEED_MULTIPLIER || 2.2);
                p.fallingInPit = false;
            } else if (p.invincibleTimer > 0 && p.giantTimer <= 0) {
                const slowdownFactor = PHONK_CONFIG.HP.HIT_SLOWDOWN_FACTOR || 0.4;
                const recoveryProgress = 1 - (p.invincibleTimer / (PHONK_CONFIG.HP.INVINCIBLE_FRAMES || 60));
                const currentFactor = slowdownFactor + (1 - slowdownFactor) * recoveryProgress;
                this.speed = Math.max(1.3, baseSpeed * currentFactor);
            } else {
                this.speed = baseSpeed;
            }

            this.spawnInterval = Math.max(PHONK_CONFIG.SPAWN.MIN_INTERVAL, PHONK_CONFIG.SPAWN.BASE_INTERVAL - (this.level - 1) * 15);
            if (this.frame % 30 === 0) this.updateHUD();

            this.spawnTimer++;
            if (this.spawnTimer >= this.spawnInterval) {
                this.entities.spawnObstacleOrPit(this.level, this.speed);
                
                // Random Item & Energy Orbs Spawning
                if (!this.entities.isPotionApproaching) {
                    const itemRoll = Math.random();
                    if (itemRoll < (PHONK_CONFIG.BLAST.SPAWN_CHANCE || 0.18)) {
                        this.entities.spawnBlastItem();
                    } else if (itemRoll < (PHONK_CONFIG.BLAST.SPAWN_CHANCE || 0.18) + (PHONK_CONFIG.GIANT.SPAWN_CHANCE || 0.15)) {
                        this.entities.spawnGiantItem();
                    } else if (itemRoll < (PHONK_CONFIG.BLAST.SPAWN_CHANCE || 0.18) + (PHONK_CONFIG.GIANT.SPAWN_CHANCE || 0.15) + (PHONK_CONFIG.MAGNET.SPAWN_CHANCE || 0.15)) {
                        this.entities.spawnMagnetItem();
                    } else if (Math.random() < (PHONK_CONFIG.ORB.SPAWN_CHANCE || 0.85)) {
                        this.entities.spawnGroundRunTrail(this.W + 20, 220);
                    }
                }
                this.spawnTimer = 0;
            }

            this.layers.forEach(l => { l.x += l.speed * this.speed; });

            this.entities.obstacles.forEach(ob => { ob.x -= this.speed; });
            this.entities.obstacles = this.entities.obstacles.filter(ob => ob.x > -80);

            this.entities.pits.forEach(pit => { pit.x -= this.speed; });
            this.entities.pits = this.entities.pits.filter(pit => pit.x > -150);

            this.entities.floatingPlatforms.forEach(plat => { plat.x -= this.speed; });
            this.entities.floatingPlatforms = this.entities.floatingPlatforms.filter(plat => plat.x > -150);

            const leftDespawnX = p.magnetTimer > 0 ? -350 : -80;

            this.entities.hpPotions.forEach(pot => { pot.x -= this.speed; });
            this.entities.hpPotions = this.entities.hpPotions.filter(pot => pot.x > leftDespawnX);

            this.entities.blastItems.forEach(item => { item.x -= this.speed; });
            this.entities.blastItems = this.entities.blastItems.filter(item => item.x > leftDespawnX);

            this.entities.giantItems.forEach(item => { item.x -= this.speed; });
            this.entities.giantItems = this.entities.giantItems.filter(item => item.x > leftDespawnX);

            this.entities.magnetItems.forEach(item => { item.x -= this.speed; });
            this.entities.magnetItems = this.entities.magnetItems.filter(item => item.x > leftDespawnX);

            this.entities.energyOrbs.forEach(orb => { orb.x -= this.speed; });
            this.entities.energyOrbs = this.entities.energyOrbs.filter(orb => orb.x > leftDespawnX);

            // Ensure all Orbs & Power-up items maintain safe clearance distance from active obstacles
            this.entities.filterSafeFromObstacles();

            // Apply Magnetic Attraction to pull items towards player
            if (p.magnetTimer > 0) {
                this.entities.applyMagnetPull();
            }

            if (this.entities.checkPotionCollection()) {
                p.hp = Math.min(p.maxHp, p.hp + PHONK_CONFIG.HP.POTION_HEAL);
                this.entities.spawnHealParticles();
                this.audio.playHealSfx();
            }

            if (this.entities.checkBlastCollection()) {
                p.blastTimer = PHONK_CONFIG.BLAST.DURATION_FRAMES || 300;
                this.audio.playBlastSfx();
                this.entities.spawnHealParticles();
            }

            if (this.entities.checkGiantCollection()) {
                p.giantTimer = PHONK_CONFIG.GIANT.DURATION_FRAMES || 300;
                this.audio.playGiantSfx();
                this.entities.spawnHealParticles();
            }

            if (this.entities.checkMagnetCollection()) {
                p.magnetTimer = PHONK_CONFIG.MAGNET.DURATION_FRAMES || 300;
                this.audio.playMagnetSfx();
                this.entities.spawnHealParticles();
            }

            // Check Energy Orbs Collection for Score
            const orbCount = this.entities.checkOrbCollection();
            if (orbCount > 0) {
                this.score += orbCount * (PHONK_CONFIG.ORB.SCORE_VALUE || 100);
                this.audio.playOrbSfx();
            }

            const rawOverPit = this.entities.isOverPit(p.x, p.w);
            const overPit = p.blastTimer > 0 ? false : rawOverPit;
            const targetGroundY = this.GROUND - p.h;

            if (p.blastTimer > 0) {
                p.fallingInPit = false;
            } else if (overPit && p.vy >= 0 && p.y >= targetGroundY - 2) {
                p.fallingInPit = true;
            }

            p.vy += this.GRAVITY;
            p.y += p.vy;

            // Floating Platform landing
            let landedOnFloatPlat = false;
            if (p.vy >= 0) {
                for (const plat of this.entities.floatingPlatforms) {
                    const footX = p.x + p.w / 2;
                    const platTargetY = plat.y - p.h;
                    if (footX >= plat.x - 4 && footX <= plat.x + plat.w + 4) {
                        if (p.y >= platTargetY - 4 && p.y <= platTargetY + p.vy + 6) {
                            p.y = platTargetY;
                            p.vy = 0;
                            p.jumps = 0;
                            p.fallingInPit = false;
                            landedOnFloatPlat = true;
                            break;
                        }
                    }
                }
            }

            // Ground platform landing
            if (!landedOnFloatPlat) {
                if (!p.fallingInPit && (!overPit || p.blastTimer > 0)) {
                    if (p.vy >= 0 && p.y >= targetGroundY) {
                        p.y = targetGroundY;
                        p.vy = 0;
                        p.jumps = 0;
                    }
                } else {
                    if (p.y >= this.H + 10) {
                        this.killPlayer('pitfall');
                    }
                }
            }

            if (p.y >= targetGroundY - 1 && !p.fallingInPit) {
                p.animTimer++;
                const frameDelay = p.blastTimer > 0 ? 2 : (p.isSliding ? 4 : 6);
                if (p.animTimer > frameDelay) {
                    p.animFrame = (p.animFrame + 1) % 4;
                    p.animTimer = 0;
                }
            }

            this.entities.particles.forEach(pt => { pt.x += pt.vx; pt.y += pt.vy; pt.vy += 0.1; pt.life--; });
            this.entities.particles = this.entities.particles.filter(pt => pt.life > 0);

            // Obstacle Smash & Destruction during Blast / Giant mode, vs Normal Collision
            if (p.blastTimer > 0 || p.giantTimer > 0) {
                if (this.entities.destroyCollidingObstacles()) {
                    this.audio.playHitSfx();
                }
            } else if (this.entities.checkCollision() && p.invincibleTimer <= 0) {
                p.hp = Math.max(0, p.hp - PHONK_CONFIG.HP.COLLISION_DAMAGE);
                p.invincibleTimer = PHONK_CONFIG.HP.INVINCIBLE_FRAMES;
                p.hitRecoiling = 18;
                this.hitScreenShakeTimer = PHONK_CONFIG.HP.HIT_SHAKE_DURATION || 7;

                this.audio.playHitSfx();
                this.entities.spawnDeathParticles();

                if (p.hp <= 0 && !p.dead) {
                    this.killPlayer('collision');
                }
            }

        } else if (this.state === 'dead') {
            p.deathTimer = Math.min(p.deathTimer + 1, 30);
            this.entities.obstacles.forEach(ob => { ob.x -= this.speed * 0.3; });
            this.entities.pits.forEach(pit => { pit.x -= this.speed * 0.3; });
            this.entities.floatingPlatforms.forEach(plat => { plat.x -= this.speed * 0.3; });
            this.entities.hpPotions.forEach(pot => { pot.x -= this.speed * 0.3; });
            this.entities.energyOrbs.forEach(orb => { orb.x -= this.speed * 0.3; });
            this.layers.forEach(l => { l.x += l.speed * this.speed * 0.2; });
            this.entities.particles.forEach(pt => { pt.x += pt.vx; pt.y += pt.vy; pt.vy += 0.15; pt.life--; });
            this.entities.particles = this.entities.particles.filter(pt => pt.life > 0);
        }
    }

    render() {
        const ctx = this.ctx;
        
        // Screen Shake Translate
        if (this.hitScreenShakeTimer > 0) {
            this.hitScreenShakeTimer--;
            ctx.save();
            const shakeX = (Math.random() - 0.5) * 6;
            const shakeY = (Math.random() - 0.5) * 4;
            ctx.translate(shakeX, shakeY);
        }

        ctx.fillStyle = PHONK_CONFIG.COLORS.BG_DARK;
        ctx.fillRect(0, 0, this.W, this.H);

        // Starfield background
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        for (let s = 0; s < 30; s++) {
            const sx = ((s * 137 + this.frame * 0.2) % this.W);
            const sy = (s * 53) % (this.GROUND * 0.5);
            const ss = s % 3 === 0 ? 1.5 : 0.5;
            if (Math.sin(this.frame * 0.03 + s) > 0.7) {
                this.renderer.glowRect(sx, sy, ss, ss, '#e9d5ff', 5);
            } else {
                ctx.fillRect(sx, sy, ss, ss);
            }
        }

        this.layers.forEach(l => l.draw(l.x));
        this.renderer.drawGround(this.entities);
        this.entities.drawFloatingPlatforms();
        this.entities.drawHpPotions();
        this.entities.drawBlastItems();
        this.entities.drawGiantItems();
        this.entities.drawMagnetItems();
        this.entities.drawEnergyOrbs();
        this.entities.obstacles.forEach(ob => this.entities.drawObstacle(ob, this.frame));
        this.entities.drawPlayer(this.frame);
        this.entities.drawParticles();
        this.renderer.drawHpBar(this.entities.player);
        this.renderer.drawScore(this.score);
        this.renderer.drawDistanceProgressBar(this.distance, PHONK_CONFIG.HP.POTION_INTERVAL_M || 1000);
        this.renderer.drawPauseButton(this.isPaused);

        if (this.hitScreenShakeTimer > 0) {
            ctx.restore();
        }

        this.renderer.drawScanlines();

        if (this.isPaused) {
            this.renderer.drawPauseScreen();
        }

        this.renderer.drawDeathScreen(this.score, this.entities.player.deathTimer, this.frame);

        if (this.state === 'idle') {
            this.renderer.drawIdleScreen(this.frame);
        }
    }

    loop() {
        this.rafId = requestAnimationFrame(this.loop);
        this.frame++;
        this.updatePhysics();
        this.render();
    }
}
