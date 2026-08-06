package aoms.pm.cast.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class XovisDto {
	private String time; // HHmm
	private int wtngPsgCnt; // 대기인원
	private int prcsHr; // 처리시간
	private int wtngHr; // 대기시간
}
