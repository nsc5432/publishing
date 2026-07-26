import { useEffect, useRef } from 'react';

/**
 * index.html 의 fit-to-screen 로직 이식.
 * 디자인 기준 1920x1080 을 뷰포트에 맞춰 축소/확대한다.
 * scale = min(vw/1920, vh/1080) 이므로 어떤 해상도에서도 잘리는 요소가 없고,
 * 남는 공간은 .app 의 논리 크기를 키워 flex 영역이 흡수한다(레터박스 없음).
 * 단, 화면비가 크게 다를 때 과도하게 늘어나지 않도록 확장 한도를 둔다.
 */
const DW = 1920;
const DH = 1080;
const MAXW = DW * 1.35;
const MAXH = DH * 1.25;

export function useFitToScreen<T extends HTMLElement>() {
    const ref = useRef<T>(null);

    useEffect(() => {
        const app = ref.current;
        if (!app) return;

        let raf = 0;

        const fit = () => {
            raf = 0;
            const vw = window.innerWidth;
            const vh = window.innerHeight;
            const s = Math.min(vw / DW, vh / DH);
            const w = Math.min(Math.round(vw / s), MAXW);
            const h = Math.min(Math.round(vh / s), MAXH);
            app.style.setProperty('--scale', String(s));
            app.style.setProperty('--app-w', `${w}px`);
            app.style.setProperty('--app-h', `${h}px`);
            app.style.setProperty('--app-x', `${Math.round((vw - w * s) / 2)}px`);
            app.style.setProperty('--app-y', `${Math.round((vh - h * s) / 2)}px`);
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
        };
    }, []);

    return ref;
}
