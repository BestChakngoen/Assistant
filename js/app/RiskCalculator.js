/**
 * RiskCalculator - Handles Risk Management, Position Sizing, and Auto SL/TP Math.
 */
export class RiskCalculator {
    constructor(app) {
        this.app = app;
    }

    initListeners() {
        const calculate = () => this.calculateRisk();

        // Risk Calculator Listeners
        ['risk-balance', 'risk-percent', 'risk-leverage', 'risk-asset', 'risk-entry', 'risk-sl', 'risk-tp', 'risk-rr-ratio', 'risk-spread'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.oninput = calculate;
                el.onchange = calculate;
            }
        });

        // Setup auto commas for text inputs (Balance, Entry, SL, TP)
        ['risk-balance', 'risk-entry', 'risk-sl', 'risk-tp'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('focus', () => {
                    const cleanVal = el.value.replace(/,/g, '');
                    if (!isNaN(parseFloat(cleanVal)) && cleanVal !== '') {
                        el.value = cleanVal;
                    }
                });
                el.addEventListener('blur', () => {
                    const cleanVal = el.value.replace(/,/g, '');
                    const val = parseFloat(cleanVal);
                    if (!isNaN(val) && cleanVal !== '') {
                        el.value = val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                    }
                });
            }
        });

        // Auto leverage change when changing asset
        const assetSelect = document.getElementById('risk-asset');
        if (assetSelect) {
            assetSelect.addEventListener('change', () => {
                const levInput = document.getElementById('risk-leverage');
                if (levInput) {
                    if (assetSelect.value === 'BTC') {
                        levInput.value = '400';
                    } else {
                        levInput.value = '100';
                    }
                }
                this.calculateRisk();
            });
        }

        // Listener for Radio Buttons (Buy/Sell)
        document.querySelectorAll('input[name="risk-side"]').forEach(radio => {
            radio.onchange = calculate;
        });
    }

    calculateRisk() {
        const dom = {
            bal: document.getElementById('risk-balance'),
            pct: document.getElementById('risk-percent'),
            lev: document.getElementById('risk-leverage'),
            asset: document.getElementById('risk-asset'),
            entry: parseFloat(document.getElementById('risk-entry').value.replace(/,/g, '')) || 0,
            slInput: document.getElementById('risk-sl'),
            tpInput: document.getElementById('risk-tp'),
            rrRatio: parseFloat(document.getElementById('risk-rr-ratio').value) || 2,
            side: document.querySelector('input[name="risk-side"]:checked') ? document.querySelector('input[name="risk-side"]:checked').value : 'LONG',
            oLot: document.getElementById('res-lot'),
            oMargin: document.getElementById('res-margin'),
            oRisk: document.getElementById('res-risk-amt'),
            oReward: document.getElementById('res-reward-amt'),
            oRR: document.getElementById('res-rr'),
            oEval: document.getElementById('res-rr-eval')
        };

        if (!dom.bal || !dom.pct || !dom.lev || !dom.asset) return;

        let rawSl = parseFloat(dom.slInput.value.replace(/,/g, ''));
        let rawTp = parseFloat(dom.tpInput.value.replace(/,/g, ''));

        if (dom.entry > 0) {
            const assetSelect = document.getElementById('risk-asset');
            const assetName = assetSelect ? assetSelect.value : 'BTC';
            
            let defaultDistSL = 200;
            if (assetName === 'XAU') defaultDistSL = 5;
            else if (assetName === 'EUR') defaultDistSL = 0.0020;

            const isLong = (dom.side === 'LONG');

            const entryInputActive = (document.activeElement && document.activeElement.id === 'risk-entry');
            const rrInputActive = (document.activeElement && document.activeElement.id === 'risk-rr-ratio');

            const slIsInvalidDirection = isLong ? (rawSl >= dom.entry) : (rawSl <= dom.entry && rawSl > 0);
            if (isNaN(rawSl) || rawSl === 0 || slIsInvalidDirection || entryInputActive) {
                if (isLong) {
                    rawSl = dom.entry - defaultDistSL;
                } else {
                    rawSl = dom.entry + defaultDistSL;
                }
                dom.slInput.value = rawSl.toLocaleString('en-US', { minimumFractionDigits: assetName === 'EUR' ? 4 : 2, maximumFractionDigits: assetName === 'EUR' ? 4 : 2 });
            }

            const slDistance = Math.abs(dom.entry - rawSl);
            const tpDistance = slDistance * dom.rrRatio;
            const tpIsInvalidDirection = isLong ? (rawTp <= dom.entry) : (rawTp >= dom.entry && rawTp > 0);

            if (isNaN(rawTp) || rawTp === 0 || tpIsInvalidDirection || entryInputActive || rrInputActive) {
                if (isLong) {
                    rawTp = dom.entry + tpDistance;
                } else {
                    rawTp = dom.entry - tpDistance;
                }
                dom.tpInput.value = rawTp.toLocaleString('en-US', { minimumFractionDigits: assetName === 'EUR' ? 4 : 2, maximumFractionDigits: assetName === 'EUR' ? 4 : 2 });
            }
        }

        const sl = rawSl || 0;
        const tp = rawTp || 0;

        let balance = parseFloat(dom.bal.value.replace(/,/g, ''));
        if (isNaN(balance) || balance === 0) {
            const summaryBalEl = document.getElementById('summary-balance');
            const currentBalText = summaryBalEl ? summaryBalEl.innerText : '0.00';
            balance = parseFloat(currentBalText.replace(/,/g, '')) || 0;
            if (balance === 0) balance = 1000;
            dom.bal.placeholder = balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " (Auto)";
        } else {
            dom.bal.placeholder = "Auto";
        }

        const riskPct = parseFloat(dom.pct.value) || 2;
        const riskAmt = balance * (riskPct / 100);

        const contractSize = parseFloat(dom.asset.options[dom.asset.selectedIndex].dataset.size) || 1;

        let isValidSetup = true;
        let setupError = "";

        if (dom.entry > 0 && sl > 0) {
            if (dom.side === 'LONG') {
                if (sl >= dom.entry) {
                    isValidSetup = false;
                    setupError = "Invalid Long: SL ≥ Entry";
                }
            } else {
                if (sl <= dom.entry) {
                    isValidSetup = false;
                    setupError = "Invalid Short: SL ≤ Entry";
                }
            }
        }

        const rawDistSL = Math.abs(dom.entry - sl);
        const rawDistTP = Math.abs(tp - dom.entry);

        const spreadInput = document.getElementById('risk-spread');
        const spreadPer01 = spreadInput ? (parseFloat(spreadInput.value) || 0) : 0;

        let lots = 0;
        let rewardAmt = 0;
        let margin = 0;
        let rr = 0;
        let actualRiskAmt = 0;

        if (dom.entry > 0 && rawDistSL > 0 && isValidSetup) {
            lots = riskAmt / ((rawDistSL * contractSize) + (spreadPer01 * 100));

            const totalSpreadCost = (lots / 0.01) * spreadPer01;

            actualRiskAmt = (lots * rawDistSL * contractSize) + totalSpreadCost;
            rewardAmt = Math.max(0, (lots * rawDistTP * contractSize) - totalSpreadCost);

            const leverage = parseFloat(dom.lev.value) || 100;
            margin = (lots * contractSize * dom.entry) / leverage;

            rr = actualRiskAmt > 0 ? (rewardAmt / actualRiskAmt) : 0;
        }

        const distSL = rawDistSL;
        const distTP = rawDistTP;

        if (!isValidSetup && dom.entry > 0 && sl > 0) {
            if (dom.oLot) {
                dom.oLot.innerText = "ERROR";
                dom.oLot.classList.add('text-red-500');
                dom.oLot.classList.remove('text-white');
            }

            if (dom.oEval) {
                dom.oEval.innerText = setupError;
                dom.oEval.className = "text-[10px] text-red-500 mt-1 font-bold animate-pulse";
            }

            if (dom.oRisk) dom.oRisk.innerText = "$0.00";
            if (dom.oReward) dom.oReward.innerText = "$0.00";
            if (dom.oMargin) dom.oMargin.innerText = "$0.00";
            if (dom.oRR) dom.oRR.innerText = "- : -";
        } else {
            if (dom.oLot) {
                dom.oLot.classList.remove('text-red-500');
                dom.oLot.classList.add('text-white');
                dom.oLot.innerText = lots > 0 ? lots.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00";
            }

            if (dom.oRisk) dom.oRisk.innerText = "$" + actualRiskAmt.toLocaleString('en-US', { minimumFractionDigits: 2 });
            if (dom.oReward) dom.oReward.innerText = "$" + rewardAmt.toLocaleString('en-US', { minimumFractionDigits: 2 });
            if (dom.oMargin) dom.oMargin.innerText = "$" + margin.toLocaleString('en-US', { minimumFractionDigits: 2 });

            if (dom.entry > 0 && sl > 0 && tp > 0) {
                if (dom.oRR) {
                    dom.oRR.innerText = `1 : ${rr.toFixed(2)}`;
                    if (rr < 1) {
                        dom.oRR.className = "text-sm font-mono font-bold text-red-400";
                    } else if (rr < 2) {
                        dom.oRR.className = "text-sm font-mono font-bold text-yellow-400";
                    } else {
                        dom.oRR.className = "text-sm font-mono font-bold text-green-400";
                    }
                }

                if (dom.oEval) {
                    if (rr < 1) {
                        dom.oEval.innerText = "Poor Risk/Reward";
                        dom.oEval.className = "text-[10px] text-red-500 mt-1";
                    } else if (rr < 2) {
                        dom.oEval.innerText = "Moderate";
                        dom.oEval.className = "text-[10px] text-yellow-500 mt-1";
                    } else {
                        dom.oEval.innerText = "Excellent Setup!";
                        dom.oEval.className = "text-[10px] text-green-500 mt-1";
                    }
                }
            } else {
                if (dom.oRR) {
                    dom.oRR.innerText = "0 : 0";
                    dom.oRR.className = "text-sm font-mono font-bold text-slate-500";
                }
                if (dom.oEval) {
                    dom.oEval.innerText = "Waiting for inputs...";
                    dom.oEval.className = "text-[10px] text-slate-600 mt-1";
                }
            }

            const distSlEl = document.getElementById('dist-sl-val');
            const distTpEl = document.getElementById('dist-tp-val');
            const assetSelect = document.getElementById('risk-asset');
            const assetName = assetSelect ? assetSelect.value : 'BTC';
            const decimals = assetName === 'EUR' ? 4 : 2;

            if (distSlEl) {
                distSlEl.innerText = distSL > 0 ? distSL.toFixed(decimals) + " pts" : "-";
            }
            if (distTpEl) {
                distTpEl.innerText = distTP > 0 ? distTP.toFixed(decimals) + " pts" : "-";
            }
        }
    }
}
