import apiClient from '../client';
import { API_ENDPOINTS } from '../endpoints';
import type {
    FcltType,
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
    UserSmltScDto,
    UserSmltScSaveReq,
    UserSmltSlfchknDto,
    UserSmltSlfchknSaveReq,
} from '@/types/api.types';

/**
 * 사용자 시뮬레이션 - 조건 설정.
 *
 * 탭 5개가 같은 smltId 를 공유하고, 터미널(T1/T2) 단위로 조회/저장한다.
 * 저장은 화면의 "현재상태 저장", 실행은 GNB 의 "시뮬레이션 실행" 버튼과 1:1 이다.
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

    saveFltPsgInfo: async (request: UserSmltFltPsgSaveReq): Promise<void> => {
        await apiClient.post(API_ENDPOINTS.USER_SMLT_FLT_PSG_SAVE, request, {
            params: { loading: true },
        });
    },

    /* --------- 체크인 카운터 --------- */

    getChknCounterInfo: async (
        smltId: string,
        tmnlId: TmnlId,
        island: string,
    ): Promise<UserSmltChknDto> => {
        const response = await apiClient.post<UserSmltChknDto>(
            API_ENDPOINTS.USER_SMLT_CHKN,
            { smltId, tmnlId, island },
            { params: { loading: true } },
        );

        return response.data;
    },

    saveChknCounterInfo: async (request: UserSmltChknSaveReq): Promise<void> => {
        await apiClient.post(API_ENDPOINTS.USER_SMLT_CHKN_SAVE, request, {
            params: { loading: true },
        });
    },

    /* --------- 셀프체크인/백드롭 --------- */

    getSlfchknInfo: async (
        smltId: string,
        tmnlId: TmnlId,
        island: string,
    ): Promise<UserSmltSlfchknDto> => {
        const response = await apiClient.post<UserSmltSlfchknDto>(
            API_ENDPOINTS.USER_SMLT_SLFCHKN,
            { smltId, tmnlId, island },
            { params: { loading: true } },
        );

        return response.data;
    },

    saveSlfchknInfo: async (request: UserSmltSlfchknSaveReq): Promise<void> => {
        await apiClient.post(API_ENDPOINTS.USER_SMLT_SLFCHKN_SAVE, request, {
            params: { loading: true },
        });
    },

    /* --------- 출국장 --------- */

    getDepInfo: async (smltId: string, tmnlId: TmnlId): Promise<UserSmltDepDto> => {
        const response = await apiClient.post<UserSmltDepDto>(
            API_ENDPOINTS.USER_SMLT_DEP,
            { smltId, tmnlId },
            { params: { loading: true } },
        );

        return response.data;
    },

    saveDepInfo: async (request: UserSmltDepSaveReq): Promise<void> => {
        await apiClient.post(API_ENDPOINTS.USER_SMLT_DEP_SAVE, request, {
            params: { loading: true },
        });
    },

    /* --------- 보안 검색대 --------- */

    getScPlanInfo: async (smltId: string, tmnlId: TmnlId): Promise<UserSmltScDto> => {
        const response = await apiClient.post<UserSmltScDto>(
            API_ENDPOINTS.USER_SMLT_SC,
            { smltId, tmnlId },
            { params: { loading: true } },
        );

        return response.data;
    },

    saveScPlanInfo: async (request: UserSmltScSaveReq): Promise<void> => {
        await apiClient.post(API_ENDPOINTS.USER_SMLT_SC_SAVE, request, {
            params: { loading: true },
        });
    },

    /* --------- 지도 보기 / 실행 --------- */

    // 요약 바의 지도 보기 (체크인 카운터 / 셀프체크인·백드롭 / 출국장 탭 공용)
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

    // 시뮬레이션 실행 (저장된 조건으로 수행을 건다)
    execute: async (smltId: string, tmnlId: TmnlId): Promise<UserSmltExecDto> => {
        const response = await apiClient.post<UserSmltExecDto>(
            API_ENDPOINTS.USER_SMLT_EXECUTE,
            { smltId, tmnlId },
            { params: { loading: true } },
        );

        return response.data;
    },
};
