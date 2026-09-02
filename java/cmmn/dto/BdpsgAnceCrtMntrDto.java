package aoms.pm.cmmn.dto;

import aoms.framework.cmmn.dto.AomsDefaultDto;

import lombok.Getter;
import lombok.Setter;

/**
 * @Classname : BdpsgAnceCrtMntrDto.java
 * @Description : 승객 예고 생성 모니터링 DTO
 *
 * @Copyright (c) 인천국제공항 통합정보시스템 아시아나IDT 컨소시엄 All right reserved.
 * <pre>
 * -----------------------------------------------------------------------------------
 * Modification Information
 * -----------------------------------------------------------------------------------
 * 수정일 / 수정자 / 수정내용
 * 2025. 5. 16. / 임소정 / 최초작성 
 * -----------------------------------------------------------------------------------
 * 
 * </pre> 
 */
@Getter
@Setter
public class BdpsgAnceCrtMntrDto extends AomsDefaultDto {

	private static final long serialVersionUID = 1L;

    //승객예고 일자
    private String bdpsgAnceYmd = "";
    //조회 건수
    private String displayRows = "";
    //조회 조건
    private String displayItem = "";
    
    private String btchSn = "";
    
    private String btchExcnSeq = "";
    
    private String btchBgngDt = "";
    
    private String btchPrcsDt = "";
    
    private String btchCmptnDt = "";
    
    private String bdpsgAnceBtchExcnSttsCd = "";
    
    private String errMsgCn = "";
    
    private String lastBdpsgAnceStepSeCd = "";
    
    private String bdpsgAnceStepSeCd = "";
}
