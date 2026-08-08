# 5.7 저장 결정 로그 — 4단계(저장 · 실행 API) 착수 시 확정한 사항

← [DB-ANALYSIS.md](DB-ANALYSIS.md)

3단계 결정 로그([06-decisions.md](06-decisions.md))가 4단계로 넘긴 항목과, 저장 계층을 쓰면서 새로 갈라진 것들을 확정했다.
[06-decisions.md](06-decisions.md)와 같은 형식이다 — 결정 근거와 **틀렸을 때 어디를 고치면 되는지**를 같이 적는다.

- 지시서: [`docs/tasks/04-api-implementation-part2.md`](../tasks/04-api-implementation-part2.md)
- **DB 에 접속하지 않았다.** 신규 테이블은 전부 DDL 초안이며 **DBA 승인 전이다.**

## 요약

| # | 결정 | 상태 | 뒤집을 때 고칠 곳 |
|---|---|---|---|
| D10 | 사용자 조건은 `TN_PM_SMLT_*_ATRB` 가 아니라 **`SMLT_ID` + `TMNL_ID` 로 격리된 신규 테이블 9종**에 저장 | 확정 (DBA 승인 필요) | `java/cast-db/ddl-user-smlt.txt` |
| D11 | 저장 전략 — 체크인·출국장은 **전체 교체**, 운항편 헤더만 **병합** | 확정 | 각 `ServiceImpl.saveXxx` |
| D12 | 감사 컬럼 등록자는 저장 3종 전부 **`#{loginUserId}`** (`'CAST'` 아님) | 확정 | 각 XML 의 `FRST_RGTR_ID` / `LAST_MDFR_ID` |
| D13 | 저장 응답은 `Boolean` 이 아니라 **`JsonResponse`** | 확정 | `CastUserSmltController` · `userSmlt.service.ts` |
| D14 | 벌크 INSERT 는 `VALUES` 다중행이 아니라 **`INSERT ALL`** | 확정 (G18 회피) | 각 XML 의 `insertUserXxxList` |
| D15 | 구간 일련번호는 **애플리케이션이 1부터 부여**, 수행 일련번호만 `MAX + 1` | 확정 | XML `<foreach index>` · `retrieveNextSmltExcnSn` |
| D16 | 운항편/여객수는 **조정 비율만** 저장한다. 곱해진 여객수를 물리 저장하지 않는다 | 확정 | `TN_PM_SMLT_USER_FLT_PSG` · `CastRsrcServiceImpl` 1단계 |
| D17 | 수행 이력은 `TH_PM_SMLT_EXCN_LOG` 가 아니라 **신규 `TH_PM_SMLT_EXCN_HSTRY`** | 확정 (DBA 승인 필요) | `CastSmltMapper.xml` 수행 statement 5종 |
| D18 | G3 / G4 SQL 버그는 **호출하지 않으므로 고치지 않는다.** 기록만 남긴다 | 확정 | `CastRestMapper.xml:1747` · `:1762` |
| D19 | CAST 연동은 **호출 지점과 순서만** 확보. 실제 발행은 원본 소스 확인 후 | 확정 | `CastRsrcServiceImpl` |
| D20 | `saveSlfchknInfo` / `saveScPlanInfo` 는 **폐기**하고 상위 저장 API 에 흡수 | 확정 | `endpoints.ts` · `API_SPEC.md` 6.4 / 6.6 |

---

## D10 — 저장 대상 테이블

**결정**: `SMLT_ID` + `TMNL_ID` 로 격리된 신규 테이블 9종을 만든다. DDL 초안은 [`java/cast-db/ddl-user-smlt.txt`](../../java/cast-db/ddl-user-smlt.txt).

