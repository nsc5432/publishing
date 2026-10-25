# `domains` 패키지 의존 방향 정리 계획

작성일: 2026-10-25 · 기준 커밋: `4c3849d`
대상: `java/cast/domains` 의 `wtng` · `chkn` · `dsbd` 패키지, 이를 import 하는 서비스, 클래스 지도 아티팩트

이 문서만 읽고 새 세션에서 작업을 시작할 수 있게 썼다. 이전 대화 내용은 필요 없다.

## 0. 새 세션에서 시작하는 법

1. `AGENTS.md` 를 읽는다 (특히 §3 고정 대상, §5 주석 규칙, §9 "`java/` 는 여기서 컴파일할 수 없다", §15).
2. **§3 결정 사항을 사용자에게 확인한다.** 답이 없으면 표의 기본값으로 진행한다.
3. §2.2 의 사전 점검 명령을 돌려 이 문서의 전제가 아직 맞는지 확인한다. 결과가 다르면 작업을 멈추고 차이를 보고한다.
4. §7 순서대로 진행한다. 커밋은 사용자가 요청할 때만 한다 (AGENTS.md 의 Git 승인 범위).
5. 코드 작업이 끝나면 §9 대로 아티팩트를 갱신한다.

## 1. 배경과 목표

`wtng` 와 `chkn` · `dsbd` 가 서로를 참조해 패키지 순환이 있다.

- `wtng.FcltWtngDay`(10분 통계 공통 평가)가 `chkn` · `dsbd` 의 클래스를 쓴다
- 반대로 `chkn.ChknWtngSecBuilder` · `dsbd.DepWtngSecBuilder` 가 `wtng.FcltWtngSec` 을 만든다

방향을 **`chkn` · `dsbd` → `wtng`** 로 맞춘다. `wtng` 는 저장 형식(`FcltWtngSec` = `TN_PM_SMLT_FCLT_WTNG_RSLT` 1행)과
그걸 읽는 공통 평가를 갖고, 원천 계산(`chkn` 1분 FIFO, `dsbd` 출국장 슬롯)은 그 형식을 채우는 쪽이다.
AGENTS.md §15 의 "등급 · 추천 · 해소는 저장된 10분 통계를 읽는 공통 평가 하나로 계산한다"와 같은 방향이다.

반대 방향(빌더 2개를 `wtng` 로 옮김)은 파일 이동이 적지만, 공통 평가 패키지가 원천 계산 패키지에 기대게 되어 택하지 않았다.

범위 밖:

- 계산 로직 · 산식 · 등급 기준 · 결과 값. **이동 · 이름 변경 · 삭제만 하고 동작은 바꾸지 않는다**
- API DTO (`MapChknRsltDto.oprBoothCnt` 등 AGENTS.md §3 고정 대상)
- `dsbd` 패키지 이름 자체 (출국장 원천 · 대표 항공사만 남아 이름이 맞지 않지만 이번에는 두지 않는다)
- 과거 계획 문서 (`docs/plans/2026-10-1x~24-*`, `docs/2026-10-24-cast-queue-result-handoff.md`) — 역사 기록이라 고치지 않는다

## 2. 현재 의존 관계

### 2.1 순환을 만드는 참조

같은 domains 안에서 코드로 참조하는 것만 셌다 (주석 언급 제외).

| 방향 | 참조하는 클래스 | 참조 대상 |
|---|---|---|
| wtng → chkn | `FcltWtngDay` | `ChknQueueSlot`, `ChknQueueRecommend` |
| wtng → dsbd | `FcltWtngDay` | `FcltQueueSource`, `FcltQueueClearance`, `DepQueueDay.LOOKBACK_MIN` (388행) |
| chkn → wtng | `ChknWtngSecBuilder` | `FcltWtngSec`, `FcltWtngSecs` |
| dsbd → wtng | `DepWtngSecBuilder` | `FcltWtngSec`, `FcltWtngSecs` |
| chkn → dsbd | `ChknQueueDay` | `FcltQueueSource`, `FcltQueueClearance` |

