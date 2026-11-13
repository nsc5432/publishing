# Sparrow SAST 취약점 조치 계획 — 체커별 12단계

- 작성: 2026-11-13
- 대상: 2026-11-10 Sparrow SAST 진단 `aoms-pm` 138건 (전부 `신규` · `미확인`)
- 진행 방식: **한 세션에 한 단계.** 세션을 시작하면 §0 을 읽고 §0.7 진행 현황에서 다음 단계를 고른다.
  단계를 마치면 진행 현황과 해당 단계의 '결과' 칸을 갱신한다.

---

## 0. 새 세션이 먼저 알아야 할 맥락

### 0.1 진단 자료

| 자료 | 위치 | 내용 |
|---|---|---|
| 진단 결과 목록 | `보안점검결과/인천국제공항공사 고도화 구축 사업 소스코드 취약점 진단 결과 목록_aoms-pm.xls` | 시트 `issues`, 138행 × 20열 (ID · 위험도 · 체커 키 · 라인 · 파일명 · 함수 · 경로 · 이슈 상태 · 이슈 의견 · 소스 코드 …) |
| 조치가이드 | `보안점검결과/인천국제공항공사 고도화 구축 사업 소스코드 취약점 조치가이드_aoms-pm.pdf` | Sparrow 보고서 원문 82쪽. 체커별 일반 예시 · 해결 방법과 이슈별 코드 발췌. 우리 코드에 맞춘 지침은 없다 |

- 분석 일시 2026-11-10 13:08~13:21, 체커 그룹 `인천국제공항공사_SAST`, 기준 **행안부 보안약점 2021** (Javascript 2022 는 0건 · 적합).
- 스캔 대상은 실제 백엔드 레포 `C:\source\workspace_aoms\aoms-pm` (확장자 html · java · properties · xml).
- 위험도: 매우위험 128 · 위험 9 · 높음 1. 같은 줄이 여러 번 잡혀 실제 조치 위치는 95곳이다.

**자료 읽는 법** — 이 PC 에는 `xlrd` 가 없고 `pdftoppm` 도 없다.

```bash
python -m pip install --quiet --target "<scratchpad>/pylib" xlrd   # sys.path.insert(0, '<scratchpad>/pylib') 후 xlrd.open_workbook
python -c "import fitz; ..."                                       # PDF 텍스트는 PyMuPDF(fitz)로 뽑는다 (설치돼 있음)
```

이 계획서에 단계별 이슈 ID · 위치 · 지적 코드를 모두 옮겨 두었으므로, 원본은 확인이 필요할 때만 연다.

### 0.2 확정된 결정

1. **소명(오탐 처리)은 하지 않는다. 138건 전부 코드로 조치한다.** 서버 상수 · enum 에서 온 안전한 값이라도
   검출 형태(예: 매퍼의 `${}`)가 남으면 조치 대상이다.
2. 재발 방지 규칙은 이미 `AGENTS.md` **§16 보안약점 재발 방지** 에 들어가 있다 (2026-11-13). 각 단계의 조치는 §16 을 따른다.

### 0.3 저장소 제약

- 이 레포의 `java/` 는 **참조 사본**이다. 빌드 파일이 없고 디렉터리가 패키지와 맞지 않아 **여기서 컴파일 · 재진단할 수 없다.**
  확정된 수정은 실제 백엔드 레포에 반영해 빌드 · 동작 확인 · Sparrow 재분석을 해야 한다.
- 스캔 경로 → 레포 경로 대응:

  | 스캔 경로 (`aoms-pm/src/main/…`) | 이 레포 |
  |---|---|
  | `java/aoms/pm/cast/…` | `java/cast/…` |
  | `java/aoms/pm/castapi/…` | `java/castapi/…` |
  | `resources/aoms/mapper/pm/*.xml` | `java/mapper/*.xml` |
  | `java/aoms/pm/castrest/…` | `java-sast-external/castrest/…` (원본 입고 완료, §0.4) |
  | `java/aoms/pm/adtoper/…` | `java-sast-external/adtoper/…` (원본 입고 완료, §0.4) |
  | `java/aoms/pm/bdpsgance/…` | `java-sast-external/bdpsgance/…` (원본 입고 완료, §0.4) |

- `java-sast-external/` 는 누락된 4개 Java 원본을 받아 보안 조치하는 별도 작업 폴더다. `java/` 와 마찬가지로
  이 저장소에서는 컴파일 · 재진단할 수 없으며, 수정 후 실제 백엔드의 원래 경로에 반영한다.

- **라인 번호 드리프트**: 매퍼 XML 은 스캔 라인과 현재 라인이 같다. Java 서비스는 11-10 이후 커밋으로 몇 줄 밀린 곳이 있어
  아래 표에 `스캔 → 현재` 를 함께 적었다. 착수 시 함수명과 지적 코드로 다시 찾는다.

### 0.4 별도 폴더 대상 4개 파일 (55건) — 원본 입고 완료 · 직접 조치 대기

| 작업 경로 (저장소 루트 기준) | 건수 | 체커 |
|---|---|---|
| `java-sast-external/adtoper/controller/AdtOperHrMngController.java` | 34 | 경로 조작 12 · 자원 삽입 16 · HTTP 응답 분할 6 |
| `java-sast-external/adtoper/service/impl/AdtOperHrMngServiceImpl.java` | 1 | 부적절한 예외 처리 |
| `java-sast-external/bdpsgance/controller/BdpsgAnceInqController.java` | 10 | 경로 조작 4 · 자원 삽입 4 · HTTP 응답 분할 2 |
| `java-sast-external/castrest/service/impl/CastRestServiceImpl.java` | 10 | 세션 간 데이터 누출 4 · 표준 널 반환 4 · XXE 1 · 정수 오버플로우 1 |

- **작업 방식 확정 (2026-11-13 사용자 요청)**: 위 4개 파일은 `java-sast-external/` 에 원본을 넣고 이 저장소에서 직접 수정한다.
  원본 확보 방법 · 직접 수정 여부를 다시 묻지 않는다. **2026-11-13 Java 원본 4개 입고를 완료**했으며, 보안 조치는 아직 시작하지 않았다.
- 실제 백엔드 `src/main/java/aoms/pm/` 아래의 원본을 위 경로로 복사한다. 패키지 선언 · 클래스명 · 기존 주석을 유지하고,
  빈 Java 파일이나 대역 구현을 만들어 원본을 대신하지 않는다. 단계별 표의 `adtoper/…` · `bdpsgance/…` · `castrest` 표기는 위 작업 경로를 뜻한다.
- 해당 단계(2 · 3 · 4 일부, 8 · 9 · 10 · 11 · 12 전부)에 착수할 때 필요한 원본의 존재를 확인한다. 파일이 없으면 해당 부분만
  입고 대기로 남기고 다른 진행 가능한 작업을 수행한다. 입고 후에는 함수명 · 지적 코드로 위치를 다시 찾아 스캔 라인과 현재 라인을 대조한다.
- **D-castrest (확정)**: `castrest` 원본의 10건을 단계 2 · 3 · 4 · 8 에서 코드로 조치한다. `castapi` 는 대체 구현이자 참고 대상이다.
  AGENTS §11.3 의 컨트롤러 등록 제약은 유지하며, `castrest` 삭제 · 빌드 제외로 조치를 대신하지 않는다.
