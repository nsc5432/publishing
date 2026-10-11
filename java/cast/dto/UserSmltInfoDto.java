package aoms.pm.cast.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserSmltInfoDto extends JsonResponse {
    private static final long serialVersionUID = 1L;
    private String ymd;
    private String saveDt;
    private String smltFlfmtSttsCd;
}
