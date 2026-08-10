import apiClient from '../client';
import { API_ENDPOINTS } from '../endpoints';
import { depHallMock } from '../mock/depHall.mock';
import { USE_MOCK, mockResponse } from '../mock';
import type { DepHallDto, DepHallTrendDto, TmnlId } from '@/types/api.types';

/** 일일 시뮬레이션 결과 조회 - 출국장 */
export const depHallService = {
    // 화면 본문 (혼잡 알림 / 출국장 카드 / 마커) — 타임라인 시각 기준
    getDepHall: async (smltId: string, tmnlId: TmnlId, hhmm: string): Promise<DepHallDto> => {
        if (USE_MOCK) return mockResponse(depHallMock.getDepHall(tmnlId, hhmm), { loading: true });

        const response = await apiClient.post<DepHallDto>(
            API_ENDPOINTS.DEP_HALL_INFO,
            { smltId, tmnlId, hhmm },
            { params: { loading: true } },
        );

        return response.data;
    },

    // 차트 보기 — 출국장별 하루 추이 (터미널이 바뀔 때만 다시 받으면 된다)
    getDepHallTrend: async (smltId: string, tmnlId: TmnlId): Promise<DepHallTrendDto> => {
        if (USE_MOCK) return mockResponse(depHallMock.getDepHallTrend(tmnlId), { loading: true });

        const response = await apiClient.post<DepHallTrendDto>(
            API_ENDPOINTS.DEP_HALL_TREND,
            { smltId, tmnlId },
            { params: { loading: true } },
        );

        return response.data;
    },
};
