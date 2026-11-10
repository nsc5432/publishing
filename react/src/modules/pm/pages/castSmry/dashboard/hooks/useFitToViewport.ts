import { useLayoutEffect } from 'react';

// 1080 에서는 시설 카드 지표 줄의 처리 도넛이 눌려 보이지 않는다. 1150 이 도넛 기본 크기(72px)가 나오는 높이다.
const FIT_HEIGHT = 1150;
const MIN_FIT_WIDTH = 1350;

export function useFitToViewport() {
    useLayoutEffect(() => {
        const root = document.documentElement;

        const clear = () => {
            delete root.dataset.dsbdFit;
            root.style.removeProperty('--dsbd-fit');
            root.style.removeProperty('--dsbd-fit-h');
        };

        const apply = () => {
            const ratio = window.innerHeight / FIT_HEIGHT;
            if (window.innerWidth < MIN_FIT_WIDTH || ratio >= 1) {
                clear();
                return;
            }
            root.dataset.dsbdFit = '';
            root.style.setProperty('--dsbd-fit', String(ratio));
            root.style.setProperty('--dsbd-fit-h', `${FIT_HEIGHT}px`);
        };

        apply();
        window.addEventListener('resize', apply);

        return () => {
            window.removeEventListener('resize', apply);
            clear();
        };
    }, []);
}
