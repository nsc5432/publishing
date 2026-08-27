import apiClient from '../client';
import { API_ENDPOINTS } from '../endpoints';
import { dashboardMock } from '../mock/dashboard.mock';
import { USE_MOCK, mockResponse } from '../mock';
import type {
    DsbdBaseInfoDto,
    DsbdCategory,
    DsbdFcltCardDto,
    DsbdHeaderDto,
    DsbdRsltDto,
    TmnlId,
    TmnlSmryDto,
} from '@/types/api.types';

export const dashboardService = {
    getBaseInfo: async (ymd: string, smltId?: string): Promise<DsbdBaseInfoDto> => {
        if (USE_MOCK) return mockResponse(dashboardMock.getBaseInfo(smltId));

        const response = await apiClient.post<DsbdBaseInfoDto>(API_ENDPOINTS.DSBD_BASE_INFO, {
            ymd,
            ...(smltId ? { smltId } : {}),
        });

        return response.data;
    },

    getHeader: async (ymd: string, hhmm: string): Promise<DsbdHeaderDto> => {
        if (USE_MOCK) return mockResponse(dashboardMock.getHeader(), { loading: true });

        const response = await apiClient.post<DsbdHeaderDto>(
            API_ENDPOINTS.DSBD_HEADER,
            { ymd, hhmm },
            { params: { loading: true } },
        );

        return response.data;
    },

    // itvlMin 은 요약 블록이 세는 구간 길이 — hhmm 부터 이만큼 안에 출발하는 편만 센다
    getTmnlSmry: async (
        smltId: string,
        tmnlId: TmnlId,
        hhmm: string,
        itvlMin: number,
    ): Promise<TmnlSmryDto> => {
        if (USE_MOCK) {
            return mockResponse(dashboardMock.getTmnlSmry(tmnlId, hhmm, itvlMin), {
                loading: true,
            });
        }

        const response = await apiClient.post<TmnlSmryDto>(
            API_ENDPOINTS.DSBD_TMNL_SMRY,
            { smltId, tmnlId, hhmm, itvlMin },
            { params: { loading: true } },
        );

        return response.data;
    },

    getTmnlRsltByTime: async (
        smltId: string,
        tmnlId: TmnlId,
        category: DsbdCategory,
    ): Promise<DsbdRsltDto[]> => {
        if (USE_MOCK) return mockResponse(dashboardMock.getTmnlRsltByTime(tmnlId, category));

        const response = await apiClient.post<DsbdRsltDto[]>(API_ENDPOINTS.DSBD_TMNL_RSLT, {
            smltId,
            tmnlId,
            category,
        });

        return response.data;
    },

    getFcltCardList: async (
        smltId: string,
        tmnlId: TmnlId,
        hhmm: string,
        fcltType: 'CHKN' | 'DEP',
    ): Promise<DsbdFcltCardDto[]> => {
        if (USE_MOCK) return mockResponse(dashboardMock.getFcltCardList(tmnlId, hhmm, fcltType));

        const response = await apiClient.post<DsbdFcltCardDto[]>(API_ENDPOINTS.DSBD_FCLT_CARD, {
            smltId,
            tmnlId,
            hhmm,
            fcltType,
        });

        return response.data;
    },
};
