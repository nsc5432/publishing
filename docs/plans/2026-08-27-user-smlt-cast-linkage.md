# 사용자 시뮬레이션 ↔ CastRest 연계 구현계획

작성일 2026-08-27 · 대상 `java/cast`, `java/castrest`, `java/mapper`, `java/ddl`, 일부 `react/src/types`

---

## 0. 이 문서의 전제

- **`java/` 는 참조 사본이라 이 레포에서 컴파일·실행할 수 없다.** 빌드 파일(pom/gradle)이 없고
  디렉터리(`java/cast/…`)가 패키지(`aoms.pm.cast…`)와 맞지 않는다. 아래 모든 Java 변경은
  **실제 백엔드 레포에 옮겨서 빌드·기동해야 검증된다.** 이 레포에서 할 수 있는 검증은
  §9 의 "레포 내 검증" 항목(SQL 정적 대조, DDL↔mapper 컬럼 대조, React `tsc -b`)뿐이다.
- `java/ddl/cast-ddl.sql` 은 **원본 스키마가 아니라 사진 판독 + 표준단어 치환본**이다.
  `TN_PM_SMLT_USER_MSTR` 블록에는 `source photo for this table was noticeably out of focus`
  라는 주석까지 붙어 있다. **DDL 단독으로 구현 근거를 삼지 않는다.** §10 의 모순은
  실 스키마 조회(`ALL_TAB_COLUMNS`)로 먼저 확정한다.
- 아래 "현재 구현" 서술은 전부 이 레포의 실제 코드 라인을 근거로 한다. 추정에는 (추정) 표시를 붙였다.

---

## 1. 현재 구현 실측

### 1.1 실행 요청 쪽 (`cast`)

`CastUserSmltServiceImpl.executeUserSmlt()` 가 하는 일은 3가지가 전부다.

1. 로그인·`smltId`·`tmnlId` 유효성 검사
2. `retrieveUserSmltCondCnt(smltId, tmnlId)` — `USER_CHKN_ISL` + `USER_DPTGT` +
   `USER_FLT_PSG_AJMT` **세 부모 테이블 count 의 합**이 0 이 아닌지만 본다
3. `retrieveNextSmltFlfmtSn()` (= `MAX(SMLT_FLFMT_SN)+1`) → `insertSmltFlfmtHstry()` 로
   `TH_PM_SMLT_FLFMT_HSTRY` 에 `RUNNING` 이력 1행

`TN_PM_SMLT_USER_MSTR` 에 대한 INSERT 는 **없다.** 코드 주석도 그 자리를 명시한다 —
`// 3~4. CAST 리소스 발행 · 수행 시작 트리거 — 연동 DTO 부재로 보류 (G8 / D19)`.
즉 **현재 버튼을 눌러도 CAST 는 아무것도 모른다.** 화면에는 `RUNNING` 만 남고 끝나지 않는다.

`retrieveNextSmltFlfmtSn` 의 SQL 주석도 문제를 자백한다 —
`시퀀스가 없어 SMLT_ID 스코프의 MAX + 1 로 채번한다. 트랜잭션 격리 수준에 의존하므로 동시 수행 시 PK 충돌로 드러난다`.

`retrieveUserSmltInfo()` 는 `SmltType.USER`(`dbCode='WhatIf'`) 로 `TN_PM_SMLT_STNG` 을 찾고,
없으면 `SmltType.DAILY`(`'Auto'`) 로 **일일 시뮬레이션 ID 를 편집 기준으로 fallback** 한다.
그래서 사용자 draft 가 일일 `SMLT_ID` 아래에 쌓일 수 있다.

### 1.2 CAST 수신 쪽 (`castrest`)

`CastRestController` 는 `/castrest/rest/json` 아래 4개. 서비스는 `CastRestServiceImpl` 하나(3230줄).

| 진입 | 처리 |
|---|---|
| `REQ_GetResourceInformation.do` | `retrieveResourceInformation` — 제공 가능한 리소스 목록 |
| `REQ_GetResource.do` | `processResourceData()` 가 `ResourceType` 으로 분기 |
| `REQ_SetResource.do` | `saveResult()` |

`REQ_GetResource` 분기(`CastRestServiceImpl.processResourceData`)는
`ResourceType` switch → `GenericTable` 인 경우 `ResourceID.contains(...)` 로 재분기하고,
`WhatIfDefinitionTable` 이면 `handleWhatIfControl()` 이 `retrieveWhatIfCntrl` 을 부른다.

`retrieveWhatIfCntrl` (`CastRestMapper.xml`) 은 이렇게 생겼다.

```sql
SELECT LISTAGG(SMLT_ID,',') WITHIN GROUP (ORDER BY SMLT_ID) AS whatIfRunId
     , LISTAGG(MDL_RSRC_ID,',') ... AS model
     ... (16개 컬럼 각각 LISTAGG)
  FROM PMOWN.TN_PM_SMLT_USER_MSTR ORDER BY SMLT_ID
```

**WHERE 절이 없다.** 상태 필터도, 터미널 필터도, 보존기간 필터도 없이 테이블 전체를 배열화한다.
그리고 `LISTAGG` 를 컬럼마다 따로 걸어서, NULL 이 섞이면 배열 길이가 달라져 행 대응이 깨진다
(AGENTS.md 11.6 마지막 항목이 지적하는 바로 그것).

`REQ_SetResource` 는 `saveResult()` 에서 3갈래다.

- `ResourceType` 이 `CASTModel`/`CASTExpressModel` → `saveModel()`
- `GenericTable` → `updateWhatIf()` — WhatIf **상태만** 갱신
- 그 외 → `insertResult()` — 결과 저장

`updateWhatIf()` 는 `WhatIfRunID`/`Status` 를 콤마로 split 해 행별 `updateWhatIfDefinitionTableStts`
를 돌리고, **응답에 없던 master 행을 전부 `deleteWhatIfDefinitionTable` 로 지운다.**
full snapshot 계약이 아니면 진행 중인 요청이 통째로 사라진다.

`insertResult()` 는

```java
int relatedEventCd = setupMasterDto(dto);            // ResourceID 에 " Auto"/"WhatIf" 포함 여부로 구분
String simId = castRestMapper.retrieveSimId(dto);    // SQ1_TN_PM_SMLT_RSLT.NEXTVAL — 신규 SMLT_ID
...
castRestMapper.insertSimSet(dto);                    // TN_PM_SMLT_STNG INSERT
executeBatchInsert(datailList);                      // TN_PM_SMLT_RSLT_DTL 1000건 배치
```

즉 **결과는 항상 새 `SMLT_ID` 를 시퀀스로 만든다.** 요청(`TN_PM_SMLT_USER_MSTR.SMLT_ID`)이나
수행이력(`SMLT_FLFMT_SN`)과 잇는 컬럼이 없다. 그리고 `insertSimSet` 은

```sql
, TMNL_ID
...
, 'P01'
```

**터미널을 `'P01'` 로 하드코딩한다.** T2(`P03`) 사용자 실행 결과도 P01 로 저장된다.

`TH_PM_SMLT_FLFMT_HSTRY` 를 `DONE` 으로 바꾸거나 `SMLT_FLFMT_END_DT` 를 채우는 코드는
`java/` 전체에 없다 (`insertSmltFlfmtHstry` 외에 이 테이블에 쓰는 문장 자체가 없음).

### 1.3 리소스 ID 명명 규칙 (코드에서 확정된 것)

`retrieveResourceInformation` 과 각 조회 SQL 에서 규칙이 그대로 읽힌다.

| 리소스 | 목록 SQL 이 만드는 ResourceID | 상세 SQL 의 역변환 |
|---|---|---|
| FlightSchedule | `'FS' \|\| SCHDL_MSTR.SCHDL_ATRB_ID` | `WHERE SCHDL_ATRB_GROUP_ID = REPLACE(#{resourceID},'FS','')` |
| CounterAllocation | `'CA' \|\| …` | `WHERE SCHDL_ATRB_GROUP_ID = REPLACE(#{resourceID},'CA','')` |
| SBD | `'SBD' \|\| …` | `WHERE SCHDL_ATRB_GROUP_ID = REPLACE(#{resourceID},'SBD','')` |
| ReportingProfilesTimeGroups | — | `REGEXP_REPLACE(#{resourceID},'RPTG\|ReportingProfilesTimeGroups','')` |

