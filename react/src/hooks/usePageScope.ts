import { useLayoutEffect } from 'react';

/**
 * 화면 전용 CSS 를 그 화면에만 적용시키는 스코프 스위치.
 */
export function usePageScope(page: string) {
    useLayoutEffect(() => {
        const root = document.documentElement;
        root.dataset.page = page;

        return () => {
            if (root.dataset.page === page) delete root.dataset.page;
        };
    }, [page]);
}
