import apiClient from '../client';
import { API_ENDPOINTS } from '../endpoints';
import type { SmryDepDtoWrapper } from '@/types/api.types';

export const DepService = {
    // 시간별 출국장 정보 조회
    retrieveDepGroupByTime: async (smltId: string, tmnlId: string): Promise<SmryDepDtoWrapper> => {
        const response = await apiClient.post<SmryDepDtoWrapper>(
            API_ENDPOINTS.SMLT_DEP_INFO, { smltId, tmnlId }, { params: { loading: true } }
        );

        return response.data;
    },

    // ymd 이용한 시간별 출국장 정보 조회
    retrieveDepGroupByTimeUsingDate: async (ymd: string, tmnlId: string): Promise<SmryDepDtoWrapper> => {
        const response = await apiClient.post<SmryDepDtoWrapper>(
            API_ENDPOINTS.SMLT_DEP_INFO_USING_DATE, { ymd, tmnlId }, { params: { loading: true } }
        );

        return response.data;
    },
};
