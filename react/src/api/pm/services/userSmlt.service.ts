import apiClient from '../client';
import { API_ENDPOINTS } from '../endpoints';
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
} from '@/types/api.types';

/**
 * 사용자 시뮬레이션 - 조건 설정.
 */
export const userSmltService = {
    // 진입 정보 (편집 대상 시뮬레이션 ID / 마지막 저장 시각)
    getInfo: async (ymd: string, tmnlId: TmnlId): Promise<UserSmltInfoDto> => {
        const response = await apiClient.post<UserSmltInfoDto>(
            API_ENDPOINTS.USER_SMLT_INFO,
            { ymd, tmnlId },
            { params: { loading: true } },
        );

        return response.data;
    },

    /* --------- 운항편/여객수 --------- */

    getFltPsgInfo: async (smltId: string, tmnlId: TmnlId): Promise<UserSmltFltPsgDto> => {
        const response = await apiClient.post<UserSmltFltPsgDto>(
            API_ENDPOINTS.USER_SMLT_FLT_PSG,
            { smltId, tmnlId },
            { params: { loading: true } },
        );

        return response.data;
    },

    saveFltPsgInfo: async (request: UserSmltFltPsgSaveReq): Promise<JsonResponse> => {
        const response = await apiClient.post<JsonResponse>(
            API_ENDPOINTS.USER_SMLT_FLT_PSG_SAVE,
            request,
            { params: { loading: true } },
        );

        return response.data;
    },

    /* --------- 체크인 카운터 (셀프체크인/백드롭 포함) --------- */

    getChknCounterInfo: async (smltId: string, tmnlId: TmnlId): Promise<UserSmltChknDto> => {
        const response = await apiClient.post<UserSmltChknDto>(
            API_ENDPOINTS.USER_SMLT_CHKN,
            { smltId, tmnlId },
            { params: { loading: true } },
        );

        return response.data;
    },

    saveChknCounterInfo: async (request: UserSmltChknSaveReq): Promise<JsonResponse> => {
        const response = await apiClient.post<JsonResponse>(
            API_ENDPOINTS.USER_SMLT_CHKN_SAVE,
            request,
            { params: { loading: true } },
        );

        return response.data;
    },

    /* --------- 출국장 (보안 검색대 포함) --------- */

    getDepInfo: async (smltId: string, tmnlId: TmnlId): Promise<UserSmltDepDto> => {
        const response = await apiClient.post<UserSmltDepDto>(
            API_ENDPOINTS.USER_SMLT_DEP,
            { smltId, tmnlId },
            { params: { loading: true } },
        );

        return response.data;
    },

    saveDepInfo: async (request: UserSmltDepSaveReq): Promise<JsonResponse> => {
        const response = await apiClient.post<JsonResponse>(
            API_ENDPOINTS.USER_SMLT_DEP_SAVE,
            request,
            { params: { loading: true } },
        );

        return response.data;
    },

    /* --------- 지도 보기 / 실행 --------- */

    // 요약 바의 지도 보기 (체크인 카운터 / 출국장 탭 공용)
    getFcltMap: async (
        smltId: string,
        tmnlId: TmnlId,
        fcltType: FcltType,
        island?: string,
    ): Promise<UserSmltFcltMapDto> => {
        const response = await apiClient.post<UserSmltFcltMapDto>(
            API_ENDPOINTS.USER_SMLT_FCLT_MAP,
            { smltId, tmnlId, fcltType, island },
            { params: { loading: true } },
        );

        return response.data;
    },

    // 시뮬레이션 실행 (저장된 조건으로 수행을 건다. 비동기로 시작만 한다)
    execute: async (smltId: string, tmnlId: TmnlId): Promise<UserSmltExecDto> => {
        const response = await apiClient.post<UserSmltExecDto>(
            API_ENDPOINTS.USER_SMLT_EXECUTE,
            { smltId, tmnlId },
            { params: { loading: true } },
        );

        return response.data;
    },
};
