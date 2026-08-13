import apiClient from '../client';
import { API_ENDPOINTS } from '../endpoints';
import { chknCounterMock } from '../mock/chknCounter.mock';
import { USE_MOCK, mockResponse } from '../mock';
import type { ChknCounterDto, TmnlId } from '@/types/api.types';

/** 일일 시뮬레이션 결과 조회 - 체크인카운터 (셀프체크인/백드롭 포함) */
export const chknCounterService = {
    // 화면 하루치 (아일랜드 · 시간대별 자원 · 30분 슬롯) — 차트·표 두 보기가 나눠 쓴다
    getChknCounter: async (smltId: string, tmnlId: TmnlId): Promise<ChknCounterDto> => {
        if (USE_MOCK) return mockResponse(chknCounterMock.getChknCounter(tmnlId), { loading: true });

        const response = await apiClient.post<ChknCounterDto>(
            API_ENDPOINTS.CHKN_COUNTER_INFO,
            { smltId, tmnlId },
            { params: { loading: true } },
        );

        return response.data;
    },
};
