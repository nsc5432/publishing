package aoms.pm.bdpsgance.controller;

import java.io.BufferedInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.util.List;
import java.util.Map;

import javax.servlet.ServletOutputStream;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.lang3.StringUtils;
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
import aoms.pm.bdpsgance.service.BdpsgAnceInqService;
import aoms.pm.cmmn.dto.BdpsgAnceCrtMntrDto;
import aoms.pm.cmmn.dto.BdpsgAnceRsltDto;
import aoms.pm.cmmn.dto.GdDataDto;

import lombok.RequiredArgsConstructor;                                                                                              

/**
 * @Classname : BdpsgAnceInqController.java
 * @Description : 승객예고조회 Controller
 *
 * @Copyright (c) 인천국제공항 통합정보시스템 아시아나IDT 컨소시엄 All right reserved.
 * <pre>
 * -----------------------------------------------------------------------------------
 * Modification Information
 * -----------------------------------------------------------------------------------
 * 수정일 / 수정자 / 수정내용
 * 2025. 5. 19. / 임소정 / 최초작성 
 * -----------------------------------------------------------------------------------
 * 
 * </pre> 
 */
@RestController
@RequestMapping("/bdpsgance")
@RequiredArgsConstructor
public class BdpsgAnceInqController extends BaseAomsModelController {
    private static final String FWTR07 = "FWTR07";
	private static final String DS_SEARCH = "dsSearch";
	private final BdpsgAnceInqService bdpsgAnceInqService;
    
    /**
     * 승객예고조회 > 승객예고 목록을 조회한다(T1).
     *
     * @Method Name : retrieveTotalBdpsgAnce
     * @param ncDto
     * @param model
     * @return
     **/
    @PostMapping(value = "/retrieveTotalBdpsgAnce.do")
	public ModelAndView retrieveTotalBdpsgAnce(NexacroObjectDto ncDto, Model model) {
		ModelAndView mav = new ModelAndView(AomsConstant.MODEL_VIEW_NAME);
		Map<String, DataSetObject> inDatasetMap = ncDto.getInDataSetMap();
		Map<String, DataSetObject> outDatasetMap = ncDto.getOutDataSetMap();
		DataSetObject outTranInfo = ncDto.getOutTransInfo();
		
		DataSetObject searchDsObj = inDatasetMap.get(DS_SEARCH);
		
		// 1. 조회일자를 획득하였음
		BdpsgAnceRsltDto searchDtoTmp = (BdpsgAnceRsltDto) searchDsObj.get(0);

		// 일자를 가지고 해당일자를 기준으로 입국/출국/환승/입국셔틀트레인/출국셔틀트레인 서비스를 각각호출하여 Output 으로
		// 셋팅한다.
		// 마지막으로 Bottom 까지 호출하여 전체 내용을 완성한다.
		// 2.1 입국승객예고 조회 및 셋팅
		BdpsgAnceRsltDto searchDto1 = new BdpsgAnceRsltDto();
		searchDto1.setBdpsgAnceYmd(searchDtoTmp.getBdpsgAnceYmd());

		List<Object> records1 = bdpsgAnceInqService.retrieveEntcnyBdpsgAnceRslt(searchDto1);

		DataSetObject dsObj1 = new DataSetObject();
		dsObj1.setRowObjects(records1); // dsObj = []
		outDatasetMap.put("dsArrOutput", dsObj1); // dsObj

		// 2.2 출국승객예고 조회 및 셋팅
		BdpsgAnceRsltDto searchDto2 = new BdpsgAnceRsltDto();
		searchDto2.setBdpsgAnceYmd(searchDtoTmp.getBdpsgAnceYmd());

		List<Object> records2 = bdpsgAnceInqService.retrieveDptcnyBdpsgAnceRslt(searchDto2);
		DataSetObject dsObj2 = new DataSetObject();
		dsObj2.setRowObjects(records2); // dsObj = []
		outDatasetMap.put("dsDepOutput", dsObj2); // dsObj

		// 2.3 환승객예고 조회 및 셋팅
		BdpsgAnceRsltDto searchDto3 = new BdpsgAnceRsltDto();
		searchDto3.setBdpsgAnceYmd(searchDtoTmp.getBdpsgAnceYmd());

		List<Object> records3 = bdpsgAnceInqService.retrieveTrnstBdpsgAnceRslt(searchDto3);

		DataSetObject dsObj3 = new DataSetObject();
		dsObj3.setRowObjects(records3); // dsObj = []
		outDatasetMap.put("dsTsOutput", dsObj3); // dsObj

		// 2.4 입국셔틀트레인 승객예고 조회 및 셋팅
		BdpsgAnceRsltDto searchDto4 = new BdpsgAnceRsltDto();
		searchDto4.setBdpsgAnceYmd(searchDtoTmp.getBdpsgAnceYmd());

		List<Object> records4 = bdpsgAnceInqService.retrieveEntcnyShtrnBdpsgAnceRslt(searchDto4);

		DataSetObject dsObj4 = new DataSetObject();
		dsObj4.setRowObjects(records4); // dsObj = []
		outDatasetMap.put("dsShtrnArrOutput", dsObj4); // dsObj

		// 2.5 출국셔틀트레인 출국승객예고 조회 및 셋팅
		BdpsgAnceRsltDto searchDto5 = new BdpsgAnceRsltDto();
		searchDto5.setBdpsgAnceYmd(searchDtoTmp.getBdpsgAnceYmd());

		List<Object> records5 = bdpsgAnceInqService.retrieveDptcnyShtrnBdpsgAnceRslt(searchDto5);

		DataSetObject dsObj5 = new DataSetObject();
		dsObj5.setRowObjects(records5); // dsObj = []
		outDatasetMap.put("dsShtrnDepOutput", dsObj5); // dsObj

		// 2.10 화면 하단 전체 조회 및 셋팅
		BdpsgAnceRsltDto searchDto6 = new BdpsgAnceRsltDto();
		searchDto6.setBdpsgAnceYmd(searchDtoTmp.getBdpsgAnceYmd());

		GdDataDto inDto = new GdDataDto();
		inDto.setTmnlId("P01");
		inDto.setGdSeYmd(searchDtoTmp.getBdpsgAnceYmd());

		/* 승객예약정보를 조회한다. */
		List<Object> records7 = bdpsgAnceInqService.retrieveRsvtBdpsgCnt(inDto);

		DataSetObject dsObj7 = new DataSetObject();
		dsObj7.setRowObjects(records7); // dsObj = []
		outDatasetMap.put("dsRsvtBdpsgCnt", dsObj7); // dsObj

		outDatasetMap.put(NexacroConstant.OUT_TRNS_INFO, outTranInfo);

		mav.addObject(NexacroConstant.OUT_DATASET_ATT_NAME, outDatasetMap);

		String message = messageService.getMsg(FWTR07);

		mav.addObject(NexacroConstant.ERROR_CODE, "0");
		mav.addObject(NexacroConstant.ERROR_MSG, message);
		mav.addObject("outTp"/*NexacroConstant.OUT_TP*/, NexacroConstant.OUT_TP_SSV);// 대용량처리

		return mav;
	}
    
