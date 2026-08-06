package aoms.pm.cast.domains;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AggData {
	private String time; // 시간
	private int wtngPsgCnt; // 대기인원
	private int prcsHr; // 처리시간
	private int wtngHr; // 대기시간
}
