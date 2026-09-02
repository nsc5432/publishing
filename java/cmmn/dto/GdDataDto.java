package aoms.pm.cmmn.dto;

import java.math.BigDecimal;

import aoms.framework.cmmn.dto.AomsDefaultDto;

import lombok.Getter;
import lombok.Setter;

/**
 * @Classname : GdDataDto.java
 * @Description : DTO
 * 
 * @Copyright (c) 인천국제공항 통합정보시스템 아시아나IDT 컨소시엄 All right reserved.
 * 
 * <pre>
 *                                                                             
* ---------------------------------------------------------------------------------
* Modification Information                                                         
* ---------------------------------------------------------------------------------
* 수정일       / 수정자 / 수정내용                                                             
* 2025. 05. 15 / 김경준 / 최초작성                                                    
* ---------------------------------------------------------------------------------
 * 
 * </pre>
 */
@Getter
@Setter
public class GdDataDto extends AomsDefaultDto {

	private static final long serialVersionUID = 1L;

	private int rowType;

	// 운항편ID
	private String fltshId = "";
	
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

	// 항공사코드 ICAO
	private String alnIcaoCd = "";

	// 월구분값
	private String mmSeVl = "";

	// 요일코드
	private String dowCd = "";

	// 마스터운항식별자명
	private String mstrFltNm = "";

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
	private int startGateNo = 0;
	private int endGateNo = 0;

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
	private String arcftUseSeCd = "";

	// 연결운항편명
	private String lkfltNm = "";

	// 페리여부
	private String fryYn = "";

	// 여객화물구분코드
	private String psgCgoSeCd = "";

	// 여자승무원수
	private String femaleCrewCnt = "";

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
	private String tshmtCgoCnt = "";

	// 예약승객수
	private int rsvtBdpsgCnt = 0;

	// 예약환승객수
	private int rsvtTrnsBdpsgCnt = 0;

	// 총국내환승객수
	private String domTrnsTnobp = "";

	// 총국제환승객수
	private String intlTrnsTnobp = "";

	// 총유임승객수
	private int pfrBrdgTnope = 0;

	// 총무임승객수
	private int freeBrdgTnope = 0;

	// 총환승객수
	private int trnsBrdgTnope = 0;

	// 총통과승객수
	private int trnstCgoSumWt = 0;

	// 총예약승객수
	private int totRsrvPaxCnt = 0;

	// 총화물중량
	private int cgoSumWt = 0;

	// 총수하물중량
	private int bagSumWt = 0;

	// 총우편물중량
	private int pstmtSumWt = 0;

	// 총환적화물량
	private int tshmtCgoSumWt = 0;

	// 총수하물개수
	private int bagTnocs = 0;

	// 남자승무원수
	private String crewTnope = "";

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
	private String errInptYn = "";

	// 예측시분
	private String predcHm = "";

	// 항공기상세유형코드
	private String arcftSubtypeCd = "";

	// 통과승객수
	private String trnstPsgCnt = "";

	// 항공기좌석수
	private String arcftStgcp = "";

	// 총적재중량
	private BigDecimal loadSumWt = BigDecimal.ZERO.setScale(2);

	// 연결운항일자
	private String lkfltYmd = "";

	// 이륙중량
	private BigDecimal tkfWt = BigDecimal.ZERO.setScale(2);

	// 유상하중값
	private String pyldVl = "";

	// 지연사유발생공항구분코드
	private String dlyRsnOcrnArptSeCd = "";

	// 환승전용내항기여부
	private String tdfltYn = "";

	// 경항공기여부
	private String lcrftYn = "";

	// 경유지순서
	private String stovrSeq = "";

	// 경유지공항코드
	private String stovrArptCd = "";

	// 유임승객수
	private int pfrBdpsgCnt = 0;

	// 무임승객수
	private int freeBdpsgCnt = 0;

	// 환승객수
	private int trnstBdpsgCnt = 0;

	// 화물중량
	private int cgoWt = 0;

	// 수하물중량
	private int bagWt = 0;

