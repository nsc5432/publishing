-- =====================================================================================
-- 전처리 결과(FIX_ATRB_GROUP_ID = '999') → 일일 시뮬레이션(001) 반영 체계
-- 2026-09-02
--
-- data-processing/run_pipeline.py 가 주단위로 산출한 비율을 '999' 속성그룹으로 적재하고,
-- Cast 설정 화면에서 999 ↔ 001 을 비교해 고른 행만 001 에 반영한다.
--
-- 적용 전 아래를 실 스키마에서 확인한다 (cast-ddl.sql 은 사진 판독본이라 믿을 수 없다).
--   1) 파이프라인 산출 코드가 터미널별로 분리돼 있는가
--      SELECT PSG_FIX_PARA_CD, PSG_FIX_PARA_GROUP_CD, PSG_FIX_PARA_CD_NM,
--             PSG_SMLT_APLCN_NM, USE_YN, PRE_PRCS_YN
--        FROM PMOWN.TN_PM_SMLT_PSG_FIX_PARA_CD
--       ORDER BY PSG_FIX_PARA_GROUP_CD, PSG_FIX_PARA_CD;
--      05/13/15 계열이 터미널별로 나뉘어 있지 않으면 999 단일 그룹에서 T1/T2 가 충돌한다.
--      이 경우 속성코드를 먼저 분리한다. step5_save.assert_unique_keys 가 중복 적재를 중단한다.
--   2) 999 가 이미 쓰이고 있지 않은가
--      SELECT FIX_ATRB_GROUP_ID, ATRB_GROUP_NM, DEL_YN FROM PMOWN.TN_PM_SMLT_FIX_ATRB_GROUP;
--   3) TN_PM_DATA_PRCS_MSTR 의 실제 컬럼 (step5_save.py 가 실행 이력을 남긴다)
--      SELECT COLUMN_NAME, DATA_TYPE FROM ALL_TAB_COLUMNS
--       WHERE OWNER='PMOWN' AND TABLE_NAME='TN_PM_DATA_PRCS_MSTR' ORDER BY COLUMN_ID;
-- =====================================================================================

-- -------------------------------------------------------------------------------------
-- (1) 전처리 결과 카테고리
--     ATRB_GROUP_NM 은 step5_save.py 가 매 실행마다 '전처리 결과 (260212-260218)' 로 갱신한다.
-- -------------------------------------------------------------------------------------
MERGE INTO PMOWN.TN_PM_SMLT_FIX_ATRB_GROUP T
USING (SELECT '999' AS FIX_ATRB_GROUP_ID FROM DUAL) S
   ON (T.FIX_ATRB_GROUP_ID = S.FIX_ATRB_GROUP_ID)
WHEN NOT MATCHED THEN
    INSERT (FIX_ATRB_GROUP_ID, ATRB_GROUP_NM, CFMTN_YN, GROUP_PRCS_STTS_CD, DEL_YN,
            FRST_RGTR_ID, FRST_RGTR_IP_ADDR, FRST_REG_DT)
    VALUES ('999', '전처리 결과', 'N', '01', 'N', 'System', '0.0.0.0', CURRENT_TIMESTAMP);

-- -------------------------------------------------------------------------------------
-- (2) 전처리 대상 표시
--     retrievePsgAtrbList 는 상세코드(D) 의 PRE_PRCS_YN 을 읽는다. 상세코드는
--     PSG_FIX_PARA_GROUP_CD 로 부모(속성)코드를 가리키므로 부모코드 목록으로 건다.
--     목록은 data-processing/step5_mapping.py 의 UPLOAD_TASKS psg_atrb_cd 집합과 같다.
--     파이프라인에 태스크를 더하면 여기도 함께 늘린다.
-- -------------------------------------------------------------------------------------
UPDATE PMOWN.TN_PM_SMLT_PSG_FIX_PARA_CD
   SET PRE_PRCS_YN       = 'Y',
       LAST_MDFR_ID      = 'System',
       LAST_MDFR_IP_ADDR = '0.0.0.0',
       LAST_MDFCN_DT     = CURRENT_TIMESTAMP
 WHERE PSG_FIX_PARA_GROUP_CD IN (
           -- 단순 비율
           '01010000',  -- 국적
           '02010000',  -- 출발지
           '04010000',  -- 수하물 갯수
           '18010000',  -- 출국심사 내국인
           '18020000',  -- 출국심사 외국인
           -- 발생시각 (EntryTime) P1~P5
           '05010000', '05020000', '05030000', '05040000', '05050000',
           -- 체크인 리포팅
           '13010000', '13020000',
           -- 게이트 리포팅 (국제선)
           '14100000',
           -- 보안 리포팅 P1~P5
           '15010000', '15020000', '15030000', '15040000', '15050000',
           -- 출국장이용분포 T1 A~Z
           '17010000', '17020000', '17030000', '17040000', '17050000', '17060000', '17070000',
           '17080000', '17090000', '17100000', '17110000', '17120000', '17130000', '17140000',
           -- 출국장이용분포 T2 A~Z
           '17160000', '17170000', '17180000', '17190000', '17200000', '17210000', '17220000',
           '17230000', '17240000', '17250000', '17260000', '17270000', '17280000', '17290000'
       );

