/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />

/**
 * .env / .env.dev / .env.prod 로 주입되는 환경 변수.
 * 값은 항상 문자열이다 (숫자·불리언도 문자열로 들어온다).
 */
interface ImportMetaEnv {
    /** 넥사크로 UI 주소 */
    readonly VITE_NEXACRO_UI: string;
    /** API 응답 대기 한계 (ms) */
    readonly VITE_API_TIMEOUT: string;
    /** 'true' 면 서버를 호출하지 않고 목업 데이터로 화면을 그린다 */
    readonly VITE_ENABLE_MOCK: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
