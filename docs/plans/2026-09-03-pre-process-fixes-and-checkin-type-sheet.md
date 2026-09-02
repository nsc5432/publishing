# 전처리 반영 체계 결함 수정 + 체크인유형 시트 편입 구현계획

작성일 2026-09-03 · 대상 `data-processing`, `java/cast`, `java/mapper`, `java/ddl`, `react/src`

---

## 0. 이 문서의 전제

- **`java/` 는 참조 사본이라 이 레포에서 컴파일·실행할 수 없다.** 아래 Java 변경은 실제 백엔드
  레포에 옮겨야 검증된다. 이 레포에서 가능한 검증은 SQL 정적 대조, DDL↔mapper 컬럼 대조,
  React `tsc -b` / `eslint` / `build`, Python 구문 검사뿐이다.
- `java/ddl/cast-ddl.sql` 은 사진 판독 + 표준단어 치환본이다. **DDL 단독으로 구현 근거를 삼지
  않는다.** §5 의 확인 항목은 실 스키마 조회(`ALL_TAB_COLUMNS`)로 먼저 확정한다.
- 아래 "현재 상태" 서술은 전부 이 레포의 실제 코드 라인을 근거로 한다.
- 선행 문서: [2026-08-27-user-smlt-cast-linkage.md](docs/plans/2026-08-27-user-smlt-cast-linkage.md)

---

## 1. 배경

직전 커밋 `86b6e11 feat: 전처리 결과(999) 기준정보 반영 체계` 와 그 위의 작업분을 검토한 결과
네 가지 문제가 남았다.

### 1.1 드라이런 경로가 죽었다

[step5_save.py](data-processing/step5_save.py) 의 `run()` 이 mode 분기 **전에**
`assert_unique_keys(uploads)` 를 호출한다. 그런데 CSV 모드는 `step5-{task['name']}.csv` 로
태스크마다 파일이 갈리고 name 에 `-t1`/`-t2` 가 붙어 애초에 키 충돌이 없다.

현재 `05/13/15` 계열에 T1/T2 중복 키가 12개 있어(`_cumulative_per_period` 의 gen 5 + security 5,
`_checkin_reporting_tasks` 2) **DB 모드뿐 아니라 CSV 모드도 즉시 예외로 중단된다.**
업로드 전에 산출물을 눈으로 확인하는 유일한 수단이 막혔다.

### 1.2 주간 파이프라인이 웹 요청 스레드를 붙잡을 수 있다

