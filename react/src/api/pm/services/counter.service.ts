import apiClient from '../client';
import { API_ENDPOINTS } from '../endpoints';
import type { SmryChknAlnDtoWrapper, XovisDto } from '@/types/api.types';

export const counterService = {
    // 시간별 체크인카운터 정보 조회
    retrieveChknGroupByTime: async (smltId: string, tmnlId: string, island: string): Promise<SmryChknAlnDtoWrapper> => {
        const response = await apiClient.post<SmryChknAlnDtoWrapper>(
            API_ENDPOINTS.SMLT_CHKN_INFO, { smltId, tmnlId, island }, { params: { loading: true } }
        );

        return response.data;
    },

    // ymd 이용한 시간별 체크인카운터 정보 조회
    retrieveChknGroupByTimeUsingDate: async (ymd: string, tmnlId: string, island: string): Promise<SmryChknAlnDtoWrapper> => {
        const response = await apiClient.post<SmryChknAlnDtoWrapper>(
            API_ENDPOINTS.SMLT_CHKN_INFO_USING_DATE, { ymd, tmnlId, island }, { params: { loading: true } }
        );

        return response.data;
    },

    // Xovis 체크인카운터정보 조회
    retrieveChknXovisGroupByTime: async (ymd: string, tmnlId: string, island: string): Promise<XovisDto[]> => {
        const response = await apiClient.post<XovisDto[]>(
            API_ENDPOINTS.SMLT_CHKN_XOVIS_INFO, { ymd, tmnlId, island }, { params: { loading: true } }
        );

        return response.data;
    },
};