끊을 쪽은 `FcltWtngDay` 의 바깥 참조(위 두 줄)다. 빌더 → wtng 는 목표 방향이라 그대로 둔다.

### 2.2 사전 점검

저장소 루트에서 Git Bash 로 실행한다. 기대 결과와 다르면 이 문서를 먼저 고친다.

```bash
# (a) FcltWtngDay 의 chkn · dsbd import — 기대: ChknQueueSlot, DepQueueDay, FcltQueueClearance, ChknQueueRecommend, FcltQueueSource 5줄
grep -n 'import aoms.pm.cast.domains.\(chkn\|dsbd\)' java/cast/domains/wtng/FcltWtngDay.java

# (b) ChknQueueDay 의 domains 밖 호출 — 기대: islandCdList · queueAt · slotOf · mergedSeries 만 나온다
grep -rn 'queueDay\.[a-zA-Z]*(' --include=*.java java/cast/service | sed 's/.*queueDay\./queueDay./' | cut -c1-30 | sort -u

# (c) DepQueueWindow · windowAt 의 domains 밖 사용 — 기대: 0줄
grep -rn 'DepQueueWindow\|windowAt(' --include=*.java java | grep -v '/domains/dsbd/'

# (d) 옮길 클래스를 쓰는 파일 — 기대: §4.2 · §5 표의 파일과 같다
for c in FcltQueueSource FcltQueueClearance ChknQueueSlot ChknQueueRecommend; do
  echo "== $c"; grep -rlw "$c" --include=*.java java | grep -v "/$c.java"; done
```

### 2.3 목표 구조

```
queue  ←  (루트) CgnGradeScale  ←  wtng  ←  chkn
                                       ←  dsbd
```

- `wtng` 는 `queue` 와 루트(`CgnGradeScale`)만 본다
- `chkn` · `dsbd` 는 `wtng` 와 (필요하면) `queue` 만 보고 서로는 보지 않는다
- 루트의 `CgnGradeScale` 은 `queue` 만 본다 (지금과 같음)

## 3. 결정 사항

새 세션 시작 때 사용자에게 확인한다. 답이 없으면 기본값으로 진행한다.

| 항목 | 선택지 | 기본값 | 이유 |
|---|---|---|---|
| A. 1단계 의존 방향 정리 | — | 진행 | 이 작업의 목적 |
| B. 2단계 이름 변경 | 진행 / 보류 | 진행 | 옮기는 김에 바꾸면 import 수정이 한 번으로 끝난다 |
| C. 3단계 안 쓰는 경로 정리 | 진행 / 보류 | 진행 | 남겨 두면 `ChknQueueDay` 가 같은 일을 하는 두 번째 평가기로 읽힌다 |
| D. `DepWtngSecBuilder.java:59` 주석 "(기존 DepQueueWindow 해석)" | 그대로 / 문구 수정 | 그대로 | AGENTS.md §5: 기존 주석은 사용자 요청 없이 고치지 않는다 |
| E. 상수 위치 | `FcltWtngDay.DEP_LOOKBACK_MIN` / `FcltWtngSecs` | `FcltWtngDay` | 이 값을 쓰는 평가 코드가 거기 있다 |

## 4. 1단계 — 의존 방향 정리 (필수)

### 4.1 이동

| 대상 | 현재 | 이동 후 | 근거 |
|---|---|---|---|
| `FcltQueueSource` | `domains.dsbd` | `domains.wtng` | `queue` 와 enum(`TerminalKind` · `FcltType`)만 참조. 대시보드 전용이 아니다 |
| `FcltQueueClearance` | `domains.dsbd` | `domains.wtng` | `queue` 와 `FcltQueueSource` 만 참조 |
| `ChknQueueSlot` | `domains.chkn` | `domains.wtng` | 참조 없는 값 객체. `FcltWtngDay.slotOf` 가 출국장에도 돌려준다 |
| `ChknQueueRecommend` | `domains.chkn` | `domains.wtng` | 참조 없는 값 객체 |
| `DepQueueDay.LOOKBACK_MIN` (180분) | `DepQueueDay` 상수 | `FcltWtngDay.DEP_LOOKBACK_MIN` | 잔여 대기열 역추정 범위. 값 소유를 wtng 로 옮긴다 |

