# CastApiServiceImpl 분석 노트

`java/castapi/service/impl/CastApiServiceImpl.java`(3,255줄)를 청크 단위로 나눠 분석한 기록이다.
다른 세션에서 이어 갈 때는 이 문서의 **§5 다음 작업**부터 시작한다.

- 기준 커밋: `e486b22` (2026-11-17). 줄 번호는 이 커밋 기준이므로 파일이 바뀌면 메서드명으로 다시 찾는다.
- 진행 상황: 1단계(골격) 훑기 완료 · 2단계(① 리소스 목록) 완료 · **3단계(② 발행 진입 · 분기) 완료** · 4단계부터 미진행

---

## 1. 파일 개요

CAST가 서버를 부르는 POST 3개를 한 클래스가 처리한다. 실제 호출 순서도 이 순서다.

```
CAST ──① REQ_GetResourceInformation.do ──> retrieveResourceInformation  (리소스 목록)
     ──② REQ_GetResource.do            ──> retrieveResource             (리소스 XML 발행)
     ──③ REQ_SetResource.do            ──> saveResult                   (결과 · 모델 · WhatIf 상태 수신)
```

- 컨트롤러: `java/castapi/controller/CastApiController.java` (POST 3개 + 테스트 GET 2개)
- 실행 래퍼: `java/castapi/log/CastApiExecutor.java` · `CastApiContext.java`
- 매퍼: `java/castapi/mapper/CastApiMapper.java` · `java/mapper/CastApiMapper.xml`
- 클래스 전체에 `@Transactional(rollbackFor = Exception.class)`
- 주입 의존성: `CastApiMapper` · `CastExecutionMapper` · `CastExecutionService` · `SessionService` · `CastFcltWtngRsltCreateService`

---

## 2. 청크 구분

| # | 줄 범위 | 청크 | 내용 | 읽는 방식 |
|---|---|---|---|---|
| C0 | 파일 밖 | 호출 계약 | Controller, `CastApiExecutor` · `CastApiContext` | 정독 (짧음) |
| C1 | 1–360 | 클래스 골격 | 상수, XML 템플릿 상수(240–354), 의존성(355–360) | 훑기 |
| C2 | 361–730 | 매핑 사전 | 발행용 `FS/CA/SBD/ST/CT/DG/EM/SC/IM/TS/RS/WI_FIELD_MAP`, 수신 파싱용 `RESOURCE_INFO_MAP` · `RUN_MAP` · `INTERVAL_MAP` · `WHATIF_MAP`, `colTable` ThreadLocal | 필요할 때만 참조 |
| C3 | 732–901 | ① 리소스 목록 | `resolveBaseYmd` → 파싱 → `mapResourceFlags` → mapper → `buildResponseXml` | ✅ 완료 (§4) |
| C4 | 902–1105 | ② 진입 · 분기 | `retrieveResource`, 사용자 PS(PS500~998) 분기, `renderUserPropertySet`, `renderBasePropertySetXml`, `processResourceData` switch | ✅ 완료 (§4.2) |
| C5 | 1106–1274 | ② 운항 · 카운터 | `handleFlightSchedule` · `handleCounterAllocation` · `handleSbdAllocation` | 정독 |
| C6 | 1275–1928 | ② PropertySet | `handlePropertySet` → `processServiceProperties` → 분포별 `append*Xml` 14종(1422–1771) → `processPaxAndResourceInfo` → `appendT*` 5종 → `processPropertySetId` | 패턴 하나 정독 후 차이만 |
| C7 | 1929–1985 | ② 모델 | `handleCastModel` | 정독 |
| C8 | 1986–2449 (+3097–3180) | ② GenericTable 9종 | ServiceTime, CheckinType, DepartureGate, Emigration, Immigration, SecurityControl, TransferSecurityControl, RrpStngHrGroup, WhatIfControl(파일 끝 쪽에 따로 있음) | 하나 정독 후 비교표 |
| C9 | 2450–2518 | 공용 유틸 | 케이스 변환, `parseXmlSafely`(XXE 7개 설정 확인됨), `parseRootElement`, `getAttributeValue` | 훑기 |
| C10 | 2519–2672 | ③ 진입 · 매칭 | `saveResult` 3분기, `insertResult`, `resolveResultRequest`, `validateUserResult` | 정독 (가장 중요) |
| C11 | 2673–2790 | ③ 결과 상세 변환 | `processDetailList` · `processSingleRun` · `checkFcltCd` · `executeBatchInsert` · `calResultTime` | 정독 |
| C12 | 2791–2951 | ③ 수신 XML 파서 | `simRsltParser` 이하 재귀 파서 | 구조 위주 |
| C13 | 2952–3096 | ③ 모델 저장 | `saveModel` · `modelParser` (파일 저장 포함) | 정독 (§16.2 점검) |
| C14 | 3157–3255 | ③ WhatIf 상태 | `whatIfParser` · `updateWhatIf` | 정독 |

