# 사용자 시뮬레이션 공통 실행 구조

계획: [2026-10-11-user-smlt-master-redesign.md](plans/2026-10-11-user-smlt-master-redesign.md).
이 문서는 저장소 구현과 적용 절차를 설명한다. 실제 백엔드 빌드, Oracle 실행 및 CAST 왕복은 별도 환경에서 검증해야 한다.

## API 계약 변경

모든 경로는 POST /pm/cast/user-smlt 아래다. 사용자 소유자는 서버 세션에서만 정한다.

| API | 요청 | 응답 / 동작 |
|---|---|---|
| retrieveUserSmltInfo | ymd, tmnlId | ymd, saveDt, 상태. 편집용 smltId 반환 제거 |
| retrieveFltPsgInfo / retrieveChknCounterInfo / retrieveDepInfo | ymd, tmnlId | 현재 사용자의 해당 날짜 조건. 저장이 없으면 운영자료 |
| 같은 조회의 공개 확정 조건 경로 | smltId, tmnlId | 해당 실행 당시 조건 JSON. 현재상태 소유자 필터 없음 |
| saveFltPsgInfo | ymd, tmnlId, ajmtRt | 세션 사용자 현재상태만 저장 |
| saveChknCounterInfo | ymd, tmnlId, islandList | 같은 범위 전체 교체 |
| saveDepInfo | ymd, tmnlId, dptgtList | 같은 범위 전체 교체 |
| executeUserSmlt | ymd, fltPsgList, chknList, depList | 새 smltId, smltReqId, RUNNING, 빈 실제 시작 시각 |

저장 요청의 smltId와 실행 응답의 smltFlfmtSn을 제거했다. 나머지 기존 DTO 필드·enum 값은 유지한다.
2026-10-12에 출국장 조회·저장의 planList(ScPlanDto)를 삭제했다. 보안검색대는 출국장별 scshCntom 하나이고
peakScshCntom은 운영 중인 출국장의 scshCntom 합의 시간대별 최댓값이다.
실행의 세 배열은 **변경한 터미널·영역만** 담는다. 빠진 영역은 기존 저장 조건 또는 운영자료를 읽는다.
같은 배열에 터미널을 중복 전달하면 실패한다. 각 편집 항목의 날짜는 실행의 ymd로 강제한다.

예시:

~~~json
{
  "ymd": "20261011",
  "fltPsgList": [{ "ymd": "20261011", "tmnlId": "T1", "ajmtRt": 10 }],
  "chknList": [],
  "depList": []
}
~~~

위 요청은 T1 운항만 자동 저장하고 T2와 미변경 영역의 기존 조건을 유지하여 두 터미널 전체를 실행한다.
자동 저장 이후 입력 발행이 실패해도 한 트랜잭션이므로 자동 저장·마스터·리소스·요청을 모두 롤백한다.
수동 저장은 기존처럼 탭별 별도 트랜잭션이다. 저장 버튼 처리와 실행 처리의 경합은 페이지 잠금으로 막는다.

## 저장·발행·수신

- 현재상태 키: OWNER_USER_ID + EXCN_YMD + TMNL_ID + 기존 시설 식별축.
- TN_PM_SMLT_CURRENT_SAVE는 영역별 저장 사실과 시각을 보존한다. 저장한 빈 배열과 미저장을 구분한다.
- 공통 채번은 TN_PM_SMLT_ID_LOCK의 EXECUTION 행을 FOR UPDATE하고 마스터 전체 MAX+1을 읽는다.
  같은 잠금 안에서 RSRC_FS·RSRC_PS 행의 LAST_NO로 리소스 번호를 순환 할당한다.
  신규 번호는 00000001부터 99999999까지이며, 빈 테이블·상한 초과를 처리한다.
  이관 시 기존 숫자 1~8자리 ID는 그대로 보존하고 신규 번호만 8자리로 정규화한다.
- 신규 사용자 요청 ID는 WI + 공통 ID다. 호환 RSLT_SMLT_ID도 결과 연결 후 같은 ID를 가리킨다.
  회차는 런타임 DTO·mapper·목업에서 제거했다. 구 회차는 이관 감사 대응표에서만 남긴다.