파일 이동은 `git mv` 로 해서 이력을 남긴다. 예:

```bash
git mv java/cast/domains/dsbd/FcltQueueSource.java java/cast/domains/wtng/FcltQueueSource.java
```

상수는 아래처럼 바꾼다. `DepQueueDay` 쪽 이름을 남겨 dsbd 내부 사용처(`DepQueueWindow`, `DepWtngSecBuilder:41`)를 그대로 둔다.
`DepQueueDay.java:32` 의 기존 줄 끝 주석은 `FcltWtngDay` 로 옮기지 말고 그 자리에 둔다 (§5 주석 규칙).

```java
// FcltWtngDay
public static final int DEP_LOOKBACK_MIN = 180;

// DepQueueDay
public static final int LOOKBACK_MIN = FcltWtngDay.DEP_LOOKBACK_MIN; // 잔여 대기열 도착 시각을 되짚는 범위(분)
```

`FcltWtngDay.java:388` 은 `DepQueueDay.LOOKBACK_MIN` → `DEP_LOOKBACK_MIN` 으로 바꾼다.

### 4.2 고칠 파일

package 선언과 import 만 바뀐다 (상수 두 곳 제외).

| 파일 | 바뀌는 것 |
|---|---|
| `domains/wtng/FcltQueueSource.java` (이동) | package |
| `domains/wtng/FcltQueueClearance.java` (이동) | package. 같은 패키지가 된 `FcltQueueSource` import 제거 |
| `domains/wtng/ChknQueueSlot.java` (이동) | package |
| `domains/wtng/ChknQueueRecommend.java` (이동) | package |
| `domains/wtng/FcltWtngDay.java` | chkn · dsbd import 5줄 제거, `DEP_LOOKBACK_MIN` 추가, 388행 |
| `domains/chkn/ChknQueueSeries.java` | `ChknQueueSlot` import 추가 (지금은 같은 패키지라 import 없음) |
| `domains/chkn/ChknQueueDay.java` | `ChknQueueSlot` · `ChknQueueRecommend` import 추가, `FcltQueueSource` · `FcltQueueClearance` import 경로 변경 (3단계를 먼저 했으면 `ChknQueueSlot` 만) |
| `domains/dsbd/DepQueueDay.java` | `LOOKBACK_MIN` 정의, `FcltWtngDay` import |
| `domains/dsbd/DepQueueWindow.java` | `FcltQueueSource` import 추가 (3단계에서 삭제했으면 해당 없음) |
| `service/impl/CastDsbdServiceImpl.java` | `FcltQueueSource` · `FcltQueueClearance` · `ChknQueueSlot` import |
| `service/impl/CastFcltQueueScenarioServiceImpl.java` | `FcltQueueSource` · `FcltQueueClearance` import |
| `service/impl/CastChknCounterServiceImpl.java` | `ChknQueueSlot` · `ChknQueueRecommend` import |
| `service/impl/CastMapServiceImpl.java` | `ChknQueueSlot` · `ChknQueueRecommend` import |
| `verify/FcltWtngRegression.java` | `FcltQueueClearance` import |

import 순서는 각 파일의 기존 정렬(알파벳순 그룹)을 따른다.

## 5. 2단계 — 이름 변경 (결정 B)

`wtng` 로 옮긴 두 값 객체는 출국장 평가에도 쓰이는데 이름이 `Chkn*` 이다.

