package batch;

import java.time.LocalDateTime;

import lombok.Getter;
import lombok.Setter;

/**
 * TN_PM_SCSH_OPER_PRFMNC(보안검색운영실적) Upsert 대상 1행.
 * PK: totDt, tmnlId, dptgtNo
 */
@Getter
@Setter
public class ScshOperPrfmncDto {
    private LocalDateTime totDt; // 집계일시 (1시간 단위)
    private String tmnlId; // 터미널아이디 (P01/P03)
    private String dptgtNo; // 출국장번호 (1~6 / 1~2)
    private int scshOperCntom; // 보안검색운영대수 — 활동 흔적이 있던 레인 수
    private int scshObsrvnCntom; // 보안검색관측대수 — 원천이 행을 내려보낸 전체 레인 수
    private int wtngPsgCnt; // 대기여객수 (명) — 레인별 최대
}
