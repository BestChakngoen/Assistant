/**
 * BaseQuestController - Core Abstract Class for Game-Based Learning Modules
 * Provides shared state management, navigation rendering, progress tracking, and quest dispatching.
 */
export class BaseQuestController {
    /**
     * @param {Object} options
     * @param {string} options.subjectKey - Unique key for local storage (e.g. 'agriculture', 'electronics', 'software')
     * @param {string} options.subjectTitle - Subject display title
     * @param {Object} options.topicData - Curriculum topics dictionary
     * @param {string} options.themeColor - Primary theme color name ('emerald', 'amber', 'cyan')
     */
    constructor(options) {
        this.subjectKey = options.subjectKey;
        this.subjectTitle = options.subjectTitle;
        this.topicData = options.topicData;
        this.themeColor = options.themeColor || 'cyan';
        this.storageKey = `${this.subjectKey}_game_progress_v2`;
        
        const keys = Object.keys(this.topicData);
        this.activeTopicKey = keys.length > 0 ? keys[0] : null;
        this.activeStageIndex = 0;
        
        this.progressStore = JSON.parse(localStorage.getItem(this.storageKey)) || {};
        this.questHandlers = new Map();
    }

    init() {
        this.renderSyllabusMenu();
        this.renderQuestContent();
    }

    registerQuestHandler(topicKey, stageIndex, handler) {
        const key = `${topicKey}_${stageIndex}`;
        this.questHandlers.set(key, handler);
    }

    getThemeClasses() {
        const maps = {
            emerald: {
                activeText: 'text-emerald-400',
                activeBg: 'bg-emerald-500/10',
                activeBorder: 'border-emerald-500/20',
                activeBtn: 'bg-emerald-555/15 border-emerald-500/30 text-emerald-400 font-bold shadow-md',
                completedText: 'text-emerald-400',
                pulseDot: 'bg-emerald-400',
                iconColor: 'text-emerald-400',
                badgeText: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
            },
            amber: {
                activeText: 'text-amber-400',
                activeBg: 'bg-amber-500/10',
                activeBorder: 'border-amber-500/20',
                activeBtn: 'bg-amber-555/15 border-amber-500/30 text-amber-400 font-bold shadow-md',
                completedText: 'text-amber-400',
                pulseDot: 'bg-amber-400',
                iconColor: 'text-amber-400',
                badgeText: 'text-amber-400 bg-amber-500/10 border-amber-500/20'
            },
            cyan: {
                activeText: 'text-cyan-400',
                activeBg: 'bg-cyan-500/10',
                activeBorder: 'border-cyan-500/20',
                activeBtn: 'bg-cyan-550/15 border-cyan-500/30 text-cyan-400 font-bold shadow-md',
                completedText: 'text-emerald-400',
                pulseDot: 'bg-cyan-400',
                iconColor: 'text-cyan-400',
                badgeText: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20'
            }
        };
        return maps[this.themeColor] || maps.cyan;
    }