- **D-download (확정)**: AdtOperHrMng · BdpsgAnce 다운로드 2곳은 단계 9~12 에서 위 사본을 직접 수정한다.
  관련 서비스 · 공용 유틸 · 라이브러리의 계약을 확인할 자료가 부족하면 필요한 원본을 추가로 확보하며, 추측으로 구현하지 않는다.

### 0.5 공통 작업 규칙

- **해당 단계의 체커만 고친다.** 다른 체커 위치를 지나가다 보여도 그 단계로 남긴다 (진행 현황이 어긋나지 않게).
  예외: 같은 함수 안에서 같은 패턴인데 진단에 빠진 곳(예방 조치)은 고치되 결과 칸에 적는다.
- AGENTS §5: Java 빈 값 검사는 `isEmpty()`, 포괄 `catch(Exception/RuntimeException/Throwable/NullPointerException)` 금지,
  null 은 사전 검사. 새 주석은 꼭 필요할 때만 한 줄, **기존 주석은 삭제 · 수정하지 않는다.**
- 동작을 바꾸지 않는다. null 처리에서 "산정 불가 = null" 의미(§13 · §14)를 유지하고, 데이터 오류는 업무 예외로 올린다.
- 커밋은 사용자가 요청할 때만 한다. 메시지 형식은 기존 이력(`fix(pm): …`)을 따르고 단계 번호 · 체커 키를 본문에 남긴다.

### 0.6 검증 기준

- 이 레포에서 할 수 있는 것: diff 검토, `git diff --check`, 매퍼 `${` 잔존 검사(`rg -n '\$\{' --glob '*.xml' java/mapper`, 주석 줄 제외).
- `java/verify` 는 `FcltWtngDay` 등 시설 대기 도메인을 고친 단계(4)에서만 선택한다. 컴파일 클래스 경로 · Lombok
  (`PM_VERIFY_CLASSPATH` · `PM_VERIFY_LOMBOK_JAR`)이 없으면 **실행 불가로 보고**하고 대역 클래스를 만들지 않는다 (`java/verify/README.md`).
- 프런트(`react/`)는 이 작업으로 바뀌지 않는다. `tsc` · `eslint` · `npm run verify:*` 대상이 아니다.
- 각 단계의 '실백엔드 확인' 항목은 실제 백엔드에 반영할 때 확인할 목록이다. 이 레포에서 끝낸 것으로 보고하지 않는다.

### 0.7 진행 현황

| 단계 | 체커 키 | 체커명 | 건수 | 기존 사본 / 별도 폴더 대상 | 상태 |
|:--:|---|---|:--:|---|---|
| 1 | `RESOURCE_LEAK` | 자원 누수 | 1 | 1 / 0 | 레포 반영 |
| 2 | `INTEGER_OVERFLOW` | 정수 오버플로우 | 2 | 1 / 1 (castrest) | 레포 반영 |
| 3 | `IMPROPER_REFERENCE_XML_EXTERNAL_ENTITY` | 부적절한 XML 외부 개체 참조 | 2 | 1 / 1 (castrest) | 레포 반영 |
| 4 | `NULL_RETURN_STD` | 표준 라이브러리의 널 반환 값 역참조 | 9 | 5 / 4 (castrest) | 레포 반영 |
| 5 | `NULL_RETURN` | 널 반환 값 역참조 | 4 | 4 / 0 | 대기 |
| 6 | `UNCHECKED_NULL` | 누락된 널 값 검사 | 3 | 3 / 0 | 대기 |
| 7 | `SQL_INJECTION.MYBATIS` | myBatis에서의 SQL 삽입 | 68 | 68 / 0 | 대기 |
| 8 | `DATA_LEAK_BETWEEN_SESSIONS` | 세션 간 데이터 누출 | 4 | 0 / 4 (castrest) | 대기 |
| 9 | `IMPROPER_CHECK_FOR_UNUSUAL_OR_EXCEPTIONAL_CONDITION` | 부적절한 예외 처리 | 1 | 0 / 1 | 대기 |
| 10 | `PATH_TRAVERSAL` | 경로 조작 | 16 | 0 / 16 | 대기 |
| 11 | `RESOURCE_INJECTION` | 자원 삽입 | 20 | 0 / 20 | 대기 |
| 12 | `HTTP_RESPONSE_SPLITTING` | HTTP 응답 분할 | 8 | 0 / 8 | 대기 |
| | | **합계** | **138** | **83 / 55** | |

별도 폴더 대상 55건의 원본 4개는 입고 완료됐으며, 조치 상태는 모두 대기다. 원본 입고를 보안 조치 완료로 간주하지 않는다.

순서는 기존 사본의 작고 독립적인 단계 → 큰 단계(SQL) → 별도 폴더 단계다. 단계끼리 코드 의존은 없지만,
**10 · 11 · 12 는 같은 다운로드 메서드의 같은 줄**이라 이어서 진행하는 편이 좋다.
상태 값: `대기` · `진행` · `레포 반영` (이 레포 수정 끝) · `실백엔드 반영` · `재진단 통과`.

---

## 1단계 — 자원 누수 `RESOURCE_LEAK` (1건, 높음)

행안부 05.02 부적절한 자원 해제 · AGENTS §16.7

| ID | 파일 : 라인 (스캔 → 현재) | 함수 | 지적 코드 |
|---|---|---|---|
| 673 | `java/castapi/log/CastApiContext.java` : 26 → 26 | `formatErrors` | `PrintWriter writer = new PrintWriter(output);` |

**조치**
- `PrintWriter` 를 try-with-resources 로 연다. `StringWriter` 는 닫을 필요가 없지만 감싼 `PrintWriter` 가 검출됐으므로 같은 형태로 쓴다.
- 반환값 `output.toString()` 은 try 블록 안에서 `writer.flush()` 뒤에 읽거나, 블록이 닫힌 뒤에 읽는다 (내용이 빠지지 않게).

**완료 기준**: 출력 문자열이 바뀌지 않는다. 실백엔드에서 CAST API 오류 로그 한 건이 이전과 같은 형식으로 남는지 확인한다.

**결과**: 레포 반영 (2026-11-13)
- `CastApiContext.formatErrors` 의 `PrintWriter` 를 try-with-resources 로 열었다. 본문 · `writer.flush()` 는 블록 안에 두고,
  `output.toString()` 은 블록이 닫힌 뒤 읽는다. `PrintWriter.close()` 는 버퍼를 비운 뒤 `StringWriter.close()`(동작 없음)를 부르므로 출력 문자열은 같다.
- 같은 클래스에 다른 `AutoCloseable` 생성 지점은 없다 (예방 조치 대상 없음).
- 원래 빈 줄 2개에 있던 후행 공백을 들여쓰기 변경과 함께 없앴다 (출력과 무관).
- 이 레포에서는 컴파일 불가(§0.3). 검증은 diff 검토 · `git diff --check` 만 했다.
- 실백엔드 확인 대기: 빌드, CAST API 오류 로그 1건이 이전과 같은 형식(`API 유형 코드=…` · `오류[n]` · 스택트레이스/사유)으로 남는지.