| 탭 | 테이블 | 담는 것 |
|---|---|---|
| 체크인 카운터 | `TN_PM_SMLT_USER_CHKN_ISL` | 아일랜드 · 부스 수 · 키오스크/백드롭 대수 |
| 〃 | `TN_PM_SMLT_USER_CHKN_OPER_HR` | 아일랜드 운영시간 구간 (복수) |
| 〃 | `TN_PM_SMLT_USER_CHKN_BOOTH` | 부스별 항공사 배정 (행 1개 = 부스 1석) |
| 출국장 | `TN_PM_SMLT_USER_DEP` | 사용여부 · 검색대 구성(보안/일반/스마트패스) |
| 〃 | `TN_PM_SMLT_USER_DEP_OPER_HR` | 출국장 운영시간 구간 (복수) |
| 〃 | `TN_PM_SMLT_SC_PLAN` | 보안검색대 운영계획 구간 (G7 선택지 2) |
| 운항편/여객수 | `TN_PM_SMLT_USER_FLT_PSG` | 조정 방식 · 전체 비율 |
| 〃 | `TN_PM_SMLT_USER_FLT_PSG_HR` | 시간대별 조정 비율 |
| 실행 | `TH_PM_SMLT_EXCN_HSTRY` | 수행 이력 (D17) |

**왜 `TN_PM_SMLT_*_ATRB` 에 쓰지 않았나**

세 가지가 겹친다.

1. **공유 자원이다.** `*_ATRB` 는 `<자원>_ATRB_ID` 로 묶인 CAST 리소스이고 `TN_PM_SMLT_STNG.*_RSRC_ID` 가 그것을 참조한다. 여러 시뮬레이션이 같은 ATRB 행을 가리킬 수 있으므로, 사용자 편집분을 거기에 쓰면 **다른 시뮬레이션 결과가 오염된다.**
2. **쓰기 선례가 없다** (G22). `CastRestMapper.xml` 의 쓰기 17개는 `*_ATRB` 를 하나도 건드리지 않는다. 이 행들은 다른 시스템이 만든다.
3. **DDL 이 없다** (G22). PK·NOT NULL·기본값을 모르는 상태에서 INSERT 를 쓰면 조용히 틀린다.

3단계 D7 이 이미 같은 결론을 예고했다 — *"시뮬레이션 조건을 마스터에 쓰면 안 되므로 4단계 저장은 반드시 별도 테이블이어야 한다."*

**해소되는 것**: D7 이 기본값으로 내려보내던 필드 4종이 저장처를 갖는다.

| 필드 | 3단계 | 4단계 |
|---|---|---|
| `boothList[].customYn` | 항상 `'N'` | `TN_PM_SMLT_USER_CHKN_BOOTH.CSTM_ALCTN_YN` |
| `depList[].normalCnt` / `smartPassCnt` | 항상 `0` | `TN_PM_SMLT_USER_DEP.NRML_CNT` / `SMART_PASS_CNT` |
| `adjType` / `adjRate` / `hourList[].adjRate` | `RATIO` / `0` | `TN_PM_SMLT_USER_FLT_PSG(_HR)` |
| `depList[].oprYn` | 마스터 `USE_YN` | `TN_PM_SMLT_USER_DEP.OPER_YN` |

> **조회 API 는 아직 이 테이블들을 읽지 않는다.** 4단계 범위는 저장·실행이고 3단계 조회 API 의 시그니처를 바꾸지 않았다. 저장→재조회 왕복을 완성하려면 조회 쿼리가 신규 테이블을 우선 읽고 없으면 기존 배정 테이블로 폴백하도록 바꿔야 한다 — **5단계 대상.** 현재는 저장 결과를 재조회로 확인할 수 없다.

**D2 초안과 달라진 곳**: `TN_PM_SMLT_SC_PLAN` 에 있던 `NRML_CNT` / `SMART_PASS_CNT` 를 `TN_PM_SMLT_USER_DEP` 으로 옮겼다. 화면 드로어의 스테퍼 3개가 **구간이 아니라 출국장 단위**이기 때문이다 (DELTA 3.3).

---

## D11 — 저장 전략

**결정**

