# 사용자 시뮬레이션 체크인카운터를 부스 × 시간 × 항공사 배정으로 전환

작성일: 2026-11-22 · 대상: `react/src/modules/pm/pages/userSmlt/tabs/checkinCounter`, `java/cast`, `java/mapper`, `java/ddl` · 상태: **구현 (이 저장소 1~7단계 반영, 실백엔드 · CAST 확인 전 — §10)**

`java/`는 참조 사본이라 이 저장소에서 컴파일하지 않는다. 실제 백엔드 빌드 · DB 적용 · CAST 연계 확인은 별도로 한다.

---

## 1. 배경

사용자 시뮬레이션 체크인 탭은 **운영시간을 아일랜드 단위로**, **항공사를 부스당 1개로** 다룬다.

| 계층 | 현재 |
|---|---|
| 화면 | 아일랜드마다 `TimeBar` 하나(`CheckinIsland.ranges`), 부스 그리드는 항공사 지정만 |
| DTO | `ChknIslandDto.oprTimeList` · `ChknBoothDto { boothNo, alnCd, cstmAltmntYn }` |
| DB | `TN_PM_SMLT_USER_CHKN_OPER_HR`(PK 에 부스 없음) · `TN_PM_SMLT_USER_CHKN_BOOTH`(부스 1행 = 항공사 1개) |
| CA 발행 | `CastUserSnapshotMapper.insertCknctAtrb` 가 `BOOTH × OPER_HR` 를 아일랜드로 조인해 모든 부스에 같은 시간을 복제 |
| SBD · 키오스크 발행 | `insertSbdAtrb` · `insertSbdAtrbKiosk` 가 같은 아일랜드 운영시간을 기기 운영시간으로 사용 |

일일 원천 `GOOWN.TI_GO_CKNCT_DALY_ALOT` 는 **부스 × 항공사 × 시각** 행이고 CA001 도 그대로 발행된다. 사용자 탭은 운영 기본값을 불러올 때

- 부스별 시간을 아일랜드 합집합으로 합치고(`CastChknServiceImpl.getAllotIslandList` → `SmltUtils.mergeTimeRanges`)
- 한 부스를 여러 항공사가 시간대별로 쓰면 첫 항공사만 남긴다(`UserConfigChknDto.factory` 의 `first.getAlnCd()`).

그래서 **아무것도 고치지 않고 실행해도** 일부 시간만 열던 부스가 아일랜드 운영시간 내내 열린 CA 로 발행된다(§13 의 "사용자 CA 는 전 부스를 열어 활성 부스 차이가 크다"의 원인).
SBD · 키오스크도 일일 SBD001 과 다른 규칙으로 발행된다(§4).

## 2. 확정한 결정

| 항목 | 결정 |
|---|---|
| 편집 단위 | **부스 × 시간 × 항공사**. 한 부스를 오전 KE, 오후 OZ 로 쓸 수 있다 (일일과 같은 개념) |
| 시간 해상도 | **시(hour) 단위 유지**. 운영 기본값은 지금처럼 시작 내림 · 종료 올림 (`retrieveChknList`) |
| SBD · 키오스크 | 사용자는 아일랜드별 **대수만** 편집한다. 운영시간 · 항공사는 **일일 SBD001 규칙**으로 서버가 정한다 (§4) |
| 아일랜드 운영시간 | 저장 · 편집 개념에서 없앤다. 화면 표시용 아일랜드 시간은 부스 배정의 합집합으로 도출한다 |
| 기존 저장분 · 실행 | **무시한다.** 마이그레이션 · 구 실행 조건 조회 호환은 두지 않는다 |
| 일일 배정 원천 | **선행 작업으로 정리한다** (§2.1). 키별 최신 `ALOT_SN` 1행, 항공사 기준(`CHKN_TYPE_CD = 'C'`)만 |

## 2.1 선행 작업: 일일 체크인 배정 원천 정리

사용자 탭의 운영 기본값과 일일 CA001 이 같은 원천을 읽으므로, 원천을 먼저 정리하고 그 결과를 사용자 탭이 그대로 받는다.
**일일 CA001 발행과 일일 결과가 바뀌는 변경이라 사용자 탭 작업과 별도 커밋으로 먼저 반영하고 CAST 일일 실행으로 확인한다.**

### 원천 상태 (2026-11-22 확인)