| 현재 | 변경 | 사용처 |
|---|---|---|
| `ChknQueueSlot` | `FcltWtngSlot` | `ChknQueueSeries`, `ChknQueueDay`, `FcltWtngDay`, `CastChknCounterServiceImpl`, `CastDsbdServiceImpl`, `CastMapServiceImpl` |
| `ChknQueueRecommend` | `FcltWtngRecommend` | `ChknQueueDay`, `FcltWtngDay`, `CastChknCounterServiceImpl`, `CastMapServiceImpl` |

- 자체 도메인 클래스라 AGENTS.md §3 고정 대상이 아니다. 파일명 · 클래스명 · `EMPTY` / `NONE` 상수 타입 · 지역변수 타입 · 반환 타입이 바뀐다
- 파일은 `git mv` 로 이름을 바꾼다
- 지역변수 이름(`queueSlot`, `recommend` 등)은 바꾸지 않는다
- `ChknQueueSlot.oprBoothCnt`(게터 `getOprBoothCnt`)는 **바꾸지 않는다.** 출국장에서는 운영 수를 뜻하지만
  `CastChknCounterServiceImpl` · `CastDsbdServiceImpl` 여러 곳이 읽고, DTO `MapChknRsltDto.oprBoothCnt` 와 이름이 이어져 있다
- `FcltRecommendDto`(API DTO)와 헷갈리지 않도록 `FcltRecommend` 같은 짧은 이름은 피했다

## 6. 3단계 — 안 쓰는 경로 정리 (결정 C)

10분 통계 전환(AGENTS.md §15) 뒤로 서비스는 등급 · 해소 · 추천을 모두 `FcltWtngDay` 에서 받는다.
아래는 `java/` 전체를 검색해 domains 바깥 호출이 없음을 확인한 것들이다 (§2.2 (b) · (c)).

### 6.1 `ChknQueueDay` 평가 메서드

서비스가 쓰는 것은 `islandCdList` · `mergedSeries` · `slotOf` · `queueAt` 뿐이다 (요약보기 차트 · PRIME TIME · 체크인 상세 KPI).

| 지울 것 | 비고 |
|---|---|
| `windowSlotOf`, `waitWindowOf`, `avgWtngSecOf`, `gradeOf`, `warningList`, `sourceOf`, `clearanceOf`, `recommendOf` | 서비스 호출 없음. `warningList` 는 `ChknQueueTmnlSeries.warningList`(서비스가 씀)와 다른 메서드 |
| private `historyGapOf` | 위 메서드만 쓴다 |
| 필드 `gradeScale`, 생성자 인자 `CgnGradeScale` | 위 메서드만 쓴다 |
| 남는 참조가 없어진 필드 · 상수 (`trajectory`, `tmnlId`, `baseDate`, `WINDOW_MIN`, `SEC_PER_MIN` 등) | 하나씩 사용처를 확인하고 지운다. `seriesMap` · `mergedSeries` · `originMinute` · `TMNL_ISLAND` 는 생성자 · 남는 메서드가 쓴다 |
| `ChknQueueSeries.waitWindowOf`, `ChknQueueSeries.serviceRateOf` | `ChknQueueDay` 만 부른다. `ChknWtngSecBuilder` 는 쓰지 않는다 |
| 쓰이지 않게 된 import | `Computed`, `QueueDataSource`, `QueueWaitWindow`, `CgnGradeScale`, `CongestionStatus`, `BigDecimal` 등 |

연쇄 변경:

- `CastChknQueueServiceImpl.retrieveChknQueueDay`(66~68행)가 `CgnGradeScale` 을 넘기지 않는다. 그러면 66행 `context` 지역변수와
  `castCgnGradeService` 필드(62행)가 쓰이지 않으니 함께 지운다. 78행의 `context` 는 다른 메서드라 그대로다.
  `FcltType` · `CastCgnGradeService` import 가 남는 곳이 없으면 지운다
- `CastChknQueueService` 인터페이스 시그니처는 그대로다
- 정리 후 `chkn` 은 `queue` 를 참조하지 않는다

### 6.2 `DepQueueWindow`

