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

/** 일일 시뮬레이션 결과 조회 - 요약보기(대시보드) */
export const dashboardService = {
    // 조회 조건 기준 정보 (시뮬레이션 ID / 계산 시각 / 선택 가능 시각)
    // smltId 를 주면 그 시뮬레이션을 지목해 받는다 (모니터링에서 넘어온 경우).
    // 없으면 기준일자에 해당하는 일일 시뮬레이션이다.
    getBaseInfo: async (ymd: string, smltId?: string): Promise<DsbdBaseInfoDto> => {
        if (USE_MOCK) return mockResponse(dashboardMock.getBaseInfo(smltId));

        const response = await apiClient.post<DsbdBaseInfoDto>(API_ENDPOINTS.DSBD_BASE_INFO, {
            ymd,
            ...(smltId ? { smltId } : {}),
        });

        return response.data;
    },

    // 상단 카드 (운항계획 / 시간대별 출발여객 / 요일 속성 / 기상정보)
    getHeader: async (ymd: string, hhmm: string): Promise<DsbdHeaderDto> => {
        if (USE_MOCK) return mockResponse(dashboardMock.getHeader(), { loading: true });

        const response = await apiClient.post<DsbdHeaderDto>(
            API_ENDPOINTS.DSBD_HEADER,
            { ymd, hhmm },
            { params: { loading: true } },
        );

        return response.data;
    },

    // 터미널 패널 요약 (운항/여객 증감, 탑승률, 피크시간)
    // itvlMin 은 요약 블록이 세는 구간 길이 — hhmm 부터 이만큼 안에 출발하는 편만 센다
    getTmnlSmry: async (
        smltId: string,
        tmnlId: TmnlId,
        hhmm: string,
        itvlMin: number,
    ): Promise<TmnlSmryDto> => {
        if (USE_MOCK) {
            return mockResponse(dashboardMock.getTmnlSmry(tmnlId, hhmm, itvlMin), { loading: true });
        }

        const response = await apiClient.post<TmnlSmryDto>(
            API_ENDPOINTS.DSBD_TMNL_SMRY,
            { smltId, tmnlId, hhmm, itvlMin },
            { params: { loading: true } },
        );

        return response.data;
    },

    // 시간대별 결과 (터미널 패널의 차트 / 테이블 뷰 공용)
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

    // 게이트 카드 (체크인카운터 / 출국장 캐러셀)
    getFcltCardList: async (
        smltId: string,
        tmnlId: TmnlId,
        hhmm: string,
        fcltType: 'CHKN' | 'DEP',
    ): Promise<DsbdFcltCardDto[]> => {
        if (USE_MOCK) return mockResponse(dashboardMock.getFcltCardList(tmnlId, fcltType));

        const response = await apiClient.post<DsbdFcltCardDto[]>(API_ENDPOINTS.DSBD_FCLT_CARD, {
            smltId,
            tmnlId,
            hhmm,
            fcltType,
        });

        return response.data;
    },
};
