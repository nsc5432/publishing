import apiClient from '../client';
import { API_ENDPOINTS } from '../endpoints';
import { USE_MOCK, mockResponse } from '../mock';
import { castConfigMock } from '../mock/castConfig.mock';
import type {
    CastConfigAplySetHstryListDto,
    CastConfigCategoryCloneDto,
    CastConfigCategoryCloneResultDto,
    CastConfigCategoryListDto,
    CastConfigDatasetDto,
    CastConfigGroupListDto,
    CastConfigSetDto,
    CastConfigSetSaveItemDto,
    JsonResponse,
    TmnlId,
} from '@/types/api.types';

const LOADING = { params: { loading: true } };

export const castConfigService = {
    getGroupList: async (tmnlId: TmnlId): Promise<CastConfigGroupListDto> => {
        if (USE_MOCK) return mockResponse(castConfigMock.getGroupList(tmnlId), { loading: true });

        const response = await apiClient.post<CastConfigGroupListDto>(API_ENDPOINTS.CAST_CONFIG_GROUP_LIST, { tmnlId }, LOADING);
        return response.data;
    },

    getCategoryList: async (): Promise<CastConfigCategoryListDto> => {
        if (USE_MOCK) return mockResponse(castConfigMock.getCategoryList(), { loading: true });

        const response = await apiClient.post<CastConfigCategoryListDto>(API_ENDPOINTS.CAST_CONFIG_CATEGORY_LIST, {}, LOADING);
        return response.data;
    },

    getDataset: async (tmnlId: TmnlId, fixAtrbGroupId: string, groupId: string, sheetNm: string): Promise<CastConfigDatasetDto> => {
        if (USE_MOCK) return mockResponse(castConfigMock.getDataset(tmnlId, fixAtrbGroupId, groupId, sheetNm), { loading: true });

        const response = await apiClient.post<CastConfigDatasetDto>(API_ENDPOINTS.CAST_CONFIG_DATASET, { tmnlId, fixAtrbGroupId, groupId, sheetNm }, LOADING);
        return response.data;
    },

    cloneCategory: async (dto: CastConfigCategoryCloneDto): Promise<CastConfigCategoryCloneResultDto> => {
        if (USE_MOCK) return mockResponse(castConfigMock.cloneCategory(dto), { loading: true });

        const response = await apiClient.post<CastConfigCategoryCloneResultDto>(API_ENDPOINTS.CAST_CONFIG_CATEGORY_CLONE, dto, LOADING);
        return response.data;
    },

    saveCategorySet: async (fixAtrbGroupId: string, itemList: CastConfigSetSaveItemDto[]): Promise<JsonResponse> => {
        if (USE_MOCK) return mockResponse(castConfigMock.saveCategorySet(fixAtrbGroupId, itemList), { loading: true });

        const response = await apiClient.post<JsonResponse>(API_ENDPOINTS.CAST_CONFIG_SET_SAVE, { fixAtrbGroupId, itemList }, LOADING);
        return response.data;
    },

    getCategorySet: async (fixAtrbGroupId: string): Promise<CastConfigSetDto> => {
        if (USE_MOCK) return mockResponse(castConfigMock.getCategorySet(fixAtrbGroupId), { loading: true });

        const response = await apiClient.post<CastConfigSetDto>(API_ENDPOINTS.CAST_CONFIG_SET_RETRIEVE, { fixAtrbGroupId }, LOADING);
        return response.data;
    },

    applyCategorySet: async (fixAtrbGroupId: string): Promise<JsonResponse> => {
        if (USE_MOCK) return mockResponse(castConfigMock.applyCategorySet(fixAtrbGroupId), { loading: true });

        const response = await apiClient.post<JsonResponse>(API_ENDPOINTS.CAST_CONFIG_SET_APPLY, { fixAtrbGroupId }, LOADING);
        return response.data;
    },

    getApplySetHistory: async (): Promise<CastConfigAplySetHstryListDto> => {
        if (USE_MOCK) return mockResponse(castConfigMock.getApplySetHistory(), { loading: true });

        const response = await apiClient.post<CastConfigAplySetHstryListDto>(API_ENDPOINTS.CAST_CONFIG_SET_HSTRY, {}, LOADING);
        return response.data;
    },

    revertApplySet: async (aplySetSn: number): Promise<JsonResponse> => {
        if (USE_MOCK) return mockResponse(castConfigMock.revertApplySet(aplySetSn), { loading: true });

        const response = await apiClient.post<JsonResponse>(API_ENDPOINTS.CAST_CONFIG_SET_REVERT, { aplySetSn }, LOADING);
        return response.data;
    },
};
