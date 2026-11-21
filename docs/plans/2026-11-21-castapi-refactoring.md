# CastApiServiceImpl · CastApiMapper.xml 리팩토링 계획

## Context

`java/castapi/service/impl/CastApiServiceImpl.java`(2,618줄)와 `java/mapper/CastApiMapper.xml`(2,077줄)은
CAST 연계(GetResourceInformation · GetResource · SetResource) 전부를 담고 있다. 읽기 어려운 이유는 다음과 같다.

- **Java**: 한 클래스가 요청 XML 파싱, 리소스 12종 응답 생성, PropertySet 분포식 XML, 결과 저장, 모델 파일 저장,
  WhatIf 상태 동기화를 모두 한다. 리소스 핸들러 12개가 SOAP 봉투 + 헤더 + `m:table` + 필드맵 루프를 거의 같은
  코드로 복사해 두었다(각 50~60줄). 차이는 테이블 인덱스(0/-1) · 표시명 · 컬럼명 규칙 · 값 변환 정도다.
  PropertySet 은 StringBuilder 6개를 메서드마다 인자로 넘긴다.
- **Mapper**: `dailyFlightScheduleRows` 하나가 CTE 16개(약 500줄)다. 한 번만 쓰는 조회도 따로 CTE 로 빼 두었고,
  `*_RANK` → `*` 처럼 `RN = 1` 거르기만 하는 CTE 도 쌍으로 있다. 그 밖에 운항 원천 필터 9줄이 5곳,
  DPL 운영시간 서브쿼리가 8번(입국심사 · 환승보안 · 출국장), `LastModified` 포맷식이 20번 넘게 반복된다.
  LISTAGG 문은 컬럼마다 `WITHIN GROUP (ORDER BY …)` 를 다시 쓴다.

사용자 결정: **구조 개선과 결함 수정을 함께** 하고, Java 는 **굵직한 책임 단위로만** 나누고, Mapper 는 **한 파일**로 둔다.

## 지켜야 할 계약

- `CastApiService` 인터페이스 · `CastApiController` · 외부 URL 은 그대로다.
- `dailyFlightScheduleRows` 의 **출력 컬럼 이름 · 순서**는 그대로다. `CastUserSnapshotMapper.xml#insertSchdlAtrbFromDaily` 가
  `F.*`(CF_TER_ID_X · SCHD_DT · SCHD_HM · PREDC_HM · RSVT_BDPSG_CNT · FRST/LAST_BAG_INPUT_DT_RAW …)를 refid 로 읽는다.
- `retrieveCounterAllocation` id 와 그 안의 RON_YN · 종료일 CASE 식 형태는 그대로다. `java/verify/verify_chkn_booth_overnight.py` 가
  정규식으로 뽑아 `CastChknMapper.retrieveChknBoothOperList` 와 대조한다.
- CAST 응답 XML 은 결함 수정 항목을 빼면 바이트 단위로 같아야 한다(공백 · 탭 · 줄바꿈 · 속성 순서 포함).
  PropertySet 은 헤더 속성 순서가 다르고 탭 깊이도 다르다(TAB_THREE). 서비스 속성이 비어 있으면 앞에 쉼표가 붙는데, 이 동작도 그대로 둔다.
- §16 보안 규칙: `${}` 금지, `<include>` 파라미터는 `<bind>`, XXE 설정 7종은 공용 메서드 한 곳에 둔다, 싱글톤 빈에는 가변 필드를 두지 않는다.
- 기존 주석은 보존한다(동작과 어긋나는 주석은 아래 결함 M5 에서만 사용자 승인 하에 고친다).

---

## 1. Java — 굵직한 책임 단위로 분리 (새 파일 4개)

패키지는 기존 `aoms.pm.castapi.service.impl`(디렉터리 `java/castapi/service/impl/`)에 둔다.

