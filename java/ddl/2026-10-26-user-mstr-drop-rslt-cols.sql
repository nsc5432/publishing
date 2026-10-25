SET SERVEROUTPUT ON
WHENEVER SQLERROR EXIT SQL.SQLCODE ROLLBACK

-- TN_PM_SMLT_USER_MSTR 의 RSLT_SMLT_ID · SMLT_RSLT_SFX 제거.
-- RSLT_SMLT_ID 는 결과 수신 시 SMLT_ID 와 같은 값만 받고 읽는 곳이 없다.
-- SMLT_RSLT_SFX 는 SMLT_REQ_ID 와 같은 값이라 CAST 요청 목록이 SMLT_REQ_ID 를 그대로 내보낸다.
DECLARE
    object_count NUMBER;

    FUNCTION has_column(column_name VARCHAR2) RETURN BOOLEAN IS
        column_count NUMBER;
    BEGIN
        SELECT COUNT(*) INTO column_count
        FROM ALL_TAB_COLUMNS
        WHERE OWNER = 'PMOWN' AND TABLE_NAME = 'TN_PM_SMLT_USER_MSTR' AND COLUMN_NAME = column_name;
        RETURN column_count > 0;
    END;
BEGIN
    IF SYS_CONTEXT('USERENV', 'SESSION_USER') != 'PMOWN'
        OR SYS_CONTEXT('USERENV', 'CURRENT_SCHEMA') != 'PMOWN' THEN
        RAISE_APPLICATION_ERROR(-20001, 'PMOWN 계정과 스키마에서 실행해주세요.');
    END IF;

    IF has_column('RSLT_SMLT_ID') THEN
        EXECUTE IMMEDIATE
            'SELECT COUNT(*) FROM PMOWN.TN_PM_SMLT_USER_MSTR'
            || ' WHERE RSLT_SMLT_ID IS NOT NULL AND RSLT_SMLT_ID != SMLT_ID'
            INTO object_count;

        IF object_count != 0 THEN
            RAISE_APPLICATION_ERROR(-20002, 'RSLT_SMLT_ID 가 SMLT_ID 와 다른 행이 ' || object_count || '건 있습니다.');
        END IF;

        EXECUTE IMMEDIATE 'ALTER TABLE PMOWN.TN_PM_SMLT_USER_MSTR DROP COLUMN RSLT_SMLT_ID';
        DBMS_OUTPUT.PUT_LINE('RSLT_SMLT_ID 컬럼을 제거했습니다.');
    ELSE
        DBMS_OUTPUT.PUT_LINE('RSLT_SMLT_ID 컬럼이 없습니다.');
    END IF;

    IF has_column('SMLT_RSLT_SFX') THEN
        -- 다른 값이 남아 있으면 제거 후 CAST 가 받는 simulationResultSuffix 가 바뀐다
        EXECUTE IMMEDIATE
            'SELECT COUNT(*) FROM PMOWN.TN_PM_SMLT_USER_MSTR'
            || ' WHERE SMLT_RSLT_SFX IS NULL OR SMLT_RSLT_SFX != SMLT_REQ_ID'
            INTO object_count;

        IF object_count != 0 THEN
            RAISE_APPLICATION_ERROR(-20003, 'SMLT_RSLT_SFX 가 SMLT_REQ_ID 와 다른 행이 ' || object_count || '건 있습니다.');
        END IF;

        EXECUTE IMMEDIATE 'ALTER TABLE PMOWN.TN_PM_SMLT_USER_MSTR DROP COLUMN SMLT_RSLT_SFX';
        DBMS_OUTPUT.PUT_LINE('SMLT_RSLT_SFX 컬럼을 제거했습니다.');
    ELSE
        DBMS_OUTPUT.PUT_LINE('SMLT_RSLT_SFX 컬럼이 없습니다.');
    END IF;
END;
/
