package aoms.pm.cast.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserDto extends JsonResponse {
	private static final long serialVersionUID = 1L;

	private String userId;
	private String deptCd;
    private String userNm;
    private String deptNm;
}