- 양 터미널의 조건을 JSON(TN_PM_SMLT_COND_SNAPSHOT)에 고정하고, 같은 확정 DTO를 발행에 직접 넘긴다.
  발행 SQL은 DTO를 인라인 행(WITH … FROM DUAL UNION ALL)으로 받아 전송 테이블에 넣고, 발행 중
  USER_* 를 다시 읽지 않는다. 중간 정규화 테이블은 두지 않는다. 이후 편집은 과거 실행을 바꾸지 않는다.
- 항공사 없는 체크인 부스는 발행용 행에서만 뺀다. 조건 JSON은 화면이 본 값 그대로다.
- 사용자 DepartureGate는 확정 DEP 조건의 운영구간마다 1행이다(운영 Y). 시각은 ATRB의
  OPER_BGNG_HM·OPER_END_HM(HHMM, 24시는 2359), 날짜는 FS 그룹 일자다. 이 칸이 빈 일일(001) 행만
  운영계 출국장 운영시간을 조인한다. sideDoor·facialRecognition은 NVL(' ')로 배열 길이를 맞춘다.
- SecurityControl은 일일·사용자 모두 시각 없이 수량만 보낸다. 사용자는 운영 Y이고 scshCntom > 0인
  출국장마다 1행이다. 시간별 계획(TN_PM_SMLT_SCSH_OPER_PLAN)은 화면·계약·저장에서 폐지했다.
- TN_PM_SMLT_INPUT_BASE는 이전 결과 조회를 대체하는 날짜 유효 설정이다. 동일 날짜의 활성 행이
  여러 개면 selectOne이 실패하므로 운영자가 유효기간을 겹치지 않게 등록해야 한다.
  모델·PropertySet·서비스시간·체크인유형·입국심사·환승보안은 필수이며 실제 모델 파일·XML 입력 내용도 검사한다.
  원천 ID는 일일 Auto 조합과 같게 둔다. 초기 행은 2026-10-11-user-smlt-input-base-seed.sql로 등록한다.
- 002~999는 실행 ID와 별개인 전송 번호다. 한 요청이 FS·CA·SBD·DepartureGate·SecurityControl·
  Immigration·TransferSecurityControl 7종에 같은 번호를 쓴다. 입국심사·환승보안은 INPUT_BASE 원천(001) 행을
  번호로 복사한다(렌더 SQL이 번호로 FS 그룹 일자를 찾기 때문).
- 번호는 마지막 할당 번호 다음부터 002→…→999→002로 순환한다. 소유 실행(lease, lease 없는 기존 요청은
  FLT_SCHDL_RSRC_ID)이 New/Executing이면 건너뛰고 Finished/Failed면 lease 소유 실행을 UPDATE해 재사용한다.
  재사용 번호의 전송 7쌍은 상세→마스터 DELETE 후 INSERT한다. 전 번호가 진행 중일 때만 등록이 실패한다.
  New/Executing에 멈춘 실행은 번호를 계속 점유하며 자동 해제하지 않는다.
- PropertySet은 실행마다 PS500~998 중 하나를 FS와 독립 순환으로 받는다(001 기준정보, 002~499 Cast 설정
  카테고리, 999 전처리 결과와 분리). INPUT_BASE 원천 PS를 렌더해 SBD·DepartureGate·SecurityControl·Immigration·
  TransferSecurityControl 참조만 이 실행의 FS 번호로 바꾸고 ID를 PS5xx로 바꿔 XML로만 보관한다.
- 모델·서비스시간·체크인유형·출국심사·리포팅은 원본 ID 그대로 요청에 넣는다. 등록~CAST 수집 사이 원본이
  바뀌지 않는다는 운영 가정(2026-10-12)으로 `_U` 가상 ID를 폐지했다. INPUT_SNAPSHOT에는 원본 ID 리소스도
  실행별 기록으로 남기지만(PK SMLT_ID+유형+ID) REQ_GetResource 응답에는 **현재 lease 소유 실행의 번호 리소스·
  PS5xx 행만** 쓴다. 리소스 목록은 PS lease의 PS5xx만 추가로 내보낸다.
