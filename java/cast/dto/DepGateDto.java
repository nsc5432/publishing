package aoms.pm.cast.dto;

import java.util.List;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DepGateDto {
	private String depNum; // 출국장 번호
	private String depNm; // 출국장 표시명
	private String oprYn; // 사용 / 미사용
	private int scCnt; // 검색대 대수 (피크 기준)
	private int normalCnt; // 일반 검색대 대수 (원천 미확보, 항상 0)
	private int smartPassCnt; // 스마트패스 검색대 대수 (원천 미확보, 항상 0)
	private List<OprTimeDto> oprTimeList; // 출국장 운영시간 구간
	private List<ScPlanDto> planList; // 보안검색대 운영계획 구간
}