| 지울 것 | 비고 |
|---|---|
| `domains/dsbd/DepQueueWindow.java` | 유일한 생성 경로가 `DepQueueDay.windowAt` |
| `DepQueueDay.windowAt` | 서비스 호출 없음 |

남는 것: `DepQueueDay` 의 `Slot` · `getSlotMapByUnit` · `CAST_SLOT_MIN` · `LOOKBACK_MIN` 은 `DepWtngSecBuilder` ·
`CastDepQueueServiceImpl` · `CastFcltWtngServiceImpl` 이 계속 쓴다.

### 6.3 주석

AGENTS.md §5 에 따라 **다른 파일에 남은 기존 주석은 지우거나 고치지 않는다.** 삭제하는 클래스 · 메서드 자체의 주석은 코드와 함께 사라진다.
삭제 후 가리키는 대상이 없어지는 주석은 결정 D 를 따른다.

- `DepWtngSecBuilder.java:59` — "(기존 DepQueueWindow 해석)"

## 7. 진행 순서

**3단계(정리) → 1단계(이동) → 2단계(이름)** 순서로 한다. 정리를 먼저 하면 `ChknQueueDay` 의 `FcltQueueSource` ·
`FcltQueueClearance` · `ChknQueueRecommend` 참조와 `DepQueueWindow` 가 사라져 이동 때 손댈 파일이 줄어든다.
보류한 단계는 건너뛴다. 1단계만 해도 순환은 없어진다.

단계마다 §10 의 해당 검색을 돌리고, 커밋을 요청받으면 단계별로 나눠 커밋한다. 커밋 메시지 예:

- `refactor: drop unused chkn/dep evaluation paths superseded by FcltWtngDay`
- `refactor: point chkn and dsbd at wtng to break package cycle`
- `refactor: rename ChknQueueSlot/Recommend to FcltWtngSlot/Recommend`

## 8. 문서 갱신

코드 변경과 같은 커밋(또는 마지막 커밋)에 넣는다.

| 위치 | 바꿀 내용 |
|---|---|
| AGENTS.md §13 표 "슬롯 조회 · 혼잡등급 · 부스 추천 \| `domains/chkn/ChknQueueDay`" | 3단계를 했으면 역할을 "슬롯 조회 · 1분 경로 지표(차트 · KPI)" 로 |
| AGENTS.md §13 "`ChknQueueDay.recommendOf` 는 … `domains/dsbd/FcltQueueClearance`" | `FcltWtngDay.recommendOf` · `domains/wtng/FcltQueueClearance` |
| AGENTS.md §13.1 "평가시각마다 `DepQueueWindow` 를 만든다" | 3단계를 했으면 10분 통계(`DepWtngSecBuilder` → `FcltWtngDay`) 기준으로 고쳐 쓴다 |
| AGENTS.md §14 표 "공용 평가기" · "원천 어댑터" 행 | 경로 `domains/wtng/FcltQueueClearance`, 원천 어댑터는 `FcltWtngDay.sourceOf` |
| AGENTS.md §15 | 패키지 방향 한 줄: "`chkn` · `dsbd` → `wtng` → (루트) → `queue`. `wtng` 는 원천 계산 패키지를 참조하지 않는다" |

줄 번호는 바뀌므로 위 인용 문구로 찾는다. 2단계를 했으면 AGENTS.md 의 `ChknQueueSlot` · `ChknQueueRecommend` 언급도 새 이름으로 바꾼다.

## 9. 클래스 지도 아티팩트 갱신

코드 작업 뒤 **같은 URL** 의 아티팩트를 갱신한다: https://claude.ai/artifact/GLqDFxVWn5R3xA6MoSuqdH
("CAST domains 클래스 지도" — 그림 1 · 그림 2 · 클래스별 역할 표 · 짚어둘 점으로 된 HTML 페이지)

### 9.1 절차

1. `Artifact` 도구 `action: "read"`, `url` 위 주소로 현재 페이지를 읽는다. 결과에 저장된 로컬 파일 경로가 나온다.
   원본 HTML 파일은 이전 세션 scratchpad 에 있어 새 세션에서는 없다 — **반드시 read 결과의 파일을 기준으로 고친다.**
