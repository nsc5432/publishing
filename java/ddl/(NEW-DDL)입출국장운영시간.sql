-- =====================================================================
-- 입출국장 운영시간 3테이블 DDL (현행 / mapper 역추출본)
-- ---------------------------------------------------------------------
-- 정본은 소스의 mapper 쿼리다.
--   - java/임시분석/AdtOperHrMngMapper.xml  (운영시간 관리 화면 : CRUD 전체)
-- Cast(예측관리) 쪽은 이 테이블들을 직접 조회하지 않는다. AdtOperHrMngMapper.retrieveOperHr 를
-- aoms.pm.cast.service.CastOperHrService 가 재사용한다.
-- (OLD-DDL)입출국장운영시간.sql 은 설계 초안이라 테이블명·컬럼명이 실제와 다르다.
-- 이 파일은 위 두 mapper 가 실제로 치는 이름 기준으로 다시 정리한 것이다.
--
-- 1 DEPTH : TN_PM_ENTGT_DPTGT_OPER_HR_INFO   (운영시간 연계/배포 마스터)
-- 2 DEPTH : TN_PM_ENTGT_DPTGT_OPER_HR_ELMNT  (구성요소 : 터미널 × 시설)
-- 3 DEPTH : TN_PM_ENTGT_DPTGT_OPER_HR_MNG    (관리 : 기간 × 게이트 실데이터)
--
-- ---------------------------------------------------------------------
-- OLD-DDL <-> 현행 이름 매핑
-- ---------------------------------------------------------------------
--  구분              OLD-DDL                        현행(mapper)
--  ----------------  -----------------------------  ------------------------------------
--  1 depth 테이블    TN_PM_OPER_HR_MSTR             TN_PM_ENTGT_DPTGT_OPER_HR_INFO
--  2 depth 테이블    TN_PM_OPER_HR_ELEMENT          TN_PM_ENTGT_DPTGT_OPER_HR_ELMNT
--  3 depth 테이블    TN_PM_ENTGT_DPTGT_OPER_HR_MNG  (동일)
--  마스터 PK         SEQ                            OPER_HR_CRLTN_SN
--  마스터 명         DPLY_NM                        OPER_HR_CRLTN_NM
--  마스터 상태       STAT_CD                        OPER_HR_STTS_CD
--  마스터 배포일시   DPLY_DT                        OPER_HR_CRLTN_DT
--  구성요소 PK       SEQ                            ELMNT_SN
--  구성요소 부모     MSTR_SEQ                       OPER_HR_CRLTN_SN
--  터미널            TMNL_SE_CD                     TMNL_ID
--  직전 구성요소     PREV_ELEMENT_SEQ               BFR_ELMNT_SN
--  정렬순서          SORT_ORDR                      SORT_SEQ
--  관리 부모         ELEMENT_SEQ                    ELMNT_SN
--  기간(차수)        STRG_SN                        PRD_SN
--  시작/종료일자     BGNG_YMD / END_YMD             OPER_BGNG_YMD / OPER_END_YMD
--
-- ※ DTO(aoms.pm.adtoper.dto.*) 필드명은 여전히 OLD 명명(seq, mstrSeq, elementSeq,
--    strgSn, tmnlSeCd, bgngYmd …)을 쓰고, mapper 가 AS 로 현행 컬럼명을 DTO 이름에
--    맞춰 준다. DDL 이름만 보고 쿼리를 짜면 깨지니 주의.
--
-- ※ 이 파일은 PK 와 조회용 인덱스만 실제 DDL 로 적는다.
--    FK / CHECK / 부분 UNIQUE 는 실 DB 존재 여부를 확인하지 못해 주석으로만 남긴다.
-- =====================================================================


