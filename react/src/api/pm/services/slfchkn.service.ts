import apiClient from '../client';
import { API_ENDPOINTS } from '../endpoints';
import type { SmrySlfchknDtoWrapper } from '@/types/api.types';

export const SlfchknService = {
    // 시간별 셀프체크인 정보 조회
    retrieveSlfchknGroupByTime: async (smltId: string, tmnlId: string): Promise<SmrySlfchknDtoWrapper> => {
        const response = await apiClient.post<SmrySlfchknDtoWrapper>(
            API_ENDPOINTS.SMLT_SLFCHKN_INFO, { smltId, tmnlId }, { params: { loading: true } }
        );

        return response.data;
    },

    // ymd 이용한 시간별 셀프체크인 정보 조회
    retrieveSlfchknGroupByTimeUsingDate: async (ymd: string, tmnlId: string): Promise<SmrySlfchknDtoWrapper> => {
        const response = await apiClient.post<SmrySlfchknDtoWrapper>(
            API_ENDPOINTS.SMLT_SLFCHKN_INFO_USING_DATE, { ymd, tmnlId }, { params: { loading: true } }
        );

        return response.data;
    },
};