---

## 3. 분석 순서와 방법

1. **골격** (C0 → C1): 서비스는 예외를 `context.addException`에 넣고 XML을 돌려준다는 계약, 트랜잭션, 의존성
2. **① 리소스 목록** (C3): 세 흐름이 함께 쓰는 공통 패턴을 익힌다 — ✅ 완료
3. **② 발행 진입** (C4): `processResourceData` switch로 유형 → 핸들러 지도를 그리고, `renderUserPropertySet` 치환을 AGENTS.md §11.3과 대조 — ✅ 완료
4. **② 핸들러** (C5 → C8 → C7 → C6): 하나를 정독하고 나머지는 비교표로 정리. 규칙 대부분이 SQL에 있으므로 `CastApiMapper.xml`과 같이 본다
   - 비교표 열: 핸들러 / mapper 메서드 / FIELD_MAP / baseYmd·번호 사용 / 특이점
   - SQL 대조 대상(§11.3): SBD `AirlineCode`, 키오스크 `SUBSTR(ID,-3,1)`, `OPER_END_DT` HHMI, `CHKN_TYPE_CD='C'`, DepartureGate 레인 분배
5. **③ 결과 수신** (C10 → C12 → C11 → C14 → C13): DB 쓰기와 롤백이 있어 위험도가 가장 높다
   - C10은 §11.4와 대조: 요청 매칭(FS 후보 + WI 토큰 유일성), 리소스 대조(대소문자 무시, CA 빈 값 허용), 같은 실행·모델 결과 중복 거부, `EXCN_YMD` 결정, `createInitialResult`(§15)
   - C14는 CAS 전이(`canTransitTo`)와 보고 목록에 없는 요청 삭제 조건
6. **사전 · 유틸** (C2, C9): 필요할 때만 펼쳐 본다

청크마다 남길 메모 양식:

```
[C?] 범위:
- 입력: (CAST XML 요소/속성 또는 DTO)
- 출력: (응답 XML 형태 / DB 테이블)
- 호출: mapper statement id → CastApiMapper.xml 위치
- 실패 경로: context.addException / throw / setRollbackOnly / 빈 응답
- AGENTS.md 규칙 대조: §번호 — 일치 / 불일치 / SQL 확인 필요
- 의문점:
```

### 미리 짚어 둔 확인 포인트 (3단계 이후)

1. GenericTable 분기(`processResourceData`, 1080–1099줄)에 마지막 `else`가 없다. 어떤 ID에도 맞지 않으면 실패 기록 없이 빈 문자열을 응답한다. → 3단계에서 확인 (§4.2 확인 포인트 2)
2. 분기 판정이 `contains()` 기반이다(CounterAllocation은 `contains("CA")`). 상수끼리 포함 관계가 없는지 확인한다. → 3단계에서 확인, 포함 관계 없음 (§4.2)
3. 흐름마다 실패 처리가 다르다. ①·②는 예외를 삼키고 실패 XML이나 `INVALID_REQUEST`를 돌려주고, ③은 `setRollbackOnly`로 롤백한다.
4. `colTable` ThreadLocal이 싱글톤 빈의 필드다(730줄). 진입마다 `remove()`를 부르는데, 종료 시 정리 여부와 §16.9 관점을 확인한다.
5. `saveModel`은 파일 경로를 만든다. §16.2 점검 대상이다.

