import { unwrap } from '@/api/pm/result';
import { dialog } from '@/lib/dialog';
import type { ApiError, JsonResponse } from '@/types/api.types';

export async function runSave(request: Promise<JsonResponse>, failMessage: string): Promise<boolean> {
    try {
        unwrap(await request, failMessage);
        await dialog.alert({ title: '저장', description: '현재 상태를 저장했습니다.' });
        return true;
    } catch (error) {
        await dialog.alert({ title: '저장 실패', description: (error as ApiError)?.message || failMessage });
        return false;
    }
}
