SET SERVEROUTPUT ON
WHENEVER SQLERROR EXIT SQL.SQLCODE

DECLARE
    source_name CONSTANT VARCHAR2(128) := 'TN_PM_SMLT_INPUT_BASE';
    backup_name CONSTANT VARCHAR2(128) := 'TN_PM_SMLT_IBASE_BAK_1016';
    cols CONSTANT VARCHAR2(1000) := 'BASE_ID,VALID_BGN_YMD,VALID_END_YMD,USE_YN,MDL_RSRC_ID,PRPT_SET_RSRC_ID,'
        || 'CKNCT_SRVC_HR_RSRC_ID,CHKN_TYPE_RSRC_ID,FCLTY_OPNG_EMI_RSRC_ID,FCLTY_OPNG_IMMI_RSRC_ID,'
        || 'FCLTY_OPNG_TR_SCRTY_CNTRL_RSRC_ID,RPT_STNG_ATRB_ID';
    n NUMBER;
    source_count NUMBER;
    backup_count NUMBER;
    diff_count NUMBER;
BEGIN
    IF SYS_CONTEXT('USERENV','CURRENT_SCHEMA') != 'PMOWN' THEN
        RAISE_APPLICATION_ERROR(-20001,'PMOWN 스키마에서 실행해주세요.');
    END IF;
    SELECT COUNT(*) INTO n FROM ALL_TABLES WHERE OWNER='PMOWN' AND TABLE_NAME=source_name;
    IF n=0 THEN
        DBMS_OUTPUT.PUT_LINE(source_name || '이(가) 이미 제거됐습니다.');
        RETURN;
    END IF;
    SELECT COUNT(*) INTO n FROM ALL_DEPENDENCIES
    WHERE REFERENCED_OWNER='PMOWN' AND REFERENCED_NAME=source_name;
    IF n!=0 THEN
        RAISE_APPLICATION_ERROR(-20002, source_name || '를 참조하는 DB 객체가 있습니다.');
    END IF;
    SELECT COUNT(*) INTO n
    FROM ALL_CONSTRAINTS C JOIN ALL_CONSTRAINTS P
        ON P.OWNER=C.R_OWNER AND P.CONSTRAINT_NAME=C.R_CONSTRAINT_NAME
    WHERE C.CONSTRAINT_TYPE='R' AND P.OWNER='PMOWN' AND P.TABLE_NAME=source_name;
    IF n!=0 THEN
        RAISE_APPLICATION_ERROR(-20003, source_name || '를 참조하는 외래키가 있습니다.');
    END IF;
    -- 새 백엔드는 CastUserSnapshotServiceImpl 상수를 쓴다. 활성 행이 다르면 제거 후 실행 입력이 바뀐다
    EXECUTE IMMEDIATE q'~SELECT COUNT(*) FROM PMOWN.TN_PM_SMLT_INPUT_BASE B
        WHERE B.USE_YN = 'Y'
        AND (B.MDL_RSRC_ID != 'ICN001'
            OR B.PRPT_SET_RSRC_ID != 'PS001'
            OR B.CKNCT_SRVC_HR_RSRC_ID != 'CheckinCounterServiceTime001'
            OR B.CHKN_TYPE_RSRC_ID != 'CheckinType001'
            OR NVL(B.FCLTY_OPNG_EMI_RSRC_ID,' ') != 'FacilityOpeningTable_Emigration001'
            OR NVL(B.FCLTY_OPNG_IMMI_RSRC_ID,' ') != 'FacilityOpeningTable_Immigration001'
            OR NVL(B.FCLTY_OPNG_TR_SCRTY_CNTRL_RSRC_ID,' ') != 'FacilityOpeningTable_TransferSecurityControl001'
            OR NVL(B.RPT_STNG_ATRB_ID,' ') != 'ReportingProfilesTimeGroups001')~' INTO n;
    IF n!=0 THEN
        RAISE_APPLICATION_ERROR(-20005,'코드 상수와 다른 활성 INPUT_BASE 행이 ' || n || '건 있습니다.');
    END IF;
    SELECT COUNT(*) INTO n FROM ALL_TABLES WHERE OWNER='PMOWN' AND TABLE_NAME=backup_name;
    IF n=0 THEN
        EXECUTE IMMEDIATE 'CREATE TABLE PMOWN.' || backup_name || ' AS SELECT * FROM PMOWN.' || source_name;
    END IF;
    EXECUTE IMMEDIATE 'SELECT COUNT(*) FROM PMOWN.' || source_name INTO source_count;
    EXECUTE IMMEDIATE 'SELECT COUNT(*) FROM PMOWN.' || backup_name INTO backup_count;
    EXECUTE IMMEDIATE 'SELECT COUNT(*) FROM (SELECT ' || cols || ' FROM PMOWN.' || source_name
        || ' MINUS SELECT ' || cols || ' FROM PMOWN.' || backup_name || ')' INTO diff_count;
    IF source_count!=backup_count OR diff_count!=0 THEN
        RAISE_APPLICATION_ERROR(-20004, source_name || ' 백업이 원본과 다릅니다.');
    END IF;
    EXECUTE IMMEDIATE 'SELECT COUNT(*) FROM (SELECT ' || cols || ' FROM PMOWN.' || backup_name
        || ' MINUS SELECT ' || cols || ' FROM PMOWN.' || source_name || ')' INTO diff_count;
    IF diff_count!=0 THEN
        RAISE_APPLICATION_ERROR(-20004, source_name || ' 백업이 원본과 다릅니다.');
    END IF;
    EXECUTE IMMEDIATE 'DROP TABLE PMOWN.' || source_name;
    DBMS_OUTPUT.PUT_LINE(source_name || ' 제거 완료. 백업: ' || backup_name);
END;
/
SELECT TABLE_NAME FROM ALL_TABLES WHERE OWNER='PMOWN' AND TABLE_NAME='TN_PM_SMLT_INPUT_BASE';
