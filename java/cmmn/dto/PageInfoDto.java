package aoms.pm.cmmn.dto;

import aoms.framework.cmmn.dto.AomsDefaultDto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PageInfoDto extends AomsDefaultDto {
	private static final long serialVersionUID = 1L;
	
	// 페이지당 로우갯수
	private int rowCntPerPage;
	// 현재 페이지
	private int curPage; 
	// 전체갯수
    private int totalRowCnt;
}