2. 그 파일을 Edit 으로 고친다 (§9.2).
3. `Artifact` publish 에 같은 `url` 과 고친 파일 경로를 넘긴다. `icon` 은 넘기지 않는다. 새 URL 을 만들지 않는다.

### 9.2 고칠 내용

참조 · 사용처 열은 추측하지 말고 §9.3 스크립트로 다시 뽑아 채운다. 보류한 단계에 해당하는 항목은 건너뛴다.

| 위치 | 변경 | 단계 |
|---|---|---|
| 머리 `.path` 줄 "4c3849d 기준" | 작업 후 커밋 해시. 클래스 수 "36개" 는 3단계 후 35개 | 공통 |
| `.flowline` | `FcltQueueSource` · `FcltQueueClearance` 의 `data-p="dsbd"` → `"wtng"` | 1 |
| 범례 `.pkg` 설명 | dsbd: "출국장 SC/SR 원천과 10분 변환, 대표 항공사" · wtng: "10분 대기 통계, 공통 평가, 혼잡해소 평가기" · chkn: 그대로 | 1 |
| 그림 1 `DepQueueWindow` 노드와 `windowAt` 점선 화살표 | 삭제 | 3 |
| 그림 1 `ChknQueueDay` 노드 설명 "궤적 + 등급 기준 · 1분 경로" | "궤적 묶음 · 1분 경로" | 3 |
| 그림 1 figcaption "흐린 상자는 서비스에서 부르는 곳이 없는 경로입니다." | 문장 삭제 | 3 |
| 그림 2 `FcltQueueSource` · `FcltQueueClearance` · `ClearanceResult` · `Recommend` 노드 | `data-p="dsbd"` → `"wtng"` | 1 |
| 그림 2 `ChknQueueRecommend` 노드 | `data-p="chkn"` → `"wtng"`, 2단계면 이름 `FcltWtngRecommend` | 1 · 2 |
| 그림 2 figcaption 마지막 문장 "`ChknQueueDay`와 `DepQueueWindow`에도 같은 `sourceOf`가 있지만 서비스에서 부르지 않습니다." | 삭제 | 3 |
| 그림 2 figcaption "맵·체크인 상세는 `ChknQueueRecommend`로 받습니다" | 2단계면 `FcltWtngRecommend` | 2 |
| 두 그림의 `aria-label` | 바뀐 이름 · 삭제한 노드를 반영 | 2 · 3 |
| 표: `FcltQueueSource` · `FcltQueueClearance` · `ChknQueueSlot` · `ChknQueueRecommend` 행 | wtng 그룹으로 옮긴다 (2단계면 새 이름) | 1 · 2 |
| 표: `DepQueueWindow` 행 | 삭제 | 3 |
| 표: `ChknQueueDay` 행 | 태그 "평가 메서드 호출 없음" 삭제, 역할 "궤적 묶음. 1분 경로(슬롯 · KPI · 차트)용", 참조 다시 뽑기 | 3 |
| 표: dsbd 그룹 머리 설명 "출국장 원천 · 혼잡해소 평가 · 대표 항공사" | "출국장 원천 · 대표 항공사" | 1 |
| 표: 모든 행의 참조 · 사용처 열 | §9.3 결과로 갱신 (`FcltWtngDay` · `ChknQueueSeries` · `DepQueueDay` · `ChknQueueDay` 가 특히 바뀜) | 공통 |
| 짚어둘 점 1 "wtng와 chkn·dsbd는 서로를 참조합니다" | "패키지 의존은 한 방향입니다" 로 바꾸고 `queue ← (루트) ← wtng ← chkn · dsbd` 를 설명. 이 계획 문서 경로를 적는다 | 1 |
| 짚어둘 점 2 "서비스에서 부르지 않는 평가 경로가 두 곳 있습니다" | 3단계를 했으면 항목 삭제 | 3 |
| 짚어둘 점 3 "시간 축이 두 개입니다" | 2단계면 `ChknQueueSlot` → `FcltWtngSlot` | 2 |

