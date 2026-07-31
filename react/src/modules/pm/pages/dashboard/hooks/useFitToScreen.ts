import { useEffect } from 'react';

/**
 * index.html 의 fit-to-screen 로직 이식.
 * 디자인 기준 1920x1080 중 상단 바(--pm-header-h)를 뺀 본문 영역을 뷰포트에 맞춘다.
 * 상단 바와 LNB 레일은 다른 화면과 크기가 같아야 해서 축소 대상이 아니고(실제 px),
 * 축소되는 것은 헤더 아래 본문(.app)뿐이다.
 *
 * scale = min(가용폭/1920, 가용높이/1010) 이므로 어떤 해상도에서도 잘리는 요소가 없고,
 * 남는 공간은 .app 의 논리 크기를 키워 flex 영역이 흡수한다(레터박스 없음).
 * 단, 화면비가 크게 다를 때 과도하게 늘어나지 않도록 확장 한도를 둔다.
 *
 * 계산 결과는 :root 에 올린다. 축소 대상인 .app 뿐 아니라 그 안에서 실제 px 여백을
 * 잡아야 하는 .body 도 같은 값을 쓰기 때문이다(dashboard.css 참고).
 */
const DW = 1920;
/** 1080 - 상단 바 70 = 본문 영역의 디자인 높이 */
const DH = 1010;
const MAXW = DW * 1.35;
const MAXH = DH * 1.25;

/** :root 에 올리는 CSS 변수 목록 (언마운트 시 되돌린다) */
const VARS = ['--scale', '--app-w', '--app-h', '--app-x', '--app-y'] as const;

/** 공용 셸 토큰(common.css) 읽기 — 화면 높이에 따라 값이 바뀌므로 매번 읽는다. */
function readToken(root: HTMLElement, name: string, fallback: number) {
    const px = Number.parseFloat(getComputedStyle(root).getPropertyValue(name));
    return Number.isFinite(px) ? px : fallback;
}

export function useFitToScreen() {
    useEffect(() => {
        const root = document.documentElement;
        let raf = 0;

        const fit = () => {
            raf = 0;
            const vw = window.innerWidth;
            const vh = window.innerHeight;
            const headerH = readToken(root, '--pm-header-h', 70);
            // 헤더 아래 남은 영역이 본문 몫이다. 좌우/상하 여백은 .body 가 실제 px 로 가진다.
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
