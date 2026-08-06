# 3단계 — API 구현 파트1 (조회)

## 1. 작업 개요

리뉴얼된 3탭 화면을 채우는 **모든 `retrieve` API** 를 구현한다. 코딩표준은 `java/cast` 폴더의 실제 코드를 그대로 따른다 — 이 폴더는 **컨벤션의 기준**이며, 새 코드는 여기 있는 파일들과 구분이 가지 않아야 한다.

파트2(저장·실행)가 올라탈 **공통 기반**(DTO 체계 · enum · 매퍼 · 집계 유틸)도 이 단계에서 만든다. 파트2 는 새로 만들지 않고 여기서 만든 것을 확장한다.

> `java/` 는 빌드 파일 없는 소스 덤프다. 실제 프로젝트 경로는 `src/main/java/aoms/pm/cast/...`, XML 은 `src/main/resources/.../mapper/`. 이 레포에서는 기존 폴더 구조(`java/cast/{controller,service,service/impl,mapper,dto,enums,domains}`, `java/cast-db/`, `java/mapper/`)를 그대로 따른다.

## 2. 선행 산출물

| 산출물 | 출처 | 용도 |
|---|---|---|
| `react/src/api/pm/API_SPEC-DELTA.md` | 1단계 | 구현할 조회 API 의 응답 필드 정의 |
| 개편된 `react/src/modules/pm/pages/userSmlt/**` | 1단계 | 화면이 실제로 쓰는 형태 확인 |
| `docs/db/DB-ANALYSIS.md` | 2단계 | 테이블 카탈로그 · 화면↔테이블 매핑표 · 갭 목록 |

**2단계 갭 목록의 G2(터미널 코드)와 G7(시간대별 데이터 소스)은 이 단계에서 결론을 내야 한다.** 5.5 참조.

## 3. 읽어야 할 파일

### 컨벤션 기준 (반드시 먼저 읽을 것)

| 파일 | 볼 것 |
|---|---|
| `java/cast/controller/CastChknController.java` | **컨트롤러 정본.** 40줄, 이 형태를 그대로 복제한다 |
| `java/cast/service/CastChknService.java` + `service/impl/CastChknServiceImpl.java` | 서비스 인터페이스/구현 쌍의 정본 |
| `java/cast/mapper/CastChknMapper.java` | 매퍼 인터페이스 정본. **`@Mapper` 임포트 경로 주의** |
| `java/cast-db/CastChknMapper.xml` | XML 정본. 트레이스 주석 · 동적 SQL 관용구 |
| `java/cast/service/impl/CastSmltServiceImpl.java` | 395줄. 공용 기반 서비스 + 스트림 그룹핑 스타일 |
| `java/cast/domains/AggData.java` · `AggBuffer.java` | **재사용할 집계 기반 클래스.** 새로 만들지 말 것 |
| `java/cast/dto/JsonResponse.java` | 응답 래퍼 겸 에러 표현의 기반 |
| `java/cast/dto/ChknRsltDto.java` · `ChknSearchDto.java` · `ChknRawDto.java` | DTO 접미 체계와 `withXxx()` 플루언트 패턴 |
| `java/cast/enums/CongestionStatus.java` | enum 템플릿 (`@JsonValue`) |

### 계약

| 파일 | 볼 것 |
|---|---|
| `react/src/api/pm/API_SPEC.md` | 1장 공통 규약, 6장 사용자 시뮬레이션 |
| `react/src/api/pm/API_SPEC-DELTA.md` | 1단계 산출물 — 신규/변경 계약 |
| `react/src/types/api.types.ts` | 프론트 타입 정의 |
| `react/src/api/pm/endpoints.ts` | 프론트가 호출하는 실제 경로 |

## 4. 작업 범위

### 할 것 — 조회만

**공통 기반**

- DTO 체계 (`Search` / `Rslt` / `Raw` / `Smry` 접미)
- enum (`@JsonValue` 템플릿)
- `AggData` / `AggBuffer<T>` **재사용** (신규 집계 타입은 `AggData` 를 상속)
- 4개 impl 에 복붙되어 있는 **24시간 버킷 루프를 공통 유틸로 추출**
- 터미널 코드 변환 지점 확정 (G2)

**체크인 카운터 탭**

