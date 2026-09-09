# TN_PM_SMLT_USER_MSTR — PM_시뮬레이션사용자마스터

사용자 시뮬레이션 **실행 요청 1건 = 1행**. 화면이 등록하고 CAST 가
`REQ_GetResource(WhatIfDefinitionTable)` 로 읽어 가는 큐 테이블이다.

- 편집 draft 가 아니다 → `TN_PM_SMLT_USER_*`
- 수행이력이 아니다 → `TH_PM_SMLT_FLFMT_HSTRY`
- 결과 세트가 아니다 → `TN_PM_SMLT_STNG` · `TN_PM_SMLT_RSLT_DTL`

```
SMLT_ID (draft)
  └─1:N─ SMLT_FLFMT_SN (수행 회차)          TH_PM_SMLT_FLFMT_HSTRY
           └─1:1─ SMLT_REQ_ID (실행 요청)    TN_PM_SMLT_USER_MSTR   ← 이 테이블
                    └─0:1─ RSLT_SMLT_ID (결과 세트)  TN_PM_SMLT_STNG
```

> **실행 요청에는 터미널 축이 없다** (2026-09-09 결정). CAST 는 공항 전체(T1·T2)를 한 번에
> 돌리고 터미널별 수행 옵션이 없다. 한 요청이 발행하는 FS·CA·SBD·시설운영 리소스에 양 터미널
> draft 가 함께 들어간다. 편집 draft(`TN_PM_SMLT_USER_*`)는 화면이 터미널 탭으로 나뉘어 있어
> `TMNL_ID` 를 그대로 둔다 — 터미널은 **편집의 축이지 실행의 축이 아니다.**

---

## 1. 컬럼 순서 규칙

블록 단위로 고정한다. 새 컬럼은 **해당 블록의 끝**에 넣는다.

| 순번 | 블록 | 무엇 |
|---|---|---|
| 1 | PK | `SMLT_REQ_ID` |
| 2–4 | 업무 식별 | 무엇의 · 언제 · 몇 회차 실행인가 |
| 5 | 결과 링크 | `RSLT_SMLT_ID` |
| 6–19 | CAST 입력 리소스 ID | CAST 가 WhatIfDefinitionTable 에서 읽는 순서 |
| 20 | 결과 접미사 | `SMLT_RSLT_SFX` |
| 21 | 상태 | `SMLT_STTS` |
| 22–24 | 생명주기 시각 | 등록 → 실행 → 종료 순 |
| 25 | 오류 | `ERR_MSG` |
| 26–31 | 공통 감사 | 전 테이블 공통 6종, 항상 맨 뒤 |

리소스 블록(6–19)의 순서는 장식이 아니다. `CastUserReqMapper.xml#insertUserReq` 의 컬럼
나열과 `CastRestMapper.xml#retrieveWhatIfCntrl` 의 `LISTAGG` 나열이 **같은 순서**를 쓴다.
한쪽에 끼워 넣으면 세 곳을 같이 고친다.

**한 가지는 순서상 어색하지만 그대로 둔다.** `CKNCT_TYPE_CNTRL_RSRC_ID`(17) 는 아무도 읽지
않는다. 원본 스키마에 있던 칸이라 자리만 지키고 WhatIf 조회에는 넣지 않는다 — CAST 가 안 쓰는
칸을 새로 내보내면 파싱이 깨질 수 있다.

> **실 스키마의 물리 순서는 아래와 다르다.** `java/ddl/2026-08-27-user-smlt-alter.sql` 이
> `ALTER TABLE … ADD` 로 붙인 9개 컬럼(`SMLT_ID` · `EXCN_YMD` · `SMLT_FLFMT_SN` ·
> `RSLT_SMLT_ID` · `QUEUE_DT` · `END_DT` · `ERR_MSG` · `FCLTY_OPNG_SCRTY_CNTRL_RSRC_ID` ·
> `FCLTY_OPNG_TR_SCRTY_CNTRL_RSRC_ID`)은 테이블 끝에 붙는다. 아래 순서는 **신규 생성 시의
> 정본**이고, 기존 스키마를 재정렬하지는 않는다.