    /**
     * 승객예고조회 > 승객예고 목록을 조회한다(T2).
     *
     * @Method Name : retrieveTotalBdpsgAnceT2
     * @param ncDto
     * @param model
     * @return
     **/
    @PostMapping(value = "/retrieveTotalBdpsgAnceT2.do")
	public ModelAndView retrieveTotalBdpsgAnceT2(NexacroObjectDto ncDto, Model model) {
		ModelAndView mav = new ModelAndView(AomsConstant.MODEL_VIEW_NAME); 
		Map<String, DataSetObject> inDatasetMap = ncDto.getInDataSetMap();
		Map<String, DataSetObject> outDatasetMap = ncDto.getOutDataSetMap();
		DataSetObject outTranInfo = ncDto.getOutTransInfo();

		DataSetObject searchDsObj = inDatasetMap.get(DS_SEARCH);

		// 1. 조회일자를 획득하였음
		BdpsgAnceRsltDto searchDtoTmp = (BdpsgAnceRsltDto) searchDsObj.get(0);

		// 일자를 가지고 해당일자를 기준으로 입국/출국/환승/입국셔틀트레인/출국셔틀트레인 서비스를 각각호출하여 Output 으로
		// 셋팅한다.
		// 마지막으로 Bottom 까지 호출하여 전체 내용을 완성한다.
		// 2.1 입국승객예고 조회 및 셋팅
		BdpsgAnceRsltDto searchDto1 = new BdpsgAnceRsltDto();
		searchDto1.setBdpsgAnceYmd(searchDtoTmp.getBdpsgAnceYmd());

		List<Object> records1 = bdpsgAnceInqService.retrieveEntcnyBdpsgAnceRsltT2(searchDto1);

		DataSetObject dsObj1 = new DataSetObject();
		dsObj1.setRowObjects(records1); // dsObj = []
		outDatasetMap.put("dsArrT2Output", dsObj1); // dsObj

		// 2.2 출국승객예고 조회 및 셋팅
		BdpsgAnceRsltDto searchDto2 = new BdpsgAnceRsltDto();
		searchDto2.setBdpsgAnceYmd(searchDtoTmp.getBdpsgAnceYmd());

		List<Object> records2 = bdpsgAnceInqService.retrieveDptcnyBdpsgAnceRsltT2(searchDto2);

		DataSetObject dsObj2 = new DataSetObject();
		dsObj2.setRowObjects(records2); // dsObj = []
		outDatasetMap.put("dsDepT2Output", dsObj2); // dsObj

		// 2.3 환승객예고 조회 및 셋팅
		BdpsgAnceRsltDto searchDto3 = new BdpsgAnceRsltDto();
		searchDto3.setBdpsgAnceYmd(searchDtoTmp.getBdpsgAnceYmd());

		List<Object> records3 = bdpsgAnceInqService.retrieveTrnstBdpsgAnceRsltT2(searchDto3);

		DataSetObject dsObj3 = new DataSetObject();
		dsObj3.setRowObjects(records3); // dsObj = []
		outDatasetMap.put("dsTsT2Output", dsObj3); // dsObj

		// 2.10 화면 하단 전체 조회 및 셋팅
		BdpsgAnceRsltDto searchDto6 = new BdpsgAnceRsltDto();
		searchDto6.setBdpsgAnceYmd(searchDtoTmp.getBdpsgAnceYmd());

		GdDataDto inDto = new GdDataDto();
		inDto.setTmnlId("P03");
		inDto.setGdSeYmd(searchDtoTmp.getBdpsgAnceYmd());

		/* 승객예약정보를 조회한다. */
		List<Object> records7 = bdpsgAnceInqService.retrieveRsvtBdpsgCnt(inDto);

		DataSetObject dsObj7 = new DataSetObject();
		dsObj7.setRowObjects(records7); // dsObj = []
		outDatasetMap.put("dsRsvtBdpsgCnt", dsObj7); // dsObj

		outDatasetMap.put(NexacroConstant.OUT_TRNS_INFO, outTranInfo);
		mav.addObject(NexacroConstant.OUT_DATASET_ATT_NAME, outDatasetMap);

		String message = messageService.getMsg(FWTR07);

		mav.addObject(NexacroConstant.ERROR_CODE, "0");
		mav.addObject(NexacroConstant.ERROR_MSG, message);
		return mav;
	}
    
