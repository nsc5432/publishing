-- =====================================================================================
-- 사용자 시뮬레이션 ↔ CastRest 연계 — 스키마 정합화
-- 2026-08-27 / docs/plans/2026-08-27-user-smlt-cast-linkage.md
--
-- cast-ddl.sql 은 사진 판독본이라 mapper 와 어긋난 곳이 있다. mapper 를 기준으로 맞춘다.
-- 실 스키마에 이미 있는 컬럼은 ORA-01430 이 나므로 (2)(3) 은 실행 전 ALL_TAB_COLUMNS 로 확인한다.
-- =====================================================================================

-- -------------------------------------------------------------------------------------
-- (1) TN_PM_SMLT_USER_MSTR — 실행 요청 테이블
--     PK 는 원래 WHAT_IF_EXCN_ID 였다. 표준단어 치환으로 SMLT_ID 가 되면서
--     편집 draft·수행이력·결과의 SMLT_ID 와 이름이 겹쳤다. 넷을 분리한다.
-- -------------------------------------------------------------------------------------
ALTER TABLE PMOWN.TN_PM_SMLT_USER_MSTR RENAME COLUMN SMLT_ID TO SMLT_REQ_ID;

ALTER TABLE PMOWN.TN_PM_SMLT_USER_MSTR ADD (
    SMLT_ID       VARCHAR2(8),
    TMNL_ID       VARCHAR2(4),
    EXCN_YMD      VARCHAR2(8),
    SMLT_FLFMT_SN NUMBER(5,0),
    RSLT_SMLT_ID  VARCHAR2(8),
    QUEUE_DT      TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    END_DT        TIMESTAMP(6),
    ERR_MSG       VARCHAR2(1000),
    FCLTY_OPNG_SCRTY_CNTRL_RSRC_ID    VARCHAR2(100),
    FCLTY_OPNG_TR_SCRTY_CNTRL_RSRC_ID VARCHAR2(100)
);

COMMENT ON COLUMN PMOWN.TN_PM_SMLT_USER_MSTR.SMLT_REQ_ID   IS '시뮬레이션실행요청아이디';
COMMENT ON COLUMN PMOWN.TN_PM_SMLT_USER_MSTR.SMLT_ID       IS '시뮬레이션아이디';
COMMENT ON COLUMN PMOWN.TN_PM_SMLT_USER_MSTR.TMNL_ID       IS '터미널아이디';
COMMENT ON COLUMN PMOWN.TN_PM_SMLT_USER_MSTR.EXCN_YMD      IS '실행연월일';
COMMENT ON COLUMN PMOWN.TN_PM_SMLT_USER_MSTR.SMLT_FLFMT_SN IS '시뮬레이션수행일련번호';
COMMENT ON COLUMN PMOWN.TN_PM_SMLT_USER_MSTR.RSLT_SMLT_ID  IS '결과시뮬레이션아이디';
COMMENT ON COLUMN PMOWN.TN_PM_SMLT_USER_MSTR.QUEUE_DT      IS '대기등록일시';
COMMENT ON COLUMN PMOWN.TN_PM_SMLT_USER_MSTR.END_DT        IS '종료일시';
COMMENT ON COLUMN PMOWN.TN_PM_SMLT_USER_MSTR.ERR_MSG       IS '오류메시지';
COMMENT ON COLUMN PMOWN.TN_PM_SMLT_USER_MSTR.FCLTY_OPNG_SCRTY_CNTRL_RSRC_ID    IS '시설물운영보안검색리소스아이디';
COMMENT ON COLUMN PMOWN.TN_PM_SMLT_USER_MSTR.FCLTY_OPNG_TR_SCRTY_CNTRL_RSRC_ID IS '시설물운영환승보안검색리소스아이디';