	// 우편물중량
	private int pstmtWt = 0;

	// 환적화물중량
	private int tshmtCgoWt = 0;

	// 수하물수
	private int bagCnt = 0;

	// 국내환승객수
	private int domTrnsBdpsgCnt = 0;

	// 국제환승객수
	private int intlTrnsBdpsgCnt = 0;

	// 승객수
	private int trnsBdpsgCnt = 0;

	// GD구분시작일자
	private String bfGdSeYmdFm = "";

	// GD구분종료일자
	private String bfGdSeYmdTo = "";

	// GD구분시작일자
	private String gdSeYmdFm = "";

	// GD구분종료일자
	private String gdSeYmdTo = "";

	// GD에러순번
	private String errOcrnSn = "";

	// 에러발생시간
	private String errOcrnTm = "";

	// tab구분자
	private String tabGbn = "";

	// 구분자
	private String dataGbn = "";

	// 구분바1
	private String gdGn = "";

	// 구분바2
	private String gdLcrft = "";

	// 구분바3
	private String gdHe = "";

	// 에러입력여부
	private String gdErrInYn = "";

	// 김포제출자료요
	// 도착운항편수
	private String arrFltshCnt = "";

	// 출발운항편수
	private String depFltshCnt = "";

	// 도착지연편수
	private String arrDlyCnt = "";

	// 출발지연편수
	private String depDlyCnt = "";

	// 도착결항편수
	private String arrCfltnmtm = "";

	// 출발결항편수
	private String depCfltnmtm = "";

	// 도착공급석
	private String arrSplyCnt = "";

	// 출발공급석
	private String depSplyCnt = "";

	// 도착성인수
	private String arrAdltCnt = "";

	// 출발성인수
	private String depAdltCnt = "";

	// 도착유아수
	private String arrBabyCnt = "";

	// 출발유아수
	private String depBabyCnt = "";

	// 도착환승여객수
	private String arrTrnsBdpsgCnt = "";

	// 출발환승여객수
	private String depTrnsBdpsgCnt = "";

	// 도착화물
	private String arrCgo = "";

	// 출발화물
	private String depCgo = "";

	// 도착수하물
	private String arrBag = "";

	// 출발수하물
	private String depBag = "";

	// 도착우편물
	private String arrPostm = "";

	// 출발우편물
	private String depPostm = "";

	// 시간대
	private String tmZn = "";

	// 도착통과여객
	private String arrTrnstPsgCnt = "";

	// 출발통과여객
	private String depPassPaxCnt = "";

	// 도착통과화물
	private String arrPassCgo = "";

	// 출발통과화물
	private String depPassCgo = "";

	// 총운항횟수
	private int fltshTnocs = 0;

	// 인천도착지연편수
	private int icnArrDlyCnt = 0;

	// 인천출발지연편수
	private int icnDepDlyCnt = 0;

	// 타공항도착지연편수
	private int etcArrDlyCnt = 0;

	// 타공항도착지연편수
	private int etcDepDlyCnt = 0;

	// 인천도착결항편수
	private int icnArrCfltnmtm = 0;

	// 인천도착결항편수
	private int icnDepCfltnmtm = 0;

	// 타공항도착결항편수
	private int etcArrCfltnmtm = 0;

	// 타공항도착결항편수
	private int etcDepCfltnmtm = 0;

	// 편수
	private int intDlyRsnCd = 0;

	// ICAO코드
	private String arcftTypeIcaoCd = "";

	// 훈련비행
	private int trngFlyNg = 0;

	// 기술착륙
	private int sklLndg = 0;

	// 시험비행
	private int exanFlyNg = 0;

	// 전세입출
	private int charEnt = 0;

	// 전세기
	private int charFlt = 0;

	// 비행점검
	private int flyNgInspc = 0;

	// 인원수송
	private int nmprTrans = 0;

	// 해양감시
	private int seaMntr = 0;

	// 수색구조
	private int searhResc = 0;

	// 도로순찰
	private int lanePtrl = 0;

