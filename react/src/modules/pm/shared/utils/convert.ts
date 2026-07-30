import type { CongestionStatus } from "@/types/api.types";

export function terminal(code: string) {
    return code === 'P01' ? 'T1 터미널' : code === 'P02' ? '탑승동' : code === 'P03' ? 'T2 터미널' : 'N/A';
}

export function cgnStatus(code: CongestionStatus) {
    return code === 'FREE' ? '여유' : code === 'NORMAL' ? '일반' : code === 'BUSY' ? '혼잡' : '매우혼잡';
}