- `GOOWN.TI_GO_CKNCT_DALY_ALOT` 는 할당 정보를 받을 때마다 MERGE 하지 않고 **INSERT** 한다. 같은 `(OPER_YMD, TMNL_ID, CKNCT_ID, ALN_CD)` 에 재전송 행이 쌓인다.
- `ALOT_SN` 은 등록 키다. 클수록 나중에 받은 행이다.
- 하루치 전체를 다시 보내는 방식이 아니다. 키별로 받는다.
- `CHKN_TYPE_CD` 는 `'C'` 항공사 기준, `'D'` 편 기준(`MSTR_FLTNM`)이다. 시스템 복잡도 때문에 **편 기준은 더 이상 고려하지 않는다.**
- 최신 행이 `USE_YN = 'N'` 인데 이전에 `'C'` · `'Y'` 행이 있는 키가 날짜별로 약 10건 있다. **최신 행이 `'N'` 이면 취소된 할당으로 보고 뺀다.**
- `'C'` 행이 하나도 없는 항공사는 날짜별로 BR 하나(부스 약 10건)다. 정리 후 CA001 에서 빠진다. 감수한다(§9).

### 규칙

키 `(OPER_YMD, TMNL_ID, CKNCT_ID, ALN_CD)` 의 **전체 이력에서 최신 1행을 먼저 고르고**, 그 행이 `CHKN_TYPE_CD = 'C'` · `USE_YN = 'Y'` 일 때만 쓴다.
`USE_YN` · 유형으로 먼저 거르면 취소된 할당의 이전 행이 되살아난다.

```xml
<!-- 재전송마다 INSERT 되므로 키별 최신(ALOT_SN) 1행만 쓴다. 유형 · 사용 여부는 최신 행으로 판정한다 -->
<sql id="cknctDailyAlotLatestRows">
    SELECT L.*
      FROM (
        SELECT A.*,
               ROW_NUMBER() OVER (PARTITION BY A.OPER_YMD, A.TMNL_ID, A.CKNCT_ID, A.ALN_CD ORDER BY A.ALOT_SN DESC) AS RN
          FROM GOOWN.TI_GO_CKNCT_DALY_ALOT A
         WHERE A.OPER_YMD BETWEEN TO_CHAR(TO_DATE(#{alotYmd}, 'YYYYMMDD') - 1, 'YYYYMMDD') AND #{alotYmd}
      ) L
     WHERE L.RN = 1
       AND L.CHKN_TYPE_CD = 'C'
       AND L.USE_YN = 'Y'
</sql>
```

같은 부스 · 같은 항공사의 배정은 하루 한 구간이 된다(재전송 모델이라 마지막 행이 그 키의 현재 배정이다).

### 원천을 읽는 곳 (전부 이 조각으로)

| 조회 | 용도 | 변경 |
|---|---|---|
| `CastApiMapper.cknctDailyAlotRows` | CA001 발행 · FS 대표 아일랜드 | 원천 대신 `cknctDailyAlotLatestRows` 를 읽는다. 예정 · 최종 시각 선택 · 익일 판정 · `TN_CA_CKNCT` 조인 · X/Y/R/S 제외는 그대로. CA001 렌더의 `'D'` 분기(`MSTR_FLTNM`)는 도달하지 않으므로 지운다 |
| `CastChknMapper.retrieveChknBoothOperList` (CA001 분기) | 공용 Queue 배정 부스(§13) | 같은 조각 + `TMNL_ID` 조건 |
| `CastChknMapper.retrieveChknList` | 사용자 탭 운영 기본값 | 같은 조각 + `OPER_YMD = #{ymd}` |
| `CastChknMapper.retrieveAlnCdList` | 사용자 탭 항공사 목록 | 같은 조각 + `OPER_YMD = #{ymd}`. 지금은 유형 · 사용 여부 외 필터가 없다 |
| `CastDsbdMapper.retrieveChknAlnAssignmentList` (CA001 분기) | 대시보드 항공사 배정 | 같은 조각 + `TMNL_ID` 조건 |

