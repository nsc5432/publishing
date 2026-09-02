package aoms.pm.cmmn.dto;

import aoms.framework.cmmn.dto.AomsDefaultDto;

import lombok.Getter;
import lombok.Setter;

/**
* @Classname   : UserSmltDtpgSearchDto.java
* @Description : 사용자 시뮬레이션 결과 조회 (출국장) DTO
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
public class PmAtchFileDto extends AomsDefaultDto {
	private static final long serialVersionUID = 1L;
	// 첨부파일ID
	private String atchFileId = "";
	// 첨부파일일련번호
	private String atchFileSn = "";
	// 첨부파일업무구분코드
	private String atchFileTaskSeCd = "";
	// 첨부파일유형코드
	private String atchFileTypeCd = "";
	// 첨부파일명
	private String atchFileNm = "";
	// 저장파일명
	private String strgFileNm = "";
	// 첨부파일경로명
	private String atchFilePathNm = "";
	// 첨부파일사이즈
	private String atchFileSz = "";
	// 첨부파일확장자명
	private String atchFileExtnNm = "";
	// 첨부파일설명
	private String atchFileExpln = "";
	// 첨부파일ID (Search 용)
	private String atchFileIdSrch = "";
	// 첨부파일일련번호 (Search 용)
	private String atchFileSnSrch = "";
}