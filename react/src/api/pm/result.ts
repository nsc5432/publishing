import type { ApiError, JsonResponse } from '@/types/api.types';

/**
 * 서버는 처리 실패도 HTTP 200 으로 내려보내고 본문의 error 플래그로 알린다.
 * 그대로 두면 화면이 빈 DTO 를 정상 응답으로 알고 그려버리므로,
 * 여기서 통신 실패와 같은 경로(catch)로 흘려보낸다.
 */
export function unwrap<T extends JsonResponse>(dto: T, fallback: string): T {
    if (!dto.error) return dto;

    const error: ApiError = { status: 200, message: dto.errorMessage || fallback };
    throw error;
}
