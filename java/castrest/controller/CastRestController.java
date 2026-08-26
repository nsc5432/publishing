package aoms.pm.castrest.controller;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import aoms.framework.cmmn.controller.BaseAomsRestController;
import aoms.pm.castrest.service.CastRestService;

import lombok.RequiredArgsConstructor;

/**
 * @Classname   : CastRestTestController.java
 * @Description : 소스생성 관리 Controller
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
@RestController
@RequestMapping("/castrest/rest/json")
@RequiredArgsConstructor
public class CastRestController extends BaseAomsRestController {
    private final CastRestService castRestService;

    /**
     * 자료 목록 조회
     *
     * @Method Name : resGetResourceInformation
     * @param ncDto
     * @param model
     * @return
     **/    
	@PostMapping(value = "/REQ_GetResourceInformation.do")
    public String resGetResourceInformation(@RequestBody String param) {
		return castRestService.retrieveResourceInformation(param);
    }
    /**
     * 선택 자료 정보 전송
     *
     * @Method Name : resGetResourceTest
     * @param ncDto
     * @param model
     * @return
     **/	
	@PostMapping(value = "/REQ_GetResource.do")
    public String resGetResource(@RequestBody String param) {
		return castRestService.retrieveResource(param);
    }
    /**
     * 결과 정보 수신
     *
     * @Method Name : reqSetResourceTest
     * @param ncDto
     * @param model
     * @return
     **/	
	@PostMapping(value = "/REQ_SetResource.do")
    public String resSetResource(@RequestBody String param) {
		return castRestService.saveResult(param);
    }
    /**
     *  자료 삭제
     *
     * @Method Name : REQ_DeleteResourceTest
     * @param ncDto
     * @param model
     * @return
     **/	
	@PostMapping(value = "/REQ_DeleteResource.do")
    public String reqDeleteResource(@RequestBody String param) {
		return castRestService.deleteResult(param);
    }
}