    renderSyllabusMenu() {
        const menuContainer = document.getElementById('accordion-menu-container');
        if (!menuContainer) return;
        menuContainer.innerHTML = '';

        const theme = this.getThemeClasses();

        Object.keys(this.topicData).forEach(key => {
            const topic = this.topicData[key];
            const isExpanded = key === this.activeTopicKey;

            const panel = document.createElement('div');
            panel.className = `border rounded-2xl overflow-hidden transition-all bg-slate-950/20 border-slate-900/80`;

            const header = document.createElement('button');
            header.className = `w-full flex items-center justify-between px-3.5 py-3 transition-colors text-left hover:bg-slate-800/25 ${
                isExpanded ? `border-b border-slate-855 bg-slate-900/10 ${theme.activeText} font-bold` : 'text-slate-355'
            }`;
            header.onclick = () => this.toggleTopic(key);

            header.innerHTML = `
                <div class="flex items-center gap-2 min-w-0">
                    <span class="text-[10px] font-mono text-slate-500 uppercase shrink-0">${topic.prefix}</span>
                    <span class="text-xs truncate">${topic.title}</span>
                </div>
                <i data-lucide="chevron-${isExpanded ? 'down' : 'right'}" class="w-3.5 h-3.5 text-slate-550 shrink-0 transition-transform"></i>
            `;
            panel.appendChild(header);

            if (isExpanded) {
                const stagesList = document.createElement('div');
                stagesList.className = 'p-1.5 space-y-1 bg-[#090d16]/30';

                topic.stages.forEach((stage, idx) => {
                    const isStageActive = idx === this.activeStageIndex;
                    const isStageCompleted = !!this.progressStore[`${key}_${idx}`];

                    const stageBtn = document.createElement('button');
                    stageBtn.className = `w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left text-[11px] transition-all border ${
                        isStageActive 
                            ? theme.activeBtn
                            : isStageCompleted
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-450 hover:text-emerald-355'
                                : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/20'
                    }`;
                    stageBtn.onclick = () => this.selectQuestStage(idx);

                    let stageIcon = 'lock';
                    if (this.subjectKey === 'software' && key === 'programming' && idx === 0) stageIcon = 'rocket';
                    else if (isStageCompleted) stageIcon = 'check';
                    else if (idx === 0 || isStageCompleted) stageIcon = 'play-circle';

                    stageBtn.innerHTML = `
                        <i data-lucide="${stageIcon}" class="w-3.5 h-3.5 shrink-0 ${isStageActive ? theme.iconColor : isStageCompleted ? 'text-emerald-400' : 'text-slate-555'}"></i>
                        <span class="truncate flex-grow">${idx + 1}. ${stage.title}</span>
                        ${isStageActive ? `<span class="w-1.5 h-1.5 rounded-full ${theme.pulseDot} animate-pulse shrink-0"></span>` : ''}
                    `;
                    stagesList.appendChild(stageBtn);
                });

                panel.appendChild(stagesList);
            }

            menuContainer.appendChild(panel);
        });

        if (window.lucide) window.lucide.createIcons();
        this.updateGlobalBadge();
    }

    toggleTopic(topicKey) {
        if (this.activeTopicKey === topicKey) {
            this.activeTopicKey = null;
        } else {
            this.activeTopicKey = topicKey;
            this.activeStageIndex = 0;
        }
        this.renderSyllabusMenu();
        this.renderQuestContent();
    }

    selectQuestStage(stageIdx) {
        this.activeStageIndex = stageIdx;
        this.renderSyllabusMenu();
        this.renderQuestContent();
    }

    renderQuestContent() {
        const board = document.getElementById('quest-board');
        if (!board) return;
        
        if (!this.activeTopicKey) {
            this.renderWelcomeScreen(board);
            return;
        }

        const handlerKey = `${this.activeTopicKey}_${this.activeStageIndex}`;
        const customQuest = this.questHandlers.get(handlerKey);

        if (customQuest && typeof customQuest.render === 'function') {
            customQuest.render(this, board);
        } else {
            this.renderDefaultBlueprint(board);
        }

        if (window.lucide) window.lucide.createIcons();
    }