-- 기존 행은 draft·회차를 복원할 수 없다. Failed 로 닫고 신규 요청부터 정상 경로를 탄다.
UPDATE PMOWN.TN_PM_SMLT_USER_MSTR
   SET SMLT_STTS     = 'Failed',
       ERR_MSG       = 'migrated 2026-08-27',
       SMLT_ID       = SUBSTR(SMLT_REQ_ID, 1, 8),
       TMNL_ID       = 'P01',
       EXCN_YMD      = SUBSTR(SMLT_REQ_ID, 1, 8),
       SMLT_FLFMT_SN = 0;

ALTER TABLE PMOWN.TN_PM_SMLT_USER_MSTR MODIFY (
    SMLT_ID       NOT NULL,
    TMNL_ID       NOT NULL,
    EXCN_YMD      NOT NULL,
    SMLT_FLFMT_SN NOT NULL,
    QUEUE_DT      NOT NULL,
    SMLT_STTS     DEFAULT 'New' NOT NULL
);

-- 상태값은 CAST 가 REQ_SetResource 로 보내는 문자열을 그대로 쓴다.
ALTER TABLE PMOWN.TN_PM_SMLT_USER_MSTR ADD CONSTRAINT TN_PM_SMLT_USER_MSTR_CK1
    CHECK (SMLT_STTS IN ('New', 'Executing', 'Finished', 'Failed'));

ALTER TABLE PMOWN.TN_PM_SMLT_USER_MSTR ADD CONSTRAINT TN_PM_SMLT_USER_MSTR_UK1
    UNIQUE (SMLT_ID, TMNL_ID, SMLT_FLFMT_SN);

-- 중복 실행 방어. 같은 (draft, 터미널) 의 미완료 요청은 동시에 1건만 존재한다.
CREATE UNIQUE INDEX PMOWN.TN_PM_SMLT_USER_MSTR_UX_ACTIVE
    ON PMOWN.TN_PM_SMLT_USER_MSTR
       (CASE WHEN SMLT_STTS IN ('New', 'Executing') THEN SMLT_ID || '|' || TMNL_ID END);

CREATE INDEX PMOWN.TN_PM_SMLT_USER_MSTR_IX1
    ON PMOWN.TN_PM_SMLT_USER_MSTR (SMLT_STTS, QUEUE_DT);

-- CAST 결과가 실어 보내는 FlightScheduleResourceID 로 요청을 역추적한다.
CREATE INDEX PMOWN.TN_PM_SMLT_USER_MSTR_IX2
    ON PMOWN.TN_PM_SMLT_USER_MSTR (FLT_SCHDL_RSRC_ID);

-- -------------------------------------------------------------------------------------
-- (2) TN_PM_SMLT_STNG — retrieveSmltStng · insertSimSet 이 참조하는데 DDL 에 없던 컬럼
-- -------------------------------------------------------------------------------------
ALTER TABLE PMOWN.TN_PM_SMLT_STNG ADD (
    PRPT_SET_RSRC_ID                  VARCHAR2(100),
    MDL_RSRC_ID                       VARCHAR2(100),
    EXCN_ID                           VARCHAR2(100),
    CKNCT_SRVC_HR_RSRC_ID             VARCHAR2(100),
    CHKN_TYPE_RSRC_ID                 VARCHAR2(100),
    FCLTY_OPNG_TR_SCRTY_CNTRL_RSRC_ID VARCHAR2(100)
);

COMMENT ON COLUMN PMOWN.TN_PM_SMLT_STNG.PRPT_SET_RSRC_ID                  IS '속성설정리소스아이디';
COMMENT ON COLUMN PMOWN.TN_PM_SMLT_STNG.MDL_RSRC_ID                       IS '모델리소스아이디';
COMMENT ON COLUMN PMOWN.TN_PM_SMLT_STNG.EXCN_ID                           IS '실행아이디';
COMMENT ON COLUMN PMOWN.TN_PM_SMLT_STNG.CKNCT_SRVC_HR_RSRC_ID             IS '체크인카운터서비스시간리소스아이디';
COMMENT ON COLUMN PMOWN.TN_PM_SMLT_STNG.CHKN_TYPE_RSRC_ID                 IS '체크인유형리소스아이디';
COMMENT ON COLUMN PMOWN.TN_PM_SMLT_STNG.FCLTY_OPNG_TR_SCRTY_CNTRL_RSRC_ID IS '시설물운영환승보안검색리소스아이디';