-- =====================================================================
-- 1 DEPTH : 운영시간 연계(배포) 마스터
-- =====================================================================
CREATE TABLE PMOWN.TN_PM_ENTGT_DPTGT_OPER_HR_INFO (
    OPER_HR_CRLTN_SN   NUMBER(22)     NOT NULL,                           -- 운영시간연계일련번호(PK). 채번은 MAX(..)+1
    OPER_HR_CRLTN_NM   VARCHAR2(100)  NOT NULL,                           -- 운영시간연계명(배포명)
    OPER_HR_STTS_CD    VARCHAR2(20)   DEFAULT 'TMP' NOT NULL,             -- 상태코드 TMP/CFM/DPL/CNL
    OPER_HR_CRLTN_DT   TIMESTAMP(6),                                      -- 운영시간연계일시(배포일시). DPL 전이 시점에만 채워진다
    RMRK_CN            VARCHAR2(300),                                     -- 비고내용
    FRST_RGTR_ID       VARCHAR2(40),                                      -- 최초등록자ID
    FRST_RGTR_IP_ADDR  VARCHAR2(23),                                      -- 최초등록자IP
    FRST_REG_DT        TIMESTAMP(6)   DEFAULT CURRENT_TIMESTAMP,          -- 최초등록일시
    LAST_MDFR_ID       VARCHAR2(40),                                      -- 최종수정자ID
    LAST_MDFR_IP_ADDR  VARCHAR2(23),                                      -- 최종수정자IP
    LAST_MDFCN_DT      TIMESTAMP(6),                                      -- 최종수정일시
    CONSTRAINT PK_PM_OPER_HR_INFO PRIMARY KEY (OPER_HR_CRLTN_SN)
);

-- 논리 제약(미선언) : OPER_HR_STTS_CD IN ('TMP','CFM','DPL','CNL')
--   → 쿼리가 실제로 거는 값은 'TMP','DPL' 뿐이지만, retrieveMstrListByPeriod 의
--     ORDER BY ... ELSE 2 가 그 외 상태의 존재를 전제한다.
-- 참조 관계(미선언) : FRST_RGTR_ID → CAOWN.TN_CA_USER.USER_ID
--   → LEFT JOIN + NVL(U.USER_NM,'초기입력') 이라 매칭 안 되는 초기 시드 행이 있다.
--     그래서 감사 컬럼을 NOT NULL 로 걸지 않았다(java/ddl.txt 의 다른 PM 테이블도 동일).

COMMENT ON TABLE  PMOWN.TN_PM_ENTGT_DPTGT_OPER_HR_INFO                    IS 'PM_입출국장운영시간정보';
COMMENT ON COLUMN PMOWN.TN_PM_ENTGT_DPTGT_OPER_HR_INFO.OPER_HR_CRLTN_SN   IS '운영시간연계일련번호';
COMMENT ON COLUMN PMOWN.TN_PM_ENTGT_DPTGT_OPER_HR_INFO.OPER_HR_CRLTN_NM   IS '운영시간연계명';
COMMENT ON COLUMN PMOWN.TN_PM_ENTGT_DPTGT_OPER_HR_INFO.OPER_HR_STTS_CD    IS '운영시간상태코드(TMP:임시저장,CFM:확정,DPL:배포,CNL:배포취소)';
COMMENT ON COLUMN PMOWN.TN_PM_ENTGT_DPTGT_OPER_HR_INFO.OPER_HR_CRLTN_DT   IS '운영시간연계일시';
COMMENT ON COLUMN PMOWN.TN_PM_ENTGT_DPTGT_OPER_HR_INFO.RMRK_CN            IS '비고내용';
COMMENT ON COLUMN PMOWN.TN_PM_ENTGT_DPTGT_OPER_HR_INFO.FRST_RGTR_ID       IS '최초등록자아이디';
COMMENT ON COLUMN PMOWN.TN_PM_ENTGT_DPTGT_OPER_HR_INFO.FRST_RGTR_IP_ADDR  IS '최초등록자IP주소';
COMMENT ON COLUMN PMOWN.TN_PM_ENTGT_DPTGT_OPER_HR_INFO.FRST_REG_DT        IS '최초등록일시';
COMMENT ON COLUMN PMOWN.TN_PM_ENTGT_DPTGT_OPER_HR_INFO.LAST_MDFR_ID       IS '최종수정자아이디';
COMMENT ON COLUMN PMOWN.TN_PM_ENTGT_DPTGT_OPER_HR_INFO.LAST_MDFR_IP_ADDR  IS '최종수정자IP주소';
COMMENT ON COLUMN PMOWN.TN_PM_ENTGT_DPTGT_OPER_HR_INFO.LAST_MDFCN_DT      IS '최종수정일시';