---

## 2단계 — 정수 오버플로우 `INTEGER_OVERFLOW` (2건, 위험)

행안부 01.14 정수형 오버플로우 · AGENTS §16.5

| ID | 파일 : 라인 (스캔 → 현재) | 함수 | 지적 코드 |
|---|---|---|---|
| 675 | `java/castapi/service/impl/CastApiServiceImpl.java` : 3218 → 3218 | `updateWhatIf` (`private int`, 3154행) | `rRslt += updated;` (`updated` = `castApiMapper.updateWhatIfDefinitionTableStts(wDto)`) |
| 680 | castrest `CastRestServiceImpl.java` : 3300 | `updateWhatIf` | `rRslt += updated;` (`castRestMapper.updateWhatIfDefinitionTableStts`) |

**조치**
- `rRslt = Math.addExact(rRslt, updated);` 로 바꾼다. 반환 타입 `int` 는 유지한다(호출부 2523행).
  `ArithmeticException` 을 잡아 넘기지 않는다 (실제로 넘칠 수 없는 건수라 예외가 나면 버그다).
- ID 680 은 §0.4 의 별도 폴더에 입고된 `CastRestServiceImpl.java` 에 같은 누적 연산 조치를 적용한다.

**완료 기준**: 갱신 건수 합계가 이전과 같다. 실백엔드에서 WhatIf 상태 통보(Executing / Finished)가 정상 처리되는지 확인한다.

**결과**: 레포 반영 (2026-11-13)
- ID 675: `CastApiServiceImpl.updateWhatIf` 3218행 `rRslt += updated;` → `rRslt = Math.addExact(rRslt, updated);`.
- 예방 조치: 같은 함수 3223행 상태 목록에 없는 요청 삭제 건수 누적 `rRslt += castApiMapper.deleteWhatIfDefinitionTable(runId);` 도
  같은 형태라 `Math.addExact` 로 바꿨다 (진단에는 없음).
- ID 680: `java-sast-external/castrest/service/impl/CastRestServiceImpl.java` `updateWhatIf` 의 같은 누적을 바꿨다.
  스캔 3300 → 현재 3299행. castrest 의 이 함수에는 삭제 누적이 없다.
- 반환 타입 `int` · 호출부는 그대로다. `ArithmeticException` 은 잡지 않는다 (넘치면 버그).
- 이 레포에서는 컴파일 불가(§0.3). 검증은 diff 검토 · `git diff --check` 만 했다.
- 실백엔드 확인 대기: 빌드, WhatIf 상태 통보(Executing / Finished)와 상태 목록에 없는 요청 삭제가 정상 처리되는지.

---

## 3단계 — XML 외부 개체 참조 `IMPROPER_REFERENCE_XML_EXTERNAL_ENTITY` (2건, 위험)

행안부 01.08 부적절한 XML 외부개체 참조 · AGENTS §16.4

| ID | 파일 : 라인 (스캔 → 현재) | 함수 | 지적 코드 |
|---|---|---|---|
| 773 | `java/castapi/service/impl/CastApiServiceImpl.java` : 2465 → 2465 | `parseXmlSafely` | `DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();` |
| 774 | castrest `CastRestServiceImpl.java` : 2456 | `parseXmlSafely` | 같은 코드 (주석 "소나큐브 필수 보안 설정") |

현재 설정: `DISALLOW_DOCTYPE_DECL=true`, `EXTERNAL_GENERAL_ENTITIES=false`, `EXTERNAL_PARAMETER_ENTITIES=false`,
`setXIncludeAware(false)`, `setExpandEntityReferences(false)`. **빠진 것은 attribute 2개다.**

**조치**
- `dbf.setAttribute(XMLConstants.ACCESS_EXTERNAL_DTD, "");` · `dbf.setAttribute(XMLConstants.ACCESS_EXTERNAL_SCHEMA, "");` 를 추가한다
  (`javax.xml.XMLConstants` import).
- ID 774 는 §0.4 의 별도 폴더에 입고된 `CastRestServiceImpl.java` 에 같은 두 줄을 넣는다.

**주의**: 클래스패스에 JAXP 1.5 이전의 구형 Xerces 가 먼저 잡히면 `setAttribute` 가 `IllegalArgumentException` 을 던진다.
실백엔드에서 CAST 요청(`REQ_GetResourceInformation` · `REQ_GetResource` · `REQ_SetResource`) 파싱이 정상인지 반드시 확인한다.

**완료 기준**: 정상 XML 파싱 결과가 같고, DOCTYPE 이 든 요청은 이전처럼 거부된다.

**결과**: 레포 반영 (2026-11-13)
- ID 773: `CastApiServiceImpl.parseXmlSafely` 에 `ACCESS_EXTERNAL_DTD` · `ACCESS_EXTERNAL_SCHEMA` attribute 2줄을 feature 3개 뒤에 넣고
  `javax.xml.XMLConstants` 를 import 했다. import 1줄이 늘어 함수는 2464 → 2465행, 지적 줄은 2466행이 됐다.
- ID 774: `java-sast-external/castrest/service/impl/CastRestServiceImpl.java` `parseXmlSafely` 에 같은 2줄 · import 를 넣었다.
  스캔 2456 → 현재 2456행(import 추가 후). 기존 주석("소나큐브 필수 보안 설정")은 그대로 뒀다.
- 이로써 두 함수 모두 AGENTS §16.4 의 7개 설정을 갖춘다. 파싱 경로는 클래스마다 `parseXmlSafely` 하나뿐이고 호출부는 바꾸지 않았다.
- 예방 조치 대상 없음: `java/` · `java-sast-external/` 에 다른 `DocumentBuilderFactory` · `SAXParserFactory` · `XMLInputFactory` ·
  `TransformerFactory` · `SchemaFactory` 생성 지점이 없다.
- `setAttribute` 가 `IllegalArgumentException` 을 던지는 경우(구형 Xerces)는 잡지 않는다 — 잡아 넘기면 보안 설정 없이 파싱하게 된다.
- 이 레포에서는 컴파일 불가(§0.3). 검증은 diff 검토 · `git diff --check` 만 했다.
- 실백엔드 확인 대기: 빌드, 클래스패스의 `DocumentBuilderFactory` 구현이 JAXP 1.5 attribute 를 받는지(기동 후 첫 CAST 요청에서
  `IllegalArgumentException` 이 없는지), `REQ_GetResourceInformation` · `REQ_GetResource` · `REQ_SetResource` 정상 파싱,
  DOCTYPE 이 든 요청은 이전처럼 거부되는지.

---

## 4단계 — 표준 라이브러리 널 반환 `NULL_RETURN_STD` (9건, 매우위험)

행안부 05.01 Null Pointer 역참조 · AGENTS §16.6

