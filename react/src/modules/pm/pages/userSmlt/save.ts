import { unwrap } from '@/api/pm/result';
import { dialog } from '@/lib/dialog';
import type { ApiError, JsonResponse } from '@/types/api.types';

export function runSave(request: Promise<JsonResponse>, failMessage: string): void {
    request
        .then((dto) => unwrap(dto, failMessage))
        .then(() => dialog.alert({ title: '저장', description: '현재 상태를 저장했습니다.' }))
        .catch((error: ApiError) => dialog.alert({ title: '저장 실패', description: error?.message || failMessage }))
        .catch(() => {});
}
