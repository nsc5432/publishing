package aoms.pm.cmmn.dto;

import aoms.framework.cmmn.dto.AomsDefaultDto;

import lombok.Getter;
import lombok.Setter;

/**
* @Classname   : FcltyInfoDto.java
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
public class FcltyInfoDto extends AomsDefaultDto {

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

    private String sysId                    = "";	/** 시스템아이디 **/
    private String msgId                    = "";	/** 메시지아이디 **/
    private String msgDt                    = "";	/** 메시지수신일시 **/
    private String msgType                  = "";	/** 메시지유형 **/
    private String msgCrtDt                 = "";	/** 메시지생성일시 **/
    private String fcltySn                  = "";	/** 시설물일련번호 **/
    private String lclsfNm                  = "";	/** 대분류명 **/
    private String mclsfNm                  = "";	/** 중분류명 **/
    private String sclsfNm                  = "";	/** 소분류명 **/
    private String tmnlId                   = "";	/** 터미널아이디 **/
    private String flrInfo                  = "";	/** 층정보 **/
    private String rgnSe                    = "";	/** 지역구분 **/
    private String expsrYn                  = "";	/** 노출여부 **/
    private String defarrSeCd               = "";	/** 출입국구분 **/
    private String fcltNm                   = "";	/** 시설명 **/
    private String fcltNmEng                = "";	/** 시설명영문 **/
    private String fcltNmJpntx              = "";	/** 시설명일문 **/
    private String fcltNmChntx              = "";	/** 시설명중문 **/
    private String pstnExpln                = "";	/** 위치설명 **/
    private String pstnExplnEng             = "";	/** 위치설명영문 **/
    private String pstnExplnJpntx           = "";	/** 위치설명일문 **/
    private String pstnExplnChntx           = "";	/** 위치설명중문 **/
    private String mainGds                  = "";	/** 주요상품 **/
    private String mainGdsEng               = "";	/** 주요상품영문 **/
    private String mainGdsJpntx             = "";	/** 주요상품일문 **/
    private String mainGdsChntx             = "";	/** 주요상품중문 **/
    private String fcltExpln                = "";	/** 시설설명 **/
    private String fcltExplnEng             = "";	/** 시설설명영문 **/
    private String fcltExplnJpntx           = "";	/** 시설설명일문 **/
    private String fcltExplnChntx           = "";	/** 시설설명중문 **/
    private String telno                    = "";	/** 전화번호 **/
    private String operBgngHm               = "";	/** 운영시작시분 **/
    private String operEndHm                = "";	/** 운영종료시분 **/
    private String alldayOperYn             = "";	/** 종일운영여부 **/
    private String thmbStrgFileNm           = "";	/** 썸네일저장파일명 **/
    private String thmbExpln                = "";	/** 썸네일설명 **/
    private String imgStrgFileNm1           = "";	/** 이미지저장파일명1 **/
    private String imgExpln1                = "";	/** 이미지설명1 **/
    private String imgStrgFileNm2           = "";	/** 이미지저장파일명2 **/
    private String imgExpln2                = "";	/** 이미지설명2 **/
    private String imgStrgFileNm3           = "";	/** 이미지저장파일명3 **/
    private String imgExpln3                = "";	/** 이미지설명3 **/
    private String lat                      = "";	/** 위도 **/
    private String lot                      = "";	/** 경도 **/
    private String shopType                 = "";	/** 매장유형 **/
    private String nodeId                   = "";	/** 교점아이디 **/
    private String rcptnDt                  = "";	/** 수신일시 **/
    private String trrcStts                 = "";	/** 전송상태 **/
    private String trrcSttsMemo             = "";	/** 전송상태메모 **/
    private String frstRgtrId               = "";	/** 최초등록자아이디 **/
    private String frstRgtrIpAddr           = "";	/** 최초등록자IP주소 **/
    private String frstRegDt                = "";	/** 최초등록일시 **/
    private String lastMdfrId               = "";	/** 최종수정자아이디 **/
    private String lastMdfrIpAddr           = "";	/** 최종수정자IP주소 **/
    private String lastMdfcnDt              = "";	/** 최종수정일시 **/

}
