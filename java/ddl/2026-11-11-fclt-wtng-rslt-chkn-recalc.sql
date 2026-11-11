SET SERVEROUTPUT ON
WHENEVER SQLERROR EXIT SQL.SQLCODE ROLLBACK

-- 체크인 공용 Queue 처리용량을 배정 부스에서 CAST 활성 부스로 바꿨다 (2026-11-11).
-- 이전 코드로 저장한 CHKN 10분 결과는 배정 부스 기준이라 지운다. 지운 실행은 조회 때 Java 보완 계산으로 새 기준을 쓴다.
-- 새 코드 배포 후 실행한다. 배포 전에 지우면 그 사이 수신한 결과가 이전 기준으로 다시 저장된다.
DECLARE
    deleted_count NUMBER;
BEGIN
    IF SYS_CONTEXT('USERENV', 'SESSION_USER') != 'PMOWN'
        OR SYS_CONTEXT('USERENV', 'CURRENT_SCHEMA') != 'PMOWN' THEN
        RAISE_APPLICATION_ERROR(-20001, 'PMOWN 계정과 스키마에서 실행해주세요.');
    END IF;

    DELETE FROM PMOWN.TN_PM_SMLT_FCLT_WTNG_RSLT
    WHERE FCLT_TYPE_CD = 'CHKN'
        AND FRST_REG_DT < TO_TIMESTAMP('&deploy_dt', 'YYYYMMDDHH24MISS');

    deleted_count := SQL%ROWCOUNT;
    DBMS_OUTPUT.PUT_LINE('CHKN 10분 결과 삭제: ' || deleted_count || '건');
END;
/

COMMIT;
