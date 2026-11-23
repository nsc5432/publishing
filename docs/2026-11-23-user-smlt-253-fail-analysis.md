# 사용자 시뮬레이션 253편 실패 원인 분석

- 작성일: 2026-11-23
- 대상 로그: `CAST분석/` 폴더의 CAST API 교환 로그 4건 (`.gitignore` 대상이라 저장소에는 없다. 작성 PC 에만 있다)
- 실패 정의: CAST가 결과 리소스 `REQ_SetResource.do`를 호출하지 않음

| 로그 파일 | WhatIf 요청 | 리소스 번호 | 결과 |
|---|---|---|---|
| `사용자시뮬레이션-253편(실패).txt` | WI00009630 | FS074 · CA074 · SBD074 · PS561 | 실패 |
| `사용자시뮬레이션-223편(성공).txt` | (FS082) | FS082 · CA082 · SBD082 · PS569 | 성공 |
| `사용자시뮬레이션-196건(성공).txt` | WI00009635 | FS078 · CA078 · SBD078 · PS565 | 성공 |
| `사용자시뮬레이션-46건(성공).txt` | WI00009636 | FS079 · CA079 · SBD079 · PS566 | 성공 |

대상 일자는 253 · 223 · 196편이 2026-12-01, 46건이 2026-12-02 이다.

---

## 1. 결론

**가장 유력한 원인은 UA892편의 게이트 `025`(주기장 `021`)다.** 로그만으로 확정할 수는 없으므로
§5 의 재실행 실험으로 확정해야 한다.

```
FlightNumberID  UA892_2026-12-01T18:00:00.000
DepArrTerminal  P01
ScheduleTime    18:00   EstimatedTime 18:20
Gate            025     StandNumber   021     ContactRemote E
Seats 276 / PaxCount 226 / TransferPax 15 / AircraftType 772
CheckInRange    D19-D26 / AirportCode SFO
```

---

## 2. 실패 건도 CAST 쪽에서는 정상 종료였다

- 네 건 모두 리소스를 같은 순서로 읽는다:
  `WhatIfDefinitionTable` → `ICN001`(모델) → FS → CA → PS → SBD → `CheckinType001` →
  운영표 5종(DepartureGate · Emigration · Immigration · SecurityControl · TransferSecurityControl) →
  `CheckinCounterServiceTime001` → `ReportingProfilesTimeGroups001` → 로그 끝.
- 실패 건도 마지막 리소스까지 모두 읽었다. 리소스를 읽다가 끊긴 것이 아니다.
- 이후 로그의 WhatIfDefinitionTable 에서 WI00009630 의 상태는 `Finished` 다.
  → **CAST 는 오류 없이 계산을 끝냈지만 결과를 보내지 않았다.**
- 이 패턴은 저장소에 기록된 과거 사례와 같다 (`AGENTS.md` §11.3).
  - 사용자 SBD T2 를 시만 잘라 23:00 이 되면 결과 없이 Finished
  - 좌석수 0 · NULL 편이 섞이면 결과 없이 Finished
  - 게이트 · 주기장에 GO 원값을 그대로 쓰면 출발편이 게이트에 배정되지 않고 계산 없이 끝남

즉 **입력 데이터의 이상이 CAST 내부 계산을 조용히 멈추게 한 것**으로 본다.

---

## 3. 실패 건과 223편(성공)은 FS · CA 만 다르다

리소스 ID(FS/CA/SBD/PS 번호)와 시각 표기를 지우고 비교한 결과:

| 리소스 | 253 vs 223 | 253 vs 196 | 253 vs 46 |
|---|---|---|---|
| ICN001 (모델) | 같음 | 같음 | 같음 |
| PS | 같음 | 같음 | 같음 |
| SBD | 같음 | 같음 | 다름 (일자가 달라 정상) |
| CheckinType001 | 같음 | 같음 | 같음 |
| 운영표 5종 | 같음 | 같음 | 같음 |
| CheckinCounterServiceTime001 | 같음 | 같음 | 같음 |
| ReportingProfilesTimeGroups001 | 같음 | 로그 끝 공백만 다름 | 같음 |
| **FS** | **다름** | 다름 | 다름 |
| **CA** | **다름** | 다름 | 다름 |

→ 원인은 **FS074 또는 CA074 안에 있다.**

FS · CA 는 구조상 문제가 없다. 컬럼 수와 컬럼별 값 개수가 일치하고, CA 는 `T1 < T2` 이며
같은 카운터에 배정 겹침이 없다.

---

## 4. 실패 FS · CA 에만 있는 값

성공 3건의 FS · CA 어디에도 나오지 않고 실패 건에만 있는 값:

| 구분 | 값 |
|---|---|
| 게이트 / 주기장 | **UA892: 게이트 `025`, 주기장 `021`, `ContactRemote=E`, P01** |
| FS 항공사 | EY, M0 |
| CA 항공사 | 3U, M0 |
| 도착 공항 | AUH, CEB, EWR, MDC, YYZ |
| 기종 | 319 |
| 좌석수 | 141, 257, 276, 321, 368, 371 |
| CA 카운터 | K23 ~ K28 (성공 건은 K22 까지) |

### 4.1 UA892 를 가장 의심하는 이유

1. 게이트 `025` 는 성공 FS 3건 어디에도 없다.
2. `ContactRemote=E` 인 P01(T1 본관) 편은 4건 통틀어 UA892 하나뿐이다.
   성공 건의 `E` 편은 모두 탑승동(P02) 게이트 `103` · `124` · `131` 이다.
