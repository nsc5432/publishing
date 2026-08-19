import axios, { AxiosError } from 'axios';
import type { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import type { ApiResponse, ApiError } from '@/types/api.types';
import { ENV } from '@/config/env';
import { loadingBar } from '@/lib/loading-bar';

export const apiClient: AxiosInstance = axios.create({
    baseURL: '/',
    timeout: ENV.API_TIMEOUT,
    headers: {
        'Content-Type': 'application/json',
    },
});

apiClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        if (config.params?.loading) {
            loadingBar.start();
        }

        return config;
    },
    (error: AxiosError) => {
        loadingBar.done();

        console.error('[API Request Error]', error);
        return Promise.reject(error);
    },
);

apiClient.interceptors.response.use(
    (response: AxiosResponse<ApiResponse<unknown>>) => {
        loadingBar.done();
        return response;
    },
    (error: AxiosError<ApiError>) => {
        loadingBar.done();

        const apiError: ApiError = {
            status: error.response?.status || 500,
            message: error.response?.data?.message || error.message || 'Unknown error occurred',
            code: error.code,
        };

        if (error.code === 'ECONNABORTED') {
            apiError.message = 'Request timeout - 서버 응답 시간 초과';
        } else if (error.code === 'ERR_NETWORK') {
            apiError.message = 'Network error - 네트워크 연결을 확인하세요';
        } else if (error.response) {
            switch (error.response.status) {
                case 400:
                    apiError.message = 'Bad Request - 잘못된 요청입니다';
                    break;
                case 404:
                    apiError.message = 'Not Found - 요청한 리소스를 찾을 수 없습니다';
                    break;
                case 500:
                    apiError.message = 'Internal Server Error - 서버 오류가 발생했습니다';
                    break;
                case 503:
                    apiError.message =
                        'Service Unavailable - 서비스를 일시적으로 사용할 수 없습니다';
                    break;
            }
        }

        console.error('[API Error]', apiError);
        return Promise.reject(apiError);
    },
);

export default apiClient;
