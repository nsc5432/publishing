import type { UserInfo } from '@/types/api.types';

/** 공통 목업 응답 (VITE_ENABLE_MOCK=true 일 때 사용) */

/** 롤별 화면을 확인하려면 이 값을 바꾼다 (PMR0001 ~ PMR0006) */
export const MOCK_ROLE_ID_LIST = ['PMR0006'];

const USER_INFO: UserInfo = {
    error: false,
    errorMessage: '',
    userId: 'testuser',
    userNm: '홍길동',
    deptNm: 'TEST팀',
    roleIdList: MOCK_ROLE_ID_LIST,
};

export const commonMock = {
    getUserInfoBySession: (): UserInfo => USER_INFO,
};