-- -------------------------------------------------------------------------------------
-- (3) TN_PM_SMLT_RSLT_DTL — insertSimResultDtl 이 쓰는 대기길이 3종 + PK
--     PK 에 PSG_FCLT_CD 가 없으면 같은 시각의 두 번째 시설에서 ORA-00001 이 난다.
-- -------------------------------------------------------------------------------------
ALTER TABLE PMOWN.TN_PM_SMLT_RSLT_DTL ADD (
    AVG_WTNG_LEN NUMBER(10,3),
    MIN_WTNG_LEN NUMBER(10,3),
    MAX_WTNG_LEN NUMBER(10,3)
);

COMMENT ON COLUMN PMOWN.TN_PM_SMLT_RSLT_DTL.AVG_WTNG_LEN IS '평균대기길이';
COMMENT ON COLUMN PMOWN.TN_PM_SMLT_RSLT_DTL.MIN_WTNG_LEN IS '최소대기길이';
COMMENT ON COLUMN PMOWN.TN_PM_SMLT_RSLT_DTL.MAX_WTNG_LEN IS '최대대기길이';

ALTER TABLE PMOWN.TN_PM_SMLT_RSLT_DTL DROP CONSTRAINT TN_PM_SMLT_RSLT_DTL_PK;
ALTER TABLE PMOWN.TN_PM_SMLT_RSLT_DTL ADD CONSTRAINT TN_PM_SMLT_RSLT_DTL_PK
    PRIMARY KEY (SMLT_ID, SMLT_EXCN_DT, SMLT_ACTL_DT, SMLT_MDL_SN, PSG_FCLT_CD);

-- -------------------------------------------------------------------------------------
-- (4) 사용자 CAST 리소스 번호
--     ResourceID 는 FS002 … FS999 → 002 로 도는 단순 증가 번호다. 001 은 일일 고정.
--     FS · CA · SBD · 시설운영이 한 번호를 공유한다 — retrieveFcltyOpngTblDptg 가
--     출국장 번호로 TN_PM_SMLT_SCHDL_ATRB 를 뒤지기 때문에 따로 돌리면 깨진다.
-- -------------------------------------------------------------------------------------
CREATE SEQUENCE PMOWN.SQ1_TN_PM_SMLT_USER_RSRC
    START WITH 2 INCREMENT BY 1 MINVALUE 2 MAXVALUE 999 CYCLE NOCACHE ORDER;

-- -------------------------------------------------------------------------------------
-- (5) 수동 복구 — 감시 배치가 없어서, CAST 가 Executing 으로 바꾼 뒤 죽으면
--     UX_ACTIVE 때문에 그 (draft, 터미널) 의 재실행이 막힌다. 그때 쓴다.
-- -------------------------------------------------------------------------------------
-- UPDATE PMOWN.TN_PM_SMLT_USER_MSTR
--    SET SMLT_STTS = 'Failed', END_DT = CURRENT_TIMESTAMP, ERR_MSG = 'manual recovery'
--  WHERE SMLT_STTS = 'Executing'
--    AND EXCT_DT < CURRENT_TIMESTAMP - INTERVAL '60' MINUTE;
-- UPDATE PMOWN.TH_PM_SMLT_FLFMT_HSTRY A
--    SET SMLT_FLFMT_STTS_CD = 'FAILED', SMLT_FLFMT_END_DT = CURRENT_TIMESTAMP
--  WHERE SMLT_FLFMT_STTS_CD = 'RUNNING'
--    AND EXISTS (SELECT 1 FROM PMOWN.TN_PM_SMLT_USER_MSTR B
--                 WHERE B.SMLT_ID = A.SMLT_ID AND B.SMLT_FLFMT_SN = A.SMLT_FLFMT_SN
--                   AND B.SMLT_STTS = 'Failed');
