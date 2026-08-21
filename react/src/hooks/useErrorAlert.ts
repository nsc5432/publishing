import { useEffect } from 'react';
import { dialog } from '@/lib/dialog';

/**
 * 조회 실패 사유를 알린다 (사유가 없으면 아무것도 하지 않는다).
 *
 * token 은 useFetched 가 조회 한 건이 끝날 때마다 늘리는 값이다. 사유 문구가 이전과
 * 같아도(예: 두 번 연속으로 없는 날짜를 조회) token 이 바뀌므로 알럿을 다시 띄운다.
 */
export function useErrorAlert(error: string, token: number): void {
    useEffect(() => {
        if (!error) return;

        dialog.alert({ title: '조회 실패', description: error }).catch(() => {
            // 다이얼로그를 못 띄우는 상황까지 화면이 끌려갈 이유는 없다 (콘솔에 이미 남는다).
        });
        // error 는 일부러 뺀다 — token 만으로 "새 조회 결과인지" 를 판단해야 한다.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);
}
