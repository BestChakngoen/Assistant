import { ShareUI } from '../ui/share/ShareUI.js';

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
        ['risk-balance', 'risk-percent', 'risk-leverage', 'risk-asset', 'risk-entry', 'risk-sl', 'risk-tp', 'risk-rr-ratio', 'risk-spread', 'risk-lot-input'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.oninput = calculate;
                el.onchange = calculate;
            }
        });

        // Setup auto commas for text inputs (Balance, Entry, SL, TP, Lot)
        ['risk-balance', 'risk-entry', 'risk-sl', 'risk-tp', 'risk-lot-input'].forEach(id => {
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
                        if (id === 'risk-lot-input') {
                            el.value = val.toFixed(3);
                        } else {
                            const assetSelect = document.getElementById('risk-asset');
                            const isEur = (id === 'risk-entry' || id === 'risk-sl' || id === 'risk-tp') && assetSelect && assetSelect.value === 'EUR';
                            const decimals = isEur ? 4 : 2;
                            el.value = val.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
                        }
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

        // Calculate Button (Header)
        const btnCalc = document.getElementById('btn-calc-risk');
        if (btnCalc) {
            btnCalc.onclick = async () => {
                ShareUI.playSound('mouse-click');
                const entryVal = parseFloat(document.getElementById('risk-entry')?.value?.replace(/,/g, '')) || 0;
                if (!entryVal || entryVal <= 0) {
                    await ShareUI.showAlertModal({
                        title: 'Missing Entry Price',
                        message: 'Please enter a valid Entry Price before calculating targets and position sizing.',
                        icon: 'alert-circle',
                        iconColor: 'text-pink-400',
                        confirmClass: 'bg-pink-600 hover:bg-pink-500 text-white'
                    });
                    const entryEl = document.getElementById('risk-entry');
                    if (entryEl) entryEl.focus();
                    return;
                }
                this.calculateRisk(true);
            };
        }
    }

    calculateRisk(forceRecalculateTargets = false) {
        const dom = {
            bal: document.getElementById('risk-balance'),
            pct: document.getElementById('risk-percent'),
            lev: document.getElementById('risk-leverage'),
            asset: document.getElementById('risk-asset'),
            entryInput: document.getElementById('risk-entry'),
            entry: parseFloat(document.getElementById('risk-entry').value.replace(/,/g, '')) || 0,
            lotInput: document.getElementById('risk-lot-input'),
            slInput: document.getElementById('risk-sl'),
            tpInput: document.getElementById('risk-tp'),
            rrRatio: parseFloat(document.getElementById('risk-rr-ratio').value) || 2,
            side: document.querySelector('input[name="risk-side"]:checked') ? document.querySelector('input[name="risk-side"]:checked').value : 'LONG',
            oLot: document.getElementById('res-lot'),
            oMargin: document.getElementById('res-margin'),
            oRisk: document.getElementById('res-risk-amt'),
            oReward: document.getElementById('res-reward-amt'),
            oRR: document.getElementById('res-rr'),
            oEval: document.getElementById('res-rr-eval'),
            oActualRiskPct: document.getElementById('res-actual-risk-pct')
        };

        if (!dom.bal || !dom.pct || !dom.lev || !dom.asset) return;

        let balance = parseFloat(dom.bal.value.replace(/[^0-9.-]/g, ''));
        if (isNaN(balance) || balance === 0) {
            const summaryBalEl = document.getElementById('summary-balance');
            const currentBalText = summaryBalEl ? summaryBalEl.innerText : '0.00';
            balance = parseFloat(currentBalText.replace(/[^0-9.-]/g, '')) || 0;
            if (balance === 0) balance = 1000;
            dom.bal.placeholder = balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " (Auto)";
        } else {
            dom.bal.placeholder = "Auto";
        }

        const riskPct = parseFloat(dom.pct.value) || 2;
        const riskAmt = balance * (riskPct / 100);
        const contractSize = parseFloat(dom.asset.options[dom.asset.selectedIndex].dataset.size) || 1;
        const spreadInput = document.getElementById('risk-spread');
        const spreadPer01 = spreadInput ? (parseFloat(spreadInput.value) || 0) : 0;

        let rawSl = parseFloat(dom.slInput.value.replace(/,/g, ''));
        let rawTp = parseFloat(dom.tpInput.value.replace(/,/g, ''));

        // POSITION SIZING only recalculates ENTRY & TARGETS when forceRecalculateTargets is true (on clicking Calculate)
        if (forceRecalculateTargets) {
            if (!dom.entry || dom.entry <= 0) {
                ShareUI.showAlertModal({
                    title: 'Missing Entry Price',
                    message: 'Please enter a valid Entry Price before calculating targets and position sizing.',
                    icon: 'alert-circle',
                    iconColor: 'text-pink-400',
                    confirmClass: 'bg-pink-600 hover:bg-pink-500 text-white'
                });
                if (dom.entryInput) dom.entryInput.focus();
                return;
            }

            const assetSelect = document.getElementById('risk-asset');
            const assetName = assetSelect ? assetSelect.value : 'BTC';
            
            let defaultDistSL = 200;
            if (assetName === 'XAU') defaultDistSL = 5;
            else if (assetName === 'EUR') defaultDistSL = 0.0020;

            const isLong = (dom.side === 'LONG');
            const slIsInvalidDirection = isLong ? (rawSl >= dom.entry) : (rawSl <= dom.entry && rawSl > 0);

            // Use custom SL distance if currently valid, otherwise use default distance for asset
            const slDistance = (!isNaN(rawSl) && rawSl > 0 && !slIsInvalidDirection)
                ? Math.abs(dom.entry - rawSl)
                : defaultDistSL;

            if (isLong) {
                rawSl = dom.entry - slDistance;
                rawTp = dom.entry + (slDistance * dom.rrRatio);
            } else {
                rawSl = dom.entry + slDistance;
                rawTp = dom.entry - (slDistance * dom.rrRatio);
            }

            const decimals = assetName === 'EUR' ? 4 : 2;
            dom.slInput.value = rawSl.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
            dom.tpInput.value = rawTp.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

            // Calculate and assign LOT SIZE to ENTRY & TARGETS on calculate click
            const recLots = (dom.entry > 0 && slDistance > 0)
                ? (riskAmt / ((slDistance * contractSize) + (spreadPer01 * 100)))
                : 0;
            if (dom.lotInput) {
                dom.lotInput.value = recLots > 0 ? recLots.toFixed(3) : "0.000";
                dom.lotInput.classList.remove('ring-2', 'ring-pink-500');
                void dom.lotInput.offsetWidth;
                dom.lotInput.classList.add('ring-2', 'ring-pink-500');
                setTimeout(() => dom.lotInput?.classList.remove('ring-2', 'ring-pink-500'), 400);
            }
        }

        const sl = rawSl || 0;
        const tp = rawTp || 0;

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

        let calculatedRecLots = 0;
        if (dom.entry > 0 && rawDistSL > 0 && isValidSetup) {
            calculatedRecLots = riskAmt / ((rawDistSL * contractSize) + (spreadPer01 * 100));
        }

        let lots = 0;
        const rawManualLot = dom.lotInput ? dom.lotInput.value.trim() : "";
        if (rawManualLot !== "") {
            const parsedLot = parseFloat(rawManualLot.replace(/[^0-9.-]/g, ''));
            lots = (!isNaN(parsedLot) && parsedLot >= 0) ? parsedLot : 0;
        } else {
            lots = calculatedRecLots;
            if (dom.lotInput) {
                dom.lotInput.placeholder = calculatedRecLots > 0 ? calculatedRecLots.toFixed(3) : "0.000";
            }
        }

        let rewardAmt = 0;
        let margin = 0;
        let rr = 0;
        let actualRiskAmt = 0;

        if (dom.entry > 0 && isValidSetup && lots > 0) {
            const leverage = parseFloat(dom.lev.value) || 100;
            margin = (lots * contractSize * dom.entry) / leverage;

            const totalSpreadCost = (lots / 0.01) * spreadPer01;

            if (sl > 0 && rawDistSL > 0) {
                actualRiskAmt = (lots * rawDistSL * contractSize) + totalSpreadCost;
            }

            if (tp > 0 && rawDistTP > 0) {
                rewardAmt = Math.max(0, (lots * rawDistTP * contractSize) - totalSpreadCost);
            }

            rr = actualRiskAmt > 0 ? (rewardAmt / actualRiskAmt) : 0;
        }

        const distSL = rawDistSL;
        const distTP = rawDistTP;

        if (!isValidSetup && dom.entry > 0 && sl > 0) {
            if (dom.oLot) {
                dom.oLot.innerText = "ERROR";
                dom.oLot.classList.add('text-red-500');
                dom.oLot.classList.remove('text-pink-400');
            }

            if (dom.oEval) {
                dom.oEval.innerText = setupError;
                dom.oEval.className = "text-[10px] text-red-500 mt-1 font-bold animate-pulse";
            }

            if (dom.oRisk) dom.oRisk.innerText = "$0.00";
            if (dom.oActualRiskPct) dom.oActualRiskPct.innerText = "0.00%";
            if (dom.oReward) dom.oReward.innerText = "$0.00";
            if (dom.oMargin) dom.oMargin.innerText = "$0.00";
            if (dom.oRR) dom.oRR.innerText = "- : -";
        } else {
            if (dom.oLot) {
                dom.oLot.classList.remove('text-red-500');
                dom.oLot.classList.add('text-pink-400');
                dom.oLot.innerText = lots > 0 ? lots.toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 }) : "0.000";
            }

            const actualRiskPct = (balance > 0 && actualRiskAmt > 0) ? ((actualRiskAmt / balance) * 100) : 0;

            if (dom.oRisk) dom.oRisk.innerText = "$" + actualRiskAmt.toLocaleString('en-US', { minimumFractionDigits: 2 });
            if (dom.oActualRiskPct) dom.oActualRiskPct.innerText = actualRiskPct.toFixed(2) + "%";
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
                distSlEl.innerText = (sl > 0 && distSL > 0) ? distSL.toFixed(decimals) + " pts" : "-";
            }
            if (distTpEl) {
                distTpEl.innerText = (tp > 0 && distTP > 0) ? distTP.toFixed(decimals) + " pts" : "-";
            }
        }
    }
}