일일 운영자료 exact 분기는 `FS001`, `CA001`, `SBD001` 세 개뿐이고, 그 외는 전부
`TN_PM_SMLT_{SCHDL,CKNCT,SBD}_MSTR/ATRB` 를 읽는다.

**따라서 사용자 snapshot 발행이란 = 이 `*_MSTR`/`*_ATRB` 에 행을 넣고 `'FS'||id` 형태의
ResourceID 를 `TN_PM_SMLT_USER_MSTR` 에 적어 주는 일이다.** 새 CAST 프로토콜을 만들 필요가 없다.

주의: `*_ATRB_ID` 는 전부 `VARCHAR2(8)` 이다. 스냅샷 ID 채번은 8자를 넘길 수 없다.

---

## 2. 식별자 모델 (REQUEST_ID · SMLT_ID · SMLT_FLFMT_SN)

### 2.1 현재 섞여 있는 4개의 "ID"

| 실제로 다른 것 | 지금 이름 | 타입 | 만드는 주체 |
|---|---|---|---|
| 편집 중인 조건 묶음 | `TN_PM_SMLT_USER_*.SMLT_ID` | `VARCHAR2(8)` | 일일 `TN_PM_SMLT_STNG` 에서 빌려옴 |
| 실행 요청 1건 | `TN_PM_SMLT_USER_MSTR.SMLT_ID` | `VARCHAR2(100)` | (없음 — INSERT 코드 자체가 없다) |
| 수행 회차 | `TH_PM_SMLT_FLFMT_HSTRY.SMLT_FLFMT_SN` | `NUMBER(5)` | `MAX+1` |
| 결과 세트 | `TN_PM_SMLT_STNG.SMLT_ID` | `VARCHAR2(8)` | `SQ1_TN_PM_SMLT_RSLT.NEXTVAL` |

넷이 전부 "SMLT_ID" 라는 한 이름을 쓰거나 아예 없다. 이것이 AGENTS.md 11.5 의 5·6번 항목의 뿌리다.

DDL 의 `TN_PM_SMLT_USER_MSTR.SMLT_ID` 주석은 결정적인 단서를 준다 —
`STD REVIEW: 원본은 WHAT_IF_EXCN_ID였음`. 즉 **이 컬럼은 원래부터 실행 요청 ID였고,
표준단어 치환 과정에서 이름만 `SMLT_ID` 가 되면서 다른 3개와 충돌한 것이다.**

### 2.2 확정할 모델

네 개를 각각 다른 이름으로 분리한다.

```
SMLT_REQ_ID     실행 요청 1건. TN_PM_SMLT_USER_MSTR 의 PK.
                CAST 가 WhatIfDefinitionTable 의 WhatIfRunID 로 읽어 가는 값.
                (= 지금의 TN_PM_SMLT_USER_MSTR.SMLT_ID 를 개명)

SMLT_ID         편집 draft 묶음. TN_PM_SMLT_USER_* 자식 테이블의 SMLT_ID.
                VARCHAR2(8). 재실행해도 변하지 않는다.

SMLT_FLFMT_SN   SMLT_ID 스코프의 수행 회차. TH_PM_SMLT_FLFMT_HSTRY 의 PK 후미.
                화면 모니터링이 보는 단위.

RSLT_SMLT_ID    CAST 결과가 만든 TN_PM_SMLT_STNG.SMLT_ID. VARCHAR2(8).
                요청 1건당 0..1 개.
```

관계:

```
SMLT_ID (draft)
  └─1:N─ SMLT_FLFMT_SN (수행 회차)
           └─1:1─ SMLT_REQ_ID (실행 요청)
                    └─0:1─ RSLT_SMLT_ID (결과 세트)
```

`TN_PM_SMLT_USER_MSTR` 한 행이 `(SMLT_REQ_ID, SMLT_ID, TMNL_ID, SMLT_FLFMT_SN, RSLT_SMLT_ID)`
를 전부 들고 있으면 어느 방향으로도 복원된다. 이것이 §3 DDL 의 핵심이다.

### 2.3 `SMLT_REQ_ID` 채번 규칙

CAST 로 나가는 문자열이고 결과 ResourceID 에서 되찾아야 하므로(§6), **자기설명적이고 파싱 가능한
고정폭**이 좋다.

```
SMLT_REQ_ID = 'WI' + SMLT_ID(8) + TMNL_ID(3) + LPAD(SMLT_FLFMT_SN, 4, '0')
예) WI20260827P010001
```

- `VARCHAR2(100)` 안에 넉넉히 들어간다.
- 접두 `WI` 는 `setupMasterDto()` 의 기존 `ResourceID.contains("WhatIf")` 판정과 **별개 규칙**이다.
  둘을 섞지 않는다 (AGENTS.md 11.3 마지막 문단).
- `(SMLT_ID, TMNL_ID, SMLT_FLFMT_SN)` 에서 결정론적으로 나오므로 UNIQUE 제약이 그대로
  중복 실행 방어가 된다.

> **D1 (확인 필요)** — CAST 가 `WhatIfRunID` 문자열 길이·문자셋에 제약을 두는지.
> 숫자만 받는다면 `SMLT_REQ_ID` 를 시퀀스 정수로 두고 매핑을 따로 둬야 한다.

---

## 3. `TN_PM_SMLT_USER_MSTR` 최종 DDL

### 3.1 현재 DDL vs mapper 의 차이 (실측)

`retrieveWhatIfCntrl` 이 읽는 컬럼과 DDL 컬럼을 1:1 대조한 결과.

| 컬럼 | DDL | mapper | 판정 |
|---|---|---|---|
| `SMLT_ID` | ○ `VARCHAR2(100)` | ○ | |
| `MDL_RSRC_ID` | ○ | ○ | |
| `FLT_SCHDL_RSRC_ID` | ○ | ○ | |
| `CKNCT_ALCTN_RSRC_ID` | ○ | ○ | |
| `SBD_CNTRL_ALCTN_ID` | ○ | ○ | |
| `PRPT_STNG_RSRC_ID` | ○ | ○ | |
| `FCLTY_OPNG_DPTCNY_SRNG_RSRC_ID` | ○ | ○ | |
| `FCLTY_OPNG_DPTCNY_RSRC_ID` | ○ | ○ | |
| `FCLTY_OPNG_ENTCNY_RSRC_ID` | ○ | ○ | |
| `FCLTY_OPNG_SCRTY_CNTRL_RSRC_ID` | **×** | ○ | **C2-a 모순** |
| `FCLTY_OPNG_TR_SCRTY_CNTRL_RSRC_ID` | **×** | ○ | **C2-a 모순** |
| `CKNCT_SRVC_HR_RSRC_ID` | ○ | ○ | |
| `CKNCT_TYPE_CNTRL_RSRC_ID` | ○ | **×** | **C2-b 모순** |
| `CHKN_TYPE_RSRC_ID` | ○ | ○ | |
| `RPT_STNG_ATRB_ID` | ○ | ○ | |
| `SMLT_RSLT_SFX` | ○ | ○ | |
| `SMLT_STTS` | ○ `VARCHAR2(20)` nullable | ○ | NOT NULL 필요 |
| `EXCT_DT` | ○ | `updateWhatIfDefinitionTableStts` 가 쓴다 | |

그리고 **`TMNL_ID`, `EXCN_YMD`, `SMLT_FLFMT_SN`, 결과 ID 컬럼이 통째로 없다.**
현재 구조로는 "이 요청이 어느 터미널의 어느 날짜 draft 였는지" 를 DB 만 보고 알 수 없다.

### 3.2 목표 DDL

