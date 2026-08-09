const prefix = '/pm/cast';

/**
 * PM 예측관리 API 엔드포인트.
 */
export const API_ENDPOINTS = {
    // 공통 - 사용자 정보
    USER_INFO_BY_SESSION: prefix + '/user/retrieveUserInfoBySession',

    // 일일 시뮬레이션 결과 조회 - 요약보기(대시보드)
    DSBD_BASE_INFO: prefix + '/smry/retrieveDailySmltBaseInfo',
    DSBD_HEADER: prefix + '/smry/retrieveDailySmltHeader',
    DSBD_TMNL_SMRY: prefix + '/smry/retrieveDailySmltTmnlSmry',
    DSBD_TMNL_RSLT: prefix + '/smry/retrieveDailySmltTmnlRsltByTime',
    DSBD_FCLT_CARD: prefix + '/smry/retrieveDailySmltFcltCard',

    // 일일 시뮬레이션 결과 조회 - 맵형태보기
    MAP_INFO: prefix + '/map/retrieveSmltMap',
    MAP_CHKN_DETAIL: prefix + '/map/retrieveSmltMapChknDetail',
    MAP_DEP_DETAIL: prefix + '/map/retrieveSmltMapDepDetail',

    // 일일 시뮬레이션 결과 조회 - 출국장
    DEP_HALL_INFO: prefix + '/dep-hall/retrieveDepHall',
    DEP_HALL_TREND: prefix + '/dep-hall/retrieveDepHallTrend',

    // 사용자 시뮬레이션 - 조건 설정
    USER_SMLT_INFO: prefix + '/user-smlt/retrieveUserSmltInfo',
    USER_SMLT_FLT_PSG: prefix + '/user-smlt/retrieveFltPsgInfo',
    USER_SMLT_FLT_PSG_SAVE: prefix + '/user-smlt/saveFltPsgInfo',
    USER_SMLT_CHKN: prefix + '/user-smlt/retrieveChknCounterInfo',
    USER_SMLT_CHKN_SAVE: prefix + '/user-smlt/saveChknCounterInfo',
    USER_SMLT_DEP: prefix + '/user-smlt/retrieveDepInfo',
    USER_SMLT_DEP_SAVE: prefix + '/user-smlt/saveDepInfo',
    USER_SMLT_FCLT_MAP: prefix + '/user-smlt/retrieveFcltMap',
    USER_SMLT_EXECUTE: prefix + '/user-smlt/executeUserSmlt',

    // 시뮬레이션 모니터링
    MNTR_EXEC_SMRY: prefix + '/mntr/retrieveSmltExecSmry',
    MNTR_EXEC_LIST: prefix + '/mntr/retrieveSmltExecList',
    MNTR_EXEC_DETAIL: prefix + '/mntr/retrieveSmltExecDetail',
};