| 클래스 | 책임 | 옮겨 오는 것 | 예상 크기 |
|---|---|---|---|
| `CastApiServiceImpl` (기존, `@Service` · `@Transactional`) | 진입점 · 분기 · 예외→응답 · 롤백 | 공개 메서드 6개, `resolveBaseYmd`, 사용자 PS 판별, 리소스 유형 분기, `setRollbackOnly` | ~250줄 |
| `CastResourceRenderer` (`@Component`) | GetResourceInformation · GetResource 응답 XML (PropertySet 제외) | `buildResponseXml`, 테이블형 리소스 12종, CAST 모델, 실패 응답 | ~450줄 |
| `CastPropertySetRenderer` (`@Component`) | PropertySet 응답 (PS001 · 사용자 PS5xx) | `handlePropertySet`, `renderUserPropertySet`, `renderBasePropertySetXml`, 분포식 · 여객 속성 값 XML 전부, `DAILY_PRPT_SET_RSRC_ID` | ~500줄 |
| `CastSetResourceHandler` (`@Component`) | SetResource 처리 3갈래 | 결과 XML 파싱(`simRsltParser` 계열), 결과 저장(`insertResult` 계열), 모델 저장(`saveModel` · `modelParser`), WhatIf 상태 동기화(`updateWhatIf` · `whatIfParser`) | ~550줄 |
| `CastApiXml` (final, static) | 세 클래스가 같이 쓰는 XML 기반 | `parseXmlSafely`(XXE 7종), `parseRootElement`, `getAttributeValue`, SOAP 봉투 열기/닫기, SetResource 응답(`buildReturnXml`), 요청자 IP 조회(현재 4곳에 복사됨) | ~150줄 |

- 컴포넌트는 퍼사드의 트랜잭션 안에서 호출된다(REQUIRED 전파). 컴포넌트에는 `@Transactional` 을 달지 않고
  `TransactionAspectSupport…setRollbackOnly()` 는 퍼사드에만 둔다.
- 요청 DTO 파싱(`resourceInfoList` · `resourceList`)은 짧아서 퍼사드에 남긴다. 결과 XML 파싱은 저장과 붙어 있으니 `CastSetResourceHandler` 로 보낸다.
- 결과 파싱 메서드가 객체 5개를 인자로 끌고 다니는 부분은 `CastSetResourceHandler` 안의 private static 상태 클래스 하나로 묶는다(클래스 파일을 늘리지 않는다).

### 1-1. 테이블형 리소스 공통 렌더 (`CastResourceRenderer`)

FS · CA · SBD · 서비스시간 · 체크인유형 · 출국장 · 출국심사 · 입국심사 · 보안검색 · 환승보안 · 리포팅 · WhatIf 12개 핸들러를
`TableSpec` 선언 12개와 `renderTable(spec, rows)` 하나로 바꾼다. `TableSpec` 은 private static final 클래스로 둔다(record 미사용).

- 필드: 리소스 유형 · 설명, 테이블 인덱스(0 / -1), 테이블 표시명 · id, 필드맵, 컬럼명 규칙(그대로 / Pascal / Pascal + 띄어쓰기),
  값 변환(따옴표 치환 대상 태그, `escapeXml11` 여부)
- 현재 핸들러별 차이(인덱스, 표시명, `fnCaseConverter` 사용 여부, CA · SBD 의 `&quot;` 치환, 서비스시간만 escape)는
  스펙 값으로 그대로 옮긴다
- `CastApiFieldMaps` 의 FieldInfo 클래스 12개(`FsFieldInfo` · `CaFieldInfo` …)를 제네릭 `FieldInfo<T>` 하나로 합친다. 맵 내용은 바꾸지 않는다

### 1-2. PropertySet (`CastPropertySetRenderer`)

- StringBuilder 6개는 private static 누적 클래스 `PropertyColumns` 로 묶는다. 서비스 행은 쉼표를 사이에만 넣고,
  여객 · ID 행은 항상 앞에 쉼표를 붙이는 현재 규칙을 그대로 유지한다
- 분포식 14종(`appendTringleFloatXml` …)에 공통으로 붙는 앞부분(`FNC_ROLE … FNC_EXPANDED`)은 헬퍼 하나로 뽑는다. 상수 순서는 바꾸지 않는다

---

## 2. Mapper — 섹션 정리와 CTE 축소 (파일 1개 유지)

