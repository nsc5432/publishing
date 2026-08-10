package aoms.pm.cast.dto;

import java.util.List;

import lombok.Getter;
import lombok.Setter;

/** 표준 / 사용자 이력을 한 번에 내려준다 — 화면이 좌우로 나란히 보여주기 때문이다 */
@Getter
@Setter
public class SmltExecListDto extends JsonResponse {
	private static final long serialVersionUID = 1L;

	private List<SmltCastExecDto> stdList; // 표준(일일) 시뮬레이션
	private List<SmltCastExecDto> userList; // 사용자 시뮬레이션
}