| API | 전략 | 근거 | 삭제 범위 |
|---|---|---|---|
| `saveChknCounterInfo` | **전체 교체** | 화면이 터미널 1개분 아일랜드 전체를 보낸다 (DELTA 2.6) | `SMLT_ID` + `TMNL_ID` |
| `saveDepInfo` | **전체 교체** | 〃 출국장 전체 + 구간표 전체 (DELTA 3.4) | `SMLT_ID` + `TMNL_ID` |
| `saveFltPsgInfo` (헤더) | **병합** | `SMLT_ID` + `TMNL_ID` 당 1행짜리 설정값 | — |
| `saveFltPsgInfo` (시간대별) | **전체 교체** | 24행이 통째로 온다 | `SMLT_ID` + `TMNL_ID` |

**`DELETE` 범위 검증** — 완료 조건 *"T1 저장이 T2 를 지우지 않는다"* 가 여기 걸린다.

- 모든 `DELETE` 가 `SMLT_ID` **와** `TMNL_ID` 를 함께 조건에 넣는다. `TMNL_ID` 를 빼면 T1 저장이 T2 를 지운다.
- `TMNL_ID` 값은 `TerminalKind.getFcltTmnlId()` 가 만든 `P01` / `P03` 이다. 서비스가 `saveDto.fcltTmnlId` 에 넣고 XML 은 그것만 본다 — 터미널 코드 변환은 여전히 `TerminalKind` 한 곳이다 (D1).
- 자식 테이블부터 지운다 (부스 → 운영시간 → 아일랜드 / 구간표 → 운영시간 → 출국장). FK 제약이 붙어도 순서가 맞는다.

**병합은 `UPDATE` 후 영향 행이 0이면 `INSERT`** 로 구현했다. `MERGE` 를 쓰지 않은 이유는 레포 전체에 `MERGE` 선례가 없어서다. `UPDATE` 경로는 `LAST_MDFR_ID` / `LAST_MDFR_IP_ADDR` / `LAST_MDFCN_DT` 3종을 항상 함께 갱신한다.

---

## D12 — 감사 컬럼 등록자 ID

**결정**: 저장 3종 · 실행 1종 **전부 `#{loginUserId}`** 를 쓴다.

| API | `FRST_RGTR_ID` | 근거 |
|---|---|---|
| `saveChknCounterInfo` | `#{loginUserId}` | 사용자 조작 |
| `saveDepInfo` | `#{loginUserId}` | 사용자 조작 |
| `saveFltPsgInfo` | `#{loginUserId}` | 사용자 조작 |
| `executeUserSmlt` (이력) | `#{loginUserId}` | 사용자 조작. **모니터링 화면의 성명·부서가 이 값에서 나온다** |
| (참고) CAST 리소스 발행 | `'CAST'` | 엔진이 쓰는 행. `CastRestMapper.xml` 관행 그대로 |

[02-naming-convention.md](02-naming-convention.md) 의 *"사용자 경로에서는 `#{loginUserId}` / `#{loginIpAddr}` 를 쓴다"* 를 따른 것이다.
값은 `SessionUtils.setUserContext(dto, sessionService)` 한 줄로 채워진다 — 그래서 모든 요청 DTO 가 `AomsDefaultDto` 를 상속한다.

`FRST_*` 3종은 INSERT 에서만, `LAST_*` 3종은 UPDATE 에서만 채운다.

---

## D13 — 저장 API 의 응답 타입

**결정**: `ResponseEntity<JsonResponse>`. `ResponseUtils.res(true)` 를 쓰지 않았다.

지시서 5.4 는 두 가지를 함께 요구한다 — *"void 성 쓰기는 `res(true)`"* 와 *"실패는 예외를 던지지 않고 payload 안에서 표현한다"*. 자바는 반환 타입이 하나뿐이라 **둘을 동시에 만족시킬 수 없다.** 정보를 담는 쪽(완료 조건 *"실패 시 `JsonResponse.error(...)` 로 사유가 내려온다"*)을 택했다.

