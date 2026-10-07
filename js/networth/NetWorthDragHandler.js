import { NetWorthPortfolioService } from './NetWorthPortfolioService.js';

/**
 * NetWorthDragHandler.js - Custom Pointer Drag & Drop Reordering Subsystem
 * Handles:
 * 1. Immediate drag via 6-dot grip handle or Long-press (~250ms) anywhere on the card.
 * 2. 1:1 pointer tracking & card elevation styling.
 * 3. Smooth auto-scrolling (Slide bar animation) when dragged near container top/bottom edges.
 * 4. Dynamic slot offset calculation & card shift animations.
 * 5. Seamless Cross-Group Slot Reorder: drag items into any portfolio, cards shift open to show slot, auto-expand collapsed folders, and instant drop.
 * 6. Scroll position preservation & list data reordering with haptic and audio feedback.
 */
export class NetWorthDragHandler {
    /**
     * Attaches pointer and touch drag listeners to an asset/liability card.
     * @param {Object} manager - NetWorthManager instance
     * @param {HTMLElement} card - The card DOM element
     * @param {Object} item - Asset/liability item object
     * @param {number} index - Index of the item within the filtered group list
     * @param {Array} filtered - Current filtered array of items in this group
     */
    static attachDragListeners(manager, card, item, index, filtered) {
        let longPressTimer = null;
        let isDraggingActive = false;
        let wasDragged = false;
        let startClientY = 0;
        let startClientX = 0;
        let currentClientY = 0;
        let currentClientX = 0;
        let startScrollTop = 0;
        let currentTargetIdx = index;
        let autoScrollRaf = null;
        let scrollVelocity = 0;
        let containerRect = null;
        let container = null;
        let itemHeight = 60;
        let activeTargetGroup = null;
        let activeTargetPortfolio = null;
        let activeTargetSlot = null;
        let autoExpandTimer = null;
        let lastHoveredCollapsedGroup = null;
        let sourcePortfolio = (item && item.portfolio) || card.dataset.portfolio || NetWorthPortfolioService.DEFAULT_PORTFOLIO;
        let sourceGroup = null;

        const isInteractiveTarget = (target) => {
            return !!target.closest('button, input, select, textarea, a, .edit-nw-btn, .delete-nw-btn, .nw-save-btn, .nw-cancel-btn');
        };

        const updateDragPosition = () => {
            if (!isDraggingActive || manager.draggedIndex === null || !container) return;

            const scrollDelta = container.scrollTop - startScrollTop;
            const pointerDeltaY = currentClientY - startClientY;
            const totalDeltaY = pointerDeltaY + scrollDelta;

            // 1. Move the card to follow the pointer smoothly
            card.style.transform = `translateY(${totalDeltaY}px) scale(0.96)`;

            // 2. Identify element and portfolio under pointer
            const elUnder = document.elementFromPoint(currentClientX, currentClientY);
            const groupUnder = elUnder ? elUnder.closest('.nw-portfolio-group') : null;
            const hoveredPortfolio = groupUnder ? groupUnder.dataset.portfolio : null;

            if (groupUnder && hoveredPortfolio && hoveredPortfolio !== sourcePortfolio) {
                // === CROSS-PORTFOLIO DRAG MODE ===
                if (activeTargetGroup !== groupUnder) {
                    if (activeTargetGroup) {
                        activeTargetGroup.classList.remove('nw-portfolio-group-drop-target');
                        activeTargetGroup.querySelectorAll('.nw-item-card').forEach(c => {
                            c.style.transform = '';
                        });
                    }
                    activeTargetGroup = groupUnder;
                    activeTargetPortfolio = hoveredPortfolio;
                    activeTargetGroup.classList.add('nw-portfolio-group-drop-target');
                    if (navigator.vibrate) {
                        try { navigator.vibrate(15); } catch (_) {}
                    }
                }

                const targetItemsContainer = groupUnder.querySelector('.nw-portfolio-items');
                const isTargetCollapsed = targetItemsContainer ? targetItemsContainer.classList.contains('hidden') : false;

                if (isTargetCollapsed) {
                    // Target is collapsed: auto-expand after hovering 350ms
                    if (lastHoveredCollapsedGroup !== groupUnder) {
                        if (autoExpandTimer) clearTimeout(autoExpandTimer);
                        lastHoveredCollapsedGroup = groupUnder;
                        autoExpandTimer = setTimeout(() => {
                            if (isDraggingActive && activeTargetGroup === groupUnder) {
                                NetWorthPortfolioService.setCollapsed(hoveredPortfolio, false);
                                if (targetItemsContainer) {
                                    targetItemsContainer.classList.remove('hidden');
                                    const toggleBtn = groupUnder.querySelector('.nw-btn-toggle-portfolio');
                                    if (toggleBtn) {
                                        toggleBtn.innerHTML = '<i data-lucide="chevron-down" class="w-4 h-4"></i>';
                                    }
                                    const folderBox = groupUnder.querySelector('.nw-portfolio-header .bg-cyan-500\\/15');
                                    if (folderBox) {
                                        folderBox.innerHTML = '<i data-lucide="folder-open" class="w-3.5 h-3.5"></i>';
                                    }
                                    if (window.lucide) window.lucide.createIcons();
                                }
                            }
                        }, 350);
                    }
                    activeTargetSlot = null;
                } else {
                    // Target is expanded: detect insertion slot among target cards
                    if (autoExpandTimer) {
                        clearTimeout(autoExpandTimer);
                        autoExpandTimer = null;
                    }
                    lastHoveredCollapsedGroup = null;

                    const targetCards = Array.from(groupUnder.querySelectorAll('.nw-portfolio-items .nw-item-card'));
                    if (targetCards.length === 0) {
                        activeTargetSlot = null;
                    } else {
                        let insertIdx = targetCards.length;
                        for (let k = 0; k < targetCards.length; k++) {
                            const rect = targetCards[k].getBoundingClientRect();
                            const midY = rect.top + rect.height / 2;
                            if (currentClientY < midY) {
                                insertIdx = k;
                                break;
                            }
                        }

                        if (insertIdx < targetCards.length) {
                            const beforeCard = targetCards[insertIdx];
                            const afterCard = insertIdx > 0 ? targetCards[insertIdx - 1] : null;
                            activeTargetSlot = {
                                beforeItemId: beforeCard ? beforeCard.dataset.id : null,
                                afterItemId: afterCard ? afterCard.dataset.id : null
                            };
                        } else {
                            const lastCard = targetCards[targetCards.length - 1];
                            activeTargetSlot = {
                                beforeItemId: null,
                                afterItemId: lastCard ? lastCard.dataset.id : null
                            };
                        }

                        // Dynamic slot opening animation in target group
                        targetCards.forEach((c, idx) => {
                            if (idx >= insertIdx) {
                                c.style.transform = `translateY(${itemHeight}px)`;
                            } else {
                                c.style.transform = 'translateY(0)';
                            }
                        });
                    }
                }

                // Close the vacant gap in source group
                if (sourceGroup) {
                    const sourceCards = Array.from(sourceGroup.querySelectorAll('.nw-portfolio-items .nw-item-card'));
                    sourceCards.forEach(c => {
                        if (c === card) return;
                        const cIdx = parseInt(c.dataset.index, 10);
                        if (cIdx > index) {
                            c.style.transform = `translateY(-${itemHeight}px)`;
                        } else {
                            c.style.transform = 'translateY(0)';
                        }
                    });
                }

                // Clear shifts on cards in any third-party groups
                NetWorthDragHandler.clearOtherGroupsCards(container, [groupUnder, sourceGroup]);

            } else {
                // === WITHIN-GROUP MODE (or hovering outside any group) ===
                if (activeTargetGroup) {
                    activeTargetGroup.classList.remove('nw-portfolio-group-drop-target');
                    activeTargetGroup.querySelectorAll('.nw-item-card').forEach(c => {
                        c.style.transform = '';
                    });
                    activeTargetGroup = null;
                    activeTargetPortfolio = null;
                    activeTargetSlot = null;
                }
                if (autoExpandTimer) {
                    clearTimeout(autoExpandTimer);
                    autoExpandTimer = null;
                }
                lastHoveredCollapsedGroup = null;

                // Clear shifts in other groups
                NetWorthDragHandler.clearOtherGroupsCards(container, [sourceGroup]);

                // Standard within-group slot reorder
                const slotOffset = Math.round(totalDeltaY / itemHeight);
                const newTargetIdx = Math.max(0, Math.min(filtered.length - 1, index + slotOffset));
                currentTargetIdx = newTargetIdx;
                NetWorthDragHandler.updateOtherCardsShift(card, index, currentTargetIdx, itemHeight);
            }
        };

        const startAutoScroll = () => {
            if (autoScrollRaf) return;

            const autoScrollLoop = () => {
                if (!isDraggingActive || scrollVelocity === 0 || !container) {
                    autoScrollRaf = null;
                    return;
                }

                const maxScroll = container.scrollHeight - container.clientHeight;
                if (maxScroll > 0) {
                    const prevScroll = container.scrollTop;
                    const nextScroll = Math.max(0, Math.min(maxScroll, prevScroll + scrollVelocity));

                    if (nextScroll !== prevScroll) {
                        container.scrollTop = nextScroll;
                        container.classList.add('is-scrolling');
                        updateDragPosition();
                    }
                }

                autoScrollRaf = requestAnimationFrame(autoScrollLoop);
            };

            autoScrollRaf = requestAnimationFrame(autoScrollLoop);
        };

        const stopAutoScroll = () => {
            if (autoScrollRaf) {
                cancelAnimationFrame(autoScrollRaf);
                autoScrollRaf = null;
            }
            scrollVelocity = 0;
        };

        const onPointerMove = (moveEvt) => {
            if (!isDraggingActive || manager.draggedIndex === null) return;
            if (moveEvt.cancelable) {
                moveEvt.preventDefault();
            }

            currentClientX = moveEvt.touches ? moveEvt.touches[0].clientX : moveEvt.clientX;
            currentClientY = moveEvt.touches ? moveEvt.touches[0].clientY : moveEvt.clientY;

            if (container) {
                containerRect = container.getBoundingClientRect();
                const edgeThreshold = 45;
                const maxSpeed = 8;
                const topEdge = containerRect.top + edgeThreshold;
                const bottomEdge = containerRect.bottom - edgeThreshold;

                if (currentClientY > bottomEdge) {
                    const overflow = Math.min(1.5, Math.max(0.1, (currentClientY - bottomEdge) / edgeThreshold));
                    scrollVelocity = overflow * maxSpeed;
                    startAutoScroll();
                } else if (currentClientY < topEdge) {
                    const overflow = Math.min(1.5, Math.max(0.1, (topEdge - currentClientY) / edgeThreshold));
                    scrollVelocity = -overflow * maxSpeed;
                    startAutoScroll();
                } else {
                    scrollVelocity = 0;
                    stopAutoScroll();
                }
            }

            updateDragPosition();
        };

        const onPointerEnd = () => {
            stopAutoScroll();
            if (autoExpandTimer) {
                clearTimeout(autoExpandTimer);
                autoExpandTimer = null;
            }

            window.removeEventListener('mousemove', onPointerMove);
            window.removeEventListener('mouseup', onPointerEnd);
            window.removeEventListener('touchmove', onPointerMove);
            window.removeEventListener('touchend', onPointerEnd);
            window.removeEventListener('touchcancel', onPointerEnd);

            if (card) {
                card.style.touchAction = '';
                card.style.pointerEvents = '';
            }

            if (activeTargetGroup) {
                activeTargetGroup.classList.remove('nw-portfolio-group-drop-target');
            }

            if (!isDraggingActive || manager.draggedIndex === null) {
                isDraggingActive = false;
                activeTargetGroup = null;
                activeTargetPortfolio = null;
                activeTargetSlot = null;
                return;
            }

            const currentItemPortfolio = sourcePortfolio;

            // Scenario 1: Dropped into another portfolio -> Seamless cross-portfolio move & insert!
            if (activeTargetPortfolio && activeTargetPortfolio !== currentItemPortfolio) {
                isDraggingActive = false;
                wasDragged = true;
                manager.draggedIndex = null;
                NetWorthDragHandler.clearDragShiftAnimation();

                const targetName = activeTargetPortfolio;
                const targetSlot = activeTargetSlot;
                const preservedScrollTop = container ? container.scrollTop : 0;

                activeTargetGroup = null;
                activeTargetPortfolio = null;
                activeTargetSlot = null;

                const itemId = item ? item.id : card.dataset.id;
                const itemName = item ? item.name : (card.querySelector('.font-bold')?.innerText || 'Asset');
                const success = NetWorthPortfolioService.moveItemToPortfolio(manager, itemId, targetName, targetSlot);

                if (success) {
                    if (navigator.vibrate) {
                        try { navigator.vibrate([40, 60, 40]); } catch (_) {}
                    }
                    if (manager && typeof manager.playClickSound === 'function') {
                        manager.playClickSound();
                    }

                    manager.saveData();
                    manager.render();

                    const newContainer = document.getElementById('nw-items-list');
                    if (newContainer && typeof preservedScrollTop === 'number') {
                        newContainer.scrollTop = preservedScrollTop;
                    }

                    const newCard = newContainer ? newContainer.querySelector(`.nw-item-card[data-id="${itemId}"]`) : null;
                    if (newCard) {
                        newCard.classList.add('nw-card-just-moved');
                        setTimeout(() => {
                            newCard.classList.remove('nw-card-just-moved');
                        }, 1200);
                    }

                    if (window.ShareUI && window.ShareUI.showToast) {
                        window.ShareUI.showToast('Moved Portfolio', `Moved "${itemName}" to ${targetName}`, 'success');
                    }
                }

                setTimeout(() => {
                    wasDragged = false;
                }, 150);
                return;
            }

            // Scenario 2: Normal within-group drop & reordering
            isDraggingActive = false;
            wasDragged = true;
            const sourceIdx = manager.draggedIndex;
            const targetIdx = currentTargetIdx;
            const preservedScrollTop = container ? container.scrollTop : 0;

            card.classList.remove('is-dragging');
            card.classList.add('is-dropping');

            const finalDeltaY = (targetIdx - sourceIdx) * itemHeight;
            card.style.transform = `translateY(${finalDeltaY}px) scale(1)`;

            setTimeout(() => {
                NetWorthDragHandler.clearDragShiftAnimation();
                manager.draggedIndex = null;
                if (container) {
                    container.classList.remove('is-scrolling');
                }
                if (sourceIdx !== targetIdx) {
                    NetWorthDragHandler.reorderFilteredItems(manager, sourceIdx, targetIdx, filtered, preservedScrollTop);
                } else if (container) {
                    container.scrollTop = preservedScrollTop;
                }
                setTimeout(() => {
                    wasDragged = false;
                }, 100);
            }, 180);
        };

        const beginDrag = (clientX, clientY) => {
            if (manager.draggedIndex !== null) return;
            container = document.getElementById('nw-items-list');
            if (!container) return;

            isDraggingActive = true;
            manager.draggedIndex = index;
            currentTargetIdx = index;
            startClientX = clientX;
            startClientY = clientY;
            currentClientX = clientX;
            currentClientY = clientY;
            startScrollTop = container.scrollTop;
            containerRect = container.getBoundingClientRect();

            itemHeight = card.offsetHeight > 0 ? card.offsetHeight + 8 : 60;
            card.style.touchAction = 'none';
            card.style.pointerEvents = 'none'; // Essential: enables document.elementFromPoint to see target elements beneath

            sourcePortfolio = (item && item.portfolio) || card.dataset.portfolio || NetWorthPortfolioService.DEFAULT_PORTFOLIO;
            sourceGroup = card.closest('.nw-portfolio-group');

            activeTargetGroup = null;
            activeTargetPortfolio = null;
            activeTargetSlot = null;
            if (autoExpandTimer) {
                clearTimeout(autoExpandTimer);
                autoExpandTimer = null;
            }
            lastHoveredCollapsedGroup = null;

            card.classList.add('is-dragging');
            card.style.transform = 'translateY(0px) scale(0.96)';
            container.classList.add('is-scrolling');

            if (navigator.vibrate) {
                try { navigator.vibrate(30); } catch (_) {}
            }
            if (manager && typeof manager.playClickSound === 'function') {
                manager.playClickSound();
            }

            window.addEventListener('mousemove', onPointerMove, { passive: false });
            window.addEventListener('mouseup', onPointerEnd, { passive: false });
            window.addEventListener('touchmove', onPointerMove, { passive: false });
            window.addEventListener('touchend', onPointerEnd, { passive: false });
            window.addEventListener('touchcancel', onPointerEnd, { passive: false });
        };

        const onPointerStart = (e) => {
            if (isInteractiveTarget(e.target)) return;

            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;

            // Scenario A: Clicked on 6-dot grip handle -> Immediate Drag
            if (e.target.closest('.nw-drag-handle')) {
                if (e.cancelable) e.preventDefault();
                beginDrag(clientX, clientY);
                return;
            }

            // Scenario B: Pressed on Card Body -> Long-press detection (~250ms)
            if (longPressTimer) {
                clearTimeout(longPressTimer);
                longPressTimer = null;
            }

            let movedTooFar = false;
            const onEarlyMove = (moveEvt) => {
                const cx = moveEvt.touches ? moveEvt.touches[0].clientX : moveEvt.clientX;
                const cy = moveEvt.touches ? moveEvt.touches[0].clientY : moveEvt.clientY;
                if (Math.hypot(cx - clientX, cy - clientY) > 8) {
                    movedTooFar = true;
                    cleanupEarly();
                }
            };

            const onEarlyEnd = () => {
                cleanupEarly();
            };

            const cleanupEarly = () => {
                if (longPressTimer) {
                    clearTimeout(longPressTimer);
                    longPressTimer = null;
                }
                window.removeEventListener('mousemove', onEarlyMove);
                window.removeEventListener('mouseup', onEarlyEnd);
                window.removeEventListener('touchmove', onEarlyMove);
                window.removeEventListener('touchend', onEarlyEnd);
                window.removeEventListener('touchcancel', onEarlyEnd);
            };

            window.addEventListener('mousemove', onEarlyMove, { passive: true });
            window.addEventListener('mouseup', onEarlyEnd, { passive: true });
            window.addEventListener('touchmove', onEarlyMove, { passive: true });
            window.addEventListener('touchend', onEarlyEnd, { passive: true });
            window.addEventListener('touchcancel', onEarlyEnd, { passive: true });

            longPressTimer = setTimeout(() => {
                cleanupEarly();
                if (!movedTooFar && manager.draggedIndex === null) {
                    beginDrag(clientX, clientY);
                }
            }, 250);
        };

        // Suppress accidental click event right after drag release
        card.addEventListener('click', (clickEvt) => {
            if (wasDragged) {
                clickEvt.preventDefault();
                clickEvt.stopPropagation();
            }
        }, true);

        // Prevent native HTML5 ghost drag
        card.addEventListener('dragstart', (e) => e.preventDefault());

        card.addEventListener('mousedown', onPointerStart);
        card.addEventListener('touchstart', onPointerStart, { passive: false });
    }

