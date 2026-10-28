# 일일 시뮬레이션 결과 정리 배치

프로시저 정의: [2026-10-28-daily-smlt-result-cleanup.sql](../java/ddl/2026-10-28-daily-smlt-result-cleanup.sql)

PMOWN 계정에서 정의 SQL을 실행해 `PMOWN.PR_PM_SMLT_RSLT_CLEANUP`을 생성한다.
정의 파일은 프로시저를 생성하며 삭제 작업을 호출하지 않는다.

매일 새벽 배치에서 다음을 한 번 호출한다.

```sql
BEGIN
    PMOWN.PR_PM_SMLT_RSLT_CLEANUP;
END;
/
```

JDBC 배치에서는 `/` 없이 `{call PMOWN.PR_PM_SMLT_RSLT_CLEANUP()}`을 실행한다.

## 정리 조건

- DB 서버의 실행일 기준 어제: `EXCN_YMD = TO_CHAR(SYSDATE - 1, 'YYYYMMDD')`.
- 일일 결과: `SMLT_TYPE = 'Auto'`. 사용자 결과 `WhatIf`는 제외한다.
- 위 조건의 전체 결과에서 숫자 기준 최소·최대 SMLT_ID를 보존한다. 터미널별로 나누지 않는다.
- ID는 문자형이며 앞자리 0 유무가 섞여 있으므로 최소·최대 및 순서는 `TO_NUMBER`로 비교한다.
  삭제 조건은 원래 문자열 ID를 사용해 SMLT_ID 선두 PK 인덱스를 활용할 수 있게 한다.
- 대상이 없거나 ID가 1~2개뿐이면 삭제하지 않는다.
- 삭제 대상은 `TN_PM_SMLT_RSLT_DTL`, `TN_PM_SMLT_STNG` 두 테이블이다.

`EXCN_YMD`는 시뮬레이션의 대상 기준일이며 실제 등록일 `FRST_REG_DT`와 다를 수 있다.
예를 들어 DB 실행일이 2026-10-28이면 `EXCN_YMD = '20261027'`인 일일 결과를 정리한다.
최초·최종은 요청대로 숫자 SMLT_ID의 최소·최대이며 시뮬레이션 시작시각 기준은 아니다.

## 삭제 단위와 재실행

SMLT_ID별 FOR LOOP 안에서 상세를 최대 10,000행씩 DELETE·COMMIT한다.
한 ID의 상세가 전부 삭제되면 해당 ID의 설정을 DELETE·COMMIT한다.
청크 크기는 프로시저의 `C_DELETE_LIMIT`으로 조정한다.

오류는 현재 미커밋 작업을 ROLLBACK하고 호출 배치로 전파한다. 이미 커밋한 삭제는 유지된다.
설정은 상세 삭제 완료 후에 지우므로 같은 날 재호출하면 남아 있는 대상부터 정리할 수 있다.
다음 날에는 대상일자가 바뀌므로 실패한 배치는 같은 날 재시도해야 한다.

프로시저가 내부 COMMIT을 수행하므로 다른 미커밋 작업이 없는 배치 전용 연결에서 호출한다.
배치를 중복 실행하지 않고, 어제 대상 결과의 저장이 끝난 시간에 실행한다.
보존 경계는 호출 초기에 한 번 결정한다.

실제 DB에 `TN_PM_SMLT_FCLT_WTNG_RSLT` 및 STNG 참조 FK는 아직 적용하지 않았다는 확인을 전제로 한다.
향후 해당 FK를 적용하면 이 프로시저도 자식 결과 정리를 포함하도록 함께 수정해야 한다.

## 실행 전후 대상 확인

다음은 읽기 전용 쿼리다. 실행 전에는 KEEP/DELETE 대상을 보여 주고, 완료 후에는 KEEP만 남아야 한다.

```sql
SELECT SMLT_ID,
       CASE
           WHEN ID_NUMBER = MIN_ID_NUMBER OR ID_NUMBER = MAX_ID_NUMBER THEN 'KEEP'
           ELSE 'DELETE'
       END AS CLEANUP_ACTION
  FROM (
      SELECT SMLT_ID,
             TO_NUMBER(SMLT_ID) AS ID_NUMBER,
             MIN(TO_NUMBER(SMLT_ID)) OVER () AS MIN_ID_NUMBER,
             MAX(TO_NUMBER(SMLT_ID)) OVER () AS MAX_ID_NUMBER
        FROM PMOWN.TN_PM_SMLT_STNG
       WHERE EXCN_YMD = TO_CHAR(SYSDATE - 1, 'YYYYMMDD')
         AND SMLT_TYPE = 'Auto'
       GROUP BY SMLT_ID
  )
 ORDER BY ID_NUMBER, SMLT_ID;
```

로컬에는 Tibero 접속 환경이 없어 실제 프로시저 컴파일과 실행은 검증하지 않았다.
구현 문법은 [Tibero 7 tbPSM 안내서](https://tmaxtibero.blog/wp-content/uploads/2025/01/Tibero_7_tbPSM-Guide_v7.2.2.pdf)의
커서 반복문과 트랜잭션 제어를 기준으로 작성했다.
