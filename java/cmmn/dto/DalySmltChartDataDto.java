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
public class DalySmltChartDataDto extends AomsDefaultDto {
    private static final long serialVersionUID = 1L;

    private String hr                       = "";	/** 시간 **/  
    private String nope                     = "";	/** 인원수 **/
    private String nopeOld                  = "";	/** 대기인원(과거) **/
    private String nopePrvWek               = "";	/** 대기인원(전주 동요일) **/
    private String nopeNow                  = "";	/** 대기인원(현재) **/
    private String nopeTomr                 = "";	/** 대기인원(내일) **/
    private String nopeTrnst                = "";	/** 처리인원 **/
}