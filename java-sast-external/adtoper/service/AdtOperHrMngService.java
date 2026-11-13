package aoms.pm.adtoper.service;

import java.util.List;

import aoms.framework.nexacro.dto.DataSetObject;
import aoms.pm.adtoper.dto.AdtOperHrElementDto;
import aoms.pm.adtoper.dto.AdtOperHrMngDto;
import aoms.pm.adtoper.dto.AdtOperHrMngSearchDto;
import aoms.pm.adtoper.dto.AdtOperHrMstrListDto;
import aoms.pm.adtoper.dto.AdtOperHrTimelineDto;
import aoms.pm.cmmn.dto.ValidCheckDto;

/**
 * @Classname : AdtOperHrMngService.java
 * @Description : 입출국장 운영시간 Service
 *
 * @Copyright (c) 인천국제공항 통합정보시스템 아시아나IDT 컨소시엄 All right reserved.
 * <pre>
 * -----------------------------------------------------------------------------------
 * Modification Information
 * -----------------------------------------------------------------------------------
 * 수정일 / 수정자 / 수정내용
 * 2026. 01. 18. / 노세찬 / 최초작성
 * -----------------------------------------------------------------------------------
 * </pre>
 */
public interface AdtOperHrMngService {
	List<AdtOperHrMngDto> retrieveOperHr(AdtOperHrMngSearchDto searchDto);
	List<AdtOperHrMstrListDto> retrieveMstrListByPeriod(AdtOperHrMngSearchDto searchDto);
	List<AdtOperHrMstrListDto> retrieveDplyMstrListByTmnlPeriod(AdtOperHrMngSearchDto searchDto);
	List<AdtOperHrMngDto> resolveOperHrByPeriod(AdtOperHrMngSearchDto searchDto);
	List<AdtOperHrMstrListDto> retrieveMstrList(AdtOperHrMngSearchDto searchDto);
	List<AdtOperHrElementDto> retrieveElementList(AdtOperHrMngSearchDto searchDto);
	List<AdtOperHrMngDto> retrieveOperHrMngList(AdtOperHrMngSearchDto searchDto);
	List<AdtOperHrTimelineDto> retrieveOperHrTimeline(AdtOperHrMngSearchDto searchDto);
	List<AdtOperHrTimelineDto> retrievePreviousOperHr(AdtOperHrMngSearchDto searchDto);
	int createNewDeployment(int mstrSeq, List<AdtOperHrElementDto> selections);
	int saveOperHrMng(DataSetObject reqDsObj, AdtOperHrMngSearchDto  searchDto);
	int updateDeploymentName(int mstrSeq, String dplyNm);
	ValidCheckDto validationCheck(DataSetObject reqDsObj);
	int deployOperHrMng(int mstrSeq, List<AdtOperHrElementDto> selectedElements);
	int deleteOperHrMng(int mstrSeq);
	String[] downloadAdtOperHrMng(int mstrSeq, String webAppPath, boolean arrCheck, boolean depCheck, boolean tsCheck) throws Exception;
}
