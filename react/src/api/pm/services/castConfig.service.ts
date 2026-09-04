import apiClient from '../client';
import { API_ENDPOINTS } from '../endpoints';
import { USE_MOCK, mockResponse } from '../mock';
import { castConfigMock } from '../mock/castConfig.mock';
import type {
    CastConfigAplyHstryListDto,
    CastConfigCategoryListDto,
    CastConfigCategorySaveDto,
    CastConfigDatasetDto,
    CastConfigGroupListDto,
    CastConfigSaveItemDto,
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

    getCategoryList: async (tmnlId: TmnlId): Promise<CastConfigCategoryListDto> => {
        if (USE_MOCK) return mockResponse(castConfigMock.getCategoryList(), { loading: true });

        const response = await apiClient.post<CastConfigCategoryListDto>(API_ENDPOINTS.CAST_CONFIG_CATEGORY_LIST, { tmnlId }, LOADING);
        return response.data;
    },

    saveCategory: async (tmnlId: TmnlId, dto: CastConfigCategorySaveDto): Promise<JsonResponse> => {
        if (USE_MOCK) return mockResponse(castConfigMock.saveCategory(dto), { loading: true });

        const response = await apiClient.post<JsonResponse>(API_ENDPOINTS.CAST_CONFIG_CATEGORY_SAVE, { tmnlId, ...dto }, LOADING);
        return response.data;
    },

    getDataset: async (tmnlId: TmnlId, fixAtrbGroupId: string, groupId: string, sheetNm: string): Promise<CastConfigDatasetDto> => {
        if (USE_MOCK) return mockResponse(castConfigMock.getDataset(tmnlId, fixAtrbGroupId, groupId, sheetNm), { loading: true });

        const response = await apiClient.post<CastConfigDatasetDto>(API_ENDPOINTS.CAST_CONFIG_DATASET, { tmnlId, fixAtrbGroupId, groupId, sheetNm }, LOADING);
        return response.data;
    },

    saveDataset: async (tmnlId: TmnlId, groupId: string, itemList: CastConfigSaveItemDto[]): Promise<JsonResponse> => {
        if (USE_MOCK) return mockResponse(castConfigMock.saveDataset(tmnlId, groupId, itemList), { loading: true });

        const response = await apiClient.post<JsonResponse>(API_ENDPOINTS.CAST_CONFIG_SAVE, { tmnlId, groupId, itemList }, LOADING);
        return response.data;
    },

    applyOperation: async (tmnlId: TmnlId, groupId: string, fixAtrbGroupId: string): Promise<JsonResponse> => {
        if (USE_MOCK) return mockResponse(castConfigMock.applyOperation(tmnlId, groupId, fixAtrbGroupId), { loading: true });

        const response = await apiClient.post<JsonResponse>(API_ENDPOINTS.CAST_CONFIG_OPER_APPLY, { tmnlId, groupId, fixAtrbGroupId }, LOADING);
        return response.data;
    },

    getPreProcessHistory: async (tmnlId: TmnlId, sheetNm: string): Promise<CastConfigAplyHstryListDto> => {
        if (USE_MOCK) return mockResponse(castConfigMock.getPreProcessHistory(tmnlId, sheetNm), { loading: true });

        const response = await apiClient.post<CastConfigAplyHstryListDto>(API_ENDPOINTS.CAST_CONFIG_PRE_PRCS_HSTRY, { tmnlId, sheetNm }, LOADING);
        return response.data;
    },

    revertPreProcess: async (aplySn: number): Promise<JsonResponse> => {
        if (USE_MOCK) return mockResponse(castConfigMock.revertPreProcess(aplySn), { loading: true });

        const response = await apiClient.post<JsonResponse>(API_ENDPOINTS.CAST_CONFIG_PRE_PRCS_REVERT, { aplySn }, LOADING);
        return response.data;
    },
};