    renderWelcomeScreen(board) {
        const theme = this.getThemeClasses();
        const totalTopics = Object.keys(this.topicData).length;

        board.innerHTML = `
            <div class="flex flex-col gap-6 text-center py-16 max-w-xl mx-auto items-center justify-center h-full">
                <div class="w-16 h-16 rounded-2xl ${theme.activeBg} border ${theme.activeBorder} ${theme.activeText} flex items-center justify-center animate-bounce">
                    <i data-lucide="compass" class="w-8 h-8"></i>
                </div>
                <div>
                    <h2 class="text-xl font-bold text-white tracking-wide">ยินดีต้อนรับสู่ ${this.subjectTitle} Quest</h2>
                    <p class="text-xs text-slate-455 mt-2.5 leading-relaxed">
                        เลือกหัวข้อวิชาการจากเมนูสารบัญด้านซ้าย เพื่อเริ่มสำรวจรายละเอียดด่านและทดสอบกับแบบจำลอง Interactive Sandbox
                    </p>
                </div>
                
                <div class="grid grid-cols-2 gap-4 w-full mt-6">
                    <div class="bg-slate-900/60 p-4.5 rounded-2xl border border-slate-850/60 text-center">
                        <span class="block text-[9px] text-slate-500 font-mono uppercase tracking-wider">หัวข้อการเรียนรู้</span>
                        <span class="text-lg font-bold text-white mt-1 block">${totalTopics} หมวดหลัก</span>
                    </div>
                    <div class="bg-slate-900/60 p-4.5 rounded-2xl border border-slate-850/60 text-center">
                        <span class="block text-[9px] text-slate-500 font-mono uppercase tracking-wider">ความคืบหน้าโดยรวม</span>
                        <span id="overview-progress-pct" class="text-lg font-bold ${theme.activeText} mt-1 block">0%</span>
                    </div>
                </div>
            </div>
        `;
        if (window.lucide) window.lucide.createIcons();
        this.updateOverviewProgress();
    }

    renderDefaultBlueprint(board) {
        const topic = this.topicData[this.activeTopicKey];
        const stage = topic.stages[this.activeStageIndex];
        const theme = this.getThemeClasses();

        board.innerHTML = `
            <div class="flex flex-col justify-between grow gap-5 min-h-[580px] lg:min-h-[calc(100vh-210px)] shrink-0">
                <div class="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/60 pb-4 shrink-0">
                    <div>
                        <span class="px-2 py-0.5 rounded ${theme.activeBg} border ${theme.activeBorder} text-[9px] font-mono font-bold ${theme.activeText} uppercase tracking-widest">
                            Quest 0${this.activeStageIndex + 1} — Sandbox Blueprint
                        </span>
                        <h2 class="text-base font-bold text-white mt-1 flex items-center gap-2">
                            🛠️ ${stage.title}
                        </h2>
                    </div>
                    <div class="text-left sm:text-right shrink-0">
                        <span class="block text-[8px] text-slate-500 font-mono">STAGE STATUS</span>
                        <span class="inline-block text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full ${theme.activeBg} border ${theme.activeBorder} ${theme.activeText}">UNDER DESIGN</span>
                    </div>
                </div>

                <div class="w-full grow flex flex-col gap-4">
                    <div class="glass-panel p-6 rounded-2xl bg-slate-950/80 border border-slate-855 flex flex-col justify-between flex-grow min-h-[300px]">
                        <div class="flex-grow flex flex-col items-center justify-center text-center p-6 gap-4">
                            <div class="w-14 h-14 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center ${theme.activeText} animate-pulse">
                                <i data-lucide="wrench" class="w-6 h-6 ${theme.activeText}"></i>
                            </div>
                            <div class="max-w-md">
                                <h4 class="text-sm font-bold text-slate-200">ระบบจำลอง Sandbox กำลังอยู่ในระหว่างพัฒนา</h4>
                                <p class="text-xs text-slate-400 mt-2 leading-relaxed font-sans">
                                    ขณะนี้ระบบการทดสอบและ Simulator ของหัวข้อ <strong>${topic.title}</strong> ในด่าน <strong>${stage.title}</strong> กำลังได้รับการออกแบบ คาดว่าจะเปิดใช้งานในเวอร์ชันถัดไป
                                </p>
                            </div>
                        </div>
                        <div class="mt-4 bg-black/60 border border-slate-850 p-3 rounded-xl text-[10px] sm:text-xs text-slate-550 flex items-center gap-2.5">
                            <i data-lucide="info" class="w-4 h-4 ${theme.activeText} shrink-0"></i>
                            <span class="font-mono text-left">Console: [SYSTEM WAITING] Ready to compile ${stage.title} components once design parameters are set.</span>
                        </div>
                    </div>
                </div>

                <div class="w-full flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border-t border-slate-800/60 pt-4 shrink-0">
                    <div class="text-slate-400 text-xs">
                        <span class="font-bold text-white flex items-center gap-1.5"><i data-lucide="edit-3" class="w-3.5 h-3.5 ${theme.activeText}"></i> Quest Designer:</span>
                        พร้อมร่วมออกแบบเงื่อนไขท้าทายสมองในด่านนี้
                    </div>
                    <button disabled class="flex items-center justify-center gap-2 bg-slate-850 text-slate-650 font-mono font-bold px-6 py-2.5 rounded-xl border border-slate-800 text-xs cursor-not-allowed shrink-0">
                        <i data-lucide="lock" class="w-4 h-4"></i>
                        <span>UNDER CONSTRUCTION</span>
                    </button>
                </div>
            </div>

            <div class="glass-panel p-5 rounded-2xl bg-slate-950/40 border border-slate-855 flex flex-col gap-3.5 mt-2 shrink-0">
                <h4 class="text-xs font-bold text-white flex items-center gap-1.5 shrink-0">
                    <i data-lucide="book-open" class="w-4 h-4 ${theme.activeText}"></i>
                    <span>คำอธิบายบทเรียน: ${stage.title}</span>
                </h4>
                <div class="text-[11px] text-slate-350 leading-relaxed overflow-y-visible pr-1.5 flex flex-col gap-3 select-text">
                    <p>
                        บทเรียนของหัวข้อ <strong>${topic.title}</strong> ในส่วนของ <strong>${stage.title}</strong> กำลังจัดเตรียมเนื้อหาทฤษฎีและคำอธิบายอย่างละเอียด
                    </p>
                    <div class="border-l-2 border-slate-700 pl-3.5 my-2 text-slate-400 italic font-sans">
                        "ความรู้ที่ดีไม่ได้เกิดจากการท่องจำ แต่เกิดจากการทำความเข้าใจโครงสร้างและการนำไปประยุกต์ใช้งาน..."
                    </div>
                    <p class="text-[10px] text-slate-500 border-t border-slate-900 pt-2 font-mono">
                        STATUS: Awaiting lesson content definitions and structural maps.
                    </p>
                </div>
            </div>
        `;
    }