-- =====================================================================
-- 2 DEPTH : 운영시간 구성요소 (터미널 × 시설)
--   ELMNT_SN 은 배포 단위가 아니라 전역 대리키다.
--   (getNextElementSeq 가 테이블 전체 MAX(ELMNT_SN)+1, retrieveElement 가 ELMNT_SN 단독 조회)
-- =====================================================================
CREATE TABLE PMOWN.TN_PM_ENTGT_DPTGT_OPER_HR_ELMNT (
    ELMNT_SN           NUMBER(22)     NOT NULL,                           -- 구성요소일련번호(PK, 전역 대리키)
    OPER_HR_CRLTN_SN   NUMBER(22)     NOT NULL,                           -- 운영시간연계일련번호(부모)
    TMNL_ID            VARCHAR2(4)    NOT NULL,                           -- 터미널아이디. 값은 P01/P03 (화면의 T1/T2 가 아님)
    FCLT_SE_CD         VARCHAR2(1)    NOT NULL,                           -- 시설구분코드 A:입국 / D:출국 / T:환승
    BFR_ELMNT_SN       NUMBER(22),                                        -- 직전구성요소일련번호(자기참조, 직전 배포 라인 추적)
    USE_YN             VARCHAR2(1)    DEFAULT 'Y' NOT NULL,               -- 사용여부(논리삭제)
    SORT_SEQ           NUMBER(4)      DEFAULT 0   NOT NULL,               -- 정렬순서 겸 세대. retrieveLastDeployedElement 가 DESC 로 최신 세대를 고른다
    FRST_RGTR_ID       VARCHAR2(40),
    FRST_RGTR_IP_ADDR  VARCHAR2(23),
    FRST_REG_DT        TIMESTAMP(6)   DEFAULT CURRENT_TIMESTAMP,
    LAST_MDFR_ID       VARCHAR2(40),
    LAST_MDFR_IP_ADDR  VARCHAR2(23),
    LAST_MDFCN_DT      TIMESTAMP(6),
    CONSTRAINT PK_PM_OPER_HR_ELMNT PRIMARY KEY (ELMNT_SN)
);

-- retrieveOperHr / CastDepMapper 가 (OPER_HR_CRLTN_SN, ELMNT_SN) 복합으로 조인한다
CREATE INDEX PMOWN.IX_PM_OPER_HR_ELMNT_01 ON PMOWN.TN_PM_ENTGT_DPTGT_OPER_HR_ELMNT (OPER_HR_CRLTN_SN, ELMNT_SN);

-- retrieveLastDeployedElement / retrieveElementList 의 (터미널,시설) 필터
CREATE INDEX PMOWN.IX_PM_OPER_HR_ELMNT_02 ON PMOWN.TN_PM_ENTGT_DPTGT_OPER_HR_ELMNT (TMNL_ID, FCLT_SE_CD, USE_YN);

-- 논리 제약(미선언)
--   - FCLT_SE_CD IN ('A','D','T')
--   - USE_YN IN ('Y','N')
--   - OPER_HR_CRLTN_SN → TN_PM_ENTGT_DPTGT_OPER_HR_INFO.OPER_HR_CRLTN_SN
--   - BFR_ELMNT_SN     → 자기 테이블 ELMNT_SN
--   - 한 배포 안에서 (OPER_HR_CRLTN_SN, TMNL_ID, FCLT_SE_CD) 는 USE_YN='Y' 행 기준 유일해야 한다
--     (OLD-DDL 의 부분 UNIQUE 인덱스 의도. 실 DB 에 걸려 있는지 확인 필요)
-- ※ RMRK_CN 은 이 테이블에 없다. mapper 는 항상 INFO 쪽 M.RMRK_CN 을 조인해 쓴다.