    /**
     * 승객예고조회 > 승객예고 생성 모니터링
     *
     * @Method Name : retrieveBdpsgAnceCrtMntrList (retrieveBdpsgAnceCrtMntrList)
     * @param ncDto
     * @param model
     * @return
     **/
    @PostMapping(value = "/retrieveBdpsgAnceCrtMntrList.do")
	public ModelAndView retrieveBdpsgAnceCrtMntrList(NexacroObjectDto ncDto, Model model) {
		ModelAndView mav = new ModelAndView(AomsConstant.MODEL_VIEW_NAME);
		Map<String, DataSetObject> inDatasetMap = ncDto.getInDataSetMap(); 
		Map<String, DataSetObject> outDatasetMap = ncDto.getOutDataSetMap();
		DataSetObject outTranInfo = ncDto.getOutTransInfo();

		DataSetObject dsSearch = inDatasetMap.get("dsSearchLog");
		BdpsgAnceCrtMntrDto searchLogDto = (BdpsgAnceCrtMntrDto) dsSearch.get(0);

		List<Object> records = bdpsgAnceInqService.retrieveBdpsgAnceCrtMntrList(searchLogDto);

		DataSetObject dsObjCd = new DataSetObject();
		dsObjCd.setRowObjects(records); // dsObj = []
		outDatasetMap.put("dsMasterLogOutput", dsObjCd); // dsObj
		
		outDatasetMap.put(NexacroConstant.OUT_TRNS_INFO, outTranInfo);
		mav.addObject(NexacroConstant.OUT_DATASET_ATT_NAME, outDatasetMap);

		String message = messageService.getMsg(FWTR07);

		mav.addObject(NexacroConstant.ERROR_CODE, "0");
		mav.addObject(NexacroConstant.ERROR_MSG, message);
		return mav;
	}

