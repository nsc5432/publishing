package aoms.pm.cmmn.dto;

import aoms.framework.cmmn.dto.AomsDefaultDto;

import lombok.Getter;
import lombok.Setter;

/**
 * @Classname : BdpsgAnceSmltCommonDto.java
 * @Description : 승객예고 시뮬레이션 Common Dto
 * 
 * @Copyright (c) 인천국제공항 통합정보시스템 아시아나IDT 컨소시엄 All right reserved.
 * 
 * <pre>
 *                                                                             
* ---------------------------------------------------------------------------------
* Modification Information                                                         
* ---------------------------------------------------------------------------------
* 수정일       / 수정자 / 수정내용                                                             
* 2025. 5. 26 / 김경준 / 최초작성                                                    
* ---------------------------------------------------------------------------------
 * 
 * </pre>
 */
@Getter
@Setter
public class BdpsgAnceSmltCommonDto extends AomsDefaultDto {

    private static final long serialVersionUID = 1L;

    // GD구분일자
    private String gdSeYmd = "";
    // 도착출발구분코드
    private String arrDepSeCd = "";
    // 마감운항일련번호
    private String ddlnFltSn = "";
    // 마감운항편명
    private String ddlnFltnm = "";
    // 마감운항번호
    private String ddlnFln = "";
    // 스케줄시분
    private String schdlHm = "";
    // 실제시분
    private String actlHm = "";
    // 항공사코드
    private String alnCd = "";
    // 월구분값
    private String mmSeVl = "";
    // 요일코드
    private String dowCd = "";
    // 마스터운항식별자명
    private String mstrFltnm = "";
    // 공항코드
    private String arptCd = "";
    // 운항여부
    private String fltYn = "";
    // 국내국제구분코드
    private String domIntlSeCd = "";
    // GD부정기여부
    private String gdIrrYn = "";
    // GD운항목적코드
    private String gdFltPrpsCd = "";
    // 터미널ID
    private String tmnlId = "";
    // 게이트번호
    private String gateNo = "";
    // 주기장번호
    private String acstNo = "";
    // 접현시분
    private String onbHm = "";
    // 이현시분
    private String ofbHm = "";
    // 코드쉐어상태코드
    private String cshrSttsCd = "";
    // 활주로번호
    private String rwyNo = "";
    // 임시공항코드
    private String tmprArptCd = "";
    // 항공기사용구분코드
    private String acUseSeCd = "";
    // 연결운항편명
    private String lkfltnm = "";
    // 페리여부
    private String fryYn = "";
    // 여객화물구분코드
    private String psgCgoSeCd = "";
    // 여자승무원수
    private int femaleCrewCnt = 0;
    // 입력여부
    private String inptYn = "";
    // 신규체크값
    private String newInspVl = "";
    // 캐로셀번호
    private String crslNo = "";
    // 이륙착륙블럭일시
    private String tkfLndgBlckDt = "";
    // 운항서비스유형코드
    private String fltSrvcTypeCd = "";
    // 지연사유코드
    private String dlyRsnCd = "";
    // 항공통계운항지연이유코드
    private String avtnStatsFltDlyRsnCd = "";
    // 회항주기장번호
    private String dvrtAcstNo = "";
    // 계류장진입시분
    private String aprEtryHm = "";
    // 계류장진출시분
    private String aprOutHm = "";
    // 계류장진입진출일시
    private String aprEtryOutDt = "";
    // 운항고도
    private String fltAltd = "";
    // 기장명
    private String cptNm = "";
    // 환적화물수
    private int trnshpCgoCnt = 0;
    // 예약승객수
    private int rsvtBdpsgCnt = 0;
    // 예약환승객수
    private int rsvtTrnsBdpsgCnt = 0;
    // 총국내환승객수
    private int domTrnsTnobp = 0;
    // 총국제환승객수
    private int intlTrnsTnobp = 0;
    // 총유임승객수
    private int pfrBrdgTnope = 0;
    // 총무임승객수
    private int freeBrdgTnope = 0;
    // 총환승객수
    private int trnsBrdgTnope = 0;
    // 총화물중량
    private int cgoSumWt = 0;
    // 총수하물중량
    private int bagSumWt = 0;
    // 총우편물중량
    private int pstmtSumWt = 0;
    // 총환적화물량
    private int totTrnshpCgoQty = 0;
    // 총수하물개수
    private int bagTnocs = 0;
    // 남자승무원수
    private String maleCrewCnt = "";
    // 에러발생여부
    private String errOcrnYn = "";
    // 에러사유내용
    private String errRsnCn = "";
    // 항공기유형코드
    private String arcftTypeCd = "";
    // 메시지구분코드
    private String msgSeCd = "";
    // 항공기등록번호
    private String arcftRegNo = "";
    // 운항편ID
    private String fltshId = "";
    // 최초등록자ID
    private String frstRgtrId = "";
    // 최초등록자IP
    private String frstRgtrIpAddr = "";
    // 최초등록타임스탬프
    private String frstRegDt = "";
    // 최종수정자ID
    private String lastMdfrId = "";
    // 최종수정자IP
    private String lastMdfrIpAddr = "";
    // 최종수정타임스탬프
    private String lastMdfcnDt = "";
    // 에러입력여부
    private String errorInputYn = "";
    // 예측시분
    private String predcHm = "";
    // 항공기상세유형코드
    private String arcftSubtypeCd = "";
    // 통과승객수
    private String trnstPsgCnt = "";
    // 항공기좌석수
    private int arcftStgcp = 0;
    // 총적재중량
    private String loadSumWt = "";
    // 연결운항일자
    private String lkfltYmd = "";
    // 이륙중량
    private String tkfWt = "";
    // 유상하중값
    private String pyldVl = "";
    // 지연사유발생공항구분코드
    private String dlyRsnOcrnArptSeCd = "";

    // 경유지순서
    private String viaOrder = "";
    // 경유지공항코드
    private String viaAptCd = "";
    // 유임승객수
    private int crgPaxCnt = 0;
    // 무임승객수
    private int freePaxCnt = 0;
    // 환승객수
    private int trnsBdpsgCnt = 0;
    // 화물중량
    private int cgoWt = 0;
    // 수하물중량
    private int bagWt = 0;
    // 우편물중량
    private int postmWt = 0;
    // 환적화물중량
    private int trnshpCgoWt = 0;
    // 수하물수
    private int bagCnt = 0;
    // 국내환승객수
    private int domTrbdpsgCnt = 0;
    // 국제환승객수
    private int intTrbdpsgCnt = 0;

    // GD구분시작일자
    private String gdSeYmdFm = "";
    // GD구분종료일자
    private String gdSeYmdTo = "";
    // GD에러순번
    private String errOccurSno = "";
    // 에러발생시간
    private String errOccurTm = "";

    //구분자
    private String dataGbn = "";
    //구분바1
    private String gdGn = "";
    //구분바2
    private String gdLcrft = "";
    //구분바3
    private String gdHe = "";    //대륙구분코드
    private String conSeCd = "";
}