package aoms.pm.castrest.service;

/**
 * @Classname   : CastRestService.java
 * @Description : PM_여객출현정보 관리 Service
 *
 * @Copyright (c) 인천국제공항 통합정보시스템 아시아나IDT 컨소시엄 All right reserved.
 * <pre>
 *------------------------------------------------------------------------------
 * Modification Information
 *------------------------------------------------------------------------------
 * 수정일 / 수정자 /수정내용
 * ----------  ------  ---------------------------------------------------------
 * 2025. 09. 12 / 이순영 / 최초작성
 *------------------------------------------------------------------------------
 *
 * </pre>
 */
public interface CastRestService {
	public String retrieveResourceInformation(String param);
	public String retrieveResource(String param);
	public String saveResult(String param);
	public String deleteResult(String param);
}