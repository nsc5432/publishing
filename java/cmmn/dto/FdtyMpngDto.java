package aoms.pm.cmmn.dto;                                                        
                                                                                   
import aoms.framework.cmmn.dto.AomsDefaultDto;

import lombok.Getter;
import lombok.Setter;                                                              
                                                                                   
/**                                                                                
* @Classname   : FdtyMpngDto.java                                            
* @Description : undefined DTO                                             
*                                                                                  
* @Copyright (c) 인천국제공항 통합정보시스템 아시아나IDT 컨소시엄 All right reserved.          
* <pre>                                                                            
* ---------------------------------------------------------------------------------
* Modification Information                                                         
* ---------------------------------------------------------------------------------
* 수정일 / 수정자 / 수정내용                                                             
* 2025. 09. 09 / 이순영 / 최초작성                                                    
* ---------------------------------------------------------------------------------
*                                                                                  
* </pre>                                                                           
*/                                                                                 
@Getter                                                                            
@Setter                                                                            
public class FdtyMpngDto extends AomsDefaultDto {                                  
    private static final long serialVersionUID = 1L;                           

	private int rowCntPerPg = 30;

	private int curPgNo = 1;

	private int totRowCnt = 0;

	private int rowNo = 0;
	private String cudFlag;
	private String fcltySn;
	private String bgngDt;
	private String endDt;
	private String lclsfNm;
	private String mclsfNm;
	private String sclsfNm;
	private String tmnlId;
	private String flrInfo;
	private String rgnSe;
	private String expsrYn;
	private String imgrSe;
	private String fcltNm;
	private String fcltNmEng;
	private String fcltNmJpntx;
	private String fcltNmChntx;
	private String lctnExpln;
	private String lctnExplnEng;
	private String lctnExplnJpntx;
	private String lctnExplnChntx;
	private String mainGds;
	private String mainGdsEng;
	private String mainGdsJpntx;
	private String mainGdsChntx;
	private String fcltExpln;
	private String fcltExplnEng;
	private String fcltExplnJpntx;
	private String fcltExplnChntx;
	private String telnoInfo;
	private String operBgngHm;
	private String operEndHm;
	private String whdOperYn;
	private String thmbStrgFileNm;
	private String thmbExpln;
	private String imgStrgFileNm1;
	private String imgExpln1;
	private String imgStrgFileNm2;
	private String imgExpln2;
	private String imgStrgFileNm3;
	private String imgExpln3;
	private String cdntLat;
	private String cdntLng;
	private String shopTy;
	private String nodeId;
	private String lclsfId;
	private String mclsfId;
	private String sclsfId;
	private String brandNm;
	private String brandNmEng;
	private String brandNmChn;
	private String brandNmJpn;
	private String addOprtngTm;
	private String addOprtngTmEng;
	private String addOprtngTmChn;
	private String addOprtngTmJpn;
	private String smltGroupCd;
	private String fcltGroupCd;
	private String castSmltCd;
	private String useYn;
}