-- -------------------------------------------------------------------------------------
-- (3) 적용 이력 헤더 — 999 → 001 반영 1회
-- -------------------------------------------------------------------------------------
CREATE TABLE PMOWN.TN_PM_SMLT_ATRB_APLY_HSTRY
(
    APLY_SN               NUMBER(10)   NOT NULL,
    SRC_FIX_ATRB_GROUP_ID VARCHAR2(8)  NOT NULL,
    TGT_FIX_ATRB_GROUP_ID VARCHAR2(8)  NOT NULL,
    TMNL_ID               VARCHAR2(4),
    TBL_NM                VARCHAR2(50) NOT NULL,
    SHEET_NM              VARCHAR2(50),
    APLY_ROW_CNT          NUMBER(6)    DEFAULT 0,
    CNCL_YN               VARCHAR2(1)  DEFAULT 'N' NOT NULL,
    CNCL_DT               TIMESTAMP(6),
    CNCL_RGTR_ID          VARCHAR2(40),
    FRST_RGTR_ID          VARCHAR2(40),
    FRST_RGTR_IP_ADDR     VARCHAR2(23),
    FRST_REG_DT           TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT TN_PM_SMLT_ATRB_APLY_HSTRY_PK PRIMARY KEY (APLY_SN),
    CONSTRAINT TN_PM_SMLT_ATRB_APLY_HSTRY_CK1 CHECK (CNCL_YN IN ('Y', 'N'))
);

COMMENT ON TABLE  PMOWN.TN_PM_SMLT_ATRB_APLY_HSTRY                       IS 'PM_시뮬레이션속성적용이력';
COMMENT ON COLUMN PMOWN.TN_PM_SMLT_ATRB_APLY_HSTRY.APLY_SN               IS '적용일련번호';
COMMENT ON COLUMN PMOWN.TN_PM_SMLT_ATRB_APLY_HSTRY.SRC_FIX_ATRB_GROUP_ID IS '원본고정속성그룹아이디';
COMMENT ON COLUMN PMOWN.TN_PM_SMLT_ATRB_APLY_HSTRY.TGT_FIX_ATRB_GROUP_ID IS '대상고정속성그룹아이디';
COMMENT ON COLUMN PMOWN.TN_PM_SMLT_ATRB_APLY_HSTRY.TMNL_ID               IS '터미널아이디';
COMMENT ON COLUMN PMOWN.TN_PM_SMLT_ATRB_APLY_HSTRY.TBL_NM                IS '테이블명';
COMMENT ON COLUMN PMOWN.TN_PM_SMLT_ATRB_APLY_HSTRY.SHEET_NM              IS '시트명';
COMMENT ON COLUMN PMOWN.TN_PM_SMLT_ATRB_APLY_HSTRY.APLY_ROW_CNT          IS '적용행수';
COMMENT ON COLUMN PMOWN.TN_PM_SMLT_ATRB_APLY_HSTRY.CNCL_YN               IS '취소여부';
COMMENT ON COLUMN PMOWN.TN_PM_SMLT_ATRB_APLY_HSTRY.CNCL_DT               IS '취소일시';
COMMENT ON COLUMN PMOWN.TN_PM_SMLT_ATRB_APLY_HSTRY.CNCL_RGTR_ID          IS '취소자아이디';
COMMENT ON COLUMN PMOWN.TN_PM_SMLT_ATRB_APLY_HSTRY.FRST_RGTR_ID          IS '최초등록자아이디';
COMMENT ON COLUMN PMOWN.TN_PM_SMLT_ATRB_APLY_HSTRY.FRST_RGTR_IP_ADDR     IS '최초등록자IP주소';
COMMENT ON COLUMN PMOWN.TN_PM_SMLT_ATRB_APLY_HSTRY.FRST_REG_DT           IS '최초등록일시';

CREATE INDEX PMOWN.TN_PM_SMLT_ATRB_APLY_HSTRY_IX1
    ON PMOWN.TN_PM_SMLT_ATRB_APLY_HSTRY (TGT_FIX_ATRB_GROUP_ID, FRST_REG_DT DESC);