### 2-1. 섹션 순서와 공통 조각

statement 를 CAST 요청 흐름 순서로 다시 놓고 섹션마다 `<!-- ===== … ===== -->` 구분 주석을 단다.
순서: 리소스 목록 → FS → CA/SBD → PropertySet → 모델 → GenericTable(서비스시간 · 체크인유형 · 운영시간 5종 · 리포팅 · WhatIf) →
결과 저장 → 첨부파일 → WhatIf 상태 → 기준일자.

새 `<sql>` 조각 (모두 파라미터 없음 · 별칭 고정, §16.1 준수):

| 조각 | 내용 | 쓰는 곳 |
|---|---|---|
| `gdDataFltCond` | 운항 원천 공통 8조건 (`A.CSHR_STTS_CD` ~ `A.LCRFT_YN`) | 리소스 목록 FS001, FS001 기준 운항, 과거 게이트, 과거 캐러셀, SBD001 |
| `gdDataPaxCond` | 좌석 > 0 · 여객 > 0 조건 | 리소스 목록 FS001, FS001 기준 운항 |
| `cknctDailyAlotRows` | 체크인 일일 배정 행 + RON_YN + BGN_DT / END_DT (`#{alotYmd}`) | CA001, FS001 체크인 범위 |
| `dplOperHrRows` | DPL 운영시간 3테이블 조인 + 최신 상관 번호 필터 (`#{opngYmd}`) | 출국장 · 입국심사 · 환승보안(P01 → P02 복제분 포함) |

- `cknctDailyAlotRows` 는 CA001 과 FS001 이 "같은 원천 · 필터"로 따로 복사해 둔 것을 하나로 합친다. 호출부는 `<bind name="alotYmd" …/>` 로 이름을 맞춘다
- 리소스 ID 에서 번호만 떼는 일(`REPLACE(#{resourceID},'PS','')`, `REGEXP_REPLACE(…,'FOTDG|FacilityOpeningTable_DepartureGate','')` 등 20여 곳)은
  Java 가 `CastReqGetResourceDto.rsrcNo` 를 한 번 채우고 SQL 은 `#{rsrcNo}` 만 읽는다. 타입별 접두어 목록은 `TableSpec` 에 둔다
- `LastModified` 는 `TO_CHAR(x,'YYYY-MM-DD')||'T'||TO_CHAR(x,'HH24:MI:SS')` 를 같은 결과인 `TO_CHAR(x,'YYYY-MM-DD"T"HH24:MI:SS')` 한 번으로 줄인다

### 2-2. `dailyFlightScheduleRows` — CTE 16개 → 4개

CTE 는 여러 번 읽히거나 단계 경계가 의미 있는 것만 남긴다. 한 번만 조인되는 조회는 조인 자리의 인라인 뷰나 스칼라 서브쿼리로 옮긴다.

```
WITH
FLT        -- 기준 운항 (BASE_GD + BASE_PRE 의 PAX_CNT · TR_PAX_CNT + FFF 의 ARR_DT 를 여기서 계산)
CIC_RANGE  -- 편별 체크인 범위 (CIC_ALOT=조각 include, CIC_FLT_CNTR, 아일랜드 선택을 인라인 뷰로 한 CTE 에)
PAST_GATE  -- 최근 3개월 대표 게이트 (RANK + RN=1 을 한 CTE 로)
FLT_RSRC   -- FLT + PAST_GATE + RS 캐러셀 + CIC_RANGE → STND_NO · GATE_NO · CRS_NO_BASE 확정 (기존 BASE_PRE)
SELECT …   -- 기존 FFF + 최종 SELECT 를 하나로
  FROM FLT_RSRC
  LEFT JOIN (게이트 → 터미널/캐러셀 그룹 인라인 뷰)
  LEFT JOIN (최근 1개월 도착편 캐러셀 인라인 뷰, RN=1 은 ON 절)
  LEFT JOIN (TN_CA_CRSL 캐러셀 fallback 인라인 뷰, RN=1 은 ON 절)
  -- OperatorCat · ContactRemote · SBDAvailable 은 스칼라 서브쿼리 / EXISTS
```