| ID | 파일 : 라인 (스캔 → 현재) | 함수 | 지적 코드 |
|---|---|---|---|
| 663 | `java/cast/domains/wtng/FcltWtngDay.java` : 470 → 470 | `depOprCntOf` | `return secMap == null \|\| secMap.isEmpty() ? null : secMap.lastEntry().getValue().getEndOperCntom();` |
| 666 | `java/cast/service/impl/CastConfigServiceImpl.java` : 630 → 630 | `saveCategorySet` | `scope.getGroup(),` (`scope = scopeMap.get(entry.getKey())`) |
| 667 | 〃 : 631 → 631 | `saveCategorySet` | `scope.getQueryTerminal(),` |
| 674 | `java/castapi/service/impl/CastApiServiceImpl.java` : 1025 → 1025 | `renderBasePropertySetXml` | `NodeList columns = document.getElementsByTagName("m:col");` (`document = parseXmlSafely(xml)`) |
| 676 | 〃 : 2510 → 2510 | `saveResult` | `Element node = doc.getDocumentElement();` |
| 677 | castrest `CastRestServiceImpl.java` : 2943 | `deleteResult` | `Element node = doc.getDocumentElement();` |
| 678 | castrest : 911 | `retrieveResource` | 〃 |
| 679 | castrest : 743 | `retrieveResourceInformation` | 〃 |
| 681 | castrest : 2515 | `saveResult` | 〃 |

**조치**
- 663: `TreeMap.lastEntry()` 결과를 `Map.Entry` 지역 변수로 받아 null 검사 후 `getValue()` 한다. `isEmpty()` 검사만으로는 검출이 사라지지 않는다.
- 666 · 667: `scopeMap.get()` 결과가 null 이면 업무 오류다. 이 메서드의 기존 검증 오류 반환 방식(`JsonResponse validationError`)이나
  업무 예외로 끊는다. 같은 메서드 계열의 같은 패턴(현재 669 · 743행 부근 `scope.getGroup()`)도 확인한다.
- 674 · 676: `DocumentBuilder.parse()` · `getDocumentElement()` 를 표준 널 반환으로 본다. `parseXmlSafely` 에서 결과 null 이면
  `SAXException` 을 던지게 해 호출부 전체를 한 번에 보장하고, `getDocumentElement()` 결과도 지역 변수로 받아 검사한다.
  같은 패턴인 733 · 898행(`resourceInfoList(doc.getDocumentElement(), …)` · `resourceList(…)`)도 예방 조치한다.
- castrest 4건은 §0.4 의 별도 폴더에 입고된 `CastRestServiceImpl.java` 에 같은 null 검사 원칙을 적용한다.

**검증**: 663 은 시설 대기 도메인이라 `java/verify` 의 `FcltWtngRegression` 대상이다 (환경이 없으면 실행 불가로 보고).
실백엔드: 카테고리 세트 저장, CAST 결과 수신 · PropertySet 렌더(PS5xx)가 정상인지 확인한다.

**결과**: 레포 반영 (2026-11-13)
- 663: `FcltWtngDay.depOprCntOf` 에서 `secMap` null 검사 후 `lastEntry()` 를 `Map.Entry` 지역 변수로 받아 null 이면 null 을 돌려준다.
  빈 맵 · 시설 없음이 null(운영 수량 미상)인 것은 이전과 같다. `isEmpty()` 검사는 `lastEntry()` null 검사로 대체했다.
- 666 · 667: `CastConfigServiceImpl.saveCategorySet` 에서 `scopeMap.get()` 결과가 null 이면 같은 메서드의 범위 오류와 같은
  `"저장 범위를 확인해 주세요."` 로 끊는다. 두 맵은 같은 키로 함께 채워지므로 실제로는 도달하지 않는다. 갱신 전이라 롤백 대상도 없다.
  669 · 743행 부근 `scope.getGroup()` 은 `getSetScopes()` 목록 순회라 맵 조회가 아니다 (조치 불필요).
- 674 · 676 (castapi): `parseXmlSafely` 가 `parse()` 결과 null 이면 `SAXException("XML 문서를 읽지 못했습니다.")` 을 던진다.
  루트 요소용 `parseRootElement` 를 더해 `getDocumentElement()` null 이면 `SAXException("XML 루트 요소가 없습니다.")` 을 던진다.
  `saveResult`(676) 와 예방 조치로 `retrieveResourceInformation` · `retrieveResource`(733 · 898행)가 `parseRootElement` 를 쓴다.
  `renderBasePropertySetXml`(674)는 `parseXmlSafely` 의 null 보장으로 해결된다. 모든 호출부가 이미 `SAXException` 을 잡으므로 오류 경로는 같다.
- 677 · 678 · 679 · 681 (castrest): 같은 두 메서드를 넣고 `retrieveResourceInformation` · `retrieveResource` · `saveResult` · `deleteResult` 의
  `parseXmlSafely` + `getDocumentElement()` 를 `parseRootElement` 로 바꿨다. 네 호출부 모두 `SAXException` 을 잡는다. 기존 주석은 그대로다.
- 이 레포에서는 컴파일 불가(§0.3). 검증은 diff 검토 · `git diff --check` 만 했다.
  `java/verify` `FcltWtngRegression` 은 **실행 불가** — JDK 17 은 있으나 `PM_VERIFY_CLASSPATH` · `PM_VERIFY_LOMBOK_JAR` 가 설정되지 않았다.
- 실백엔드 확인 대기: 빌드, `FcltWtngRegression`, 카테고리 세트 저장, CAST `REQ_GetResourceInformation` · `REQ_GetResource` ·
  `REQ_SetResource`(결과 수신) · castrest 결과 삭제, PropertySet 렌더(PS5xx), 출국장 카드 · 팝업의 보안검색대 운영 수량이 이전과 같은지.

---

## 5단계 — 널 반환 값 역참조 `NULL_RETURN` (4건, 매우위험)

행안부 05.01 Null Pointer 역참조 · AGENTS §16.6

| ID | 파일 : 라인 (스캔 → 현재) | 함수 | 지적 코드 |
|---|---|---|---|
| 668 | `java/cast/service/impl/CastDsbdServiceImpl.java` : 587 → 607 | `getDepFcltCard` | `result.setWtngPsgCnt(queueOf(depDay.sourceOf(unitCd, evalDt)));` |
| 670 | 〃 : 434 → 453 | `retrieveDailySmltFcltCard` | `result.add(getDepFcltCard(unitCd, depDay, evalDt, prcsMin, scDay.clearanceOf(unitCd, evalDt), scUnitMap.get(unitCd), unitList));` |
| 672 | `java/cast/service/impl/CastFcltQueueScenarioServiceImpl.java` : 217 → 217 | `getDepSource` | `MaxCount maxCount = toMaxCount(source.getOprCnt(), masterCnt, "보안검색대(SC)");` (`source = wtngDay.sourceOf(unitCd, evalDt)`) |
| 671 | 〃 : 219 | `getDepSource` | `return source.toBuilder()` |

**조치**
- 먼저 null 을 돌려주는 자체 메서드를 확정한다: `FcltWtngDay.sourceOf` · `clearanceOf`, `scUnitMap.get` 등. 각 메서드에서 null 이 뜻하는 바
  (원천 없음 = 산정 불가인지, 있을 수 없는 데이터 오류인지)를 코드와 AGENTS §13 · §14 · §15 로 확인한다.
- 산정 불가라면 카드 · 팝업이 `null`(화면 `-`)로 그리는 기존 동작을 그대로 두고 역참조 전에 분기한다.
  데이터 오류라면 업무 예외로 올린다. **카드 · 팝업 수치 일치(§14)를 깨지 않는다.**
