package aoms.pm.cast.dto;

import java.util.ArrayList;
import java.util.List;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CastConfigPreProcessRowDto {
	/** 격자와 같은 행 번호 — applyPreProcess 의 rowNoList 가 이 값을 쓴다 */
	private int rowNo;
	private String atrbCd;
	private String dtlSeCd;
	private String atrbCdNm;
	private String dtlSeCdNm;
	/** 두 목록 모두 diff 의 valueColumnList 와 같은 순서·길이다 */
	private List<String> baseVlList = new ArrayList<>();
	private List<String> preVlList = new ArrayList<>();
	private String changedYn;
	/** N = 전처리 결과에 대응 행이 없다 (적용 대상에서 뺀다) */
	private String matchedYn;
}
