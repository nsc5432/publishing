import type {
    UserInfo,
} from '@/types/api.types';


// 사용자 정보 Mock Data
export const userInfoData: Record<string, UserInfo> = {
    user001: { userId: '1', userNm: '김철수', deptNm: '운영관리팀', error: false, errorMessage: '' },
    user002: { userId: '2', userNm: '이영희', deptNm: '공항운영팀', error: false, errorMessage: '' },
    user003: { userId: '3', userNm: '박민수', deptNm: '여객서비스팀', error: false, errorMessage: '' },
    'test-key': { userId: '4', userNm: '홍길동', deptNm: '시스템관리팀', error: false, errorMessage: '' },
    default: { userId: '5', userNm: '김철수', deptNm: '운영관리팀', error: false, errorMessage: '' },
};