---

## 4. 완료한 분석

### 4.1 ① 리소스 목록 조회 (C3)

CAST가 가장 먼저 부르는 API다. 받아 갈 수 있는 리소스와 각 리소스의 마지막 수정 시각을 알려 준다.

```
POST /REQ_GetResourceInformation.do
 └ CastApiController.resGetResourceInformation
    └ CastApiExecutor.execute("GetResourceInformation", payload, λ)   ← context 생성, payload 로그
       └ retrieveResourceInformation(param, context)                   :742
          └ retrieveResourceInformation(parser, context)               :756  ← 실제 본체
             ├ colTable.remove()
             ├ parser.parse()  → parseRootElement → resourceInfoList   (XML → DTO)
             ├ setBaseYmd(resolveBaseYmd())                            → selectBaseYmdForCalibration
             ├ mapResourceFlags(dto)                                   (요청 유형 → Yn 플래그 15개)
             ├ castApiMapper.retrieveResourceInformation(dto)          (UNION ALL 17개 블록)
             └ buildResponseXml(results, true|false)                   (SOAP XML 조립)
```

진입 오버로드 세 개가 `ResourceRequestParser` 람다를 거쳐 private 본체 하나로 모인다. ②·③도 같은 구조다.

| 오버로드 | 호출하는 곳 | context |
|---|---|---|
| `(String, CastApiContext)` | 실제 POST (Executor 경유) | Executor가 만든 것이라 로그로 남음 |
| `(String)` | 호출처 없음 (인터페이스 호환용) | 새로 만들어 버림 |
| `(DTO)` | 테스트 GET `REQ_GetResourceInformation_Test.do` | 새로 만들어 버림 → 오류가 로그에 남지 않음 |

**파싱** (801–833줄)
- 루트부터 재귀로 내려가며 `m:ResourceTypes` 요소의 텍스트만 꺼낸다. DTO에 채워지는 값은 `resourceTypes` 하나뿐이다.
- 파서가 namespace-aware가 아니어서 노드 이름을 접두어째 비교한다. 접두어 `m:`가 하드코딩되어 있다.
- `Parameter` 분기와 `colTable`은 이 요청에서 실행되지 않는다. ② 파서에서 복사해 온 흔적으로 보인다.

**기준일자** (732–734줄)
- `NVL(MAX(CRTR_YMD), 오늘)` from `TN_PM_SMLT_DALY_CRTR_YMD` where `USE_YN='Y'`. AGENTS.md §8과 일치한다.
- 이 흐름에서는 FS001 · CA001 · SBD001을 목록에 넣을지 판정하는 데에만 쓰인다.

**플래그 매핑** (780–799줄)
- `resourceTypes`에 `contains`를 걸어 Yn 플래그를 `"1"` 또는 `""`로 채운다. SQL 블록마다 `AND #{xxYn} = 1`이 붙어 있어, `''`(Oracle에서는 NULL)이면 그 블록이 꺼진다.

| 요청 유형 | 켜지는 플래그 |
|---|---|
| `CASTModel` | `modelYn` |
| `CASTExpressModel` | `exModelYn` |
| `FlightSchedule` | `flightYn` |
| `CounterAllocation` | `counterYn` + `sbdYn` |
| `GenericTable` | `stYn` · `ctYn` · `dgYn` · `immiYn` · `emiYn` · `scYn` · `tsYn` · `rptYn` · `ifYn` 9개가 한꺼번에 |
| `PropertySet` | `handleYn` |

**목록 SQL** (`java/mapper/CastApiMapper.xml` 4–214줄)

