import apiClient from '../client';
import { API_ENDPOINTS } from '../endpoints';
import type { FcltType } from '@/types/api.types';

export const facilityService = {
    // 모든 시설 조회
    getFcltList: async (tmnlId: string): Promise<FcltType[]> => {
        const response = await apiClient.post<FcltType[]>(
            API_ENDPOINTS.FACILITIES, { tmnlId }
        );

        return response.data;
    },

    // 시설물 위치 업데이트
    updatePosition: async (
        fcltySn: string,
        cdntLat?: number,
        cdntLng?: number,
    ): Promise<void> => {
        await apiClient.post(
            API_ENDPOINTS.UPDATE_FACILITY_POSITION,
            { fcltySn, cdntLat, cdntLng },
        );
    },

    // 시설물 일괄 저장
    saveBatch: async (
        facilities: Array<{
            id: string;
            latitude: number;
            longitude: number;
            posCoord: string | null;
        }>,
    ): Promise<void> => {
        await apiClient.post(API_ENDPOINTS.SAVE_FACILITIES_BATCH, { facilities });
    },
};