3. `ContactRemote` 는 `java/mapper/CastApiMapper.xml` 의 `dailyFlightScheduleRows`(723행 부근)에서
   `CAOWN.TN_CA_ACST` 에 그 게이트로 연결된 사용 주기장이 없으면 기본값 `'E'` 를 넣는다.
   → **시설 마스터가 게이트 25 를 모른다.** 그런데 GO 원천은 게이트 25 · 주기장 21 을 배정했고,
   게이트와 주기장도 서로 맞지 않는다. (게이트 ≠ 주기장 편은 성공 건에도 TW101 `003`/`020` 이 있으나 `G` 다.)
4. AGENTS.md §11.3 의 "게이트에 GO 원값을 쓰면 출발편이 게이트에 배정되지 않고 CAST 가 계산 없이 끝난다"와
   같은 종류의 실패로 보인다.

### 4.2 가능성이 낮은 후보

| 후보 | 낮게 보는 이유 |
|---|---|
| K23 ~ K28 카운터 | 일일 CA001 과 같은 DB 카운터 마스터에서 나온 값이고, K 아일랜드 앞번호는 성공 건에서도 쓰였다 |
| 체크인 배정 없는 편 (12편) | 성공한 223편은 29편으로 더 많다 (CX · SQ · ZE · PR 등) |
| 출발 3시간 ~ 1시간 전 배정이 없는 편 (14편) | 성공 건도 10 ~ 11편 있다 (자정 직후 편 등) |
| 항공사 · 공항 · 기종 · 좌석 | 편 속성일 뿐 시설 배정과 관계가 없다 |
| 예정 ≠ 예상 시각 | 성공 건에도 있다 (HX625 · TW605 · VJ 편 등) |

### 4.3 참고: 253편과 223편의 편 구성 차이

- 253편에만 있는 편 51편, 223편에만 있는 편 21편이다.
- 253편에만 있는 51편은 모두 **16:20 ~ 21:40 출발** 편이다 (UA892 포함).
- 공통 편 중 다수는 `CheckInRange` 만 다르다. CA 배정 자체가 두 실행 사이에 크게 달라졌기 때문이다
  (예: 7C `C05-C08` ↔ `C09-C12`, ZE `C09-C12` ↔ 없음).

---

## 5. 확정 방법

모델 `ICN001` 은 바이너리라 게이트 025 가 모델에 있는지 로그로 확인할 수 없다.

### 5.1 재실행 실험 (둘 중 하나)

1. 253편 조건에서 **UA892 만 빼고** 재실행 → 결과(`REQ_SetResource`)가 오면 원인 확정
2. 성공한 223편 조건에 **UA892 만 추가**해 재실행 → 결과가 안 오면 원인 확정

### 5.2 DB 확인

```sql
-- 게이트 25 가 게이트 마스터에 있는지
SELECT * FROM CAOWN.TN_CA_GATE WHERE GATE_NO IN ('25', '025');

-- 게이트 25 / 주기장 21 이 주기장 마스터에 어떻게 연결돼 있는지
SELECT * FROM CAOWN.TN_CA_ACST WHERE GATE_NO IN ('25', '025') OR ACST_NO IN ('21', '021');

-- GO 원천의 UA892 배정값
SELECT FLTNM, SCHDL_HM, PREDC_HM, GATE_NO, ACST_NO
  FROM GOOWN.TN_GO_GD_DATA
 WHERE GD_SE_YMD = '20261201' AND FLTNM = 'UA892' AND ARR_DEP_SE_CD = 'D';
```

---

## 6. 확정 뒤 수정 방향 (미착수)

- FS 를 만드는 `CastApiMapper.xml#dailyFlightScheduleRows` 에서 마스터(`TN_CA_GATE` · `TN_CA_ACST`)에 없는
  게이트를 그대로 보내지 않는다. 과거 대표 게이트(`PAST_GATE`)나 주기장 기준 게이트로 대체하는 방안을 검토한다.
- 이 SQL 조각은 **일일 FS001 도 같이 쓴다.** 일일 시뮬레이션에도 같은 위험이 있다.
- `java/` 는 참조 사본이라 수정 후 실제 백엔드에서 빌드 · 검증해야 한다.

---

## 부록: 분석 방법

1. 로그 한 줄은 탭 구분(`API명 \t payload|result \t 본문 \t 사용자 \t IP \t 시각 …`)이며 본문은 SOAP XML 이다.
   `payload` 줄의 `ResourceID` 로 요청을 식별하고, 이어지는 `result` 본문을 리소스별 파일로 나눴다.
2. 리소스 번호와 시각을 정규식으로 지운 뒤 실행 간 `diff` 로 내용 차이를 확인했다 (§3).
3. FS · CA 의 `<m:col PName=… values="a,b,c">` 컬럼형 표를 행 단위로 펼쳐 비교했다.
   - 컬럼 길이 일치 · 빈 값 · 중복 편명 · 시각 범위
   - 실패 건에만 있는 값 (§4)
   - CA `T1 < T2` · 카운터별 배정 겹침 · 아일랜드별 카운터 번호 범위
   - FS 항공사 ↔ CA 항공사 대응, 출발 3시간 ~ 1시간 전 배정 커버리지
   - 게이트 · 주기장 · `ContactRemote` 조합