---

## 2. 컬럼 스펙

| # | 컬럼 | 논리명 | 타입 | NULL | 기본값 | 채우는 주체 · 값 규칙 |
|---:|---|---|---|:--:|---|---|
| 1 | `SMLT_REQ_ID` | 시뮬레이션실행요청아이디 | `VARCHAR2(100)` | N | | 앱 `insertUserReq`. `'WI' + SMLT_ID + LPAD(SN,4,'0')` (예 `WI202608270001`). CAST 가 `WhatIfRunID` 로 읽는다 |
| 2 | `SMLT_ID` | 시뮬레이션아이디 | `VARCHAR2(8)` | N | | 편집 draft ID. 재실행해도 안 바뀐다 |
| 3 | `EXCN_YMD` | 실행연월일 | `VARCHAR2(8)` | N | | `TN_PM_SMLT_STNG.EXCN_YMD` 복사 (`yyyyMMdd`) |
| 4 | `SMLT_FLFMT_SN` | 시뮬레이션수행일련번호 | `NUMBER(5,0)` | N | | `retrieveNextSmltFlfmtSn(smltId)` |
| 5 | `RSLT_SMLT_ID` | 결과시뮬레이션아이디 | `VARCHAR2(8)` | Y | | 결과 수신 시 `updateUserReqFinished` 가 채운다. `TN_PM_SMLT_STNG.SMLT_ID` |
| 6 | `MDL_RSRC_ID` | 모델리소스아이디 | `VARCHAR2(100)` | Y | | 일일 설정 승계 |
| 7 | `FLT_SCHDL_RSRC_ID` | 항공편스케줄리소스아이디 | `VARCHAR2(100)` | Y | | **신규 발행** `FS` + 리소스번호. 결과 역추적 키(IX2) |
| 8 | `CKNCT_ALCTN_RSRC_ID` | 체크인카운터배정리소스아이디 | `VARCHAR2(100)` | Y | | **신규 발행** `CA` + 리소스번호 |
| 9 | `SBD_CNTRL_ALCTN_ID` | 탑승구관리배정아이디 | `VARCHAR2(100)` | Y | | **신규 발행** `SBD` + 리소스번호. 이름에 `RSRC` 가 없는 것은 원본 유지 |
| 10 | `PRPT_STNG_RSRC_ID` | 속성설정리소스아이디 | `VARCHAR2(100)` | Y | | 일일 `TN_PM_SMLT_STNG.PRPT_SET_RSRC_ID` 승계 |
| 11 | `FCLTY_OPNG_DPTCNY_SRNG_RSRC_ID` | 시설물운영출국심사리소스아이디 | `VARCHAR2(100)` | Y | | **신규 발행** `FacilityOpeningTable_DepartureGate` + 리소스번호 |
| 12 | `FCLTY_OPNG_DPTCNY_RSRC_ID` | 시설물운영출국리소스아이디 | `VARCHAR2(100)` | Y | | 일일 `EMI` 승계 |
| 13 | `FCLTY_OPNG_ENTCNY_RSRC_ID` | 시설물운영입국리소스아이디 | `VARCHAR2(100)` | Y | | 일일 `IMMI` 승계 |
| 14 | `FCLTY_OPNG_SCRTY_CNTRL_RSRC_ID` | 시설물운영보안검색리소스아이디 | `VARCHAR2(100)` | Y | | **신규 발행** `FacilityOpeningTable_SecurityControl` + 리소스번호 |
| 15 | `FCLTY_OPNG_TR_SCRTY_CNTRL_RSRC_ID` | 시설물운영환승보안검색리소스아이디 | `VARCHAR2(100)` | Y | | 일일 승계 |
| 16 | `CKNCT_SRVC_HR_RSRC_ID` | 체크인카운터서비스시간리소스아이디 | `VARCHAR2(100)` | Y | | 일일 승계 |
| 17 | `CKNCT_TYPE_CNTRL_RSRC_ID` | 체크인카운터유형관리리소스아이디 | `VARCHAR2(100)` | Y | | **미사용.** INSERT·조회 어디에도 없다. 항상 NULL |
| 18 | `CHKN_TYPE_RSRC_ID` | 체크인유형리소스아이디 | `VARCHAR2(100)` | Y | | 일일 승계 |
| 19 | `RPT_STNG_ATRB_ID` | 근접시간대그룹속성아이디 | `VARCHAR2(100)` | Y | | INSERT 경로는 있으나 snapshot 이 값을 안 만들어 **현재 항상 NULL** |
| 20 | `SMLT_RSLT_SFX` | 시뮬레이션결과접미사 | `VARCHAR2(100)` | Y | | `SMLT_REQ_ID` 와 같은 값을 넣는다 |
| 21 | `SMLT_STTS` | 시뮬레이션상태 | `VARCHAR2(20)` | N | `'New'` | CAST 문자열 4종(CK1). 전이는 §5 |
| 22 | `QUEUE_DT` | 대기등록일시 | `TIMESTAMP(6)` | N | `CURRENT_TIMESTAMP` | 요청 등록 시각 |
| 23 | `EXCT_DT` | 실행일시 | `TIMESTAMP(6)` | Y | | `Executing` 전이 때만 찍는다 |
| 24 | `END_DT` | 종료일시 | `TIMESTAMP(6)` | Y | | `Finished` · `Failed` 전이 때 찍는다 |
| 25 | `ERR_MSG` | 오류메시지 | `VARCHAR2(1000)` | Y | | 실패 사유 |
| 26 | `FRST_RGTR_ID` | 최초등록자아이디 | `VARCHAR2(40)` | Y | | 세션 사용자 |
| 27 | `FRST_RGTR_IP_ADDR` | 최초등록자IP주소 | `VARCHAR2(40)` | Y | | 원본이 40. 다른 PM 테이블 다수는 `VARCHAR2(23)` — 넓은 쪽이라 문제되지 않아 유지 |
| 28 | `FRST_REG_DT` | 최초등록일시 | `TIMESTAMP(6)` | Y | `CURRENT_TIMESTAMP` | |
| 29 | `LAST_MDFR_ID` | 최종수정자아이디 | `VARCHAR2(40)` | Y | | 상태 전이는 `'SYSTEM'`, 결과 수신은 `'CAST'` |
| 30 | `LAST_MDFR_IP_ADDR` | 최종수정자IP주소 | `VARCHAR2(40)` | Y | | |
| 31 | `LAST_MDFCN_DT` | 최종수정일시 | `TIMESTAMP(6)` | Y | | |