- 블럭 차트 — 시간대별 · 아일랜드별 운영 부스 수
- 대기인원 꺾은선 — 시간대별 대기인원수
- 드로어 조회 — 부스별 항공사 배정(+ Custom 여부), 운영시간 구간, 키오스크/백드롭 대수

**출국장 탭**

- 출국장 블럭 차트 — 시간대별 운영 상태
- 보안검색대 보조 블럭 차트 — 시간대별 검색대 대수
- 드로어 조회 — 사용/미사용, 운영시간 타임바, 검색대 구성(일반/스마트패스/보안검색대), 구간표

**운항편/여객수 탭**

- 요약(운항편·여객·피크시간), 막대 차트 2종, 시간대별 목록

### 하지 말 것

- **`save` / `execute` 계열 금지** — 4단계 범위
- `@Transactional` 금지 — 조회 서비스에는 붙이지 않는다 (현행 코드 관행)
- 별도 `ApiResponse<T>` / `ResultVO` 래퍼 클래스 신설 금지 — `ResponseUtils.res()` 만 쓴다
- `@ExceptionHandler` / `@RestControllerAdvice` 신설 금지 — 현행 코드에 전무하다
- `@Valid` / Bean Validation 도입 금지 — 현행 코드에 전무하다
- 로깅 프레임워크 도입 금지 — `java/cast` 전체에 로그 호출이 하나도 없다
- JPA / QueryDSL 도입 금지 — MyBatis XML 만
- 기존 4개 화면(대시보드/맵/모니터링)의 API 변경 금지

## 5. 상세 지시

### 5.1 컨트롤러 — 이 형태를 그대로 복제

`java/cast/controller/CastChknController.java` 정본:

```java
@RestController
@RequestMapping("/cast/chkn")
@RequiredArgsConstructor
public class CastChknController {
	private final CastChknService castChknService;

	@PostMapping(value = "/retrieveChknGroupByTime")
	public ResponseEntity<Map<String, List<ChknRsltDto>>> retrieveChknGroupByTime(@RequestBody ChknSearchDto searchDto) {
		return ResponseUtils.res(castChknService.retrieveChknGroupByTime(searchDto.getSmltId(), searchDto.getTmnlId(), searchDto.getIsland()));
	}
}
```

규칙:

- `@RestController` + 클래스 레벨 `@RequestMapping("/cast/{도메인}")` + `@RequiredArgsConstructor`
- 의존성은 `private final` **생성자 주입**. **`@Autowired` 금지** (레포 전체에 한 번도 없음)
- **조회도 전부 `@PostMapping`.** 항상 `@PostMapping(value = "...")` 형태로 쓰고 축약형 `@PostMapping("...")` 을 쓰지 않는다
- 요청은 **단일 `@RequestBody XxxSearchDto`**. `@RequestParam` / `@PathVariable` / 쿼리스트링 금지
- **URL 세그먼트 == 자바 메서드명 == 서비스 메서드명.** 동사는 `retrieve` / `save` / `execute` 세 개만
- 반환은 `ResponseEntity<T>` (T = 원시 페이로드: `List<Dto>`, `Map<String, List<Dto>>`, `String`, `Boolean`). 래핑은 `ResponseUtils.res(payload)` 하나로 끝
- 컨트롤러는 얇게. 서비스 시그니처가 원시 타입이면 `searchDto.getXxx()` 로 풀어서 넘기고, DTO 를 받으면 통째로 넘긴다 (둘 다 현행 관행)
- 컨트롤러에는 try/catch 를 두지 않는다

### 5.2 서비스

- 인터페이스 `service/CastXxxService.java` + 구현 `service/impl/CastXxxServiceImpl.java`
- `@Service` + `@RequiredArgsConstructor`, 모든 구현 메서드에 `@Override`
- 자기 매퍼 + **다른 서비스의 인터페이스**를 주입한다. **구현체(`*Impl`) 주입 금지**
  - 예: `CastChknServiceImpl` 이 `CastSmltService` 를 주입해 `smltId`·혼잡등급을 해석
- `CastSmltService` 가 공용 기반 서비스다. 시뮬레이션 ID 해석, 혼잡등급 조회 같은 공통 로직은 여기에 둔다
- **조회 서비스에 `@Transactional` 을 붙이지 않는다.** `readOnly = true` 도 쓰지 않는다 (현행 관행)
- 비즈니스 로직은 Java 8 스트림. `Collectors.groupingBy` 로 복합 키를 `"|"` 로 이어 묶고 `split("\\|")` 로 되푸는 관용구를 따른다:

```java
Map<String, List<ChknRsltDto>> groupedByDomain = smltChknList.stream()
        .collect(Collectors.groupingBy(x -> x.getAlnCd() + "|" + x.getCounterNum()));
```

- 공개 메서드는 `private` 헬퍼(`getXxxDatas(...)` / `xxxGrouping(...)`)로 분해한다

### 5.3 매퍼

```java
import org.apache.ibatis.annotations.Param;
import org.egovframe.rte.psl.dataaccess.mapper.Mapper;   // ★ MyBatis 것이 아님

@Mapper
public interface CastChknMapper {
	List<ChknRsltDto> retrieveSmltChknList(
		@Param("smltId") String smltId, @Param("ymd") String ymd,
		@Param("tmnlId") String tmnlId, @Param("island") String island
	);
}
```

- **`@Mapper` 는 반드시 `org.egovframe.rte.psl.dataaccess.mapper.Mapper`.** `org.apache.ibatis.annotations.Mapper` 를 쓰면 안 된다 (레포 7개 매퍼 전부 eGov 것)
- 인터페이스만. `@Select` / `@Insert` 등 어노테이션 SQL 금지 — SQL 은 전부 XML
- 파라미터: 스칼라 여러 개면 각각 `@Param`, DTO 하나면 어노테이션 없음
- `IN` 절용 `List<String>` 은 `@Param` 이름을 붙이고 XML `<foreach>` 로 받는다
- 메서드명: `retrieveXxxList`(목록) / `retrieveXxxByKey`(단건) / `insert·update·deleteXxx`

### 5.4 MyBatis XML

- 위치: `java/cast-db/CastXxxMapper.xml` (+ `java/mapper/` 에 동일 사본 유지 — 기존 5개가 그렇게 되어 있다. 단, `CastRestMapper.xml` 은 `cast-db` 에만 있다)
- 헤더 고정:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN" "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="aoms.pm.cast.mapper.CastChknMapper">
```

- `namespace` = 매퍼 인터페이스 FQCN
- **모든 statement 의 첫 줄에 트레이스 주석**: `/* CastChknMapper.retrieveSmltChknList */`
- `resultType` 은 항상 FQCN. `parameterType` 은 DTO/`HashMap`/`String` 을 단일 객체로 넘길 때만
- **`<resultMap>` 만들지 말 것.** `map-underscore-to-camel-case` + SELECT 별칭으로 매핑한다 (`A.AVG_PRCS_HR as PRCS_HR`)
- 동적 SQL 은 `WHERE 1 = 1` + `<if test="x != null and x != ''"> AND COL = #{x}</if>`. **`<where>` / `<trim>` / `<choose>` 쓰지 않는다**
- `IN` 은 `<foreach collection="..." item="item" separator=",">`
- LIKE 는 `LIKE #{dt} || '%'`
- **항상 `#{}`. `${}` 절대 금지**
- SQL 키워드 대문자, 테이블 별칭 `A` / `B` / `C`, 한국어 설명 주석 허용
- `<` `>` 가 들어갈 때만 `<![CDATA[ ]]>`

### 5.5 이 단계에서 결론 낼 것

**G2 — 터미널 코드 변환**

Java 는 `P01`/`P02`/`P03`, React 는 `T1`/`T2` 를 쓴다. **변환은 한 곳에서만** 한다. 권장: `SearchDto` 진입부(setter 또는 컨트롤러 첫 줄)에서 `T1`/`T2` → `P0x` 로 바꾸고, 서비스 이하는 DB 코드계만 다룬다. 응답 시 역변환. 2단계 문서에서 `P01`~`P03` 각각의 의미를 확인하고, 확인 안 되면 **매핑 결정을 문서에 적고 진행**한다.

**G7 — 시간대별 부스 수 / 검색대 대수의 데이터 소스**

블럭 차트가 요구하는 시간대별 수량을 담을 테이블이 2단계에서 확인되지 않았다면, 여기서 셋 중 하나를 택하고 근거를 남긴다:

1. 기존 배정 테이블(`TI_GO_CKNCT_DALY_ALOT` 등)의 운영시간 구간을 시간대로 펼쳐 계산
2. 시뮬레이션 결과 상세(`TN_PM_SMLT_RSLT_DTL`)에서 유도
3. 신규 테이블 필요 — DDL 초안을 문서로 제출하고 별도 승인