- 다른 네임스페이스에서 `<include refid="aoms.pm.castapi.mapper.CastApiMapper.cknctDailyAlotLatestRows"/>` 로 읽는다. `CastUserSnapshotMapper` 가 이미 `dailyFlightScheduleRows` 를 같은 방식으로 읽는다.
- 날짜 파라미터는 조회마다 `<bind name="alotYmd" value="excnYmd"/>` 처럼 맞춘다(§16.1 — `<property>` + `${}` 금지).
- 리소스 목록의 `LastModified`(`retrieveResourceInformation` CA001 · SBD001)는 원천 갱신 시각 표시라 그대로 둔다.
- AGENTS.md §11.3 에 원천 정리 규칙을 한 줄로 남긴다.

## 3. 데이터 모델

### 3.1 테이블

| 테이블 | 처리 |
|---|---|
| `TN_PM_SMLT_USER_CHKN_ISL` | 유지. `KOS_CNT` · `SBD_CNT` 편집값, `BOOTH_CNT` = 배정이 1건 이상인 부스 수 |
| `TN_PM_SMLT_USER_CHKN_OPER_HR` | **DROP** |
| `TN_PM_SMLT_USER_CHKN_BOOTH` | **DROP** |
| `TN_PM_SMLT_USER_CHKN_BOOTH_ALTMNT` | **신규**. 행 1개 = 부스 1석의 항공사 배정 1구간 |

신규 테이블:

| 컬럼 | 타입 | 비고 |
|---|---|---|
| `OWNER_USER_ID` | `VARCHAR2(40)` | PK |
| `EXCN_YMD` | `VARCHAR2(8)` | PK |
| `TMNL_ID` | `VARCHAR2(4)` | PK |
| `CHKN_ISL_CD` | `VARCHAR2(1)` | PK |
| `BOOTH_NO` | `NUMBER(3,0)` | PK |
| `ALTMNT_SN` | `NUMBER(3,0)` | PK. 부스 안에서 시작 시각 순 1부터 |
| `ALN_CD` | `VARCHAR2(3)` | NOT NULL |
| `OPER_BGNG_HOUR` | `NUMBER(2,0)` | NOT NULL, 0~23 |
| `OPER_END_HOUR` | `NUMBER(2,0)` | NOT NULL, 1~24, 시작보다 커야 한다 |
| 감사 컬럼 6개 | | 기존 사용자 테이블과 같다 |

- FK `(OWNER_USER_ID, EXCN_YMD, TMNL_ID, CHKN_ISL_CD)` → `TN_PM_SMLT_USER_CHKN_ISL` (기존 `FK_CUR_CHKN_HR` · `FK_CUR_CHKN_BOOTH` 는 테이블과 함께 사라진다).
- CHECK `OPER_BGNG_HOUR < OPER_END_HOUR`.
- 테이블 이름은 원천의 배정(`ALOT`)과 같은 뜻인 기존 약어 `ALTMNT`(`CSTM_ALTMNT_YN`)를 쓴다. 시간만이 아니라 항공사를 함께 담아 `OPER_HR` 로 이름 붙이지 않는다.

### 3.2 부스 안 구간 규칙

- **같은 부스의 구간은 겹치지 않는다.** 한 부스 · 한 시각의 항공사는 1개다. 붙은 구간(9~12 KE, 12~15 KE)은 저장 전에 하나로 합친다.
- 운영 기본값을 시 단위로 올림 · 내림하면 분 단위로는 붙어 있던 구간이 겹칠 수 있다(KE 06:00~09:30 → 6~10, OZ 09:30~12:00 → 9~12).
  불러올 때 **시작이 늦은 구간을 우선**해 앞 구간의 끝을 뒤 구간의 시작으로 자른다(KE 6~9, OZ 9~12). 잘려서 길이가 0 이 된 구간은 버린다.
- 원천 정리(§2.1) 전 겹침 대부분은 재전송 중복이었다. 정리 후에도 **다른 항공사끼리** 분 단위로 겹치는 행이 남는지 §8.1 SQL 로 확인하고, 많으면 이 규칙을 다시 정한다.

### 3.3 API 계약 (AGENTS.md §3 고정 계약 변경)

```ts
export interface ChknBoothAltmntDto {
    alnCd: string;
    operBgngHour: number;
    operEndHour: number;
}

export interface ChknBoothDto {
    boothNo: number;
    altmntList: ChknBoothAltmntDto[];
}

export interface ChknIslandDto {
    island: string;
    boothCnt: number;
    kioskCnt: number;
    bagDropCnt: number;
    boothList: ChknBoothDto[];
}
```