리소스번호(7~9 · 11 · 14)는 `SQ1_TN_PM_SMLT_USER_RSRC`(`MINVALUE 2 MAXVALUE 999 CYCLE`)
**하나를 공유**한다. 한 요청이 `FS007` · `CA007` · `SBD007` ·
`FacilityOpeningTable_DepartureGate007` · `FacilityOpeningTable_SecurityControl007` 을 통째로
받는다 — 타입별로 따로 돌리면 `CastRestMapper.xml#retrieveFcltyOpngTblDptg` 가 깨진다.
그 SQL 이 출국장 번호로 `TN_PM_SMLT_SCHDL_ATRB.SCHDL_ATRB_GROUP_ID` 를 뒤지기 때문이다.

---

## 3. DDL

```sql
CREATE TABLE "PMOWN"."TN_PM_SMLT_USER_MSTR"
(
	"SMLT_REQ_ID"                       VARCHAR2(100) NOT NULL ENABLE VALIDATE,
	"SMLT_ID"                           VARCHAR2(8)   NOT NULL ENABLE VALIDATE,
	"EXCN_YMD"                          VARCHAR2(8)   NOT NULL ENABLE VALIDATE,
	"SMLT_FLFMT_SN"                     NUMBER(5,0)   NOT NULL ENABLE VALIDATE,
	"RSLT_SMLT_ID"                      VARCHAR2(8),
	"MDL_RSRC_ID"                       VARCHAR2(100),
	"FLT_SCHDL_RSRC_ID"                 VARCHAR2(100),
	"CKNCT_ALCTN_RSRC_ID"               VARCHAR2(100),
	"SBD_CNTRL_ALCTN_ID"                VARCHAR2(100),
	"PRPT_STNG_RSRC_ID"                 VARCHAR2(100),
	"FCLTY_OPNG_DPTCNY_SRNG_RSRC_ID"    VARCHAR2(100),
	"FCLTY_OPNG_DPTCNY_RSRC_ID"         VARCHAR2(100),
	"FCLTY_OPNG_ENTCNY_RSRC_ID"         VARCHAR2(100),
	"FCLTY_OPNG_SCRTY_CNTRL_RSRC_ID"    VARCHAR2(100),
	"FCLTY_OPNG_TR_SCRTY_CNTRL_RSRC_ID" VARCHAR2(100),
	"CKNCT_SRVC_HR_RSRC_ID"             VARCHAR2(100),
	"CKNCT_TYPE_CNTRL_RSRC_ID"          VARCHAR2(100),
	"CHKN_TYPE_RSRC_ID"                 VARCHAR2(100),
	"RPT_STNG_ATRB_ID"                  VARCHAR2(100),
	"SMLT_RSLT_SFX"                     VARCHAR2(100),
	"SMLT_STTS"                         VARCHAR2(20)  DEFAULT 'New' NOT NULL ENABLE VALIDATE,
	"QUEUE_DT"                          TIMESTAMP(6)  DEFAULT CURRENT_TIMESTAMP NOT NULL ENABLE VALIDATE,
	"EXCT_DT"                           TIMESTAMP(6),
	"END_DT"                            TIMESTAMP(6),
	"ERR_MSG"                           VARCHAR2(1000),
	"FRST_RGTR_ID"                      VARCHAR2(40),
	"FRST_RGTR_IP_ADDR"                 VARCHAR2(40),
	"FRST_REG_DT"                       TIMESTAMP(6)  DEFAULT CURRENT_TIMESTAMP,
	"LAST_MDFR_ID"                      VARCHAR2(40),
	"LAST_MDFR_IP_ADDR"                 VARCHAR2(40),
	"LAST_MDFCN_DT"                     TIMESTAMP(6),
	CONSTRAINT "TN_PM_SMLT_USER_MSTR_PK" PRIMARY KEY ("SMLT_REQ_ID")
 USING INDEX
 PCTFREE 10 INITRANS 2  LOGGING
 TABLESPACE "TSIPM01" ENABLE VALIDATE,
	CONSTRAINT "TN_PM_SMLT_USER_MSTR_UK1" UNIQUE ("SMLT_ID", "SMLT_FLFMT_SN")
 USING INDEX
 PCTFREE 10 INITRANS 2  LOGGING
 TABLESPACE "TSIPM01" ENABLE VALIDATE,
	-- 상태값은 CAST 가 REQ_SetResource 로 보내는 문자열을 그대로 쓴다
	CONSTRAINT "TN_PM_SMLT_USER_MSTR_CK1"
		CHECK ("SMLT_STTS" IN ('New', 'Executing', 'Finished', 'Failed')) ENABLE VALIDATE
)
 PCTFREE 10 INITRANS 2 NOCOMPRESS LOGGING
 TABLESPACE "TSDPM01";

-- 중복 실행 방어. 한 draft 의 미완료 요청은 동시에 1건만 존재한다.
-- 시뮬레이션은 T1·T2 를 한 번에 돌리므로 터미널은 이 축에 들어가지 않는다.
CREATE UNIQUE INDEX "PMOWN"."TN_PM_SMLT_USER_MSTR_UX_ACTIVE"
	ON "PMOWN"."TN_PM_SMLT_USER_MSTR"
	   (CASE WHEN "SMLT_STTS" IN ('New', 'Executing') THEN "SMLT_ID" END)
 TABLESPACE "TSIPM01";

-- CAST 의 New 건 polling
CREATE INDEX "PMOWN"."TN_PM_SMLT_USER_MSTR_IX1"
	ON "PMOWN"."TN_PM_SMLT_USER_MSTR" ("SMLT_STTS", "QUEUE_DT")
 TABLESPACE "TSIPM01";

-- CAST 결과가 실어 보내는 FlightScheduleResourceID 로 요청을 역추적한다
CREATE INDEX "PMOWN"."TN_PM_SMLT_USER_MSTR_IX2"
	ON "PMOWN"."TN_PM_SMLT_USER_MSTR" ("FLT_SCHDL_RSRC_ID")
 TABLESPACE "TSIPM01";

COMMENT ON TABLE "PMOWN"."TN_PM_SMLT_USER_MSTR" IS 'PM_시뮬레이션사용자마스터';
COMMENT ON COLUMN "PMOWN"."TN_PM_SMLT_USER_MSTR"."SMLT_REQ_ID" IS '시뮬레이션실행요청아이디';
COMMENT ON COLUMN "PMOWN"."TN_PM_SMLT_USER_MSTR"."SMLT_ID" IS '시뮬레이션아이디';
COMMENT ON COLUMN "PMOWN"."TN_PM_SMLT_USER_MSTR"."EXCN_YMD" IS '실행연월일';
COMMENT ON COLUMN "PMOWN"."TN_PM_SMLT_USER_MSTR"."SMLT_FLFMT_SN" IS '시뮬레이션수행일련번호';
COMMENT ON COLUMN "PMOWN"."TN_PM_SMLT_USER_MSTR"."RSLT_SMLT_ID" IS '결과시뮬레이션아이디';
COMMENT ON COLUMN "PMOWN"."TN_PM_SMLT_USER_MSTR"."MDL_RSRC_ID" IS '모델리소스아이디';
COMMENT ON COLUMN "PMOWN"."TN_PM_SMLT_USER_MSTR"."FLT_SCHDL_RSRC_ID" IS '항공편스케줄리소스아이디';
COMMENT ON COLUMN "PMOWN"."TN_PM_SMLT_USER_MSTR"."CKNCT_ALCTN_RSRC_ID" IS '체크인카운터배정리소스아이디';
COMMENT ON COLUMN "PMOWN"."TN_PM_SMLT_USER_MSTR"."SBD_CNTRL_ALCTN_ID" IS '탑승구관리배정아이디';
COMMENT ON COLUMN "PMOWN"."TN_PM_SMLT_USER_MSTR"."PRPT_STNG_RSRC_ID" IS '속성설정리소스아이디';
COMMENT ON COLUMN "PMOWN"."TN_PM_SMLT_USER_MSTR"."FCLTY_OPNG_DPTCNY_SRNG_RSRC_ID" IS '시설물운영출국심사리소스아이디';
COMMENT ON COLUMN "PMOWN"."TN_PM_SMLT_USER_MSTR"."FCLTY_OPNG_DPTCNY_RSRC_ID" IS '시설물운영출국리소스아이디';
COMMENT ON COLUMN "PMOWN"."TN_PM_SMLT_USER_MSTR"."FCLTY_OPNG_ENTCNY_RSRC_ID" IS '시설물운영입국리소스아이디';
COMMENT ON COLUMN "PMOWN"."TN_PM_SMLT_USER_MSTR"."FCLTY_OPNG_SCRTY_CNTRL_RSRC_ID" IS '시설물운영보안검색리소스아이디';
COMMENT ON COLUMN "PMOWN"."TN_PM_SMLT_USER_MSTR"."FCLTY_OPNG_TR_SCRTY_CNTRL_RSRC_ID" IS '시설물운영환승보안검색리소스아이디';
COMMENT ON COLUMN "PMOWN"."TN_PM_SMLT_USER_MSTR"."CKNCT_SRVC_HR_RSRC_ID" IS '체크인카운터서비스시간리소스아이디';
COMMENT ON COLUMN "PMOWN"."TN_PM_SMLT_USER_MSTR"."CKNCT_TYPE_CNTRL_RSRC_ID" IS '체크인카운터유형관리리소스아이디';
COMMENT ON COLUMN "PMOWN"."TN_PM_SMLT_USER_MSTR"."CHKN_TYPE_RSRC_ID" IS '체크인유형리소스아이디';
COMMENT ON COLUMN "PMOWN"."TN_PM_SMLT_USER_MSTR"."RPT_STNG_ATRB_ID" IS '근접시간대그룹속성ID';
COMMENT ON COLUMN "PMOWN"."TN_PM_SMLT_USER_MSTR"."SMLT_RSLT_SFX" IS '시뮬레이션결과접미사';
COMMENT ON COLUMN "PMOWN"."TN_PM_SMLT_USER_MSTR"."SMLT_STTS" IS '시뮬레이션상태';
COMMENT ON COLUMN "PMOWN"."TN_PM_SMLT_USER_MSTR"."QUEUE_DT" IS '대기등록일시';
COMMENT ON COLUMN "PMOWN"."TN_PM_SMLT_USER_MSTR"."EXCT_DT" IS '실행일시';
COMMENT ON COLUMN "PMOWN"."TN_PM_SMLT_USER_MSTR"."END_DT" IS '종료일시';
COMMENT ON COLUMN "PMOWN"."TN_PM_SMLT_USER_MSTR"."ERR_MSG" IS '오류메시지';
COMMENT ON COLUMN "PMOWN"."TN_PM_SMLT_USER_MSTR"."FRST_RGTR_ID" IS '최초등록자아이디';
COMMENT ON COLUMN "PMOWN"."TN_PM_SMLT_USER_MSTR"."FRST_RGTR_IP_ADDR" IS '최초등록자IP주소';
COMMENT ON COLUMN "PMOWN"."TN_PM_SMLT_USER_MSTR"."FRST_REG_DT" IS '최초등록일시';
COMMENT ON COLUMN "PMOWN"."TN_PM_SMLT_USER_MSTR"."LAST_MDFR_ID" IS '최종수정자아이디';
COMMENT ON COLUMN "PMOWN"."TN_PM_SMLT_USER_MSTR"."LAST_MDFR_IP_ADDR" IS '최종수정자IP주소';
COMMENT ON COLUMN "PMOWN"."TN_PM_SMLT_USER_MSTR"."LAST_MDFCN_DT" IS '최종수정일시';
```

