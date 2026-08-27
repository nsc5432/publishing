import { useEffect } from 'react';
import { dialog } from '@/lib/dialog';

export function useErrorAlert(error: string, token: number): void {
    useEffect(() => {
        if (!error) return;

        dialog.alert({ title: '조회 실패', description: error }).catch(() => {});
    }, [error, token]);
}
