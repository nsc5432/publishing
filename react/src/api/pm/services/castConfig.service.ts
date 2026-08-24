import apiClient from '../client';
import { API_ENDPOINTS } from '../endpoints';
import { USE_MOCK, mockResponse } from '../mock';
import { castConfigMock } from '../mock/castConfig.mock';
import type { CastConfigDatasetDto, CastConfigGroupListDto, CastConfigSaveItemDto, JsonResponse, TmnlId } from '@/types/api.types';

export const castConfigService = {
    getGroupList: async (tmnlId: TmnlId): Promise<CastConfigGroupListDto> => {
        if (USE_MOCK) return mockResponse(castConfigMock.getGroupList(tmnlId), { loading: true });

        const response = await apiClient.post<CastConfigGroupListDto>(API_ENDPOINTS.CAST_CONFIG_GROUP_LIST, { tmnlId }, { params: { loading: true } });
        return response.data;
    },

    getDataset: async (tmnlId: TmnlId, groupId: string, sheetNm: string): Promise<CastConfigDatasetDto> => {
        if (USE_MOCK) {
            return mockResponse(castConfigMock.getDataset(tmnlId, groupId, sheetNm), {
                loading: true,
            });
        }

        const response = await apiClient.post<CastConfigDatasetDto>(
            API_ENDPOINTS.CAST_CONFIG_DATASET,
            { tmnlId, groupId, sheetNm },
            { params: { loading: true } },
        );
        return response.data;
    },

    saveDataset: async (tmnlId: TmnlId, itemList: CastConfigSaveItemDto[]): Promise<JsonResponse> => {
        if (USE_MOCK) {
            return mockResponse(castConfigMock.saveDataset(tmnlId, itemList), { loading: true });
        }

        const response = await apiClient.post<JsonResponse>(API_ENDPOINTS.CAST_CONFIG_SAVE, { tmnlId, itemList }, { params: { loading: true } });
        return response.data;
    },
};
