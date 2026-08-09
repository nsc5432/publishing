import { useLayoutEffect } from 'react';

const DW = 1920;
const DH = 1010; /** 1080 - 상단 바 70 = 본문 영역의 디자인 높이 */
const MAXW = DW * 1.35;
const MAXH = DH * 1.25;

const VARS = ['--scale', '--app-w', '--app-h', '--app-x', '--app-y'] as const;

function readToken(root: HTMLElement, name: string, fallback: number) {
    const px = Number.parseFloat(getComputedStyle(root).getPropertyValue(name));
    return Number.isFinite(px) ? px : fallback;
}

export function useFitToScreen() {
    useLayoutEffect(() => {
        const root = document.documentElement;
        let raf = 0;

        const fit = () => {
            raf = 0;
            const vw = window.innerWidth;
            const vh = window.innerHeight;
            const headerH = readToken(root, '--pm-header-h', 70);
            const availW = Math.max(vw, 320);
            const availH = Math.max(vh - headerH, 320);
            const s = Math.min(availW / DW, availH / DH);
            const w = Math.min(Math.round(availW / s), MAXW);
            const h = Math.min(Math.round(availH / s), MAXH);
            root.style.setProperty('--scale', String(s));
            root.style.setProperty('--app-w', `${w}px`);
            root.style.setProperty('--app-h', `${h}px`);
            root.style.setProperty('--app-x', `${Math.round((vw - w * s) / 2)}px`);
            root.style.setProperty('--app-y', `${Math.round(headerH + (availH - h * s) / 2)}px`);
        };

        const onResize = () => {
            if (!raf) raf = requestAnimationFrame(fit);
        };

        window.addEventListener('resize', onResize);
        window.visualViewport?.addEventListener('resize', onResize);
        fit();

        return () => {
            if (raf) cancelAnimationFrame(raf);
            window.removeEventListener('resize', onResize);
            window.visualViewport?.removeEventListener('resize', onResize);
            VARS.forEach((name) => root.style.removeProperty(name));
        };
    }, []);
}