---

## 4. 제약 · 인덱스가 지키는 것

| 이름 | 종류 | 지키는 규칙 |
|---|---|---|
| `_PK` | PK(`SMLT_REQ_ID`) | 요청 ID 가 `(draft, 회차)` 에서 결정론적이라 PK 가 그대로 중복 실행 방어가 된다 |
| `_UK1` | UNIQUE(`SMLT_ID`, `SMLT_FLFMT_SN`) | 한 회차에 요청 1건. 수행이력 PK 와 같은 축이라 1:1 |
| `_CK1` | CHECK(`SMLT_STTS`) | CAST 문자열 4종 외 유입 차단 |
| `_UX_ACTIVE` | 함수기반 UNIQUE | 한 draft 의 **미완료 요청은 동시 1건**. 완료·실패 건은 `CASE` 가 NULL 이라 인덱스에서 빠진다 |
| `_IX1` | INDEX(`SMLT_STTS`, `QUEUE_DT`) | CAST 의 1분 주기 `WHERE SMLT_STTS = 'New'` polling |
| `_IX2` | INDEX(`FLT_SCHDL_RSRC_ID`) | 결과 XML 의 `FlightScheduleResourceID` → 요청 역추적 |

동시 클릭 방어는 사전 검사(`retrieveActiveReqCnt`)가 아니라 `_UX_ACTIVE` 가 한다. 사전 검사는
친절한 메시지용이고, 걸리면 `DuplicateKeyException` 을 잡아 롤백한다 — 발행된 리소스가 남지
않도록 `setRollbackOnly()` 를 직접 건다.

