const prefix = '/pm/cast';

export const API_ENDPOINTS = {
    // 사용자 정보
    USER_INFO_BY_SESSION: prefix + '/user/retrieveUserInfoBySession',
    USER_INFO_BY_KEY: prefix + '/user/retrieveUserInfoByKey',

    // 시뮬레이션 요약
    RCNT_DAILY_SMLT_ID: prefix + '/smry/retrieveRcntDailySmltId',
    SUMMARY_INFO: prefix + '/smry/retrieveDailySmltSmry',
    SUMMARY_DEP_CHART: prefix + '/smry/retrieveDailySmltSmryDepChart',

    // 시뮬레이션 맵
    SUMMARY_MAP_INFO: prefix + '/smry/retrieveSmltSmryMap',

    // 시뮬레이션 체크인카운터
    SMLT_CHKN_INFO: prefix + '/chkn/retrieveChknGroupByTime',
    SMLT_CHKN_INFO_USING_DATE: prefix + '/chkn/retrieveChknGroupByTimeUsingDate',
    SMLT_CHKN_XOVIS_INFO: prefix + '/chkn/retrieveChknXovisGroupByTime',

    // 시뮬레이션 셀프체크인/백드롭
    SMLT_SLFCHKN_INFO: prefix + '/slfchkn/retrieveSlfchknGroupByTime',
    SMLT_SLFCHKN_INFO_USING_DATE: prefix + '/slfchkn/retrieveSlfchknGroupByTimeUsingDate',

    // 시뮬레이션 출국장
    SMLT_DEP_INFO: prefix + '/dep/retrieveDepGroupByTime',
    SMLT_DEP_INFO_USING_DATE: prefix + '/dep/retrieveDepGroupByTimeUsingDate',

    // 사용자 시뮬레이션
    USER_CONFIG_FLIGHT: prefix + '/user-config/retrieveFlightList',
    USER_CONFIG_CHKN: prefix + '/user-config/retrieveChknMapGroupByIsland',

    // 시설 관련
    FACILITIES: prefix + '/fclt/retrieveFcltList',
    UPDATE_FACILITY_POSITION: prefix + '/fclt/updatePosition',
    SAVE_FACILITIES_BATCH: '/facilities/batch',
};
