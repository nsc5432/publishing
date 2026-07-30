import apiClient from '../client';
import { API_ENDPOINTS } from '../endpoints';
import type { UserInfo, ApiResponse } from '@/types/api.types';

export const userService = {
    // Session 정보를 통해 사용자 정보 조회
    getBySession: async (): Promise<UserInfo> => {
        const response = await apiClient.post<UserInfo>(
            API_ENDPOINTS.USER_INFO_BY_SESSION
        );

        return response.data;
    },

    // key로 사용자 정보 조회
    getByKey: async (key: string): Promise<UserInfo> => {
        const response = await apiClient.post<ApiResponse<UserInfo>>(
            API_ENDPOINTS.USER_INFO_BY_KEY, { userId: key }
        );
        return response.data.data;
    },
};