```sql
-- 기존 테이블에 대한 변경. 신규 생성이 아니라 ALTER 로 가는 것을 기본으로 한다.
-- (운영 데이터가 이미 있으면 §3.3 의 마이그레이션 순서를 따른다)

CREATE TABLE "PMOWN"."TN_PM_SMLT_USER_MSTR"
(
    -- === 식별자 =========================================================
    "SMLT_REQ_ID"                        VARCHAR2(100) NOT NULL,  -- 개명: 기존 SMLT_ID
    "SMLT_ID"                            VARCHAR2(8)   NOT NULL,  -- 신규: 편집 draft ID
    "TMNL_ID"                            VARCHAR2(4)   NOT NULL,  -- 신규: P01 / P03
    "EXCN_YMD"                           VARCHAR2(8)   NOT NULL,  -- 신규: 대상 일자
    "SMLT_FLFMT_SN"                      NUMBER(5,0)   NOT NULL,  -- 신규: 수행 회차
    "RSLT_SMLT_ID"                       VARCHAR2(8),             -- 신규: 결과 TN_PM_SMLT_STNG.SMLT_ID

    -- === CAST 입력 리소스 (실행 시점 snapshot 을 가리킨다) ===============
    "MDL_RSRC_ID"                        VARCHAR2(100),
    "FLT_SCHDL_RSRC_ID"                  VARCHAR2(100),
    "CKNCT_ALCTN_RSRC_ID"                VARCHAR2(100),
    "SBD_CNTRL_ALCTN_ID"                 VARCHAR2(100),
    "PRPT_STNG_RSRC_ID"                  VARCHAR2(100),
    "FCLTY_OPNG_DPTCNY_SRNG_RSRC_ID"     VARCHAR2(100),
    "FCLTY_OPNG_DPTCNY_RSRC_ID"          VARCHAR2(100),
    "FCLTY_OPNG_ENTCNY_RSRC_ID"          VARCHAR2(100),
    "FCLTY_OPNG_SCRTY_CNTRL_RSRC_ID"     VARCHAR2(100),  -- 신규(mapper 는 이미 읽고 있다)
    "FCLTY_OPNG_TR_SCRTY_CNTRL_RSRC_ID"  VARCHAR2(100),  -- 신규(mapper 는 이미 읽고 있다)
    "CKNCT_SRVC_HR_RSRC_ID"              VARCHAR2(100),
    "CKNCT_TYPE_CNTRL_RSRC_ID"           VARCHAR2(100),  -- 유지 (D3 확정 전까지 삭제 금지)
    "CHKN_TYPE_RSRC_ID"                  VARCHAR2(100),
    "RPT_STNG_ATRB_ID"                   VARCHAR2(100),
    "SMLT_RSLT_SFX"                      VARCHAR2(100),

    -- === 상태 ===========================================================
    "SMLT_STTS"                          VARCHAR2(20) DEFAULT 'New' NOT NULL,
    "QUEUE_DT"                           TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "EXCT_DT"                            TIMESTAMP(6),            -- Executing 진입 시각
    "END_DT"                             TIMESTAMP(6),            -- 신규: Finished/Failed 시각
    "ERR_MSG"                            VARCHAR2(1000),          -- 신규

    -- === 감사 ===========================================================
    "FRST_RGTR_ID"                       VARCHAR2(40),
    "FRST_RGTR_IP_ADDR"                  VARCHAR2(40),
    "FRST_REG_DT"                        TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "LAST_MDFR_ID"                       VARCHAR2(40),
    "LAST_MDFR_IP_ADDR"                  VARCHAR2(40),
    "LAST_MDFCN_DT"                      TIMESTAMP(6),

    CONSTRAINT "TN_PM_SMLT_USER_MSTR_PK"  PRIMARY KEY ("SMLT_REQ_ID"),
    CONSTRAINT "TN_PM_SMLT_USER_MSTR_UK1" UNIQUE ("SMLT_ID", "TMNL_ID", "SMLT_FLFMT_SN"),
    CONSTRAINT "TN_PM_SMLT_USER_MSTR_CK1" CHECK ("SMLT_STTS" IN ('New','Executing','Finished','Failed')),
    CONSTRAINT "TN_PM_SMLT_USER_MSTR_FK1" FOREIGN KEY ("SMLT_ID", "SMLT_FLFMT_SN")
        REFERENCES "PMOWN"."TH_PM_SMLT_FLFMT_HSTRY" ("SMLT_ID", "SMLT_FLFMT_SN")
);

-- 중복 실행 방어의 핵심. 같은 (draft, 터미널) 에 대해 미완료 요청은 동시에 1건만 존재한다.
CREATE UNIQUE INDEX "PMOWN"."TN_PM_SMLT_USER_MSTR_UX_ACTIVE"
    ON "PMOWN"."TN_PM_SMLT_USER_MSTR"
       (CASE WHEN "SMLT_STTS" IN ('New','Executing')
             THEN "SMLT_ID" || '|' || "TMNL_ID" END);

-- Poller 가 대기 건만 훑는다.
CREATE INDEX "PMOWN"."TN_PM_SMLT_USER_MSTR_IX1"
    ON "PMOWN"."TN_PM_SMLT_USER_MSTR" ("SMLT_STTS", "QUEUE_DT");
```

`SMLT_ID` 를 `VARCHAR2(8)` 로 맞춘 이유: 나머지 사용자 상세·설정·이력·결과가 전부
`VARCHAR2(8)` 이고 이 값은 그쪽으로 조인해 들어가는 값이라서다. 반면 `SMLT_REQ_ID` 는
CAST 로 나가는 값이므로 원본 폭 `VARCHAR2(100)` 을 유지한다.

### 3.3 마이그레이션 순서

기존 운영 데이터가 있으면 컬럼 개명을 한 번에 하지 않는다.

1. 신규 컬럼 ADD (전부 NULL 허용 상태로)
2. `SMLT_ID` → `SMLT_REQ_ID` RENAME, 신규 `SMLT_ID` ADD
3. 기존 행 backfill — 과거 요청은 draft·회차를 복원할 수 없으므로 `SMLT_STTS='Failed'` 로
   닫고 **신규 요청부터 정상 경로**를 타게 한다 (D5)
4. NOT NULL / CHECK / UNIQUE / FK 순서로 제약 추가
5. `CastRestMapper.xml` 의 `retrieveWhatIfCntrl` · `updateWhatIfDefinitionTableStts` ·
   `checkWhatIfIdList` · `deleteWhatIfDefinitionTable` 4개 SQL 의 `SMLT_ID` → `SMLT_REQ_ID` 치환
   (별칭 `AS whatIfRunId` 는 그대로 두면 `CastWhatIfCntrlDto` 는 손댈 필요 없다)

> **D2 (확인 필요)** — 개명 대신 `SMLT_ID` 이름을 그대로 두고 신규 draft 컬럼을
> `EDIT_SMLT_ID` 로 부르는 안도 있다. mapper 수정량은 줄지만 "SMLT_ID" 라는 이름이
> 계속 4가지를 가리키게 된다. **개명 쪽을 권장**하되 운영 DBA 승인 사항으로 남긴다.

---

## 4. 사용자 draft → FS/CA/SBD/시설운영 snapshot 발행

### 4.1 원칙

- 발행은 **실행 버튼을 누른 시점 1회**다. 이후 draft 가 바뀌어도 발행된 snapshot 은 불변이다.
- snapshot 은 **새 CAST 프로토콜이 아니라 기존 `*_MSTR`/`*_ATRB` 테이블에 행을 넣는 것**이다
  (§1.3). CastRest 조회 SQL 은 손대지 않는다.
- **리소스 번호는 `002 ~ 999` 를 도는 단순 증가 번호다. `001` 은 일일 시뮬레이션 고정.**
  `SQ1_TN_PM_SMLT_USER_RSRC` (`MINVALUE 2 MAXVALUE 999 CYCLE`) 에서 뽑아
  `LPAD(n, 3, '0')` 로 만든다.
- **FS · CA · SBD · 시설운영이 한 번호를 공유한다.** 한 요청이
  `FS007 · CA007 · SBD007 · …DepartureGate007 · …SecurityControl007` 을 통째로 받는다.
  타입별로 따로 돌리면 `CastRestMapper.xml#retrieveFcltyOpngTblDptg` 가 깨진다 —
  그 SQL 이 출국장 번호로 `TN_PM_SMLT_SCHDL_ATRB.SCHDL_ATRB_GROUP_ID` 를 뒤지기 때문이다.
- 번호가 한 바퀴 돌아 겹치면 **발행 시 `DELETE` 후 `INSERT`** 로 갈아 끼운다
  (체크인·출국장 저장이 이미 쓰는 전체 교체 방식과 같다). 테이블은 타입당 998행으로 유계다.

### 4.2 영역별 매핑

