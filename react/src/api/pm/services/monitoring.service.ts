import apiClient from '../client';
import { API_ENDPOINTS } from '../endpoints';
import { monitoringMock } from '../mock/monitoring.mock';
import { USE_MOCK, mockResponse } from '../mock';
import type { SmltExecDetailDto, SmltExecListDto, SmltExecSmryDto } from '@/types/api.types';

export const monitoringService = {
    getExecSmry: async (bgnDt: string, endDt: string): Promise<SmltExecSmryDto> => {
        if (USE_MOCK) return mockResponse(monitoringMock.getExecSmry(bgnDt, endDt), { loading: true });

        const response = await apiClient.post<SmltExecSmryDto>(API_ENDPOINTS.MNTR_EXEC_SMRY, { bgnDt, endDt }, { params: { loading: true } });

        return response.data;
    },

    getExecList: async (bgnDt: string, endDt: string): Promise<SmltExecListDto> => {
        if (USE_MOCK) return mockResponse(monitoringMock.getExecList(bgnDt, endDt), { loading: true });

        const response = await apiClient.post<SmltExecListDto>(API_ENDPOINTS.MNTR_EXEC_LIST, { bgnDt, endDt }, { params: { loading: true } });

        return response.data;
    },

    getExecDetail: async (smltId: string): Promise<SmltExecDetailDto> => {
        if (USE_MOCK) return mockResponse(monitoringMock.getExecDetail(smltId));

        const response = await apiClient.post<SmltExecDetailDto>(API_ENDPOINTS.MNTR_EXEC_DETAIL, {
            smltId,
        });

        return response.data;
    },
};