	// 군용기
	private int miliAc = 0;

	// 기타
	private int etcFltCnt = 0;

	// 도착횟수
	private int arrCnt = 0;

	// 출발횟수
	private int depCnt = 0;

	// 총횟수
	private int totCnt = 0;

	// 구분
	private String div = "";

	// 국내도착편수
	private String domArrFltCnt = "";

	// 국내출발편수
	private String domDepFltCnt = "";

	// 국내총편수
	private String domTotFltCnt = "";

	// 국제도착편수
	private String intArrFltCnt = "";

	// 국제출발편수
	private String intDepFltCnt = "";

	// 국제총편수
	private String intTotFltCnt = "";

	// 총도착편수
	private String totArrFltCnt = "";

	// 총출발편수
	private String totDepFltCnt = "";

	// 계획출발시분
	private String planDepHm = "";

	// 실제출발시분
	private String actlTkfHm = "";

	// 계획도착시분
	private String planArrHm = "";

	// 실제도착시분
	private String actlLndgHm = "";

	// 고정익회전익구분코드
	private String fixedRtwgSeCd = "";

	// 통과착륙구분코드
	private String trnstLndgSeCd = "";

	// 소속명
	private String ogdpNm = "";

	// 국가코드
	private String ntnCd = "";

	// 운항경로명
	private String fltPathNm = "";

	// 용도
	private String tmpAcTyCd = "";

	// 원인코드
	private String causeCd = "";

	// 원인도시
	private String causeCity = "";

	// 회항도시
	private String dvrtCity = "";

	// 청사
	private String office = "";

	// 항로
	private String rte = "";

	// beaconCd
	private String trsmCd = "";

	// 교신시간
	private String ctctTm = "";

	// 정보비고
	private String ctrlEc = "";

	// 관제체크
	private String ctrlChk = "";

	// JOIN KEY
	private String jnKey = "";

	// GDKey
	private String gdKey = "";

	// 대륙구분
	private String statsConSeCd = "";

	// 도시코드
	private String ctyCd = "";

	// 경유지구분
	private String via = "";

	// 공항간거리
	private int depArrArptDstn = 0;

	// 공항간시간
	private int depArrArptReqHr = 0;

	// 공항간시간
	private String depArrArptReqHrVal = "";

	// 유상하중값
	private int payld = 0;

	// 첨두월
	private String fstMt = "";

	// 첨두시간
	private String fstTm = "";

	// 첨두년도
	private String gdSeYear = "";

	// 혼잡일
	private String scrDt = "";

	// 혼잡시
	private String scrTm = "";

	// 혼잡출도착
	private String scrArrDep = "";

	// 혼잡승객수
	private int scrPaxCnt = 0;

	// 혼잡화물량
	private int scrCgoWt = 0;

	// 통계년도
	private String sttYr = "";

	// 통계월일
	private String sttMd = "";

	// 통계년월
	private String sttYm = "";

	// 통계월
	private String sttMn = "";

	// 통계일
	private String sttDd = "";

	// 통계일자
	private String sttYmd = "";

	// 통계시간
	private String sttTm = "";

	// 통계시간
	private String sttTm2 = "";

	// 발령코드
	private String appntStepCd1 = "";

	// 운고값
	private String rvrVal1 = "";

	// 이벤트값
	private String evtVal1 = "";

	// 발령코드
	private String appntStepCd2 = "";

	// 운고값
	private String rvrVal2 = "";

	// 이벤트값
	private String evtVal2 = "";

	// 발령코드
	private String appntStepCd3 = "";

	// 운고값
	private String rvrVal3 = "";

	// 이벤트값
	private String evtVal3 = "";

	// 발령코드
	private String appntStepCd4 = "";
	// 운고값
	private String rvrVal4 = "";

	// 이벤트값
	private String evtVal4 = "";

	// 발령코드
	private String appntStepCd5 = "";

	// 운고값
	private String rvrVal5 = "";

	// 이벤트값
	private String evtVal5 = "";