| CAST 리소스 | 대상 테이블 | 원천 draft | 비고 |
|---|---|---|---|
| `FS`+id | `TN_PM_SMLT_SCHDL_MSTR` / `_ATRB` | `USER_FLT_PSG_AJMT`(전체 조정률) + `USER_FLT_PSG_TMZN_AJMT`(시간대별) | 일일 운항자료를 복사하고 조정률을 곱한다 |
| `CA`+id | `TN_PM_SMLT_CKNCT_MSTR` / `_ATRB` | `USER_CHKN_ISL.BOOTH_CNT` + `USER_CHKN_OPER_HR` + `USER_CHKN_BOOTH` | 부스 단위 행으로 전개 |
| `SBD`+id | `TN_PM_SMLT_SBD_MSTR` / `_ATRB` | `USER_CHKN_ISL.KOS_CNT`(키오스크) · `.SBD_CNT`(백드롭) | 셀프체크인/백드롭은 별도 화면이 아니라 아일랜드 자원이다 |
| 출국장 GenericTable | `TN_PM_SMLT_FCLTY_OPNG_DPTGT_MSTR` / `_ATRB` | `USER_DPTGT` + `USER_DPTGT_OPER_HR` | PK `(DPTGT_ATRB_ID, FCLTY_OPNG_SN)` |
| 보안검색 GenericTable | `TN_PM_SMLT_FCLTY_OPNG_SCRTY_CNTRL_MSTR` / `_ATRB` | `TN_PM_SMLT_SCSH_OPER_PLAN` | 시간대별 검색대 수 |
| 환승보안검색 | `…_TRNST_SCRTY_CNTRL_MSTR` / `_ATRB` | (사용자 편집 대상 아님) | 일일 값 승계 |
| 출국심사 / 입국심사 | `…_DPTCNY_*` / `…_ENTCNY_*` | (사용자 편집 대상 아님) | 일일 값 승계 |
| PropertySet | `TN_PM_SMLT_FIX_ATRB_GROUP` + `{PSG,SHOW_UP,SRVC}_ATRB` | (사용자 편집 대상 아님) | 일일 값 승계 |
| CASTModel · RPTG | `TN_PM_SMLT_MDL` · `…_RPT_STNG_HR_GROUP_*` | — | 일일 값 승계 |

"승계" = 새 행을 만들지 않고 **일일 `TN_PM_SMLT_STNG` 의 해당 리소스 ID 문자열을 그대로 복사**한다.
사용자가 건드리지 않은 축까지 복제하면 리소스 테이블이 실행 횟수만큼 부풀고 얻는 것이 없다.

### 4.3 FS snapshot 의 조정률 적용 (가장 까다로운 부분)

`TN_PM_SMLT_SCHDL_ATRB` 의 PK 는
`(SCHDL_ATRB_GROUP_ID, ARR_DEP_SE_CD, FLTNM, DEP_ARR_YMD, DEP_ARR_HM)` 로 **편(便) 단위**다.
반면 사용자 조정률은

- `USER_FLT_PSG_AJMT.AJMT_RT` — 전체 1건 (`NUMBER(4,0)`)
- `USER_FLT_PSG_TMZN_AJMT.AJMT_RT` — `BGNG_HM` 단위

로 **시간대 단위**다. 그래서 시간대 조정률을 그 시간대에 속한 편들의 여객수에 **비례 배분**해야 한다.

**`AJMT_RT` 는 배율이 아니라 `-100 ~ 100` 의 증감률이다** — `CastFltPsgServiceImpl.validate` 가
그 범위로 막는다. `0` 이 "변화 없음" 이므로 곱셈 계수는 `(100 + AJMT_RT) / 100` 이다.

```
적용률 = CASE
           WHEN 사용자가 편집한 터미널의 편이 아니면 → 0
           WHEN AJMT_TYPE_CD = 'HOURLY'             → 예측시각이 속한 TMZN 구간의 AJMT_RT
           ELSE                                       USER_FLT_PSG_AJMT.AJMT_RT
         END
편별 조정여객수 = ROUND(원본여객수 × (100 + 적용률) / 100)
```

> **D4 (확정)** — 편별 단순 `ROUND`. 시간대 합계는 편수 × 최대 0.5명만큼 어긋날 수 있다.
> `AJMT_RT` 가 `NUMBER(4,0)` 이라 소수점 조정률은 표현할 수 없다 — 그대로 둔다.

> **D6 (확정)** — snapshot `*_MSTR` 은 일일과 같이 `USE_YN='Y'` 로 넣는다. 번호가 998개로
> 유계라 `retrieveResourceInformation` 목록이 무한히 늘지 않는다. 정리는 CAST 의
> `REQ_DeleteResource` 주기 호출에 맡기되, 발행이 그 주기에 의존하지 않도록
> 발행 시 `DELETE → INSERT` 로 갈아 끼운다.

**원천은 일일 `TN_PM_SMLT_STNG.FLT_SCHDL_RSRC_ID` 가 무엇이냐로 갈린다.**

| 일일 리소스 | snapshot 원천 |
|---|---|
| `FS001` | `GOOWN.TN_GO_GD_DATA` (운영계 직접). 확인되지 않은 부속 컬럼 9종은 NULL 로 둔다 |
| `FSxxx` | `TN_PM_SMLT_SCHDL_ATRB` 전 컬럼 복사. 누락 없음 |

### 4.4 발행 서비스의 형태

신규 `CastUserSnapshotService` 하나에 영역별 메서드를 모은다.

```java
public interface CastUserSnapshotService {
    /** 실행 시점 snapshot 을 발행하고 리소스 ID 묶음을 돌려준다. 호출자 트랜잭션에 참여한다. */
    UserSmltRsrcSnapshotDto publish(String smltId, String fcltTmnlId, String excnYmd);
}
```

`publish()` 안에서 FS → CA → SBD → 시설운영 순으로 발행하고, 승계 항목은 일일 `TN_PM_SMLT_STNG`
조회 결과에서 채운다. 반환 DTO 가 그대로 `TN_PM_SMLT_USER_MSTR` INSERT 파라미터가 된다.

**`@Transactional(propagation = REQUIRED)`** — 별도 트랜잭션으로 떼지 않는다.
요청 등록이 실패하면 snapshot 도 같이 롤백돼야 한다.

---

## 5. 상태 전이 (`New → Executing → Finished / Failed`)

### 5.1 상태 정의

`TN_PM_SMLT_USER_MSTR.SMLT_STTS` — NOT NULL, CHECK 제약으로 강제.
**CAST 가 보내는 문자열 4개를 그대로 값으로 쓴다.** 자체 코드를 따로 두지 않는다.

주기의 주체는 CAST 다. **우리가 선점(claim)하지 않는다.**

```
CAST 가 1분 주기로 REQ_GetResource.do 를 polling
  → 응답에 SMLT_STTS = 'New' 인 행이 있으면
  → CAST 가 REQ_SetResource.do 로 'Executing' 을 통보
  → 실행 후 결과를 REQ_SetResource.do 로 전송
```

| 상태 | 의미 | 진입 주체 |
|---|---|---|
| `New` | 요청 등록 완료, CAST 가 아직 가져가지 않음 | `executeUserSmlt()` |
| `Executing` | CAST 가 집어서 실행 중 | `REQ_SetResource`(GenericTable) |
| `Finished` | 결과 수신·저장 완료 | `REQ_SetResource`(결과) 또는 상태 통보 |
| `Failed` | CAST 실패 통보 | `REQ_SetResource`(GenericTable) |

### 5.2 허용 전이

```
New       → Executing | Failed
Executing → Finished | Failed
Finished  → (종착)
Failed    → (종착)
```

재실행은 같은 행을 되돌리는 것이 아니라 **새 `SMLT_FLFMT_SN` 으로 새 요청을 만드는 것**이다.

**모든 전이는 CAS(compare-and-set) UPDATE 로만 한다.**

```sql
UPDATE PMOWN.TN_PM_SMLT_USER_MSTR
   SET SMLT_STTS = #{toStts}, ...
 WHERE SMLT_REQ_ID = #{smltReqId}
   AND SMLT_STTS   = #{fromStts}
```

