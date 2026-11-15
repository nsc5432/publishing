package aoms.pm.cast.dto;

import lombok.Getter;
import lombok.Setter;

/** 혼잡해소 팝업 시간축 차트의 10분 유입 — 해소 예측에 넣은 값 */
@Getter
@Setter
public class FcltQueueArvlDto {
	private String secEndDt; // 10분 구간 끝 yyyyMMddHHmmss. 구간은 [secEndDt-10분, secEndDt)
	private Double arvlPsgCnt; // 구간 유입 (명, 반올림 전)
}