- 668 · 670 은 같은 흐름(카드 조립)이라 함께 본다.

**검증**: 카드 · 팝업 일치는 `java/verify` `FcltWtngRegression` 범위와 겹친다(환경 없으면 실행 불가 보고).
실백엔드: 요약보기 출국장 카드와 혼잡해소 팝업을 같은 `smltId` · `hhmm` 로 열어 값이 같은지, 결과 없는 시각에 오류 없이 `-` 가 나오는지 확인한다.

**결과**: (작성)

---

## 6단계 — 누락된 널 값 검사 `UNCHECKED_NULL` (3건, 매우위험)

행안부 05.01 Null Pointer 역참조 · AGENTS §16.6

| ID | 파일 : 라인 (스캔 → 현재) | 함수 | 지적 코드 |
|---|---|---|---|
| 664 | `java/cast/service/impl/CastChknCounterServiceImpl.java` : 194 → 194 | `getOprTimeList` | `return SmltUtils.mergeTimeRanges(boothTimeRangeList).stream()` |
| 665 | `java/cast/service/impl/CastChknServiceImpl.java` : 255 → 255 | `getAllotIslandList` | `island.setOprTimeList(toOprTimeList(SmltUtils.mergeTimeRanges(boothTimeRangeList)));` |
| 669 | `java/cast/service/impl/CastDsbdServiceImpl.java` : 742 → 765 | `retrieveArvlByHour` | `if (resultDt.isBefore(dayStart)` |

체커 의미: **앞에서 한 번 null 과 비교한 변수를 뒤에서 검사 없이 역참조**했다.

**조치**
- 각 함수에서 해당 변수(`boothTimeRangeList` 또는 그 원소의 `getTimeRanges()`, `mergeTimeRanges` 결과, `resultDt`)를 앞에서 어디서 null 비교하는지 찾는다.
- null 일 수 있으면 역참조 전에 검사하고, 없을 수 없다면 앞의 불필요한 null 비교를 정리하거나 검사 지점에서 반환 · 예외로 흐름을 끊어
  뒤에서는 null 이 아님이 드러나게 한다. `SmltUtils.mergeTimeRanges` 가 null 을 돌려줄 수 있는지도 확인한다.
- 664 · 665 는 같은 유틸 호출 패턴이라 같은 방식으로 맞춘다.

**검증**: 실백엔드에서 체크인카운터 상세 · 맵 아일랜드 운영시간, 요약보기 시간대별 유입 차트가 이전과 같은지 확인한다.

**결과**: (작성)

---

## 7단계 — MyBatis SQL 삽입 `SQL_INJECTION.MYBATIS` (68건, 매우위험)

행안부 01.01 SQL 삽입 · AGENTS §16.1. 이 레포 매퍼 중 `${` 는 아래 세 파일에만 있다 (다른 매퍼는 0건 확인, 2026-11-13).
**전부 외부 입력이 닿지 않는 정적 값이지만(§0.2-1) `${}` 형태를 없애야 한다.** 분량이 커서 7-A · 7-B · 7-C 를 각각 별도 세션으로 진행해도 된다.

### 7-A. CastApiMapper `#{${ymdParam}}` (11건) — 쉬움

| ID | 라인 | 지적 코드 (조각 `dailyFlightScheduleRows`) |
|---|---|---|
| 714 | 310 | `AND A.GD_SE_YMD = TO_CHAR(TO_DATE(#{${ymdParam}}, 'YYYYMMDD'), 'YYYYMMDD')` |
| 704 · 705 | 350 | `WHERE A.OPER_YMD BETWEEN … #{${ymdParam}} … AND … #{${ymdParam}} …` |
| 709 | 362 | `B.SCHDL_YMD = TO_CHAR(TO_DATE(#{${ymdParam}}, …` |
| 708 | 363 | `OR (B.SCHDL_YMD = TO_CHAR(TO_DATE(#{${ymdParam}}, 'YYYYMMDD') + 1, …` |
| 706 · 707 | 420 | `ADD_MONTHS(TO_DATE(#{${ymdParam}}, …), - 3)` … `TO_DATE(#{${ymdParam}}, …) - 1` |
| 711 · 712 | 451 | `ADD_MONTHS(…, - 1)` … `- 1` |
| 713 | 499 | `ADD_MONTHS(TO_DATE(#{${ymdParam}}, 'YYYYMMDD'), - 6)` |
| 710 | 500 | `AND TO_CHAR(TO_DATE(#{${ymdParam}}, 'YYYYMMDD') - 1, 'YYYYMMDD')` |

`${ymdParam}` 은 `<include><property>` 정적 치환이다. 호출부는 두 곳뿐이다.

| 호출부 | 현재 |
|---|---|
| `java/mapper/CastApiMapper.xml` : 756~757 (`<if test="resourceID == 'FS001'">` 안) | `<include refid="dailyFlightScheduleRows"><property name="ymdParam" value="baseYmd"/></include>` |
| `java/mapper/CastUserSnapshotMapper.xml` : 69~71 (`insertSchdlAtrbFromDaily`) | `<include refid="aoms.pm.castapi.mapper.CastApiMapper.dailyFlightScheduleRows"><property name="ymdParam" value="excnYmd"/></include>` |

**조치**
- 조각의 `#{${ymdParam}}` 8줄(11곳)을 `#{fsYmd}` 로 바꾼다.
- 호출부에서 `<property>` 를 빼고 include 앞에 `<bind name="fsYmd" value="baseYmd"/>` / `<bind name="fsYmd" value="excnYmd"/>` 를 둔다.
  `fsYmd` 가 두 statement 의 기존 파라미터 · bind 이름과 겹치지 않는지 확인한다.
- AGENTS §11.3: FS001 과 사용자 FS 는 **같은 조각의 행**을 저장해야 한다. 조각 본문은 날짜 바인딩 외에 건드리지 않는다.

**실백엔드 확인**: 같은 기준일자로 `REQ_GetResource`(FS001) 응답과 사용자 실행의 `TN_PM_SMLT_SCHDL_ATRB` 발행 행 수 · 내용이 변경 전과 같다.
MyBatis SQL 로그에서 날짜가 바인드 변수로 들어가는지 본다.

### 7-B. CastUserSnapshotMapper `insertRsrcMstr` (3건) — 보통

| ID | 라인 | 지적 코드 |
|---|---|---|
| 771 | 7 | `INSERT INTO PMOWN.${mstrTableNm} (` |
| 769 · 770 | 8 | `${mstrIdColumnNm}, ${mstrNmColumnNm}, PRCS_STTS_CD, CFMTN_YN, USE_YN,` |

값의 출처: `CastUserSnapshotServiceImpl` 의 private enum `RsrcTable` (189행~) 7종, 호출은 `publishRsrc` (158~166행).

