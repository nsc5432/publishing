package aoms.pm.cast.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import lombok.Getter;
import lombok.Setter;

/**
 * @Classname : FcltWtngRsltDto.java
 * @Description : TN_PM_SMLT_FCLT_WTNG_RSLT 행. 내부 저장 / 조회 전용이며 API 응답으로 내보내지 않는다
 *
 * @Copyright (c) 인천국제공항 통합정보시스템 아시아나IDT 컨소시엄 All right reserved.
 * <pre>
 * -----------------------------------------------------------------------------------
 * Modification Information
 * -----------------------------------------------------------------------------------
 * 수정일 / 수정자 / 수정내용
 * 2026. 10. 24. / 노세찬 / 최초작성
 * -----------------------------------------------------------------------------------
 *
 * </pre>
 */
@Getter
@Setter
public class FcltWtngRsltDto {
	private String smltId;
	private int smltMdlSn;
	private String tmnlId;
	private String fcltTypeCd;
	private String fcltUnitCd;
	private LocalDateTime secBgngDt;
	private Integer endWtngPsgCnt;
	private int prcsPsgCnt;
	private BigDecimal wtngPsecSum;
	private int wtngVldPsgCnt;
	private BigDecimal prcsPsecSum;
	private int prcsVldPsgCnt;
	private long wtngPsgCntSum;
	private int wtngNocs;
	private Integer maxWtngPsgCnt;
	private Integer endOperCntom;
	private Long prcsCpct;
	private Long prcsVldOperCntomSum;
	private String obsrvnYn;
}