COMMENT ON TABLE  PMOWN.TN_PM_ENTGT_DPTGT_OPER_HR_ELMNT                   IS 'PM_입출국장운영시간구성요소';
COMMENT ON COLUMN PMOWN.TN_PM_ENTGT_DPTGT_OPER_HR_ELMNT.ELMNT_SN          IS '구성요소일련번호';
COMMENT ON COLUMN PMOWN.TN_PM_ENTGT_DPTGT_OPER_HR_ELMNT.OPER_HR_CRLTN_SN  IS '운영시간연계일련번호';
COMMENT ON COLUMN PMOWN.TN_PM_ENTGT_DPTGT_OPER_HR_ELMNT.TMNL_ID           IS '터미널아이디';
COMMENT ON COLUMN PMOWN.TN_PM_ENTGT_DPTGT_OPER_HR_ELMNT.FCLT_SE_CD        IS '시설구분코드';
COMMENT ON COLUMN PMOWN.TN_PM_ENTGT_DPTGT_OPER_HR_ELMNT.BFR_ELMNT_SN      IS '직전구성요소일련번호';
COMMENT ON COLUMN PMOWN.TN_PM_ENTGT_DPTGT_OPER_HR_ELMNT.USE_YN            IS '사용여부';
COMMENT ON COLUMN PMOWN.TN_PM_ENTGT_DPTGT_OPER_HR_ELMNT.SORT_SEQ          IS '정렬순서';
COMMENT ON COLUMN PMOWN.TN_PM_ENTGT_DPTGT_OPER_HR_ELMNT.FRST_RGTR_ID      IS '최초등록자아이디';
COMMENT ON COLUMN PMOWN.TN_PM_ENTGT_DPTGT_OPER_HR_ELMNT.FRST_RGTR_IP_ADDR IS '최초등록자IP주소';
COMMENT ON COLUMN PMOWN.TN_PM_ENTGT_DPTGT_OPER_HR_ELMNT.FRST_REG_DT       IS '최초등록일시';
COMMENT ON COLUMN PMOWN.TN_PM_ENTGT_DPTGT_OPER_HR_ELMNT.LAST_MDFR_ID      IS '최종수정자아이디';
COMMENT ON COLUMN PMOWN.TN_PM_ENTGT_DPTGT_OPER_HR_ELMNT.LAST_MDFR_IP_ADDR IS '최종수정자IP주소';
COMMENT ON COLUMN PMOWN.TN_PM_ENTGT_DPTGT_OPER_HR_ELMNT.LAST_MDFCN_DT     IS '최종수정일시';


-- =====================================================================
-- 3 DEPTH : 운영시간 관리 (기간(차수) × 게이트 실데이터)
-- =====================================================================
CREATE TABLE PMOWN.TN_PM_ENTGT_DPTGT_OPER_HR_MNG (
    ELMNT_SN           NUMBER(22)     NOT NULL,                           -- 구성요소일련번호(PK1, ELMNT 참조)
    OPER_HR_CRLTN_SN   NUMBER(22)     NOT NULL,                           -- 운영시간연계일련번호(비정규화. 조회/삭제 범위 한정용)
    PRD_SN             NUMBER(22)     NOT NULL,                           -- 기간(차수)일련번호(PK2)
    FCLTY_TYPE_ID      VARCHAR2(4)    NOT NULL,                           -- 시설물유형ID(PK3). 게이트 번호 한 자리 '1'~'6'
    BSC_OPER_HR_YN     VARCHAR2(1)    DEFAULT 'N' NOT NULL,               -- 기본(현행)운영시간여부
    OPER_BGNG_YMD      VARCHAR2(8)    NOT NULL,                           -- 운영시작일자 YYYYMMDD
    OPER_END_YMD       VARCHAR2(8),                                       -- 운영종료일자. NULL = 개방형(미정)
    OPER_BGNG_1_HR     VARCHAR2(4)    NOT NULL,                           -- 운영시작시간1 HHMM
    OPER_END_1_HR      VARCHAR2(4)    NOT NULL,                           -- 운영종료시간1
    OPER_BGNG_2_HR     VARCHAR2(4),                                       -- 운영시작시간2
    OPER_END_2_HR      VARCHAR2(4),                                       -- 운영종료시간2
    OPER_BGNG_3_HR     VARCHAR2(4),                                       -- 운영시작시간3
    OPER_END_3_HR      VARCHAR2(4),                                       -- 운영종료시간3
    USE_YN             VARCHAR2(1)    DEFAULT 'Y' NOT NULL,               -- 사용여부(논리삭제)
    RMRK_CN            VARCHAR2(300),                                     -- 비고내용. 미사용(현행 mapper 미참조, INFO.RMRK_CN 을 대신 조회한다)
    FRST_RGTR_ID       VARCHAR2(40),
    FRST_RGTR_IP_ADDR  VARCHAR2(23),
    FRST_REG_DT        TIMESTAMP(6)   DEFAULT CURRENT_TIMESTAMP,
    LAST_MDFR_ID       VARCHAR2(40),
    LAST_MDFR_IP_ADDR  VARCHAR2(23),
    LAST_MDFCN_DT      TIMESTAMP(6),
    CONSTRAINT PK_PM_OPER_HR_MNG PRIMARY KEY (ELMNT_SN, PRD_SN, FCLTY_TYPE_ID)
);