영향 행 수 0 이면 이미 다른 경로가 전이시킨 것이므로 **에러가 아니라 무시**한다(멱등).
현재 `updateWhatIfDefinitionTableStts` 의 `AND SMLT_STTS != #{status}` 는 전이 방향을 검사하지
않아서 `DONE → EXECUTING` 같은 역행도 통과한다. 이 조건을 `AND SMLT_STTS = #{fromStts}` 로 바꾼다.

### 5.3 CAST 상태 ↔ 수행이력 ↔ 화면

세 축이 다르다. **하나로 합치지 않는다.** 접는 지점은 `UserSmltReqStatus.toExecStatus()` 한 곳뿐이다.

| `SMLT_STTS` | `TH_PM_SMLT_FLFMT_HSTRY.SMLT_FLFMT_STTS_CD` | 화면(`SmltExecStatus`) |
|---|---|---|
| `New` · `Executing` | `RUNNING` | `RUNNING` |
| `Finished` | `DONE` | `DONE` |
| `Failed` | `FAILED` | `FAILED` |

> **D7 (확정)** — `SmltExecStatus` 에 `FAILED` 를 추가한다. AGENTS.md 3장의 고정 enum 이지만
> 값 추가는 승인받았다. React 는 `api.types.ts` · `monitoring/types.ts` · `monitoring/view.ts` ·
> `HistoryTable.tsx` · `Monitoring.css` · 목업이 함께 바뀐다.
> KPI 카드는 4장 고정(CSS 결합)이라 "실패" 카드는 만들지 않는다 —
> `doneCnt` 가 `DONE` 만 세므로 **전체 ≠ 완료 + 진행중** 이 될 수 있다.

---

## 6. `REQ_SetResource` 결과 ↔ 수행이력 연결

### 6.1 문제

`insertResult()` 는 `SQ1_TN_PM_SMLT_RSLT.NEXTVAL` 로 결과 `SMLT_ID` 를 새로 만든다.
요청과 이어 줄 단서는 `CastResReqDto.getResourceID()` 문자열뿐이고, 지금은
`" Auto"` / `"WhatIf"` 포함 여부로 종류만 가른다.

### 6.2 연결 키 — 결과가 실어 온 입력 리소스 ID

**결과 XML 의 `Run` 섹션이 CAST 가 쓴 입력 리소스 ID 를 그대로 싣고 있다.**
`RUN_MAP` 이 이미 파싱하고 있고 `insertSimSet` 이 그 값을 `TN_PM_SMLT_STNG` 에 저장한다.

```
RUN_MAP 이 채우는 것 중 일부
  FlightScheduleResourceID       → FS007
  CheckInAllocationResourceID    → CA007
  SBDCounterAllocationResourceID → SBD007
```

요청마다 **새 FS 번호**를 발행하므로 그 번호가 곧 요청 식별자다. `SimulationResultSuffix`
왕복 같은 추가 계약을 CAST 에 요구하지 않아도 된다.

```
1. WhatIf 결과면 FlightScheduleResourceID 로 TN_PM_SMLT_USER_MSTR 조회
2. 없으면 일일 결과 → 기존 경로 그대로
3. 이미 RSLT_SMLT_ID 가 있으면 → 저장 생략, true 응답        ★ 멱등
4. insertSimSet — TMNL_ID 를 요청의 TMNL_ID 로 (현재 'P01' 하드코딩, C4)
5. insertSimResultDtl 배치
6. USER_MSTR : Executing → Finished, RSLT_SMLT_ID · END_DT 기록
7. FLFMT_HSTRY: RUNNING → DONE, SMLT_FLFMT_END_DT
```

4~7 을 `insertResult()` 와 **한 트랜잭션**으로 묶는다. 3 이 없으면 CAST 가 재전송할 때
`TN_PM_SMLT_RSLT_DTL` 이 중복된다.

> **D9 (확정)** — 리소스 ID 매칭으로 해결. `SMLT_RSLT_SFX` 에는 `SMLT_REQ_ID` 를 그대로
> 넣어 두되(운영 추적용), 연결에는 쓰지 않는다.

### 6.3 결과 없이 끝나는 경우

`Failed` 는 결과 XML 없이 상태 통보로만 온다. 이때는 `updateWhatIf()` 가
`SMLT_REQ_ID` 로 요청을 찾아 수행이력을 `FAILED` 로 닫는다. 닫지 않으면 화면이 계속
"진행중" 으로 남고 `UX_ACTIVE` 때문에 재실행도 막힌다.

### 6.4 삭제 동기화 제거

`updateWhatIf()` 말미의

```java
if(!whatIfIdList.isEmpty()) {
    ... castRestMapper.deleteWhatIfDefinitionTable(whatIf);
}
```

는 **삭제한다.** CAST 상태 응답이 full snapshot 이라는 계약이 확인되지 않았고, 확인되더라도
방금 등록된 `New` 요청이 CAST 의 다음 응답에 못 들어가면 그대로 지워진다.
완료된 요청 정리는 별도 보존기간 배치로 옮긴다 (AGENTS.md 11.6).

---

## 7. 수정 대상 목록

### 7.1 DDL (`java/ddl/cast-ddl.sql` — 실 스키마와 동시 반영)

| 대상 | 변경 |
|---|---|
| `TN_PM_SMLT_USER_MSTR` | §3.2 전체 (개명 + 8컬럼 추가 + 제약 3종 + 인덱스 2종) |
| `TN_PM_SMLT_STNG` | 누락 컬럼 6종 추가 여부 확정 (**C1**) |
| `TN_PM_SMLT_RSLT_DTL` | `AVG/MIN/MAX_WTNG_LEN` 3컬럼 추가 + PK 재정의 (**C5**) |
| 신규 시퀀스 | `SQ1_TN_PM_SMLT_USER_RSRC` (`MINVALUE 2 MAXVALUE 999 CYCLE`) |
| 누락 시퀀스 | `SQ1_TN_PM_SMLT_RSLT` — mapper 가 쓰는데 DDL 파일에 없다 (**C3**, 주석으로만 명시) |

### 7.2 신규 Java

| 파일 | 역할 |
|---|---|
| `cast/enums/UserSmltReqStatus.java` | `New/Executing/Finished/Failed` + 전이 검증 + `toExecStatus()` |
| `cast/dto/UserSmltRsrcSnapshotDto.java` | 발행된 리소스 ID 묶음 + 조정률 |
| `cast/dto/UserSmltReqDto.java` | `TN_PM_SMLT_USER_MSTR` 1행 |
| `cast/service/CastUserSnapshotService.java` + `impl/` | §4.4 snapshot 발행 |
| `cast/mapper/CastUserReqMapper.java` | 요청 등록 · 활성 건 검사 |
| `mapper/CastUserReqMapper.xml` | 위 SQL |
| `cast/mapper/CastUserSnapshotMapper.java` | `*_MSTR`/`*_ATRB` DELETE + INSERT |
| `mapper/CastUserSnapshotMapper.xml` | 위 SQL |
| `ddl/2026-08-27-user-smlt-alter.sql` | 실 스키마 적용용 ALTER |

### 7.3 수정 Java / XML

| 파일 | 변경 |
|---|---|
| `cast/service/impl/CastUserSmltServiceImpl.java` | `executeUserSmlt()` 전면 개편(§8.1). 조건 존재 검사를 세 영역 **AND** 로 강화 |
| `cast/service/CastUserSmltService.java` | 시그니처 유지 (반환 DTO 필드만 증가) |
| `cast/dto/UserSmltExecDto.java` | `smltReqId` 추가 |
| `cast/enums/SmltExecStatus.java` | `FAILED` 추가 |
| `cast/dto/SmltStngDto.java` | `fcltyOpngTbl*` 4종이 컬럼명과 어긋나 항상 null 이었다. 컬럼명에 맞춰 개명 + `fcltyOpngDptcnySrngRsrcId` 추가 |
| `cast/service/impl/CastDepServiceImpl.java` · `CastDepHallServiceImpl.java` | 위 getter 호출부 |
| `cast/mapper/CastSmltMapper.java` + `.xml` | `retrieveUserSmltCondFilledCnt`(세 영역 AND) · `updateSmltFlfmtClosed` 추가. `retrieveUserSmltCondCnt` 제거. `retrieveSmltStng` 에 누락 컬럼 추가 |
| `castrest/service/impl/CastRestServiceImpl.java` | `insertResult()` 에 요청 역추적 · 멱등 검사 · 이력 완료 처리 · `updateWhatIf()` 의 삭제 루프 제거 + 전이 검증 · 매핑 실패 시설 기록 |
| `castrest/mapper/CastRestMapper.java` | `retrieveUserReqByFsRsrcId`, `retrieveUserReqByKey`, `updateUserReqFinished`, `insertSimResultDtlRegExcl`(선언 누락분) 추가 |
| `mapper/CastRestMapper.xml` | `retrieveWhatIfCntrl` 에 **`WHERE SMLT_STTS = 'New'` 추가** · 컬럼명 `SMLT_ID`→`SMLT_REQ_ID` · `LISTAGG` 를 `NVL(...,' ')` 로 감싸고 정렬 기준 통일(§8.6) · `insertSimSet` 의 `'P01'` 하드코딩 제거 · `updateWhatIfDefinitionTableStts` 를 CAS 로 · 요청 조회/완료 SQL 3종 추가 |

