# 사용자 시뮬레이션 실행 터미널 범위 · 운항편 없음 · 기준일자 일관성 점검 (2026-11-27)

상태: **점검만 완료, 코드 수정 전.** 1 · 2번은 수정 방향에 대한 사용자 확인이 남아 있다.

## 점검 요청

1. 사용자 시뮬레이션 실행 시 T1 / T2 중 비활성화한 터미널 정보는 전달하지 않아야 한다. 그렇게 구현돼 있는가?
2. 특정 터미널에 운항편이 없어도 실행은 되어야 한다. 예외는 T1 · T2 둘 다 운항편이 없을 때만 던져야 한다.
3. CAST 계산이 `TN_PM_SMLT_DALY_CRTR_YMD` 기준일자를 일관되게 쓰는가? (운항편은 기준일자, 체크인 배정은 오늘 날짜 같은 불일치가 없는가)

## 결론 요약

| # | 결과 | 비고 |
|---|---|---|
| 1 | **문제 있음** — 비활성 터미널도 전달 · 발행된다 | 현재 문서화된 설계(AGENTS.md §11.1 "실행은 항상 T1·T2 전체")와 요구가 충돌 |
| 2 | **문제 있음** — 한 터미널만 0편이어도 예외 | 체크인 운영자료 검사도 같이 막을 수 있음 |
| 3 | **일일 경로는 일관됨** | 타이밍 위험 2건만 참고 |

---

## 1. 비활성 터미널 전달 여부

### 현재 동작

**화면**

- 실행 요청 `UserSmltExecReq` 는 `{ ymd, fltPsgList, chknList, depList }` 뿐이고 실행 대상 터미널 필드가 없다
  (`react/src/types/api.types.ts` `UserSmltExecReq`).
- 터미널 선택 상태는 `UserSmltConfig.tsx` 의 `enabled`(`TerminalEnabled`)에 있지만 요청에 실리지 않는다.
- 세 탭의 `collect()` 가 `enabled` 를 보지 않고 dirty(수정 여부)만 본다.
  - `tabs/flightPax/FlightPaxTab.tsx` `collect`
  - `tabs/checkinCounter/CheckinCounterTab.tsx` `collect`
  - `tabs/departure/DepartureTab.tsx` `collect`
  - → T2 를 수정한 뒤 T2 를 끄면, T2 수정분이 실행 요청에 실리고 서버가 자동 저장까지 한다.
- 실행 확인 문구도 "T1/T2 전체 시뮬레이션을 실행하시겠습니까?" (`UserSmltConfig.tsx` `handleRun`).

**서버**

- `CastUserSmltServiceImpl.executeUserSmlt` 가 `List.of(TerminalKind.T1, TerminalKind.T2)` 를 고정으로 돌며
  두 터미널 모두 `resolveTerminal` → `UserSmltCustomCondDto` 를 만든다.
- 발행(`CastUserSnapshotServiceImpl.publish`)에서 터미널 필터가 없는 곳:
  - `CastUserSnapshotMapper.insertSchdlAtrbFromDaily` — `CastApiMapper.dailyFlightScheduleRows` 전체(P01~P03)를 넣는다.
    `insertSchdlAtrbFromSrc` 도 마찬가지.
  - `CastApiMapper.transferCheckinRows` — 사용자 CA 에도 P01 · P02 · P03 환승 체크인을 무조건 붙인다.
  - CA · SBD · 출국장 · 보안검색은 `customCondList` 로 만든 행만 넣으므로, 조건 목록에서 터미널을 빼면 같이 빠진다.

### 수정 시 고려사항 (미확정)

요구대로 바꾸려면 AGENTS.md §11.1 의 설계 문구부터 바꿔야 한다. 예상 변경 범위:

1. **계약**: `UserSmltExecReq` / Java `UserSmltExecSearchDto` 에 실행 대상 터미널 목록을 추가한다(이름 미정).
   §3 의 DTO 고정 규칙에 따라 AGENTS.md §3 에 변경 이력을 남긴다.
2. **화면**: `collect()` 가 실행 시 선택 터미널만 담게 거른다. 확인 문구를 선택 터미널 기준으로 바꾼다.
   저장(`handleSave`, `collect(true)` + `TERMINALS.length` 검사)은 실행과 별개라 유지할지 결정해야 한다.
3. **서버 확정**: `executeUserSmlt` 가 선택 터미널만 `resolveTerminal` 한다. 빈 목록 · 중복은 거부한다.
4. **서버 발행**:
   - FS: `insertSchdlAtrbFromDaily` · `insertSchdlAtrbFromSrc` 에 터미널 필터(T1 = P01 · P02, T2 = P03)를 추가한다.
     FS 를 거르지 않으면 꺼진 터미널 운항편이 CA 없이 CAST 로 넘어간다.
   - CA 환승 체크인: `transferCheckinRows` 의 사용자 분기(`otherwise`)에서 선택 터미널만 붙인다.
   - SC: `countScrtyCntrlDiffFromDaily` 는 001 전체와 비교하므로 한 터미널만 있으면 항상 '다름' → 자체 발행된다. 동작은 맞지만 확인할 것.
   - 입국심사 · 환승보안은 `001` 을 그대로 참조하므로 꺼진 터미널 행도 들어간다. 운항편이 없으면 영향이 작을 것으로 보이나 실연계로 확인.
5. **결과 화면**: 꺼진 터미널은 결과가 비게 된다. 사용자 결과 4화면이 빈 터미널을 어떻게 보일지 확인한다.
6. **공개 조건 조회**(`mode=view`): 실행 당시 어떤 터미널이었는지 보여야 하는지 결정한다.
7. 검증: `npx tsc -b` + 변경 파일 lint + `npm run verify:user-smlt`. Java 는 여기서 컴파일 불가.