- `ChknBoothDto.alnCd` · `cstmAltmntYn`, `ChknIslandDto.oprTimeList` 는 **삭제**한다. `cstmAltmntYn` 은 화면이 항상 `'N'` 을 보내고 읽는 곳이 없다.
- `UserSmltChknSaveReq.islandList` 의 `Pick` 에서 `oprTimeList` 를 뺀다. 실행 요청 `UserSmltExecReq.chknList` 도 같은 타입이라 함께 바뀐다.
- `OprTimeDto` 는 출국장이 계속 쓰므로 남는다.
- 응답 `boothList` 는 지금처럼 1 ~ `max(36, 최대 부스 번호)` 전 부스를 채우고, 배정이 없는 부스는 `altmntList: []` 다.

## 4. SBD · 키오스크 발행 (일일 SBD001 규칙 준용)

일일 SBD001(`CastApiMapper.xml` `REQ_GetResource` `SBD001` 분기)은 카운터 시간과 무관하다.

| 기기 | 일일 SBD001 | 변경 후 사용자 SBD 리소스 |
|---|---|---|
| 키오스크 | 정책 `TN_PM_SLF_CHKN_OPER_PLCY` 기기, 운영 **전날 12:00 ~ 당일 23:59:59**, 항공사 = 기기별 정책 항공사 | 같은 정책 기기 중 아일랜드별 `KOS_CNT` 대(지금과 같은 `DEVICE_NO` 순), 시각 · 항공사는 일일과 같다 |
| SBD | `CKNCT_USE_CRG_APLCN_TYPE_CD = 'H'` 기기, 항공사 = 아일랜드(`SBD_CTR_NM`) SBD 정책 항공사, 운영 = 그 항공사 출발편 **첫 편 −5시간 ~ 마지막 편 −1시간** (기준일 전날 · 당일 운항) | 아일랜드별 `SBD_CNT` 대(지금과 같은 `DEVICE_NO` 순), 시각 · 항공사는 일일과 같은 아일랜드 값 |

- 정책이 아일랜드 단위라 일일도 같은 아일랜드 기기는 같은 시각 · 항공사다. 사용자가 대수를 일일보다 늘려도 늘어난 기기에 같은 값을 준다.
- **SBD 항공사도 정책 항공사로 바꾼다.** 지금은 아일랜드 부스 항공사 전체(`LISTAGG(BOOTH.ALN_CD)`)다. 기본값 실행이 일일과 같아지려면 함께 바꿔야 한다.
- SBD 시간 · 항공사 조회는 일일 분기와 **같은 SQL 조각**을 쓴다. `CastApiMapper` 에 `<sql id="dailySbdIslandRows">`(아일랜드별 시작 · 종료 · 항공사 목록)를 두고
  일일 분기와 `CastUserSnapshotMapper.insertSbdAtrb` 가 `<include refid="aoms.pm.castapi.mapper.CastApiMapper.dailySbdIslandRows"/>` 로 읽는다.
  일자 파라미터는 `<bind name="baseYmd" value="excnYmd"/>` 로 맞춘다 (§16.1 — `<property>` + `${}` 금지). 네임스페이스는 실제 매퍼 위치에 맞춘다.
- 키오스크 시각은 일일과 같은 상수식이라 조각 없이 `insertSbdAtrbKiosk` 에 직접 쓴다.
  `OPER_BGNG_DT = (EXCN_YMD − 1)||'1200'`, `OPER_END_DT = EXCN_YMD||'2359'`. 사용자 SBD 렌더(`otherwise` 분기)는 `RON_YN = 'N'` 으로 읽어 t2 가 `23:59:00` 이 된다 — 일일(`23:59:59`)과 1초 차이는 허용한다.
- SBD 시각은 운항에서 나오므로 **분 단위**다. 사용자가 편집하지 않는 값이라 시 단위 결정과 충돌하지 않는다. 사용자 SBD 리소스는 이미 `HHMI` 로 렌더한다(§11.3).
- **정책 항공사 출발편이 없는 아일랜드**는 시간을 구할 수 없어 SBD 를 발행하지 않는다(일일도 그 기기를 뺀다). 저장 · 실행을 막지 않고, 조회 응답에서 발행되지 않을 아일랜드를 알 수 있게 할지는 구현 중 판단한다(§9).

## 5. 변경 범위

### 5.1 DDL

