/**
 * 실행 환경 설정.
 *
 * import.meta.env 를 직접 읽는 곳은 이 파일 하나로 모은다.
 * (값이 문자열이라 곳곳에서 === 'true' / Number() 를 반복하면 오타 하나로 조용히 어긋난다)
 */
export const ENV = {
    /** true 면 API 를 호출하지 않고 목업 데이터로 화면을 그린다 (VITE_ENABLE_MOCK) */
    USE_MOCK: import.meta.env.VITE_ENABLE_MOCK?.trim() === 'true',

    /** API 응답 대기 한계 (ms) */
    API_TIMEOUT: Number(import.meta.env.VITE_API_TIMEOUT) || 60000,

    /** 넥사크로 UI 주소 */
    NEXACRO_UI: import.meta.env.VITE_NEXACRO_UI ?? '',
} as const;
