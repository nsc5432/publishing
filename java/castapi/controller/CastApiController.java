package aoms.pm.castapi.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import aoms.framework.cmmn.controller.BaseAomsRestController;
import aoms.pm.castapi.log.CastApiExecutor;
import aoms.pm.castapi.service.CastApiService;
import aoms.pm.cmmn.dto.CastReqGetResourceDto;
import aoms.pm.cmmn.dto.CastReqGetResourceInformationDto;

import lombok.RequiredArgsConstructor;

/**
 * @Classname   : CastApiController.java
 * @Description : 소스생성 관리 Controller
 *
 * @Copyright (c) 인천국제공항 통합정보시스템 아시아나IDT 컨소시엄 All right reserved.
 * <pre>
 *------------------------------------------------------------------------------
 * Modification Information
 *------------------------------------------------------------------------------
 * 수정일 / 수정자 /수정내용
 * ----------  ------  ---------------------------------------------------------
 * 2026.10.22 / 노세찬 / 최초작성
 *------------------------------------------------------------------------------
 *
 * </pre>
 */
// @RestController
@RequestMapping("/castrest/rest/json")
@RequiredArgsConstructor
public class CastApiController extends BaseAomsRestController {
    private final CastApiService castApiService;
    private final CastApiExecutor castApiExecutor;

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
        return castApiExecutor.execute(
            CastApiExecutor.GET_RESOURCE_INFORMATION, 
            param,
            context -> castApiService.retrieveResourceInformation(param, context)
        );
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
        return castApiExecutor.execute(CastApiExecutor.GET_RESOURCE, param,
                context -> castApiService.retrieveResource(param, context));
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
        return castApiExecutor.execute(CastApiExecutor.SET_RESOURCE, param,
                context -> castApiService.saveResult(param, context));
    }

    // GET /castrest/rest/json/REQ_GetResourceInformation_Test.do?resourceTypes=CASTModel,FlightSchedule,CounterAllocation,GenericTable,PropertySet
    @GetMapping(value = "/REQ_GetResourceInformation_Test.do")
    public String getResourceInformation(@RequestParam("resourceTypes") String resourceTypes) {
        CastReqGetResourceInformationDto infoDto = new CastReqGetResourceInformationDto();
        infoDto.setResourceTypes(resourceTypes);
        return castApiService.retrieveResourceInformation(infoDto);
    }

    // 운항편
    // GET /castrest/rest/json/REQ_GetResource_Test.do?resourceType=FlightSchedule&resourceID=FS001
    // 체크인카운터 배정
    // GET /castrest/rest/json/REQ_GetResource_Test.do?resourceType=CounterAllocation&resourceID=CA001
    // 프로퍼티셋 (여객 속성/서비스 속성/참조 리소스 설정 (기준정보)) -> SBD, SecurityControl, Immigration, Emigration, DepartureGate, TransferSecurityControl, CheckinType, CheckInCounterServiceTime
    // GET /castrest/rest/json/REQ_GetResource_Test.do?resourceType=PropertySet&resourceID=PS001
    // 셀프백드롭 — CounterAllocation 유형
    // GET /castrest/rest/json/REQ_GetResource_Test.do?resourceType=CounterAllocation&resourceID=SBD001
    // 체크인 유형
    // GET /castrest/rest/json/REQ_GetResource_Test.do?resourceType=GenericTable&resourceID=CheckinType001
    // 체크인 처리시간
    // GET /castrest/rest/json/REQ_GetResource_Test.do?resourceType=GenericTable&resourceID=CheckinCounterServiceTime001
    // 출국장 운영
    // GET /castrest/rest/json/REQ_GetResource_Test.do?resourceType=GenericTable&resourceID=FacilityOpeningTable_DepartureGate001
    // 출국심사
    // GET /castrest/rest/json/REQ_GetResource_Test.do?resourceType=GenericTable&resourceID=FacilityOpeningTable_Emigration001
    // 입국심사
    // GET /castrest/rest/json/REQ_GetResource_Test.do?resourceType=GenericTable&resourceID=FacilityOpeningTable_Immigration001
    // 보안검색
    // GET /castrest/rest/json/REQ_GetResource_Test.do?resourceType=GenericTable&resourceID=FacilityOpeningTable_SecurityControl001
    // 환승보안검색
    // GET /castrest/rest/json/REQ_GetResource_Test.do?resourceType=GenericTable&resourceID=FacilityOpeningTable_TransferSecurityControl001
    // 리포팅 시간그룹
    // GET /castrest/rest/json/REQ_GetResource_Test.do?resourceType=GenericTable&resourceID=ReportingProfilesTimeGroups001
    // WhatIf 요청
    // GET /castrest/rest/json/REQ_GetResource_Test.do?resourceType=GenericTable&resourceID=WhatIfDefinitionTable
    @GetMapping(value = "/REQ_GetResource_Test.do")
    public String getResource(@RequestParam("resourceType") String resourceType, @RequestParam("resourceID") String resourceID) {
        CastReqGetResourceDto resourceDto = new CastReqGetResourceDto();
        resourceDto.setResourceType(resourceType);
        resourceDto.setResourceID(resourceID);
        return castApiService.retrieveResource(resourceDto);
    }
}