### 5.6 참조 소스의 알려진 결함 — 복제하지 말 것

`java/cast` 는 컨벤션의 기준이지만 아래 버그까지 따라 하면 안 된다.

| 파일 | 문제 |
|---|---|
| `service/impl/CastSlfchknServiceImpl.java` | 헤더 Javadoc 이 `@Classname : CastChknServiceImpl.java` / `@Description : 체크인카운터` 로 복붙 오기 |
| `enums/PrcsGrdType.java` | 주석 뒤바뀜 — `SLFCHKN` 에 `// 체크인`, `CHKN` 에 `// 셀프체크인` |
| `service/impl/CastSmltServiceImpl.java` `depGrouping()` | T2 분기(`tmnlId.equals("P03")`)에서 `item.setTime(...)` 누락 → `time == null` |
| 〃 `chknGrouping()` | `item.setOperCnt(10)` 하드코딩 |
| 〃 `depGrouping()` / `scGrouping()` | `CongestionStatus.BUSY` · `setOper(true)` 하드코딩 — `prcsGrdMap` 에서 유도해야 함 |
| 〃 `retrieveSmltStngByKey` | `...retrieveSmltStng(...).get(0)` 빈 목록 체크 없음. `retrieveRecentSmltId` 는 미스 시 `"-1"` 센티널을 반환하고 그게 `.get(0)` 로 흘러감 |
| `dto/SmryDepDto.java` | `boolean isOper` — Lombok 이 `oper` 로 직렬화. 명명 규칙 불일치 |
| Chkn / Dep / Slfchkn / Smlt `ServiceImpl` | **24시간 버킷 루프가 4개 파일에 그대로 복붙**되어 있다 |

마지막 항목은 이번에 **공통 유틸로 추출**한다. 현행 형태:

```java
for (int h = 0; h < 24; h++) {
    String hour = String.format("%02d", h);
    String tm00 = hour + "00";
    result.put(tm00, aggregate.stream().filter(x -> x.getTime().equals(tm00)).collect(toList()));
    String tm30 = hour + "30";
    result.put(tm30, aggregate.stream().filter(x -> x.getTime().equals(tm30)).collect(toList()));
}
```

`TreeMap<String, List<T extends AggData>>` 를 반환하는 제네릭 유틸로 뽑고, 기존 4개 impl(`CastChknServiceImpl` · `CastDepServiceImpl` · `CastSlfchknServiceImpl` · `CastSmltServiceImpl`) 도 그것을 쓰도록 정리한다.

### 5.7 enum 템플릿

```java
public enum CongestionStatus {
	FREE("FREE"), NORMAL("NORMAL"), BUSY("BUSY"), VERY_BUSY("VERY_BUSY");

	private final String value;
	CongestionStatus(String value) { this.value = value; }

	@JsonValue
	public String getValue() { return value; }
}
```

- 상수명 == 문자열 값, `private final String value`, 패키지 전용 생성자, `@JsonValue` 게터
- 필요하면 `static List<X> getList()` 추가
- enum 은 DTO 필드 타입과 `Map` 키로 직접 쓴다
- 비교는 현행 코드가 `enum.equals(...)` 를 쓴다. 새 코드에서는 `==` 또는 `switch` 를 써도 되나 한 파일 안에서 섞지 말 것

## 6. 지켜야 할 규칙

### DTO

- `@Getter @Setter` 가변 POJO + 기본 생성자 (서비스가 `new XxxDto()` 후 setter)
- **`record` / `@Data` / `@Builder` / `@NoArgsConstructor` 금지** — 현행 코드에 없다
- 필드는 Oracle 스네이크 컬럼의 camelCase 미러 (`WTNG_PSG_CNT` → `wtngPsgCnt`)
- 단위·의미는 **한국어 줄끝 주석**: `private int wtngPsgCnt; // 대기인원`
- 접미 체계: `...SearchDto`(요청) / `...RsltDto`(집계 결과) / `...RawDto`(집계 전 원시행) / `Smry...Dto`(화면용 뷰모델) / 접미 없음(값 객체)
- 최상위 응답 DTO만 `JsonResponse` 를 상속하고 `private static final long serialVersionUID = 1L;` 을 재선언. 중첩/목록 원소 DTO 는 상속하지 않는다
- 스트림 데코레이션용 플루언트 메서드 — `this` 를 변경하고 `this` 를 반환 (불변 wither 아님):

