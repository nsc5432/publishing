import apiClient from '../client';
import { API_ENDPOINTS } from '../endpoints';
import { mapMock } from '../mock/map.mock';
import { USE_MOCK, mockResponse } from '../mock';
import type { SmltMapDto, TmnlId } from '@/types/api.types';

/** 일일 시뮬레이션 결과 조회 - 맵형태보기 */
export const mapService = {
    // 도면 하루치 (혼잡 알림 / 운영시간 카드 / 마커 / 30분 슬롯) — 타임라인은 재조회하지 않는다
    getSmltMap: async (smltId: string, tmnlId: TmnlId): Promise<SmltMapDto> => {
        if (USE_MOCK) return mockResponse(mapMock.getSmltMap(tmnlId), { loading: true });

        const response = await apiClient.post<SmltMapDto>(
            API_ENDPOINTS.MAP_INFO,
            { smltId, tmnlId },
            { params: { loading: true } },
        );

        return response.data;
    },
};