CREATE INDEX PMOWN.TN_PM_SMLT_ATRB_APLY_HSTRY_IX2
    ON PMOWN.TN_PM_SMLT_ATRB_APLY_HSTRY
       (TGT_FIX_ATRB_GROUP_ID, TMNL_ID, TBL_NM, CNCL_YN, APLY_SN DESC);

CREATE SEQUENCE PMOWN.SQ1_TN_PM_SMLT_ATRB_APLY
    START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;

-- -------------------------------------------------------------------------------------
-- (4) 적용 이력 상세 = 적용 직전 값 스냅샷
--     시트마다 값 컬럼이 달라(PSG 3종 · SRVC 7종) 컬럼명을 행으로 눕힌다.
--     되돌리기는 COLUMN_NM 을 그대로 updateAtrbValue 의 ${columnNm} 에 넘겨 BEF_VL 을 되돌린다.
-- -------------------------------------------------------------------------------------
CREATE TABLE PMOWN.TN_PM_SMLT_ATRB_APLY_HSTRY_DTL
(
    APLY_SN   NUMBER(10)   NOT NULL,
    ATRB_CD   VARCHAR2(8)  NOT NULL,
    DTL_SE_CD VARCHAR2(8)  NOT NULL,
    COLUMN_NM VARCHAR2(30) NOT NULL,
    BEF_VL    VARCHAR2(500),
    AFT_VL    VARCHAR2(500),
    CONSTRAINT TN_PM_SMLT_ATRB_APLY_HSTRY_DTL_PK
        PRIMARY KEY (APLY_SN, ATRB_CD, DTL_SE_CD, COLUMN_NM),
    CONSTRAINT TN_PM_SMLT_ATRB_APLY_HSTRY_DTL_FK1
        FOREIGN KEY (APLY_SN) REFERENCES PMOWN.TN_PM_SMLT_ATRB_APLY_HSTRY (APLY_SN)
);

COMMENT ON TABLE  PMOWN.TN_PM_SMLT_ATRB_APLY_HSTRY_DTL           IS 'PM_시뮬레이션속성적용이력상세';
COMMENT ON COLUMN PMOWN.TN_PM_SMLT_ATRB_APLY_HSTRY_DTL.APLY_SN   IS '적용일련번호';
COMMENT ON COLUMN PMOWN.TN_PM_SMLT_ATRB_APLY_HSTRY_DTL.ATRB_CD   IS '속성코드';
COMMENT ON COLUMN PMOWN.TN_PM_SMLT_ATRB_APLY_HSTRY_DTL.DTL_SE_CD IS '상세구분코드';
COMMENT ON COLUMN PMOWN.TN_PM_SMLT_ATRB_APLY_HSTRY_DTL.COLUMN_NM IS '컬럼명';
COMMENT ON COLUMN PMOWN.TN_PM_SMLT_ATRB_APLY_HSTRY_DTL.BEF_VL    IS '변경전값';
COMMENT ON COLUMN PMOWN.TN_PM_SMLT_ATRB_APLY_HSTRY_DTL.AFT_VL    IS '변경후값';

-- -------------------------------------------------------------------------------------
-- 수동 복구
--   적용 도중 세션이 끊겨 이력만 남고 값이 반쯤 반영된 경우, 상세의 BEF_VL 로 되돌린다.
--     UPDATE PMOWN.TN_PM_SMLT_PSG_ATRB A
--        SET A.INPT_VL = (SELECT D.BEF_VL FROM PMOWN.TN_PM_SMLT_ATRB_APLY_HSTRY_DTL D
--                          WHERE D.APLY_SN = &aply_sn AND D.COLUMN_NM = 'INPT_VL'
--                            AND D.ATRB_CD = A.PSG_ATRB_CD AND D.DTL_SE_CD = A.PSG_DTL_SE_CD)
--      WHERE A.FIX_ATRB_GROUP_ID = '001'
--        AND EXISTS (SELECT 1 FROM PMOWN.TN_PM_SMLT_ATRB_APLY_HSTRY_DTL D
--                     WHERE D.APLY_SN = &aply_sn AND D.COLUMN_NM = 'INPT_VL'
--                       AND D.ATRB_CD = A.PSG_ATRB_CD AND D.DTL_SE_CD = A.PSG_DTL_SE_CD);
--     UPDATE PMOWN.TN_PM_SMLT_ATRB_APLY_HSTRY SET CNCL_YN = 'Y', CNCL_DT = CURRENT_TIMESTAMP
--      WHERE APLY_SN = &aply_sn;
-- -------------------------------------------------------------------------------------
