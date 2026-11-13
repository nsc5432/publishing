package aoms.pm.adtoper.controller;

import java.io.BufferedInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import javax.annotation.processing.FilerException;
import javax.servlet.ServletOutputStream;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.ModelAndView;

import aoms.framework.cmmn.constant.AomsConstant;
import aoms.framework.cmmn.controller.BaseAomsModelController;
import aoms.framework.cmmn.exception.AomsBizException;
import aoms.framework.nexacro.constant.NexacroConstant;
import aoms.framework.nexacro.dto.DataSetObject;
import aoms.framework.nexacro.dto.NexacroObjectDto;
import aoms.pm.adtoper.dto.AdtOperHrElementDto;
import aoms.pm.adtoper.dto.AdtOperHrMngSearchDto;
import aoms.pm.adtoper.service.AdtOperHrMngService;
import aoms.pm.cmmn.dto.PmConstants;
import aoms.pm.cmmn.dto.ValidCheckDto;

import lombok.RequiredArgsConstructor;

/**
 * @Classname : AdtOperHrMngController.java
 * @Description : 입출국장 운영시간 Controller
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
@RestController
@RequestMapping("/adtoper")
@RequiredArgsConstructor
public class AdtOperHrMngController extends BaseAomsModelController {
	private static final String FWTR07 = "FWTR07";
	private static final String DS_SEARCH = "dsSearch";
	private static final String DS_OPER_HR_SEARCH = "dsOperHrSearch";
	private static final String DS_MSTR_LIST_OUTPUT = "dsMstrListOutput";
	private static final String DS_OPER_HR_MNG_LIST_OUTPUT = "dsOperHrMngListOutput";
	private static final String DS_ELEMENT_LIST_OUTPUT = "dsElementListOutput";
	private final AdtOperHrMngService adtOperHrMngService;
	
	@PostMapping(value = "/retrieveOperHr.do")
	public ModelAndView retrieveOperHr(NexacroObjectDto ncDto, Model model) {
		ModelAndView mav = new ModelAndView(AomsConstant.MODEL_VIEW_NAME);
		Map<String, DataSetObject> inDatasetMap = ncDto.getInDataSetMap();
		Map<String, DataSetObject> outDatasetMap = ncDto.getOutDataSetMap();

		AdtOperHrMngSearchDto searchDto = (AdtOperHrMngSearchDto) inDatasetMap.get(DS_OPER_HR_SEARCH).get(0);

		DataSetObject dsObj = new DataSetObject();
		dsObj.setRowObjects(new ArrayList<>(adtOperHrMngService.retrieveOperHr(searchDto)));
		outDatasetMap.put(DS_OPER_HR_MNG_LIST_OUTPUT, dsObj);

		applyOut(mav, ncDto, outDatasetMap);
		return mav;
	}

	@PostMapping(value = "/retrieveOperHrMstrListByPeriod.do")
	public ModelAndView retrieveOperHrMstrListByPeriod(NexacroObjectDto ncDto, Model model) {
		ModelAndView mav = new ModelAndView(AomsConstant.MODEL_VIEW_NAME);
		Map<String, DataSetObject> inDatasetMap = ncDto.getInDataSetMap();
		Map<String, DataSetObject> outDatasetMap = ncDto.getOutDataSetMap();

		AdtOperHrMngSearchDto searchDto = (AdtOperHrMngSearchDto) inDatasetMap.get(DS_SEARCH).get(0);

		DataSetObject dsObj = new DataSetObject();
		dsObj.setRowObjects(new ArrayList<>(adtOperHrMngService.retrieveMstrListByPeriod(searchDto)));
		outDatasetMap.put(DS_MSTR_LIST_OUTPUT, dsObj);

		applyOut(mav, ncDto, outDatasetMap);
		return mav;
	}

	/**
	 * 조회화면(PM10202S) : 터미널+기간에 걸치는 DPL 배포버전 목록 (멀티콤보 소스).
	 */
	@PostMapping(value = "/retrieveDplyMstrListByTmnlPeriod.do")
	public ModelAndView retrieveDplyMstrListByTmnlPeriod(NexacroObjectDto ncDto, Model model) {
		ModelAndView mav = new ModelAndView(AomsConstant.MODEL_VIEW_NAME);
		Map<String, DataSetObject> inDatasetMap = ncDto.getInDataSetMap();
		Map<String, DataSetObject> outDatasetMap = ncDto.getOutDataSetMap();

		AdtOperHrMngSearchDto searchDto = (AdtOperHrMngSearchDto) inDatasetMap.get(DS_SEARCH).get(0);

		DataSetObject dsObj = new DataSetObject();
		dsObj.setRowObjects(new ArrayList<>(adtOperHrMngService.retrieveDplyMstrListByTmnlPeriod(searchDto)));
		outDatasetMap.put(DS_MSTR_LIST_OUTPUT, dsObj);

		applyOut(mav, ncDto, outDatasetMap);
		return mav;
	}

	/**
	 * 조회화면(PM10202S) : 선택 배포버전들의 운영시간 기간조회 (SORT_ORDR 겹침해소, 단일 시설/현재 탭).
	 */
	@PostMapping(value = "/retrieveResolvedOperHr.do")
	public ModelAndView retrieveResolvedOperHr(NexacroObjectDto ncDto, Model model) {
		ModelAndView mav = new ModelAndView(AomsConstant.MODEL_VIEW_NAME);
		Map<String, DataSetObject> inDatasetMap = ncDto.getInDataSetMap();
		Map<String, DataSetObject> outDatasetMap = ncDto.getOutDataSetMap();

		AdtOperHrMngSearchDto searchDto = (AdtOperHrMngSearchDto) inDatasetMap.get(DS_SEARCH).get(0);

		DataSetObject dsMng = new DataSetObject();
		dsMng.setRowObjects(new ArrayList<>(adtOperHrMngService.resolveOperHrByPeriod(searchDto)));
		outDatasetMap.put(DS_OPER_HR_MNG_LIST_OUTPUT, dsMng);

		applyOut(mav, ncDto, outDatasetMap);
		return mav;
	}

	/**
	 * 조회화면(PM10202S) : 엑셀용 - 현재 터미널·기간·체크버전의 입국/출국/환승 전체 (시설필터 제거).
	 */
	@PostMapping(value = "/retrieveResolvedOperHrExcel.do")
	public ModelAndView retrieveResolvedOperHrExcel(NexacroObjectDto ncDto, Model model) {
		ModelAndView mav = new ModelAndView(AomsConstant.MODEL_VIEW_NAME);
		Map<String, DataSetObject> inDatasetMap = ncDto.getInDataSetMap();
		Map<String, DataSetObject> outDatasetMap = ncDto.getOutDataSetMap();

		AdtOperHrMngSearchDto searchDto = (AdtOperHrMngSearchDto) inDatasetMap.get(DS_SEARCH).get(0);
		searchDto.setFcltSeCd(null); // 입국/출국/환승 전체

		DataSetObject dsExcel = new DataSetObject();
		dsExcel.setRowObjects(new ArrayList<>(adtOperHrMngService.resolveOperHrByPeriod(searchDto)));
		outDatasetMap.put("dsExcelOutput", dsExcel);

		applyOut(mav, ncDto, outDatasetMap);
		return mav;
	}

	/**
	 * 배포 목록 (신규 기준 팝업/콤보).
	 */
	@PostMapping(value = "/retrieveOperHrMstrList.do")
	public ModelAndView retrieveOperHrMstrList(NexacroObjectDto ncDto, Model model) {
		ModelAndView mav = new ModelAndView(AomsConstant.MODEL_VIEW_NAME);
		Map<String, DataSetObject> inDatasetMap = ncDto.getInDataSetMap();
		Map<String, DataSetObject> outDatasetMap = ncDto.getOutDataSetMap();

		AdtOperHrMngSearchDto searchDto = (AdtOperHrMngSearchDto) inDatasetMap.get(DS_SEARCH).get(0);

		DataSetObject dsObj = new DataSetObject();
		dsObj.setRowObjects(new ArrayList<>(adtOperHrMngService.retrieveMstrList(searchDto)));
		outDatasetMap.put(DS_MSTR_LIST_OUTPUT, dsObj);

		applyOut(mav, ncDto, outDatasetMap);
		return mav;
	}

	/**
	 * 배포(master)의 구성요소 + 운영시간 관리 조회.
	 */
	@PostMapping(value = "/retrieveOperHrMngList.do")
	public ModelAndView retrieveOperHrMngList(NexacroObjectDto ncDto, Model model) {
		ModelAndView mav = new ModelAndView(AomsConstant.MODEL_VIEW_NAME);
		Map<String, DataSetObject> inDatasetMap = ncDto.getInDataSetMap();
		Map<String, DataSetObject> outDatasetMap = ncDto.getOutDataSetMap();

		AdtOperHrMngSearchDto searchDto = (AdtOperHrMngSearchDto) inDatasetMap.get(DS_SEARCH).get(0);

		DataSetObject dsElement = new DataSetObject();
		dsElement.setRowObjects(new ArrayList<>(adtOperHrMngService.retrieveElementList(searchDto)));
		outDatasetMap.put(DS_ELEMENT_LIST_OUTPUT, dsElement);

		DataSetObject dsMng = new DataSetObject();
		dsMng.setRowObjects(new ArrayList<>(adtOperHrMngService.retrieveOperHrMngList(searchDto)));
		outDatasetMap.put(DS_OPER_HR_MNG_LIST_OUTPUT, dsMng);

		applyOut(mav, ncDto, outDatasetMap);
		return mav;
	}

	/**
	 * 신규 : 시설별 기준 구성요소(Element)를 조합해 새 배포 생성 후 mstrSeq 반환.
	 * 입력 dsSelectedBase 각 행 = 선택한 기준 Element (seq/tmnlSeCd/fcltSeCd).
	 */
	@PostMapping(value = "/createNewDeployment.do")
	public ModelAndView createNewDeployment(NexacroObjectDto ncDto, Model model) {
		ModelAndView mav = new ModelAndView(AomsConstant.MODEL_VIEW_NAME);
		Map<String, DataSetObject> inDatasetMap = ncDto.getInDataSetMap();
		Map<String, Object> outVar = ncDto.getOutVariableMap();

		List<AdtOperHrElementDto> selections = new ArrayList<>();
		DataSetObject baseDsObj = inDatasetMap.get("dsSelectedBase");
		if (baseDsObj != null) {
			for (int i = 0; i < baseDsObj.size(); i++) {
				selections.add((AdtOperHrElementDto) baseDsObj.get(i));
			}
		}

		AdtOperHrMngSearchDto searchDto = (AdtOperHrMngSearchDto) inDatasetMap.get(DS_SEARCH).get(0);
		int newMstrSeq = adtOperHrMngService.createNewDeployment(searchDto.getMstrSeq(), selections);
		outVar.put("newMstrSeq", newMstrSeq);

		AdtOperHrMngSearchDto elementSearch = new AdtOperHrMngSearchDto();
		elementSearch.setMstrSeq(newMstrSeq);
		DataSetObject dsElement = new DataSetObject();
		dsElement.setRowObjects(new ArrayList<>(adtOperHrMngService.retrieveElementList(elementSearch)));

		Map<String, DataSetObject> outDatasetMap = ncDto.getOutDataSetMap();
		outDatasetMap.put(DS_ELEMENT_LIST_OUTPUT, dsElement);

		mav.addObject(NexacroConstant.OUT_VARIABLES_ATT_NAME, outVar);
		applyOut(mav, ncDto, outDatasetMap);
		return mav;
	}

	/**
	 * 저장 전 기간 중복 유효성 검사.
	 */
	@PostMapping(value = "/validationCheck.do")
	public ModelAndView validationCheck(NexacroObjectDto ncDto, Model model) {
		ModelAndView mav = new ModelAndView(AomsConstant.MODEL_VIEW_NAME);
		Map<String, DataSetObject> inDatasetMap = ncDto.getInDataSetMap();
		Map<String, Object> outVar = ncDto.getOutVariableMap();

		DataSetObject reqDsObj = inDatasetMap.get("dsOperHrMngReq");
		ValidCheckDto vcd = adtOperHrMngService.validationCheck(reqDsObj);
		outVar.put(PmConstants.MESSAGE, vcd.isValid() ? null : vcd.getMessage());

		mav.addObject(NexacroConstant.OUT_VARIABLES_ATT_NAME, outVar);
		applyOut(mav, ncDto, ncDto.getOutDataSetMap());
		return mav;
	}

	/**
	 * 임시저장
	 */
	@PostMapping(value = "/saveOperHrMng.do")
	public ModelAndView saveOperHrMng(NexacroObjectDto ncDto, Model model) {
		ModelAndView mav = new ModelAndView(AomsConstant.MODEL_VIEW_NAME);
		Map<String, DataSetObject> inDatasetMap = ncDto.getInDataSetMap();
		Map<String, Object> outVar = ncDto.getOutVariableMap();

		DataSetObject reqDsObj = inDatasetMap.get("dsOperHrMngReq");
		AdtOperHrMngSearchDto searchDto = (AdtOperHrMngSearchDto) inDatasetMap.get(DS_SEARCH).get(0);
		int successCnt = adtOperHrMngService.saveOperHrMng(reqDsObj, searchDto);
		outVar.put(PmConstants.SUCCESS_CNT, successCnt);

		mav.addObject(NexacroConstant.OUT_VARIABLES_ATT_NAME, outVar);
		applyOut(mav, ncDto, ncDto.getOutDataSetMap());
		return mav;
	}
	
	/**
	 * 배포명 변경
	 */
	@PostMapping(value = "/updateDeploymentName.do")
	public ModelAndView updateDeploymentName(NexacroObjectDto ncDto, Model model) {
		ModelAndView mav = new ModelAndView(AomsConstant.MODEL_VIEW_NAME);
		Map<String, DataSetObject> inDatasetMap = ncDto.getInDataSetMap();
		Map<String, Object> outVar = ncDto.getOutVariableMap();

		AdtOperHrMngSearchDto searchDto = (AdtOperHrMngSearchDto) inDatasetMap.get(DS_SEARCH).get(0);
		int successCnt = adtOperHrMngService.updateDeploymentName(searchDto.getMstrSeq(), searchDto.getDplyNm());
		outVar.put(PmConstants.SUCCESS_CNT, successCnt);

		mav.addObject(NexacroConstant.OUT_VARIABLES_ATT_NAME, outVar);
		applyOut(mav, ncDto, ncDto.getOutDataSetMap());
		return mav;
	}

	/**
	 * 운영시간 조회 (가상 현행 포함)
	 */
	@PostMapping(value = "/retrieveOperHrTimeline.do")
	public ModelAndView retrieveOperHrTimeline(NexacroObjectDto ncDto, Model model) {
		ModelAndView mav = new ModelAndView(AomsConstant.MODEL_VIEW_NAME);
		Map<String, DataSetObject> inDatasetMap = ncDto.getInDataSetMap();
		Map<String, DataSetObject> outDatasetMap = ncDto.getOutDataSetMap();

		AdtOperHrMngSearchDto searchDto = (AdtOperHrMngSearchDto) inDatasetMap.get(DS_SEARCH).get(0);

		DataSetObject dsMng = new DataSetObject();
		dsMng.setRowObjects(new ArrayList<>(adtOperHrMngService.retrieveOperHrTimeline(searchDto)));
		outDatasetMap.put(DS_OPER_HR_MNG_LIST_OUTPUT, dsMng);

		DataSetObject dsElement = new DataSetObject();
		if (searchDto.getMstrSeq() != 0) {
			dsElement.setRowObjects(new ArrayList<>(adtOperHrMngService.retrieveElementList(searchDto)));
		}
		outDatasetMap.put(DS_ELEMENT_LIST_OUTPUT, dsElement);

		applyOut(mav, ncDto, outDatasetMap);
		return mav;
	}

	/**
	 * 가상 현행 조회
	 */
	@PostMapping(value = "/retrievePreviousOperHr.do")
	public ModelAndView retrievePreviousOperHr(NexacroObjectDto ncDto, Model model) {
		ModelAndView mav = new ModelAndView(AomsConstant.MODEL_VIEW_NAME);
		Map<String, DataSetObject> inDatasetMap = ncDto.getInDataSetMap();
		Map<String, DataSetObject> outDatasetMap = ncDto.getOutDataSetMap();

		AdtOperHrMngSearchDto searchDto = (AdtOperHrMngSearchDto) inDatasetMap.get(DS_SEARCH).get(0);

		DataSetObject dsMng = new DataSetObject();
		dsMng.setRowObjects(new ArrayList<>(adtOperHrMngService.retrievePreviousOperHr(searchDto)));
		outDatasetMap.put(DS_OPER_HR_MNG_LIST_OUTPUT, dsMng);

		applyOut(mav, ncDto, outDatasetMap);
		return mav;
	}


	/**
	 * 배포완료(확정).
	 */
	@PostMapping(value = "/deployOperHrMng.do")
	public ModelAndView deployOperHrMng(NexacroObjectDto ncDto, Model model) {
		ModelAndView mav = new ModelAndView(AomsConstant.MODEL_VIEW_NAME);
		Map<String, DataSetObject> inDatasetMap = ncDto.getInDataSetMap();
		Map<String, Object> outVar = ncDto.getOutVariableMap();

		AdtOperHrMngSearchDto searchDto = (AdtOperHrMngSearchDto) inDatasetMap.get(DS_SEARCH).get(0);

		List<AdtOperHrElementDto> selectedElements = new ArrayList<>();
		DataSetObject deployDsObj = inDatasetMap.get("dsDeployElement");
		if (deployDsObj != null) {
			for (int i = 0; i < deployDsObj.size(); i++) {
				selectedElements.add((AdtOperHrElementDto) deployDsObj.get(i));
			}
		}

		int successCnt = adtOperHrMngService.deployOperHrMng(searchDto.getMstrSeq(), selectedElements);
		outVar.put(PmConstants.SUCCESS_CNT, successCnt);

		mav.addObject(NexacroConstant.OUT_VARIABLES_ATT_NAME, outVar);
		applyOut(mav, ncDto, ncDto.getOutDataSetMap());
		return mav;
	}

	/**
	 * 운영시간 삭제 (soft delete).
	 */
	@PostMapping(value = "/deleteOperHrMng.do")
	public ModelAndView deleteOperHrMng(NexacroObjectDto ncDto, Model model) {
		ModelAndView mav = new ModelAndView(AomsConstant.MODEL_VIEW_NAME);
		Map<String, DataSetObject> inDatasetMap = ncDto.getInDataSetMap();
		Map<String, Object> outVar = ncDto.getOutVariableMap();

		AdtOperHrMngSearchDto searchDto = (AdtOperHrMngSearchDto) inDatasetMap.get(DS_SEARCH).get(0);
		int successCnt = adtOperHrMngService.deleteOperHrMng(searchDto.getMstrSeq());
		outVar.put(PmConstants.SUCCESS_CNT, successCnt);

		mav.addObject(NexacroConstant.OUT_VARIABLES_ATT_NAME, outVar);
		applyOut(mav, ncDto, ncDto.getOutDataSetMap());
		return mav;
	}

	/**
	 * 입출국장 운영시간 공문 다운로드 (.hwpx)
	 */
	@PostMapping(value = "/downloadAdtOperHrMng.do")
	public void downloadAdtOperHrMng(HttpServletRequest request, HttpServletResponse response) throws FilerException {
		int mstrSeq = Integer.parseInt(request.getParameter("mstrSeq"));
		boolean arrCheck = Boolean.parseBoolean(request.getParameter("arrCheck"));
		boolean depCheck = Boolean.parseBoolean(request.getParameter("depCheck"));
		boolean tsCheck = Boolean.parseBoolean(request.getParameter("tsCheck"));

		String webAppPath = request.getSession().getServletContext().getRealPath("/");
		String[] downloadFileInfo = adtOperHrMngService.downloadAdtOperHrMng(mstrSeq, webAppPath, arrCheck, depCheck, tsCheck);

		int byteSize = 2048;
		byte[] buffer = new byte[byteSize];

		File file = new File(downloadFileInfo[0]);
		if (!file.exists()) {
			throw new AomsBizException("FWIO25", new String[] { downloadFileInfo[1] });
		}

		try (
			BufferedInputStream inputStream = new BufferedInputStream(new FileInputStream(file));
			ServletOutputStream outputStream = response.getOutputStream();
		) {
			response.setContentType("application/octet-stream;charset=utf-8");
			response.setHeader("Content-Disposition", "attachment; filename=\"" + downloadFileInfo[1] + "\"");

			int bytesRead;
			while ((bytesRead = inputStream.read(buffer, 0, byteSize)) != -1) {
				outputStream.write(buffer, 0, bytesRead);
			}
		} catch (IOException e) {
			throw new AomsBizException("FWIO25", new String[] { downloadFileInfo[1] });
		}
	}

	private void applyOut(ModelAndView mav, NexacroObjectDto ncDto, Map<String, DataSetObject> outDatasetMap) {
		outDatasetMap.put(NexacroConstant.OUT_TRNS_INFO, ncDto.getOutTransInfo());
		mav.addObject(NexacroConstant.OUT_DATASET_ATT_NAME, outDatasetMap);
		mav.addObject(NexacroConstant.ERROR_CODE, "0");
		mav.addObject(NexacroConstant.ERROR_MSG, messageService.getMsg(FWTR07));
	}
}
