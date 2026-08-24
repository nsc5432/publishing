package aoms.pm.cast.dto;

import lombok.Getter;
import lombok.Setter;

/** 사용자 시뮬레이션 운항/여객 조정 헤더 (TN_PM_SMLT_USER_FLT_PSG). */
@Getter
@Setter
public class UserFltPsgRawDto {
	private String adjTypeCd;
	private int adjRate;
}
