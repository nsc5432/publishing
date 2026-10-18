package aoms.pm.cast.dto;

import java.util.ArrayList;
import java.util.List;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CastConfigGridRowDto {
	private int rowNo;
	/** 표시값(코드명)은 여러 속성코드가 공유하므로 합계 검증·병합은 이 원본 코드로 묶는다 */
	private String atrbCd;
	private List<CastConfigGridCellDto> cellList = new ArrayList<>();
}