**사용자에게 확인할 것**: 꺼진 터미널을 CAST 리소스(FS · CA · SBD · 출국장 · 보안검색)에서도 완전히 빼는 것이 맞는가?

---

## 2. 한 터미널 운항편 0편일 때 예외

### 현재 동작

`CastUserSmltServiceImpl.resolveTerminal`:

```java
if (flt.getFltCnt() == 0)
    throw new IllegalStateException(terminal.getValue() + " " + ymd + " 운항 운영자료가 없습니다.");

if (!executionService.hasCurrentConditions(chknQuery, "CHKN") && chkn.getIslandList()...noneMatch(배정 있음))
    throw new IllegalStateException(terminal.getValue() + " 체크인 운영자료가 없습니다.");

if (!executionService.hasCurrentConditions(depQuery, "DEP") && dep.getDptgtList()...noneMatch(운영시간 있음))
    throw new IllegalStateException(terminal.getValue() + " 출국장 운영자료가 없습니다.");
```

- 터미널마다 검사하므로 한쪽만 0편이어도 실행 전체가 롤백된다.
- 운항편이 없는 날은 체크인 배정도 비었을 가능성이 커서, 운항편 검사만 고쳐도 체크인 검사에서 다시 막힐 수 있다.

### 제안 (미확정)

- `resolveTerminal` 은 검사 없이 조건만 모으고, `executeUserSmlt` 에서 대상 터미널의 `fltCnt` 합이 0 이면
  "T1 · T2 모두 운항 운영자료가 없습니다" 예외를 던진다.
- 운항편 0편인 터미널은 체크인 · 출국장 운영자료 검사도 건너뛴다. 운항편이 있는 터미널은 기존 검사를 유지한다.
- 1번과 같이 진행하면 '대상 터미널' = 선택 터미널, 아니면 T1 · T2.
- `npm run verify:user-smlt` 목업(`api/pm/mock/userSmlt.mock.ts` `execute`)에 같은 규칙이 있는지 확인하고 맞춘다.

---

## 3. 기준일자(`TN_PM_SMLT_DALY_CRTR_YMD`) 일관성

### 확인 결과 — 일관됨

- `CastApiServiceImpl.resolveBaseYmd()` → `CastApiMapper.selectBaseYmdForCalibration`
  (`USE_YN = 'Y'` 최대 `CRTR_YMD`, 없으면 당일). `REQ_GetResourceInformation` · `REQ_GetResource` 진입 시 DTO `baseYmd` 에 넣는다.
- 일일 리소스가 모두 그 `baseYmd` 하나를 읽는다:

| 리소스 | 날짜 바인딩 |
|---|---|
| 리소스 목록 FS001 · CA001 · SBD001 존재 여부 | `#{baseYmd}` |
| FS001 `retrieveFlightSchedule` | `fsYmd = baseYmd`, 운항편 필터용 체크인 배정 `alotYmd = fsYmd` |
| CA001 `retrieveCounterAllocation` | `alotYmd = baseYmd` |
| 환승 체크인 `transferCheckinRows` (CA001) | `#{baseYmd}` |
| SBD001 · 키오스크 | `#{baseYmd}` |
| 출국장 · 입국심사 · 환승보안 운영표 `dplOperHrRows` | `NVL(SCHDL_ATRB 001 그룹 일자, #{baseYmd})` |
| 결과 수신 `STNG.EXCN_YMD` (일일) | `CastSetResourceHandler` 가 `resolveBaseYmd` 호출 |

- 매퍼 전체에서 `SYSDATE` 는 `lastModified` 표기 · 첨부 ID 채번 · 기준일자 fallback 에만 쓴다.
  Java 의 `LocalDateTime.now()` 도 `CastResourceRenderer` 의 `lastModified` 용뿐이다.
- 사용자 실행은 의도대로 요청 일자(`excnYmd`)를 일관되게 쓴다(FS · CA · SBD · 키오스크 · 출국장 · 환승 체크인 모두
  해당 FS 그룹 일자 또는 `excnYmd`).

### 참고 위험 (코드 결함 아님)

- **기준일자를 리소스 요청마다 따로 읽는다.** CAST 가 FS001 → CA001 을 가져가는 사이 또는 결과 수신 전에
  기준일자 행을 바꾸면 리소스 · 결과 일자가 갈린다. 실행 단위로 일자를 고정하는 장치는 없다.
- 사용자 실행이 참조하는 `Immigration001` · `TransferSecurityControl001` 운영시간 기간은 요청 일자가 아니라
  기준일자로 고른다(AGENTS.md §11.3 에 기록된 알려진 차이).
- `dplOperHrRows` 는 `TN_PM_SMLT_SCHDL_ATRB` 의 `001` 그룹 행이 있으면 그 일자를 우선한다. 현재 채우는 주체는 없지만
  행이 생기면 기준일자 대신 그 일자를 쓰고, 일자가 여럿이면 서브쿼리 다중 행 오류가 난다.

---

## 다음 세션 진행 순서

1. 1번 범위(CAST 리소스에서도 완전 제외 여부)를 사용자에게 확인한다.
2. 2번을 먼저 고친다(서버 `CastUserSmltServiceImpl` + 목업). 1번과 독립적으로 진행 가능하다.
3. 1번을 확정 범위대로 고치고 AGENTS.md §3 · §11.1 을 갱신한다.
4. 검증: `cd react && npx tsc -b`, 변경 파일 eslint, `npm run verify:user-smlt`. Java 는 실제 백엔드에서 빌드 · 실연계 확인.
