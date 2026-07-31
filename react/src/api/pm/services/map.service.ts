import apiClient from '../client';
import { API_ENDPOINTS } from '../endpoints';
import type { MapChknDetailDto, MapDepDetailDto, SmltMapDto, TmnlId } from '@/types/api.types';

/** 일일 시뮬레이션 결과 조회 - 맵형태보기 */
export const mapService = {
    // 도면 본문 (혼잡 알림 / 운영시간 카드 / 마커) — 타임라인 시각 기준
    getSmltMap: async (smltId: string, tmnlId: TmnlId, hhmm: string): Promise<SmltMapDto> => {
        const response = await apiClient.post<SmltMapDto>(
            API_ENDPOINTS.MAP_INFO,
            { smltId, tmnlId, hhmm },
            { params: { loading: true } },
        );

        return response.data;
    },

    // 아일랜드 마커 클릭 — 상세 팝업 (시설 목록 / 혼잡 지표 / 매출)
    getChknDetail: async (
        smltId: string,
        tmnlId: TmnlId,
        island: string,
        hhmm: string,
    ): Promise<MapChknDetailDto> => {
        const response = await apiClient.post<MapChknDetailDto>(API_ENDPOINTS.MAP_CHKN_DETAIL, {
            smltId,
            tmnlId,
            island,
            hhmm,
        });

        return response.data;
    },

    // 출국장 마커 클릭 — 미니 팝업 (혼잡 지표)
    getDepDetail: async (
        smltId: string,
        tmnlId: TmnlId,
        depNum: string,
        hhmm: string,
    ): Promise<MapDepDetailDto> => {
        const response = await apiClient.post<MapDepDetailDto>(API_ENDPOINTS.MAP_DEP_DETAIL, {
            smltId,
            tmnlId,
            depNum,
            hhmm,
        });

        return response.data;
    },
};
