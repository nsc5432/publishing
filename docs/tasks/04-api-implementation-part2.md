# 4단계 — API 구현 파트2 (저장 · 실행)

## 1. 작업 개요

3단계에서 만든 조회 기반 위에 **`save` / `execute` 계열**을 올린다. 사용자가 리뉴얼 3탭에서 편집한 조건을 저장하고, 저장된 조건으로 시뮬레이션 수행을 거는 것까지가 범위다.

쓰기 계층에는 조회에 없던 규칙이 붙는다 — **트랜잭션**, **세션 사용자 컨텍스트**, **감사 컬럼**, 그리고 **CAST 엔진 연동**. 이 네 가지가 이 문서의 본론이다.

**3단계에서 만든 DTO · enum · 매퍼 · 공통 유틸을 그대로 확장한다. 같은 것을 새로 만들지 않는다.**

## 2. 선행 산출물

| 산출물 | 출처 | 용도 |
|---|---|---|
| `java/cast/**` 조회 계층 | 3단계 | DTO · enum · 매퍼 인터페이스 · 공통 유틸 — **확장 대상** |
| 터미널 코드 변환 지점 결정 | 3단계 | 쓰기 경로에도 동일 적용 |
| `docs/db/DB-ANALYSIS.md` | 2단계 | 저장 대상 테이블 · 감사 컬럼 · 시퀀스 |
| `react/src/api/pm/API_SPEC-DELTA.md` | 1단계 | 저장 요청 페이로드 정의 |

**3단계가 끝나지 않았다면 시작하지 않는다.** 이 단계는 조회 계층 위에 얹는 작업이다.

## 3. 읽어야 할 파일

### 쓰기 컨벤션 기준

| 파일 | 볼 것 |
|---|---|
| `java/cast/service/impl/FcltServiceImpl.java` | **쓰기 서비스 정본.** 클래스 레벨 `@Transactional` + `SessionUtils.setUserContext` |
| `java/cast/controller/FcltController.java` | void 성 쓰기의 응답 — `return ResponseUtils.res(true);` |
| `java/cast/controller/UserController.java` | **레포에서 유일한 에러 처리 경로.** `JsonResponse` 로 payload 내 에러 표현 |
| `java/cast/dto/JsonResponse.java` | `error(String)` 플루언트 메서드 |
| `java/cast/service/impl/UserServiceImpl.java` | 세션 기반 서비스의 트랜잭션 처리 |

### CAST 엔진 연동

| 파일 | 볼 것 |
|---|---|
| `java/cast-db/CastRestMapper.xml` | 2254줄 / 44 statement. namespace `aoms.pm.castrest.mapper.CastRestMapper` |
| 〃 `insertSimRunStat` (L4) · `insertSimSet` (L1570) · `insertSimResultDtl` (L1637) | **INSERT 감사 컬럼 관용구의 정본** |
| 〃 `retrieveFlightSchedule` (L226) · `retrieveCounterAllocation` (L867) · `retrieveFcltyOpngTblDptg` (L1938) · `retrieveWhatIfCntrl` (L2208) | CAST 리소스 발행 쿼리. `LISTAGG` 평탄화 |
| 〃 `updateSimResultDtl` (L1762) · `retrieveSimSetByPk` (L1747) | **알려진 SQL 버그** — 5.5 참조 |

### 계약

| 파일 | 볼 것 |
|---|---|
| `react/src/api/pm/API_SPEC.md` | 6.2~6.8 저장·실행 규약 |
| `react/src/api/pm/API_SPEC-DELTA.md` | 리뉴얼로 바뀐 저장 페이로드 |
| `docs/db/DB-ANALYSIS.md` | 감사 컬럼 6종 · 시퀀스 `SQ1_*` · 갭 G3/G4/G8 |

## 4. 작업 범위

### 할 것

**저장**

- 체크인 카운터 — 부스별 항공사 배정(+ Custom), 운영시간 구간, 셀프체크인/백드롭 대수
- 출국장 — 사용/미사용, 운영시간 타임바, 검색대 구성(일반/스마트패스/보안검색대), 구간표
- 운항편/여객수 — `adjType` = `RATIO`(전체 비율) / `HOURLY`(시간대별)

