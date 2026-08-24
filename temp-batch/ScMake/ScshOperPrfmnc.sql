-- =====================================================================================
-- 보안검색대 운영 실적 테이블 (신설 초안) — DBA 승인 필요
--
-- 왜 신규 테이블인가
--   "어떤 터미널 / 몇 번 출국장의 보안검색대가 몇 대 운영되었는지"를 담은 원천이 없다.
--   기준 데이터 TN_PM_SMLT_FCLTY_OPNG_TBL_SCRTY_CNTRL_ATRB 는 시간축이 없어 출국장당 값이
--   하나뿐이고, TN_PM_SMLT_SC_PLAN 은 사용자가 저장한 시뮬레이션 조건이라 실적이 아니다.
--   그래서 Xovis 실측(TN_PM_PSG_WTNG_INFO)의 보안검색대 레인 행에서 운영 대수를 유추해
--   시간당 1행으로 적재한다 (temp-batch/ScMake 참고).
--
-- 공통 규칙 (java/ddl/ddl-user-smlt.txt 와 동일)
--   - 감사 컬럼 6종 고정. INSERT 는 FRST_* 3종, UPDATE 는 LAST_* 3종.
--   - 타입은 VARCHAR2(n) / NUMBER(p,0) / TIMESTAMP(6) 만 쓴다.
--   - PK 이름은 <TABLE>_PK. 데이터 TSDPM01 / 인덱스 TSIPM01.
--   - 모든 테이블·컬럼에 한국어 COMMENT ON.
--   - TMNL_ID 는 DB 코드계(P01/P02/P03)다. 보안검색대는 P01/P03 에만 있다.
--   - DPTGT_NO 는 무패딩 '1'~'6'. 원천의 CHKN_ISL_CD 는 '01'~'04' 제로패딩이라 배치가 변환한다.
-- =====================================================================================

CREATE TABLE "PMOWN"."TN_PM_SCSH_OPER_PRFMNC"
 (
    "TOT_DT" TIMESTAMP(6) NOT NULL ENABLE VALIDATE,
    "TMNL_ID" VARCHAR2(4) NOT NULL ENABLE VALIDATE,
    "DPTGT_NO" VARCHAR2(2) NOT NULL ENABLE VALIDATE,
    "SCSH_OPER_CNTOM" NUMBER(3,0),
    "SCSH_OBSRVN_CNTOM" NUMBER(3,0),
    "WTNG_PSG_CNT" NUMBER(5,0),
    "FRST_RGTR_ID" VARCHAR2(40),
    "FRST_RGTR_IP_ADDR" VARCHAR2(23),
    "FRST_REG_DT" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "LAST_MDFR_ID" VARCHAR2(40),
    "LAST_MDFR_IP_ADDR" VARCHAR2(23),
    "LAST_MDFCN_DT" TIMESTAMP(6),
    CONSTRAINT "TN_PM_SCSH_OPER_PRFMNC_PK" PRIMARY KEY ("TOT_DT", "TMNL_ID", "DPTGT_NO")
 USING INDEX
 PCTFREE 10 INITRANS 2  LOGGING
 TABLESPACE "TSIPM01" ENABLE VALIDATE
 )
 PCTFREE 10 INITRANS 2 NOCOMPRESS LOGGING
 TABLESPACE "TSDPM01";

COMMENT ON TABLE "PMOWN"."TN_PM_SCSH_OPER_PRFMNC" IS 'PM_보안검색운영실적';
COMMENT ON COLUMN "PMOWN"."TN_PM_SCSH_OPER_PRFMNC"."TOT_DT" IS '집계일시';
COMMENT ON COLUMN "PMOWN"."TN_PM_SCSH_OPER_PRFMNC"."TMNL_ID" IS '터미널아이디';
COMMENT ON COLUMN "PMOWN"."TN_PM_SCSH_OPER_PRFMNC"."DPTGT_NO" IS '출국장번호';
COMMENT ON COLUMN "PMOWN"."TN_PM_SCSH_OPER_PRFMNC"."SCSH_OPER_CNTOM" IS '보안검색운영대수';
COMMENT ON COLUMN "PMOWN"."TN_PM_SCSH_OPER_PRFMNC"."SCSH_OBSRVN_CNTOM" IS '보안검색관측대수';
COMMENT ON COLUMN "PMOWN"."TN_PM_SCSH_OPER_PRFMNC"."WTNG_PSG_CNT" IS '대기여객수';
COMMENT ON COLUMN "PMOWN"."TN_PM_SCSH_OPER_PRFMNC"."FRST_RGTR_ID" IS '최초등록자아이디';
COMMENT ON COLUMN "PMOWN"."TN_PM_SCSH_OPER_PRFMNC"."FRST_RGTR_IP_ADDR" IS '최초등록자IP주소';
COMMENT ON COLUMN "PMOWN"."TN_PM_SCSH_OPER_PRFMNC"."FRST_REG_DT" IS '최초등록일시';
COMMENT ON COLUMN "PMOWN"."TN_PM_SCSH_OPER_PRFMNC"."LAST_MDFR_ID" IS '최종수정자아이디';
COMMENT ON COLUMN "PMOWN"."TN_PM_SCSH_OPER_PRFMNC"."LAST_MDFR_IP_ADDR" IS '최종수정자IP주소';
COMMENT ON COLUMN "PMOWN"."TN_PM_SCSH_OPER_PRFMNC"."LAST_MDFCN_DT" IS '최종수정일시';


-- -------------------------------------------------------------------------------------
-- 컬럼 의미
--   SCSH_OPER_CNTOM   그 시간에 활동 흔적이 있던 레인 수. 원천에 운영 대수 컬럼이 없어 유추한 값이다.
--   SCSH_OBSRVN_CNTOM 그 시간에 Xovis 가 행을 내려보낸 전체 레인 수. SCSH_OPER_CNTOM 의 모수이므로
--                     SCSH_OPER_CNTOM / SCSH_OBSRVN_CNTOM 으로 가동률을 낼 수 있다.
--                     항상 SCSH_OPER_CNTOM 이상이다.
--   WTNG_PSG_CNT  그 출국장 모든 레인의 대기라인길이 중 최대. 순간값이라 합이 아니라 MAX 로 접는다.
-- -------------------------------------------------------------------------------------
