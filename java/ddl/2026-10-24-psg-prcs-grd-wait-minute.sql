-- 혼잡등급 기준표를 처리 여객 평균 대기시간(정수 분) 기준으로 전환한다.
-- 계획: docs/plans/2026-10-24-cgn-grade-wait-time-impact.md §2.2 · §8.1
-- 코드(Java PsgPrcsGradeRawDto int 분 · CgnGradeScale 초 배타적 상한)와 같은 배포 창에서 적용한다.
-- 옛 인원 기준 코드와 새 분 단위 기준표가 섞이면 등급이 엉뚱하게 나온다.
--
-- (1) 사전 점검 → (2) 백업 → (3) 적용 → (4) 검증 순서로 실행한다. (5) 는 복구용이다.
-- 실DB 에서 확인한 값이 아니라 사용자가 확정한 입력 전제를 넣는다.

WHENEVER SQLERROR EXIT SQL.SQLCODE ROLLBACK

-- (1) 사전 점검 — 컬럼 타입과 현재 값. NULL · 소수 · 누락이 보이면 적용 전에 원인을 확인한다.
SELECT COLUMN_NAME, DATA_TYPE, DATA_PRECISION, DATA_SCALE, NULLABLE
FROM ALL_TAB_COLUMNS
WHERE OWNER = 'PMOWN'
  AND TABLE_NAME = 'TN_PM_PSG_PRCS_GRD'
ORDER BY COLUMN_ID;

SELECT FCLT_GROUP_CD, PSG_PRCS_GRD_CD, MIN_VL, MAX_VL
FROM PMOWN.TN_PM_PSG_PRCS_GRD
WHERE FCLT_GROUP_CD IN ('02', '04')
ORDER BY FCLT_GROUP_CD, PSG_PRCS_GRD_CD;

-- 같은 기준표를 읽는 다른 프로그램이 있는지 확인한다 (인원 기준으로 읽는 곳이 남으면 함께 전환해야 한다)
SELECT OWNER, NAME, TYPE
FROM ALL_DEPENDENCIES
WHERE REFERENCED_OWNER = 'PMOWN'
  AND REFERENCED_NAME = 'TN_PM_PSG_PRCS_GRD';

-- (2) 백업 — 복구할 때 코드와 함께 되돌린다
CREATE TABLE PMOWN.TN_PM_PSG_PRCS_GRD_BK20261024 AS
SELECT *
FROM PMOWN.TN_PM_PSG_PRCS_GRD
WHERE FCLT_GROUP_CD IN ('02', '04');

-- (3) 적용 — 체크인(02) · 출국장(04) 모두 같은 경계. MAX 19 는 19분 59.x초까지 포함한다
DECLARE
    updated_count NUMBER := 0;

    PROCEDURE set_grade(p_grade_cd VARCHAR2, p_min NUMBER, p_max NUMBER) IS
    BEGIN
        UPDATE PMOWN.TN_PM_PSG_PRCS_GRD
        SET MIN_VL = p_min,
            MAX_VL = p_max
        WHERE FCLT_GROUP_CD IN ('02', '04')
          AND PSG_PRCS_GRD_CD = p_grade_cd;

        updated_count := updated_count + SQL%ROWCOUNT;
    END;
BEGIN
    set_grade('01', 0, 19);
    set_grade('02', 20, 39);
    set_grade('03', 40, 59);
    set_grade('04', 60, 9999);

    IF updated_count <> 8 THEN
        RAISE_APPLICATION_ERROR(-20001, '혼잡등급 기준표 행 수가 8 이 아닙니다. updated=' || updated_count);
    END IF;
END;
/

-- (4) 검증 — 아래 세 쿼리가 모두 0건이어야 COMMIT 한다
-- NULL · 소수 · 음수 · 역전
SELECT FCLT_GROUP_CD, PSG_PRCS_GRD_CD, MIN_VL, MAX_VL
FROM PMOWN.TN_PM_PSG_PRCS_GRD
WHERE FCLT_GROUP_CD IN ('02', '04')
  AND (MIN_VL IS NULL OR MAX_VL IS NULL
       OR MIN_VL <> TRUNC(MIN_VL) OR MAX_VL <> TRUNC(MAX_VL)
       OR MIN_VL < 0 OR MIN_VL > MAX_VL);

-- 등급 누락 · 중복 (그룹마다 01~04 가 한 번씩)
SELECT FCLT_GROUP_CD, COUNT(*) AS GRADE_CNT, COUNT(DISTINCT PSG_PRCS_GRD_CD) AS DISTINCT_CNT
FROM PMOWN.TN_PM_PSG_PRCS_GRD
WHERE FCLT_GROUP_CD IN ('02', '04')
GROUP BY FCLT_GROUP_CD
HAVING COUNT(*) <> 4 OR COUNT(DISTINCT PSG_PRCS_GRD_CD) <> 4;

-- 공백 · 겹침 — 다음 등급 MIN 은 앞 등급 MAX + 1 분이어야 한다 (초로는 (MAX+1)×60 = 다음 MIN×60)
SELECT FCLT_GROUP_CD, PSG_PRCS_GRD_CD, MIN_VL, PREV_MAX_VL
FROM (
    SELECT FCLT_GROUP_CD, PSG_PRCS_GRD_CD, MIN_VL,
           LAG(MAX_VL) OVER (PARTITION BY FCLT_GROUP_CD ORDER BY MIN_VL) AS PREV_MAX_VL,
           ROW_NUMBER() OVER (PARTITION BY FCLT_GROUP_CD ORDER BY MIN_VL) AS RN
    FROM PMOWN.TN_PM_PSG_PRCS_GRD
    WHERE FCLT_GROUP_CD IN ('02', '04')
)
WHERE (RN = 1 AND MIN_VL <> 0)
   OR (RN > 1 AND MIN_VL <> PREV_MAX_VL + 1);

-- 검증이 모두 0건이면 COMMIT, 아니면 ROLLBACK
-- COMMIT;

-- (5) 복구 — 이전 코드로 되돌릴 때 함께 실행한다
-- UPDATE PMOWN.TN_PM_PSG_PRCS_GRD A
-- SET (MIN_VL, MAX_VL) = (
--     SELECT B.MIN_VL, B.MAX_VL
--     FROM PMOWN.TN_PM_PSG_PRCS_GRD_BK20261024 B
--     WHERE B.FCLT_GROUP_CD = A.FCLT_GROUP_CD
--       AND B.PSG_PRCS_GRD_CD = A.PSG_PRCS_GRD_CD
-- )
-- WHERE A.FCLT_GROUP_CD IN ('02', '04');
-- COMMIT;
