import { useCallback, useEffect, useState, type PointerEvent as ReactPointerEvent } from 'react';

interface DragScroll {
    scrollable: boolean;
    atStart: boolean;
    atEnd: boolean;
}

const FIT: DragScroll = { scrollable: false, atStart: true, atEnd: true };

/**
 * 가로로 넘치는 줄을 마우스로 끌어 미는 스크롤러.
 *
 * 끌 수 있는지(`scrollable`)와 어느 쪽이 잘렸는지(`atStart`/`atEnd`)를 함께 돌려주므로,
 * 페이드·화살표 같은 신호를 클래스로 붙일 수 있다.
 */
export function useDragScroll(el: HTMLDivElement | null) {
    const [scroll, setScroll] = useState<DragScroll>(FIT);
    const [dragging, setDragging] = useState(false);

    const sync = useCallback(() => {
        if (!el) return;

        const max = el.scrollWidth - el.clientWidth;
        setScroll((prev) => {
            const next: DragScroll = {
                scrollable: max > 1,
                atStart: el.scrollLeft <= 1,
                atEnd: el.scrollLeft >= max - 1,
            };
            return prev.scrollable === next.scrollable &&
                prev.atStart === next.atStart &&
                prev.atEnd === next.atEnd
                ? prev
                : next;
        });
    }, [el]);

    useEffect(() => {
        if (!el) return;

        const observer = new ResizeObserver(sync);
        observer.observe(el);
        return () => observer.disconnect();
    }, [el, sync]);

    const onPointerDown = useCallback(
        (e: ReactPointerEvent<HTMLDivElement>) => {
            if (!el || e.button !== 0 || el.scrollWidth - el.clientWidth <= 1) return;

            const startX = e.clientX;
            const startLeft = el.scrollLeft;
            el.setPointerCapture(e.pointerId);
            setDragging(true);

            const handleMove = (ev: PointerEvent) => {
                el.scrollLeft = startLeft - (ev.clientX - startX);
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
        },
        [el],
    );

    return { ...scroll, dragging, sync, onPointerDown };
}
