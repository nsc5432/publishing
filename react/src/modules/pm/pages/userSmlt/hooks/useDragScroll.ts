import { useCallback, useEffect, useState, type Dispatch, type PointerEvent as ReactPointerEvent, type SetStateAction } from 'react';

interface DragScroll {
    scrollable: boolean;
    atStart: boolean;
    atEnd: boolean;
}

const FIT: DragScroll = { scrollable: false, atStart: true, atEnd: true };

function updateScrollState(element: HTMLDivElement, setScroll: Dispatch<SetStateAction<DragScroll>>) {
    const maxScrollLeft = element.scrollWidth - element.clientWidth;

    setScroll((previous) => {
        const nextScroll: DragScroll = {
            scrollable: maxScrollLeft > 1,
            atStart: element.scrollLeft <= 1,
            atEnd: element.scrollLeft >= maxScrollLeft - 1,
        };

        return previous.scrollable === nextScroll.scrollable && previous.atStart === nextScroll.atStart && previous.atEnd === nextScroll.atEnd
            ? previous
            : nextScroll;
    });
}

export function useDragScroll(el: HTMLDivElement | null) {
    const [scroll, setScroll] = useState<DragScroll>(FIT);
    const [dragging, setDragging] = useState(false);

    const sync = useCallback(() => {
        if (!el) return;
        updateScrollState(el, setScroll);
    }, [el]);

    useEffect(() => {
        if (!el) return;

        const observer = new ResizeObserver(() => updateScrollState(el, setScroll));
        observer.observe(el);
        return () => observer.disconnect();
    }, [el]);

    const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
        if (!el || event.button !== 0 || el.scrollWidth - el.clientWidth <= 1) return;

        const startX = event.clientX;
        const startScrollLeft = el.scrollLeft;
        el.setPointerCapture(event.pointerId);
        setDragging(true);

        const handleMove = (pointerEvent: PointerEvent) => {
            el.scrollLeft = startScrollLeft - (pointerEvent.clientX - startX);
        };
        const handleUp = () => {
            el.removeEventListener('pointermove', handleMove);
            el.removeEventListener('pointerup', handleUp);
            el.removeEventListener('pointercancel', handleUp);
            setDragging(false);
        };

        el.addEventListener('pointermove', handleMove);
        el.addEventListener('pointerup', handleUp);
        el.addEventListener('pointercancel', handleUp);
    };

    return { ...scroll, dragging, sync, onPointerDown };
}
