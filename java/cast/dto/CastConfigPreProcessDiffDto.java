package aoms.pm.cast.dto;

import java.util.ArrayList;
import java.util.List;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CastConfigPreProcessDiffDto extends JsonResponse {
	private static final long serialVersionUID = 1L;

	private String sheetNm;
	/** 비교 대상 값 컬럼 — 지금은 INPT_VL 하나다 */
	private String valueColumn;
	private String valueLabel;
	private int changedCnt;
	private List<CastConfigPreProcessRowDto> rowList = new ArrayList<>();
	/** 전처리 결과 그룹의 이름·갱신시각. step5_save.py 가 '전처리 결과 (260212-260218)' 로 갱신한다 */
	private String preProcessNm;
	private String preProcessDt;
}