-- retrieveMstrListByPeriod / retrieveDplyMstrListByTmnlPeriod 의 EXISTS
CREATE INDEX PMOWN.IX_PM_OPER_HR_MNG_01 ON PMOWN.TN_PM_ENTGT_DPTGT_OPER_HR_MNG (OPER_HR_CRLTN_SN, USE_YN);

-- retrieveCurrentOperHrByDate 의 상관 EXISTS, retrieveOperHr 의 기준일 필터
CREATE INDEX PMOWN.IX_PM_OPER_HR_MNG_02 ON PMOWN.TN_PM_ENTGT_DPTGT_OPER_HR_MNG (ELMNT_SN, USE_YN, OPER_BGNG_YMD, OPER_END_YMD);

-- CastDepMapper 의 A.GATE_NO = B.FCLTY_TYPE_ID 조인
CREATE INDEX PMOWN.IX_PM_OPER_HR_MNG_03 ON PMOWN.TN_PM_ENTGT_DPTGT_OPER_HR_MNG (FCLTY_TYPE_ID);

-- 논리 제약(미선언)
--   - BSC_OPER_HR_YN IN ('Y','N') / USE_YN IN ('Y','N')
--   - ELMNT_SN → TN_PM_ENTGT_DPTGT_OPER_HR_ELMNT.ELMNT_SN
--   - (OPER_HR_CRLTN_SN, ELMNT_SN) 은 ELMNT 의 같은 조합과 항상 일치해야 한다(비정규화 컬럼)
-- ⚠ PRD_SN 은 NUMBER 인데 DTO 쪽 strgSn 은 String 으로 보인다
--   (AdtOperHrMngMapper.xml 의 <if test="strgSn != null and strgSn != ''"> — 빈문자열 비교).
--   실제 DTO 소스가 이 레포에 없어 확인 못 함. 타입 불일치 여부 점검 필요.

COMMENT ON TABLE  PMOWN.TN_PM_ENTGT_DPTGT_OPER_HR_MNG                     IS 'PM_입출국장운영시간관리';
COMMENT ON COLUMN PMOWN.TN_PM_ENTGT_DPTGT_OPER_HR_MNG.ELMNT_SN            IS '구성요소일련번호';
COMMENT ON COLUMN PMOWN.TN_PM_ENTGT_DPTGT_OPER_HR_MNG.OPER_HR_CRLTN_SN    IS '운영시간연계일련번호';
COMMENT ON COLUMN PMOWN.TN_PM_ENTGT_DPTGT_OPER_HR_MNG.PRD_SN              IS '기간일련번호';
COMMENT ON COLUMN PMOWN.TN_PM_ENTGT_DPTGT_OPER_HR_MNG.FCLTY_TYPE_ID       IS '시설물유형아이디';
COMMENT ON COLUMN PMOWN.TN_PM_ENTGT_DPTGT_OPER_HR_MNG.BSC_OPER_HR_YN      IS '기본운영시간여부';
COMMENT ON COLUMN PMOWN.TN_PM_ENTGT_DPTGT_OPER_HR_MNG.OPER_BGNG_YMD       IS '운영시작일자';
COMMENT ON COLUMN PMOWN.TN_PM_ENTGT_DPTGT_OPER_HR_MNG.OPER_END_YMD        IS '운영종료일자';
COMMENT ON COLUMN PMOWN.TN_PM_ENTGT_DPTGT_OPER_HR_MNG.OPER_BGNG_1_HR      IS '운영시작시간1';
COMMENT ON COLUMN PMOWN.TN_PM_ENTGT_DPTGT_OPER_HR_MNG.OPER_END_1_HR       IS '운영종료시간1';
COMMENT ON COLUMN PMOWN.TN_PM_ENTGT_DPTGT_OPER_HR_MNG.OPER_BGNG_2_HR      IS '운영시작시간2';
COMMENT ON COLUMN PMOWN.TN_PM_ENTGT_DPTGT_OPER_HR_MNG.OPER_END_2_HR       IS '운영종료시간2';
COMMENT ON COLUMN PMOWN.TN_PM_ENTGT_DPTGT_OPER_HR_MNG.OPER_BGNG_3_HR      IS '운영시작시간3';
COMMENT ON COLUMN PMOWN.TN_PM_ENTGT_DPTGT_OPER_HR_MNG.OPER_END_3_HR       IS '운영종료시간3';
COMMENT ON COLUMN PMOWN.TN_PM_ENTGT_DPTGT_OPER_HR_MNG.USE_YN              IS '사용여부';
COMMENT ON COLUMN PMOWN.TN_PM_ENTGT_DPTGT_OPER_HR_MNG.RMRK_CN             IS '비고내용';
COMMENT ON COLUMN PMOWN.TN_PM_ENTGT_DPTGT_OPER_HR_MNG.FRST_RGTR_ID        IS '최초등록자아이디';
COMMENT ON COLUMN PMOWN.TN_PM_ENTGT_DPTGT_OPER_HR_MNG.FRST_RGTR_IP_ADDR   IS '최초등록자IP주소';
COMMENT ON COLUMN PMOWN.TN_PM_ENTGT_DPTGT_OPER_HR_MNG.FRST_REG_DT         IS '최초등록일시';
COMMENT ON COLUMN PMOWN.TN_PM_ENTGT_DPTGT_OPER_HR_MNG.LAST_MDFR_ID        IS '최종수정자아이디';
COMMENT ON COLUMN PMOWN.TN_PM_ENTGT_DPTGT_OPER_HR_MNG.LAST_MDFR_IP_ADDR   IS '최종수정자IP주소';
COMMENT ON COLUMN PMOWN.TN_PM_ENTGT_DPTGT_OPER_HR_MNG.LAST_MDFCN_DT       IS '최종수정일시';