| enum | 테이블 | ID 컬럼 | 명칭 컬럼 |
|---|---|---|---|
| `FLT_SCHDL` | `TN_PM_SMLT_SCHDL_MSTR` | `SCHDL_ATRB_ID` | `SCHDL_ATRB_NM` |
| `CKNCT` | `TN_PM_SMLT_CKNCT_MSTR` | `CKNCT_ATRB_ID` | `CKNCT_ATRB_NM` |
| `SBD` | `TN_PM_SMLT_SBD_MSTR` | `SBD_ATRB_ID` | `SBD_ATRB_NM` |
| `DPTGT` | `TN_PM_SMLT_FCLTY_OPNG_DPTGT_MSTR` | `DPTGT_ATRB_ID` | `DPTGT_ATRB_NM` |
| `SCRTY_CNTRL` | `TN_PM_SMLT_FCLTY_OPNG_SCRTY_CNTRL_MSTR` | `SCRTY_CNTRL_ATRB_ID` | `SCRTY_CNTRL_ATRB_NM` |
| `ENTCNY` | `TN_PM_SMLT_FCLTY_OPNG_ENTCNY_MSTR` | `ENTCNY_ATRB_ID` | `ENTCNY_ATRB_NM` |
| `TRNST_SCRTY_CNTRL` | `TN_PM_SMLT_FCLTY_OPNG_TRNST_SCRTY_CNTRL_MSTR` | `TRNST_SCRTY_CNTRL_ATRB_ID` | `TRNST_SCRTY_CNTRL_ATRB_NM` |

**조치 (권장안)**
- Mapper 시그니처를 `insertRsrcMstr(@Param("rsrcTable") String rsrcTable, @Param("snapshot") …)` 로 바꾸고 `table.name()` 을 넘긴다.
- XML 은 `<choose>` 의 `<when test='rsrcTable == "FLT_SCHDL"'>INSERT INTO PMOWN.TN_PM_SMLT_SCHDL_MSTR (SCHDL_ATRB_ID, SCHDL_ATRB_NM,</when>` 처럼
  분기마다 테이블과 두 컬럼을 리터럴로 쓴다. `PMOWN.` 을 분기 밖에 두면 `PMOWN. TN_…` 로 렌더돼 동작하지 않는다 (7-C 조치 2). 7개를 빠짐없이 나열하고 `<otherwise>` 는 두지 않는다(잘못된 값은 SQL 오류로 실패).
- `RsrcTable` 의 테이블 · 컬럼 필드가 더는 쓰이지 않으면 정리한다(기존 주석은 남긴다). `test` 문자열은 큰따옴표(§16.1).

**실백엔드 확인**: 사용자 시뮬레이션 실행 1회로 7개 MSTR 테이블에 같은 번호의 행이 각각 들어가는지 확인한다.

### 7-C. CastConfigMapper (54건) — 큼, 회귀 위험 높음

AGENTS §8: 이 매퍼는 **001 기준정보를 갱신하는 유일한 화면 경로(운영 반영)** 와 되돌리기 · 카테고리 복제가 쓴다. 동작 변화는 일일 시뮬레이션 입력을 바꾼다.

| statement | 지적 ID (라인) |
|---|---|
| `retrievePsgAtrbList` | 745 (110 `FROM PMOWN.${tableNm} A`) |
| `updateAtrbValue` | 715 (185) · 731 (186 `SET ${columnNm}`) · 753 (191) · 754 (192) · 733 (194) |
| `copyFromGroup` | 752 (200) · 759 (203) · 743 (204) · 726 (205) · 722 (206) · 739 · 740 (207) · 734 · 735 (209) · 719 (217) · 724 (218) · 736 (220) · 727 (224) · 723 (225) · 741 · 742 (226) · 737 · 738 (228) |
| `insertFromBaseGroup` | 728 (235) · 766 (236) · 718 (237) · 762 (239) · 764 (242) · 725 (250) · 763 (252) · 765 (255) · 768 (260) · 767 (262) |
| `insertFromGroup` | 716 (267) · 747 (268) · 732 (269) · 755 (271) · 720 (274) · 757 (282) · 756 (284) · 721 (287) · 761 (292) · 717 (293) |
| `insertAplyHstryDtl` | 748 (371) · 760 (372) · 729 · 730 (376) · 746 (377) · 758 (378) · 750 (380) · 744 (382) · 749 (383) · 751 (385) |

식별자 출처: `java/cast/enums/CastConfigSheet.java` (시트 4종). 값 컬럼 목록 `valueColumnList` 는 서비스가 enum 에서 거른다
(`getValueColumnList` — editable 컬럼, 999 반영 때는 `prePrcsValueColumnList`). 이력 되돌리기의 `columnNm` 은 `findColumnByPhysical` 로 검증된다.

| enum (`sheetNm`) | 테이블 | 그룹 컬럼 | 키 컬럼 | 상세 컬럼 | 편집 값 컬럼 |
|---|---|---|---|---|---|
| `PSG_ATRB` (여객유형속성) | `TN_PM_SMLT_PSG_ATRB` | `FIX_ATRB_GROUP_ID` | `PSG_ATRB_CD` | `PSG_DTL_SE_CD` | `INPT_VL` |
| `SHOW_UP_ATRB` (출현속성) | `TN_PM_SMLT_SHOW_UP_ATRB` | `FIX_ATRB_GROUP_ID` | `PSG_ATRB_CD` | `PSG_DTL_SE_CD` | `INPT_VL` |
| `SRVC_ATRB` (서비스속성) | `TN_PM_SMLT_SRVC_ATRB` | `FIX_ATRB_GROUP_ID` | `FCLTY_SE_CD` | `FCLTY_DTL_CD` | `SWTC_FNC_ID` · `INPT_VL` · `MIN_VL` · `MAX_VL` · `DSTB_MAX_VL` · `VL_TYPE` · `VRFC_FNC_ID` |
| `CKNCT_TYPE_ATRB` (체크인유형) | `TN_PM_SMLT_CKNCT_TYPE_ATRB` | `CKNCT_TYPE_ATRB_ID` | `ALN_CD` | (없음 `""`) | `CKNCT_RT` · `KOS_RT` · `MOBL_RT` · `SRVC_HR` |

값 컬럼은 전체 11종이다: `INPT_VL` · `SWTC_FNC_ID` · `MIN_VL` · `MAX_VL` · `DSTB_MAX_VL` · `VL_TYPE` · `VRFC_FNC_ID` · `CKNCT_RT` · `KOS_RT` · `MOBL_RT` · `SRVC_HR`.

**조치 (권장안 — statement 수는 유지하고 식별자만 `<choose>` 로)**
1. Mapper 파라미터 `tableNm` · `groupColumnNm` · `keyColumnNm` · `dtlColumnNm` 4개를 `@Param("sheetCd") String sheetCd`(= `sheet.name()`) 하나로 바꾼다.
   `valueColumnList` · `columnNm` 은 그대로 받는다.
2. **점(`.`)으로 이어지는 스키마 · 별칭은 분기 리터럴 안에 같이 쓴다.** `A.<include refid="…"/>` · `PMOWN.<include …/>` 처럼
   조각 앞에 접두어를 두면 `<choose>` 출력의 공백 · 줄바꿈이 끼어 `A. INPT_VL` 로 렌더되고, **이 형태는 정상 동작하지 않는다
   (2026-11-13 사용자 확인).** `<trim prefix="A.">` 도 접두어 뒤에 공백을 넣으므로 쓸 수 없다. 분기 안은 `A.INPT_VL` 처럼 한 덩어리여야 한다.

   ```xml
   <sql id="cfgValueColA">
       <choose>
           <when test='columnNm == "INPT_VL"'>A.INPT_VL</when>
           <when test='columnNm == "MIN_VL"'>A.MIN_VL</when>
           <!-- 값 컬럼 11종 전부 -->
       </choose>
   </sql>
   ```

