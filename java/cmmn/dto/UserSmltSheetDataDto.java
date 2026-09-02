package aoms.pm.cmmn.dto;

import aoms.framework.cmmn.dto.AomsDefaultDto;

import lombok.Getter;
import lombok.Setter;

/**
* @Classname   : DalySmltChartDataDto.java
* @Description : undefined DTO
*
* @Copyright (c) 인천국제공항 통합정보시스템 아시아나IDT 컨소시엄 All right reserved.
* <pre>
* ---------------------------------------------------------------------------------
* Modification Information
* ---------------------------------------------------------------------------------
* 수정일 / 수정자 / 수정내용
* 2025. 09. 12 / 이순영 / 최초작성
* ---------------------------------------------------------------------------------
*
* </pre>
*/
@Getter
@Setter
public class UserSmltSheetDataDto extends AomsDefaultDto {
    private static final long serialVersionUID = 1L;

    private String hrMnt                    = "";	/** 시간 **/  
    private String leftRightSe              = "";	/** 좌우구분 **/
    private String chknCtr                  = "";	/** 체크인카운터 **/
    private String trnstWtngRslt            = "";	/** 처리대기인원 **/
}