- 성공: `new JsonResponse()` — `isError = false`, `errorMessage = null`
- 실패: `new JsonResponse().error("저장에 실패했습니다.")`
- 프론트 `userSmltService.saveXxx` 의 반환 타입도 `Promise<void>` → `Promise<JsonResponse>` 로 맞췄다.

**뒤집을 때**: 컨트롤러 3곳의 반환 타입과 `userSmlt.service.ts` 만 바꾸면 된다. 서비스는 그대로 둔다.

---

## D14 — 벌크 INSERT 문법

**결정**: `INSERT ALL ... INTO ... VALUES (...) ... SELECT 1 FROM DUAL`.

지시서 6장은 *"벌크 INSERT 는 `<foreach>` 로 VALUES 목록 생성 (`insertSimResultDtl` 정본)"* 이라고 적었지만, **그 정본이 Oracle 에서 돌지 않는다** (G18 — `ORA-00933`). 원소가 1개일 때만 우연히 통과한다.

- `INSERT ALL` 은 `INTO` 절이 0개면 문법 오류다. 서비스가 목록이 비었는지 먼저 보고 호출을 건너뛴다.
- 중첩 `<foreach>`(아일랜드 → 부스 / 출국장 → 구간) 도 `INSERT ALL` 로 자연스럽게 펼쳐진다. `VALUES` 다중행이었다면 그룹 사이 구분자 처리가 더 지저분했다.

**정본(`insertSimResultDtl`)은 손대지 않았다.** 지시서 4장 *"기존 44개 statement 를 임의로 수정 금지"* 를 따랐다. 그 statement 를 실제로 호출하게 되면 그때 고쳐야 한다 (G18).

---

## D15 — 일련번호 채번

| 대상 | 방식 | 이유 |
|---|---|---|
| `OPER_HR_SN` (운영시간 구간) | 애플리케이션이 목록 순서대로 1부터 (`<foreach index>` + 1) | 전체 교체라 스코프가 매번 비어 있다. 동시성 문제 없음 |
| `PLAN_SN` (검색대 구간) | 〃 | 〃. 화면이 신규 행에 `0` 을 보내므로 요청값을 그대로 쓸 수 없다 |
| `BOOTH_NO` (부스) | 요청값 그대로 | 아일랜드 안의 부스 번호는 화면이 정하는 자연키다 |
| `SMLT_EXCN_SN` (수행 이력) | `NVL(MAX(...), 0) + 1` (스코프 = `SMLT_ID`) | 시퀀스가 없다. 지시서 5.2 관행 ② |

`SMLT_EXCN_SN` 만 **트랜잭션 격리 수준에 의존한다.** 같은 `smltId` 로 동시에 실행을 걸면 PK 충돌로 드러난다(조용히 틀리지 않는다). 시퀀스가 필요해지면 `SQ1_TH_PM_SMLT_EXCN_HSTRY` 로 신설한다 — 다만 기존 시퀀스 2개가 모두 이름과 대상이 어긋나 있으므로(G12) **DBA 에게 실재 목록을 받아 확인해야 한다.**

---

## D16 — 운항편/여객수: 비율인가 결과인가

**결정**: **비율만 저장한다.** 곱해진 편별 여객수를 `TN_PM_SMLT_SCHDL_ATRB` 에 물리 저장하지 않는다.

[04-screen-table-mapping.md](04-screen-table-mapping.md) 1장이 남긴 결정 항목이다.

| 선택지 | 채택 | 사유 |
|---|---|---|
| ① 비율만 저장하고 실행 시점에 곱한다 | **채택** | 원본이 그대로 남는다. 되돌리기가 공짜다 |
| ② `TN_PM_SMLT_SCHDL_ATRB` 에 곱한 결과를 저장 | 기각 | **원본 복원이 불가능하다.** 스냅샷 테이블을 또 만들어야 하고, 애초에 그 테이블에 쓰기 SQL 이 없다 (G22) |

