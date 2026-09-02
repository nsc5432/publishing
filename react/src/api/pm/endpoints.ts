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

    // 일일 시뮬레이션 결과 조회 - 맵형태보기 (하루치를 한 번에 받는다)
    MAP_INFO: prefix + '/map/retrieveSmltMap',

    // 일일 시뮬레이션 결과 조회 - 출국장 (하루치를 한 번에 받는다)
    DEP_HALL_INFO: prefix + '/dep-hall/retrieveDepHall',

    // 일일 시뮬레이션 결과 조회 - 체크인카운터 (셀프체크인/백드롭 포함, 하루치를 한 번에 받는다)
    CHKN_COUNTER_INFO: prefix + '/chkn-counter/retrieveChknCounter',

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

    // 시설물 매핑
    FCLT_MAP_LIST: prefix + '/fclt/retrieveFcltMapList',
    FCLT_MAP_SAVE: prefix + '/fclt/saveFcltMapList',

    // Cast 설정
    CAST_CONFIG_GROUP_LIST: prefix + '/cast-config/retrieveGroupList',
    CAST_CONFIG_DATASET: prefix + '/cast-config/retrieveDataset',
    CAST_CONFIG_SAVE: prefix + '/cast-config/saveDataset',
    CAST_CONFIG_CATEGORY_LIST: prefix + '/cast-config/retrieveCategoryList',
    CAST_CONFIG_CATEGORY_SAVE: prefix + '/cast-config/saveCategory',
    CAST_CONFIG_DEFAULT_APPLY: prefix + '/cast-config/applyDefaultAttribute',
    CAST_CONFIG_EXCEL_UPLOAD: prefix + '/cast-config/uploadExcel',
    CAST_CONFIG_PRE_PRCS_DIFF: prefix + '/cast-config/retrievePreProcessDiff',
    CAST_CONFIG_PRE_PRCS_APPLY: prefix + '/cast-config/applyPreProcess',
    CAST_CONFIG_PRE_PRCS_HSTRY: prefix + '/cast-config/retrievePreProcessHistory',
    CAST_CONFIG_PRE_PRCS_REVERT: prefix + '/cast-config/revertPreProcess',
};