    markStageCompleted(topicKey, stageIndex) {
        this.progressStore[`${topicKey}_${stageIndex}`] = true;
        localStorage.setItem(this.storageKey, JSON.stringify(this.progressStore));
        this.renderSyllabusMenu();
    }

    updateGlobalBadge() {
        let totalStages = 0;
        let completedStages = 0;
        
        Object.keys(this.topicData).forEach(topicId => {
            const topic = this.topicData[topicId];
            totalStages += topic.stages.length;
            topic.stages.forEach((_, idx) => {
                if (this.progressStore[`${topicId}_${idx}`]) completedStages++;
            });
        });

        const overallPct = Math.round((completedStages / totalStages) * 100);
        const globalProgEl = document.getElementById('global-progress');
        if (globalProgEl) globalProgEl.innerText = `Overall: ${overallPct}%`;
    }

    updateOverviewProgress() {
        let totalStages = 0;
        let completedStages = 0;
        
        Object.keys(this.topicData).forEach(topicId => {
            const topic = this.topicData[topicId];
            totalStages += topic.stages.length;
            topic.stages.forEach((_, idx) => {
                if (this.progressStore[`${topicId}_${idx}`]) completedStages++;
            });
        });

        const overallPct = Math.round((completedStages / totalStages) * 100);
        const overviewProgEl = document.getElementById('overview-progress-pct');
        if (overviewProgEl) overviewProgEl.innerText = `${overallPct}%`;
    }
}