	// 발령일자그룹
	private String eventStmtDttmGroupBy = "";

	// 저시정발령일자
	private String eventStmtDt = "";

	// 저시정발령일자
	private String eventStmtYr = "";

	// 저시정발령일자
	private String eventStmtMn = "";

	// 저시정발령일자
	private String eventStmtDd = "";

	// 저시정발령일자
	private String eventStmtYl = "";

	// 저시정발령일시1
	private String appntDttm1 = "";

	// 저시정발령일2
	private String appntDttm2 = "";

	// 저시정발령일시3
	private String appntDttm3 = "";

	// 저시정발령일시4
	private String appntDttm4 = "";

	// 저시정발령일시5
	private String appntDttm5 = "";

	// 저시정지속시간
	private String arvrLvc1 = "";

	// 저시정지속시간
	private String arvrLvc2 = "";

	// 항공사명
	private String alnNm = "";

	// 공항명
	private String arptNm = "";

	// 출도착상세내역
	private String arrDepDtls = "";

	// 실제승객수
	private String actlPaxCnt = "";

	// 전체승객수
	private String psgTnocs = "";

	// 설,추석 휴일여부
	private String hdayYn = "";

	// 하게기간 여부
	private String ssnYn = "";

	// 외국도착편수
	private String oaptArrFltCnt = "";

	// 외국출발편수
	private String oaptDepFltCnt = "";

	// 응답코드
	private int rtnCd = 0;

	// 운항횟수
	private int fltnmtm = 0;

	// 운항횟수1
	private int fltnmtm1 = 0;

	// 운항횟수2
	private int fltnmtm2 = 0;

	// 편명
	private String fltnm = "";

	// 체크
	private String chk = "";

	// 국제선 도착
	private int intArr = 0;

	// 국제선 출발
	private int intDep = 0;

	// 국제선 계
	private int intSum = 0;

	// 국내선 도착
	private int domArr = 0;

	// 국내선 출발
	private int domDep = 0;

	// 국내선 합계
	private int domSum = 0;

	// 총 도착
	private int totArr = 0;

	// 총 출발
	private int totDep = 0;

	// 총 합계
	private int sumCnt = 0;

	// 운항횟수 도착1
	private int fltnmtmArr1 = 0;

	// 운항횟수 출발1
	private int fltnmtmDep1 = 0;

	// 운항횟수 도착2
	private int fltnmtmArr2 = 0;

	// 운항횟수 출발2
	private int fltnmtmDep2 = 0;

	// 체크
	private String intaptdstn = "";

	// 회항여부
	private String dvrtYn = "";

	// 신규마감운항일련번호
	private String newDdlnFltSn = "";
	
	// 검사항목 (GD에러이력)
	private String inspArtclNm = "";
	
	// 승객예고 일자
	private String bdpsgDate = "";
	
	private int d0DepRsvtBdpsgCnt = 0;
	private int d0DepRsvtTrnsBdpsgCnt = 0;
	private int d0ArrRsvtBdpsgCnt = 0;
	private int d0ArrRsvtTrnsBdpsgCnt = 0;
	private int d0RsvtBdpsgCnt = 0;
	private int d0RsvtTrnsBdpsgCnt = 0;
	private int d1DepRsvtBdpsgCnt = 0;
	private int d1DepRsvtTrnsBdpsgCnt = 0;
	private int d1ArrRsvtBdpsgCnt = 0;
	private int d1ArrRsvtTrnsBdpsgCnt = 0;
	private int d1RsvtBdpsgCnt = 0;
	private int d1RsvtTrnsBdpsgCnt = 0;
	private int d2DepRsvtBdpsgCnt = 0;
	private int d2DepRsvtTrnsBdpsgCnt = 0;
	private int d2ArrRsvtBdpsgCnt = 0;
	private int d2ArrRsvtTrnsBdpsgCnt = 0;
	private int d2RsvtBdpsgCnt = 0;
	private int d2RsvtTrnsBdpsgCnt = 0;
	
	private int keCnt = 0;
	private int ozCnt = 0;
}