---

## 5. 상태 모델

```
New       → Executing | Failed
Executing → Finished  | Failed
Finished  → (종착)
Failed    → (종착)
```

| `SMLT_STTS` | 찍히는 시각 | `TH_PM_SMLT_FLFMT_HSTRY.SMLT_FLFMT_STTS_CD` | 화면 `SmltExecStatus` |
|---|---|---|---|
| `New` | `QUEUE_DT` | `RUNNING` | `RUNNING` |
| `Executing` | `EXCT_DT` | `RUNNING` | `RUNNING` |
| `Finished` | `END_DT` | `DONE` | `DONE` |
| `Failed` | `END_DT` | `FAILED` | `FAILED` |

세 축을 하나로 합치지 않는다. 접는 지점은 `UserSmltReqStatus.toExecStatus()` 한 곳뿐이다.

- **모든 전이는 이전 상태를 `WHERE` 에 건 CAS UPDATE.** 영향 0행은 이미 다른 경로가 전이시킨
  것이므로 에러가 아니라 무시한다.
- **서버는 선점하지 않는다.** `New` 를 `Executing` 으로 바꾸는 것은 CAST 다.
- 상태 응답에 없는 행을 삭제하지 않는다. full snapshot 계약이 확인되지 않았고, 방금 등록된
  `New` 가 다음 응답에 못 들어가면 그대로 사라진다.
