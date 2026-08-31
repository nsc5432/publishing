package batch;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ScshOperPlcyDto {
    private String operYmd;
    private int operHour;
    private String tmnlId;
    private String dptgtNo;
    private int scshOperCntom;
}
