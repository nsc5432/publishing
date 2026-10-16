SET SERVEROUTPUT ON
WHENEVER SQLERROR EXIT SQL.SQLCODE

DECLARE
    TYPE name_list IS TABLE OF VARCHAR2(128);
    sources name_list := name_list('TN_PM_SMLT_RESULT_GROUP', 'TN_PM_SMLT_CAST_CONTRACT');
    backups name_list := name_list('TN_PM_SMLT_RGRP_BAK_1016', 'TN_PM_SMLT_CNTR_BAK_1016');
    cols name_list := name_list('GROUP_KEY,SMLT_ID', 'CONTRACT_ID,VERIFIED_YN,EVIDENCE');
    n NUMBER;
    source_count NUMBER;
    backup_count NUMBER;
    diff_count NUMBER;
BEGIN
    IF SYS_CONTEXT('USERENV','CURRENT_SCHEMA') != 'PMOWN' THEN
        RAISE_APPLICATION_ERROR(-20001,'PMOWN 스키마에서 실행해주세요.');
    END IF;
    FOR i IN 1 .. sources.COUNT LOOP
        SELECT COUNT(*) INTO n FROM ALL_TABLES WHERE OWNER='PMOWN' AND TABLE_NAME=sources(i);
        IF n!=0 THEN
            SELECT COUNT(*) INTO n FROM ALL_DEPENDENCIES
            WHERE REFERENCED_OWNER='PMOWN' AND REFERENCED_NAME=sources(i);
            IF n!=0 THEN
                RAISE_APPLICATION_ERROR(-20002, sources(i) || '를 참조하는 DB 객체가 있습니다.');
            END IF;
            SELECT COUNT(*) INTO n
            FROM ALL_CONSTRAINTS C JOIN ALL_CONSTRAINTS P
                ON P.OWNER=C.R_OWNER AND P.CONSTRAINT_NAME=C.R_CONSTRAINT_NAME
            WHERE C.CONSTRAINT_TYPE='R' AND P.OWNER='PMOWN' AND P.TABLE_NAME=sources(i);
            IF n!=0 THEN
                RAISE_APPLICATION_ERROR(-20003, sources(i) || '를 참조하는 외래키가 있습니다.');
            END IF;
        END IF;
    END LOOP;
    -- 묶음으로 한 실행에 모델이 둘 이상 저장됐다면 단일 모델 전제가 깨진 것이다
    SELECT COUNT(*) INTO n FROM ALL_TABLES WHERE OWNER='PMOWN' AND TABLE_NAME='TN_PM_SMLT_RESULT_GROUP';
    IF n!=0 THEN
        EXECUTE IMMEDIATE q'~SELECT COUNT(*) FROM (
            SELECT S.SMLT_ID FROM PMOWN.TN_PM_SMLT_STNG S
            WHERE S.SMLT_ID IN (SELECT G.SMLT_ID FROM PMOWN.TN_PM_SMLT_RESULT_GROUP G)
            GROUP BY S.SMLT_ID HAVING COUNT(*) > 1
        )~' INTO n;
        IF n!=0 THEN
            RAISE_APPLICATION_ERROR(-20005,'RESULT_GROUP으로 묶인 다중 모델 실행이 ' || n || '건 있습니다.');
        END IF;
    END IF;
    FOR i IN 1 .. sources.COUNT LOOP
        SELECT COUNT(*) INTO n FROM ALL_TABLES WHERE OWNER='PMOWN' AND TABLE_NAME=sources(i);
        IF n=0 THEN
            DBMS_OUTPUT.PUT_LINE(sources(i) || '이(가) 이미 제거됐습니다.');
        ELSE
            SELECT COUNT(*) INTO n FROM ALL_TABLES WHERE OWNER='PMOWN' AND TABLE_NAME=backups(i);
            IF n=0 THEN
                EXECUTE IMMEDIATE 'CREATE TABLE PMOWN.' || backups(i) || ' AS SELECT * FROM PMOWN.' || sources(i);
            END IF;
            EXECUTE IMMEDIATE 'SELECT COUNT(*) FROM PMOWN.' || sources(i) INTO source_count;
            EXECUTE IMMEDIATE 'SELECT COUNT(*) FROM PMOWN.' || backups(i) INTO backup_count;
            EXECUTE IMMEDIATE 'SELECT COUNT(*) FROM (SELECT ' || cols(i) || ' FROM PMOWN.' || sources(i)
                || ' MINUS SELECT ' || cols(i) || ' FROM PMOWN.' || backups(i) || ')' INTO diff_count;
            IF source_count!=backup_count OR diff_count!=0 THEN
                RAISE_APPLICATION_ERROR(-20004, sources(i) || ' 백업이 원본과 다릅니다.');
            END IF;
            EXECUTE IMMEDIATE 'SELECT COUNT(*) FROM (SELECT ' || cols(i) || ' FROM PMOWN.' || backups(i)
                || ' MINUS SELECT ' || cols(i) || ' FROM PMOWN.' || sources(i) || ')' INTO diff_count;
            IF diff_count!=0 THEN
                RAISE_APPLICATION_ERROR(-20004, sources(i) || ' 백업이 원본과 다릅니다.');
            END IF;
            EXECUTE IMMEDIATE 'DROP TABLE PMOWN.' || sources(i);
            DBMS_OUTPUT.PUT_LINE(sources(i) || ' 제거 완료. 백업: ' || backups(i));
        END IF;
    END LOOP;
END;
/
SELECT TABLE_NAME FROM ALL_TABLES
WHERE OWNER='PMOWN' AND TABLE_NAME IN ('TN_PM_SMLT_RESULT_GROUP','TN_PM_SMLT_CAST_CONTRACT');
