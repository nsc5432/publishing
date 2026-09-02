package aoms.pm.cmmn.dto;

import aoms.framework.cmmn.dto.AomsDefaultDto;

import lombok.Getter;
import lombok.Setter;

/**
 * @Classname : AtchFileDto.java
 * @Description : 첨부파일 DTO
 *
 * @Copyright (c) 인천국제공항 통합정보시스템 아시아나IDT 컨소시엄 All right reserved.
 * <pre>
 * -----------------------------------------------------------------------------------
 * Modification Information
 * -----------------------------------------------------------------------------------
 * 수정일 / 수정자 / 수정내용
 * 2024. 9. 30. / AA / 최초작성 
 * -----------------------------------------------------------------------------------
 * 
 * </pre> 
 */
@Getter
@Setter
public class AtchFilesDto extends AomsDefaultDto {

	private static final long serialVersionUID = -5147377920716242094L;
	
	private String atchFileId = "";			// 첨부파일ID
	private int atchFileSn = 0;				// 첨부파일일련번호
	private String atchFileTaskSeCd = "";	// 첨부파일업무구분코드
	private String atchFileTypecd = "";		// 첨부파일유형코드
	private String atchFileNm = "";			// 첨부파일명
	private String strgFileNm = "";			// 저장파일명
	private String atchFilePathNm = "";		// 첨부파일경로명
	private long atchFileSz = 0;			// 첨부파일크기
	private String atchFileExtnNm = "";		// 첨부파일확장자명
	private String atchFileExpln = "";		// 첨부파일설명
	
	private String atchTime = "";			// 첨부파일경로 (YYYYMMDDHH24MISSSSS)
	private String hostName = "";			// host name/request.getServerName()
	private String urlPath = "";			// url path (moduleId/image/SMS/)
	private String ftpPath = "";			// ftp path (moduleId/image/SMS/)
	private String tablNm = "";
}