- 출력 컬럼 이름 · 순서 · 표현식 결과는 그대로다. `DBMS_RANDOM` 으로 고르는 3곳(과거 게이트 동률, 과거 캐러셀, 캐러셀 fallback)도 의도를 확인하기 전까지 그대로 둔다(아래 '고치지 않는 것')
- `ArrivalGate` 는 `COALESCE(GI.TER_ID, F.CF_TER_ID_X)` 로 직접 계산해 FFF 단계를 없앤다

### 2-3. 그 밖의 statement 정리

- `retrieveResourceInformation`: UNION ALL 17갈래 안에서는 원천 컬럼(유형 · ID · 설명 · 수정일시 · tableID)만 내고,
  `Author` 와 `LastModified` 포맷은 바깥 SELECT 에서 한 번만 한다. Java 의 플래그 15개(같은 조건을 9번 반복)를 리소스 유형 플래그 5개로 줄이고
  `AND #{flag} = 1` 대신 `<if>` 로 갈래를 뺀다(`<trim prefixOverrides="UNION ALL">`)
- `retrievePropertySetPax` · `retrievePropertySetPaxDtl`: PSG_ATRB / SHOW_UP_ATRB 는 원천만 UNION 하고 코드 테이블 조인 · GROUP BY 는 한 번만 한다(중복 GROUP BY 컬럼 제거)
- `retrieveCounterAllocation` 사용자 분기: `SUBSTR(TO_CHAR(TO_DATE(…)))` 를 세 번 이어 붙이는 t1/t2 를 `TO_CHAR(…,'YYYY-MM-DD"T"HH24:MI":00"')` 로 줄인다(같은 결과)
- FS 사용자 분기의 gate CASE 에서 도달할 수 없는 WHEN 3개(P01 '10' · P02 '112' · P03 '245')를 지운다(동작 동일)

### 2-4. LISTAGG 제거 → 행 조회 + Java 결합 (결함 M0 · M1 과 함께)

**왜 바꾸나**: 행이 많아지면 LISTAGG 가 실패한다(결함 M0). 정확히는 행 수 제한이 아니라 결과 문자열 길이 제한
(`VARCHAR2` 4,000바이트, `MAX_STRING_SIZE=EXTENDED` 여도 32,767바이트) 때문에 `ORA-01489` 가 난다. FS 의 `scheduleTime` 한 칸이 24바이트 정도라서
수천 편이면 컬럼 하나만으로 한도를 넘는다. `ON OVERFLOW TRUNCATE` 는 데이터를 잘라 버리니 쓸 수 없다. `XMLAGG`/CLOB 집계는 한도는 피하지만
느리고 SQL 이 더 읽기 어려워진다. 그래서 **SQL 에서 집계를 없애고 Java 가 잇는 쪽**을 택한다.

FS · CA · SBD · 서비스시간 · 체크인유형 · 운영시간 5종 · 리포팅 · WhatIf, 모두 12개 statement 는 행 목록(`List<기존 DTO>`)을 돌려주고
`ORDER BY <기존 정렬키>, <유일 보조키>` 로 순서를 확정한다. `renderTable` 이 필드맵 extractor 로 컬럼별 값을 `,` 로 잇는다.

**성능 설계** (Java 로 옮겨도 느려지지 않게):

- **fetchSize 지정이 핵심이다.** Oracle JDBC 기본 fetchSize 는 10이라서 1만 행이면 왕복이 1,000번이다.
  이 statement 들에 `fetchSize="1000"` 을 준다. 현재 LISTAGG 는 1행만 받으므로 이 설정이 없으면 Java 쪽이 오히려 느려질 수 있다
- DB 부담은 줄어든다: 지금은 컬럼마다(FS 27개) `WITHIN GROUP` 정렬을 하는데, 바뀌면 `ORDER BY` 한 번이다
- 결합은 행을 **한 번만** 훑으며 필드별 `StringBuilder`(행 수 × 평균 길이로 미리 용량 확보)에 동시에 붙인다. 필드마다 스트림 · 중간 리스트를 만들지 않는다.
  1만 행 × 27컬럼이면 27만 번 append 라 수 ms 수준이다
