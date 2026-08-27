import { useLayoutEffect } from 'react';

export function usePageScope(page: string) {
    useLayoutEffect(() => {
        const documentRoot = document.documentElement;
        documentRoot.dataset.page = page;

        return () => {
            if (documentRoot.dataset.page === page) delete documentRoot.dataset.page;
        };
    }, [page]);
}
