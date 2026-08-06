# PM 예측관리 — 4단계 작업 지시서

리뉴얼 시안을 실제 동작하는 화면 + API 로 만드는 작업을 4개 세션으로 나눈 지시서다.
**각 문서는 단독으로 읽고 착수할 수 있게 쓰여 있다.** 그날 해당 파일을 열어 그대로 요청하면 된다.

| # | 문서 | 작업 | 산출물 |
|---|---|---|---|
| 1 | [01-design-renewal-to-react.md](01-design-renewal-to-react.md) | 리뉴얼 시안 5장 → React 반영, 탭 5→3 통합 | `react/src/modules/pm/pages/userSmlt/**` 개편 + `API_SPEC-DELTA.md` |
| 2 | [02-database-analysis.md](02-database-analysis.md) | DDL·MyBatis XML 역공학 분석 (코드 작성 없음) | `docs/db/DB-ANALYSIS.md` |
| 3 | [03-api-implementation-part1.md](03-api-implementation-part1.md) | 공통 기반 + 전체 `retrieve` API | `java/cast/**` 조회 계층 |
| 4 | [04-api-implementation-part2.md](04-api-implementation-part2.md) | `save` · `execute` API + 트랜잭션 · CAST 연동 | `java/cast/**` 쓰기 계층 |

## 산출물 체인

앞 단계의 산출물이 뒷 단계의 입력이다. 순서를 바꾸면 뒤 단계가 입력 없이 시작된다.

```
01  리뉴얼 3탭 화면 확정
     └─ 화면이 필요로 하는 데이터 항목 (API_SPEC-DELTA.md)
          │
02        └─▶ 그 항목이 어느 테이블·컬럼에서 오는지 매핑
               └─ 테이블 카탈로그 + 화면↔테이블 매핑표 + 갭 목록
                    │
03                  └─▶ 조회 API 구현 (DTO/enum/Mapper 공통 기반 포함)
                         └─ 재사용 가능한 DTO·Mapper·유틸
                              │
04                            └─▶ 저장·실행 API 구현
```

## 공통 배경

- **제품**: 인천공항 여객/시설 예측 시뮬레이션 관리 콘솔. 데스크톱 전용, 한 화면 고정.
- **프론트**: `react/` — Vite 7 + React 19 + TypeScript. 상태관리 라이브러리 없음, 전역 CSS.
- **백엔드**: `java/` — eGovFrame 4 + Spring Boot + MyBatis + Oracle. **빌드 파일 없는 참조용 소스 덤프**이며, 코딩표준의 기준이다.
- **현재 상태**: React 화면은 `mock.ts` 로만 동작하고 API 미연동. Java 는 기존 4개 화면(대시보드/맵/사용자시뮬레이션/모니터링) 일부만 구현.

## 문서 구조 (4개 공통)

모든 지시서는 같은 순서의 8개 섹션을 갖는다.

1. 작업 개요 → 2. 선행 산출물 → 3. 읽어야 할 파일 → 4. 작업 범위(할 것/하지 말 것)
→ 5. 상세 지시 → 6. 지켜야 할 규칙 → 7. 산출물 → 8. 완료 조건

## 진행 체크리스트

- [x] 1단계 — 디자인 리뉴얼 React 반영 → `react/src/api/pm/API_SPEC-DELTA.md`
- [x] 2단계 — 데이터베이스 구조 분석 → [`docs/db/DB-ANALYSIS.md`](../db/DB-ANALYSIS.md)
- [ ] 3단계 — API 구현 파트1 (조회)
- [ ] 4단계 — API 구현 파트2 (저장·실행)