곱하는 지점은 CAST 리소스 발행 1단계(운항 스케줄)다 — `CastRsrcServiceImpl.publishUserSmltRsrc` 주석 참조.

**남는 문제**: `adjType = RATIO` 와 `HOURLY` 를 동시에 저장할 수 있는 구조다(헤더와 시간대별 행이 둘 다 남는다). 적용 시점에 `ADJ_TYPE_CD` 로 하나만 골라 쓴다. **어느 쪽을 우선하는지는 발행 구현에서 다시 정한다.**

---

## D17 — 수행 이력 테이블

**결정**: `TH_PM_SMLT_EXCN_HSTRY` 를 신설한다. 기존 `TH_PM_SMLT_EXCN_LOG` 를 쓰지 않는다.

지시서 5.6 은 *"모니터링이 읽는 테이블·컬럼과 같은 곳에 써야 한다. 확인 안 되면 그 사실을 먼저 해결한다"* 고 했다. 확인한 결과는 이렇다.

| 사실 | 근거 |
|---|---|
| `TH_PM_SMLT_EXCN_LOG` 에 `SMLT_ID` 컬럼이 **없다** | `CastRestMapper.xml:6-14` — 컬럼은 `SMLT_EXCN_DT` / `STEP_CD` / `STTS_CD` + `FRST_*` 3종뿐 |
| 이 테이블에 **조회 statement 가 하나도 없다** | 01-table-catalog B-4 |
| `STEP_CD` / `STTS_CD` 의 **코드값 집합이 미확인**이다 | 〃 |
| 모니터링 화면(`retrieveSmltExecList`)의 **Java 구현이 레포에 없다** | `java/cast/controller` 에 `mntr` 컨트롤러 없음 |

즉 "모니터링이 읽는 곳"은 아직 존재하지 않는다. 그래서 **이 단계에서 정한다** — 모니터링은 `TH_PM_SMLT_EXCN_HSTRY` 를 읽는다.

- 쓰기: `CastSmltMapper.insertSmltExcnHstry` (`executeUserSmlt` 2단계)
- 읽기: `CastSmltMapper.retrieveSmltExcnList(bgnDt, endDt)` — `API_SPEC.md` 7.2 의 `SmltExecDto` 모양 그대로 내려준다. **매퍼·XML 만 만들어 두었고 컨트롤러·서비스는 아직 없다** (모니터링 화면 구현은 4단계 범위 밖).
- `deptNm` / `userNm` 은 아직 `''` 다. 사용자 테이블이 확인되지 않았다 (G1). 조인 키로 쓸 `FRST_RGTR_ID` 는 `rgtrId` 로 함께 내려준다.

**뒤집을 때**: `TH_PM_SMLT_EXCN_LOG` 에 `SMLT_ID` 를 추가하는 쪽으로 간다면 statement 5종의 테이블명만 바꾸면 된다.

---

## D18 — G3 / G4 SQL 버그 처리

**결정**: **고치지 않는다. 기록만 남긴다.**

지시서 5.5 의 판단 기준은 *"이 statement 들을 실제로 호출하게 된다면 고쳐야 한다. 호출하지 않는다면 기록만 남기고 손대지 않는다"* 였다.

| 위치 | 버그 | 4단계에서 호출하는가 | 처리 |
|---|---|---|---|
| `CastRestMapper.xml:1762` `updateSimResultDtl` | `UPDATE INTO ...` (ORA-00905) · `INT()` 는 Oracle 함수가 아님 (ORA-00904) · `WHERE` 가 PK 6개 중 3개만 | **아니다** — CAST 가 결과를 되돌려줄 때 쓰는 누적 갱신 경로다. 저장·실행 흐름에 없다 | 기록만 |
| `CastRestMapper.xml:1747` `retrieveSimSetByPk` | `SELECT COUNT(SIM_ID) FROM TN_PM_SMLT_STNG` — 컬럼은 `SMLT_ID` (ORA-00904) | **아니다** — CAST 중복 실행 체크 경로다. `executeUserSmlt` 는 자체 조건 확인(`retrieveUserSmltCondCnt`)을 쓴다 | 기록만 |