3. 별칭 종류를 줄여 조각 수를 줄인다. 현재 별칭은 없음 · `A` · `B` · `T` · `S` 다. `insertAplyHstryDtl` 의 `T` → `A`, `S` → `B` 로 바꾸면
   (없음 · `A` · `B`) 3종이 된다. 그러면 `<sql>` 조각은 13개다.

   | 조각 | 분기 키 | 분기 수 | 별칭 |
   |---|---|:--:|---|
   | 테이블 `cfgTable` (`PMOWN.` 포함, 예: `PMOWN.TN_PM_SMLT_PSG_ATRB`) | `sheetCd` | 4 | — |
   | 그룹 컬럼 `cfgGroupCol` · `cfgGroupColA` · `cfgGroupColB` | `sheetCd` | 4 | 없음 · A · B |
   | 키 컬럼 `cfgKeyCol` · `cfgKeyColA` · `cfgKeyColB` | `sheetCd` | 4 | 없음 · A · B |
   | 상세 컬럼 `cfgDtlCol` · `cfgDtlColA` · `cfgDtlColB` | `sheetCd` | 3 (체크인유형 없음) | 없음 · A · B |
   | 값 컬럼 `cfgValueCol` · `cfgValueColA` · `cfgValueColB` | `columnNm` | 11 | 없음 · A · B |

   테이블 뒤의 별칭(`… PMOWN.TN_PM_SMLT_PSG_ATRB A`)은 공백으로 구분되는 자리라 조각 밖에 둬도 된다.
   상세 조건은 체크인유형에서 통째로 빠져야 하므로 기존 `<if test="dtlColumnNm != null and dtlColumnNm != ''">` 는
   `<if test='sheetCd != "CKNCT_TYPE_ATRB"'>` 로 바꾼다.
   별칭을 바꾸면 그 statement 의 렌더 SQL 이 바뀌므로, 변경 전후 대조(아래 실백엔드 확인)에서 별칭 차이는 같은 것으로 본다.
4. `retrievePsgAtrbList` 는 `PSG_ATRB` · `SHOW_UP_ATRB` 두 분기만 쓴다 (`cfgTable` 을 그대로 써도 되고 2분기 조각을 둬도 된다).
5. 서비스 호출부를 모두 바꾼다 (`CastConfigServiceImpl` 현재 309 · 326 · 415 · 487 · 555 · 773 · 788 · 869 · 908 · 1069 · 1105행 부근).
   `columnNm` · `valueColumnList` 원소가 해당 시트의 편집 컬럼인지 Java 에서 먼저 확인해 명확한 오류를 낸다(`<otherwise>` 없음 → SQL 오류는 마지막 방어선).
6. 360행 주석 "`되돌릴 때 그대로 ${columnNm} 이 된다`" 는 기존 주석이라 **삭제 · 수정하지 않는다.** 내용이 낡게 되면 사용자에게 알린다.

**대안 (참고)**: 시트별로 statement 를 나눠 SQL 을 전부 리터럴로 쓰는 안. 4시트 × 6 statement 가 되고 SRVC 의 값 컬럼 동적 선택(999 반영 시 부분 컬럼)
때문에 결국 `<foreach>` + 별칭별 `<choose>` 가 필요해 이득이 적다. 권장안이 안 될 때만 검토한다.

**실백엔드 확인 (시트 4종 각각)**
- MyBatis SQL 로그로 변경 전후 렌더 SQL 이 공백 외에 같은지 대조한다 (statement 6종 × 시트).
- Cast 설정 화면: 셀 저장(`updateAtrbValue`), 카테고리 추가(`insertFromBaseGroup` · `insertFromGroup`), 운영 반영 — 사용자 카테고리 → 001 과
  999 → 001(값 컬럼이 `prePrcsValueColumnList` 로 좁혀지는지), 이력 스냅샷(`insertAplyHstryDtl` 이 복사 **전**에 찍히는지), 되돌리기, 세트 되돌리기.

### 7단계 완료 기준
- `rg -n '\$\{' --glob '*.xml' java/mapper` 결과가 주석 줄(CastConfigMapper 360행)뿐이다.
- 실백엔드 확인 항목을 통과한다.

**결과**: (7-A · 7-B · 7-C 각각 작성)

---

## 8단계 — 세션 간 데이터 누출 `DATA_LEAK_BETWEEN_SESSIONS` (4건, 위험) — 별도 폴더

행안부 06.01 잘못된 세션에 의한 데이터 정보 노출 · AGENTS §16.9. **§0.4 의 CastRestServiceImpl.java 원본 입고를 확인한다.**

| ID | castrest `CastRestServiceImpl.java` : 라인 | 함수 | 지적 코드 |
|---|---|---|---|
| 775 | 2810 | `processAttributes` | `colTable = getAttributeValue(attributeMap, ID).orElse("");` |
| 776 | 2970 | `resourceDelete` | `colTable = getAttributeValue(attributeMap, "id").orElse("");` |
| 777 | 801 | `resourceInfoList` | `colTable = getAttributeValue(attributeMap, "id").orElse(""); pStr = "m:" + colTable;` |
| 778 | 936 | `resourceList` | `colTable = getAttributeValue(attributeMap, "id").orElse(""); processResourceInfo(node, colTable, sDto);` |

원인: 싱글톤 서비스의 멤버 필드 `colTable`(String)에 요청별 XML 파싱 상태를 쓴다. 동시 요청이 서로의 값을 덮는다.

**선례**: `castapi` 는 같은 코드를 `private final ThreadLocal<String> colTable = ThreadLocal.withInitial(() -> "");`
(`java/castapi/service/impl/CastApiServiceImpl.java` 717행)로 바꾸고 진입점에서 `colTable.remove()`(747 · 912행)를 부른다. 이 형태는 진단에 걸리지 않았다.

**조치**
- 별도 폴더의 원본에서 지역 변수 · 파라미터로 넘기는 방식(AGENTS §16.9 우선)을 먼저 검토하고,
  재귀 파서 구조상 어렵다면 castapi 의 ThreadLocal + `remove()` 를 그대로 옮긴다.

**결과**: (작성)

---

## 9단계 — 부적절한 예외 처리 `IMPROPER_CHECK_FOR_UNUSUAL_OR_EXCEPTIONAL_CONDITION` (1건, 위험) — 별도 폴더

행안부 04.03 부적절한 예외처리 · AGENTS §5 · §16.8. **§0.4 의 AdtOperHrMngServiceImpl.java 원본 입고를 확인한다.**

| ID | 파일 : 라인 | 함수 | 지적 코드 |
|---|---|---|---|
| 772 | `adtoper/service/impl/AdtOperHrMngServiceImpl.java` : 614 | `downloadAdtOperHrMng` | `… .process().clearEmptyContentByTableCnt(tableCnt).save(destFilePath); } catch (Exception ex) { throw new FilerException(ex.getMessage()); }` |

