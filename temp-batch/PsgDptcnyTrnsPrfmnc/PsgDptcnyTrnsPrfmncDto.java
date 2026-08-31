package batch;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PsgDptcnyTrnsPrfmncDto {
    private String totYmd;
    private String totTm;
    private String totMnt;
    private String tmnlId;
    private String psgFcltCd;
    private String fltnm;
    private int bdpsgPrcsCnt;
}