**실행**

- `executeUserSmlt` — 저장된 조건으로 수행 시작. **비동기로 시작만** 걸고 진행 상황은 모니터링 화면에서 확인
- 수행 이력 기록

**연동**

- CAST 엔진 리소스 발행 호출 지점 확보 (구현 범위는 5.5 참조)

### 하지 말 것

- **새 DTO / enum / 매퍼를 처음부터 만들지 말 것** — 3단계 산출물을 확장한다
- `@ExceptionHandler` / `@RestControllerAdvice` 신설 금지 — 에러는 `JsonResponse` payload 로 표현한다 (현행 관행)
- `@Valid` / Bean Validation 도입 금지 — 검증은 서비스 안에서 명시적으로
- 3단계에서 만든 조회 API 의 시그니처 변경 금지
- `CastRestMapper.xml` 의 기존 44개 statement 를 임의로 수정 금지 — 버그도 **기록만** 하고 필요 시 별도 승인 후 수정
- 기존 4개 화면(대시보드/맵/모니터링)의 API 변경 금지

## 5. 상세 지시

### 5.1 트랜잭션

```java
@Service
@RequiredArgsConstructor
@Transactional(rollbackFor = Exception.class)
public class CastXxxServiceImpl implements CastXxxService {
```

- **클래스 레벨**에 `@Transactional(rollbackFor = Exception.class)`. 현행 `FcltServiceImpl` / `UserServiceImpl` 방식 그대로
- 메서드 레벨 `@Transactional` 을 쓰지 않는다
- `readOnly = true` 를 쓰지 않는다
- **조회 전용 서비스에는 여전히 붙이지 않는다** — 쓰기가 있는 서비스에만

### 5.2 세션 사용자 컨텍스트 + 감사 컬럼

저장 직전에 로그인 사용자·IP 를 DTO 에 찍는다.

```java
SessionUtils.setUserContext(dto, sessionService);
```

`AomsDefaultDto` 를 상속한 DTO 라면 이 한 줄로 감사 컬럼 값이 채워진다. 로그인 확인이 필요하면 `UserController` 패턴을 따른다:

```java
if (dto.getLoginUserId() == null) {
    return ResponseUtils.res(new UserDto().error("로그인을 진행해주세요."));
}
```

**INSERT 시 감사 컬럼 관용구** (`CastRestMapper.xml` 정본):

```sql
INSERT INTO PMOWN.TN_PM_XXX (
    ...,
    FRST_RGTR_ID, FRST_RGTR_IP_ADDR, FRST_REG_DT
) VALUES (
    ...,
    'CAST', #{loginIpAddr}, CURRENT_TIMESTAMP
)
```

- 등록자 ID 는 CAST 엔진이 쓰는 행이면 `'CAST'`, 사용자 조작이면 `#{loginUserId}` 를 쓴다. **어느 쪽인지 저장 API 별로 명시적으로 정하고 문서에 남긴다**
- UPDATE 시에는 `LAST_MDFR_ID`, `LAST_MDFR_IP_ADDR`, `LAST_MDFCN_DT = CURRENT_TIMESTAMP` 를 함께 갱신
- 감사 컬럼 6종 전체 목록은 `docs/db/DB-ANALYSIS.md` 5.2 참조

**일련번호 채번** — 두 가지 관행이 공존한다. 대상 테이블에 시퀀스가 있으면 ①, 없으면 ②.

```sql
-- ① 시퀀스
PMOWN.SQ1_TN_PM_SMLT_RSLT.NEXTVAL

-- ② MAX + 1 (스코프 안에서 증가하는 SN)
(SELECT NVL(MAX(SMLT_SN), 0) + 1 FROM PMOWN.TN_PM_XXX WHERE SMLT_ID = #{smltId})
```

②는 동시성 취약점이 있다. 트랜잭션 격리 수준에 의존하므로, 채택 시 그 사실을 주석으로 남긴다.

### 5.3 저장 전략 — 반드시 명시적으로 결정

편집 화면의 저장은 대부분 **부분 수정이 아니라 묶음 교체**다. 예를 들어 출국장 구간표는 화면에서 행을 추가·삭제한 결과를 **선택한 출국장 1곳분 전체**로 보낸다 (`API_SPEC.md` 6.6).

