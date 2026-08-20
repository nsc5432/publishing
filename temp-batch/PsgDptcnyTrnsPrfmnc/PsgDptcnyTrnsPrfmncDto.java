package batch;

import java.time.LocalDateTime;

import lombok.Getter;
import lombok.Setter;

/**
 * TN_PM_PSG_DPTCNY_TRNS_PRFMNC(여객출국환승실적) Upsert 대상 1행.
 * PK: totDt, tmnlId, psgFcltCd, fltnm
 */
@Getter
@Setter
public class PsgDptcnyTrnsPrfmncDto {
    private LocalDateTime totDt; // 집계일시 (1시간 단위)
    private String tmnlId; // 터미널아이디 (P01/P03)
    private String psgFcltCd; // 여객시설코드 (D1~D6 / D1~D2)
    private String fltnm; // 운항편명
    private int bdpsgPrcsCnt; // 탑승객처리수
}
