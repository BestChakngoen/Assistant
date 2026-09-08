/**
 * NetWorthDragHandler.js - Custom Pointer Drag & Drop Reordering Subsystem
 * Handles 1:1 pointer tracking, card shrinking, shift animation, and list reordering.
 */
export class NetWorthDragHandler {
    static attachDragListeners(manager, card, index, filtered) {
        const onPointerStart = (e) => {
            if (!e.target.closest('.nw-drag-handle')) return;
            e.preventDefault();

            const startY = e.touches ? e.touches[0].clientY : e.clientY;
            manager.draggedIndex = index;
            let currentTargetIdx = index;
            const itemHeight = 60; // Card height + gap

            card.classList.add('is-dragging');
            card.style.transform = 'translateY(0px) scale(0.95)';

            const onPointerMove = (moveEvt) => {
                if (manager.draggedIndex === null) return;
                const currentY = moveEvt.touches ? moveEvt.touches[0].clientY : moveEvt.clientY;
                const deltaY = currentY - startY;

                // 1. Shrink card & move entire card directly with cursor/finger
                card.style.transform = `translateY(${deltaY}px) scale(0.95)`;

                // 2. Calculate target slot index & shift other cards
                const slotOffset = Math.round(deltaY / itemHeight);
                const newTargetIdx = Math.max(0, Math.min(filtered.length - 1, index + slotOffset));

                if (newTargetIdx !== currentTargetIdx) {
                    currentTargetIdx = newTargetIdx;
                }
                this.updateOtherCardsShift(index, currentTargetIdx, itemHeight);
            };

            const onPointerEnd = () => {
                window.removeEventListener('mousemove', onPointerMove);
                window.removeEventListener('mouseup', onPointerEnd);
                window.removeEventListener('touchmove', onPointerMove);
                window.removeEventListener('touchend', onPointerEnd);

                if (manager.draggedIndex === null) return;

                const sourceIdx = manager.draggedIndex;
                const targetIdx = currentTargetIdx;

                card.classList.remove('is-dragging');
                card.classList.add('is-dropping');
                const finalDeltaY = (targetIdx - sourceIdx) * itemHeight;
                card.style.transform = `translateY(${finalDeltaY}px) scale(1)`;

                setTimeout(() => {
                    this.clearDragShiftAnimation();
                    manager.draggedIndex = null;
                    if (sourceIdx !== targetIdx) {
                        this.reorderFilteredItems(manager, sourceIdx, targetIdx, filtered);
                    }
                }, 180);
            };

            window.addEventListener('mousemove', onPointerMove, { passive: false });
            window.addEventListener('mouseup', onPointerEnd, { passive: false });
            window.addEventListener('touchmove', onPointerMove, { passive: false });
            window.addEventListener('touchend', onPointerEnd, { passive: false });
        };

        card.addEventListener('mousedown', onPointerStart);
        card.addEventListener('touchstart', onPointerStart, { passive: false });
    }

    static updateOtherCardsShift(sourceIdx, targetIdx, itemHeight = 60) {
        const container = document.getElementById('nw-items-list');
        if (!container || sourceIdx === null || sourceIdx === undefined) return;

        const cards = Array.from(container.querySelectorAll('.nw-item-card'));

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
        container.querySelectorAll('.nw-item-card').forEach(c => {
            c.style.transform = '';
            c.classList.remove('is-dragging', 'is-dropping');
        });
    }

    static reorderFilteredItems(manager, sourceIdx, targetIdx, filtered) {
        if (sourceIdx < 0 || sourceIdx >= filtered.length || targetIdx < 0 || targetIdx >= filtered.length) return;
        const [movedItem] = filtered.splice(sourceIdx, 1);
        filtered.splice(targetIdx, 0, movedItem);

        if (manager.filter === 'ALL') {
            manager.items = filtered;
        } else {
            const filteredIds = filtered.map(item => item.id);
            const otherItems = manager.items.filter(item => !filteredIds.includes(item.id));
            manager.items = [...filtered, ...otherItems];
        }

        manager.saveData();
        manager.render();
    }
}
