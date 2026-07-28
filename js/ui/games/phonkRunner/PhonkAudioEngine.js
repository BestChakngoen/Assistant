/**
 * PhonkAudioEngine.js - 808 Cyber Phonk Web Audio Synthesizer & BGM Sequencer
 * Uses parameters from PhonkConfig.js.
 */
import { PHONK_CONFIG } from './PhonkConfig.js';

export class PhonkAudioEngine {
    constructor() {
        this.audioCtx = null;
        this.masterGain = null;
        this.muted = false;
        this.bgmPlaying = false;
        this.seqTimer = null;
        this.seqStep = 0;
        this.nextStepTime = 0;
        
        this.BPM = PHONK_CONFIG.AUDIO.BPM;
        this.STEP = 60 / this.BPM / 4;

        this.CHORDS = [
            [110, 131, 165, 196, 220],
            [110, 131, 165, 196, 220],
            [82,  98, 123, 155, 196],
            [82,  98, 123, 155, 196],
        ];

        this.KICK = [1,0,0,0, 0,0,0,0, 0,1,0,0, 0,0,0,0];
        this.SNAP = [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0];
        this.HAT  = [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0];
        this.HATG = [0,1,0,0, 0,1,0,0, 0,1,0,0, 0,1,0,0];
        this.BASS = [110,0,0,0, 82,0,0,0, 110,0,0,0, 98,0,73,0];

        this._registerMuteGlobal();
    }

    getACtx() {
        if (!this.audioCtx) {
            const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
            if (AudioCtxClass) {
                this.audioCtx = new AudioCtxClass();
                this.masterGain = this.audioCtx.createGain();
                this.masterGain.gain.value = this.muted ? 0 : PHONK_CONFIG.AUDIO.MASTER_GAIN;
                this.masterGain.connect(this.audioCtx.destination);
            }
        }
        if (this.audioCtx && this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
        return this.audioCtx;
    }

    _registerMuteGlobal() {
        window.__phonkToggleMute = () => {
            this.muted = !this.muted;
            if (this.masterGain) {
                this.masterGain.gain.value = this.muted ? 0 : PHONK_CONFIG.AUDIO.MASTER_GAIN;
            }
            const btn = document.getElementById('game-mute-btn');
            if (btn) {
                btn.textContent = this.muted ? '🔇' : '🔊';
            }
        };
    }

    playKick(when) {
        const ctx = this.getACtx();
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(90, when);
        osc.frequency.exponentialRampToValueAtTime(45, when + 0.08);
        gain.gain.setValueAtTime(PHONK_CONFIG.AUDIO.KICK_VOL, when);
        gain.gain.exponentialRampToValueAtTime(0.001, when + 0.28);
        osc.start(when);
        osc.stop(when + 0.28);
    }

    playHihat(when, vol = PHONK_CONFIG.AUDIO.HIHAT_VOL) {
        const ctx = this.getACtx();
        if (!ctx) return;
        const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.09), ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        const src = ctx.createBufferSource();
        src.buffer = buf;
        const hpf = ctx.createBiquadFilter();
        hpf.type = 'highpass';
        hpf.frequency.value = 6000;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(vol, when);
        gain.gain.exponentialRampToValueAtTime(0.001, when + 0.09);
        src.connect(hpf);
        hpf.connect(gain);
        gain.connect(this.masterGain);
        src.start(when);
        src.stop(when + 0.1);
    }

