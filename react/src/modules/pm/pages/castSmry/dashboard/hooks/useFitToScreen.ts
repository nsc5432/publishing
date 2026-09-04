import { useLayoutEffect } from 'react';

const DESIGN_WIDTH = 1920;
/** 1080 - 상단 바 70 = 본문 영역의 디자인 높이 */
const DESIGN_HEIGHT = 1010;
const MAX_APP_WIDTH = DESIGN_WIDTH * 1.35;
const MAX_APP_HEIGHT = DESIGN_HEIGHT * 1.25;

const APP_CSS_VARS = ['--scale', '--app-w', '--app-h', '--app-x', '--app-y'] as const;

function readToken(root: HTMLElement, name: string, fallback: number) {
    const parsed = Number.parseFloat(getComputedStyle(root).getPropertyValue(name));
    return Number.isFinite(parsed) ? parsed : fallback;
}

export function useFitToScreen() {
    useLayoutEffect(() => {
        const root = document.documentElement;
        let frameId = 0;

        const applyScale = () => {
            frameId = 0;
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            const headerHeight = readToken(root, '--pm-header-h', 70);
            const availableWidth = Math.max(viewportWidth, 320);
            const availableHeight = Math.max(viewportHeight - headerHeight, 320);
            const scale = Math.min(availableWidth / DESIGN_WIDTH, availableHeight / DESIGN_HEIGHT);
            const appWidth = Math.min(Math.round(availableWidth / scale), MAX_APP_WIDTH);
            const appHeight = Math.min(Math.round(availableHeight / scale), MAX_APP_HEIGHT);

            root.style.setProperty('--scale', String(scale));
            root.style.setProperty('--app-w', `${appWidth}px`);
            root.style.setProperty('--app-h', `${appHeight}px`);
            root.style.setProperty(
                '--app-x',
                `${Math.round((viewportWidth - appWidth * scale) / 2)}px`,
            );
            root.style.setProperty(
                '--app-y',
                `${Math.round(headerHeight + (availableHeight - appHeight * scale) / 2)}px`,
            );
        };

        const onResize = () => {
            if (!frameId) frameId = requestAnimationFrame(applyScale);
        };

        window.addEventListener('resize', onResize);
        window.visualViewport?.addEventListener('resize', onResize);
        applyScale();

        return () => {
            if (frameId) cancelAnimationFrame(frameId);
            window.removeEventListener('resize', onResize);
            window.visualViewport?.removeEventListener('resize', onResize);
            APP_CSS_VARS.forEach((name) => root.style.removeProperty(name));
        };
    }, []);
}