**고쳐야 할 시점**: CAST 결과 적재 경로(`insertSimResultDtl` / `updateSimResultDtl`)를 실제로 붙일 때다. 그때는 G18(벌크 INSERT)도 함께 걸린다. 세 개를 한 번에 다루는 것이 맞다 — **별도 승인 후 진행.**

수정안은 이미 있다.

```sql
-- G3
UPDATE PMOWN.TN_PM_SMLT_RSLT_DTL
   SET WTNG_PSG_CNT  = WTNG_PSG_CNT  + TO_NUMBER(#{wtngPsgCnt})   -- NUMBER(5,0) 이라 변환 불필요
     , TRNST_PSG_CNT = TRNST_PSG_CNT + TO_NUMBER(#{trnstPsgCnt})
 WHERE ...   -- PK 6개 전부

-- G4
SELECT COUNT(SMLT_ID) rsltCnt FROM PMOWN.TN_PM_SMLT_STNG
```

---

## D19 — CAST 연동 범위

**결정**: **호출 지점과 순서만 확보한다.** 실제 발행은 원본 소스 확인 후 별도 진행.

지시서 5.5 그대로다. 막힌 이유는 G8 — `CastRestMapper.xml` 의 49개 statement 중 45개가 `aoms.pm.cmmn.dto.*` 를 쓰는데 그 패키지의 Java 소스가 레포에 없다. **매퍼 인터페이스를 선언할 수 없으므로 발행 SQL 을 호출할 수단 자체가 없다.**

확보한 것:

- `CastRsrcService` / `CastRsrcServiceImpl` — `publishUserSmltRsrc` · `triggerUserSmltExcn` 두 지점
- 발행 순서 8단계 (`CastRsrcServiceImpl.publishUserSmltRsrc` 위 주석이 정본)
- `executeUserSmlt` 가 이 두 지점을 3·4단계에서 호출한다

### 확인이 필요한 지점 (미해결 목록)

`CastRsrcServiceImpl.PENDING_RSRC_LIST` 와 같은 목록이다. 코드와 문서 둘 다에 둔다.

| # | 지점 | 주체 | 막히는 것 |
|---|---|---|---|
| 1 | `aoms.pm.cmmn.dto.*` 26종의 Java 소스 (G8) | 개발 (원본 프로젝트) | 발행 전체 |
| 2 | `TN_PM_SMLT_*_ATRB` 계열 DDL (G22) | DBA | 발행 시 INSERT 할 컬럼의 NOT NULL / 기본값 |
| 3 | `LISTAGG` 119회에 `ON OVERFLOW TRUNCATE` 없음 (G19) | 개발 | 하루치 운항편이면 `ORA-01489` 가 유력하다 |
| 4 | `insertSimSet` 의 `TMNL_ID` `'P01'` 하드코딩 (`CastRestMapper.xml:1610`) | 개발 | **T2 조건이 P01 로 저장된다.** 발행 붙이기 전에 고쳐야 한다 |
| 5 | 사용자 시뮬레이션의 `SMLT_TYPE` 코드값 | 현업 + DBA | 이력에는 `'USER'` 로 쓰고 있다. 일일은 `'AUTO'` 로 확인됨 |
| 6 | CAST 엔진 수행 시작 트리거의 프로토콜 (REST / 큐) | 개발 (벤더) | `triggerUserSmltExcn` |
| 7 | `TH_PM_SMLT_EXCN_LOG` 의 `STEP_CD` / `STTS_CD` 코드값 집합 | 벤더 | 단계별 진행률 표시 |
| 8 | 발행 결과를 `TN_PM_SMLT_STNG` 에 쓸지 `TN_PM_SMLT_WHAT_IF_DEF_TBL` 에 쓸지 (C-7) | 개발 | 8단계 `insertSimSet` |
| 9 | `DBMS_RANDOM.VALUE` tie-break 로 같은 입력이 다른 리소스를 만든다 (G20) | 현업 | what-if 비교의 재현성 |

