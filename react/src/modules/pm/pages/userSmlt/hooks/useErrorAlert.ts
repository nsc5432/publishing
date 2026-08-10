import { useEffect } from 'react';
import { dialog } from '@/lib/dialog';

/** 조회 실패 사유를 알린다 (사유가 없으면 아무것도 하지 않는다) */
export function useErrorAlert(error: string): void {
    useEffect(() => {
        if (!error) return;

        dialog.alert({ title: '조회 실패', description: error }).catch(() => {
            // 다이얼로그를 못 띄우는 상황까지 화면이 끌려갈 이유는 없다 (콘솔에 이미 남는다).
        });
    }, [error]);
}
