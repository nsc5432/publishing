import type { UserInfo } from '@/types/api.types';

/** 공통 목업 응답 (VITE_ENABLE_MOCK=true 일 때 사용) */

const USER_INFO: UserInfo = {
    error: false,
    errorMessage: '',
    userId: 'testuser',
    userNm: '홍길동',
    deptNm: 'TEST팀',
};

export const commonMock = {
    getUserInfoBySession: (): UserInfo => USER_INFO,
};
