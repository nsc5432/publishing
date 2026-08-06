# 5.2 명명 규칙 사전

← [DB-ANALYSIS.md](DB-ANALYSIS.md)

## 테이블 접두

| 접두 | 의미 | 확인된 예 |
|---|---|---|
| `TN_` | 마스터 / 트랜잭션 | `TN_PM_SMLT_STNG`, `TN_CA_CKNCT`, `TN_GO_GD_DATA` |
| `TI_` | 연계·수집 (Interface) | `TI_GO_CKNCT_DALY_ALOT` |
| `TH_` | 이력 (History) | `TH_PM_SMLT_EXCN_LOG`, `TH_PM_DW_DEL_KEY_HSTRY` |
| `TC_` | 코드 | `TC_CA_COM_CD` |
| `DROP_AA_` | 타 시스템 연계 스테이징 | `DROP_AA_SBD_PLCY`, `DROP_AA_TN_AS_GD_DATA` |
| `DROP_` | 작업용 임시 | `DROP_TMP` |

형식: `<접두>_<서브시스템>_<이름>`.

`DROP_AA_` 는 예외적으로 **원본 테이블명을 통째로 뒤에 붙인다** (`DROP_AA_` + `TN_AS_GD_DATA`). 원본 서브시스템 코드가 그대로 남는다:

| 코드 | 시스템 |
|---|---|
| `PM` | 예측관리 (Prediction Mgmt) — 이 프로젝트 |
| `GO` | 운항·게이트 운영 |
| `CA` | 공통·코드·항공사 |
| `AS` | 운항정보 (Airport Schedule) |
| `FP` | 운항계획 (Flight Plan) |
| `RS` | 자원배정 (Resource Scheduling) |

서브시스템 코드는 스키마 소유자와 대응한다 (`PM` → `PMOWN`, `GO` → `GOOWN`, `CA` → `CAOWN`). `AS`/`FP`/`RS` 는 별도 소유자가 아니라 `PMOWN` 아래 `DROP_AA_` 사본으로만 존재한다.

## 컬럼 약어

한국어 로마자 축약이 고정 어휘로 쓰인다.

**업무 명사**

| 약어 | 의미 | 약어 | 의미 |
|---|---|---|---|
| `SMLT` | 시뮬레이션 | `PSG` | 여객 |
| `FCLT` / `FCLTY` | 시설 | `WTNG` | 대기 |
| `PRCS` | 처리 | `TRNST` | 통과·환승 |
| `CKNCT` | 체크인카운터 | `CHKN` / `CKN` | 체크인 |
| `TMNL` | 터미널 | `ALN` | 항공사 |
| `EXCN` | 실행 | `STNG` | 설정 |
| `MDL` | 모델 | `RSLT` | 결과 |
| `DTL` | 상세 | `PREDC` | 예측 |
| `EST` | 예상 | `BGNG` | 시작 |
| `DALY` | 일별 | `ALOT` / `ALCTN` | 배정 |
| `ATRB` | 속성 (Attribute) | `MSTR` | 마스터 |
| `RSRC` / `RSC` | 리소스 | `SCHDL` | 스케줄 |
| `ENTGT` | 입국장 | `DPTGT` | 출국장 |
| `EMIG` | 출국심사 | `IMMIG` | 입국심사 |
| `SCRTY` | 보안 | `CNTRL` | 통제·검색 |
| `SBD` | 셀프백드랍 | `KOS` | 키오스크 |
| `RPT` | 리포트 | `PRD` | 기간 |
| `ELMNT` | 요소 | `CRLTN` | 연관 |
| `BDPSG` | 탑승여객 | `ACST` | 항공기주기장 |
| `CRS` / `CRSL` | 캐로셀 | `ARCFT` | 항공기 |
| `ATFL` / `ATCH` | 첨부(파일) | `MNG` | 관리 |
| `INDV` | 개인 | `GRD` | 등급 |
| `PGE` | 페이지 | `PLCY` | 정책 |
| `RGTR` | 등록자 | `MDFR` / `MDFCN` | 수정자 / 수정 |
| `FRST` | 최초 | `LAST` / `LST` | 최종 |

**타입 접미**