- `java/ddl/2026-11-22-user-chkn-booth-altmnt.sql`: `OPER_HR` · `BOOTH` DROP(FK 먼저), `BOOTH_ALTMNT` CREATE · COMMENT · FK · CHECK.
- `java/ddl/cast-ddl.sql`: 41~43절과 1955~1956행 FK 를 새 구성으로 고친다.
- 2026-10-11 stage · cutover · verify · preflight 스크립트는 역사 기록이라 고치지 않는다.

### 5.2 Java

| 파일 | 변경 |
|---|---|
| `cast/dto/ChknBoothDto` · `ChknIslandDto` | §3.3 과 같게. `ChknBoothAltmntDto` 신규 |
| `cast/dto/UserChknBoothRawDto` · `UserChknOperHrRawDto` | `UserChknBoothAltmntRawDto` 하나로 대체 |
| `mapper/CastChknMapper.xml` · `CastChknMapper.java` | `retrieveUserChknOperHrList` · `retrieveUserChknBoothList` · 삭제 · 삽입 4개를 `BOOTH_ALTMNT` 조회 · 삭제 · 삽입으로 대체. 삭제 순서 ALTMNT → ISL |
| `CastChknServiceImpl` | 운영 기본값을 부스 × 구간으로 조립(§3.2 겹침 정리 포함). 저장분 조립 · `normalizeIslandList` · 검증(§5.4) · `getHourlyOprBoothCntList`(시각별 운영 부스 = 그 시각 구간이 있는 부스 수)를 바꾼다 |
| `UserConfigChknDto` · `retrieveChknMapGroupByIsland` | **고치지 않는다.** 일일 체크인 상세(`CastSmryDtlServiceImpl`)가 같이 쓴다. 사용자 기본값은 `retrieveChknList` 행을 새 메서드에서 직접 묶는다 |
| `CastUserSnapshotServiceImpl` · `UserSmltRsrcSnapshotDto` | `chknOperHrList` 삭제, `chknBoothList` 를 `ChknBoothAltmntRow(tmnlId, island, boothNo, altmntSn, alnCd, bgngHour, endHour)` 로 바꾼다 |
| `mapper/CastUserSnapshotMapper.xml` `insertCknctAtrb` | `BOOTH × OPER_HR` 조인을 없애고 배정 행 1개 = CA 1행으로 발행. 부스 번호 → `CKNCT_ID` 매핑 · 블록 ID · `CHKN_TYPE_CD = 'C'` · 24시 = `2359` 규칙은 그대로 |
| `mapper/CastUserSnapshotMapper.xml` `insertSbdAtrb` · `insertSbdAtrbKiosk` | §4 규칙으로 다시 쓴다. `OPER_HR` · `BOOTH` CTE 를 쓰지 않는다 |
| `mapper/CastApiMapper.xml` | SBD001 분기에서 `dailySbdIslandRows` 조각을 뽑는다. **일일 SBD001 결과는 바뀌지 않아야 한다** |
| `mapper/CastResourceConditionMapper.xml` · `CastResourceConditionService` | 실행 조건 조회(`mode=view&smltId=`): `retrieveBooths` 를 CA 행 그대로(부스 · 항공사 · 시각) 돌려주게 바꾸고 `retrieveCheckinHours` 는 삭제한다 |
| 실행 자동 저장 경로 | 저장 API 와 같은 정규화 · 검증을 탄다(현재 경로 확인 후 맞춘다) |

### 5.3 React

| 파일 | 변경 |
|---|---|
| `types/api.types.ts` | §3.3 |
| `checkinCounter/types.ts` | `Booth { no, side, altmnts: BoothAltmnt[] }` (`BoothAltmnt { airline, start, end }`), `CheckinIsland.ranges` 삭제 |
| `checkinCounter/view.ts` | `toBooths` · `toIslands` · `toSaveReq`(붙은 같은 항공사 구간 합치기) · `assignedBoothCount`(구간 1건 이상인 부스) · KPI. 아일랜드 표시 시간 = 부스 구간 합집합 헬퍼 |
| `CheckinCounterEditDock` · `BoothGrid` · `AirlinePalette` | **부스 × 24시간 매트릭스** 편집(§6). `TimeBar` 는 체크인 탭에서 빠진다 |
| `CheckinCounterTab.tsx` | `toBlockItems` 가 `ranges` 를 합집합 헬퍼로 구한다. 툴팁은 그 시각 운영 부스 수를 보인다 |
| `components/BlockChart.tsx` | **고치지 않는다.** 체크인은 `unitSize = 36` 이라 블록이 시각마다 1개라서 `ranges`(합집합)만 맞으면 된다. 시각별 수는 `formatTip(item, hour)` 에서 구한다 |
| `api/pm/mock/userSmlt.mock.ts` · `chknCounter.mock.ts` | 새 DTO 로. 기본값에 시간대별로 항공사가 바뀌는 부스를 몇 개 넣는다. 실행의 "운영 아일랜드" 필터(`oprTimeList.length > 0`)를 "배정이 있는 부스" 기준으로 |
| `scripts/verify-user-smlt.mjs` | 104~108행 "미운영 조건" 시나리오를 `altmntList: []` 기준으로 고치고, 부스별 구간 · 항공사 왕복 저장 검사를 더한다 |