> **실 백엔드에서 함께 고쳐야 하는 것** — `aoms.pm.cmmn.dto` 는 이 참조 사본에 없다.
> `CastResReqDto` 에 `tmnlId`, `CastWhatIfCntrlDto` 에 `fromStatus` 필드를 추가해야
> 위 XML 의 `#{tmnlId}` · `#{fromStatus}` 바인딩이 동작한다.

### 7.4 React (변경 최소)

| 파일 | 변경 |
|---|---|
| `src/types/api.types.ts` | `UserSmltExecDto` 에 `smltReqId: string` 추가. **기존 필드명은 손대지 않는다** |
| `src/api/pm/mock/userSmlt.mock.ts` | 목업에 `smltReqId` 추가 |
| `src/modules/pm/pages/monitoring/view.ts` | `FAILED` 를 도입한다면 `EXEC_STATUS_TO_RUN_STATUS` 확장 (D7 결정 후) |

**D7 이 "FAILED 를 화면에 노출하지 않음" 으로 나면 React 변경은 `api.types.ts` 한 줄과 목업뿐이다.**

---

## 8. 트랜잭션 경계 · 중복 실행 · 재시도

### 8.1 T1 — 실행 등록 (`executeUserSmlt`)

**한 트랜잭션.** `@Transactional(rollbackFor = Exception.class)` 는 이미 클래스에 걸려 있다.

```
1. 조건 검사       운항·체크인·출국장 세 영역 각각 존재 (AND)
                   기존 SUM 방식은 한 영역만 있어도 통과했다 — AGENTS.md 11.5-4
2. 활성 요청 검사   SMLT_STTS IN ('New','Executing') 인 (SMLT_ID, TMNL_ID) 존재 시 거절
3. SMLT_FLFMT_SN 채번   MAX + 1
4. SMLT_REQ_ID 조립     'WI' + SMLT_ID + TMNL_ID + LPAD(SN,4,'0')
5. snapshot 발행        CastUserSnapshotService.publish()
6. TH_PM_SMLT_FLFMT_HSTRY INSERT  (RUNNING)
7. TN_PM_SMLT_USER_MSTR   INSERT  (New, 리소스 ID 전부, RSLT_SMLT_ID = NULL)
```

6 을 7 보다 먼저 하는 이유: FK 방향이 `USER_MSTR → FLFMT_HSTRY` 다.

**2 는 경쟁 상황에서 믿을 수 없다.** 진짜 방어는 6·7 에서 유니크 위반이 터지는 것이고
(`TN_PM_SMLT_USER_MSTR_UX_ACTIVE` 또는 이력 PK), 서비스는 `DuplicateKeyException` 을 잡아
`"이미 수행 중인 시뮬레이션이 있습니다."` 로 바꿔 응답한다. 2 는 정상 경로의 친절한 메시지용이다.

> **D10 (확정)** — `SMLT_FLFMT_SN` 은 `MAX+1` 을 유지한다. "SMLT_ID 안의 1회·2회" 라는
> 의미가 유지되고, `UX_ACTIVE` 가 같은 (draft, 터미널) 동시 실행을 이미 막아서
> 경쟁이 남는 곳은 T1·T2 가 같은 `SMLT_ID` 를 공유할 때뿐이다.

### 8.2 T2 — `REQ_GetResource` (CAST 가 조건을 읽어감)

읽기 전용. **우리가 선점하지 않는다.**
`retrieveWhatIfCntrl` 에 `WHERE SMLT_STTS = 'New'` 를 반드시 넣는다.
지금은 WHERE 가 없어 완료·실패 건까지 전부 CAST 에 다시 내보내고 있다 — **재실행의 직접 원인.**

> **D11 (확정)** — CAST 가 1분 주기로 polling 하고, `New` 행을 보면
> `REQ_SetResource` 로 `Executing` 을 통보한다. 주기의 주체가 CAST 이므로
> 서버가 읽기 시점에 claim 하지 않는다.

### 8.3 T3 — `REQ_SetResource` (GenericTable = 상태 통보)

한 트랜잭션. 행별 CAS UPDATE. 영향 0행은 무시. 삭제 루프 제거(§6.4).

### 8.4 T4 — `REQ_SetResource` (결과)

**한 트랜잭션에 전부 묶는다.**

```
1. FlightScheduleResourceID 로 USER_MSTR 조회 (없으면 = 일일 결과. 기존 경로 그대로)
2. 멱등 검사: RSLT_SMLT_ID 가 이미 있으면 → 저장 생략, true 응답
3. insertSimSet  (TMNL_ID = 요청의 TMNL_ID)
4. insertSimResultDtl 배치
5. USER_MSTR: New/Executing → Finished, RSLT_SMLT_ID·END_DT 기록
6. FLFMT_HSTRY: RUNNING → DONE, SMLT_FLFMT_END_DT
```

2 가 멱등성의 전부다. CAST 가 같은 결과를 재전송해도 `TN_PM_SMLT_RSLT_DTL` 이 중복되지 않는다.
**기존 코드에는 이 검사가 없었다.**

### 8.5 재시도

- 재시도는 **새 `SMLT_FLFMT_SN` 을 채번하는 새 요청**이다. 끝난 행을 되돌리지 않는다.
- **완료된 master 와 snapshot 은 보존기간 전 삭제 금지** — 실행된 조건을 재현해야 한다.
- 자동 재시도·타임아웃 회수는 **이번 범위 밖**이다. 수동 복구 SQL 은
  `ddl/2026-08-27-user-smlt-alter.sql` 말미에 주석으로 남겼다.

### 8.6 `LISTAGG` 행 대응 붕괴

`retrieveWhatIfCntrl` 은 16개 컬럼을 각각 `LISTAGG` 한다. 대부분 `ORDER BY SMLT_ID` 로 정렬은
같지만, **NULL 인 셀이 배열에서 통째로 빠져 뒤 값이 한 칸씩 당겨진다.**
게다가 `lastChange` 만 `ORDER BY NVL(LAST_MDFCN_DT,FRST_REG_DT)` 로
**정렬 기준까지 다르다** — 확실한 버그다.

두 가지 다 고친다.

```sql
LISTAGG(NVL(MDL_RSRC_ID, ' '), ',') WITHIN GROUP (ORDER BY SMLT_REQ_ID) AS model
...
LISTAGG(NVL(TO_CHAR(...), ' '), ',') WITHIN GROUP (ORDER BY SMLT_REQ_ID) AS lastChange
```

`NVL(..., ' ')` 는 `retrieveFlightSchedule` 이 이미 쓰고 있는 관행이다.

---

## 9. 단계별 검증 기준

**`java/` 는 컴파일할 수 없다.** 각 단계는 "이 레포에서 할 수 있는 것" 과
"실 백엔드 레포에서만 되는 것" 을 나눠 적는다.

### 단계 1 — DDL·mapper 정합화

| 이 레포 | 실 백엔드 |
|---|---|
| `mapper/*.xml` 의 모든 컬럼 참조를 `ddl/cast-ddl.sql` 과 기계적으로 대조한 차이 목록이 §10 과 일치 | `ALL_TAB_COLUMNS` 로 실 스키마 조회 → §10 각 항목 실측 확정 |
| `ALTER` 스크립트가 `cast-ddl.sql` 반영본과 일치 | 개발 DB 에 `ALTER` 적용 후 기존 화면 6종 조회가 전부 정상 |

