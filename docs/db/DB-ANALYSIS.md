# 데이터베이스 구조 분석 (2단계 산출물)

`java/cast-db/` 의 Oracle DDL 과 MyBatis XML 매퍼를 역공학해서 스키마를 복원하고, 리뉴얼된 사용자 시뮬레이션 3탭 화면이 요구하는 데이터가 어느 테이블·컬럼에서 나오는지 매핑한 문서다.

- 지시서: [`docs/tasks/02-database-analysis.md`](../tasks/02-database-analysis.md)
- 선행 산출물: [`react/src/api/pm/API_SPEC-DELTA.md`](../../react/src/api/pm/API_SPEC-DELTA.md) (1단계)
- **DB 에 접속하지 않았다.** 접속 정보가 레포에 없고, 이 단계의 범위도 아니다.
- **코드·SQL 을 수정하지 않았다.** 발견한 버그는 [05-gaps.md](05-gaps.md) 에 기록만 했다.

## 목차

| 장 | 문서 | 내용 |
|---|---|---|
| 5.1 | [01-table-catalog.md](01-table-catalog.md) | 테이블 카탈로그 — 소유자별 59개 테이블, 컬럼·출처·PK 추정 |
| 5.2 | [02-naming-convention.md](02-naming-convention.md) | 명명 규칙 사전 — 접두/약어/접미, 감사 컬럼 6종, 시퀀스·함수 |
| 5.3 | [03-sql-patterns.md](03-sql-patterns.md) | 핵심 조인 패턴 · SQL 관용구 — `PSG_FCLT_CD` 자리수 규칙, enum 대응표 |
| 5.4 | [04-screen-table-mapping.md](04-screen-table-mapping.md) | 화면 ↔ 테이블 매핑표 — `API_SPEC-DELTA.md` 전 항목 |
| 5.5 | [05-gaps.md](05-gaps.md) | 갭 · 모순 목록 — G1~G16, 영향 범위와 결정 주체 |

## 분석 대상

| 파일 | 규모 | statement |
|---|---|---|
| `java/cast-db/ddl.txt` | 107줄 | 테이블 2개 (**유일한 실제 DDL**) |
| `java/cast-db/CastChknMapper.xml` | 57줄 | select 1 |
| `java/cast-db/CastDepMapper.xml` | 48줄 | select 1 |
| `java/cast-db/CastSlfchknMapper.xml` | 59줄 | select 1 |
| `java/cast-db/CastSmltMapper.xml` | 110줄 | select 5 |
| `java/cast-db/CastUserConfigMapper.xml` | 30줄 | select 2 |
| `java/cast-db/CastRestMapper.xml` | 2254줄 | **49** (select 32 / insert 7 / update 5 / delete 5) |

> 지시서는 `CastRestMapper.xml` 을 "44 statement" 로 적었으나 실제로는 **49개**다. `<select|insert|update|delete id=` 기준 (`CastRestMapper.xml:4` ~ `:2250`).

`java/mapper/` 의 5개 XML 은 `java/cast-db/` 와 **바이트 단위로 동일한 사본**이다 (`cmp` 로 5개 전부 확인). 런타임 리소스 경로 미러로 보이며 분석 대상에서 제외했다. `CastRestMapper.xml` 은 `cast-db/` 에만 있다.

## 참조한 Java 소스 (읽기 전용)

| 경로 | 이 문서에 쓰인 근거 |
|---|---|
| `java/cast/mapper/*.java` | 매퍼 인터페이스 7개 — 파라미터/반환 타입. `FcltMapper` · `UserMapper` 는 XML 없음 (G1) |
| `java/cast/dto/*.java` | 30개 DTO — 컬럼→필드 매핑의 반대편 |
| `java/cast/enums/*.java` | `CongestionStatus` / `CongestionType` / `PrcsGrdType` / `SlfType` |
| `java/cast/service/impl/CastSmltServiceImpl.java` | 395줄 — 시설 코드·터미널 코드·아일랜드 목록의 유일한 의미 근거 |
| `react/src/modules/pm/pages/userSmlt/**` | 1단계 개편 결과. 화면 요소의 실제 형태 |

## 출처 표기 규칙

문서 전체에서 모든 테이블·컬럼·주장에 아래 셋 중 하나를 붙였다.

| 표기 | 의미 |
|---|---|
| **DDL 확보** | `ddl.txt` 에 `CREATE TABLE` 이 있다. 타입·NULL·코멘트까지 확정 |
| **쿼리에서 유추** | SQL 에 등장하는 컬럼만 안다. 타입·NULL·전체 컬럼 목록은 모른다. 근거를 `파일:줄` 로 표기 |
| **미확인** | 존재 자체 또는 대응 관계를 확정할 수 없다 |

근거는 `CastChknMapper.xml:24` 형식으로 남겼다. 테이블·컬럼명은 원문 대문자 그대로 쓴다.

## 한 장 요약

- 확인된 테이블 **59개** 중 **DDL 이 있는 것은 2개**(`TN_PM_SMLT_RSLT_DTL`, `TN_PM_SMLT_PSG_FCLT`)뿐이다. 나머지 57개는 전부 쿼리에서 유추한 것이고, 컬럼 목록도 SELECT 절에 등장한 것만 안다.
- 시뮬레이션 결과의 축은 `PMOWN.TN_PM_SMLT_RSLT_DTL` 하나다. 체크인/셀프/출국장/검색대 화면은 전부 이 테이블을 `TN_PM_SMLT_PSG_FCLT` 와 조인해 `UP_PSG_FCLT_CD` 로 갈라 쓴다.
- `PSG_FCLT_CD` 는 `VARCHAR2(8)` 이고 **시설군마다 자리수 구성이 다르다.** 3단계에서 신규 쿼리를 쓰려면 [03-sql-patterns.md](03-sql-patterns.md) 의 자리수 규칙표를 먼저 봐야 한다. 다만 이 규칙 자체가 SQL·Java 양쪽에서 역산한 것이라 **실데이터 검증이 필요하다** (G11).
- **터미널 코드는 3개인데 화면은 2개다.** `P01`+`P02` → `T1`, `P03` → `T2` 로 합산하는 근거를 `CastSmltServiceImpl.java:159-176` 에서 찾았다. 다만 시설 결과 조회는 `P01`·`P03` 만 쓴다 (G2 참고).
- 리뉴얼 화면이 새로 요구하는 값 중 **대기인원수 꺾은선·KPI 4종·시간대별 부스 수**는 저장 테이블이 확인되지 않는다. 3·4단계 최대 리스크다 (G7).