```java
public ChknRsltDto withAlnCd(String alnCd) { this.alnCd = alnCd; return this; }
```

- 새 집계 타입은 `domains/AggData` 를 상속 (`time` / `wtngPsgCnt` / `prcsHr` / `wtngHr` 공용)
- 직렬화 불가한 중첩 필드는 `transient` (예: `SmltSmryDto.summaryFlight`)

### 파일 헤더

`service` / `service.impl` / `mapper` 파일에는 아래 템플릿을 붙인다. **`controller` / `dto` / `enums` / `domains` 에는 붙이지 않는다** (현행 관행 그대로).

```java
/**
 * @Classname   : CastChknServiceImpl.java
 * @Description : 체크인카운터 ServiceImpl
 *
 * @Copyright (c) 인천국제공항 통합정보시스템 아시아나IDT 컨소시엄 All right reserved.
 * <pre>
 *------------------------------------------------------------------------------
 * Modification Information
 *------------------------------------------------------------------------------
 * 수정일 / 수정자 /수정내용
 * ----------  ------  ---------------------------------------------------------
 * YYYY. MM. DD / 작성자 / 최초작성
 *------------------------------------------------------------------------------
 * </pre>
 */
```

`@Classname` 과 `@Description` 을 **파일에 맞게 고쳐 쓴다** (복붙 오기가 현행 코드의 실제 결함이다).

### 포맷

- 들여쓰기 **탭**
- 임포트 순서 `java.*` → `org.*` → `aoms.*` → `lombok.*`, 그룹 사이 빈 줄. **Lombok 은 항상 맨 끝에 분리**
- 와일드카드 임포트 금지
- 메서드 레벨 Javadoc 없음 (현행 관행)
- 상수는 `private static final` UPPER_SNAKE 로 통일 (현행은 혼재되어 있으나 새 코드는 통일)

## 7. 산출물

**신규 / 수정** — `java/cast/` 아래

- `controller/` — 리뉴얼 3탭용 컨트롤러 (기존 도메인 확장 또는 신규)
- `service/` + `service/impl/` — 대응 서비스 쌍
- `mapper/` — 매퍼 인터페이스
- `dto/` — Search / Rslt / Raw / Smry DTO
- `enums/` — 신규 enum (필요 시)
- 24시간 버킷 공통 유틸 (위치는 기존 `aoms.pm.utils` 관행에 맞춰 결정하고 문서에 명시)

**신규 / 수정** — `java/cast-db/` (+ `java/mapper/` 사본)

- 조회용 XML statement

**문서**

- `react/src/api/pm/API_SPEC.md` — 구현된 조회 API 를 반영 (`API_SPEC-DELTA.md` 의 조회 부분 병합)
- G2 / G7 결정 사항 기록 (`docs/db/DB-ANALYSIS.md` 갱신 또는 별도 결정 로그)

**4단계로 넘기는 것**: DTO · enum · 매퍼 인터페이스 · 공통 유틸 · 터미널 코드 변환 지점

## 8. 완료 조건

- [ ] 리뉴얼 3탭의 모든 조회 요소에 대응하는 엔드포인트가 존재한다
- [ ] 모든 엔드포인트가 `@PostMapping(value = "...")` + 단일 `@RequestBody` + `ResponseUtils.res()` 형태다
- [ ] 모든 매퍼가 `org.egovframe.rte.psl.dataaccess.mapper.Mapper` 를 임포트한다
- [ ] 모든 XML statement 에 `/* XxxMapper.methodName */` 트레이스 주석이 있다
- [ ] `<resultMap>` · `${}` · `<where>` / `<trim>` 이 하나도 없다
- [ ] service / impl / mapper 파일에 헤더 Javadoc 이 있고 `@Classname`·`@Description` 이 파일과 일치한다
- [ ] 24시간 버킷 루프가 공통 유틸로 추출되고 기존 4개 impl 도 그것을 쓴다
- [ ] 터미널 코드 변환이 **한 곳에서만** 일어난다
- [ ] 경로·필드명이 `API_SPEC.md` / `endpoints.ts` / `api.types.ts` 와 일치한다
- [ ] 조회 서비스에 `@Transactional` 이 붙어 있지 않다
- [ ] 5.6 의 결함이 새 코드에 복제되지 않았다
