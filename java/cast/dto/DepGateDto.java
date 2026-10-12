package aoms.pm.cast.dto;

import java.util.List;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DepGateDto {
	private String dptgtNo;
	private String dptgtNm;
	private String oprYn;
	private int scshCntom; // 출국장별 최종 보안검색대 수량. 시간 구분 없이 SC 리소스로 나간다
	private int gnrlSrchCntom;
	private int smartPassSrchCntom;
	private List<OprTimeDto> oprTimeList;
}
