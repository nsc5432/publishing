package batch;

import lombok.Getter;
import lombok.Setter;

/**
 * TN_PM_PSG_SHOW_INFO(여객출현정보) 원본 1행.
 * PK: psgTrnspYmd, tmnlSeCd, fltnm, alnCd, chknSn
 */
@Getter
@Setter
public class PsgShowInfoDto {
    private String psgTrnspYmd; // 여객운송일자 yyyyMMdd
    private String tmnlSeCd; // 터미널구분코드 (P01/P03)
    private String fltnm; // 운항편명
    private String alnCd; // 항공사코드
    private String chknSn; // 체크인일련번호

    private String trnstIstrId; // 통과기기아이디 (예: ICN1D005DG04)
    private String dptgtEtryYmd; // 출국장진입일자 yyyyMMdd
    private String dptgtEtryHm; // 출국장진입시분 HHmm
}
