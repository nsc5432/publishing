import { unwrap } from '@/api/pm/result';
import { dialog } from '@/lib/dialog';
import type { ApiError, JsonResponse } from '@/types/api.types';

/**
 * `현재상태 저장` 공통 처리.
 *
 * 세 탭이 저장하는 대상만 다르고 결과 알림은 같다. 탭마다 알림 문구가 갈리면
 * 같은 조작인데 화면마다 다르게 읽힌다.
 */
export function runSave(request: Promise<JsonResponse>, failMessage: string): void {
    request
        .then((dto) => unwrap(dto, failMessage))
        .then(() => dialog.alert({ title: '저장', description: '현재 상태를 저장했습니다.' }))
        .catch((err: ApiError) =>
            dialog.alert({ title: '저장 실패', description: err?.message || failMessage }),
        )
        .catch(() => {
            // 다이얼로그를 못 띄우는 상황까지 화면이 끌려갈 이유는 없다 (콘솔에 이미 남는다).
        });
}