### 5.4 검증 규칙 (화면 · 서버 같게)

- `boothNo` 1 ~ 보유 부스 수, `alnCd` 비어 있지 않음
- `0 ≤ operBgngHour < operEndHour ≤ 24`, 정수
- 같은 부스 구간 겹침 금지 (화면은 매트릭스라 원래 겹칠 수 없다. 서버는 거절)
- 서버는 같은 항공사의 붙은 구간을 합친 뒤 `ALTMNT_SN` 을 매긴다

## 6. 편집 화면

시 단위이므로 부스 하루치 배정은 **24칸에 항공사 1개씩**과 같다. 구간 목록을 편집하는 대신 매트릭스에서 칠한다.

```
아일랜드 D                                       [KE][OZ][7C][지우기]
        00 01 02 … 06 07 08 09 10 11 12 … 23
L 01                 KE KE KE OZ OZ OZ
L 02                 KE KE KE KE KE
 …
R 36
```

- 행 = 부스(L 1~18 / R 19~36), 열 = 시각. 드래그로 칸을 고르고 팔레트에서 항공사(또는 지우기)를 고르면 칠한다.
- 확인 · 취소 · 자동 저장 · 미확정 편집 유지 흐름은 지금 Dock 과 같다.
- 키오스크 · SBD 대수 입력은 지금 위치에 남긴다. SBD 운영시간은 "일일 정책 기준" 안내 문구로만 보인다.
- 새 `className` 이 생긴다. 기존 `className` 은 지우거나 바꾸지 않는다(§3-3). 레이아웃 세부는 구현 때 디자이너 SVG 와 맞춘다.

## 7. 구현 순서

1. 원천 정리(§2.1) 별도 커밋 → CAST 일일 실행 확인(§8.3) → §8.1 SQL 로 남은 겹침 확인 → §3.2 규칙 확정
2. DDL (`2026-11-22-user-chkn-booth-altmnt.sql` · `cast-ddl.sql`)
3. Java DTO · 매퍼 · 서비스 (조회 · 저장 → CA 발행 → SBD · 키오스크 발행 → 실행 조건 조회)
4. React DTO · 뷰모델 · 목업 → `npx tsc -b`
5. 편집 Dock 매트릭스 UI
6. `verify-user-smlt.mjs` 갱신 → `npm run verify:user-smlt` · 변경 파일 lint
7. 문서: AGENTS.md §3(DTO 변경 기록) · §11.1(편집용 테이블 8 → 7) · §11.3(사용자 SBD · 키오스크 규칙), `docs/user-smlt-master-redesign.md`

## 8. 검증

### 8.1 원천 정리 후 남은 겹침 확인

정리 규칙(§2.1)을 적용한 뒤 같은 부스에서 **다른 항공사끼리** 분 단위로 겹치는 배정이 있는지:

```sql
WITH L AS (
    SELECT TMNL_ID, CKNCT_ID, ALN_CD,
           CASE WHEN EST_BGNG_HM IS NOT NULL AND EST_END_HM IS NOT NULL THEN EST_BGNG_HM ELSE LAST_BGNG_HM END AS STA_HM,
           CASE WHEN EST_BGNG_HM IS NOT NULL AND EST_END_HM IS NOT NULL THEN EST_END_HM ELSE LAST_END_HM END AS END_HM
    FROM (
        SELECT A.*,
               ROW_NUMBER() OVER (PARTITION BY A.OPER_YMD, A.TMNL_ID, A.CKNCT_ID, A.ALN_CD ORDER BY A.ALOT_SN DESC) AS RN
        FROM GOOWN.TI_GO_CKNCT_DALY_ALOT A
        WHERE A.OPER_YMD = :ymd
    )
    WHERE RN = 1 AND CHKN_TYPE_CD = 'C' AND USE_YN = 'Y'
)
SELECT A.TMNL_ID, A.CKNCT_ID, A.ALN_CD, A.STA_HM, A.END_HM,
       B.ALN_CD AS OTHER_ALN_CD, B.STA_HM AS OTHER_STA_HM, B.END_HM AS OTHER_END_HM
FROM L A
JOIN L B
  ON B.TMNL_ID = A.TMNL_ID AND B.CKNCT_ID = A.CKNCT_ID AND B.ALN_CD > A.ALN_CD
 AND A.STA_HM < B.END_HM AND B.STA_HM < A.END_HM
ORDER BY A.TMNL_ID, A.CKNCT_ID, A.STA_HM;
```

정리 후에는 부스 · 항공사마다 1행이라 같은 항공사끼리는 겹칠 수 없다. 자정 넘김 행(시작 > 종료)은 따로 본다. 며칠치를 돌려 건수와 패턴을 기록한다.

### 8.2 프런트

- `npx tsc -b`, 변경 파일 `npx eslint`, `npm run verify:user-smlt`
- 목업에서 시간대별로 항공사가 바뀌는 부스가 그대로 왕복 저장되는지, 블록차트 툴팁 시각별 부스 수, 미운영(배정 0) 아일랜드 표시

### 8.3 백엔드 (실제 레포 · 검증 DB)

원천 정리(§2.1) 단독 반영 후:

- CA001 행 수가 정리 전보다 줄고, 키 `(TMNL_ID, CKNCT_ID, ALN_CD)` 중복이 없다. `CheckinAllocType` 은 전부 `'C'` 다
- 최신 행이 `USE_YN = 'N'` 인 키(날짜별 약 10건)가 CA001 에 없다
- 정리 전 원천에는 있고 CA001 에서 빠진 항공사가 BR 뿐이다
- 배정 부스(`retrieveChknBoothOperList`) · 사용자 탭 기본값 · 대시보드 항공사 배정이 CA001 과 같은 부스 · 항공사를 본다
- CAST 일일 실행이 결과를 내고 Finished 로 끝난다

사용자 탭 변경 반영 후:

- **기본값 동등성**: 아무것도 고치지 않은 사용자 실행의 CA 리소스가 같은 날 CA001 과 부스 · 항공사 · 시각(시 단위 반올림 차이 제외)이 같다
- **SBD · 키오스크 동등성**: 대수를 고치지 않은 사용자 SBD 리소스가 SBD001 과 기기 · 항공사 · 시각이 같다(키오스크 종료 1초 차이 제외)
- 일일 SBD001 응답이 조각 추출 전후로 같다
- CAST 실행이 결과를 내고 Finished 로 끝난다(0분 구간 · 23:00 잘림 재발 없음, §11.3)
- 체크인 공용 Queue 의 배정 부스(`retrieveChknBoothOperList` 사용자 분기)가 부스별 시각을 읽어, 사용자 결과의 꼬리 구간 · 결과 전 운영 대수가 부스 단위로 바뀐다(§13)

## 9. 범위 밖 · 남는 문제

- **BR 체크인 누락**: 편 기준(`'D'`) 행만 있는 항공사는 원천 정리 후 CA001 에서 빠진다. 현재는 BR(날짜별 부스 약 10건)뿐이다. BR 출발편 여객은 CAST 에서 유인 카운터가 없어 체크인 대기열이 실적보다 작게 나올 수 있다. 다른 항공사가 같은 상태가 되면 다시 검토한다.
- **일일 체크인 상세의 항공사 누락**: `CastSmryDtlServiceImpl.getAlnCdList` 도 `UserConfigChknDto` 의 첫 항공사만 받아 시간대별로 바뀌는 부스의 다른 항공사가 빠진다. 이번에 고치지 않고 별도로 다룬다.
- 정책 항공사 출발편이 없는 아일랜드에 SBD 대수를 넣은 경우의 안내(경고 표시 여부).
- 구 실행(`smltId`)의 조건 조회는 새 DTO 로 읽혀 아일랜드 운영시간이 사라진다. 기존 실행은 무시하기로 했으므로 호환을 두지 않는다.

