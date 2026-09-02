package aoms.pm.cmmn.dto;

import aoms.framework.cmmn.dto.AomsDefaultDto;

import lombok.Getter;
import lombok.Setter;

/**
 * @Classname : BdpsgAnceShtrnSmltDto.java
 * @Description : 승객예고셔틀트레인시뮬레이션Dto
 *
 * @Copyright (c) 인천국제공항 통합정보시스템 아시아나IDT 컨소시엄 All right reserved.
 * <pre>
 * -----------------------------------------------------------------------------------
 * Modification Information
 * -----------------------------------------------------------------------------------
 * 수정일 / 수정자 / 수정내용
 * 2025. 5. 26. / 김경준 / 최초작성 
 * -----------------------------------------------------------------------------------
 * 
 * </pre> 
 */
@Getter
@Setter
public class BdpsgAnceShtrnSmltDto extends AomsDefaultDto {

	private static final long serialVersionUID = 1L;

	// GD구분일자
	private String gdSeYmd = "";

	// 접현시분
	private String onbHm = "";

	// 동편 5분 승객수
	private int east5MiBdpsgCnt = 0;

	// 동편 10분 승객수
	private int east10MiBdpsgCnt = 0;

	// 서편 5분 승객수
	private int west5MiBdpsgCnt = 0;

	// 서편 10분 승객수
	private int west10MiBdpsgCnt = 0;

	// 승객수
	private int bdpsgCnt = 0;

	// 기준시각
	private String baseTm = "";

	// 동편 승객수
	private int eastBdpsgCnt = 0;

	// 서편 승객수
	private int westBdpsgCnt = 0;

	// 현재일자
	private String curYmd = "";

	// 현재시분
	private String curHm = "";
	
	// 동편 누적승객수
	private int eastAccmltBdpsgCnt = 0;
	
	// 서편 누적승객수
	private int westAccmltBdpsgCnt = 0;
	
	// 누적승객수
	private int accmltBdpsgCnt = 0;
	
	// 동편 진입승객수
	private int eastInBdpsgCnt = 0;
	
	// 서편 진입승객수
	private int westInBdpsgCnt = 0;
	
	// 진입승객수
	private int inBdpsgCnt = 0;
	
	// 동편수용량
	private int eastCapacity = 0;
	
	// 서편수용량
	private int westCapacity = 0;
	
	// 동편시간간격
	private int eastTimeIntrv = 0;
	
	// 서편시간간격
	private int westTimeIntrv = 0;
	
	// 동편승강장용량
	private int eastStnCapacity = 0;
	
	// 서편승강장용량
	private int westStnCapacity = 0;
	
	// 동편5분수용율
	private int east5MiCapacityRt = 0;
	
	// 동편10분수용율
	private int east10MiCapacityRt = 0;
	
	// 서편5분수용율
	private int west5MiCapacityRt = 0;
	
	// 서편10분수용율
	private int west10MiCapacityRt = 0;
	
	// 동편5분색상값
	private int east5MiColrVal = 0;
	
	// 동편10분색상값
	private int east10MiColrVal = 0;
	
	// 서편5분색상값
	private int west5MiColrVal = 0;
	
	// 서편10분색상값
	private int west10MiColrVal = 0;
	
	// 동편계산여부
	private String eastCalcYn = "";
	
	// 서편계산여부
	private String westCalcYn = "";
	
	// 도착분
	private int arrMi = 0;
}