    playSnare(when) {
        const ctx = this.getACtx();
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const og = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = 200;
        og.gain.setValueAtTime(0.28, when);
        og.gain.exponentialRampToValueAtTime(0.001, when + 0.12);
        osc.connect(og);
        og.connect(this.masterGain);
        osc.start(when);
        osc.stop(when + 0.12);

        const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.18), ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        const src = ctx.createBufferSource();
        src.buffer = buf;
        const bpf = ctx.createBiquadFilter();
        bpf.type = 'bandpass';
        bpf.frequency.value = 900;
        bpf.Q.value = 0.7;
        const ng = ctx.createGain();
        ng.gain.setValueAtTime(PHONK_CONFIG.AUDIO.SNARE_VOL, when);
        ng.gain.exponentialRampToValueAtTime(0.001, when + 0.2);
        src.connect(bpf);
        bpf.connect(ng);
        ng.connect(this.masterGain);
        src.start(when);
        src.stop(when + 0.2);
    }

    playBass(when, freq, beats = 2) {
        const ctx = this.getACtx();
        if (!ctx) return;
        const dur = this.STEP * beats * 3.8;
        const osc1 = ctx.createOscillator();
        const lpf1 = ctx.createBiquadFilter();
        lpf1.type = 'lowpass';
        lpf1.frequency.value = 320;
        lpf1.Q.value = 1.5;
        osc1.type = 'triangle';
        osc1.frequency.value = freq;

        const osc2 = ctx.createOscillator();
        const lpf2 = ctx.createBiquadFilter();
        lpf2.type = 'lowpass';
        lpf2.frequency.value = 260;
        lpf2.Q.value = 2;
        osc2.type = 'sawtooth';
        osc2.frequency.value = freq;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, when);
        gain.gain.linearRampToValueAtTime(PHONK_CONFIG.AUDIO.BASS_VOL, when + 0.015);
        gain.gain.setValueAtTime(0.55, when + dur * 0.6);
        gain.gain.exponentialRampToValueAtTime(0.001, when + dur);

        osc1.connect(lpf1);
        lpf1.connect(gain);
        osc2.connect(lpf2);
        lpf2.connect(gain);
        gain.connect(this.masterGain);

        osc1.start(when);
        osc1.stop(when + dur);
        osc2.start(when);
        osc2.stop(when + dur);
    }

    playPad(when, chordIdx) {
        const ctx = this.getACtx();
        if (!ctx) return;
        const freqs = this.CHORDS[chordIdx % this.CHORDS.length];
        const dur = this.STEP * 16;
        freqs.forEach((freq, i) => {
            const o1 = ctx.createOscillator();
            const o2 = ctx.createOscillator();
            o1.type = 'sawtooth';
            o1.frequency.value = freq;
            o2.type = 'sawtooth';
            o2.frequency.value = freq * 1.007;
            const lpf = ctx.createBiquadFilter();
            lpf.type = 'lowpass';
            lpf.frequency.value = 1200;
            lpf.Q.value = 0.5;
            const g = ctx.createGain();
            const vol = 0.04 - i * 0.003;
            g.gain.setValueAtTime(0, when);
            g.gain.linearRampToValueAtTime(vol, when + 0.3);
            g.gain.setValueAtTime(vol, when + dur - 0.4);
            g.gain.linearRampToValueAtTime(0, when + dur);
            o1.connect(lpf);
            o2.connect(lpf);
            lpf.connect(g);
            g.connect(this.masterGain);
            o1.start(when);
            o1.stop(when + dur);
            o2.start(when);
            o2.stop(when + dur);
        });
    }

    schedBGMStep(step, when) {
        const s = step % 16;
        if (this.KICK[s])     this.playKick(when);
        if (this.SNAP[s])     this.playSnare(when);
        if (this.HAT[s])      this.playHihat(when, PHONK_CONFIG.AUDIO.HIHAT_VOL);
        if (this.HATG[s])     this.playHihat(when, PHONK_CONFIG.AUDIO.HIHAT_VOL * 0.45);
        if (this.BASS[s] > 0) this.playBass(when, this.BASS[s]);
        if (s === 0)          this.playPad(when, Math.floor(step / 16) % this.CHORDS.length);
    }

    bgmTick() {
        const ctx = this.getACtx();
        if (!ctx) return;
        while (this.nextStepTime < ctx.currentTime + 0.15) {
            this.schedBGMStep(this.seqStep, this.nextStepTime);
            this.nextStepTime += this.STEP;
            this.seqStep++;
        }
    }

    startBGM() {
        this.stopBGM();
        this.bgmPlaying = true;
        const ctx = this.getACtx();
        if (!ctx) return;
        this.seqStep = 0;
        this.nextStepTime = ctx.currentTime + 0.05;
        this.seqTimer = setInterval(() => this.bgmTick(), 50);
    }

    stopBGM() {
        this.bgmPlaying = false;
        if (this.seqTimer) {
            clearInterval(this.seqTimer);
            this.seqTimer = null;
        }
    }

    playJumpSfx(isDouble) {
        const ctx = this.getACtx();
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.type = 'square';
        const t = ctx.currentTime;
        if (isDouble) {
            osc.frequency.setValueAtTime(380, t);
            osc.frequency.exponentialRampToValueAtTime(780, t + 0.07);
            osc.frequency.exponentialRampToValueAtTime(550, t + 0.15);
        } else {
            osc.frequency.setValueAtTime(190, t);
            osc.frequency.exponentialRampToValueAtTime(420, t + 0.1);
        }
        gain.gain.setValueAtTime(PHONK_CONFIG.AUDIO.JUMP_SFX_VOL, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
        osc.start(t);
        osc.stop(t + 0.18);
    }

    playDeathSfx() {
        const ctx = this.getACtx();
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.type = 'sawtooth';
        const t = ctx.currentTime;
        osc.frequency.setValueAtTime(320, t);
        osc.frequency.exponentialRampToValueAtTime(55, t + 0.45);
        gain.gain.setValueAtTime(PHONK_CONFIG.AUDIO.DEATH_SFX_VOL, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
        osc.start(t);
        osc.stop(t + 0.5);
    }

    playHitSfx() {
        const ctx = this.getACtx();
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.type = 'sawtooth';
        const t = ctx.currentTime;
        osc.frequency.setValueAtTime(220, t);
        osc.frequency.exponentialRampToValueAtTime(70, t + 0.2);
        gain.gain.setValueAtTime(0.6, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
        osc.start(t);
        osc.stop(t + 0.22);
    }

    playHealSfx() {
        const ctx = this.getACtx();
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.type = 'sine';
        const t = ctx.currentTime;
        osc.frequency.setValueAtTime(523.25, t);
        osc.frequency.setValueAtTime(659.25, t + 0.08);
        osc.frequency.setValueAtTime(783.99, t + 0.16);
        gain.gain.setValueAtTime(0.5, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
        osc.start(t);
        osc.stop(t + 0.35);
    }

    playBlastSfx() {
        const ctx = this.getACtx();
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.type = 'sawtooth';
        const t = ctx.currentTime;
        osc.frequency.setValueAtTime(300, t);
        osc.frequency.exponentialRampToValueAtTime(1200, t + 0.35);
        gain.gain.setValueAtTime(0.7, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
        osc.start(t);
        osc.stop(t + 0.4);
    }

    playGiantSfx() {
        const ctx = this.getACtx();
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.type = 'sawtooth';
        const t = ctx.currentTime;
        osc.frequency.setValueAtTime(110, t);
        osc.frequency.exponentialRampToValueAtTime(330, t + 0.3);
        osc.frequency.exponentialRampToValueAtTime(85, t + 0.55);
        gain.gain.setValueAtTime(0.8, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
        osc.start(t);
        osc.stop(t + 0.55);
    }

    playOrbSfx() {
        const ctx = this.getACtx();
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.type = 'sine';
        const t = ctx.currentTime;
        osc.frequency.setValueAtTime(880, t);
        osc.frequency.exponentialRampToValueAtTime(1320, t + 0.08);
        gain.gain.setValueAtTime(0.35, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
        osc.start(t);
        osc.stop(t + 0.1);
    }

    playMagnetSfx() {
        const ctx = this.getACtx();
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.type = 'triangle';
        const t = ctx.currentTime;
        osc.frequency.setValueAtTime(440, t);
        osc.frequency.linearRampToValueAtTime(880, t + 0.18);
        osc.frequency.linearRampToValueAtTime(1760, t + 0.35);
        gain.gain.setValueAtTime(0.5, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.38);
        osc.start(t);
        osc.stop(t + 0.38);
    }
}
