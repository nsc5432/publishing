package aoms.pm.cmmn.dto;

import java.math.BigDecimal;

import aoms.framework.cmmn.dto.AomsDefaultDto;

import lombok.Getter;
import lombok.Setter;

/**
* @Classname   : ChknCtrAltmntInfoDto.java
* @Description : 체크인카운터배정정보 DTO
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
public class CknctAltmntInfoDto extends AomsDefaultDto {
    private static final long serialVersionUID = 1L;

	private int rowCntPerPg = 30;

	private int curPgNo = 1;

	private int totRowCnt = 0;

	private int firstRow = 0;

	private int lastRow = 0;

	public void setPageInfo() {
		this.firstRow = (this.curPgNo - 1) * this.rowCntPerPg + 1;
		this.lastRow = (this.curPgNo - 1) * this.rowCntPerPg + this.rowCntPerPg;
	}

	private int rowNo						= 0;
    private String chk                      = "";	/** chk **/  
    private String sysId                    = "";	/** 시스템아이디 **/
    private String msgId                    = "";	/** 메시지아이디 **/
    private String msgDt                    = "";	/** 메시지수신일시 **/
    private String msgType                  = "";	/** 메시지유형 **/
    private BigDecimal alotSn               = BigDecimal.ZERO;	/** 할당일련번호 **/
    private BigDecimal altmntSn             = BigDecimal.ZERO;	/** 배정일련번호 **/
    private String operYmd                  = "";	/** 운영일자 **/
    private String dowCd                    = "";	/** 요일코드 **/
    private String tmnlId                   = "";	/** 터미널아이디 **/
    private String chknCtrId                = "";	/** 체크인카운터아이디 **/
    private String chknHdlrCd               = "";	/** 체크인조업사코드 **/
    private String alnCd                    = "";	/** 항공사코드 **/
    private String estBgngHm                = "";	/** 예상시작시분 **/
    private String estEndHm                 = "";	/** 예상종료시분 **/
    private String estRonHm                 = "";	/** 예상철야시분 **/
    private String chknCtrSttsCd            = "";	/** 체크인카운터상태코드 **/
    private String lastBgngHm               = "";	/** 최종시작시분 **/
    private String lastEndHm                = "";	/** 최종종료시분 **/
    private String lastRonHm                = "";	/** 최종철야시분 **/
    private String domIntlSeCd              = "";	/** 국내국제구분코드 **/
    private String chknTypeCd               = "";	/** 체크인유형코드 **/
    private String mstrFltnm                = "";	/** 마스터운항편명 **/
    private String cshrFltshList            = "";	/** 코드쉐어운항편목록 **/
    private String chknPgeNo                = "";	/** 체크인페이지번호 **/
    private String addChknPgeNo             = "";	/** 추가체크인페이지번호목록 **/
    private String exprsSntencCd            = "";	/** 표출문장코드 **/
    private String exprsSntencCn            = "";	/** 표출문장내용 **/
    private String etcSntencCn              = "";	/** 기타문장내용 **/
    private String engEtcSntencCn           = "";	/** 영문기타문장내용 **/
    private String jpntxEtcSntencCn         = "";	/** 일문기타문장내용 **/
    private String chntxEtcSntencCn         = "";	/** 중문기타문장내용 **/
    private String useYn                    = "";	/** 사용여부 **/
    private String earlyChknYn              = "";	/** 조기체크인여부 **/
    private String moniNm                   = "";	/** 모니터명 **/
    private String rsvtField1               = "";	/** 예약필드1 **/
    private String rsvtField2               = "";	/** 예약필드2 **/
    private String rsvtField3               = "";	/** 예약필드3 **/
    private String rsvtField4               = "";	/** 예약필드4 **/
    private int cnt                         = 0;	/** 중복체크 **/
}