import { unwrap } from '@/api/pm/result';
import { userSmltService } from '@/api/pm/services/userSmlt.service';
import { dialog } from '@/lib/dialog';
import type { ApiError, UserSmltExecReq } from '@/types/api.types';

export async function runSave(request: UserSmltExecReq): Promise<boolean> {
    const failMessage = '현재 상태 저장에 실패했습니다.';
    try {
        for (const item of request.fltPsgList) {
            unwrap(await userSmltService.saveFltPsgInfo(item), `${item.tmnlId} 운항 및 여객수 저장에 실패했습니다.`);
        }
        for (const item of request.chknList) {
            unwrap(await userSmltService.saveChknCounterInfo(item), `${item.tmnlId} 체크인 카운터 저장에 실패했습니다.`);
        }
        for (const item of request.depList) {
            unwrap(await userSmltService.saveDepInfo(item), `${item.tmnlId} 출국장 저장에 실패했습니다.`);
        }
        await dialog.alert({ title: '저장', description: '현재 상태를 저장했습니다.' });
        return true;
    } catch (error) {
        await dialog.alert({ title: '저장 실패', description: (error as ApiError)?.message || failMessage });
        return false;
    }
}