| 유형 | ResourceID | 목록에 나오는 조건 | LastModified 출처 |
|---|---|---|---|
| CASTModel / Express | `SMLT_MDL_EXPLN` | 모델 `DEL_YN='N'`, 유형 코드 1/2 | 모델 수정일 |
| FlightSchedule | `FS001` | GO `TI_GO_DALY_ARR_DEP`에 기준일자 행이 있을 때만 | GO 최대 `LAST_MDFCN_DT` |
| 〃 | `FS`+번호 | `SCHDL_MSTR.USE_YN='Y'`이고 ATRB 행이 있을 때 | 마스터 수정일 |
| CounterAllocation | `CA001` · `SBD001` | GO `TI_GO_CKNCT_DALY_ALOT`에 기준일자 행이 있을 때만 | 해당 행 |
| 〃 | `CA`+번호 · `SBD`+번호 | 마스터 `USE_YN='Y'`이고 ATRB 행이 있을 때 | 마스터 수정일 |
| PropertySet | `PS`+그룹ID | `FIX_ATRB_GROUP.DEL_YN='N'` (001 · 002~499 · 999 전부) | 그룹 수정일 |
| 〃 | `PRPT_STNG_RSRC_ID` (PS5xx) | `USER_MSTR`에 행이 있을 때 | 최초 등록일 (고정) |
| GenericTable 8종 | 접두어+번호 | 각 마스터 `USE_YN='Y'` | 마스터 수정일 |
| 〃 | `WhatIfDefinitionTable` | 항상 | `SYSDATE` |

- `WhatIfDefinitionTable`의 LastModified가 매번 현재 시각이어서 CAST가 폴링마다 다시 받아 간다. §11.3의 New 요청 polling이 동작하는 지점이다.
- 사용자 요청이 삭제되면 `USER_MSTR` 행이 사라져 해당 PS5xx도 목록에서 빠진다(§11.4와 일치).

**응답 조립** (835–900줄)
- SOAP 봉투 안에 `<m:ResourceInfo ResourceType ResourceID Author Description LastModified/>`를 반복하고 `InvocationResult Result="true|false"`를 붙인다.
- SQL의 `tableID` 컬럼은 응답에 쓰이지 않는다.

**`context.addException`의 의미** (774줄)

```
서비스 catch (IllegalState | ParserConfig | SAX | IO)
   → context.addException(e)       ← 스택트레이스를 출력하는 람다만 쌓아 둠
   → Result="false" XML 반환        ← HTTP 200, 목록은 비어 있음
Executor finally
   → 설정의 errorMsg가 켜져 있고 context에 오류가 있으면 로그 테이블에 저장
```

- `addException`은 응답에 영향을 주지 않는다. 응답을 바꾸는 것은 `buildResponseXml(..., false)`다.
- 실패 응답의 `dbResults`는 사실상 항상 `null`이다. 잡히는 예외가 모두 mapper 호출 전에 나기 때문이다.
- 서비스가 잡지 않는 예외:
  - `DataAccessException` 계열: Executor가 context에 넣고 다시 던진다. 로그에 남고 HTTP 오류로 나간다.
  - 그 밖의 RuntimeException(`ClassCastException`, NPE 등): Executor도 잡지 않아 errorMsg 로그에 남지 않는다. payload 로그만 남는다.

**확인 포인트**
1. 일일 리소스(FS001 · CA001 · SBD001)는 기준일자의 GO 자료가 들어온 뒤에만 목록에 나온다. 자료가 없을 때 CAST가 이전 버전을 쓰는지 실행을 건너뛰는지는 CAST 쪽 확인이 필요하다.
2. 응답 XML 속성값을 이스케이프하지 않는다(874–899줄). `SMLT_MDL_EXPLN`에 `"` · `&` · `<`가 섞이면 응답이 깨지고, null이면 `"null"`이 찍힌다.
3. `ResourceTypes`가 없거나 접두어가 `m:`가 아니면 플래그가 전부 null로 바인딩된다. `jdbcTypeForNull` 설정이 이 레포에 없어 실제 백엔드에서 Oracle 오류가 날지 빈 목록이 될지 확인해야 한다.
4. PropertySet 목록에 카테고리 002~499와 999가 모두 노출된다. 의도한 노출인지 확인이 필요하다.
5. 사소한 것: 이 SQL의 `parameterType`이 실제 객체(`CastReqGetResourceInformationDto`)와 다르게 선언돼 있지만 동작에는 문제가 없다. `"CASTModel"`과 `"CASTExpressModel"`은 서로 포함 관계가 아니어서 `contains` 오탐이 없다.