- `Executing` 으로 멈춘 요청을 회수하는 감시 배치는 **두지 않는다.** 수동 복구 SQL 은
  `java/ddl/2026-08-27-user-smlt-alter.sql` 말미 주석에 있다.

---

## 6. 접근 경로

| 문 | 어디 | 하는 일 |
|---|---|---|
| `insertUserReq` | `CastUserReqMapper.xml` | 앱이 `New` 로 등록. 리소스 ID 칸을 snapshot 에서 채운다 |
| `retrieveActiveReqCnt` | 〃 | draft 단위 미완료 건 사전 검사(메시지용) |
| `retrieveUserReqByKey` | 〃 · `CastRestMapper.xml` | 요청 1건 조회 |
| `retrieveWhatIfCntrl` | `CastRestMapper.xml` | CAST polling. **`WHERE SMLT_STTS = 'New'` 필수** |
| `updateWhatIfDefinitionTableStts` | 〃 | CAS 전이 + `EXCT_DT` · `END_DT` |
| `checkWhatIfIdList` | 〃 | 요청 ID · 상태 목록 |
| `deleteWhatIfDefinitionTable` | 〃 | 요청 삭제 |
| `retrieveUserReqByFsRsrcId` | 〃 | `FLT_SCHDL_RSRC_ID` 로 역추적 |
| `updateUserReqFinished` | 〃 | 결과 수신 완료 처리 + `RSLT_SMLT_ID` |

