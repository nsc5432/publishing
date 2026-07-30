import apiClient from '../client';
import { API_ENDPOINTS } from '../endpoints';
import type { CongestionType, SmltSmry, SummaryMapDtoWrapper, SummaryRsltDto } from '@/types/api.types';

export const summaryService = {
    // 최근 시뮬레이션 ID 조회
    getRcntDailySmltId: async (ymd: string): Promise<string> => {
        const response = await apiClient.post<string>(
            API_ENDPOINTS.RCNT_DAILY_SMLT_ID, { ymd }
        );

        return response.data;
    },

    // Cast 시뮬레이션 결과 데이터 조회
    getSmryInfo: async (simulationKey: string, congestionType: CongestionType): Promise<SmltSmry> => {
        const response = await apiClient.post<SmltSmry>(
            API_ENDPOINTS.SUMMARY_INFO, { smltId: simulationKey, congestionType }, { params: { loading: true } }
        );

        return response.data;
    },
    // Cast 시뮬레이션 출국장 결과 데이터 조회
    getSmryDepChart: async (simulationKey: string, tmnlId: string, psgFcltCdPrefix: string): Promise<SummaryRsltDto[]> => {
        const response = await apiClient.post<SummaryRsltDto[]>(
            API_ENDPOINTS.SUMMARY_DEP_CHART, { smltId: simulationKey, tmnlId, psgFcltCdPrefix }
        );

        return response.data;
    },

    // 맵형태보기
    getSmryMapInfo: async (simulationKey: string, tmnlId: string): Promise<SummaryMapDtoWrapper> => {
        const response = await apiClient.post<SummaryMapDtoWrapper>(
            API_ENDPOINTS.SUMMARY_MAP_INFO, { smltId: simulationKey, tmnlId }, { params: { loading: true } }
        );

        return response.data;
    },
};