그림 좌표는 지운 노드 자리만 비우고 나머지는 옮기지 않는다. 페이지의 디자인 토큰 · 다크 모드 블록은 손대지 않는다.

### 9.3 참조 · 사용처 다시 뽑기

`java/cast` 에서 실행한다. 출력에서 주석에만 이름이 나오는 경우(예: `FacilityQueueInput` → `FacilityQueueCalculator`,
`QueueWaitWindow` → `WaitAvgForecast`)는 해당 파일을 열어 확인하고 표에서 뺀다.

```bash
cd java/cast/domains
names=$(find . -name '*.java' -exec basename {} .java \; | sort)
for f in $(find . -name '*.java' | sort); do
  me=$(basename "$f" .java); refs=""
  for n in $names; do [ "$n" = "$me" ] && continue; grep -qw "$n" "$f" && refs="$refs $n"; done
  echo "$f ->$refs"
done
cd ..
for n in $names; do
  echo "$n: $(grep -rlw "$n" --include=*.java . | grep -v '/domains/' | xargs -n1 basename 2>/dev/null | sed 's/.java//' | tr '\n' ' ')"
done
```

표의 사용처 열은 `Cast*ServiceImpl` 에서 접두사 `Cast` 와 접미사 `ServiceImpl` 을 뺀 이름으로 쓴다.

## 10. 검증

이 저장소는 Java 를 컴파일할 수 없다 (AGENTS.md §9). 여기서 할 수 있는 것과 실제 백엔드에서 할 것을 나눈다.

여기서 (저장소 루트, 기대 결과는 모두 0줄):

```bash
# 1단계: 옛 패키지 경로
grep -rn 'domains\.dsbd\.FcltQueue\|domains\.chkn\.ChknQueue\(Slot\|Recommend\)' --include=*.java java
# 1단계: 패키지 방향
grep -n 'import aoms.pm.cast.domains.\(chkn\|dsbd\)' java/cast/domains/wtng/*.java
grep -n 'import aoms.pm.cast.domains.dsbd' java/cast/domains/chkn/*.java
# 2단계: 옛 이름
grep -rnw 'ChknQueueSlot\|ChknQueueRecommend' --include=*.java java
# 3단계: 지운 경로
grep -rn 'DepQueueWindow\|windowAt(' --include=*.java java
grep -rn 'queueDay\.\(sourceOf\|clearanceOf\|recommendOf\|gradeOf\|waitWindowOf\|windowSlotOf\|avgWtngSecOf\)' --include=*.java java
```

3단계 뒤 `DepWtngSecBuilder.java:59` 주석의 `DepQueueWindow` 는 결정 D 가 "그대로" 면 위 검색에 남는다. 그 1줄은 예외로 본다.

실제 백엔드에서 (사용자에게 요청):

- 전체 빌드
- `verify/FcltWtngRegression` main 실행 — 기대값 단언이 그대로 통과해야 한다
- 같은 `smltId` · 터미널 · `hhmm` 에서 요약보기 카드 · 맵형태보기 · 체크인 상세 · 혼잡해소 팝업 · 출국장 응답이 변경 전과 같은지 대조

## 11. 완료 기준

- [ ] §3 결정 사항을 사용자에게 확인했다 (또는 기본값으로 진행했다고 알렸다)
- [ ] §2.2 사전 점검 결과가 이 문서와 같았다
- [ ] 진행한 단계의 §10 검색이 모두 0줄이다 (결정 D 예외 제외)
- [ ] AGENTS.md §13 · §13.1 · §14 · §15 를 고쳤다 (§8)
- [ ] 아티팩트를 같은 URL 로 다시 게시했다 (§9)
- [ ] 실제 백엔드 빌드 · 회귀 확인이 남아 있음을 사용자에게 알렸다
