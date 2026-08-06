package aoms.pm.cast.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ScPlanDto {
	private int planSn; // 행 일련번호 (신규 행 0)
	private int bgnHour; // 구간 시작 (0~24)
	private int endHour; // 구간 종료 (0~24)
	private int scCnt; // 그 구간 검색대 갯수

	public ScPlanDto withPlanSn(int planSn) {
		this.planSn = planSn;
		return this;
	}

	public ScPlanDto withBgnHour(int bgnHour) {
		this.bgnHour = bgnHour;
		return this;
	}

	public ScPlanDto withEndHour(int endHour) {
		this.endHour = endHour;
		return this;
	}

	public ScPlanDto withScCnt(int scCnt) {
		this.scCnt = scCnt;
		return this;
	}
}
