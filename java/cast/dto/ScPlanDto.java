package aoms.pm.cast.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ScPlanDto {
	private int planSn; // 행 일련번호 (신규 행 0)
	private int operBgngHour; // 구간 시작 (0~24)
	private int operEndHour; // 구간 종료 (0~24)
	private int scshCntom; // 그 구간 검색대 갯수

	public ScPlanDto withPlanSn(int planSn) {
		this.planSn = planSn;
		return this;
	}

	public ScPlanDto withOperBgngHour(int operBgngHour) {
		this.operBgngHour = operBgngHour;
		return this;
	}

	public ScPlanDto withOperEndHour(int operEndHour) {
		this.operEndHour = operEndHour;
		return this;
	}

	public ScPlanDto withScshCntom(int scshCntom) {
		this.scshCntom = scshCntom;
		return this;
	}
}
