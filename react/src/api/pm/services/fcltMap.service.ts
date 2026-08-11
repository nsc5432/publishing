import apiClient from '../client';
import { API_ENDPOINTS } from '../endpoints';
import { fcltMapMock } from '../mock/fcltMap.mock';
import { USE_MOCK, mockResponse } from '../mock';
import type { FcltMapListDto, FcltMapSaveItemDto, JsonResponse, TmnlId } from '@/types/api.types';

/**
 * 시설물 매핑.
 *
 * 조회가 본업이고, 고칠 수 있는 값은 CAST 시뮬레이션명 하나뿐이다.
 * 그래서 저장도 (여객시설코드 → 시뮬레이션시설명) 쌍만 보낸다.
 */
export const fcltMapService = {
    // 터미널 한 곳의 매핑 전량 + 도면 마커
    getFcltMapList: async (tmnlId: TmnlId): Promise<FcltMapListDto> => {
        if (USE_MOCK) return mockResponse(fcltMapMock.getFcltMapList(tmnlId), { loading: true });

        const response = await apiClient.post<FcltMapListDto>(
            API_ENDPOINTS.FCLT_MAP_LIST,
            { tmnlId },
            { params: { loading: true } },
        );

        return response.data;
    },

    // 바뀐 매핑만 모아서 저장
    saveFcltMapList: async (
        tmnlId: TmnlId,
        itemList: FcltMapSaveItemDto[],
    ): Promise<JsonResponse> => {
        if (USE_MOCK) {
            return mockResponse(fcltMapMock.saveFcltMapList(tmnlId, itemList), { loading: true });
        }

        const response = await apiClient.post<JsonResponse>(
            API_ENDPOINTS.FCLT_MAP_SAVE,
            { tmnlId, itemList },
            { params: { loading: true } },
        );

        return response.data;
    },
};