**3단계로 가져갈 공통 패턴**
- 본체는 `colTable.remove()` → `setBaseYmd`로 시작한다. ②도 같다.
- 실패하면 `context.addException` 후 실패 응답을 돌려준다. ②에서는 실패 응답이 `INVALID_REQUEST` 문자열이다.
- `Parameter` 분기와 `colTable`은 ② 파서에서 실제로 쓰인다.

### 4.2 ② 리소스 발행 진입과 분기 (C4)

목록을 받은 CAST는 리소스를 하나씩 `REQ_GetResource.do`로 요청한다. 이 구간은 요청을 해석해 알맞은 핸들러로 보내는 관문이고, 사용자 PropertySet 치환도 여기서 처리한다.

```
retrieveResource(param, context)                                :907
 └ retrieveResource(parser, context)                            :921  ← 본체
    ├ colTable.remove()
    ├ parser.parse() → resourceList                             (XML → resourceType · resourceID)
    ├ setBaseYmd(resolveBaseYmd())
    ├ [PropertySet이면]
    │   ├ executionMapper.retrievePropertySetRequest(id)        (USER_MSTR에서 PS5xx 찾기)
    │   ├ 찾음        → renderUserPropertySet(request)  ──→ 바로 return
    │   └ PS500~998인데 없음 → IllegalStateException
    └ processResourceData(type, dto, sb, context)               :1059 ← switch 분기
```

진입 오버로드 3개와 파서 람다 구조는 ①과 같다.

**요청 파싱** (985–1021줄)

요청 형식 두 가지를 모두 받는다.

| 형식 | 읽는 위치 |
|---|---|
| `<Parameter id="ResourceType">FlightSchedule</Parameter>` | `id` 속성으로 칸을 정하고 텍스트를 읽음 |
| `<m:ResourceDescription ResourceType="…" ResourceID="…"/>` | 속성을 직접 읽고, 없으면 `""` |

- 여기서 `colTable`은 `set`한 값을 바로 다음 줄에서 `get`하는 지역 변수 역할만 한다. 상태를 실제로 이어서 쓰는 곳은 ③ 결과 파서(2827–2843줄)뿐이다.

**PropertySet 3갈래**

| 요청 ID | USER_MSTR 행 | 처리 |
|---|---|---|
| PS500~998 | 있음 | `renderUserPropertySet`: PS001을 렌더한 뒤 ID 치환 |
| PS500~998 | 없음 (삭제됐거나 원래 없음) | `IllegalStateException` → `INVALID_REQUEST` |
| PS001 · 002~499 · 999 | 해당 없음 | `processResourceData` → `handlePropertySet` 직행 |

- "PS500~998" 범위 판정이 SQL(`java/mapper/CastExecutionMapper.xml` 117–121줄)과 Java(938–944줄)에 두 번 들어 있다. 둘 다 3자리 문자열 비교라 결과는 같다.
- 요청이 삭제되면 두 번째 줄로 떨어진다. §11.4의 "삭제된 요청은 해당 사용자 PS의 재조회를 종료한다"가 이 동작이다.

**사용자 PS 치환** (`renderUserPropertySet`, 958–983줄)

PS001에 실리는 참조 ID는 `retrievePropertySetId`(`CastApiMapper.xml` 1326–1391줄)가 정한다. 시설 마스터 8곳에서 `ATRB_ID = '001'`인 행을 찾아 붙인다.

