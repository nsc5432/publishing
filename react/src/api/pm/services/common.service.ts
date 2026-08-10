import apiClient from '../client';
import { API_ENDPOINTS } from '../endpoints';
import { commonMock } from '../mock/common.mock';
import { USE_MOCK, mockResponse } from '../mock';
import type { UserInfo } from '@/types/api.types';

export const commonService = {
    // Session 정보를 통해 사용자 정보 조회 (LNB 부서/성명 표기)
    getUserInfoBySession: async (): Promise<UserInfo> => {
        if (USE_MOCK) return mockResponse(commonMock.getUserInfoBySession());

        const response = await apiClient.post<UserInfo>(API_ENDPOINTS.USER_INFO_BY_SESSION);

        return response.data;
    },
};