- 결과 매핑은 지금처럼 `resultType` 자동 매핑을 쓴다. DTO 1만 개는 수 MB 이하다
- `escapeXml11` 은 서비스시간 컬럼에만 그대로 적용한다(지금처럼). 모든 값으로 넓히지 않는다

**측정 기준**: 단계 4 전후로, 운항편이 가장 많은 날짜의 FS001 · CA001 과 사용자 FS 1건에서 'SQL 실행 + 행 수신'과 'XML 생성' 시간을 따로 잰다
(임시 로그로 재고, 측정이 끝나면 지운다). 합계가 현재 이하이면 통과다. 지금 실패하는 건수는 끝까지 완료되는지를 본다.

- 기존 DTO · 필드맵을 그대로 재사용한다(DTO 한 개가 이제 행 하나를 담는다). `CastApiMapper` 반환 타입만 `List<…>` 로 바뀐다
- 행 단위 값 규칙은 지금 결과를 그대로 재현한다: `NVL(col,' ')` 이던 컬럼은 SQL 에서 `' '`, `REPLACE(LISTAGG…,' ','')` 이던 컬럼은 SQL 에서 행 단위 `REPLACE`, Java 는 null → `""`
- `lastModified`: SYSDATE 기반(FS · CA · SBD · WhatIf)은 Java 현재 시각, 마스터 기반은 행에 실린 값(모든 행이 같은 값). 행이 0건이면 Java 현재 시각을 쓴다
- 효과: 컬럼마다 반복되던 `WITHIN GROUP (ORDER BY …)` 가 사라지고, 정렬 동률 · NULL 누락으로 배열이 어긋나는 문제가 구조적으로 없어진다. LISTAGG 길이 제한에서도 벗어난다

---

## 3. 결함 수정 목록

| # | 위치 | 현재 | 수정 |
|---|---|---|---|
| M0 | LISTAGG 12개 statement | 운항편 · 배정 행이 많은 날은 이어 붙인 문자열이 한도를 넘어 `ORA-01489` 로 리소스 발행이 실패한다 | 2-4 (집계 제거 + fetchSize) |
| M1 | LISTAGG 12개 statement | 정렬키가 같은 행은 컬럼마다 순서가 달라질 수 있다. NVL 이 없는 컬럼(CA · SBD · 서비스시간 · 체크인유형 · 출국심사 · 보안 · 리포팅)은 NULL 셀이 빠져 뒤 값이 한 칸씩 당겨진다(§11.4 규칙 위반) | 2-4 |
| M2 | 운영시간 3종 날짜 조회 | 본문 WHERE 는 `REGEXP_REPLACE`(약칭 FOTDG 등 포함), 날짜 서브쿼리는 `REPLACE`(약칭 미포함)를 쓴다. 약칭 ID 로 요청하면 날짜를 못 찾고 baseYmd 로 떨어진다. 같은 서브쿼리를 2~4번 다시 계산한다 | `#{rsrcNo}` 하나로 통일하고 날짜는 1회만 계산 |
| M3 | 리소스 목록 CA001 · SBD001 | `ROWNUM = 1` 로 임의 행의 수정일시를 LastModified 로 쓴다 | `MAX(NVL(LAST_MDFCN_DT, FRST_REG_DT))` + `HAVING COUNT(*) > 0` (FS001 과 같은 방식) |
| M5 | `retrieveWhatIfCntrl` 주석 | "대기(New) 건만 내보낸다"고 적혀 있지만 2026-10-19(`d2fa51e`)에 필터가 의도적으로 빠졌다. 상태 동기화가 목록에 없는 요청을 지우므로 필터를 되살리면 진행 중인 요청이 삭제된다 | 주석을 실제 동작에 맞게 고친다(**기존 주석 수정이므로 구현 시 문구를 보여 주고 확인받는다**) |
| M7 / J1 | `saveModel` · `retrieveSnoMaxPk` | `atchFileId` 를 넣기 전에 일련번호를 조회한다(항상 NULL 조건). 결과도 쓰지 않고 `"1"` 을 하드코딩한다 | 호출과 statement 를 함께 지운다(새 첨부 ID 라 1 이 맞다) |
| J2 | `saveModel` | 모델 파일 쓰기에 실패해도 예외를 기록만 하고 DB 등록을 계속한다. 그러면 없는 파일을 가리키는 행이 남는다 | `IOException` 을 그대로 던진다. `saveResult` 가 받아 롤백한다 |
| J3 | `saveModel` | 새 모델(ID 없음)일 때 `ATCH_FILE_PATH_NM` 이 `"remote:.txt"` 가 된다. `getResourceID().equals("")` 는 null 이면 NPE 가 난다 | 확정된 모델명을 쓰고, null 을 먼저 검사한 뒤 `isEmpty()` 로 확인한다 |
| J4 | `handleCastModel` | 같은 존재 검사를 세 번 한다. 파일 읽기에 실패해도 빈 values 로 TRUE 응답을 보낸다 | 검사는 1번만 하고, 읽기 실패는 `IllegalStateException` → INVALID_REQUEST 로 보낸다 |
| J5 | GenericTable 분기 | 지원하지 않는 ID 면 빈 문자열을 응답한다 | default 갈래처럼 `addFailure` + `RESOURCE_ERROR` 를 보낸다 |
| J6 | `processSingleRun` | 결과 배열 길이가 다르면 `ArrayIndexOutOfBounds` 가 난다. catch 목록에 없어서 롤백 응답이 아니라 500 으로 떨어진다 | 배열 길이를 먼저 맞춰 보고, 다르면 `IllegalStateException` 을 던진다 |
| J7 | `processSingleRun` | 미매핑 시설코드가 시각 행마다 `_REG_EXCL` 에 다시 들어간다(같은 코드가 하루 144건). 시설코드 목록도 run 마다 다시 조회하고, 요청자 IP 도 행마다 다시 구한다 | 결과 하나에 미매핑 코드는 1건만 넣는다(`Set`). 코드 목록 · IP 는 한 번만 구한다 |