- 사용자 결과는 FS 후보를 WI 토큰으로 먼저 좁혀 유일하게 식별하고 날짜·모델·입력 ID를 대조한다.
  번호가 순환하므로 FS 번호나 현재 lease만으로 실행을 고르지 않는다.
  입력 누락·불일치, 여러 WI 토큰, 여러 후보, 실패 종료 요청은 임의로 연결하지 않는다.
- 원문과 SHA-256 hash를 REQUIRES_NEW 수신함에 먼저 저장한다. 결과 저장이 롤백되어도 원문·오류는 남는다.
  원천 식별키가 같고 hash가 같으면 재수신 성공으로 처리하고, hash가 다르면 격리한다.
- 일일·Manual의 묶음 키는 유형 + RunID + 계획 시작/종료 + 실제 시작/종료 + FS다.
  **실 CAST 계약 확인 전에는 활성화하지 않는다.** TN_PM_SMLT_CAST_CONTRACT의
  RESULT_GROUP_V1에 검증 근거와 VERIFIED_YN=Y가 있어야 일일·Manual 결과를 저장한다.
  미확인 결과는 실패 응답과 수신함 원문으로 남으며 별도 요청에 임의 연결하지 않는다.
- New/Executing은 RUNNING, 결과 저장 성공은 DONE, Failed는 FAILED다.
  Finished 상태 통보만 도착하고 결과가 없으면 마스터는 RUNNING을 유지한다.
  모니터링은 모델별 설정을 조인하지 않고 공통 마스터 1건을 읽어 중복 행을 방지한다.

## 실제 CAST 계약 확인 항목

아래 항목은 코드만으로 확인할 수 없다. 실 결과 XML·모델 파일과 왕복 로그를 보존하여 검증한다.

1. 같은 실행의 모델·터미널 결과가 RunID·계획/실제 시각·FS를 공유하는지, 다른 실행이 같은 키를 쓰지 않는지.
   RunID가 모델마다 다르면 현재 키는 분리 실행이 되므로 적용 전에 그룹 함수를 고쳐야 한다.
2. ModelResourceID 및 모든 입력 ID(PS5xx, 번호 입국심사·환승보안 포함)가 발행한 ID 그대로 돌아오는지.
   PropertySet의 체크인유형 참조, 모델 안의 입력 참조, ResourceInformation 목록 대조 여부도 확인한다.
3. StartTime은 대상일자, SimulationStart/StopTime은 실제 수행시각이라는 의미와 시간대.
4. 사용자 요청이 단일 모델 전체 결과인지, 다중 모델 각각인지와 전체 완료를 판정할 수 있는 신호.
   현재 사용자 설정은 요청당 모델 하나다. 다중 모델 요청 계약이 확인되면 기대 모델 집합·완료 집계를 추가한다.
5. 상태 통보 후 결과 지연·중복·역순·부분 응답과 재전송 결과의 문자열 차이.
6. 전송 번호가 순환 재사용되므로 늦은 결과가 새 요청과 혼동되지 않게 WI 식별자가 결과에 왕복하는지.
   WI 없이 FS 후보가 여럿이면 결과는 연결되지 않고 수신함에 실패 사유가 남는다.
7. GO FS 부속 컬럼 9개의 NULL 처리, 키오스크 기기 ID 앞 한 자=아일랜드 가정 및 4자리 한도,
   EMI/IMMI 실제 의미와 운영자료 날짜 범위.

## 이관 적용 순서

**기존 데이터가 있는 환경에 cast-ddl.sql을 그대로 실행하지 않는다.**
사진 판독 참조 DDL을 실스키마와 대조한 뒤 아래 스크립트를 별도 검증 DB에서 먼저 실행한다.
2026-08-27-user-smlt-alter.sql은 구 계약 기록이며 새 구조와 연속 적용하지 않는다.

1. preflight.sql을 실행해 컬럼·PK/FK·인덱스/표현식·시퀀스·코드값·ID 범위를 확보한다.
   Data Pump 또는 동등한 일관된 전체 백업에 테이블·제약·인덱스·권한·트리거를 포함한다.
   상세·제외 결과의 건수, 대기·처리 합계를 로그로 보존한다.
