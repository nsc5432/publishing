package aoms.pm.cmmn.dto;

import aoms.framework.cmmn.dto.AomsDefaultDto;

import lombok.Getter;
import lombok.Setter;

/**
* @Classname   : SmltRptTimeGroupSearchDto.java
* @Description : undefined DTO
*
* @Copyright (c) 인천국제공항 통합정보시스템 아시아나IDT 컨소시엄 All right reserved.
* <pre>
* ---------------------------------------------------------------------------------
* Modification Information
* ---------------------------------------------------------------------------------
* 수정일 / 수정자 / 수정내용
* 2026. 08. 13 / 아이유 / 최초작성
* ---------------------------------------------------------------------------------
*
* </pre>
*/
@Getter
@Setter
public class SmltRptTimeGroupSearchDto extends AomsDefaultDto {

    private static final long serialVersionUID = 1L;

    private String rptStngAtrbId            = "";	/**  **/
    private String rptStngAtrbNm            = "";	/**  **/
    private String prcsSttsCd               = "";	/**  **/
    private String cfmtnYn                  = "";	/**  **/
    private String useYn                    = "";	/**  **/
    private int schdlHr                     = 0;	/**  **/
    private String groupNm                  = "";	/**  **/

    private int cnt                         = 0;	/** 중복체크 **/

}
