# Sparrow SAST 별도 Java 작업 폴더

기존 `java/` 참조 사본에 없는 취약점 대상 4개 파일을 넣고 수정하는 폴더다.
2026-11-13 Java 원본 4개 입고를 완료했다. 보안 조치는 아직 시작하지 않았다.

실제 백엔드의 `src/main/java/aoms/pm/` 아래 파일을 같은 하위 경로로 복사한다.

| 이 폴더 기준 입고 경로 | 진단 건수 | 조치 단계 |
|---|---:|---|
| `adtoper/controller/AdtOperHrMngController.java` | 34 | 10 · 11 · 12 |
| `adtoper/service/impl/AdtOperHrMngServiceImpl.java` | 1 | 9 |
| `bdpsgance/controller/BdpsgAnceInqController.java` | 10 | 10 · 11 · 12 |
| `castrest/service/impl/CastRestServiceImpl.java` | 10 | 2 · 3 · 4 · 8 |
| **합계** | **55** | |

패키지 선언 · 클래스명 · 기존 주석을 유지한다. 빈 Java 파일이나 대역 구현으로 원본을 대신하지 않는다.
입고한 파일은 [조치 계획](../docs/plans/2026-11-13-sparrow-sast-remediation.md)에 따라 직접 수정하고,
단계별 결과와 진행 상태를 계획 문서에 기록한다. 관련 계약 확인에 필요한 자료가 없으면 추가로 확보한다.

이 폴더는 독립 Java 빌드 환경이 아니다. 수정분은 실제 백엔드의 원래 경로에 반영한 뒤
빌드 · 동작 확인 · Sparrow 재진단을 수행한다.