2. 기존 New/Executing 요청을 정상 완료시킨다. 화면 저장·실행뿐 아니라 CAST polling·상태·결과 수신을
   모두 중단하고 DB 쓰기가 정지했음을 확인한다. **stage 시작부터 새 서비스 개방까지 정지를 유지한다.**
3. master-stage.sql을 실행한다. 원본 7종·요청·회차 이력을 *_LGC에 보관하고 *_V2를 만든다.
   보안검색대 시간별 계획은 *_LGC 백업만 하고 *_V2·이관을 하지 않는다(기존 scshCntom을 그대로 쓴다).
   전송 7쌍의 사용자 번호(002~999) 행도 *_LGC로 백업한다. 기존 실행은 보관 XML이 없어 전송 테이블이
   입력의 유일한 사본이고 번호 순환이 언젠가 덮기 때문이다. RSRC_FS 시작점은 기존 요청의 최대 FS 번호다.
   preflight 로그에 FIX_ATRB_GROUP 500~998 행이 있었다면 cutover 전에 처리 방침을 정한다.
   조건은 최초 저장자·유일한 대상일자별로 분류하고 영역별 숫자 최대 ID의 부모·자식을 함께 선택한다.
   선택되지 않은 후보도 LGC와 LEGACY_COND_MAP에 남긴다.
4. master-executions.sql을 실행한다. 기존 결과 ID는 보존하고, 결과 없는 요청은 잠금 하에서 새 공통 ID를
   배정한다. 구 요청·회차·결과 ID 대응을 LEGACY_EXEC_MAP에 남긴다. 요청의 상태·시각·감사·리소스
   전체 컬럼을 복사하므로 Finished가 New로 되살아나지 않는다.
5. LEGACY_ISSUE의 소유자/날짜/ID/연결 미확정 건을 원본 근거로 해결한다. REASON에 걸린 대응표와
   V2 행도 함께 보정하고 실제 해결 내용·근거를 RESOLUTION에 기록한다.
   기존 사용자 실행의 확정 조건·불변 입력을 신뢰할 원본에서 복원한다. 현재 draft를 과거 조건이라고 복사하지 않는다.
   복원이 불가능하면 미확정 상태를 유지하며 cutover하지 않는다.
6. input-base-seed.sql로 INPUT_BASE를 등록한다. 모델·리포팅 ID는 실 DB·CAST 설정에서 확인한 값을 바인드한다.
   필요한 CAST 계약 검증을 마친다.
7. master-verify.sql을 실행한다. 현재상태의 양방향 MINUS, 요청 전체 컬럼, master FK 후보,
   양 터미널 6개 조건, 미확정 목록과 원본 합계, 리소스 번호 잠금 행, INPUT_BASE 3종(원천 생존·
   전 기간 활성 1건·최근 일일 Auto 설정과 일치)을 검증한다. 별도 환경에서 API·CAST까지 검증한다.
8. 검증 로그·백업·복구 리허설·계약 근거를 보존하고 MIGRATION_GATE의 CUTOVER에 근거 및 Y를 기록한다.
   master-cutover.sql은 미확정·활성 요청·원본 변경·매핑 누락이 있으면 중단한다.
   정상 시 원본을 *_OLD로 남기고 V2를 런타임 이름으로 전환한 뒤 FK를 추가한다.
   TN_PM_SMLT_SCSH_OPER_PLAN은 대체 테이블 없이 *_OLD로만 남는다.
9. 새 백엔드를 빌드·기동하고 화면/API를 검증한다. 비교 결과가 일치한 뒤 화면과 CAST 연계를 다시 개방한다.
   *_LGC, *_OLD, 대응표, 미확정 근거, 원천 수신함·입력 스냅샷은 삭제하지 않는다.

