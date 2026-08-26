package aoms.pm.cast.dto;

import lombok.Getter;
import lombok.Setter;

/** GOOWN.TN_GO_GD_DATA 운항 요약 1행 — 기준일 / 전일 / 지난주 同요일에 같은 쿼리를 3번 쓴다 */
@Getter
@Setter
public class FltSmryRawDto {
	private int depFltCnt; // 출발 운항편
	private int arrFltCnt; // 도착 운항편
	private int depPsgCnt; // 출발 여객 (명)
	private int arrPsgCnt; // 도착 여객
}
