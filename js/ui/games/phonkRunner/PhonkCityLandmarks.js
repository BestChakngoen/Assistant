/**
 * PhonkCityLandmarks.js - Parallax City Background Landmarks & Renderers
 */
export class PhonkCityLandmarks {
    constructor(ctx, config) {
        this.ctx = ctx;
        this.W = config.W;
        this.H = config.H;
        this.GROUND = config.GROUND;

        this.farCityQueue = [];
        this.midCityQueue = [];
        this.nearCityQueue = [];

        this._initLandmarks();
    }

    _px(x, y, w, h, color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(Math.round(x), Math.round(y), w, h);
    }

    _glowRect(x, y, w, h, color, blur) {
        this.ctx.save();
        this.ctx.shadowColor = color;
        this.ctx.shadowBlur = blur;
        this.ctx.fillStyle = color;
        this.ctx.fillRect(Math.round(x), Math.round(y), w, h);
        this.ctx.restore();
    }

    _initLandmarks() {
        const ctx = this.ctx;
        const GROUND = this.GROUND;
        const px = (x, y, w, h, color) => this._px(x, y, w, h, color);
        const glowRect = (x, y, w, h, color, blur) => this._glowRect(x, y, w, h, color, blur);

        this.farCityLandmarks = [
            {
                w: 45,
                draw: (x, frame) => {
                    const h = 135;
                    ctx.save();
                    px(x, GROUND - h, 45, h, '#16033a');
                    ctx.fillStyle = '#000000';
                    ctx.beginPath();
                    ctx.moveTo(x + 30, GROUND - h);
                    ctx.lineTo(x + 45, GROUND - h);
                    ctx.lineTo(x + 45, GROUND - h + 15);
                    ctx.closePath();
                    ctx.fill();
                    
                    px(x + 15, GROUND - h - 15, 2, 15, '#22084f');
                    if (Math.floor(frame / 15) % 2 === 0) {
                        glowRect(x + 14, GROUND - h - 18, 4, 4, '#f43f5e', 8);
                    }
                    for (let wy = GROUND - h + 25; wy < GROUND - 10; wy += 12) {
                        for (let wx = x + 6; wx < x + 38; wx += 8) {
                            if ((Math.floor(wx) + wy) % 5 !== 0) {
                                px(wx, wy, 3, 5, '#1b004a');
                            }
                        }
                    }
                    ctx.restore();
                }
            },
            {
                w: 64,
                draw: (x, frame) => {
                    ctx.save();
                    const cx = x + 32;
                    const cy = GROUND - 85;
                    px(cx - 3, cy, 6, 85, '#16033a');
                    px(cx - 10, GROUND - 12, 20, 12, '#16033a');
                    
                    const angle = frame * 0.03;
                    ctx.strokeStyle = '#a855f7';
                    ctx.lineWidth = 2;
                    ctx.shadowColor = '#a855f7';
                    ctx.shadowBlur = 4;
                    for (let b = 0; b < 3; b++) {
                        const a = angle + (b * Math.PI * 2) / 3;
                        const bx = cx + Math.cos(a) * 32;
                        const by = cy + Math.sin(a) * 32;
                        ctx.beginPath();
                        ctx.moveTo(cx, cy);
                        ctx.lineTo(bx, by);
                        ctx.stroke();
                        
                        glowRect(bx - 1.5, by - 1.5, 3, 3, '#06b6d4', 2);
                    }
                    glowRect(cx - 4, cy - 4, 8, 8, '#06b6d4', 6);
                    ctx.restore();
                }
            },
            {
                w: 70,
                draw: (x) => {
                    ctx.save();
                    const r = 35;
                    const cx = x + 35;
                    const cy = GROUND;
                    
                    ctx.fillStyle = '#150235';
                    ctx.beginPath();
                    ctx.arc(cx, cy, r, Math.PI, 0);
                    ctx.fill();
                    
                    ctx.strokeStyle = 'rgba(168,85,247,0.35)';
                    ctx.lineWidth = 1;
                    
                    for (let i = -2; i <= 2; i++) {
                        const rx = r * (i / 3);
                        ctx.beginPath();
                        for (let angle = 0; angle <= Math.PI; angle += 0.1) {
                            const px_val = cx + Math.cos(angle) * rx;
                            const py_val = cy - Math.sin(angle) * r;
                            if (angle === 0) ctx.moveTo(px_val, py_val);
                            else ctx.lineTo(px_val, py_val);
                        }
                        ctx.stroke();
                    }
                    
                    for (let h_ring = 1; h_ring <= 3; h_ring++) {
                        const h_val = r * (h_ring / 4);
                        const w_val = Math.sqrt(r * r - h_val * h_val);
                        ctx.beginPath();
                        ctx.moveTo(cx - w_val, cy - h_val);
                        ctx.lineTo(cx + w_val, cy - h_val);
                        ctx.stroke();
                    }
                    ctx.restore();
                }
            },
            {
                w: 40,
                draw: (x, frame) => {
                    ctx.save();
                    const h = 120;
                    const cx = x + 20;
                    ctx.strokeStyle = '#16033a';
                    ctx.lineWidth = 4;
                    ctx.beginPath();
                    ctx.moveTo(cx - 12, GROUND);
                    ctx.lineTo(cx, GROUND - h + 40);
                    ctx.lineTo(cx + 12, GROUND);
                    ctx.stroke();
                    
                    px(cx - 2, GROUND - h, 4, h, '#16033a');
                    
                    const deckY = GROUND - h + 30;
                    px(cx - 15, deckY, 30, 8, '#20054e');
                    glowRect(cx - 16, deckY + 3, 32, 2, '#06b6d4', 4);
                    
                    px(cx - 1, GROUND - h - 15, 2, 15, '#16033a');
                    if (Math.floor(frame / 10) % 2 === 0) {
                        glowRect(cx - 2, GROUND - h - 18, 4, 4, '#f43f5e', 8);
                    }
                    ctx.restore();
                }
            },
            {
                w: 90,
                draw: (x) => {
                    ctx.save();
                    const pyY = GROUND - 70;
                    const p1 = x + 15;
                    const p2 = x + 75;
                    
                    px(p1 - 4, pyY, 8, 70, '#150235');
                    px(p2 - 4, pyY, 8, 70, '#150235');
                    
                    px(x, GROUND - 40, 90, 8, '#1b0445');
                    glowRect(x, GROUND - 40, 90, 2, '#a855f7', 4);
                    
                    ctx.strokeStyle = 'rgba(6,182,212,0.4)';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(x, GROUND - 40);
                    ctx.lineTo(p1, pyY);
                    ctx.lineTo(x + 45, GROUND - 40);
                    ctx.lineTo(p2, pyY);
                    ctx.lineTo(x + 90, GROUND - 40);
                    ctx.stroke();
                    ctx.restore();
                }
            }
        ];

        this.midCityLandmarks = [
            {
                w: 50,
                draw: (x) => {
                    ctx.save();
                    const h = 75;
                    const cx = x + 25;
                    ctx.fillStyle = '#240656';
                    ctx.beginPath();
                    ctx.moveTo(x + 5, GROUND);
                    ctx.quadraticCurveTo(cx - 10, GROUND - h/2, cx - 12, GROUND - h);
                    ctx.lineTo(cx + 12, GROUND - h);
                    ctx.quadraticCurveTo(cx + 10, GROUND - h/2, x + 45, GROUND);
                    ctx.closePath();
                    ctx.fill();
                    
                    glowRect(cx - 12, GROUND - h, 24, 2, '#06b6d4', 6);
                    
                    px(cx - 13, GROUND - h + 15, 26, 2, '#120033');
                    px(cx - 15, GROUND - h + 35, 30, 2, '#120033');
                    px(cx - 18, GROUND - h + 55, 36, 2, '#120033');
                    ctx.restore();
                }
            },
            {
                w: 75,
                draw: (x, frame) => {
                    ctx.save();
                    const screenW = 65;
                    const screenH = 45;
                    const screenX = x + 5;
                    const screenY = GROUND - 85;
                    
                    px(x + 20, screenY + screenH, 4, 85 - screenH, '#20044b');
                    px(x + 50, screenY + screenH, 4, 85 - screenH, '#20044b');
                    
                    px(screenX, screenY, screenW, screenH, '#240656');
                    glowRect(screenX, screenY, screenW, 2, '#f43f5e', 4);
                    glowRect(screenX, screenY + screenH - 2, screenW, 2, '#f43f5e', 4);
                    glowRect(screenX, screenY, 2, screenH, '#f43f5e', 4);
                    glowRect(screenX + screenW - 2, screenY, 2, screenH, '#f43f5e', 4);
                    
                    const barCount = 7;
                    const barW = 6;
                    const spacing = 2;
                    const startBarX = screenX + (screenW - (barCount * (barW + spacing) - spacing)) / 2;
                    for (let b = 0; b < barCount; b++) {
                        const val = Math.sin(frame * 0.15 + b) * 0.5 + 0.5;
                        const barH = Math.max(4, Math.round(val * (screenH - 12)));
                        const bx = startBarX + b * (barW + spacing);
                        const by = screenY + screenH - 6 - barH;
                        px(bx, by, barW, barH, '#06b6d4');
                    }
                    ctx.restore();
                }
            },
            {
                w: 60,
                draw: (x) => {
                    ctx.save();
                    px(x, GROUND - 30, 35, 30, '#23054e');
                    glowRect(x + 2, GROUND - 28, 2, 26, '#a855f7', 4);
                    
                    px(x + 30, GROUND - 25, 25, 25, '#1d0240');
                    
                    px(x + 10, GROUND - 55, 40, 28, '#2c0a68');
                    glowRect(x + 10, GROUND - 55, 40, 2, '#06b6d4', 4);
                    
                    ctx.fillStyle = 'rgba(244,63,94,0.3)';
                    for (let sx = x + 15; sx < x + 45; sx += 6) {
                        ctx.beginPath();
                        ctx.moveTo(sx, GROUND - 50);
                        ctx.lineTo(sx + 3, GROUND - 50);
                        ctx.lineTo(sx - 2, GROUND - 35);
                        ctx.lineTo(sx - 5, GROUND - 35);
                        ctx.fill();
                    }
                    ctx.restore();
                }
            },
            {
                w: 55,
                draw: (x, frame) => {
                    ctx.save();
                    const cx = x + 27;
                    const cy = GROUND - 50;
                    
                    ctx.strokeStyle = '#240656';
                    ctx.lineWidth = 4;
                    ctx.beginPath();
                    ctx.moveTo(cx - 15, GROUND);
                    ctx.lineTo(cx, cy);
                    ctx.lineTo(cx + 15, GROUND);
                    ctx.stroke();
                    
                    ctx.strokeStyle = '#2c0a68';
                    ctx.lineWidth = 6;
                    ctx.beginPath();
                    ctx.arc(cx, cy, 20, 0, Math.PI * 2);
                    ctx.stroke();
                    
                    ctx.strokeStyle = '#06b6d4';
                    ctx.lineWidth = 2;
                    ctx.shadowColor = '#06b6d4';
                    ctx.shadowBlur = 6;
                    ctx.beginPath();
                    ctx.arc(cx, cy, 17, 0, Math.PI * 2);
                    ctx.stroke();
                    
                    const pulse = Math.sin(frame * 0.1) * 0.5 + 0.5;
                    glowRect(cx - 3, cy - 3, 6, 6, '#f43f5e', 4 + pulse * 6);
                    ctx.restore();
                }
            }
        ];

        this.nearCityLandmarks = [
            {
                w: 50,
                draw: (x, frame) => {
                    ctx.save();
                    const h = 75;
                    px(x, GROUND - h, 50, h, '#320a75');
                    
                    const signX = x + 15;
                    const signY = GROUND - h + 10;
                    const signW = 20;
                    const signH = 45;
                    px(signX, signY, signW, signH, '#200252');
                    glowRect(signX, signY, signW, 2, '#06b6d4', 4);
                    glowRect(signX, signY + signH - 2, signW, 2, '#06b6d4', 4);
                    
                    px(signX + 6, signY + 6, 8, 8, '#06b6d4');
                    px(signX + 8, signY + 8, 4, 4, '#110033');
                    if (Math.floor(frame / 20) % 2 === 0) {
                        px(signX + 6, signY + 22, 8, 2, '#f43f5e');
                        px(signX + 9, signY + 19, 2, 8, '#f43f5e');
                    } else {
                        px(signX + 6, signY + 22, 8, 2, '#a855f7');
                        px(signX + 9, signY + 19, 2, 8, '#a855f7');
                    }
                    px(signX + 6, signY + 33, 8, 2, '#06b6d4');
                    px(signX + 6, signY + 37, 8, 2, '#06b6d4');
                    ctx.restore();
                }
            },
            {
                w: 45,
                draw: (x) => {
                    ctx.save();
                    const r = 16;
                    const cx = x + 22;
                    const cy = GROUND - 35;
                    
                    ctx.strokeStyle = '#2a0665';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.moveTo(cx - 10, GROUND);
                    ctx.lineTo(cx - 6, cy + 5);
                    ctx.moveTo(cx + 10, GROUND);
                    ctx.lineTo(cx + 6, cy + 5);
                    ctx.moveTo(cx, GROUND);
                    ctx.lineTo(cx, cy + 8);
                    ctx.stroke();
                    
                    ctx.fillStyle = '#300772';
                    ctx.beginPath();
                    ctx.arc(cx, cy, r, 0, Math.PI * 2);
                    ctx.fill();
                    
                    ctx.strokeStyle = '#a855f7';
                    ctx.lineWidth = 2;
                    ctx.shadowColor = '#a855f7';
                    ctx.shadowBlur = 6;
                    ctx.beginPath();
                    ctx.arc(cx, cy, r, Math.PI * 0.25, Math.PI * 0.75);
                    ctx.stroke();
                    
                    glowRect(cx - 2, cy - r - 4, 4, 4, '#f43f5e', 4);
                    ctx.restore();
                }
            },
            {
                w: 60,
                draw: (x, frame) => {
                    ctx.save();
                    const h = 85;
                    const mastX = x + 15;
                    
                    px(mastX, GROUND - h, 6, h, '#2a0665');
                    ctx.strokeStyle = '#2a0665';
                    ctx.lineWidth = 1;
                    for (let ty = GROUND - h + 10; ty < GROUND; ty += 15) {
                        ctx.beginPath();
                        ctx.moveTo(mastX, ty);
                        ctx.lineTo(mastX + 6, ty + 10);
                        ctx.moveTo(mastX + 6, ty);
                        ctx.lineTo(mastX, ty + 10);
                        ctx.stroke();
                    }
                    
                    px(x, GROUND - h, 55, 4, '#1c004d');
                    px(x + 2, GROUND - h + 4, 8, 6, '#110033');
                    
                    const cableX = x + 42;
                    const cableLen = 25 + Math.sin(frame * 0.05) * 5;
                    ctx.strokeStyle = '#110033';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(cableX, GROUND - h + 4);
                    ctx.lineTo(cableX, GROUND - h + 4 + cableLen);
                    ctx.stroke();
                    
                    const crateY = GROUND - h + 4 + cableLen;
                    px(cableX - 5, crateY, 10, 10, '#22005a');
                    glowRect(cableX - 5, crateY, 10, 2, '#06b6d4', 4);
                    ctx.restore();
                }
            },
            {
                w: 70,
                draw: (x, frame) => {
                    ctx.save();
                    px(x + 10, GROUND - 65, 8, 65, '#22005a');
                    px(x + 52, GROUND - 65, 8, 65, '#22005a');
                    px(x + 5, GROUND - 65, 60, 10, '#1c004d');
                    
                    const signX = x + 22;
                    const signY = GROUND - 52;
                    px(signX, signY, 26, 12, '#110033');
                    const activeColor = Math.floor(frame / 30) % 2 === 0 ? '#a855f7' : '#f43f5e';
                    glowRect(signX, signY, 26, 2, activeColor, 4);
                    glowRect(signX, signY + 10, 26, 2, activeColor, 4);
                    
                    glowRect(signX + 11, signY + 4, 4, 4, '#06b6d4', 6);
                    ctx.restore();
                }
            }
        ];
    }