    /**
     * Resets card transforms in other portfolio groups not currently involved in the drag.
     * @param {HTMLElement} container 
     * @param {HTMLElement[]} excludeGroups 
     */
    static clearOtherGroupsCards(container, excludeGroups = []) {
        if (!container) return;
        const allGroups = container.querySelectorAll('.nw-portfolio-group');
        allGroups.forEach(g => {
            if (excludeGroups && excludeGroups.includes(g)) return;
            g.querySelectorAll('.nw-item-card').forEach(c => {
                if (c.style.transform) c.style.transform = '';
            });
        });
    }

    static updateOtherCardsShift(sourceCard, sourceIdx, targetIdx, itemHeight = 60) {
        if (!sourceCard || sourceIdx === null || sourceIdx === undefined) return;
        const groupContainer = sourceCard.closest('.nw-portfolio-items') || document.getElementById('nw-items-list');
        if (!groupContainer) return;

        const cards = Array.from(groupContainer.querySelectorAll('.nw-item-card'));

        cards.forEach((c) => {
            const idx = parseInt(c.dataset.index, 10);
            if (isNaN(idx) || idx === sourceIdx) return;

            if (sourceIdx < targetIdx) {
                if (idx > sourceIdx && idx <= targetIdx) {
                    c.style.transform = `translateY(-${itemHeight}px)`;
                } else {
                    c.style.transform = 'translateY(0)';
                }
            } else if (sourceIdx > targetIdx) {
                if (idx >= targetIdx && idx < sourceIdx) {
                    c.style.transform = `translateY(${itemHeight}px)`;
                } else {
                    c.style.transform = 'translateY(0)';
                }
            } else {
                c.style.transform = 'translateY(0)';
            }
        });
    }