**통과 기준: §10 의 C1~C7 이 전부 "실 스키마 확인 완료" 로 닫힌다.**
여기가 안 닫히면 다음 단계로 가지 않는다.

### 단계 2 — 식별자·상태 모델

| 이 레포 | 실 백엔드 |
|---|---|
| `UserSmltReqStatus` 전이표가 §5.2 와 일치 | `TN_PM_SMLT_USER_MSTR` 에 수동 INSERT 후 CHECK 제약이 잘못된 상태값을 거부 |
| — | `TN_PM_SMLT_USER_MSTR_UX_ACTIVE` 가 같은 `(SMLT_ID, TMNL_ID)` 두 번째 `New` INSERT 를 거부 |
| — | `Finished` 행이 하나 더 들어가는 것은 허용 (부분 유니크 인덱스가 의도대로 동작) |

### 단계 3 — snapshot 발행

| 이 레포 | 실 백엔드 |
|---|---|
| 발행 SQL 이 `*_ATRB` PK 전 컬럼을 채우는지 정적 확인 | draft 를 넣고 `publish()` 호출 → `TN_PM_SMLT_SCHDL_ATRB` 행 수 = 대상 일자 운항편 수 |
| — | `REQ_GetResource(FlightSchedule, 'FS'+id)` 를 curl 로 호출 → 조정률이 반영된 `paxCount` 배열 반환 |
| — | 발행 후 draft 를 수정해도 `REQ_GetResource` 응답이 **바뀌지 않는다** (불변성) |
| — | FS/CA/SBD/시설운영 각 `LISTAGG` 배열의 원소 개수가 전부 동일 |

### 단계 4 — 실행 등록

| 이 레포 | 실 백엔드 |
|---|---|
| — | 실행 버튼 1회 → `USER_MSTR` 1행(`New`) + `FLFMT_HSTRY` 1행(`RUNNING`) + snapshot 5쌍 |
| — | **동시 2회 클릭 → 2번째가 `이미 수행 중` 으로 거절.** 이력·snapshot 잔여물 없음 |
| — | snapshot 발행 중 강제 예외 → `USER_MSTR`·`FLFMT_HSTRY`·snapshot 전부 롤백 |
| — | 세 탭 중 하나만 저장한 상태에서 실행 → 거절 (기존에는 통과했다) |

### 단계 5 — CAST 왕복

| 이 레포 | 실 백엔드 |
|---|---|
| — | `REQ_GetResource(WhatIfDefinitionTable)` 응답에 `New` 건만 포함. 완료 건 미포함 |
| — | `REQ_SetResource(Executing)` → `SMLT_STTS='Executing'`, `EXCT_DT` 기록 |
| — | 같은 `Executing` 을 2회 보내도 `EXCT_DT` 가 **한 번만** 갱신 (CAS 확인) |
| — | `Finished` 건에 `Executing` 을 보내면 전이 거부, 상태 유지 |
| — | `Failed` 통보만 와도 수행이력이 `FAILED` 로 닫히고 재실행이 열린다 |
| — | 상태 응답에 없는 행이 **삭제되지 않는다** (삭제 루프 제거 확인) |

### 단계 6 — 결과·이력 완료

| 이 레포 | 실 백엔드 |
|---|---|
| React `npx tsc -b` · `npx eslint .` 통과 | 결과 수신 → `TN_PM_SMLT_STNG` 1행 + `RSLT_DTL` N행 |
| — | **`TN_PM_SMLT_STNG.TMNL_ID` 가 T2 실행 시 `P03`** (하드코딩 제거 확인) |
| — | `USER_MSTR.RSLT_SMLT_ID` 채워짐, `SMLT_STTS='Finished'`, `END_DT` 기록 |
| — | `FLFMT_HSTRY.SMLT_FLFMT_STTS_CD='DONE'`, `SMLT_FLFMT_END_DT` 기록 |
| — | **같은 결과 XML 2회 전송 → `RSLT_DTL` 행 수 불변** (멱등) |
| — | 매핑 실패 시설이 `TN_PM_SMLT_RSLT_DTL_REG_EXCL` 에 남는다 |
| — | 모니터링 화면에 소요시간이 0 이 아닌 값으로 표시 |
| — | 결과 저장 중 예외 → `RSLT_DTL`·`STNG`·`USER_MSTR`·`FLFMT_HSTRY` 전부 롤백, 상태 `Executing` 유지 |

### 단계 7 — 실패 후 재실행

| 실 백엔드 |
|---|
| `Failed` 건 재실행 → 새 `SMLT_FLFMT_SN` 으로 정상 등록 |

---

## 10. 모순 등록부 — **임의로 한쪽을 고르지 않는다**

각 항목은 **실 백엔드 스키마 조회로 먼저 확정**한다. 이 레포의 DDL 은 사진 판독본이다.

### C1. `TN_PM_SMLT_STNG` — mapper 가 읽고 쓰는데 DDL 에 없는 컬럼 6종

`CastSmltMapper.xml#retrieveSmltStng` 와 `CastRestMapper.xml#insertSimSet` 이
다음 6개를 참조하지만 `cast-ddl.sql` 의 `CREATE TABLE` 에는 없다.

```
PRPT_SET_RSRC_ID
MDL_RSRC_ID
EXCN_ID
CKNCT_SRVC_HR_RSRC_ID
CHKN_TYPE_RSRC_ID
FCLTY_OPNG_TR_SCRTY_CNTRL_RSRC_ID
```

**둘 중 하나가 틀렸다.** mapper 가 실제로 돌고 있다면 DDL 이 불완전한 것이고,
DDL 이 맞다면 이 SQL 은 `ORA-00904` 로 죽고 있어야 한다.
→ **실 스키마 조회로 확정. DDL 을 임의로 늘리지 않는다.**

부가: `retrieveSmltStng` 는 DDL 에 있는 `FCLTY_OPNG_DPTCNY_SRNG_RSRC_ID` 를 **읽지 않는데**
`insertSimSet` 은 **쓴다.** 조회 SELECT 목록의 누락일 가능성이 높다 (추정).

### C2. `TN_PM_SMLT_USER_MSTR` — 양방향 불일치

- **C2-a** DDL 에 없는데 `retrieveWhatIfCntrl` 이 읽는 것:
  `FCLTY_OPNG_SCRTY_CNTRL_RSRC_ID`, `FCLTY_OPNG_TR_SCRTY_CNTRL_RSRC_ID`
- **C2-b** DDL 에 있는데 아무도 읽지 않는 것: `CKNCT_TYPE_CNTRL_RSRC_ID`

C2-b 는 "CAST 가 안 쓰는 컬럼" 일 수도, "WhatIf 조회 SQL 의 누락" 일 수도 있다.
**삭제하지 말고 D3 으로 남긴다.**

### C3. 시퀀스 `PMOWN.SQ1_TN_PM_SMLT_RSLT` 가 DDL 파일에 없다

`retrieveSimId` 가 `SQ1_TN_PM_SMLT_RSLT.NEXTVAL` 을 쓰는데 `cast-ddl.sql` 전체에
`CREATE SEQUENCE` 문이 **한 줄도 없다.** DDL 파일이 테이블만 담은 것으로 보이지만(추정),
신규 시퀀스를 만들기 전에 기존 시퀀스의 실제 정의(캐시·최대값·순환 여부)를 확인해야 한다.
`TN_PM_SMLT_STNG.SMLT_ID` 가 `VARCHAR2(8)` 이므로
**시퀀스가 8자리를 넘기는 순간부터 INSERT 가 깨진다.**

### C4. `insertSimSet` 의 `TMNL_ID = 'P01'` 하드코딩

```sql
, TMNL_ID
...
, 'P01'
```

T2(`P03`) 결과도 P01 로 저장된다. 요약보기·맵형태보기가 `TMNL_ID` 로 거르므로
**T2 사용자 시뮬레이션 결과는 T1 화면에 섞여 보이거나 T2 화면에서 사라진다.**
버그로 확정적이나, `SLF_ID`/`PRNT_ID` 에 다른 의미가 실려 있을 가능성이 있어
**결과 XML 실물 1건을 확보해 확인한 뒤 고친다.**

