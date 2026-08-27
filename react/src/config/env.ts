export const ENV = {
    USE_MOCK: import.meta.env.VITE_ENABLE_MOCK?.trim() === 'true',

    API_TIMEOUT: Number(import.meta.env.VITE_API_TIMEOUT) || 60000,

    NEXACRO_UI: import.meta.env.VITE_NEXACRO_UI ?? '',
} as const;
