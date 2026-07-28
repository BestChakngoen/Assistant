/**
 * PhonkEntities.js - Central Entities Facade Manager
 * Orchestrates PhonkPlayer, PhonkObstacles, PhonkItemManager, and PhonkParticleFX
 */
import { PhonkPlayer } from './PhonkPlayer.js';
import { PhonkObstacles } from './PhonkObstacles.js';
import { PhonkItemManager } from './PhonkItemManager.js';
import { PhonkParticleFX } from './PhonkParticleFX.js';

export class PhonkEntities {
    constructor(ctx, config) {
        this.ctx = ctx;
        this.W = config.W;
        this.H = config.H;
        this.GROUND = config.GROUND;

        this._player = new PhonkPlayer(this.GROUND);
        this._obstacles = new PhonkObstacles(ctx, config);
        this._items = new PhonkItemManager(ctx, config);
        this._particleFX = new PhonkParticleFX(ctx);
    }

    // Getters and Setters for backward compatibility with PhonkGameEngine
    get player() { return this._player; }
    
    get obstacles() { return this._obstacles.obstacles; }
    set obstacles(val) { this._obstacles.obstacles = val; }

    get pits() { return this._obstacles.pits; }
    set pits(val) { this._obstacles.pits = val; }

    get floatingPlatforms() { return this._items.floatingPlatforms; }
    set floatingPlatforms(val) { this._items.floatingPlatforms = val; }

    get hpPotions() { return this._items.hpPotions; }
    set hpPotions(val) { this._items.hpPotions = val; }

    get blastItems() { return this._items.blastItems; }
    set blastItems(val) { this._items.blastItems = val; }

    get giantItems() { return this._items.giantItems; }
    set giantItems(val) { this._items.giantItems = val; }

    get energyOrbs() { return this._items.energyOrbs; }
    set energyOrbs(val) { this._items.energyOrbs = val; }

    get magnetItems() { return this._items.magnetItems; }
    set magnetItems(val) { this._items.magnetItems = val; }

    get particles() { return this._particleFX.particles; }
    set particles(val) { this._particleFX.particles = val; }

    get isPotionApproaching() { return this._items.isPotionApproaching; }
    set isPotionApproaching(val) { this._items.isPotionApproaching = val; }

    reset() {
        this._player.reset();
        this._obstacles.reset();
        this._items.reset();
        this._particleFX.reset();
    }

    updateScale(targetScale) {
        this._player.updateScale(targetScale);
    }

    spawnHpPotion() {
        this._items.spawnHpPotion();
    }

    spawnBlastItem() {
        this._items.spawnBlastItem();
    }

    spawnGiantItem() {
        this._items.spawnGiantItem();
    }

    spawnMagnetItem() {
        this._items.spawnMagnetItem();
    }

    spawnEnergyOrbs() {
        this._items.spawnEnergyOrbs();
    }

    spawnGuidingPath(pattern, startX, param) {
        this._items.spawnGuidingPath(pattern, startX, param);
    }

    spawnGroundRunTrail(startX, length) {
        this._items.spawnGroundRunTrail(startX, length);
    }

    filterSafeFromObstacles() {
        this._items.filterSafeFromObstacles(this._obstacles.obstacles);
    }

    drawHpPotions() {
        this._items.drawHpPotions();
    }

    drawBlastItems() {
        this._items.drawBlastItems();
    }

    drawGiantItems() {
        this._items.drawGiantItems();
    }

    drawMagnetItems() {
        this._items.drawMagnetItems();
    }

    drawEnergyOrbs() {
        this._items.drawEnergyOrbs();
    }

    checkPotionCollection() {
        return this._items.checkPotionCollection(this._player);
    }

    checkBlastCollection() {
        return this._items.checkBlastCollection(this._player);
    }

    checkGiantCollection() {
        return this._items.checkGiantCollection(this._player);
    }

    checkMagnetCollection() {
        return this._items.checkMagnetCollection(this._player);
    }

    checkOrbCollection() {
        return this._items.checkOrbCollection(this._player, this._particleFX);
    }

    applyMagnetPull() {
        this._items.applyMagnetPull(this._player);
    }

    spawnHealParticles() {
        this._particleFX.spawnHealParticles(this._player);
    }

    spawnObstacleOrPit(level, currentSpeed) {
        this._obstacles.spawnObstacleOrPit(level, this._items);
    }

    isOverPit(x, w) {
        return this._obstacles.isOverPit(x, w);
    }

    spawnJumpParticles(jumpCount = 1) {
        this._particleFX.spawnJumpParticles(this._player, jumpCount);
    }

    spawnSlideParticles() {
        this._particleFX.spawnSlideParticles(this._player);
    }

    spawnDeathParticles() {
        this._particleFX.spawnDeathParticles(this._player);
    }

    checkCollision() {
        return this._obstacles.checkCollision(this._player);
    }

    destroyCollidingObstacles() {
        return this._obstacles.destroyCollidingObstacles(this._player, this._particleFX);
    }

    drawPlayer(frame) {
        this._player.draw(this.ctx, frame, this._particleFX);
    }

    drawPits() {
        this._obstacles.drawPits();
    }

    drawObstacle(ob, frame) {
        this._obstacles.drawObstacle(ob, frame);
    }

    drawFloatingPlatforms() {
        this._items.drawFloatingPlatforms();
    }

    drawParticles() {
        this._particleFX.draw();
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
}