각 저장 API 마다 아래 중 하나를 **택하고 문서에 적는다**:

| 전략 | 적합한 경우 | 주의 |
|---|---|---|
| **전체 교체** (delete-then-insert) | 구간표, 부스 배정처럼 행 집합 전체가 오는 경우 | 삭제 범위를 `WHERE` 로 정확히 한정. `smltId` + `tmnlId` + 대상 키까지 |
| **병합** (merge / update-or-insert) | 단일 행 설정값 | 감사 컬럼 갱신 누락 주의 |

전체 교체를 쓸 때는 **`DELETE` 범위가 저장 대상보다 넓지 않은지** 반드시 확인한다. 여기서 실수하면 다른 터미널·다른 아일랜드 데이터가 지워진다.

### 5.4 응답 규약

- void 성 쓰기: `return ResponseUtils.res(true);` (`Boolean` 반환)
- 실패는 예외를 던지지 않고 **payload 안에서** 표현한다:

```java
return ResponseUtils.res(new XxxDto().error("저장에 실패했습니다."));
```

- `JsonResponse` 를 상속한 최상위 응답 DTO 만 `error(...)` 를 갖는다
- HTTP 상태 코드로 실패를 알리는 것은 프레임워크 기본 동작에 맡긴다. `client.ts` 인터셉터가 `ApiError { status, message, code }` 로 정규화한다
- `executeUserSmlt` 응답: `smltId`, `execSn`(수행 일련번호), `execStatus`, `bgnDt`

### 5.5 CAST 엔진 연동

`CastRestMapper.xml` (namespace `aoms.pm.castrest.mapper.CastRestMapper`) 이 저장된 조건을 CAST 시뮬레이션 엔진의 **리소스**로 발행하는 계층이다. 운항 스케줄, 카운터 배정, 셀프체크인/백드롭, 프로퍼티 셋, 모델, 시설 개방 테이블, what-if 정의를 내보내고 결과를 다시 받아들인다.

리소스 포맷의 핵심은 **`LISTAGG` 평탄화** — 결과셋을 컬럼별 콤마 연결 문자열로 만든다 (파일 전체에 119회).

**제약 (2단계 갭 G8)**

`CastRestMapper.xml` 이 참조하는 DTO 들 — `aoms.pm.cmmn.dto.CastReqGetResourceDto`, `CastResReqDto`, `SimRunStatDto`, `SmltRsltDtlDto`, `PmAtchFileDto`, `CastWhatIfCntrlDto` 등 — **이 레포에 Java 소스가 없다.**

따라서 이 단계에서는:

- **연동 호출 지점(인터페이스와 호출 순서)만 확보**한다
- 실제 발행 구현은 원본 소스 확인 후 별도 진행
- 확인이 필요한 지점을 목록으로 남긴다

**알려진 SQL 버그** (2단계 G3 / G4) — 수정 여부를 이 단계에서 판단한다:

| 위치 | 문제 |
|---|---|
| `CastRestMapper.xml` L1762 `updateSimResultDtl` | L1764 `UPDATE INTO PMOWN.TN_PM_SMLT_RSLT_DTL SET` — Oracle 문법 오류. 같은 문에 `INT(...)` 사용 (Oracle 함수 아님) |
| `CastRestMapper.xml` L1747 `retrieveSimSetByPk` | L1749 `SELECT COUNT(SIM_ID) FROM PMOWN.TN_PM_SMLT_STNG` — 해당 테이블 컬럼은 `SMLT_ID` |

이 statement 들을 실제로 호출하게 된다면 **고쳐야 한다.** 호출하지 않는다면 기록만 남기고 손대지 않는다. 어느 쪽인지 판단해 문서에 적는다.

### 5.6 실행 흐름

`executeUserSmlt` 는 다음을 한다:

1. `smltId` + `tmnlId` 로 저장된 조건 존재 확인
2. 수행 이력 행 생성 (`TH_PM_SMLT_EXCN_LOG` 계열 — 2단계 카탈로그에서 확인)
3. CAST 리소스 발행 (5.5)
4. 수행 시작 트리거
5. `execSn` / `execStatus` / `bgnDt` 반환

