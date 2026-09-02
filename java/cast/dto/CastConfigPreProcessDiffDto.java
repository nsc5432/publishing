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
	/** 비교 대상 값 컬럼. 시트마다 개수가 다르다 — 체크인유형은 비율 3열이다 */
	private List<String> valueColumnList = new ArrayList<>();
	/** valueColumnList 와 같은 순서의 화면 라벨 */
	private List<String> valueLabelList = new ArrayList<>();
	private int changedCnt;
	private List<CastConfigPreProcessRowDto> rowList = new ArrayList<>();
	/** 전처리 결과 그룹의 이름·갱신시각. step5_save.py 가 '전처리 결과 (260212-260218)' 로 갱신한다 */
	private String preProcessNm;
	private String preProcessDt;
}