**4·6번이 남아 있는 한 `executeUserSmlt` 는 이력만 남기고 실제 수행을 걸지 않는다.** 상태가 `RUNNING` 에서 넘어가지 않는다 — 운영 반영 전 반드시 해소해야 한다.

---

## D20 — `saveSlfchknInfo` / `saveScPlanInfo` 폐기

**결정**: 폐기하고 상위 저장 API 에 흡수한다.

| 구 API | 흡수처 | 근거 |
|---|---|---|
| `retrieveSlfchknInfo` / `saveSlfchknInfo` | `retrieveChknCounterInfo` / `saveChknCounterInfo` | 화면의 `현재상태 저장` 버튼이 하나다 (DELTA 2.6) |
| `retrieveScPlanInfo` / `saveScPlanInfo` | `retrieveDepInfo` / `saveDepInfo` | 〃 (DELTA 3.4) |

04-screen-table-mapping 2.6 이 지적한 대로 **저장 대상 테이블은 여전히 물리적으로 나뉜다.** API 를 합쳐도 한 트랜잭션 안에서 여러 테이블을 쓴다 — 그래서 클래스 레벨 `@Transactional(rollbackFor = Exception.class)` 이 필수다.

정리한 곳: `endpoints.ts` 상수 4개, `api.types.ts` 의 `SlfchknDeviceDto` · `UserSmltSlfchknDto` · `UserSmltSlfchknSaveReq` · `ScGateDto` · `UserSmltScDto` · `UserSmltScSaveReq`, `userSmlt.service.ts` 함수 4개.

> 구 `6.4` 의 기기별 운영시간(`deviceList[].oprTimeList`)은 **저장하지 않는다.** 리뉴얼 화면에 대응 요소가 없어 보낼 값이 없다. 기존 `TN_PM_SMLT_SBD_ATRB` 의 `OPER_BGNG_DT` / `OPER_END_DT` 데이터는 그대로 남는다(지우지 않는다) — 아일랜드 운영시간을 따를지 기기별로 유지할지는 **현업 확인 대상**이다.

---

## 4단계에서 해소되지 않은 것 (5단계로 이월)

| # | 항목 | 주체 | 막히는 것 |
|---|---|---|---|
| — | **신규 테이블 9종 DDL 승인** | DBA | 저장 API 전부. 승인 전에는 아무것도 돌지 않는다 |
| — | **조회 API 가 신규 테이블을 읽도록 전환** | 개발 | 저장 → 재조회 왕복. 지금은 저장해도 조회 응답이 안 바뀐다 |
| G8 | CAST 발행 구현 | 개발 | 수행이 실제로 걸리지 않는다 (D19) |
| G1 | 사용자 테이블 · 시설물 좌표 테이블 | DBA | 모니터링 이력의 부서/성명, `retrieveFcltMap` |
| — | 모니터링 화면 컨트롤러·서비스 | 개발 | `retrieveSmltExecSmry` / `retrieveSmltExecList` / `retrieveSmltExecDetail` |
| — | 진입 정보 `retrieveUserSmltInfo` (6.1) | 개발 | 저장 대상 `smltId` 를 만드는 경로가 아직 없다 |
| G17 | 자정 넘김(RON) | 개발 | 운영시간을 `0~24` 정수로 저장하므로 22:00~02:00 을 표현할 수 없다. 화면이 1시간 단위 타임바라 현재는 문제가 드러나지 않는다 |
| — | `adjType` RATIO / HOURLY 우선순위 | 현업 | D16 참조 |
| — | 기기별 운영시간 유지 여부 | 현업 | D20 참조 |
