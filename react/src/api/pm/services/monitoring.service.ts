import apiClient from '../client';
import { API_ENDPOINTS } from '../endpoints';
import type { SmltExecDetailDto, SmltExecListDto, SmltExecSmryDto } from '@/types/api.types';

/**
 * 시뮬레이션 모니터링.
 * 조회 기간(bgnDt ~ endDt) 은 화면의 시작/종료 일시를 yyyyMMddHHmm 으로 합쳐 넘긴다.
 */
export const monitoringService = {
    // 상단 KPI (전체 수행 / 완료 / 진행중 / 평균 수행시간)
    getExecSmry: async (bgnDt: string, endDt: string): Promise<SmltExecSmryDto> => {
        const response = await apiClient.post<SmltExecSmryDto>(
            API_ENDPOINTS.MNTR_EXEC_SMRY,
            { bgnDt, endDt },
            { params: { loading: true } },
        );

        return response.data;
    },

    // 시뮬레이션 이력 (표준 / 사용자를 한 번에 조회)
    getExecList: async (bgnDt: string, endDt: string): Promise<SmltExecListDto> => {
        const response = await apiClient.post<SmltExecListDto>(
            API_ENDPOINTS.MNTR_EXEC_LIST,
            { bgnDt, endDt },
            { params: { loading: true } },
        );

        return response.data;
    },

    // 이력 1건 결과 보기
    getExecDetail: async (smltId: string): Promise<SmltExecDetailDto> => {
        const response = await apiClient.post<SmltExecDetailDto>(API_ENDPOINTS.MNTR_EXEC_DETAIL, {
            smltId,
        });

        return response.data;
    },
};