    /**
     * 승객예고조회 > 승객예고 생성 모니터링 상세
     *
     * @Method Name : retrieveBdpsgAnceCrtMntrDtlList
     * @param ncDto
     * @param model
     * @return
     **/
    @PostMapping(value = "/retrieveBdpsgAnceCrtMntrDtlList.do")
	public ModelAndView retrieveBdpsgAnceCrtMntrDtlList(NexacroObjectDto ncDto, Model model) {
		ModelAndView mav = new ModelAndView(AomsConstant.MODEL_VIEW_NAME);
		Map<String, DataSetObject> inDatasetMap = ncDto.getInDataSetMap();
		Map<String, DataSetObject> outDatasetMap = ncDto.getOutDataSetMap();
		
		DataSetObject outTranInfo = ncDto.getOutTransInfo();

		DataSetObject dsSearch = inDatasetMap.get("dsSearchLog");
		BdpsgAnceCrtMntrDto searchLogDto = (BdpsgAnceCrtMntrDto) dsSearch.get(0);

		List<Object> records = bdpsgAnceInqService.retrieveBdpsgAnceCrtMntrDtlList(searchLogDto);

		DataSetObject dsObjCd = new DataSetObject();
		dsObjCd.setRowObjects(records); // dsObj = []
		outDatasetMap.put("dsDetailLogOutput", dsObjCd); // dsObj

		outDatasetMap.put(NexacroConstant.OUT_TRNS_INFO, outTranInfo);
		mav.addObject(NexacroConstant.OUT_DATASET_ATT_NAME, outDatasetMap);

		String message = messageService.getMsg(FWTR07);

		mav.addObject(NexacroConstant.ERROR_CODE, "0");
		mav.addObject(NexacroConstant.ERROR_MSG, message);
		return mav;
	}

    /**
     * 승객예고조회 > 승객예고 엑셀를 다운로드한다.
     *
     * @Method Name : downloadBdpsgAnceRsltExcel
     * @throws Exception 
     **/
    @PostMapping(value = "/downloadBdpsgAnceRsltExcel.do")
	public void downloadBdpsgAnceRsltExcel(HttpServletRequest request, HttpServletResponse response) throws Exception {
    	final int buffSIZE = 2048;
		String bdpsgAnceYmd = request.getParameter("bdpsgAnceYmd");
		String tmnlId = request.getParameter("tmnlId");
		
		BdpsgAnceRsltDto bdpsgAnceRsltDto = new BdpsgAnceRsltDto();
		bdpsgAnceRsltDto.setTmnlId(tmnlId);
		bdpsgAnceRsltDto.setBdpsgAnceYmd(bdpsgAnceYmd);
		
		if (StringUtils.isNotEmpty(bdpsgAnceYmd)) {
			String[] fileInfo = bdpsgAnceInqService.makeBdpsgAnceRsltExcel(bdpsgAnceRsltDto, request.getSession().getServletContext().getRealPath("/"));
			
			byte[] buffer = new byte[buffSIZE];
			
			
			File file = new File(fileInfo[0]);
			
			if(file.exists()) {
				try (
					ServletOutputStream outStream = response.getOutputStream();
					BufferedInputStream inStream  = new BufferedInputStream(new FileInputStream(file));
				) {
					response.setContentType("application/octet;charset=utf-8");
					response.setHeader("Content-Disposition", "attachment; filename=\"" + fileInfo[1] + "\"");
					
					int bytesRead = 0;

					while (bytesRead != -1) {
						bytesRead = inStream.read(buffer, 0, buffSIZE);
						outStream.write(buffer, 0, bytesRead);
					}
				} catch (IOException e) {
					throw new AomsBizException("FWIO25", new String[] { fileInfo[1] });
				}
			}
		}
	}
    
    /**
     * 승객예고조회 > 항공기별 승객수 > 항공기별 승객수를 조회한다.
     *
     * @Method Name : retrieveBdpsgCntForArcft
     * @param ncDto
     * @param model
     * @return
     **/
    @PostMapping(value = "/retrieveBdpsgCntForArcft.do")
	public ModelAndView retrieveBdpsgCntForArcft(NexacroObjectDto ncDto, Model model) {
		ModelAndView mav = new ModelAndView(AomsConstant.MODEL_VIEW_NAME);
		Map<String, DataSetObject> inDatasetMap = ncDto.getInDataSetMap();
		Map<String, DataSetObject> outDatasetMap = ncDto.getOutDataSetMap();
		
		DataSetObject outTranInfo = ncDto.getOutTransInfo();

		DataSetObject searchDsObj = inDatasetMap.get(DS_SEARCH);

		GdDataDto searchDto = (GdDataDto) searchDsObj.get(0);
		List<Object> records = bdpsgAnceInqService.retrieveBdpsgCntForArcftByGdData(searchDto);

		DataSetObject dsObj = new DataSetObject();
		dsObj.setRowObjects(records); // dsObj = []

		outDatasetMap.put("dsBdpsgRsvtOutput", dsObj); // dsObj

		outDatasetMap.put(NexacroConstant.OUT_TRNS_INFO, outTranInfo);
		mav.addObject(NexacroConstant.OUT_DATASET_ATT_NAME, outDatasetMap);

		// 해당되는 메시지를 세팅 할 것 - 개발자 변경
		String message = messageService.getMsg(FWTR07);

		mav.addObject(NexacroConstant.ERROR_CODE, "0");
		mav.addObject(NexacroConstant.ERROR_MSG, message);
		return mav;
	}
}                                                                                                                      		
