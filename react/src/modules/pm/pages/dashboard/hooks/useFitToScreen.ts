import { useEffect } from 'react';

/**
 * index.html 의 fit-to-screen 로직 이식.
 * 디자인 기준 1920x1080 을 뷰포트에 맞춰 축소/확대한다.
 * scale = min(vw/1920, vh/1080) 이므로 어떤 해상도에서도 잘리는 요소가 없고,
 * 남는 공간은 .app 의 논리 크기를 키워 flex 영역이 흡수한다(레터박스 없음).
 * 단, 화면비가 크게 다를 때 과도하게 늘어나지 않도록 확장 한도를 둔다.
 *
 * 계산 결과는 :root 에 올린다. 축소 대상인 .app 뿐 아니라 그 밖에 있는
 * LNB 레일도 같은 값으로 위치를 잡아야 하기 때문이다(dashboard.css 의 sidebar 참고).
 */
const DW = 1920;
const DH = 1080;
const MAXW = DW * 1.35;
const MAXH = DH * 1.25;
/** 화면 가장자리 여백(px, 실제 뷰포트 기준) — 브라우저 창에 딱 붙지 않게 한다 */
const GUTTER = 24;
/**
 * 축소 배율. 1 이면 여백을 제외한 영역을 꽉 채운다.
 * 1 보다 작게 두면 요소가 그만큼 작아지고, 그 차이는 .app 의 논리 크기가 커지면서
 * flex 영역(카드 사이 간격/패널 내부)의 여백으로 배분된다.
 */
const ZOOM = 0.92;

/** :root 에 올리는 CSS 변수 목록 (언마운트 시 되돌린다) */
const VARS = ['--scale', '--app-w', '--app-h', '--app-x', '--app-y'] as const;

export function useFitToScreen() {
    useEffect(() => {
        const root = document.documentElement;
        let raf = 0;

        const fit = () => {
            raf = 0;
            const vw = window.innerWidth;
            const vh = window.innerHeight;
            // 가장자리 여백을 뺀 영역에 맞추고, 그 안에서 한 번 더 축소한다.
            const availW = Math.max(vw - GUTTER * 2, 320);
            const availH = Math.max(vh - GUTTER * 2, 320);
            const s = Math.min(availW / DW, availH / DH) * ZOOM;
            const w = Math.min(Math.round(availW / s), MAXW);
            const h = Math.min(Math.round(availH / s), MAXH);
            root.style.setProperty('--scale', String(s));
            root.style.setProperty('--app-w', `${w}px`);
            root.style.setProperty('--app-h', `${h}px`);
            root.style.setProperty('--app-x', `${Math.round((vw - w * s) / 2)}px`);
            root.style.setProperty('--app-y', `${Math.round((vh - h * s) / 2)}px`);
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
