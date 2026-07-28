/**
 * Programming Quest 1: Variable Scope & Declaration / Spaceship Launch Protocol Simulator
 */
export const programmingScopeQuest = {
    render(controller, board) {
        board.innerHTML = `
            <div class="flex flex-col justify-between grow gap-5 min-h-[580px] lg:min-h-[calc(100vh-210px)] shrink-0">
                
                <div class="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/60 pb-4 shrink-0">
                    <div>
                        <span class="px-2.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-[9px] font-mono font-bold text-cyan-400 uppercase tracking-widest">
                            Quest 01 — Variable Scope & Declaration
                        </span>
                        <h2 class="text-base font-bold text-white mt-1 flex items-center gap-2">
                            🚀 Spaceship Launch Protocol
                        </h2>
                    </div>
                    <div class="text-left sm:text-right shrink-0">
                        <span class="block text-[8px] text-slate-500 font-mono">LAUNCH STATUS</span>
                        <span id="launch-status-badge" class="inline-block text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-950 text-slate-500 border border-slate-850">STANDBY</span>
                    </div>
                </div>

                <div class="w-full grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch grow">
                    <div class="glass-panel p-5 rounded-2xl bg-slate-950/40 border border-slate-855 flex flex-col justify-between overflow-hidden relative min-h-[280px]">
                        <div class="absolute inset-0 bg-gradient-to-b from-cyan-950/5 to-transparent pointer-events-none"></div>
                        <h4 class="text-[9px] font-mono tracking-wider text-slate-500 uppercase flex items-center gap-1.5 z-10">
                            <span class="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span> Live Engine Telemetry
                        </h4>
                        
                        <div class="flex-grow flex items-center justify-center relative py-8">
                            <div class="absolute inset-0 pointer-events-none opacity-25 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px]"></div>
                            <div id="spaceship-container" class="relative animate-hover-ship transition-all">
                                <div class="w-16 h-16 rounded-full bg-gradient-to-tr from-cyan-500/25 to-blue-500/10 border border-cyan-500/40 flex items-center justify-center relative shadow-2xl">
                                    <i data-lucide="rocket" class="w-8 h-8 text-cyan-400 relative z-10"></i>
                                </div>
                                <div id="thrust-effect" class="hidden absolute left-1/2 -bottom-6 -translate-x-1/2 w-4 h-10 bg-gradient-to-b from-orange-500 via-amber-400 to-transparent rounded-full blur-[2px]"></div>
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-3 border-t border-slate-855 pt-4 z-10">
                            <div class="bg-slate-900/60 p-2.5 rounded-xl border border-slate-850/60 text-center">
                                <span class="block text-[8px] text-slate-500 font-mono uppercase">Speed Meter</span>
                                <span id="telemetry-speed" class="text-sm font-mono font-bold text-slate-350">0 km/h</span>
                            </div>
                            <div class="bg-slate-900/60 p-2.5 rounded-xl border border-slate-850/60 text-center">
                                <span class="block text-[8px] text-slate-500 font-mono uppercase">Fuel Capacity</span>
                                <span id="telemetry-fuel" class="text-sm font-mono font-bold text-slate-355">100%</span>
                            </div>
                        </div>
                    </div>

                    <div class="flex flex-col gap-4">
                        <div class="glass-panel p-5 rounded-2xl bg-slate-950/80 border border-slate-855 font-mono text-xs flex flex-col justify-between flex-grow min-h-[280px]">
                            <div class="overflow-hidden flex flex-col">
                                <div class="flex justify-between items-center border-b border-slate-900 pb-2.5 mb-3.5">
                                    <span class="text-[9px] text-slate-500">spaceship_protocol.js</span>
                                    <div class="flex gap-1.5">
                                        <span class="w-2 h-2 rounded-full bg-slate-850"></span>
                                        <span class="w-2 h-2 rounded-full bg-slate-850"></span>
                                        <span class="w-2 h-2 rounded-full bg-slate-850"></span>
                                    </div>
                                </div>
                                
                                <p class="text-slate-550 text-[9px] mb-3.5 leading-relaxed">
                                    // MISSION: Declare variables with correct types to compile successfully.
                                </p>
                                
                                <div class="space-y-3.5 leading-relaxed text-slate-300 text-xs overflow-x-auto no-scrollbar py-1 select-text">
                                    <div class="flex items-center gap-2 whitespace-nowrap">
                                        <select id="sel-name" class="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg px-2 py-0.5 text-cyan-400 font-bold focus:border-cyan-500 outline-none text-xs">
                                            <option value="">-- select --</option>
                                            <option value="var">var</option>
                                            <option value="let">let</option>
                                            <option value="const">const</option>
                                        </select>
                                        <span class="text-indigo-400 font-bold">shipName</span>
                                        <span class="text-slate-400">=</span>
                                        <span class="text-emerald-450">"Apollo-XI"</span>;
                                    </div>
                                    <div class="flex items-center gap-2 whitespace-nowrap">
                                        <select id="sel-fuel" class="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg px-2 py-0.5 text-cyan-400 font-bold focus:border-cyan-500 outline-none text-xs">
                                            <option value="">-- select --</option>
                                            <option value="var">var</option>
                                            <option value="let">let</option>
                                            <option value="const">const</option>
                                        </select>
                                        <span class="text-indigo-400 font-bold">fuelLevel</span>
                                        <span class="text-slate-400">=</span>
                                        <span class="text-amber-400">100</span>;
                                    </div>
                                    <div class="pl-4 mt-2 border-l-2 border-slate-800 py-1.5 space-y-2.5 bg-slate-900/10 rounded-r-xl">
                                        <div class="whitespace-nowrap"><span class="text-purple-400">function</span> <span class="text-blue-400">launch</span>() {</div>
                                        <div class="pl-4 whitespace-nowrap">
                                            <span class="text-purple-400">if</span> (fuelLevel &gt; <span class="text-amber-400">50</span>) {
                                        </div>
                                        <div class="pl-8 flex items-center gap-2 whitespace-nowrap">
                                            <select id="sel-speed" class="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg px-2 py-0.5 text-cyan-400 font-bold focus:border-cyan-500 outline-none text-xs">
                                                <option value="">-- select --</option>
                                                <option value="var">var</option>
                                                <option value="let">let</option>
                                                <option value="const">const</option>
                                            </select>
                                            <span class="text-indigo-400 font-bold">speed</span>
                                            <span class="text-slate-400">=</span>
                                            <span class="text-amber-400">25000</span>;
                                        </div>
                                        <div class="pl-8 text-slate-550 whitespace-nowrap">
                                            fuelLevel = fuelLevel - <span class="text-amber-400">20</span>; <span class="text-[9px] text-slate-600">// Reassigning</span>
                                        </div>
                                        <div class="pl-4 whitespace-nowrap">}</div>
                                        <div class="pl-4 whitespace-nowrap">
                                            <span class="text-purple-400">return</span> <span class="text-indigo-400 font-bold">speed</span>; <span class="text-[9px] text-slate-600">// Access speed</span>
                                        </div>
                                        <div>}</div>
                                    </div>
                                </div>
                            </div>
                            <div class="mt-4 bg-black/60 border border-slate-855 p-2.5 rounded-xl text-[10px] sm:text-xs text-slate-500 min-h-[50px] flex items-center gap-2.5">
                                <i data-lucide="terminal" class="w-4 h-4 text-cyan-500 shrink-0"></i>
                                <span id="terminal-console" class="font-mono">Console: Ready for launch execution...</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="w-full flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border-t border-slate-800/60 pt-4 shrink-0">
                    <div class="text-slate-400 text-xs">
                        <span class="font-bold text-white flex items-center gap-1.5"><i data-lucide="target" class="w-3.5 h-3.5 text-cyan-400"></i> Objective:</span>
                        เลือกประกาศตัวแปรให้ตรงตามลักษณะการใช้ค่าและขอบเขต Block Scope ของภาษา JavaScript
                    </div>
                    <button id="btn-execute" class="btn-press flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono font-bold px-6 py-2.5 rounded-xl border border-cyan-400/30 shadow-lg shadow-cyan-500/20 text-xs transition-all shrink-0">
                        <i data-lucide="play" class="w-4 h-4"></i>
                        <span>EXECUTE PROTOCOL</span>
                    </button>
                </div>
            </div>

            <div class="glass-panel p-5 rounded-2xl bg-slate-950/40 border border-slate-855 flex flex-col gap-3.5 mt-2 shrink-0">
                <h4 class="text-xs font-bold text-white flex items-center gap-1.5 shrink-0">
                    <i data-lucide="book-open" class="w-4 h-4 text-cyan-400"></i>
                    <span>คำอธิบายบทเรียน: Variable Scope & Declaration</span>
                </h4>
                <div class="text-[11px] text-slate-350 leading-relaxed overflow-y-visible pr-1.5 flex flex-col gap-4 select-text">
                    <p>
                        ใน JavaScript การประกาศตัวแปรมี 3 คีย์เวิร์ดหลัก ซึ่งมีพฤติกรรมเกี่ยวกับขอบเขต (Scope) และความสามารถในการเขียนทับค่า (Reassignment) แตกต่างกันดังนี้:
                    </p>
                    
                    <div class="overflow-x-auto w-full border border-slate-900 bg-slate-950/20 rounded-xl p-3">
                        <table class="w-full text-left border-collapse text-[10px] sm:text-[11px]">
                            <thead>
                                <tr class="border-b border-slate-800 text-slate-400">
                                    <th class="pb-2 font-bold">คุณสมบัติ (Features)</th>
                                    <th class="pb-2 font-bold text-cyan-400 font-mono">const</th>
                                    <th class="pb-2 font-bold text-blue-400 font-mono">let</th>
                                    <th class="pb-2 font-bold text-purple-400 font-mono">var</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-900/60 text-slate-400">
                                <tr>
                                    <td class="py-2 font-bold text-slate-300">ขอบเขต (Scope)</td>
                                    <td class="py-2">Block Scope <code>{}</code></td>
                                    <td class="py-2">Block Scope <code>{}</code></td>
                                    <td class="py-2">Function Scope</td>
                                </tr>
                                <tr>
                                    <td class="py-2 font-bold text-slate-300">เขียนทับค่า (Reassign)</td>
                                    <td class="py-2 text-rose-400 font-semibold">ไม่ได้ ❌</td>
                                    <td class="py-2 text-emerald-400 font-semibold">ได้ ✅</td>
                                    <td class="py-2 text-emerald-400 font-semibold">ได้ ✅</td>
                                </tr>
                                <tr>
                                    <td class="py-2 font-bold text-slate-300">ประกาศซ้ำใน scope เดิม</td>
                                    <td class="py-2 text-rose-400 font-semibold">ไม่ได้ ❌</td>
                                    <td class="py-2 text-rose-400 font-semibold">ไม่ได้ ❌</td>
                                    <td class="py-2 text-emerald-400 font-semibold">ได้ ✅</td>
                                </tr>
                                <tr>
                                    <td class="py-2 font-bold text-slate-300">Hoisting & Initial Value</td>
                                    <td class="py-2">ไม่มีค่าเริ่มต้น (ติด TDZ)</td>
                                    <td class="py-2">ไม่มีค่าเริ่มต้น (ติด TDZ)</td>
                                    <td class="py-2 text-purple-400 font-mono">undefined</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div class="border-t border-slate-800/60 pt-3 flex flex-col gap-2">
                        <strong class="text-white">ทำไมยาน Apollo-XI ถึงผ่านด้วยการตั้งค่าตามเฉลยนี้?</strong>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 font-sans text-slate-400">
                            <div>
                                <span class="text-cyan-400 font-bold font-mono">1. shipName = "Apollo-XI"</span><br>
                                ชื่อยานมีค่าคงที่และไม่มีการเปลี่ยนค่าใดๆ ตลอดภารกิจ จึงเลือกใช้ <strong>const</strong> เพื่อความปลอดภัยและเป็นไปตามหลัก Clean Code
                            </div>
                            <div>
                                <span class="text-blue-400 font-bold font-mono">2. fuelLevel = 100</span><br>
                                ระดับน้ำมันมีการลดทอนระหว่างทางผ่าน <code>fuelLevel = fuelLevel - 20</code> (มีการ Reassign) จึงต้องใช้ <strong>let</strong>
                            </div>
                            <div>
                                <span class="text-purple-400 font-bold font-mono">3. speed = 25000</span><br>
                                ตัวแปรประกาศในบล็อก <code>if</code> แต่ถูกเข้าถึงและส่งค่ากลับที่บรรทัด <code>return speed</code> นอกบล็อก จึงต้องใช้ <strong>var</strong> เพื่อให้ข้ามขอบเขตบล็อกออกมาภายนอกได้
                            </div>
                        </div>
                    </div>

                    <div class="border-t border-slate-800/60 pt-3 flex flex-col gap-2">
                        <strong class="text-white flex items-center gap-1.5"><i data-lucide="info" class="w-3.5 h-3.5 text-amber-400"></i> ข้อสังเกตเพิ่มเติม (Temporal Dead Zone):</strong>
                        <p class="text-slate-400 font-sans">
                            ตัวแปรที่ประกาศด้วย <code>let</code> และ <code>const</code> จะไม่ถูกจับจองค่าเริ่มต้นใดๆ ตอนเริ่มต้นรันโค้ด (Hoisting) ต่างจาก <code>var</code> ที่จะถูกสร้างเป็น <code>undefined</code> โดยอัตโนมัติ การพยายามเรียกใช้งานตัวแปร <code>let</code>/<code>const</code> ก่อนบรรทัดที่มีการประกาศจริง จะทำให้เกิด <strong>Temporal Dead Zone (TDZ)</strong> หรือเขตปลอดการเข้าถึงชั่วคราวและเกิดข้อผิดพลาด <code>ReferenceError</code> ทันทีเพื่อลดบั๊กจากการเรียกใช้ตัวแปรผิดพฤติกรรม
                        </p>
                    </div>
                </div>
            </div>
        `;

        const btnExec = document.getElementById('btn-execute');
        if (btnExec) {
            btnExec.onclick = () => this.executeProtocol(controller);
        }
    },

    executeProtocol(controller) {
        const shipNameType = document.getElementById('sel-name').value;
        const fuelLevelType = document.getElementById('sel-fuel').value;
        const speedType = document.getElementById('sel-speed').value;
        const consoleEl = document.getElementById('terminal-console');
        const shipContainer = document.getElementById('spaceship-container');
        const thrust = document.getElementById('thrust-effect');

        if (!consoleEl || !shipContainer || !thrust) return;

        consoleEl.className = "font-mono";
        shipContainer.className = "relative animate-hover-ship";
        thrust.classList.add('hidden');

        if (!shipNameType || !fuelLevelType || !speedType) {
            consoleEl.innerText = "Console: Error: Compilation Failed. Missing declaration type selections!";
            consoleEl.classList.add('text-red-400');
            return;
        }
        
        if (fuelLevelType === 'const') {
            consoleEl.innerText = "Console: TypeError: Assignment to constant variable 'fuelLevel' at launch (line 15). Spacecraft engine failed!";
            consoleEl.classList.add('text-red-400');
            shipContainer.classList.add('animate-shake');
            return;
        }

        if (speedType === 'let' || speedType === 'const') {
            consoleEl.innerText = "Console: ReferenceError: 'speed' is not defined at launch (line 18) due to Block Scope boundary!";
            consoleEl.classList.add('text-red-400');
            shipContainer.classList.add('animate-shake');
            return;
        }

        if (shipNameType !== 'const') {
            consoleEl.innerText = "Console: Code warning: 'shipName' should be declared with 'const' since its value is never reassigned. Launch aborted due to unsafe standards!";
            consoleEl.classList.add('text-amber-400');
            return;
        }

        consoleEl.innerText = "Console: Compilation successful! Speed reached: 25000 km/h. Fuel consumption normal. Spaceship launched!";
        consoleEl.classList.add('text-green-400');
        
        const speedMeter = document.getElementById('telemetry-speed');
        const fuelMeter = document.getElementById('telemetry-fuel');
        const statusBadge = document.getElementById('launch-status-badge');

        if (speedMeter) speedMeter.innerText = "25,000 km/h";
        if (fuelMeter) fuelMeter.innerText = "80%";
        if (statusBadge) {
            statusBadge.innerText = "SUCCESS";
            statusBadge.className = "inline-block text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-green-500/10 border border-green-500/30 text-green-400";
        }
        
        thrust.classList.remove('hidden');
        shipContainer.className = "relative animate-launch";

        controller.markStageCompleted('programming', 0);

        setTimeout(() => {
            const modal = document.getElementById('success-modal');
            if (modal) modal.classList.remove('hidden');
        }, 2500);
    }
};