    static clearDragShiftAnimation() {
        const container = document.getElementById('nw-items-list');
        if (!container) return;
        container.querySelectorAll('.nw-portfolio-group').forEach(g => {
            g.classList.remove('nw-portfolio-group-drop-target');
        });
        container.querySelectorAll('.nw-portfolio-header').forEach(h => {
            h.classList.remove('nw-portfolio-drop-target');
        });
        container.querySelectorAll('.nw-item-card').forEach(c => {
            c.style.transform = '';
            c.classList.remove('is-dragging', 'is-dropping');
        });
    }

    static reorderFilteredItems(manager, sourceIdx, targetIdx, filtered, preservedScrollTop) {
        if (!Array.isArray(filtered) || sourceIdx < 0 || sourceIdx >= filtered.length || targetIdx < 0 || targetIdx >= filtered.length) return;
        const [movedItem] = filtered.splice(sourceIdx, 1);
        filtered.splice(targetIdx, 0, movedItem);

        const groupIds = new Set(filtered.map(item => item.id));
        let groupPtr = 0;
        manager.items = manager.items.map(item => {
            if (groupIds.has(item.id)) {
                return filtered[groupPtr++];
            }
            return item;
        });

        manager.saveData();
        manager.render();

        const container = document.getElementById('nw-items-list');
        if (container && typeof preservedScrollTop === 'number') {
            container.scrollTop = preservedScrollTop;
        }
    }
}