### C5. `TN_PM_SMLT_RSLT_DTL` — 컬럼 3종 누락 + PK 불일치

- `insertSimResultDtl` 이 `AVG_WTNG_LEN`, `MIN_WTNG_LEN`, `MAX_WTNG_LEN` 을 INSERT 하는데
  DDL `CREATE TABLE` 에 없다.
- DDL PK 는 `(SMLT_ID, SMLT_EXCN_DT, SMLT_ACTL_DT, SMLT_MDL_SN)` 인데,
  실제로는 **같은 시각에 시설(`PSG_FCLT_CD`)별로 여러 행**을 넣는다.
  DDL 대로면 두 번째 시설에서 PK 위반이 난다.
  → 실 PK 에 `PSG_FCLT_CD` 또는 `SMLT_RSLT_SN` 이 포함돼 있을 가능성이 높다 (추정).

**멱등 재수신 설계(§8.4)가 이 PK 정의에 직접 의존하므로 반드시 먼저 확정한다.**

### C6. `EMI`/`IMMI` 의 의미가 두 DDL 주석에서 서로 반대다

같은 원본 컬럼명 `EMI`/`IMMI` 에 대해

- `TN_PM_SMLT_STNG` — `FCLTY_OPNG_EMI_RSRC_ID` = **'시설물운영입국심사리소스아이디'**,
  `FCLTY_OPNG_IMMI_RSRC_ID` = '시설물운영법무부리소스아이디'
- `TN_PM_SMLT_USER_MSTR` — `원본은 EMI였음` → `FCLTY_OPNG_DPTCNY_RSRC_ID` = **'시설물운영출국리소스아이디'**,
  `원본은 IMMI였음` → `FCLTY_OPNG_ENTCNY_RSRC_ID` = '시설물운영입국리소스아이디'

**EMI 가 출국(emigration)인지 입국심사인지 두 주석이 반대로 말한다.**
snapshot 발행에서 어느 시설운영 테이블을 어느 컬럼에 넣을지가 여기 달려 있다.
`CastRestServiceImpl` 의 `handleEmigration`/`handleImmigration` 이 읽는 테이블을 실물로 대조해 확정한다.

또한 `TN_PM_SMLT_STNG` 과 `TN_PM_SMLT_USER_MSTR` 이 **같은 개념에 다른 컬럼명**을 쓴다
(`EMI/IMMI` vs `DPTCNY/ENTCNY`). 통일 여부는 D12.

### C7. XML 에만 있고 Mapper 인터페이스에 없는 문장

`CastRestMapper.xml` 에는 있으나 `CastRestMapper.java` 에 선언이 없는 것:
`insertSimResultDtlRegExcl`, `retrieveSimSetByPk`, `deleteSimResultDtl`,
`updateSimResultDtl`, `retrieveAtchFileList`, `updateAtchFile`, `deleteAtchFile`.

특히 `insertSimResultDtlRegExcl` 은 `TN_PM_SMLT_RSLT_DTL_REG_EXCL`(시설코드 매핑 제외 결과)
에 쓰는 유일한 경로인데 **호출되지 않는다.** `processSingleRun()` 은 매핑 실패한 시설을
조용히 건너뛴다 — 즉 **매핑되지 않은 시설의 결과가 아무 기록 없이 사라진다.**
결과 완결성 검증(단계 6)에 영향이 있다.
**D13 (확정) — 살렸다.** `CastRestMapper` 에 선언을 추가하고 `processSingleRun()` 의
`else` 가지에서 호출한다. 나머지 6개는 호출부가 없어 그대로 둔다.

---

## 11. 결정 로그 (Decision Log)

### 확정 (2026-08-27)

| # | 결정할 것 | 결정 |
|---|---|---|
| **D1** | CAST `WhatIfRunID` 형식 제약 | `'WI' + SMLT_ID + TMNL_ID + LPAD(SN,4,'0')` 로 간다. CAST 쪽 길이 제한이 드러나면 그때 줄인다 |
| **D2** | `USER_MSTR.SMLT_ID` 개명 | **`SMLT_REQ_ID` 로 개명.** draft 용 `SMLT_ID`(VARCHAR2(8)) 를 따로 둔다 |
| **D3** | `CKNCT_TYPE_CNTRL_RSRC_ID` | 컬럼만 유지, WhatIf 조회에는 미추가 |
| **D4** | 조정률 반올림 | 편별 단순 `ROUND`. 계수는 `(100 + AJMT_RT)/100` |
| **D5** | 기존 `USER_MSTR` backfill | `SMLT_STTS='Failed'` 로 닫고 신규 요청부터 정상 경로 |
| **D6** | snapshot `USE_YN` · 보존 | `'Y'`. 998행 유계 + 발행 시 `DELETE → INSERT` |
| **D7** | `FAILED` 의 화면 표현 | `SmltExecStatus` 에 `FAILED` 추가. KPI 카드는 4장 유지 |
| **D8** | `Executing` 타임아웃 | **범위 밖.** 감시 배치를 두지 않는다 (§11 미해결 참조) |
| **D9** | 결과 ↔ 요청 연결 | 결과 XML 의 `FlightScheduleResourceID` 로 역추적 |
| **D10** | `SMLT_FLFMT_SN` 채번 | `MAX+1` 유지 + `DuplicateKeyException` 처리 |
| **D11** | claim 시점 | 선점하지 않는다. CAST 가 1분 polling 후 `Executing` 을 통보 |
| **D13** | `RSLT_DTL_REG_EXCL` | 살린다 |
| — | 리소스 번호 채번 | 공용 카운터 1개, `002~999` 순환, `001` 은 일일 고정 |

### 미해결

| # | 남은 것 | 왜 지금은 막지 않는가 |
|---|---|---|
| **C1·C2·C5** | DDL ↔ mapper 불일치 | mapper 기준으로 ALTER 를 냈다. **실 스키마 조회로 확정해야 적용 가능** |
| **C3** | `SQ1_TN_PM_SMLT_RSLT` 정의 미상 | `SMLT_ID` 가 `VARCHAR2(8)` 이라 8자리를 넘기면 INSERT 가 깨진다 |
| **C6 / D12** | `EMI`/`IMMI` 의미 상충 | 출국심사·입국심사는 **승계 대상**이라 우리가 값을 만들지 않는다 |
| **D8** | 타임아웃 회수 경로 없음 | CAST 가 `Executing` 상태로 죽으면 수동 복구가 필요하다 |
| — | GOOWN 부속 컬럼 9종 | `FS001` 원천에서만 해당. `FSxxx` 원천이면 전 컬럼 복사라 무관 |

---

## 12. 작업 순서와 현재 상태

AGENTS.md 11.7 의 우선순위를 단계로 편 것이다. **코드는 전부 작성했다.**

```
1. DDL·mapper 정합화 (§7.1, C1~C7)              ─ 작성 완료
2. 식별자·상태 모델 (§2, §3, §5)                 ─ 작성 완료
3. snapshot 발행 (§4)                            ─ 작성 완료
4. USER_MSTR 등록 + 실행 트랜잭션 (§8.1)         ─ 작성 완료
5. Polling·상태 전이 (§8.2~8.3, 삭제 루프 제거)  ─ 작성 완료
6. 결과·수행이력 연결 (§6, §8.4)                 ─ 작성 완료
7. React FAILED 표기 (§7.4)                      ─ 작성 완료 · tsc/eslint 통과
```

남은 것은 **적용 전 확인**이다. 순서대로 닫는다.

```
A. 실 스키마 조회로 C1·C2·C5 확정 → ALTER 스크립트 조정
B. aoms.pm.cmmn.dto 에 CastResReqDto.tmnlId · CastWhatIfCntrlDto.fromStatus 추가
C. GOOWN.TN_GO_GD_DATA · CAOWN.TN_CA_CKNCT 컬럼 확인 → snapshot XML 의 TODO 해소
D. 실 백엔드 레포로 옮겨 빌드 → §9 단계별 검증
```

**Java 는 이 레포에서 컴파일되지 않는다.** 각 단계는 실 백엔드 레포에서 빌드·기동한 뒤에야
"완료" 로 표시할 수 있다. 이 레포에서 통과시킨 것은 React 의 `tsc -b` · `eslint` 뿐이다.
