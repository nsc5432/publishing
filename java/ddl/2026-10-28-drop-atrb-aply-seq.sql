-- Cast 설정 반영 이력 일련번호를 시퀀스 대신 MAX + 1 로 채번한다 (CastConfigMapper.retrieveAplyHstrySn · retrieveAplySetSn).
-- 백엔드 배포 후에 적용한다. 먼저 지우면 배포 전 서버의 운영 반영이 실패한다.

DROP SEQUENCE PMOWN.SQ1_TN_PM_SMLT_ATRB_APLY;
DROP SEQUENCE PMOWN.SQ1_TN_PM_SMLT_ATRB_APLY_SET;
