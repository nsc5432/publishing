import { ENV } from '@/config/env';
import { loadingBar } from '@/lib/loading-bar';

/**
 * 목업 / 실통신 스위치.
 *
 * 서비스(api/pm/services/*)만 이 값을 본다. 화면·훅은 목업 여부를 모르고,
 * 서비스가 늘 같은 DTO 를 돌려주므로 .env 만 바꾸면 그대로 서버 연동으로 넘어간다.
 *
 *   VITE_ENABLE_MOCK=true  → api/pm/mock 의 목업 데이터
 *   VITE_ENABLE_MOCK=false → 실제 API 호출
 */
export const USE_MOCK = ENV.USE_MOCK;

/** 목업 응답 지연 (ms) — 즉시 반환하면 로딩·비동기 흐름이 화면에서 검증되지 않는다 */
const MOCK_DELAY = 200;

interface MockOptions {
    /** 실제 호출이 params.loading 을 쓰는 경우 로딩바까지 같이 흉내 낸다 */
    loading?: boolean;
}

/**
 * 목업 데이터를 API 응답처럼 돌려준다.
 *
 * 응답 객체는 복제해서 넘긴다. 화면이 받은 값을 고쳐도 목업 원본이 오염되어
 * 다음 호출부터 다른 값이 나오는 일을 막기 위함이다.
 */
export function mockResponse<T>(data: T, options: MockOptions = {}): Promise<T> {
    if (options.loading) loadingBar.start();

    return new Promise<T>((resolve) => {
        setTimeout(() => {
            if (options.loading) loadingBar.done();
            resolve(structuredClone(data));
        }, MOCK_DELAY);
    });
}