## 4. 고치지 않고 기록만 하는 것

- `DBMS_RANDOM` 으로 대표 게이트 · 캐러셀을 고르는 3곳 — 같은 날 FS001 을 다시 요청하면 값이 달라진다. 분산을 노린 의도일 수 있어 운영 담당 확인이 필요하다
- `MAX + 1` 채번(`retrieveNewCastModelId`, `retrieveIdMaxPk`, `_REG_EXCL.SMLT_SN`)에 잠금이 없다. 모델 저장이 드물어 이번에는 그대로 둔다
- 응답 XML 속성값 escape 가 일관되지 않다. 단, CA · SBD 는 일부러 `&quot;` 를 넣고 있어서, 일괄 escape 하면 이중으로 escape 된다
- Interval 테이블마다 같은 run 객체를 결과 목록에 다시 넣는다. Interval 이 여러 개 오면 결과가 중복된다. 실제 CAST 결과 샘플로 몇 개가 오는지 확인한 뒤 고친다

---

## 5. 작업 순서 (커밋 단위)

각 단계는 앞 단계 위에서 따로 검증할 수 있게 나눈다.

0. **기준 응답 확보 (실백엔드, 사전 작업)** — `TN_PM_SMLT_DALY_CRTR_YMD` 를 고정일로 두고 리소스 목록과 리소스별 응답
   (FS001 · 사용자 FS, CA001 · 사용자 CA, SBD001 · 사용자 SBD, PS001 · PS5xx, 서비스시간 · 체크인유형 · 운영시간 5종 001/사용자 · 리포팅 · WhatIf · CASTModel)을 파일로 저장한다
1. **Java 클래스 분리 + TableSpec + FieldInfo 제네릭화** — 동작 변경 없음. 기준 응답과 차이 0
2. **Mapper 섹션 · 공통 조각 · `#{rsrcNo}` · 리소스 목록 · PS · 운영시간 정리** — 차이 0. 약칭 ID 날짜(M2)는 의도된 차이다
3. **`dailyFlightScheduleRows` CTE 재구성 + `cknctDailyAlotRows` 공유 + verify 스크립트에 `<include>` 펼치기 추가** — 차이 0 (랜덤 선택 컬럼은 따로 비교, 아래 검증)
4. **LISTAGG 제거 → 행 조회 전환 (M0 · M1)** — NULL · 동률 행에서만 차이가 난다. 전후 시간을 측정한다(2-4 측정 기준).
   위험이 가장 큰 단계라 1~3단계보다 먼저 해도 된다. 오류 해소가 급하면 이 단계를 앞당긴다