`prepare_pre_process_group` 이 999 그룹 행을 `SELECT … FOR UPDATE` 로 잡고 `conn.commit()`
까지 놓지 않는다. 그 사이 앱 쪽
[CastConfigServiceImpl.java:402](java/cast/service/impl/CastConfigServiceImpl.java#L402) ·
[:519](java/cast/service/impl/CastConfigServiceImpl.java#L519) 의 `retrieveCategoryForUpdate` 는
대기 한도가 없어 **파이프라인이 끝날 때까지 무한 대기**한다. 반영·되돌리기 요청 스레드가
그대로 붙잡힌다.

### 1.3 체크인유형 999 데이터에 소비자가 없다

파이프라인은 매주 `TN_PM_SMLT_CKNCT_TYPE_ATRB_PRC` 의 999 행을 통째로 갈아 끼운다
(`MANAGED_GROUP_COLUMNS`). 그런데,

- `CastConfigSheet` 은 `PSG_ATRB` / `SHOW_UP_ATRB` / `SRVC_ATRB` 3개뿐이고 관련 SQL 이 전부
  `FIX_ATRB_GROUP_ID` 로 건다. 이 테이블의 그룹 컬럼은 `CKNCT_TYPE_ATRB_ID` 라 비교·반영·되돌리기
  어디에도 안 걸린다.
- CAST 도 못 본다. [CastRestMapper.xml:136](java/mapper/CastRestMapper.xml#L136) 의
  `REQ_GetResourceInformation` 은 `TN_PM_SMLT_CKNCT_TYPE_MSTR`(`USE_YN='Y'`) 를 열거하지
  ATRB 테이블을 열거하지 않는다. 999 MSTR 행이 없으므로 리소스로 뜨지 않는다.

**적재만 되고 아무도 읽지 않는다.**

### 1.4 VARCHAR 숫자 컬럼 버그가 다른 화면에 남았다

`CastDsbdMapper.xml` 에서 고친 것과 같은 문제가
[CastFltPsgMapper.xml:10](java/mapper/CastFltPsgMapper.xml#L10) 에 그대로 있다.

```sql
NVL(SUM(A.RSVT_BDPSG_CNT - A.RSVT_TRNS_BDPSG_CNT), 0) AS PSG_CNT
```

둘 중 하나만 NULL 이면 뺄셈 전체가 NULL 이 되고 `SUM` 이 그 행을 통째로 버린다.
두 화면이 같은 날짜에 서로 다른 여객수를 보여준다.

---

## 2. 단계 1 — 버그 3건

### 2.1 `assert_unique_keys` 를 DB 모드로 한정

[step5_save.py](data-processing/step5_save.py) `run()`

```python
uploads = [(task, build_groups(task, data_dir)) for task in UPLOAD_TASKS]

if mode == "csv":
    for task, groups in uploads:
        save_upload(None, task, groups, data_dir, transaction_id, mode)
    log("전체 CSV 저장 완료", transaction_id)
else:
    assert_unique_keys(uploads)
    conn = get_connection()
    ...
```

검증은 `get_connection()` 앞에 둔다 — 커넥션을 열기 전에 끊어야 한다.

### 2.2 락 대기 한도

- [CastConfigMapper.xml](java/mapper/CastConfigMapper.xml) 의 `retrieveCategoryForUpdate` 에서
  `FOR UPDATE` → `FOR UPDATE WAIT 3`
- `CastConfigServiceImpl` 에 락 획득을 감싸는 헬퍼를 두고, 대기 초과 예외를
  `"전처리 결과가 갱신 중입니다. 잠시 후 다시 시도해 주세요."` 로 바꾼다.
  락 실패 시점에는 아직 쓴 것이 없어(`applyPreProcess` · `revertPreProcess` 모두 첫 DB 접근)
  예외를 잡아 `JsonResponse.error` 로 돌려도 롤백 누락 문제가 없다.
- 예외 타입은 Tibero 드라이버가 무엇을 던지는지에 달렸다. `CannotAcquireLockException` 을 먼저
  잡고 안 걸리면 `DataAccessException` 으로 넓힌다 — 실 백엔드에서 확정.

> `applyDefaultAttribute`([:221](java/cast/service/impl/CastConfigServiceImpl.java#L221))는 001 을
> 원본으로 읽으면서 락을 잡지 않아, 반영 트랜잭션이 행마다 커밋되는 중간 상태를 읽을 여지가
> 남는다. 이번 범위 밖이며 주석으로만 남긴다.

### 2.3 `CastFltPsgMapper.retrieveFltPsgHourList`

```sql
NVL(SUM(
    NVL(TO_NUMBER(TRIM(A.RSVT_BDPSG_CNT)), 0)
    - NVL(TO_NUMBER(TRIM(A.RSVT_TRNS_BDPSG_CNT)), 0)
), 0) AS PSG_CNT
```

같은 자리에서 [CastDsbdMapper.xml](java/mapper/CastDsbdMapper.xml) 의
`NVL(NULLIF(TRIM(x), ''), '0')` 도 위 형태로 통일한다. `NULLIF(TRIM(x), '')` 는 Oracle/Tibero 에서
no-op 이다 — `''` 가 NULL 이라 비교가 UNKNOWN 이 되어 항상 `TRIM(x)` 를 되돌려주고, 공백만 있는
문자열은 `TRIM` 이 이미 NULL 을 낸다. 두 파일이 같은 식을 쓰게 두는 편이 낫다.

**범위는 이 두 파일까지다.** `CastRestMapper` 의 GD 컬럼(308-312, 509-535)은 CAST 로 나가는
리소스 값이 바뀌므로 건드리지 않는다.

---

## 3. 단계 2 — 체크인유형 시트 편입

`TN_PM_SMLT_CKNCT_TYPE_ATRB_PRC` 를 Cast 설정 화면의 네 번째 시트로 올려 999→001 반영 경로를
잇는다.

### 3.0 설계 근거

**`CKNCT_TYPE_ATRB_ID` 는 `FIX_ATRB_GROUP_ID` 와 같은 001/999 축이다.**
[CastRestMapper.xml:1411](java/mapper/CastRestMapper.xml#L1411) 이 PropertySet `PS001` 을
`CKNCT_TYPE_ATRB_ID = '001'` 로 매핑한다. 그래서 카테고리 목록은 기존
`TN_PM_SMLT_FIX_ATRB_GROUP` 하나를 그대로 쓰고, 체크인유형 테이블은 그 ID 를 자기 그룹 컬럼에
담기만 한다. CAST 노출용 `TN_PM_SMLT_CKNCT_TYPE_MSTR` 은 화면 카테고리와 분리한다 —
999 MSTR 행을 만들지 않으므로 CAST 는 이 데이터를 보지 않는다.

**이 시트는 터미널 축이 없다.** 항공사 단위라 T1/T2 구분이 없다. 이력의 `TMNL_ID` 를 NULL 로
남기면 되돌리기 스코프의 `NVL(TMNL_ID, ' ')` 가 T1/T2 를 한 묶음으로 접어 LIFO 가 그대로
성립한다 — 어느 터미널 탭에서 반영해도 같은 순서열에 들어간다.

### 3.1 enum 확장

[CastConfigSheet.java](java/cast/enums/CastConfigSheet.java)

- 필드 `groupColumnNm` 추가. 기존 3개는 `"FIX_ATRB_GROUP_ID"`.
- 필드 `prePrcsValueColumnList` 추가.
  PSG/SHOW_UP → `List.of("INPT_VL")`, SRVC → `List.of()`,
  체크인유형 → `List.of("CKNCT_RT", "KOS_RT", "MOB_RT")`.
- 새 상수

```java
CKNCT_TYPE_ATRB(
        "체크인유형",
        "TN_PM_SMLT_CKNCT_TYPE_ATRB_PRC",
        "CKNCT_TYPE_ATRB_ID",   // groupColumnNm
        "ALN_CD",               // keyColumnNm
        "",                     // dtlColumnNm 없음
        cknctTypeColumns(),
        "",
        null,                   // validation
        CastConfigCatalogKind.CKNCT_TYPE,
        CastConfigTerminalRule.NONE
)
```

- `cknctTypeColumns()` — 항공사코드(READONLY, `ALN_CD`, merge), 카운터비율(NUMBER, `CKNCT_RT`),
  키오스크비율(NUMBER, `KOS_RT`), 모바일비율(NUMBER, `MOB_RT`), 서비스시간(NUMBER, `SRVC_HR`).
  `CKNCT_VL`/`KOS_VL`/`MOB_VL` 은 `Counter`/`Kiosk`/`Mobile` 고정 라벨이라 화면에 내지 않는다.
- `validation` 은 `null`. 기존 `SUM` 은 "여러 행을 한 컬럼으로 묶어 합계"라 "한 행 안 3컬럼 합계"와
  구조가 다르다. 행 내 합계 검증이 필요해지면 별도 kind 로 추가한다.

[CastConfigCatalogKind.java](java/cast/enums/CastConfigCatalogKind.java) 에 `CKNCT_TYPE` 추가.
`CastConfigTerminalRule.NONE` 은 이미 있다.

[CastConfigGroup.java](java/cast/enums/CastConfigGroup.java) — `CHECKIN` 의 `rootCdMap` 에
`CKNCT_TYPE_ATRB` 를 빈 Set 으로 등록한다. 생성자가 지금 `PSG_ATRB`/`SHOW_UP_ATRB` 두 개를
고정 등록하므로 시트별 맵을 인자로 받도록 소폭 고친다.

> 부수 확인: 현재 `SRVC_ATRB` 는 어느 그룹에도 등록돼 있지 않아 `supports()` 가 항상 false 다.
> 이번에 이 파일을 건드리는 김에 의도된 상태인지 확인하고, 의도된 것이면 그대로 둔다.

### 3.2 mapper 의 그룹 컬럼 파라미터화

[CastConfigMapper.xml](java/mapper/CastConfigMapper.xml) 에서 `FIX_ATRB_GROUP_ID` 하드코딩을
`${groupColumnNm}` 로 바꾼다.

| 문장 | 바꿀 자리 |
|---|---|
| `updateAtrbValue` | `WHERE FIX_ATRB_GROUP_ID` |
| `copyFromGroup` | SET 서브쿼리 B, `WHERE A`, `EXISTS` 서브쿼리 B |
| `insertFromBaseGroup` | INSERT 컬럼 목록 + `WHERE A.FIX_ATRB_GROUP_ID = '001'` |
| `insertAplyHstryDtl` | T · S 양쪽 |

`retrieveCategoryList` · `retrieveCategoryForUpdate` · `retrieveCategoryCnt` · `insertCategory` 는
`TN_PM_SMLT_FIX_ATRB_GROUP` 자체를 다루므로 그대로 둔다. `retrieveSrvcAtrbList` 도 테이블
고정이라 그대로.

[CastConfigMapper.java](java/cast/mapper/CastConfigMapper.java) 의 해당 시그니처에
`@Param("groupColumnNm")` 추가.

### 3.3 상세 컬럼 없는 시트 지원

`${dtlColumnNm} = #{dtlSeCd}` 절을
`<if test="dtlColumnNm != null and dtlColumnNm != ''">` 로 감싼다
(`updateAtrbValue`, `copyFromGroup` 3곳, `insertFromBaseGroup`, `insertAplyHstryDtl`).

`TN_PM_SMLT_ATRB_APLY_HSTRY_DTL.DTL_SE_CD` 는 `VARCHAR2(8) NOT NULL` 이고 PK 구성 요소다.
**DDL 을 고치지 않고 서비스에서 `' '` 센티널을 넘긴다.** `ATRB_CD` 는 `VARCHAR2(8)`,
`ALN_CD` 는 `VARCHAR2(7)` 이라 그대로 들어간다.

### 3.4 조회 SQL 신규

`retrieveCknctTypeAtrbList` 를 추가한다. 카탈로그 조인이 없고 터미널 필터도 없다.

```xml
<select id="retrieveCknctTypeAtrbList" resultType="aoms.pm.cast.dto.CastConfigAtrbRawDto">
    /* CastConfigMapper.retrieveCknctTypeAtrbList */
    SELECT
        A.ALN_CD AS ATRB_CD,
        ' ' AS DTL_SE_CD,
        NVL(TO_CHAR(A.CKNCT_RT), ' ') AS CKNCT_RT,
        NVL(TO_CHAR(A.KOS_RT), ' ')   AS KOS_RT,
        NVL(TO_CHAR(A.MOB_RT), ' ')   AS MOB_RT,
        NVL(TO_CHAR(A.SRVC_HR), ' ')  AS SRVC_HR,
        A.ALN_CD AS ATRB_CD_NM,
        ' ' AS DTL_SE_CD_NM,
        'Number' AS CATALOG_VL_TYPE,
        'Y' AS PRE_PRCS_YN
    FROM PMOWN.TN_PM_SMLT_CKNCT_TYPE_ATRB_PRC A
    WHERE A.CKNCT_TYPE_ATRB_ID = #{fixAtrbGroupId}
    ORDER BY A.ALN_CD
</select>
```

`PRE_PRCS_YN` 은 상수 `'Y'` — 이 시트는 전 행이 파이프라인 산출물이라 카탈로그 플래그가 없다.

곁들여 바꿀 것.

- [CastConfigAtrbRawDto.java](java/cast/dto/CastConfigAtrbRawDto.java) 에 `cknctRt` · `kosRt` ·
  `mobRt` · `srvcHr` 추가
- `CastConfigServiceImpl.toCellValue()` 에 네 컬럼 case 추가
- `CastConfigServiceImpl.retrieveRows()`([:819](java/cast/service/impl/CastConfigServiceImpl.java#L819))
  에 `CKNCT_TYPE` 분기 추가

### 3.5 다중 값 컬럼 비교·반영

지금 비교·반영은 `INPT_VL` 단일 컬럼 전제다
([CastConfigServiceImpl.java:457](java/cast/service/impl/CastConfigServiceImpl.java#L457)).
값 컬럼을 목록으로 확장한다.

**서버**

- `applyPreProcess` 의 `List.of(INPT_VL_COLUMN)` → `sheet.getPrePrcsValueColumnList()`
- `CastConfigPreProcessDiffDto` — `valueColumn`/`valueLabel` → `valueColumnList`/`valueLabelList`
- `CastConfigPreProcessRowDto` — `baseVl`/`preVl` → `baseVlList`/`preVlList`
- `changedYn` 은 컬럼 중 하나라도 다르면 `'Y'`
- 값 추출은 기존 `toCellValue(raw, physicalColumn)` 을 컬럼마다 부르는 것으로 재사용

> DTO 필드명 변경은 AGENTS.md §3 의 고정 원칙에 걸린다. 다만 서버·화면을 같이 바꾸는 구조
> 변경이고 단수형 이름이 다중 컬럼을 담을 수 없어 예외로 둔다. **AGENTS.md §3 의 예외 목록에
> 근거와 함께 한 줄 추가한다.**

**화면**

| 파일 | 변경 |
|---|---|
| [api.types.ts](react/src/types/api.types.ts) | 위 DTO 3쌍 반영 |
| [types.ts](react/src/modules/pm/pages/castConfig/types.ts) | `PreProcessDiff.valueLabels: string[]`, `PreProcessRow.baseValues/preValues: string[]` |
| [view.ts](react/src/modules/pm/pages/castConfig/view.ts) | `toPreProcessDiff` 매핑, `EMPTY_PRE_PROCESS_DIFF` 갱신 |
| [PreProcessApplyModal.tsx](react/src/modules/pm/pages/castConfig/components/PreProcessApplyModal.tsx) | 헤더를 `valueLabels` 로 그리고 행마다 컬럼 수만큼 셀. `toDelta` 는 컬럼별 계산 |
| [DataConfigModal.tsx](react/src/modules/pm/pages/castConfig/components/DataConfigModal.tsx) | 미리보기 셀 대입(`toCellKey(..., diff.valueLabel)`)을 컬럼 루프로 |
| [castConfig.mock.ts](react/src/api/pm/mock/castConfig.mock.ts) | 체크인유형 시트 데이터셋(001/999) 추가, diff 응답 다중 컬럼화 |

CSS 는 손댈 게 없다. 표의 열 정의가 이미 인라인 커스텀 프로퍼티로 나간다 —
`style={{ '--cat-cols': TBL_COLS }}`
([PreProcessApplyModal.tsx:93](react/src/modules/pm/pages/castConfig/components/PreProcessApplyModal.tsx#L93)).
컬럼 수에 맞춰 문자열을 만들어 넘기면 된다.

### 3.6 파이프라인

`MANAGED_GROUP_COLUMNS` 는 이미 이 테이블을 999 전량 교체 대상으로 잡고 있어 **변경 없다.**
`assert_unique_keys` 도 `(table, composite_key)` 로 커버한다.

### 3.7 DDL 확인 목록 보강

[2026-09-02-atrb-pre-process.sql](java/ddl/2026-09-02-atrb-pre-process.sql) 상단 확인 목록에
다음을 추가한다.

- `TN_PM_SMLT_CKNCT_TYPE_ATRB_PRC` 실재 여부. `cast-ddl.sql` 은 `TN_PM_SMLT_CKNCT_TYPE_ATRB` 만
  갖고 있고 `_PRC` 접미 테이블이 없다
- 컬럼이 `MOB_RT/MOB_VL` 인지 `MOBL_RT/MOBL_VL` 인지. `cast-ddl.sql:1118` 주석이
  `"원본은 MOB였음. 표준단어 '모바일'(MOBL)로 치환"` 이라 실 스키마는 `MOB_*` 로 보인다 —
  파이프라인이 쓰는 이름과 일치하지만 확정이 필요하다
- `CKNCT_TYPE_ATRB_ID = '001'` 행 존재 여부. 없으면 `copyFromGroup` 이 갱신할 대상 행이 없어
  반영이 0행으로 끝난다
- `CKNCT_TYPE_ATRB_ID = '999'` 가 이미 다른 용도로 쓰이고 있지 않은지

---

## 4. 검증

### 4.1 레포 내 검증

```bash
cd react
npx tsc -b
npx eslint .
npm run build
```

```bash
python -m py_compile data-processing/*.py
# CSV 드라이런이 중복 키와 무관하게 통과하는지 (2.1 확인)
python data-processing/step5_save.py --start 20260212 --end 20260218 --mode csv
```

MyBatis XML 파싱 검사, `git diff --check`.

### 4.2 목업 육안 확인

`.env` 의 `VITE_ENABLE_MOCK=true` 로 `npm run dev` 후 `/rui/pm/cast-config`

1. 체크인 영역 → **체크인유형** 탭이 뜨고 항공사별 3개 비율이 보인다
2. 카테고리를 `기준정보` / `전처리 결과` 로 바꾸면 셀이 편집 불가다
3. 전처리 비교 → 비교표에 **카운터/키오스크/모바일 3열**이 각각 현재값·전처리값으로 뜬다
4. 변경 행 기본 선택 → 반영 → 기준정보 값이 3컬럼 모두 바뀐다
5. 반영 이력 → 최신 1건만 되돌리기 활성 → 되돌리면 3컬럼 모두 복원되고 그다음 건이 활성화된다
6. T1 에서 반영한 뒤 T2 탭으로 옮기면 같은 행이 이미 반영된 상태로 보인다 (터미널 축 없음)
7. **회귀** — 여객유형속성·출현속성 시트의 비교·반영·되돌리기가 그대로 동작한다

### 4.3 실 백엔드에서만 가능한 검증

- Java 컴파일 (`java/` 는 빌드 구성 없는 참조 사본)
- 2.2 의 락 대기 초과 예외 타입 확정
- 파이프라인 실행 중 반영 요청이 3초 뒤 안내 메시지로 떨어지는지

---

## 5. 실행 전 확정이 필요한 전제

| # | 확정할 것 | 어긋나면 |
|---|---|---|
| 1 | `TN_PM_SMLT_CKNCT_TYPE_ATRB_PRC` 의 실재·컬럼명·`001` 행 존재 (§3.7) | §3.4 SQL 의 테이블·컬럼명만 바꾼다 |
| 2 | Tibero 의 `FOR UPDATE WAIT n` 지원과 대기 초과 예외 (§2.2) | `NOWAIT` + 재시도 안내로 대체한다 |

둘 다 실 스키마·실 백엔드 조회가 필요하다. **단계 1의 나머지(2.1 · 2.3)와 단계 2의 구조
변경(3.1~3.5)은 두 전제와 무관하게 진행할 수 있다.**

---

## 6. 이번 범위에서 뺀 것

검토 중 확인했지만 "확실히 고쳐야 할 것"에 넣지 않은 항목이다. 별건으로 다룬다.

- `TN_PM_SMLT_ATRB_APLY_HSTRY_IX2` 가 새 `NOT EXISTS` 쿼리에 붙지 않는다. `NVL(N.TMNL_ID,' ')` ·
  `NVL(N.CNCL_YN,'N')` 이 sargable 하지 않고, `CNCL_YN` 은 `DEFAULT 'N' NOT NULL` 이라 NVL 자체가
  불필요하다. 이력 테이블이 작아 실害는 작다.
- 되돌리기 실패 사유 두 개("이미 되돌림" / "최신부터 되돌려야 함")가 한 메시지로 합쳐졌다.
  바로 위에서 `retrieveAplyHstry` 로 읽은 `cnclYn` 으로 갈라낼 수 있다.
- 목업 3곳(`getPreProcessHistory` · `revertPreProcess` · 서버)의 되돌리기 스코프 기준이
  `tblNm` / `sheetNm` 으로 서로 다르다. 목업 `getPreProcessHistory` 는 `sheetNm` 필터를 건 뒤
  revertable 을 계산해, 서버가 거절할 항목의 버튼이 켜질 수 있다.
- `applyDefaultAttribute` 가 락 없이 001 을 원본으로 읽는다 (§2.2 각주).
- `CastRestMapper` 의 GD 컬럼 `TO_NUMBER` 방어 (§2.3).