**동기적으로 완료를 기다리지 않는다.** 진행 상황은 모니터링 화면(`retrieveSmltExecSmry` / `retrieveSmltExecList`)이 폴링한다.

이력 행이 생기면 기존 모니터링 화면에 그대로 나타나야 한다 — 즉 **모니터링이 읽는 테이블·컬럼과 같은 곳에 써야 한다.** 2단계 카탈로그에서 확인하고, 확인 안 되면 그 사실을 먼저 해결한다.

## 6. 지켜야 할 규칙

3단계의 컨벤션이 **그대로 적용된다**. 아래는 그중 쓰기에서 특히 자주 어긋나는 것들이다.

- 컨트롤러: `@PostMapping(value = "/saveXxx")`, 단일 `@RequestBody`, `ResponseUtils.res(...)`
- URL 세그먼트 == 자바 메서드명 == 서비스 메서드명. 동사는 `save` / `execute`
- `@Autowired` 금지 — `private final` 생성자 주입
- 매퍼 `@Mapper` 는 **`org.egovframe.rte.psl.dataaccess.mapper.Mapper`**
- XML statement 첫 줄에 트레이스 주석. `${}` 금지. `<resultMap>` 만들지 않음
- 벌크 INSERT 는 `<foreach item="dto" collection="list" separator=",">` 로 VALUES 목록 생성 (`insertSimResultDtl` 정본)
- DTO 는 `@Getter @Setter` + 기본 생성자. `record` / `@Data` / 빌더 금지
- service / impl / mapper 에 헤더 Javadoc, `@Classname`·`@Description` 은 파일에 맞게
- 들여쓰기 **탭**, 임포트 순서 `java.*` → `org.*` → `aoms.*` → `lombok.*`
- 로깅 없음 (현행 코드에 전무)

전체 목록은 [03-api-implementation-part1.md](03-api-implementation-part1.md) 5·6장 참조.

## 7. 산출물

**신규 / 수정** — `java/cast/`

- `controller/` — `saveXxx` / `executeUserSmlt` 엔드포인트
- `service/` + `service/impl/` — `@Transactional(rollbackFor = Exception.class)` 적용한 쓰기 서비스
- `mapper/` — `insert` / `update` / `delete` 메서드 추가 (3단계 인터페이스 확장)
- `dto/` — `...SaveReq` 성격의 요청 DTO (3단계 DTO 확장)

**신규 / 수정** — `java/cast-db/` (+ `java/mapper/` 사본)

- 저장용 XML statement (감사 컬럼 포함)

**문서**

- `react/src/api/pm/API_SPEC.md` — 저장·실행 API 반영, `API_SPEC-DELTA.md` 잔여분 병합 후 델타 파일 정리
- 저장 전략(전체 교체 / 병합) 결정 기록
- CAST 연동 미확인 지점 목록
- G3 / G4 SQL 버그 처리 결과

## 8. 완료 조건

- [ ] 3탭 각각의 `현재상태 저장` 이 동작한다
- [ ] **저장 → 재조회 왕복**: `smltId` 기준으로 다시 조회했을 때 저장한 값이 그대로 복원된다
- [ ] 저장된 행의 감사 컬럼 6종이 실제로 채워져 있다 (`FRST_RGTR_ID` / `FRST_RGTR_IP_ADDR` / `FRST_REG_DT` / `LAST_MDFR_*`)
- [ ] 전체 교체형 저장의 `DELETE` 범위가 대상 밖 데이터를 건드리지 않는다 (T1 저장이 T2 를 지우지 않음)
- [ ] `executeUserSmlt` 가 `execSn` / `execStatus` / `bgnDt` 를 반환한다
- [ ] 실행 후 모니터링 화면(`retrieveSmltExecList`)에 이력 행이 나타난다
- [ ] 쓰기 서비스에 클래스 레벨 `@Transactional(rollbackFor = Exception.class)` 이 있다
- [ ] 실패 시 `JsonResponse.error(...)` 로 사유가 내려온다
- [ ] 3단계 조회 API 의 시그니처가 변경되지 않았다
- [ ] CAST 연동 미확인 지점이 목록으로 남았고, G3 / G4 처리 방침이 기록되었다