| PS001에 실리는 참조 | 사용자 PS에서 | 치환 값 (USER_MSTR) |
|---|---|---|
| `PS001` (자기 ID) | 치환 | `prptStngRsrcId` |
| `SBD001` | 치환 | `sbdCntrlAlctnId` |
| `FacilityOpeningTable_DepartureGate001` | 치환 | `fcltyOpngDptcnySrngRsrcId` |
| `FacilityOpeningTable_SecurityControl001` | 치환 | `fcltyOpngScrtyCntrlRsrcId` |
| `FacilityOpeningTable_Immigration001` | 치환 | `fcltyOpngEntcnyRsrcId` |
| `FacilityOpeningTable_TransferSecurityControl001` | 치환 | `fcltyOpngTrScrtyCntrlRsrcId` |
| `FacilityOpeningTable_Emigration001` | 그대로 | — |
| `CheckinType001` | 그대로 | — |
| `CheckInCounterServiceTime001` | 그대로 | — |

- 그대로 두는 세 줄은 §11.3의 "체크인유형·서비스시간·출국심사는 001 원천"과 일치한다.
- FS와 CA는 PS에 실리지 않는다. 사용자 실행의 FS · CA 번호는 `WhatIfDefinitionTable`을 거쳐 CAST에 전달된다(4단계 C8의 `handleWhatIfControl`).
- 치환은 XML 문자열 전체에 정규식을 걸어 처리한다. 키 6개가 모두 긴 접두어로 시작해 `SecurityControl001`과 `TransferSecurityControl001`이 서로 잘못 걸리지 않는다.
- `request.getExcnYmd()`를 기준일자로 넘기지만, PS 조회 SQL 5개(Mst · Svc · Pax · PaxDtl · Id)에는 날짜 바인딩이 없다. 그래서 사용자 PS의 내용은 실행 시점이 아니라 CAST가 가져가는 시점의 PS001이다. §11.3의 "원천에 대한 의도된 변경은 그대로 참조"와 같은 동작이다(실행과 CAST 수신 사이에 운영 반영이 일어나면 새 값이 들어간다).

**PS001 내용 검사** (`renderBasePropertySetXml`, 1023–1057줄)

- PS001을 렌더한 뒤 다시 파싱해 `PName="values"` 칸에 값이 하나라도 있는지 본다. 없으면 "CAST 입력 내용이 없습니다", XML이 깨졌으면 "CAST 입력 XML이 유효하지 않습니다"로 실패한다.
- PS001 그룹 행이 없으면 `handlePropertySet`이 `Result="false"` 껍데기를 만들고, 칸이 없으므로 첫 번째 실패로 이어진다.

**디스패처** (`processResourceData`, 1059–1104줄)

| ResourceType | 판정 | 핸들러 (4단계 청크) |
|---|---|---|
| `FlightSchedule` | — | `handleFlightSchedule` (C5) |
| `CounterAllocation` | ID에 `CA`가 있으면 | `handleCounterAllocation` (C5) |
| 〃 | 그 밖 | `handleSbdAllocation` (C5) |
| `PropertySet` | — | `handlePropertySet` (C6) |
| `CASTModel` · `CASTExpressModel` | — | `handleCastModel` (C7) |
| `GenericTable` | ID `contains` 9단 체인 | ServiceTime · CheckinType · DepartureGate · Emigration · Immigration · SecurityControl · TransferSecurityControl · ReportingProfiles · WhatIf (C8) |
| 그 밖 | `default` | `addFailure` + `<error>Unsupported Resource Type</error>` |

GenericTable 체인의 접두어끼리는 포함 관계가 없어 판정 순서에 따른 오분기는 없다.

**실패 응답 정리**

같은 API인데 실패 형태가 다섯 가지다.

| 상황 | 응답 본문 | errorMsg 로그 |
|---|---|---|
| XML 파싱 실패 · `IllegalStateException` | `Invalid Request: …` (SOAP 아님) | 남음 (`addException`) |
| 지원하지 않는 ResourceType | `<error>Unsupported Resource Type</error>` (SOAP 아님) | 남음 (`addFailure`) |
| PS 그룹 행 없음 (직접 요청) | SOAP `Result="false"` | 안 남음 |
| GenericTable인데 9종 어디에도 안 맞음 | 빈 문자열 | 안 남음 |
| 요청에 ResourceType 자체가 없음 | `switch(null)` NPE → HTTP 500 | 안 남음 (Executor도 NPE는 잡지 않음) |