## 10. 구현 기록 (2026-11-22)

이 저장소에서 §7 의 1~7단계를 반영했다. `java/` 는 컴파일하지 못했고, DDL 적용 · 실백엔드 빌드 · CAST 실행(§8.1 · §8.3)은 아직이다.
§8.1 결과에 따라 §3.2 규칙이 바뀌면 `CastChknServiceImpl.toAllotAltmntList` 만 고치면 된다.

| 항목 | 구현 | 계획과 다른 점 |
|---|---|---|
| 원천 정리 | `CastApiMapper.cknctDailyAlotLatestRows` 를 다섯 곳이 읽는다. CA001 렌더의 `'D'` 분기 · `MSTR_FLTNM` 삭제 | 없음. 나머지 변경과 같은 작업 트리에 있어 커밋을 나눌 때 매퍼 4개 · AGENTS §11.3 한 줄만 먼저 올린다 |
| 운영 기본값 겹침 | 시각(칸)마다 **시작이 늦은 구간**의 항공사를 칠한 뒤 같은 항공사 연속 칸을 구간으로 묶는다. 시작이 같으면 항공사 코드가 앞선 쪽 | 앞 구간 끝을 자르는 대신 칸 단위로 칠한다. 큰 구간 안에 작은 구간이 든 경우(KE 6~20, OZ 9~12)에도 KE 6~9 · OZ 9~12 · KE 12~20 으로 남는다 |
| 서버 검증 | 부스 번호 1 ~ `max(36, 보유 부스 수)`, 항공사 필수, `0 ≤ 시작 < 종료 ≤ 24`, 같은 부스 겹침 거절, 붙은 같은 항공사 구간 합침, 배정 없는 부스는 버림 | 상한을 보유 부스 수 대신 `max(36, 보유)` 로 했다. 화면이 아일랜드마다 36칸을 그리기 때문이다 |
| 사용자 SBD | `dailySbdIslandRows` 조인. `CRTR_YMD` 는 종료 시각의 일자 | 렌더가 `CRTR_YMD + 종료 HHMI` 로 T2 를 만들어, 정책 항공사 편이 전날뿐인 경우에도 일일과 같은 종료 시각이 되게 했다 |
| `dailySbdIslandRows` | 아일랜드 · 항공사로 먼저 묶어 항공사 목록이 중복 없이 나온다 | 일일 SBD001 은 바깥에서 중복을 지우고 있어 최종 응답은 같다 |
| 실행 조건 조회 | `retrieveBooths` 가 CA 행 그대로(부스 · 항공사 · 시각), `retrieveCheckinHours` 삭제 | 응답 `boothList` 는 CA 에 있는 부스만 담는다(이전과 같다). 편집 응답만 1 ~ 36 을 채운다 |
| DDL | `2026-11-22-user-chkn-booth-altmnt.sql` 이 구 테이블 DROP · 새 테이블 생성 뒤 `TN_PM_SMLT_USER_CHKN_ISL` 행도 지운다 | 부모 행만 남으면 배정 0건(전체 미운영)으로 읽혀 운영자료 기본값으로 되돌리려고 지운다 |
| 화면 뷰모델 | `Booth.hours: string[]`(24칸, 빈 문자열 = 미배정). 저장할 때 `toAltmntList` 로 구간을 묶는다 | `altmnts: BoothAltmnt[]` 대신 칸 배열이다. 매트릭스에서 직사각형으로 칠하기 쉽고 겹침이 생길 수 없다 |
| 편집 UI | `BoothMatrix`(부스 36행 × 24열, 끌어서 직사각형 선택, 시각 · 부스 머리글로 줄 전체 선택, 최대 높이 300px 스크롤). `AirlinePalette` 는 '칸' 단위 문구 | `BoothGrid.tsx` 는 쓰는 곳이 없어 지웠다. CSS 규칙(`boothgrid` · `bcell` · `booths*`)은 className 규칙(AGENTS §3-3)에 따라 남겼다. 화면 육안 확인은 아직이다 |
| 일일 체크인 상세 목업 | `chknCounter.mock.ts` 는 고치지 않았다 | 일일 상세 DTO(`ChknCounterIslandDto`)라 이번 변경과 무관했다 |