| 접미 | 의미 | 예 |
|---|---|---|
| `_CD` | 코드 | `PSG_FCLT_CD`, `SMLT_EXCN_STTS_CD` |
| `_ID` | 식별자 | `SMLT_ID`, `TMNL_ID`, `ATCH_FILE_ID` |
| `_NM` | 명 | `PSG_FCLT_NM`, `SMLT_FCLT_NM` |
| `_SN` | 일련번호 | `SMLT_RSLT_SN`, `SORT_SEQ` 와 구분 |
| `_SEQ` | 순번 | `SORT_SEQ` |
| `_CNT` | 수 | `WTNG_PSG_CNT`, `FCLTY_CNT` |
| `_HR` | 시간 | `AVG_PRCS_HR`, `OPER_BGNG_1_HR` |
| `_LEN` | 길이 | `AVG_WTNG_LEN`, `WTNG_LINE_LEN` |
| `_YMD` | 일자 (`YYYYMMDD`) | `EXCN_YMD`, `OPER_YMD` |
| `_DT` | 일시 | `SMLT_EXCN_DT`, `CRTR_DT` |
| `_HM` | 시분 (`HHmm`) | `EST_BGNG_HM`, `PREDC_HM` |
| `_YN` | 여부 (`Y`/`N`) | `USE_YN`, `DEL_YN` |
| `_EXPLN` | 설명 | `PSG_FCLT_EXPLN`, `SMLT_MDL_EXPLN` |
| `_SE_CD` | 구분코드 | `DOM_INTL_SE_CD`, `ARR_DEP_SE_CD` |
| `_ADDR` | 주소 | `FRST_RGTR_IP_ADDR` |
| `_VL` | 값 | `MIN_VL`, `MAX_VL`, `KEY_1_VL` |
| `_RT` | 비율 | `CKNCT_RT`, `KOS_RT` |
| `_CN` | 내용 | `CKNCT_RANGE_CN` |
| `_TSP` | 타임스탬프 (`DROP_AA_*` 전용) | `LST_MOD_TSP` |

### 접미가 타입을 배신하는 곳 — 3단계에서 반드시 확인

| 컬럼 | 접미 기대 | 실제 | 근거 |
|---|---|---|---|
| `TN_PM_SMLT_RSLT_DTL.REL_EVENT_CD` | 코드 | 코멘트가 "관련이벤트**수**", 타입 `NUMBER(5,0)` | `ddl.txt:9`, `:45` |
| `TN_PM_SMLT_RSLT_DTL.AVG_PRCS_HR` | 시간 | `NUMBER(5,0)` — 단위가 시/분/초 중 무엇인지 미확인 | `ddl.txt:12` |
| `TN_PM_SMLT_CKNCT_ATRB.CHKN_OPEN_PRNMNT_DT` | 일시(TIMESTAMP) | **`YYYYMMDDHH24MI` 문자열** | `CastRestMapper.xml:1039`, `:1070` |
| `TN_PM_SMLT_SBD_ATRB.OPER_BGNG_DT` | 일시(TIMESTAMP) | **문자열** (`TO_NUMBER(...)` 비교) | `CastRestMapper.xml:1226` |
| `TN_PM_SMLT_SCHDL_ATRB.DEP_ARR_YMD` | `YYYYMMDD` | **`YYYY/MM/DD`** (`REPLACE(...,'/','')` 필요) | `CastRestMapper.xml:1987` |
| `TN_PM_PSG_WTNG_INFO.PSG_FLOW_DATA_CRT_DT` | 일시 | 문자열, `SUBSTR(...,9,4)` 가 `HHmm` | `CastSmltMapper.xml:74` |
| `TI_GO_CKNCT_DALY_ALOT.EST_BGNG_HM` | `HHmm` 문자열 | 문자열이지만 `/ 100` 산술에 그대로 넣는다 | `CastUserConfigMapper.xml:24` |
| `TN_PM_SMLT_RSLT_DTL.SMLT_ACTL_DT` | TIMESTAMP | TIMESTAMP 이지만 `SUBSTR(A.SMLT_ACTL_DT, 0, 10)` 로 **암시적 문자열 변환**해 쓴다 → NLS 세션 포맷 의존 | `CastChknMapper.xml:21-22` |

마지막 항목은 특히 위험하다. `SUBSTR(A.SMLT_ACTL_DT, 0, 10)` 가 `2026/03/20` 형태를 전제하고 `REPLACE(...,'/','')` 로 `YYYYMMDD` 를 만든다. **세션 `NLS_TIMESTAMP_FORMAT` 이 다르면 조용히 잘못된 값이 나온다.**

## 전 테이블 공통 감사 컬럼 6종

**가장 중요한 규칙 — 4단계 INSERT/UPDATE 에서 그대로 쓴다.**