스크립트 경로는 모두 java/ddl/2026-10-11-user-smlt-*.sql이다.
SQL*Plus WHENEVER SQLERROR EXIT가 첫 오류에서 중단한다. Oracle DDL은 자동 커밋하므로 전체 원자적 이관이 아니다.
create_once와 NOT EXISTS는 재실행 중 중복 생성을 막지만 기존 테이블 정의 차이를 교정하지 않는다.
실패 지점·ALL_TABLES/CONSTRAINTS·보존 원본을 확인하여 재실행한다.
stage 이후 쓰기가 발생하면 LGC가 최신 원본이 아니다. 정지 상태를 복구한 후 별도 새 이관 배치/검증 DB를
만들고 다시 검증한다. 오래된 LGC를 통과시키려고 gate나 원본 비교를 우회하지 않는다.

## 실패 시 복구

- cutover 전: 기존 런타임 이름은 그대로다. 기존 앱만 재개할 수 있으나, 모든 백업·V2·대응표를 유지한다.
  staged master를 런타임으로 사용하는 새 앱은 열지 않는다.
- cutover 도중 또는 새 서비스 개방 전: 쓰기를 계속 정지한다. 각 테이블의 런타임/_V2/_OLD 존재 상태를
  확인한다. 새 FK_STNG_MASTER, FK_RESULT_MASTER, FK_EXCL_MASTER를 제거한 뒤,
  런타임으로 바뀐 V2를 충돌 없는 별도 *_FAILED 이름으로 보존하고 *_OLD를 원래 이름으로 되돌린다.
  아직 _V2인 테이블은 건드리지 않는다. 원본 제약·권한·트리거를 백업과 대조하고 구 앱으로 복구한다.
- 개방 후: 새 조건·요청·CAST 결과가 존재할 수 있으므로 단순 rename으로 롤백하지 않는다.
  먼저 새 데이터와 수신함을 일관되게 백업하고 쓰기를 정지한다. 대응표 기반 역이관 또는 전체 복원과
  새 요청·결과 재처리 계획을 별도 검증한 뒤 복구한다. 보존 자료를 DROP/TRUNCATE하지 않는다.
- CAST에서 실패 응답된 원문은 수신함에 남는다. 계약/매핑 문제를 수정하고 같은 원문을 재전송한다.
  수신함 hash를 삭제하거나 과거 결과에 최신 요청 ID를 임의 지정하지 않는다.

## 저장소 검증 기록

2026-10-11 기준:

- TypeScript `tsc -b`: 통과.
- 전체 ESLint `eslint .`: 통과.
- `verify:user-smlt`: 실제 목업 모듈을 대상으로 22개 시나리오 통과.
  사용자·날짜·터미널 격리, 변경 영역 자동 저장, 미방문 기본값, 저장한 빈 조건 유지,
  추가 실행, 실패 시 원복, 과거 조건 불변, 다른 사용자의 공개 조건 조회,
  잘못된 날짜·중복 터미널 거부, 모니터링 집계·기간 일치를 확인했다.
- Vite dev 모드 번들: 통과. 기존 500kB 이상 청크 경고가 남는다.
- MyBatis XML 17개 파싱, statement 중복 및 새 mapper 바인딩 누락 점검: 통과.
- 신규 테이블·FK, 요청 30개 컬럼 보존, 이관 검증의 원본/대상 컬럼 정적 대조: 통과.
- `git diff --check`: 통과.

일반 `npm run build`는 샌드박스에서 상위 사용자 경로의 lstat 접근이 거부되어 실패했다.
검증용 임시 설정에서 프로젝트 경로를 명시하고 symlink 정규화와 SVGR의 외부 설정 탐색을
끄고 같은 Vite 빌드를 수행했다. 저장소의 `vite.config.ts`는 변경하지 않았다.
타입·린트·목업도 같은 환경의 경로 제한을 피하도록 Node의 preserve-symlinks 플래그로 실행했다.

Java는 빌드 구성 없는 참조 사본이므로 실제 백엔드 레포에서 컴파일·통합 검증해야 한다.
Oracle SQL은 정적 점검만 수행했으며 실DB 이관 성공을 의미하지 않는다.
연결된 브라우저가 없어 화면 육안 검증은 수행하지 못했다.
실제 CAST 왕복 계약과 일일 결과 그룹 근거를 확인하기 전에는 배포 gate를 열지 않는다.
