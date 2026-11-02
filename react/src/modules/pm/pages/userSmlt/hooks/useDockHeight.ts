import { useLayoutEffect, type RefObject } from 'react';

export function useDockHeight(dockRef: RefObject<HTMLElement | null>) {
    useLayoutEffect(() => {
        const dock = dockRef.current;
        const host = dock?.parentElement;
        if (!dock || !host) return;

        const observer = new ResizeObserver(() => host.style.setProperty('--dock-h', `${dock.offsetHeight}px`));
        observer.observe(dock);
        return () => {
            observer.disconnect();
            host.style.removeProperty('--dock-h');
        };
    }, [dockRef]);
}