```sql
FRST_RGTR_ID       VARCHAR2(40)     최초등록자아이디
FRST_RGTR_IP_ADDR  VARCHAR2(23)     최초등록자IP주소
FRST_REG_DT        TIMESTAMP(6)     최초등록일시  DEFAULT CURRENT_TIMESTAMP
LAST_MDFR_ID       VARCHAR2(40)     최종수정자아이디
LAST_MDFR_IP_ADDR  VARCHAR2(23)     최종수정자IP주소
LAST_MDFCN_DT      TIMESTAMP(6)     최종수정일시
```

관찰된 사용 규칙:

- **INSERT** — `FRST_*` 3종만 채운다. `LAST_*` 는 건드리지 않는다. (`CastRestMapper.xml:1601-1603`, `:1505-1507`, `:1659-1661`, `:1788-1790`)
- **UPDATE** — `LAST_*` 3종을 항상 함께 채운다. (`:1523-1525`, `:1533-1535`, `:2238-2240`)
- `FRST_REG_DT` / `LAST_MDFCN_DT` 는 `CURRENT_TIMESTAMP` 를 넣는다. `SYSDATE` 가 아니다.
- **CAST 연동 경로에서는 등록자 ID 를 하드코딩한다** — `'CAST'` (`:20`, `:1632`, `:1684`, `:1704`) 또는 `'system'`/`'SYSTEM'` (`:1514`, `:1523`, `:1533`, `:2238`). 대소문자가 일관되지 않다.
- 사용자 경로에서는 `#{loginUserId}` / `#{loginIpAddr}` 를 쓴다 (`:1806-1807`, `:1867-1868`). **3·4단계 사용자 시뮬레이션 저장 API 는 이쪽을 따라야 한다.**
- `DROP_AA_*` 스테이징은 이 규칙을 따르지 않고 `LST_MOD_TSP` 하나만 갖는다 (`:56`, `:81`, `:105`).

## 타입 · 제약 스타일

`ddl.txt` 2개 테이블에서 확인된 하우스 스타일이다. 확인 범위가 2개뿐이므로 **일반화는 유추다.**

| 항목 | 규칙 | 근거 |
|---|---|---|
| 타입 | `VARCHAR2(n)` / `NUMBER(p,0)` / `TIMESTAMP(6)` 만 쓴다. `DATE`·`CLOB`·`NUMBER(p,s>0)` 없음 | `ddl.txt` 전체 |
| NOT NULL | `NOT NULL ENABLE VALIDATE` | `ddl.txt:3` |
| PK 이름 | `<TABLE>_PK` | `ddl.txt:28`, `:82` |
| 테이블스페이스 | 데이터 `TSDPM01` / 인덱스 `TSIPM01` | `ddl.txt:32`, `:36` |
| 저장 파라미터 | `PCTFREE 10 INITRANS 2 NOCOMPRESS LOGGING` | `ddl.txt:34` |
| 코멘트 | **모든 테이블·모든 컬럼에 한국어 `COMMENT ON` 필수** | `ddl.txt:38-63`, `:92-106` |
| 시퀀스 | `SQ1_<TABLE>` (예: `PMOWN.SQ1_TN_PM_SMLT_RSLT.NEXTVAL`) | `CastRestMapper.xml:1550` |
| 함수 | `FN_<서브시스템>_<동사구>` (예: `PMOWN.FN_PM_SAFE_TO_NUMBER`) | `CastChknMapper.xml:26` |

> `DATE` 타입이 없다고 단정할 수 없다. `DROP_TMP.BASE_DT` 는 `TO_CHAR(BASE_DT, 'YYYYMMDD')` 와 `BASE_DT - 1` 산술을 쓰므로 `DATE` 로 보인다 (`CastRestMapper.xml:338`, `:378`). 스테이징 테이블은 하우스 스타일 밖이다.

## 예외 — 스테이징(`DROP_AA_*`)의 다른 어휘

같은 개념에 다른 약어를 쓴다. 3단계에서 두 계열을 오갈 때 실수하기 쉬운 지점이다.

| 개념 | PM 하우스 스타일 | `DROP_AA_*` |
|---|---|---|
| 터미널 | `TMNL_ID` | `TER_ID` |
| 여객 | `PSG` / `BDPSG` | `PAX` |
| 환승여객 | `TRNS_BDPSG_CNT` | `TRPAX_CNT` |
| 항공기 | `ARCFT` | `AC` |
| 예약 | `RSVT` | `RSRV` |
| 일자 | `_YMD` | `_DT` (`SCHD_DT`, `OPR_DT`, `GD_SE_DT`) |
| 최종수정일시 | `LAST_MDFCN_DT` | `LST_MOD_TSP` |
| 국내국제구분 | `DOM_INTL_SE_CD` | `DOM_INT_SE_CD` |
| 체크인카운터 | `CKNCT_ID` | `CIC_ID` |
