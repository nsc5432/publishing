import { useEffect, useRef } from 'react';

/**
 * 팝업 공통 동작 — 열릴 때 닫기 버튼으로 포커스 이동, ESC 로 닫기,
 * 닫힐 때 직전 포커스 복원 (html/js/main.js 동작 이식).
 *
 * 반환한 ref 를 닫기 버튼에 걸어 쓴다.
 *
 * onClose 는 ref 로 참조한다. 이 화면은 타임라인 재생 때문에 초당 여러 번
 * 리렌더되는데, onClose 를 의존성에 두면 그때마다 effect 가 다시 돌면서
 * 사용자가 옮겨 둔 포커스를 닫기 버튼으로 되돌려 버린다.
 */
export function useModalDismiss(onClose: () => void) {
    const closeRef = useRef<HTMLButtonElement>(null);
    const onCloseRef = useRef(onClose);

    useEffect(() => {
        onCloseRef.current = onClose;
    }, [onClose]);

    useEffect(() => {
        const lastFocused = document.activeElement as HTMLElement | null;
        closeRef.current?.focus();

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onCloseRef.current();
        };
        document.addEventListener('keydown', onKeyDown);

        return () => {
            document.removeEventListener('keydown', onKeyDown);
            lastFocused?.focus();
        };
    }, []);

    return closeRef;
}