-- =====================================================================
-- 부록 : 조회할 때 알아야 하는 것
-- =====================================================================
--
-- [1] 기준일자의 "현행" 1건을 고르는 규칙 (AdtOperHrMngMapper.retrieveOperHr)
--     INFO.OPER_HR_STTS_CD = 'DPL'
--     AND ELMNT.USE_YN = 'Y' AND MNG.USE_YN = 'Y'
--     AND ELMNT.TMNL_ID = :tmnlId AND ELMNT.FCLT_SE_CD = :fcltSeCd
--     AND :crtrYmd BETWEEN MNG.OPER_BGNG_YMD AND NVL(MNG.OPER_END_YMD, '99991231')
--     동률이면 RANK() OVER (ORDER BY OPER_HR_CRLTN_SN DESC, ELMNT_SN DESC, PRD_SN DESC) = 1
--
-- [2] 개방형 종료일 sentinel 은 '99991231' 하나뿐이다
--     CastDepMapper.retrieveDepOperHrList 가 쓰던 '21001231' 은 그 쿼리를 걷어내면서 사라졌다.
--
-- [3] 운영시간 조회 경로는 retrieveOperHr 하나다
--     Cast 의 세 화면(사용자 시뮬레이션 조건설정 · 출국장 · 맵형태보기)이 CastOperHrService 를 거쳐
--     같은 쿼리를 본다. USE_YN = 'Y' 필터가 빠진 별도 경로는 더 이상 없다.
--
-- [4] 터미널 값 축이 둘이다
--     DB TMNL_ID = 'P01'(제1여객터미널) / 'P02'(탑승동) / 'P03'(제2여객터미널)
--     화면·enum   = 'T1' / 'T2'
--     변환은 aoms.pm.cast.enums.TerminalKind.getFcltTmnlId() (java/cast/enums/TerminalKind.java).
--     mapper 파라미터 #{tmnlSeCd} 는 TMNL_ID 에 바인딩되므로 P0x 값을 넣어야 한다.
--
-- [5] FCLTY_TYPE_ID 는 게이트 번호 한 자리다
--     SUBSTR(TN_PM_SMLT_PSG_FCLT.PSG_FCLT_CD, 4, 1) 과 같은 축이다(출국장 = UP_PSG_FCLT_CD 'LGT').
--     VARCHAR2(4) 컬럼이라 값에 공백 패딩이 섞이면 매칭이 조용히 깨진다.
--     CastOperHrServiceImpl 은 그래서 trim() 후에 키로 쓴다.
--
-- [6] ESB 송신 테이블은 컬럼명 규칙이 다르다
--     ESBOWN.ESB_ADTOPERINFOAOMS_SND 는 시간 컬럼이 _HR 이 아니라 _TM,
--     게이트 컬럼도 FCLTY_TYPE_ID 가 아니라 FCLTY_ID 다. 이름 혼동 주의.
