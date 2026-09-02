package aoms.pm.cmmn.dto;                                                        
                                                                                   
import java.math.BigDecimal;

import aoms.framework.cmmn.dto.AomsDefaultDto;

import lombok.Getter;
import lombok.Setter;                                                              
                                                                                   
/**                                                                                
* @Classname   : FltDataDto.java                                            
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
public class FltDataDto extends AomsDefaultDto {                            
                                                                                   
    private static final long serialVersionUID = 1L;                           

	private int rowCntPerPg = 30;

	private int curPgNo = 1;

	private int totRowCnt = 0;

	private int rowNo						= 0;
    private String fltshId                  = "";	/** 운항편아이디 **/
    private String gdSeYmd                  = "";	/** 입출항보고서구분일자 **/
    private String ddlnFln                  = "";	/** 마감운항번호 **/
    private String arrDepSeCd               = "";	/** 도착출발구분코드 **/
    private String alnCd                    = "";	/** 항공사코드 **/
    private String ddlnFltnm                = "";	/** 마감운항편명 **/
    private String mmSeVl                   = "";	/** 월구분값 **/
    private BigDecimal ddlnFltSn            = BigDecimal.ZERO;	/** 마감운항일련번호 **/
    private String dowCd                    = "";	/** 요일코드 **/
    private String schdlHm                  = "";	/** 일정시분 **/
    private String mstrFltnm                = "";	/** 마스터운항편명 **/
    private String arptCd                   = "";	/** 공항코드 **/
    private String predcYmd                 = "";	/** 예측일자 **/
    private String predcHm                  = "";	/** 예측시분 **/
    private String fltYn                    = "";	/** 운항여부 **/
    private String domIntlSeCd              = "";	/** 국내국제구분코드 **/
    private String gdIrrYn                  = "";	/** 입출항보고서부정기여부 **/
    private String gdFltPrpsCd              = "";	/** 입출항보고서운항목적코드 **/
    private String actlYmd                  = "";	/** 실제일자 **/
    private String actlHm                   = "";	/** 실제시분 **/
    private String tmnlId                   = "";	/** 터미널아이디 **/
    private String gateNo                   = "";	/** 게이트번호 **/
    private String acstNo                   = "";	/** 주기장번호 **/
    private String onbHm                    = "";	/** 접현시분 **/
    private String ofbHm                    = "";	/** 이현시분 **/
    private String cshrSttsCd               = "";	/** 코드쉐어상태코드 **/
    private String rwyNo                    = "";	/** 활주로번호 **/
    private String tmprArptCd               = "";	/** 임시공항코드 **/
    private String arcftUseSeCd             = "";	/** 항공기사용구분코드 **/
    private String lkfltNm                  = "";	/** 연결편명 **/
    private String fryYn                    = "";	/** 페리여부 **/
    private String psgCgoSeCd               = "";	/** 여객화물구분코드 **/
    private String inptYn                   = "";	/** 입력여부 **/
    private BigDecimal newInspVl            = BigDecimal.ZERO;	/** 신규검사값 **/
    private String lkfltYmd                 = "";	/** 연결편일자 **/
    private String crslNo                   = "";	/** 캐로셀번호 **/
    private String tkfLndgBlckDt            = "";	/** 이륙착륙블록일시 **/
    private String fltSrvcTypeCd            = "";	/** 운항서비스유형코드 **/
    private String dlyRsnCd                 = "";	/** 지연사유코드 **/
    private String avtnStatsFltDlyRsnCd     = "";	/** 항공통계운항지연사유코드 **/
    private String dvrtAcstNo               = "";	/** 회항주기장번호 **/
    private String aprEtryHm                = "";	/** 계류장진입시분 **/
    private String aprOutHm                 = "";	/** 계류장진출시분 **/
    private String aprEtryOutDt             = "";	/** 계류장진입진출일시 **/
    private String fltAltd                  = "";	/** 운항고도 **/
    private String cptNm                    = "";	/** 기장명 **/
    private BigDecimal rsvtBdpsgCnt         = BigDecimal.ZERO;	/** 예약탑승객수 **/
    private BigDecimal rsvtTrnsBdpsgCnt     = BigDecimal.ZERO;	/** 예약환승탑승객수 **/
    private BigDecimal domTrnsTnobp         = BigDecimal.ZERO;	/** 국내환승총탑승객수 **/
    private BigDecimal intlTrnsTnobp        = BigDecimal.ZERO;	/** 국제환승총탑승객수 **/
    private BigDecimal pfrBrdgTnope         = BigDecimal.ZERO;	/** 유임탑승총인원수 **/
    private BigDecimal freeBrdgTnope        = BigDecimal.ZERO;	/** 무임탑승총인원수 **/
    private BigDecimal trnsBrdgTnope        = BigDecimal.ZERO;	/** 환승탑승총인원수 **/
    private BigDecimal cgoSumWt             = BigDecimal.ZERO;	/** 화물합계중량 **/
    private BigDecimal bagSumWt             = BigDecimal.ZERO;	/** 수하물합계중량 **/
    private BigDecimal pstmtSumWt           = BigDecimal.ZERO;	/** 우편물합계중량 **/
    private BigDecimal tshmtCgoSumWt        = BigDecimal.ZERO;	/** 환적화물합계중량 **/
    private BigDecimal bagTnocs             = BigDecimal.ZERO;	/** 수하물총건수 **/
    private String errOcrnYn                = "";	/** 오류발생여부 **/
    private String errRsnCn                 = "";	/** 오류사유내용 **/
    private String arcftTypeCd              = "";	/** 항공기유형코드 **/
    private String msgSeCd                  = "";	/** 메시지구분코드 **/
    private String arcftRegNo               = "";	/** 항공기등록번호 **/
    private String fltnm                    = "";	/** 운항편명 **/
    private String dlyRsnOcrnArptSeCd       = "";	/** 지연사유발생공항구분코드 **/
    private BigDecimal trnstBdpsgCnt        = BigDecimal.ZERO;	/** 통과탑승객수 **/
    private String arcftSubtypeCd           = "";	/** 항공기상세유형코드 **/
    private BigDecimal arcftStgcp           = BigDecimal.ZERO;	/** 항공기좌석수 **/
    private BigDecimal loadSumWt            = BigDecimal.ZERO;	/** 적재합계중량 **/
    private BigDecimal tkfWt                = BigDecimal.ZERO;	/** 이륙중량 **/
    private BigDecimal pyldVl               = BigDecimal.ZERO;	/** 유상하중값 **/
    private String tdfltYn                  = "";	/** 환승전용내항기여부 **/
    private String lcrftYn                  = "";	/** 경항공기여부 **/
    private String foisFltInfoId            = "";	/** FOIS운항정보아이디 **/
    private String alnIcaoCd                = "";	/** 항공사ICAO코드 **/
    private BigDecimal crewTnope            = BigDecimal.ZERO;	/** 승무원총인원수 **/
    private BigDecimal domplCrewTnope       = BigDecimal.ZERO;	/** 내국인승무원총인원수 **/
    private BigDecimal frgnrCrewTnope       = BigDecimal.ZERO;	/** 외국인승무원총인원수 **/
    private BigDecimal trnstCgoSumWt        = BigDecimal.ZERO;	/** 통과화물합계중량 **/
    private String mstrFltshId              = "";	/** 마스터운항편아이디 **/
    private String lkfltId                  = "";	/** 연결편아이디 **/
    private String dvrtYn                   = "";	/** 회항여부 **/
    private String dvrtSeCd                 = "";	/** 회항구분코드 **/
    private String dvrtTypeCd               = "";	/** 회항유형코드 **/
    private String dvrtRsnCd                = "";	/** 회항사유코드 **/
    private String dvrtArptCd               = "";	/** 회항공항코드 **/
    private BigDecimal dvrtNmtm             = BigDecimal.ZERO;	/** 회항횟수 **/
    private String dlyYn                    = "";	/** 지연여부 **/
    private String fltCnlYn                 = "";	/** 운항취소여부 **/
    private String fltCnlRsnCd              = "";	/** 운항취소사유코드 **/
    private String fltCnlArptCd             = "";	/** 운항취소공항코드 **/
    private String frstRgtrId               = "";	/** 최초등록자아이디 **/
    private String frstRgtrIpAddr           = "";	/** 최초등록자IP주소 **/
    private String frstRegDt                = "";	/** 최초등록일시 **/
    private String lastMdfrId               = "";	/** 최종수정자아이디 **/
    private String lastMdfrIpAddr           = "";	/** 최종수정자IP주소 **/
    private String lastMdfcnDt              = "";	/** 최종수정일시 **/
    private String cknctRangeCn				= "";	/** 체크인카운터할당 **/

}