실행 등록은 요청 ID 채번 · snapshot 발행 · `New` 등록 · 수행이력 연결을 **한 트랜잭션**으로
처리한다. 요청이 이력을 참조하므로 이력을 먼저 넣는다.

`retrieveWhatIfCntrl` 은 전 컬럼을 `LISTAGG` 로 이어 붙인다. **`LISTAGG` 는 NULL 셀을 배열에서
통째로 빼 뒤 값을 한 칸 당기므로** 모든 컬럼에 `NVL(…, ' ')` 를 씌우고 정렬 기준을 전부
`SMLT_REQ_ID` 로 통일해야 행 대응이 유지된다. 컬럼을 추가할 때도 같다.

---

## 7. 터미널 축이 남아 있는 곳

이 테이블에서 `TMNL_ID` 를 걷어내도 **편집·결과 쪽 터미널 축은 그대로다.** 헷갈리지 않도록.

| 어디 | 터미널 | 왜 |
|---|:--:|---|
| `TN_PM_SMLT_USER_*` (draft) | 있음 | 편집 화면이 터미널 탭으로 나뉜다. 조건 자체가 터미널별로 다르다 |
| 발행된 CAST 리소스 (`SCHDL`/`CKNCT`/`SBD`/시설운영 `ATRB`) | 행 컬럼 | 한 리소스에 T1·T2 가 섞여 들어가고, 행마다 자기 `TMNL_ID` 를 싣는다 |
| `TN_PM_SMLT_USER_MSTR` (실행 요청) | **없음** | 실행 단위가 공항 전체다 |
| `TN_PM_SMLT_STNG.TMNL_ID` (결과 세트) | 컬럼만 | 사용자 결과는 아무도 안 실어 `NVL` 기본값 `'P01'` 로 떨어진다. 결과 조회는 시설코드(`TN_PM_SMLT_PSG_FCLT.TMNL_ID`)로 터미널을 가른다 |
| `TH_PM_SMLT_FLFMT_HSTRY.TMNL_ID` (수행이력) | 컬럼만 | 사용자 실행은 채울 값이 없어 NULL 로 남는다 — §8 |

