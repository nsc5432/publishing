# CastApiServiceImpl 분석 노트

`java/castapi/service/impl/CastApiServiceImpl.java`(3,255줄)를 청크 단위로 나눠 분석한 기록이다.
다른 세션에서 이어 갈 때는 이 문서의 **§5 다음 작업**부터 시작한다.

- 기준 커밋: `e486b22` (2026-11-17). 줄 번호는 이 커밋 기준이므로 파일이 바뀌면 메서드명으로 다시 찾는다.
- 진행 상황: 1단계(골격) 훑기 완료 · **2단계(① 리소스 목록) 완료** · 3단계부터 미진행

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
| C4 | 902–1105 | ② 진입 · 분기 | `retrieveResource`, 사용자 PS(PS500~998) 분기, `renderUserPropertySet`, `renderBasePropertySetXml`, `processResourceData` switch | 정독 (핵심) |
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
3. **② 발행 진입** (C4): `processResourceData` switch로 유형 → 핸들러 지도를 그리고, `renderUserPropertySet` 치환을 AGENTS.md §11.3과 대조
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

1. GenericTable 분기(`processResourceData`, 1080–1099줄)에 마지막 `else`가 없다. 어떤 ID에도 맞지 않으면 실패 기록 없이 빈 문자열을 응답한다.
2. 분기 판정이 `contains()` 기반이다(CounterAllocation은 `contains("CA")`). 상수끼리 포함 관계가 없는지 확인한다.
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

---

## 5. 다음 작업

**3단계 — C4 (902–1105줄)**: `retrieveResource` 진입, 사용자 PS 분기, `processResourceData` 디스패처.

미리 본 내용:
- `resourceType == PropertySet`이면 `executionMapper.retrievePropertySetRequest(resourceID)`로 사용자 요청을 찾는다. 있으면 `renderUserPropertySet`으로 처리하고, 없는데 ID가 `PS500`~`PS998`이면 "등록되지 않은 사용자 PropertySet" 예외를 던진다.
- `renderUserPropertySet`은 `renderBasePropertySetXml(excnYmd)`로 PS001 XML을 만든 뒤 6개 참조(PS001 · SBD001 · DepartureGate001 · SecurityControl001 · Immigration001 · TransferSecurityControl001)를 정규식으로 요청의 리소스 ID로 치환한다. 참조가 하나라도 비면 예외를 던진다.
- 실패 응답은 `INVALID_REQUEST`, 지원하지 않는 유형은 `context.addFailure` + `RESOURCE_ERROR`다.

새 세션에서 이어 갈 때 요청 예시:

> `docs/cast-api-service-analysis.md`를 읽고 3단계(C4)부터 이어서 분석해줘. 끝나면 이 문서 §4에 결과를 추가하고 §5를 갱신해줘.
