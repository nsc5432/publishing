import apiClient from '../client';
import { API_ENDPOINTS } from '../endpoints';
import { depHallMock } from '../mock/depHall.mock';
import { USE_MOCK, mockResponse } from '../mock';
import type { DepHallDto, TmnlId } from '@/types/api.types';

/** 일일 시뮬레이션 결과 조회 - 출국장 */
export const depHallService = {
    // 화면 하루치 (혼잡 알림 / 출국장 카드 / 마커 / 30분 슬롯) — 맵·표·차트 세 보기가 나눠 쓴다
    getDepHall: async (smltId: string, tmnlId: TmnlId): Promise<DepHallDto> => {
        if (USE_MOCK) return mockResponse(depHallMock.getDepHall(tmnlId), { loading: true });

        const response = await apiClient.post<DepHallDto>(
            API_ENDPOINTS.DEP_HALL_INFO,
            { smltId, tmnlId },
            { params: { loading: true } },
        );

        return response.data;
    },
};
