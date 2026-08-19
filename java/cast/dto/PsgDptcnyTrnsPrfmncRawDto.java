package aoms.pm.cast.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PsgDptcnyTrnsPrfmncRawDto {
	private String hour; // 집계시(TOT_DT) HH
	private int prcsPsgCnt; // 시간당 처리인원 합계(BDPSG_PRCS_CNT)
}
