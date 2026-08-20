import type { ApiError, JsonResponse } from '@/types/api.types';

export function unwrap<T extends JsonResponse>(dto: T, fallback: string): T {
    if (!dto.error) return dto;

    const error: ApiError = { status: 200, message: dto.errorMessage || fallback };
    throw error;
}
