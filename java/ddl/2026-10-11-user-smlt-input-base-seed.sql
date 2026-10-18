SET SERVEROUTPUT ON
WHENEVER SQLERROR EXIT SQL.SQLCODE
-- 이관 6단계. 원천 ID 는 일일 Auto 조합과 같게 둔다(사용자 결과를 일일 결과와 KPI 비교하므로).
-- :mdlRsrcId 는 일일 STNG 의 MDL_RSRC_ID(= TN_PM_SMLT_MDL.SMLT_MDL_EXPLN), :rptStngAtrbId 는 모델 파일/CAST 설정에서
-- 확인한 ReportingProfilesTimeGroups 리소스 ID 다. 나머지 값도 아래 확인 쿼리로 실 DB 와 대조한 뒤 실행한다.
-- 유효 시작일을 cutover 일자로 두면 그 이전 날짜의 사용자 실행이 실패하므로 19000101 로 둔다.

SELECT S.SMLT_ID, S.MDL_RSRC_ID, S.PRPT_SET_RSRC_ID, S.CKNCT_SRVC_HR_RSRC_ID, S.CHKN_TYPE_RSRC_ID,
       S.FCLTY_OPNG_EMI_RSRC_ID, S.FCLTY_OPNG_IMMI_RSRC_ID, S.FCLTY_OPNG_TR_SCRTY_CNTRL_RSRC_ID
FROM PMOWN.TN_PM_SMLT_STNG S
WHERE S.SMLT_ID = (SELECT MAX(SMLT_ID) FROM PMOWN.TN_PM_SMLT_STNG WHERE SMLT_TYPE = 'Auto');

INSERT INTO PMOWN.TN_PM_SMLT_INPUT_BASE (
    BASE_ID, VALID_BGN_YMD, VALID_END_YMD, USE_YN,
    MDL_RSRC_ID, PRPT_SET_RSRC_ID, CKNCT_SRVC_HR_RSRC_ID, CHKN_TYPE_RSRC_ID,
    FCLTY_OPNG_EMI_RSRC_ID, FCLTY_OPNG_IMMI_RSRC_ID,
    FCLTY_OPNG_TR_SCRTY_CNTRL_RSRC_ID, RPT_STNG_ATRB_ID
) VALUES (
    'BASE_19000101', '19000101', '99991231', 'Y',
    :mdlRsrcId, 'PS001', 'CheckinCounterServiceTime001', 'CheckinType001',
    'FacilityOpeningTable_Emigration001', 'FacilityOpeningTable_Immigration001',
    'FacilityOpeningTable_TransferSecurityControl001', :rptStngAtrbId
);
COMMIT;

-- 변경 예 (2027-03-01 부터 새 모델). 같은 날짜에 활성 행이 둘이면 조회가 실패하므로 한 트랜잭션에서 닫고 넣는다.
-- UPDATE PMOWN.TN_PM_SMLT_INPUT_BASE SET VALID_END_YMD = '20270228' WHERE BASE_ID = 'BASE_19000101';
-- INSERT INTO PMOWN.TN_PM_SMLT_INPUT_BASE (...) VALUES ('BASE_20270301', '20270301', '99991231', 'Y', ...);
-- COMMIT;