**조치**
- try 블록 안의 엑셀 생성 체인(`process` · `clearEmptyContentByTableCnt` · `save`)이 실제로 던지는 checked 예외(예: `IOException`, 라이브러리 고유 예외)를 시그니처로 확인해
  그 타입만 잡는다. unchecked 예외는 잡지 않고 전파한다.
- `FilerException(ex.getMessage())` 는 원인을 잃는다. 원인을 실을 수 있는 생성자가 있으면 쓰고, 없으면 메시지 형식만 유지한다.

**결과**: (작성)

---

## 10단계 — 경로 조작 `PATH_TRAVERSAL` (16건, 매우위험) — 별도 폴더

행안부 01.03 경로 조작 및 자원 삽입 · AGENTS §16.2. **§0.4 의 두 컨트롤러 원본 입고를 확인한다.** 11 · 12 단계와 같은 메서드다.

| ID | 파일 : 라인 | 함수 | 지적 코드 |
|---|---|---|---|
| 644 · 645 · 654 · 686 · 687 · 700 | `AdtOperHrMngController.java` : 390 | `downloadAdtOperHrMng` | `File file = new File(downloadFileInfo[0]);` |
| 651 · 653 · 656 · 697 · 699 · 702 | 〃 : 396 | 〃 | `BufferedInputStream inputStream = new BufferedInputStream(new FileInputStream(file));` |
| 661 · 695 | `BdpsgAnceInqController.java` : 326 | `downloadBdpsgAnceRsltExcel` | `File file = new File(fileInfo[0]);` |
| 658 · 682 | 〃 : 331 | 〃 | `BufferedInputStream inStream = new BufferedInputStream(new FileInputStream(file));` |

흐름(진단 발췌 기준): 서비스가 `String[] {경로, 파일명}` 을 돌려주고 컨트롤러가 그 경로로 파일을 열어 내려 보낸다.
AdtOperHrMng 은 `!file.exists()` 이면 `AomsBizException("FWIO25", …)`, BdpsgAnce 는 `if(file.exists())` 안에서 스트리밍한다.

**조치**
- 두 다운로드가 같은 모양이라 **공용 다운로드 메서드 하나**로 모으는 것을 권장한다 (11 · 12 단계도 같은 메서드에서 해소된다).
  기존 공용 유틸 위치(`java/cmmn/util/` — `AtchFileUtils` 가 있다)를 먼저 확인한다.
- 경로는 요청값으로 만들지 않는다. 서비스가 만든 파일은 설정된 기준 디렉터리 + 서버 생성 파일명으로 정하고,
  `Paths.get(baseDir).resolve(name).normalize()` 가 `baseDir` 하위인지(`startsWith`) 확인한 뒤 연다. 아니면 거부한다.
- 경로 조각에 쓰는 이름은 허용 문자(영문 · 숫자 · 한글 · `.` `_` `-`) 밖을 제거한다 (가이드 예시의 `/` `\` `..` `&` 제거와 같은 취지).
- 기존 오류 코드(`FWIO25`)와 응답 형태는 유지한다.

**결과**: (작성)

---

## 11단계 — 자원 삽입 `RESOURCE_INJECTION` (20건, 매우위험) — 별도 폴더

행안부 01.03 경로 조작 및 자원 삽입 · AGENTS §16.2. **10단계와 같은 줄이다.**

| ID | 파일 : 라인 | 함수 | 지적 코드 |
|---|---|---|---|
| 643 · 647 · 650 · 655 · 685 · 693 · 694 · 701 | `AdtOperHrMngController.java` : 390 | `downloadAdtOperHrMng` | `File file = new File(downloadFileInfo[0]);` |
| 641 · 649 · 652 · 657 · 683 · 691 · 698 · 703 | 〃 : 396 | 〃 | `… new FileInputStream(file) …` |
| 660 · 692 | `BdpsgAnceInqController.java` : 326 | `downloadBdpsgAnceRsltExcel` | `File file = new File(fileInfo[0]);` |
| 662 · 696 | 〃 : 331 | 〃 | `… new FileInputStream(file) …` |

**조치**
- 10단계 수정 후 같은 줄에 남는 문제가 있는지 본다. 이 체커는 "자원 식별자를 사전에 정한 목록에서 고르라"는 요구라,
  파일 종류가 정해져 있으면(예: 템플릿 · 결과 엑셀) 종류 enum → 서버 경로 매핑으로 바꿔 요청값이 식별자에 닿지 않게 한다.
- 10단계를 이미 그 방식으로 했다면 이 단계는 대조 · 기록만 하고 닫는다.

**결과**: (작성)

---

## 12단계 — HTTP 응답 분할 `HTTP_RESPONSE_SPLITTING` (8건, 매우위험) — 별도 폴더

행안부 01.13 HTTP 응답분할 · AGENTS §16.3. **§0.4 의 두 컨트롤러 원본 입고를 확인한다.**

| ID | 파일 : 라인 | 함수 | 지적 코드 |
|---|---|---|---|
| 642 · 646 · 648 · 684 · 688 · 690 | `AdtOperHrMngController.java` : 400 | `downloadAdtOperHrMng` | `response.setHeader("Content-Disposition", "attachment; filename=\"" + downloadFileInfo[1] + "\"");` |
| 659 · 689 | `BdpsgAnceInqController.java` : 334 | `downloadBdpsgAnceRsltExcel` | `response.setHeader("Content-Disposition", "attachment; filename=\"" + fileInfo[1] + "\"");` |

**조치**
- 파일명에서 `\r` · `\n` 을 먼저 제거하고, 헤더는 문자열 연결 대신
  `ContentDisposition.builder("attachment").filename(name, StandardCharsets.UTF_8).build().toString()` 으로 만든다.
- 한글 파일명이 지금과 같이 내려가는지(브라우저별 `filename*=UTF-8''…` 처리) 확인한다. 기존 화면이 파일명을 따로 인코딩해 넘기고 있었다면 이중 인코딩을 피한다.
- 10단계의 공용 다운로드 메서드에 넣으면 두 곳이 한 번에 해소된다.

**실백엔드 확인 (10~12 공통)**: 두 화면에서 정상 다운로드 · 한글 파일명 · 없는 파일 오류(`FWIO25`)가 이전과 같다.
`../` 가 섞인 경로 · CR/LF 가 섞인 파일명이 거부되거나 제거된다.

**결과**: (작성)

---

## 마무리 (12단계 이후)

1. 이 레포 수정분(`java/cast` · `java/castapi` · `java/mapper` · `java-sast-external`)을 §0.3 의 경로 대응에 따라 실제 백엔드에 옮기고 빌드한다.
   `java-sast-external/` 아래 파일은 `src/main/java/aoms/pm/` 아래의 해당 원본에 반영한다. 단계별 '실백엔드 확인'을 수행한다.
2. Sparrow 재분석을 요청하고, 결과 목록을 이 계획서의 이슈 ID 와 대조한다. 새로 생긴 이슈는 같은 형식의 단계로 추가한다.
3. 진단 결과 엑셀의 `이슈 의견` 열에 단계별 조치 내용(무엇을 어떻게 바꿨는지, 커밋)을 기입해 제출한다. 소명 문구는 쓰지 않는다(§0.2).
