import { mockResponse } from '../mock';
import { cmrcSalesMock } from '../mock/cmrcSales.mock';
import type { CmrcSalesDto, TmnlId } from '@/types/api.types';

/** 아일랜드 상업시설 매출 */
export const cmrcSalesService = {
    // 매출 원천 API 가 아직 없어 VITE_ENABLE_MOCK 과 무관하게 목업을 돌려준다
    getIslandSales: (ymd: string, tmnlId: TmnlId): Promise<CmrcSalesDto> =>
        mockResponse(cmrcSalesMock.getIslandSales(ymd, tmnlId)),
};