발행 SQL 에서 주의할 점 두 가지.

- **아일랜드 코드와 출국장 번호는 터미널 간에 겹친다.** 부스·기기 번호 매김(`ROW_NUMBER`)과
  조인 키에 `TMNL_ID` 를 반드시 넣는다. 빠지면 T1 부스가 T2 아일랜드에 붙는다.
- **조정률은 편의 터미널로 draft 를 골라 건다.** 운항 `P02` 는 T1(`P01`) 소속이고, 공용(`P`)
  편은 어느 draft 에도 붙지 않아 원본 그대로 나간다.

---

## 8. 미확정

- 이 테이블의 실 스키마는 `java/ddl/2026-08-27-user-smlt-alter.sql` **적용 전**이다. 적용 전에
  `ALL_TAB_COLUMNS` 로 현재 컬럼을 확인한다 — 이미 있는 컬럼은 ORA-01430 이 난다.
- **수행이력의 `TMNL_ID` 가 사용자 실행에서 NULL 로 남는다.** `CastMntrServiceImpl.toTerminalKind()`
  가 NULL 을 `T1` 으로 접으므로 모니터링 상세에서 사용자 실행이 T1 으로 보이고, 거기서 조회를
  열면 T1 탭만 열린다. 이력의 터미널 축을 걷어내는 작업(모니터링 화면 포함)이 아직 남았다.
- **실행 전 조건 검사가 터미널을 보지 않는다.** `retrieveUserSmltCondFilledCnt` 는 draft 에 세
  영역이 있으면 통과하므로, T1 만 저장하고 실행하면 T2 시설 리소스가 빈 채로 발행된다.
  검사를 양 터미널로 강화할지, 없는 터미널은 일일값으로 채울지 결정이 필요하다.
- `java/ddl/cast-ddl.sql` 의 이 블록은 사진 판독본이라 일부 한글 주석의 신뢰도가 낮다
  (원본 주석: `source photo … out of focus`).
- **`EMI` / `IMMI` 의 의미가 두 DDL 주석에서 반대다.** `TN_PM_SMLT_STNG` 은 `EMI` 를 "입국심사"로,
  이 테이블은 같은 원본명을 "출국(DPTCNY)"으로 적었다. 출국심사·입국심사는 사용자가 편집하지
  않고 일일 값을 그대로 승계하므로 지금은 막히지 않지만, 그 축을 편집 대상으로 만들 때는
  반드시 먼저 확정한다.
