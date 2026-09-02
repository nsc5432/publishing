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
    CastConfigPreProcessDiffDto,
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

    applyDefault: async (tmnlId: TmnlId, groupId: string, fixAtrbGroupId: string, sheetNm: string, rowNoList: number[]): Promise<JsonResponse> => {
        if (USE_MOCK) return mockResponse(castConfigMock.applyDefault(tmnlId, groupId, fixAtrbGroupId, sheetNm, rowNoList), { loading: true });

        const response = await apiClient.post<JsonResponse>(
            API_ENDPOINTS.CAST_CONFIG_DEFAULT_APPLY,
            { tmnlId, groupId, fixAtrbGroupId, sheetNm, rowNoList },
            LOADING,
        );
        return response.data;
    },

    getPreProcessDiff: async (tmnlId: TmnlId, groupId: string, sheetNm: string): Promise<CastConfigPreProcessDiffDto> => {
        if (USE_MOCK) return mockResponse(castConfigMock.getPreProcessDiff(tmnlId, groupId, sheetNm), { loading: true });

        const response = await apiClient.post<CastConfigPreProcessDiffDto>(API_ENDPOINTS.CAST_CONFIG_PRE_PRCS_DIFF, { tmnlId, groupId, sheetNm }, LOADING);
        return response.data;
    },

    applyPreProcess: async (tmnlId: TmnlId, groupId: string, sheetNm: string, rowNoList: number[]): Promise<JsonResponse> => {
        if (USE_MOCK) return mockResponse(castConfigMock.applyPreProcess(tmnlId, groupId, sheetNm, rowNoList), { loading: true });

        const response = await apiClient.post<JsonResponse>(API_ENDPOINTS.CAST_CONFIG_PRE_PRCS_APPLY, { tmnlId, groupId, sheetNm, rowNoList }, LOADING);
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

    uploadExcel: async (tmnlId: TmnlId, groupId: string, fixAtrbGroupId: string, sheetNm: string, file: File): Promise<JsonResponse> => {
        if (USE_MOCK) return mockResponse(castConfigMock.uploadExcel(tmnlId, groupId, sheetNm), { loading: true });

        const form = new FormData();
        form.append('tmnlId', tmnlId);
        form.append('groupId', groupId);
        form.append('fixAtrbGroupId', fixAtrbGroupId);
        form.append('sheetNm', sheetNm);
        form.append('file', file);

        // 인스턴스 기본 Content-Type 이 application/json 이라 FormData 로는 직접 덮어야 한다.
        const response = await apiClient.post<JsonResponse>(API_ENDPOINTS.CAST_CONFIG_EXCEL_UPLOAD, form, {
            ...LOADING,
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },
};