5. **결함 수정 M3 · M5 · M7/J1 · J2~J7** — 항목마다 따로 커밋하고, 커밋 메시지에 기대 차이를 적는다
6. **문서 갱신** — `AGENTS.md` §8 · §11.3 에 있는 `CastApiServiceImpl.DAILY_PRPT_SET_RSRC_ID` 참조를 새 위치(`CastPropertySetRenderer`)로 고친다. `resolveBaseYmd()` 는 퍼사드에 남는다

## 6. 검증

이 저장소에서는 Java 를 컴파일할 수 없다(AGENTS §7). 아래 검증은 실백엔드 · 검증 DB 에서 하고, 여기서 할 수 있는 것만 여기서 한다.

- **여기서**
  - `python java/verify/verify_chkn_booth_overnight.py` — 3단계 이후. 스크립트가 `<include refid>` 를 같은 파일의 `<sql>` 로 펼쳐 CA001 식을 계속 찾는지 확인한다
  - `rg -n '\$\{' --glob '*.xml' java/mapper` — 주석을 뺀 0건 (§16.1)
  - Mapper XML 을 well-formed 로 파싱하고, `CastApiMapper.java` 메서드와 statement id 가 1:1 인지 대조한다(스크립트로)
- **실백엔드**
  - 백엔드 빌드 + 단계별로 0단계 기준 응답과 diff. `LastModified` 의 SYSDATE 값은 diff 에서 뺀다. 기대 차이는 위 단계 설명과 결함 표에 있는 것만 허용한다
  - `dailyFlightScheduleRows` 동등성: 검증 DB 에서 3개 일자에 대해 구 SQL 과 신 SQL 을 양방향 `MINUS` 한다. `StandNumber` · `Gate` · `Belt` 는 랜덤 선택이 섞여 있으니
    "선택된 값이 동률 후보 집합 안에 있는지"로 따로 확인한다
  - LISTAGG 한도: 지금 `ORA-01489` 가 나는 날짜(또는 행이 가장 많은 날짜)로 FS001 · CA001 을 요청해 끝까지 응답하는지 보고, 2-4 측정 기준으로 시간을 비교한다
  - 사용자 FS 발행(`insertSchdlAtrbFromDaily`)을 1건 실행해 저장 행 수와 컬럼이 이전과 같은지 본다
  - CAST 연계: GetResourceInformation → GetResource 전 유형 → SetResource(결과 1건 · WhatIf 상태 · 모델) 왕복

---

## 7. 구현 결과 (2026-11-21, 커밋 `a519480`)

계획과 다르게 처리한 것만 적는다.

- **리소스 번호 떼기**: Java 가 `CastReqGetResourceDto.rsrcNo` 를 채우는 대신 각 statement 맨 위의 `<bind name="rsrcNo" value="resourceID.replace…"/>` 한 줄로 처리했다. DTO 와 Java 접두어 목록이 필요 없다.
- **리소스 목록 플래그**: 15개를 5개로 줄이는 대신 모두 없앴다. Mapper 가 `resourceTypes` 를 보고 `<if test='types.contains("…")'>` 로 갈래를 고르며, `CastReqGetResourceInformationDto` 의 Yn 필드 16개도 지웠다.
- **중첩 include**: `dailyFlightScheduleRows` 는 `CastUserSnapshotMapper` 가 다른 namespace 에서 include 하므로 그 안의 refid 는 namespace 까지 적었다.
- **`retrievePropertySetSvc`**: 정렬이 없어 실행 계획이 바뀌면 행 순서가 달라질 수 있으므로 SQL 구조를 원문대로 두고 리소스 번호만 바꿨다.