    resetQueues() {
        this.farCityQueue = [];
        this.midCityQueue = [];
        this.nearCityQueue = [];
    }

    updateBackgroundQueue(queue, landmarks, minGap, maxGap, offsetX) {
        while (queue.length > 0 && queue[0].x + queue[0].w + queue[0].gap < offsetX) {
            queue.shift();
        }

        if (queue.length === 0) {
            const type = Math.floor(Math.random() * landmarks.length);
            const gap = minGap + Math.random() * (maxGap - minGap);
            queue.push({
                x: offsetX,
                w: landmarks[type].w,
                gap: gap,
                type: type
            });
        }

        let lastItem = queue[queue.length - 1];
        while (lastItem.x + lastItem.w + lastItem.gap < offsetX + this.W + 1000) {
            const nextX = lastItem.x + lastItem.w + lastItem.gap;
            const type = Math.floor(Math.random() * landmarks.length);
            
            let gap;
            const roll = Math.random();
            if (roll < 0.25) {
                gap = Math.floor(10 + Math.random() * 30);
            } else if (roll < 0.85) {
                gap = minGap + Math.random() * (maxGap - minGap);
            } else {
                gap = Math.floor(maxGap * 1.5 + Math.random() * maxGap);
            }

            queue.push({
                x: nextX,
                w: landmarks[type].w,
                gap: gap,
                type: type
            });
            lastItem = queue[queue.length - 1];
        }
    }

    drawFarCity(offsetX, frame) {
        this.updateBackgroundQueue(this.farCityQueue, this.farCityLandmarks, 50, 180, offsetX);
        this.farCityQueue.forEach(item => {
            const bx = item.x - offsetX;
            if (bx + item.w > 0 && bx < this.W) {
                this.farCityLandmarks[item.type].draw(bx, frame);
            }
        });
    }

    drawMidCity(offsetX, frame) {
        this.updateBackgroundQueue(this.midCityQueue, this.midCityLandmarks, 60, 240, offsetX);
        this.midCityQueue.forEach(item => {
            const bx = item.x - offsetX;
            if (bx + item.w > 0 && bx < this.W) {
                this.midCityLandmarks[item.type].draw(bx, frame);
            }
        });
    }

    drawNearCity(offsetX, frame) {
        this.updateBackgroundQueue(this.nearCityQueue, this.nearCityLandmarks, 70, 280, offsetX);
        this.nearCityQueue.forEach(item => {
            const bx = item.x - offsetX;
            if (bx + item.w > 0 && bx < this.W) {
                this.nearCityLandmarks[item.type].draw(bx, frame);
            }
        });
    }
}