**확인 포인트** (중요한 순서)
1. **ServiceTime ID의 대소문자가 맞지 않는다.** PS001이 참조로 싣는 ID는 `CheckInCounterServiceTime001`(대문자 I, `CastApiMapper.xml` 1388줄)이다. 목록 SQL(138줄), 디스패처(1082줄), 조회 SQL의 `REGEXP_REPLACE`(`CastApiMapper.xml` 1873줄)는 모두 소문자 i(`Checkin…`)를 대소문자 구분으로 비교한다.
   - CAST가 PS에 적힌 ID 그대로 요청하면 GenericTable 체인을 모두 빠져나가 로그 없이 빈 응답이 나간다.
   - §11.4에 "CAST가 결과에서 이 ID를 대소문자를 다르게 돌려보낸다"는 기록이 있다. CAST 안에서는 PS 쪽 표기를 쓰고 있다는 뜻이다.
   - 실제 요청 표기는 GetResource payload 로그(Executor가 설정에 따라 저장)의 `ResourceID`로 확정한다.
2. **GenericTable 미매칭이 조용히 빈 응답으로 나간다.** 1번이 실제로 일어나면 원인을 찾을 단서가 남지 않는다. 끝에 `else { addFailure(...); sb.append(RESOURCE_ERROR); }`가 있으면 추적할 수 있다.
3. **참조가 빠져도 치환이 조용히 넘어간다.** `renderUserPropertySet`은 치환 값이 null인지만 검사하고, 키가 PS001 XML에 실제로 있었는지는 보지 않는다. 시설 마스터에 `'001'` 행이 없으면 참조 줄이 UNION에서 빠지고, 사용자 PS도 그 시설 참조 없이 발행된다.
4. **PS001 내용 검사가 사용자 경로에만 있다.** 일일 실행이 PS001을 직접 요청하면 값이 비어 있어도 `Result="true"`로 나간다.
5. **실패 응답 형식이 제각각이다**(위 표). CAST가 SOAP가 아닌 본문이나 빈 본문을 어떻게 처리하는지는 CAST 쪽 확인이 필요하다.
6. 낮은 우선순위: 카테고리 PS(002~499)를 직접 요청하면 `retrievePropertySetId`가 같은 번호의 시설 마스터를 찾는다. 보통 없어서 참조 줄이 빠진 PS가 나간다. §4.1 확인 포인트 4(카테고리 PS 목록 노출)와 이어진다.

**4단계로 가져갈 것**
- 핸들러는 모두 `(idto, sb)`를 받아 `sb`에 SOAP을 직접 쓴다. 실패 시 각자 `Result="false"`를 쓰는지, 아무것도 쓰지 않는지 핸들러마다 비교한다.
- C5 · C8은 SQL에서 `REPLACE` / `REGEXP_REPLACE`로 ID 접두어를 떼고 번호를 얻는 패턴이 반복된다. 확인 포인트 1의 대소문자 문제가 다른 핸들러에도 있는지 같이 본다.

---

## 5. 다음 작업

**4단계 — ② 핸들러**: C5(1106–1274줄) → C8(1986–2449줄 + 3097–3180줄) → C7(1929–1985줄) → C6(1275–1928줄) 순서. 핸들러가 많아 C5부터 끊어 진행한다.

- 청크마다 §3의 비교표(핸들러 / mapper 메서드 / FIELD_MAP / baseYmd·번호 사용 / 특이점)를 채운다.
- 실패 시 응답 형태와 §4.2의 "4단계로 가져갈 것" 두 항목을 같이 본다.
- SQL 대조 대상(§11.3): SBD `AirlineCode`, 키오스크 `SUBSTR(ID,-3,1)`, `OPER_END_DT` HHMI, `CHKN_TYPE_CD='C'`, DepartureGate 레인 분배.

새 세션에서 이어 갈 때 요청 예시:

> `docs/cast-api-service-analysis.md`를 읽고 4단계(C5)부터 이어서 분석해줘. 끝나면 이 문서 §4에 결과를 추가하고 §5를 갱신해줘.
