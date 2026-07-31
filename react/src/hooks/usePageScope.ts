import { useLayoutEffect } from 'react';

/**
 * 화면 전용 CSS 를 그 화면에만 적용시키는 스코프 스위치.
 *
 * 화면 CSS(dashboard.css / terminalMap.css / userSmlt.css)는 각자 body·html·:root 같은
 * 전역 셀렉터를 쓴다. 라우트가 lazy 로 나뉘어 있어도 한 번 불러온 스타일시트는
 * 문서에서 내려가지 않으므로, 스코프가 없으면 A 화면을 거친 뒤 B 화면으로 이동했을 때
 * A 의 배경·overflow·.sidebar 배치가 그대로 남아 레이아웃이 깨진다.
 *
 * 그래서 화면 CSS 는 전부 `html[data-page='<page>']` 아래로 스코프해 두었고,
 * 이 훅이 활성 화면에 맞춰 그 속성을 갈아 끼운다.
 */
export function usePageScope(page: string) {
    useLayoutEffect(() => {
        const root = document.documentElement;
        root.dataset.page = page;

        return () => {
            // 다음 화면이 이미 자기 값을 넣었다면 건드리지 않는다.
            if (root.dataset.page === page) delete root.dataset.page;
        };
    }, [page]);
}
