import apiClient from '../client';
import { API_ENDPOINTS } from '../endpoints';
import { userSmltMock } from '../mock/userSmlt.mock';
import { USE_MOCK, mockResponse } from '../mock';
import type {
    FcltType,
    JsonResponse,
    TmnlId,
    UserSmltChknDto,
    UserSmltChknSaveReq,
    UserSmltDepDto,
    UserSmltDepSaveReq,
    UserSmltExecDto,
    UserSmltFcltMapDto,
    UserSmltFltPsgDto,
    UserSmltFltPsgSaveReq,
    UserSmltInfoDto,
    UserSmltQuery,
    UserSmltExecReq,
} from '@/types/api.types';

export const userSmltService = {
    getInfo: async (ymd: string, tmnlId: TmnlId): Promise<UserSmltInfoDto> => {
        if (USE_MOCK) return mockResponse(userSmltMock.getInfo(ymd, tmnlId), { loading: true });

        const response = await apiClient.post<UserSmltInfoDto>(API_ENDPOINTS.USER_SMLT_INFO, { ymd, tmnlId }, { params: { loading: true } });

        return response.data;
    },

    /* --------- 운항편/여객수 --------- */

    getFltPsgInfo: async (query: UserSmltQuery, tmnlId: TmnlId): Promise<UserSmltFltPsgDto> => {
        if (USE_MOCK) return mockResponse(userSmltMock.getFltPsgInfo(query, tmnlId), { loading: true });

        const response = await apiClient.post<UserSmltFltPsgDto>(API_ENDPOINTS.USER_SMLT_FLT_PSG, { ...query, tmnlId }, { params: { loading: true } });

        return response.data;
    },

    saveFltPsgInfo: async (request: UserSmltFltPsgSaveReq): Promise<JsonResponse> => {
        if (USE_MOCK) return mockResponse(userSmltMock.saveFltPsgInfo(request), { loading: true });

        const response = await apiClient.post<JsonResponse>(API_ENDPOINTS.USER_SMLT_FLT_PSG_SAVE, request, { params: { loading: true } });

        return response.data;
    },

    /* --------- 체크인 카운터 (셀프체크인/백드롭 포함) --------- */

    getChknCounterInfo: async (query: UserSmltQuery, tmnlId: TmnlId): Promise<UserSmltChknDto> => {
        if (USE_MOCK) return mockResponse(userSmltMock.getChknCounterInfo(query, tmnlId), { loading: true });

        const response = await apiClient.post<UserSmltChknDto>(API_ENDPOINTS.USER_SMLT_CHKN, { ...query, tmnlId }, { params: { loading: true } });

        return response.data;
    },

    saveChknCounterInfo: async (request: UserSmltChknSaveReq): Promise<JsonResponse> => {
        if (USE_MOCK) return mockResponse(userSmltMock.saveChknCounterInfo(request), { loading: true });

        const response = await apiClient.post<JsonResponse>(API_ENDPOINTS.USER_SMLT_CHKN_SAVE, request, { params: { loading: true } });

        return response.data;
    },

    /* --------- 출국장 (보안 검색대 포함) --------- */

    getDepInfo: async (query: UserSmltQuery, tmnlId: TmnlId): Promise<UserSmltDepDto> => {
        if (USE_MOCK) return mockResponse(userSmltMock.getDepInfo(query, tmnlId), { loading: true });

        const response = await apiClient.post<UserSmltDepDto>(API_ENDPOINTS.USER_SMLT_DEP, { ...query, tmnlId }, { params: { loading: true } });

        return response.data;
    },

    saveDepInfo: async (request: UserSmltDepSaveReq): Promise<JsonResponse> => {
        if (USE_MOCK) return mockResponse(userSmltMock.saveDepInfo(request), { loading: true });

        const response = await apiClient.post<JsonResponse>(API_ENDPOINTS.USER_SMLT_DEP_SAVE, request, { params: { loading: true } });

        return response.data;
    },

    /* --------- 지도 보기 / 실행 --------- */

    getFcltMap: async (query: UserSmltQuery, tmnlId: TmnlId, fcltType: FcltType, island?: string): Promise<UserSmltFcltMapDto> => {
        if (USE_MOCK) {
            return mockResponse(userSmltMock.getFcltMap(tmnlId, fcltType, island), {
                loading: true,
            });
        }

        const response = await apiClient.post<UserSmltFcltMapDto>(
            API_ENDPOINTS.USER_SMLT_FCLT_MAP,
            { ...query, tmnlId, fcltType, island },
            { params: { loading: true } },
        );

        return response.data;
    },

    execute: async (request: UserSmltExecReq): Promise<UserSmltExecDto> => {
        if (USE_MOCK) return mockResponse(userSmltMock.execute(request), { loading: true });

        const response = await apiClient.post<UserSmltExecDto>(API_ENDPOINTS.USER_SMLT_EXECUTE, request, { params: { loading: true } });

        return response.data;
    },
};
