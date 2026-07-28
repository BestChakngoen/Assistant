/**
 * Cyber Phonk Runner - Pixel Art Endless Side-Scroller Game Engine
 * Refactored modular game coordinator using OOP principles.
 */
import { PhonkAudioEngine } from './phonkRunner/PhonkAudioEngine.js';
import { PhonkCityLandmarks } from './phonkRunner/PhonkCityLandmarks.js';
import { PhonkEntities } from './phonkRunner/PhonkEntities.js';

export function initPhonkRunner() {
    const canvas = document.getElementById('phonkRunnerCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const W = 1100, H = 260;
    const GROUND = H - 42;
    const GRAVITY = 0.55;
    const JUMP_V = -5.6;
    const GRAVITY_HELD = 0.05;
    const MAX_HOLD_FRAMES = 18;

    const audio = new PhonkAudioEngine();
    const city = new PhonkCityLandmarks(ctx, { W, H, GROUND });
    const entities = new PhonkEntities(ctx, { W, H, GROUND });

    let state = 'idle';
    let score = 0;
    let hiScore = parseInt(localStorage.getItem('phonkRunnerHi') || '0');
    let frame = 0;
    let speed = 3.2;
    let spawnTimer = 0;
    let spawnInterval = 100;
    let level = 1;
    let rafId = null;

    let jumpHeld = false;
    let jumpHeldFrames = 0;
    let lastTouch = 0;

    const layers = [
        { x: 0, speed: 0.2, draw: (ox) => city.drawFarCity(ox, frame) },
        { x: 0, speed: 0.5, draw: (ox) => city.drawMidCity(ox, frame) },
        { x: 0, speed: 0.8, draw: (ox) => city.drawNearCity(ox, frame) },
    ];

    function glowRect(x, y, w, h, color, blur) {
        ctx.save();
        ctx.shadowColor = color;
        ctx.shadowBlur = blur;
        ctx.fillStyle = color;
        ctx.fillRect(Math.round(x), Math.round(y), w, h);
        ctx.restore();
    }

    function pressJump() {
        if (state === 'idle') { startGame(); jumpHeld = true; return; }
        if (state === 'dead') { resetGame(); jumpHeld = true; return; }
        const p = entities.player;
        if (p.jumps < p.maxJumps) {
            p.vy = JUMP_V;
            const isDouble = p.jumps >= 1;
            p.jumps++;
            jumpHeld = true;
            jumpHeldFrames = 0;
            entities.spawnJumpParticles();
            audio.playJumpSfx(isDouble);
        }
    }

    function releaseJump() {
        jumpHeld = false;
    }

    function isInputActive() {
        const activeEl = document.activeElement;
        return activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.isContentEditable);
    }

    document.addEventListener('keydown', e => {
        if (isInputActive()) return;
        if ((e.code === 'Space' || e.code === 'ArrowUp') && !e.repeat) {
            e.preventDefault();
            pressJump();
        }
    });

    document.addEventListener('keyup', e => {
        if (isInputActive()) return;
        if (e.code === 'Space' || e.code === 'ArrowUp') releaseJump();
    });

    canvas.addEventListener('click', () => {
        if (Date.now() - lastTouch < 350) return;
        pressJump();
        setTimeout(releaseJump, 250);
    });

    canvas.addEventListener('touchstart', e => {
        e.preventDefault();
        lastTouch = Date.now();
        pressJump();
    }, { passive: false });

    canvas.addEventListener('touchend', e => {
        e.preventDefault();
        releaseJump();
    }, { passive: false });

    function startGame() {
        state = 'running';
        audio.startBGM();
        loop();
    }

    function resetGame() {
        score = 0; speed = 3.2; spawnTimer = 0; spawnInterval = 100; level = 1; frame = 0;
        entities.reset();
        city.resetQueues();

        layers.forEach(l => { l.x = 0; });
        updateHUD();
        state = 'running';
        audio.stopBGM();
        audio.startBGM();
        if (!rafId) loop();
    }

    function killPlayer() {
        const p = entities.player;
        if (p.dead) return;
        p.dead = true;
        state = 'dead';
        audio.stopBGM();
        audio.playDeathSfx();
        entities.spawnDeathParticles();
        if (score > hiScore) {
            hiScore = score;
            localStorage.setItem('phonkRunnerHi', hiScore);
        }
        updateHUD();
    }

    function updateHUD() {
        const pad = n => String(Math.floor(n)).padStart(6, '0');
        const scoreEl = document.getElementById('game-score');
        const hiScoreEl = document.getElementById('game-hi-score');
        const levelEl = document.getElementById('game-level-badge');
        if (scoreEl) scoreEl.textContent = pad(score);
        if (hiScoreEl) hiScoreEl.textContent = pad(hiScore);
        if (levelEl) levelEl.textContent = 'LVL ' + level;
    }

    function drawGround() {
        ctx.fillStyle = '#0d0028';
        ctx.fillRect(0, GROUND + 28, W, H - GROUND - 28);
        glowRect(0, GROUND + 27, W, 2, '#a855f7', 10);
        ctx.strokeStyle = 'rgba(168,85,247,0.15)';
        ctx.lineWidth = 1;
        const gridSpacing = 40;
        const offset = (frame * speed * 0.5) % gridSpacing;
        for (let x = -offset; x < W; x += gridSpacing) {
            ctx.beginPath();
            ctx.moveTo(x, GROUND + 29);
            ctx.lineTo(x + 20, H);
            ctx.stroke();
        }
        glowRect(0, GROUND + 26, W, 3, '#06b6d4', 6);
    }

    function drawScanlines() {
        ctx.save();
        ctx.globalAlpha = 0.04;
        ctx.fillStyle = '#000';
        for (let y = 0; y < H; y += 3) {
            ctx.fillRect(0, y, W, 1);
        }
        const vg = ctx.createRadialGradient(W/2, H/2, H*0.3, W/2, H/2, H);
        vg.addColorStop(0, 'transparent');
        vg.addColorStop(1, 'rgba(0,0,0,0.4)');
        ctx.globalAlpha = 1;
        ctx.fillStyle = vg;
        ctx.fillRect(0, 0, W, H);
        ctx.restore();
    }

    function drawGlitchScore() {
        if (state !== 'running') return;
        ctx.save();
        ctx.font = 'bold 14px monospace';
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 8;
        ctx.fillStyle = '#00f5ff';
        ctx.fillText('SCORE: ' + Math.floor(score).toString().padStart(6, '0'), 15, 25);
        
        if (Math.random() > 0.93) {
            ctx.shadowColor = '#f43f5e';
            ctx.fillStyle = '#f43f5e';
            ctx.fillText('SCORE: ' + Math.floor(score).toString().padStart(6, '0'), 16, 26);
        }
        ctx.restore();
    }

    function loop() {
        rafId = requestAnimationFrame(loop);
        frame++;

        const p = entities.player;

        if (state === 'running') {
            score += speed * 0.07;
            speed = 3.2 + score * 0.0018;
            level = Math.min(10, 1 + Math.floor(score / 500));
            spawnInterval = Math.max(55, 100 - level * 4);
            if (frame % 120 === 0) updateHUD();

            spawnTimer++;
            if (spawnTimer >= spawnInterval) {
                entities.spawnObstacle(level);
                spawnTimer = 0;
            }

            layers.forEach(l => { l.x += l.speed * speed; });
            entities.obstacles.forEach(ob => { ob.x -= speed; });
            entities.obstacles = entities.obstacles.filter(ob => ob.x > -60);

            const activeGravity = (jumpHeld && p.vy < 0 && jumpHeldFrames < MAX_HOLD_FRAMES)
                ? GRAVITY_HELD
                : GRAVITY;
            if (jumpHeld && p.vy < 0) jumpHeldFrames++;
            p.vy += activeGravity;
            p.y += p.vy;

            if (p.y >= GROUND) {
                p.y = GROUND;
                p.vy = 0;
                p.jumps = 0;
                jumpHeld = false;
                jumpHeldFrames = 0;
            }
            if (p.y < 0) {
                p.y = 0;
                if (p.vy < 0) p.vy = 0;
            }

            if (p.y >= GROUND - 1) {
                p.animTimer++;
                if (p.animTimer > 6) {
                    p.animFrame = (p.animFrame + 1) % 4;
                    p.animTimer = 0;
                }
            }

            entities.particles.forEach(pt => { pt.x += pt.vx; pt.y += pt.vy; pt.vy += 0.1; pt.life--; });
            entities.particles = entities.particles.filter(pt => pt.life > 0);

            if (entities.checkCollision()) killPlayer();

        } else if (state === 'dead') {
            p.deathTimer = Math.min(p.deathTimer + 1, 30);
            entities.obstacles.forEach(ob => { ob.x -= speed * 0.3; });
            layers.forEach(l => { l.x += l.speed * speed * 0.2; });
            entities.particles.forEach(pt => { pt.x += pt.vx; pt.y += pt.vy; pt.vy += 0.15; pt.life--; });
            entities.particles = entities.particles.filter(pt => pt.life > 0);
        }

        ctx.fillStyle = '#0a001e';
        ctx.fillRect(0, 0, W, H);

        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        for (let s = 0; s < 30; s++) {
            const sx = ((s * 137 + frame * 0.2) % W);
            const sy = (s * 53) % (GROUND * 0.5);
            const ss = s % 3 === 0 ? 1.5 : 0.5;
            if (Math.sin(frame * 0.03 + s) > 0.7) {
                glowRect(sx, sy, ss, ss, '#c4b5fd', 4);
            } else {
                ctx.fillRect(sx, sy, ss, ss);
            }
        }

        layers.forEach(l => l.draw(l.x));
        drawGround();
        entities.obstacles.forEach(ob => entities.drawObstacle(ob, frame));
        entities.drawPlayer();
        entities.drawParticles();
        drawGlitchScore();
        drawScanlines();

        if (state === 'dead' && p.deathTimer > 15) {
            ctx.save();
            ctx.globalAlpha = Math.min((p.deathTimer - 15) / 15, 0.78);
            ctx.fillStyle = '#08000f';
            ctx.fillRect(0, 0, W, H);
            ctx.globalAlpha = 1;
            ctx.textAlign = 'center';
            ctx.font = 'bold 20px monospace';
            ctx.shadowColor = '#f43f5e';
            ctx.shadowBlur = 24;
            ctx.fillStyle = '#f43f5e';
            ctx.fillText('// SYSTEM FAILURE //', W / 2, H / 2 - 22);
            ctx.font = 'bold 13px monospace';
            ctx.fillStyle = '#a855f7';
            ctx.shadowColor = '#a855f7';
            ctx.shadowBlur = 12;
            ctx.fillText('SCORE: ' + Math.floor(score).toString().padStart(6, '0'), W / 2, H / 2 + 4);
            if (Math.floor(frame / 30) % 2 === 0) {
                ctx.font = '11px monospace';
                ctx.fillStyle = '#67e8f9';
                ctx.shadowColor = '#06b6d4';
                ctx.shadowBlur = 10;
                ctx.fillText('[ PRESS SPACE / CLICK TO RETRY ]', W / 2, H / 2 + 26);
            }
            ctx.textAlign = 'left';
            ctx.restore();
        }

        if (state === 'idle') {
            ctx.save();
            ctx.globalAlpha = 0.6;
            ctx.fillStyle = '#04000a';
            ctx.fillRect(0, 0, W, H);
            ctx.globalAlpha = 1;
            ctx.font = 'bold 18px monospace';
            ctx.shadowColor = '#a855f7';
            ctx.shadowBlur = 20;
            ctx.fillStyle = '#a855f7';
            ctx.textAlign = 'center';
            const glitch = frame % 20 < 2;
            ctx.fillText(glitch ? '⚡ CYBER PHONK RUNNER ⚡' : '⚡ CYBER PHONK RUNNER ⚡', W / 2 + (glitch ? 3 : 0), H / 2 - 10);
            ctx.font = '10px monospace';
            ctx.fillStyle = '#06b6d4';
            ctx.shadowColor = '#06b6d4';
            ctx.fillText('KILL TIME PROTOCOL — DOUBLE JUMP ENABLED', W / 2, H / 2 + 14);
            ctx.textAlign = 'left';
            ctx.restore();
        }
    }

    loop();
}
