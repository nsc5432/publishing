package aoms.pm.adtoper.service.impl;

import static java.util.stream.Collectors.toList;

import java.io.File;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.IdentityHashMap;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;
import java.util.stream.Collectors;

import javax.annotation.processing.FilerException;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import aoms.framework.cmmn.service.SessionService;
import aoms.framework.nexacro.dto.DataSetObject;
import aoms.pm.adtoper.dto.AdtOperHrElementDto;
import aoms.pm.adtoper.dto.AdtOperHrMngDto;
import aoms.pm.adtoper.dto.AdtOperHrMngSearchDto;
import aoms.pm.adtoper.dto.AdtOperHrMstrDto;
import aoms.pm.adtoper.dto.AdtOperHrMstrListDto;
import aoms.pm.adtoper.dto.AdtOperHrTimelineDto;
import aoms.pm.adtoper.mapper.AdtOperHrMngMapper;
import aoms.pm.adtoper.service.AdtOperHrMngService;
import aoms.pm.adtoper.service.AdtOperHrTimelineService;
import aoms.pm.cmmn.dto.ValidCheckDto;
import aoms.pm.cmmn.dto.ValidCheckDto.ValidCheckDtoBuilder;
import aoms.pm.utils.DateUtils;
import aoms.pm.utils.HwpxUtils;
import aoms.pm.utils.SessionUtils;

import kr.dogfoot.hwpxlib.object.HWPXFile;
import kr.dogfoot.hwpxlib.reader.HWPXReader;
import lombok.RequiredArgsConstructor;

/**
 * @Classname : AdtOperHrMngServiceImpl.java
 * @Description : 입출국장 운영시간 ServiceImpl (3테이블 MSTR/ELEMENT/MNG)
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
@Service("AdtOperHrMngService")
@RequiredArgsConstructor
@Transactional(rollbackFor = Exception.class)
public class AdtOperHrMngServiceImpl implements AdtOperHrMngService {
	private final AdtOperHrMngMapper adtOperHrMngMapper;
	private final AdtOperHrTimelineService adtOperHrTimelineService;
	private final SessionService sessionService;
	private static final int MAX_TABLE_CNT = 6;
	private static final int MAX_TABLE_ROW_CNT = 5;
	private static final int MAX_TABLE_COL_CNT = 8;
	private static final DateTimeFormatter YMD = DateTimeFormatter.BASIC_ISO_DATE; // yyyyMMdd
	private static final String BSC_OPER_HR_N = "N";

	@Override
	public List<AdtOperHrMngDto> retrieveOperHr(AdtOperHrMngSearchDto searchDto) {
		AdtOperHrMngSearchDto dto = new AdtOperHrMngSearchDto();
		dto.setCrtrYmd(searchDto.getCrtrYmd());
		dto.setTmnlSeCd(searchDto.getTmnlSeCd());
		dto.setFcltSeCd(searchDto.getFcltSeCd());
		return adtOperHrMngMapper.retrieveOperHr(dto);
	}
	
	@Override
	public List<AdtOperHrMstrListDto> retrieveMstrListByPeriod(AdtOperHrMngSearchDto searchDto) {
		return adtOperHrMngMapper.retrieveMstrListByPeriod(searchDto);
	}

	@Override
	public List<AdtOperHrMstrListDto> retrieveDplyMstrListByTmnlPeriod(AdtOperHrMngSearchDto searchDto) {
		return adtOperHrMngMapper.retrieveDplyMstrListByTmnlPeriod(searchDto);
	}

	@Override
	public List<AdtOperHrMngDto> resolveOperHrByPeriod(AdtOperHrMngSearchDto searchDto) {
		List<AdtOperHrMngDto> result = new ArrayList<>();
		if (searchDto.getMstrSeqList().isEmpty()) {
			return result; // 체크된 배포버전이 없으면 결과 없음
		}

		List<AdtOperHrMngDto> candidates = adtOperHrMngMapper.retrieveOperHrCandidates(searchDto);
		if (candidates.isEmpty()) {
			return result;
		}

		String schFrom = searchDto.getSchFrom();
		String schTo = searchDto.getSchTo();

		// 시설(A/D/T)별로 독립 해소 (시설마다 행=날짜구간 타임라인을 따로 구성)
		Map<String, List<AdtOperHrMngDto>> byFclt = candidates.stream()
				.collect(Collectors.groupingBy(AdtOperHrMngDto::getFcltSeCd, LinkedHashMap::new, toList()));

		for (List<AdtOperHrMngDto> fcltRows : byFclt.values()) {
			result.addAll(resolveOneFacility(fcltRows, schFrom, schTo));
		}
		return result;
	}

	private List<AdtOperHrMngDto> resolveOneFacility(List<AdtOperHrMngDto> rows, String schFrom, String schTo) {
		List<AdtOperHrMngDto> out = new ArrayList<>();
		if (rows.isEmpty()) {
			return out;
		}

		Set<AdtOperHrMngDto> openEnded = Collections.newSetFromMap(new IdentityHashMap<>());
		for (AdtOperHrMngDto r : rows) {
			String b = r.getBgngYmd();
			boolean open = r.isOpenEnded();
			
			if (open) {
				openEnded.add(r);
			}
			String e = open ? schTo : r.getEndYmd();
			if (b.compareTo(schFrom) < 0) {
				b = schFrom;
			}
			if (e.compareTo(schTo) > 0) {
				e = schTo;
			}
			r.setBgngYmd(b);
			r.setEndYmd(e);
		}

		TreeSet<String> bounds = new TreeSet<>();
		for (AdtOperHrMngDto r : rows) {
			bounds.add(r.getBgngYmd());
			bounds.add(plusOneDay(r.getEndYmd()));
		}
		List<String> boundList = new ArrayList<>(bounds);

		LinkedHashSet<String> types = rows.stream().map(AdtOperHrMngDto::getFcltyTypeId).collect(Collectors.toCollection(LinkedHashSet::new));

		int strgSn = 0;
		for (int i = 0; i < boundList.size() - 1; i++) {
			String segStart = boundList.get(i);
			String segEnd = minusOneDay(boundList.get(i + 1));
			if (segStart.compareTo(segEnd) > 0) {
				continue;
			}

			List<AdtOperHrMngDto> segRows = new ArrayList<>();
			for (String type : types) {
				AdtOperHrMngDto winner = null;
				for (AdtOperHrMngDto r : rows) {
					if (!type.equals(r.getFcltyTypeId())) {
						continue;
					}

					if (r.getBgngYmd().compareTo(segStart) <= 0 && r.getEndYmd().compareTo(segEnd) >= 0
							&& (winner == null || isHigherPriority(r, winner))) {
						winner = r;
					}
				}
				if (winner != null) {
					boolean openEnd = openEnded.contains(winner) && segEnd.compareTo(schTo) >= 0;
					segRows.add(buildSegmentRow(winner, segStart, openEnd ? null : segEnd));
				}
			}

			if (!segRows.isEmpty()) {
				strgSn++;
				for (AdtOperHrMngDto s : segRows) {
					s.setStrgSn(strgSn);
				}
				out.addAll(segRows);
			}
		}
		return out;
	}

	private boolean isHigherPriority(AdtOperHrMngDto a, AdtOperHrMngDto b) {
		int as = a.getSortOrdr() == null ? Integer.MIN_VALUE : a.getSortOrdr();
		int bs = b.getSortOrdr() == null ? Integer.MIN_VALUE : b.getSortOrdr();
		if (as != bs) {
			return as > bs;
		}
		return a.getMstrSeq() > b.getMstrSeq();
	}

	private AdtOperHrMngDto buildSegmentRow(AdtOperHrMngDto w, String segStart, String segEnd) {
		AdtOperHrMngDto d = new AdtOperHrMngDto();
		d.setElementSeq(w.getElementSeq());
		d.setMstrSeq(w.getMstrSeq());
		d.setTmnlSeCd(w.getTmnlSeCd());
		d.setFcltSeCd(w.getFcltSeCd());
		d.setFcltyTypeId(w.getFcltyTypeId());
		d.setBscOperHrYn(w.getBscOperHrYn());
		d.setBgngYmd(segStart);
		d.setEndYmd(segEnd);
		d.setOperBgng1Hr(w.getOperBgng1Hr());
		d.setOperEnd1Hr(w.getOperEnd1Hr());
		d.setOperBgng2Hr(w.getOperBgng2Hr());
		d.setOperEnd2Hr(w.getOperEnd2Hr());
		d.setOperBgng3Hr(w.getOperBgng3Hr());
		d.setOperEnd3Hr(w.getOperEnd3Hr());
		d.setSortOrdr(w.getSortOrdr());
		d.setUseYn("Y");
		return d;
	}

	@Override
	public List<AdtOperHrMstrListDto> retrieveMstrList(AdtOperHrMngSearchDto searchDto) {
		return adtOperHrMngMapper.retrieveMstrList(searchDto);
	}

	@Override
	public List<AdtOperHrElementDto> retrieveElementList(AdtOperHrMngSearchDto searchDto) {
		return adtOperHrMngMapper.retrieveElementList(searchDto);
	}

	@Override
	public List<AdtOperHrMngDto> retrieveOperHrMngList(AdtOperHrMngSearchDto searchDto) {
		return adtOperHrMngMapper.retrieveOperHrMngList(searchDto);
	}

	@Override
	public List<AdtOperHrTimelineDto> retrieveOperHrTimeline(AdtOperHrMngSearchDto searchDto) {
		return adtOperHrTimelineService.retrieveTimeline(searchDto);
	}

	@Override
	public List<AdtOperHrTimelineDto> retrievePreviousOperHr(AdtOperHrMngSearchDto searchDto) {
		return adtOperHrTimelineService.retrievePrevious(searchDto);
	}

	@Override
	public int createNewDeployment(int mstrSeq, List<AdtOperHrElementDto> selections) {
		if (selections == null || selections.isEmpty()) {
			return 0;
		}

		int targetSeq = mstrSeq;

		if (targetSeq == 0) {
			AdtOperHrMngSearchDto tmpSearch = new AdtOperHrMngSearchDto();
			tmpSearch.setStatCd(AdtOperHrMstrDto.STAT_TMP);
			List<AdtOperHrMstrListDto> tmpList = adtOperHrMngMapper.retrieveMstrList(tmpSearch);
			if (tmpList != null && !tmpList.isEmpty()) {
				targetSeq = tmpList.get(0).getSeq();
			}
		}

		if (targetSeq == 0) {
			targetSeq = adtOperHrMngMapper.getNextMstrSeq();
			AdtOperHrMstrDto newMstr = new AdtOperHrMstrDto();
			SessionUtils.setUserContext(newMstr, sessionService);
			newMstr.setSeq(targetSeq);
			newMstr.setDplyNm("신규배포");
			newMstr.setStatCd(AdtOperHrMstrDto.STAT_TMP);
			adtOperHrMngMapper.insertMstr(newMstr);
		}
		
		AdtOperHrMstrDto targetMstr = adtOperHrMngMapper.retrieveMstr(targetSeq);
		if (targetMstr == null || !AdtOperHrMstrDto.STAT_TMP.equals(targetMstr.getStatCd())) {
			throw new IllegalArgumentException("진행중인 배포만 변경 대상을 재설정 할수 있습니다.");
		}
		
		AdtOperHrMngSearchDto savedSearch = new AdtOperHrMngSearchDto();
		savedSearch.setMstrSeq(targetSeq);
		List<AdtOperHrMngDto> savedRows = adtOperHrMngMapper.retrieveOperHrMngList(savedSearch);
		
		int nextElementSeq = adtOperHrMngMapper.getNextElementSeq();
		adtOperHrMngMapper.deleteOperHrMngByMstr(targetSeq);
		adtOperHrMngMapper.deleteElementsByMstr(targetSeq);
		
		for (AdtOperHrElementDto selected : selections) {
			AdtOperHrMngSearchDto baseSearch = new AdtOperHrMngSearchDto();
			baseSearch.setTmnlSeCd(selected.getTmnlSeCd());
			baseSearch.setFcltSeCd(selected.getFcltSeCd());
			AdtOperHrElementDto baseElement = adtOperHrMngMapper.retrieveLastDeployedElement(baseSearch);

			int newElementSeq = nextElementSeq++;
			AdtOperHrElementDto newElement = new AdtOperHrElementDto();
			SessionUtils.setUserContext(newElement, sessionService);
			newElement.setSeq(newElementSeq);
			newElement.setMstrSeq(targetSeq);
			newElement.setTmnlSeCd(selected.getTmnlSeCd());
			newElement.setFcltSeCd(selected.getFcltSeCd());
			if (baseElement != null) {
				newElement.setSortOrdr(baseElement.getSortOrdr() + 1);
				newElement.setPrevElementSeq(baseElement.getSeq());
			} else {
				newElement.setSortOrdr(1);
				newElement.setPrevElementSeq(null);
			}
			
			adtOperHrMngMapper.insertElement(newElement);
			
			for (AdtOperHrMngDto savedRow : savedRows) {
				if (selected.getTmnlSeCd().equals(savedRow.getTmnlSeCd()) && selected.getFcltSeCd().equals(savedRow.getFcltSeCd())) {
					SessionUtils.setUserContext(savedRow, sessionService);
					savedRow.setElementSeq(newElementSeq);
					adtOperHrMngMapper.insertOperHrMng(savedRow);
				}
			}
		}

		return targetSeq;
	}

	@Override
	public int saveOperHrMng(DataSetObject dsObj, AdtOperHrMngSearchDto searchDto) {

		List<AdtOperHrMngDto> rows = dsObj == null || dsObj.isEmpty() ? Collections.emptyList() : toRowList(dsObj);
		ValidCheckDto scheduledOnly = validateScheduledOnly(rows);

		if (!scheduledOnly.isValid()) {
			throw new IllegalArgumentException(scheduledOnly.getMessage());
		}
		
		int elementSeq = rows.isEmpty() ? searchDto.getElementSeq() : rows.get(0).getElementSeq();
		int mstrSeq = rows.isEmpty() ? searchDto.getMstrSeq() : rows.get(0).getMstrSeq();
		
		if (elementSeq <= 0 || mstrSeq <= 0) {
			throw new IllegalArgumentException("임시저장 대상을 확인할 수 없습니다.");
		}

		AdtOperHrMngDto delDto = new AdtOperHrMngDto();
		SessionUtils.setUserContext(delDto, sessionService);
		delDto.setElementSeq(elementSeq);
		delDto.setMstrSeq(mstrSeq);
		adtOperHrMngMapper.deleteOperHrMng(delDto);

		int cnt = 0;
		for (AdtOperHrMngDto item : rows) {
			SessionUtils.setUserContext(item, sessionService);

			item.setBscOperHrYn(BSC_OPER_HR_N);

			if (item.isOpenEnded()) {
				item.setEndYmd(AdtOperHrMngDto.OPEN_END_YMD);
			}
			
			cnt += adtOperHrMngMapper.insertOperHrMng(item);
		}

		String dplyNm = searchDto.getDplyNm();
		if (dplyNm != null && !dplyNm.isEmpty()) {
			AdtOperHrMstrDto mstr = new AdtOperHrMstrDto();
			SessionUtils.setUserContext(mstr, sessionService);
			mstr.setSeq(mstrSeq);
			mstr.setDplyNm(dplyNm.trim());
			adtOperHrMngMapper.updateMstrDplyNm(mstr);
		}

		AdtOperHrMstrDto savedMstr = adtOperHrMngMapper.retrieveMstr(mstrSeq);
		if (savedMstr != null && AdtOperHrMstrDto.STAT_DPL.equals(savedMstr.getStatCd())) {
			sendEsbAdtOperInfoList(mstrSeq, "U");
		}

		return rows.isEmpty() ? 1 : cnt;
	}

	@Override
	public int updateDeploymentName(int mstrSeq, String dplyNm) {
		if (mstrSeq <= 0 || dplyNm == null) {
			return 0;
		}

		String normalizedName = dplyNm.trim();
		if (normalizedName.isEmpty()) {
			return 0;
		}

		AdtOperHrMstrDto mstr = adtOperHrMngMapper.retrieveMstr(mstrSeq);

		if (mstr == null) {
			return 0;
		}

		SessionUtils.setUserContext(mstr, sessionService);
		mstr.setDplyNm(normalizedName);
		return adtOperHrMngMapper.updateMstrDplyNm(mstr);
	}

	@Override
	public ValidCheckDto validationCheck(DataSetObject dsObj) {
		ValidCheckDtoBuilder vcdb = ValidCheckDto.builder().isValid(false);

		List<AdtOperHrMngDto> periods = dsObj == null || dsObj.isEmpty() ? Collections.emptyList() : toRowList(dsObj);
		
		ValidCheckDto scheduledOnly = validateScheduledOnly(periods);

		if (!scheduledOnly.isValid()) {
			return scheduledOnly;
		}

		for (int i = 0; i < periods.size(); i++) {
			for (int j = i + 1; j < periods.size(); j++) {
				AdtOperHrMngDto a = periods.get(i);
				AdtOperHrMngDto b = periods.get(j);
				if (isOverlap(a, b)) {
					String aEndText = (a.getEndYmd() == null || a.getEndYmd().isEmpty()) ? "미정" : a.getEndYmd();
					return vcdb
							.message("입력한 기간이 서로 겹칩니다.\n(" + a.getBgngYmd() + " ~ " + aEndText + ")")
							.build();
				}
			}
		}

		return vcdb.isValid(true).build();
	}

	private boolean isOverlap(AdtOperHrMngDto a, AdtOperHrMngDto b) {
		if (a.getStrgSn() == b.getStrgSn()) {
			return false;
		}

		String aEnd = openEndYmd(a);
		String bEnd = openEndYmd(b);
		return a.getBgngYmd().compareTo(bEnd) <= 0 && b.getBgngYmd().compareTo(aEnd) <= 0;
	}

	private String openEndYmd(AdtOperHrMngDto dto) {
		return dto.isOpenEnded() ? AdtOperHrMngDto.OPEN_END_YMD : dto.getEndYmd();
	}

	private List<AdtOperHrMngDto> toRowList(DataSetObject dsObj) {
		List<AdtOperHrMngDto> rows = new ArrayList<>();

		for (int i = 0; i < dsObj.size(); i++) {
			rows.add((AdtOperHrMngDto) dsObj.get(i));
		}

		return rows;
	}

	private ValidCheckDto validateScheduledOnly(List<AdtOperHrMngDto> rows) {
		ValidCheckDtoBuilder vcdb = ValidCheckDto.builder().isValid(false);

		for (AdtOperHrMngDto row : rows) {
			if (row.getStrgSn() <= 0) {
				return vcdb.message("현행 운영시간은 저장 대상이 아닙니다.").build();
			}
		}

		return vcdb.isValid(true).build();
	}

	// 배포완료 (확정)
	@Override
	public int deployOperHrMng(int mstrSeq, List<AdtOperHrElementDto> selectedElements) {
		if (selectedElements == null || selectedElements.isEmpty()) {
			return 0;
		}
		
		List<String> emptyElements = new ArrayList<>();
		
		for (AdtOperHrElementDto selected : selectedElements) {
			AdtOperHrMngSearchDto search = new AdtOperHrMngSearchDto();
			search.setMstrSeq(mstrSeq);
			search.setTmnlSeCd(selected.getTmnlSeCd());
			search.setFcltSeCd(selected.getFcltSeCd());
			
			if (adtOperHrMngMapper.retrieveOperHrMngList(search).isEmpty()) {
				emptyElements.add(selected.getTmnlSeCd() + " " + selected.getFcltSeCd());
			}
		}
		
		if (!emptyElements.isEmpty()) {
			throw new IllegalArgumentException("변경할 운영시간을 입력하지 않은 배포 대상이 있습니다: " + String.join(", ", emptyElements));
		}

		Set<String> selectedKeys = selectedElements.stream().map(e -> e.getTmnlSeCd() + "|" + e.getFcltSeCd()).collect(Collectors.toSet());

		AdtOperHrMngSearchDto elSearch = new AdtOperHrMngSearchDto();
		elSearch.setMstrSeq(mstrSeq);
		for (AdtOperHrElementDto el : adtOperHrMngMapper.retrieveElementList(elSearch)) {
			if (selectedKeys.contains(el.getTmnlSeCd() + "|" + el.getFcltSeCd())) {
				continue;
			}
			AdtOperHrElementDto delEl = new AdtOperHrElementDto();
			SessionUtils.setUserContext(delEl, sessionService);
			delEl.setSeq(el.getSeq());
			adtOperHrMngMapper.updateElementUseYn(delEl);

			AdtOperHrMngDto delMng = new AdtOperHrMngDto();
			SessionUtils.setUserContext(delMng, sessionService);
			delMng.setElementSeq(el.getSeq());
			adtOperHrMngMapper.updateOperHrMngUseYn(delMng);
		}

		// 1) 현재 배포 상태 DPL 처리
		AdtOperHrMstrDto statDto = new AdtOperHrMstrDto();
		SessionUtils.setUserContext(statDto, sessionService);
		statDto.setSeq(mstrSeq);
		statDto.setStatCd(AdtOperHrMstrDto.STAT_DPL);
		adtOperHrMngMapper.updateMstrStat(statDto);

		// ESB 송신
		return sendEsbAdtOperInfoList(mstrSeq, "I");
	}

	@Override
	public int deleteOperHrMng(int mstrSeq) {
		AdtOperHrMstrDto mstr = adtOperHrMngMapper.retrieveMstr(mstrSeq);
		boolean wasDeployed = mstr != null && AdtOperHrMstrDto.STAT_DPL.equals(mstr.getStatCd());

		AdtOperHrMstrDto statDto = new AdtOperHrMstrDto();
		SessionUtils.setUserContext(statDto, sessionService);
		statDto.setSeq(mstrSeq);
		statDto.setStatCd(AdtOperHrMstrDto.STAT_CNL);
		int cnt = adtOperHrMngMapper.updateMstrStat(statDto);

		// 3) ESB 삭제 송신 (배포되어 타시스템에 전송된 건만)
		if (wasDeployed) {
			sendEsbAdtOperInfoList(mstrSeq, "D");
		}
		return cnt;
	}

	/** yyyyMMdd 문자열 - 1일 */
	private String minusOneDay(String yyyymmdd) {
		return LocalDate.parse(yyyymmdd, YMD).minusDays(1).format(YMD);
	}

	/** yyyyMMdd 문자열 + 1일 */
	private String plusOneDay(String yyyymmdd) {
		return LocalDate.parse(yyyymmdd, YMD).plusDays(1).format(YMD);
	}

	private int sendEsbAdtOperInfoList(int mstrSeq, String msgType) {
		int result = 0;

		for (AdtOperHrTimelineDto item : adtOperHrTimelineService.retrieveEsbRows(mstrSeq)) {
			result += adtOperHrMngMapper.insertEsbAdtOperInfo(item.toEsbAdtOperInfoDto(msgType));
		}
		
		if (result > 0) {
			AdtOperHrMstrDto trsmDto = new AdtOperHrMstrDto();
			SessionUtils.setUserContext(trsmDto, sessionService);
			trsmDto.setSeq(mstrSeq);
			adtOperHrMngMapper.updateMstrOperHrTrsmDt(trsmDto);
		}
		
		return result;
	}

	// 공문 다운로드 (.hwpx)
	@SuppressWarnings("PMD.AvoidCatchingGenericException") // HWPXReader 라이브러리 내부에서 Exception 을 던지기 때문에 예외처리
	@Override
	public String[] downloadAdtOperHrMng(int mstrSeq, String webAppPath, boolean arrCheck, boolean depCheck, boolean tsCheck) throws FilerException {
		List<AdtOperHrMngDto> targetList = new ArrayList<>(adtOperHrTimelineService.retrieveDeploymentTimeline(mstrSeq));
		String serverDirPath = webAppPath + File.separator + "template";

		String crtrYmd = DateUtils.dateToStr(LocalDate.now());
		
		StringBuilder sb = new StringBuilder();
		int tableCnt = 0;
		
		if (arrCheck) {
			sb.append("a");
			tableCnt += 2;
			appendFallbackTimeline(targetList, "A", crtrYmd);
		}
		
		if (depCheck) {
			sb.append("d");
			tableCnt += 2;
			appendFallbackTimeline(targetList, "D", crtrYmd);
		}
		
		if (tsCheck) {
			sb.append("t");
			tableCnt += 2;
			appendFallbackTimeline(targetList, "T", crtrYmd);
		}
		
		String destFileName = "operation-time-plan.hwpx";
		String srcFilePath = serverDirPath + File.separator + sb.toString() + "-oper-table.hwpx";
		String destFilePath = serverDirPath + File.separator + destFileName;
		
		List<AdtOperHrMngDto> list = targetList.stream()
				.sorted(
					Comparator.comparing(AdtOperHrMngDto::getTmnlSeCd)
						.thenComparing(AdtOperHrMngDto::getFcltSeCd)
						.thenComparingInt(AdtOperHrMngDto::getStrgSn)
						.thenComparing(AdtOperHrMngDto::getFcltyTypeId)
				)
				.collect(toList());

		Set<String> highlightKeys = new HashSet<>();
		Map<String, String> variables = makeReplaceMap(list, highlightKeys);

		try {
			HWPXFile hwpxFile = HWPXReader.fromFilepath(srcFilePath);
			deleteTemplateRows(hwpxFile, list, arrCheck, depCheck, tsCheck);
			new HwpxUtils(hwpxFile)
		        .setAll(variables)
		        .setHighlightKeys(highlightKeys)
		        .process()
		        .clearEmptyContentByTableCnt(tableCnt)
		        .save(destFilePath);
		} catch (Exception ex) {
			throw new FilerException(ex.getMessage());
		}

		return new String[] {destFilePath, destFileName};
	}

	private void appendFallbackTimeline(List<AdtOperHrMngDto> targetList, String fcltSeCd, String crtrYmd) {
		for (String tmnlSeCd : new String[] {"P01", "P03"}) {
			boolean exists = targetList.stream()
				.anyMatch(x -> fcltSeCd.equals(x.getFcltSeCd()) && tmnlSeCd.equals(x.getTmnlSeCd()));

			if (exists) {
				continue;
			}

			AdtOperHrMngSearchDto searchDto = new AdtOperHrMngSearchDto();
			searchDto.setCrtrYmd(crtrYmd);
			searchDto.setTmnlSeCd(tmnlSeCd);
			searchDto.setFcltSeCd(fcltSeCd);
			targetList.addAll(adtOperHrTimelineService.retrieveTimeline(searchDto));
		}
	}

	private Map<String, String> makeReplaceMap(List<AdtOperHrMngDto> list, Set<String> highlightKeys) {
    	Map<String, String> result = new HashMap<>();

    	for (int i = 0; i < MAX_TABLE_CNT; i++) {
    		for (int j = 0; j < MAX_TABLE_ROW_CNT; j++) {
    			for (int k = 0; k < MAX_TABLE_COL_CNT; k++) {
    				result.put(i + "-" + j + "-" + k + "-0" , "N/A");
    				result.put(i + "-" + j + "-" + k + "-1" , "");
    			}
    		}
    	}

    	result.putAll(makeReplaceMapDetail(list.stream().filter(x -> x.getTmnlSeCd().equals("P01") && x.getFcltSeCd().equals("A")).collect(toList()), 0, highlightKeys));
    	result.putAll(makeReplaceMapDetail(list.stream().filter(x -> x.getTmnlSeCd().equals("P01") && x.getFcltSeCd().equals("D")).collect(toList()), 1, highlightKeys));
    	result.putAll(makeReplaceMapDetail(list.stream().filter(x -> x.getTmnlSeCd().equals("P01") && x.getFcltSeCd().equals("T")).collect(toList()), 2, highlightKeys));
    	result.putAll(makeReplaceMapDetail(list.stream().filter(x -> x.getTmnlSeCd().equals("P03") && x.getFcltSeCd().equals("A")).collect(toList()), 3, highlightKeys));
    	result.putAll(makeReplaceMapDetail(list.stream().filter(x -> x.getTmnlSeCd().equals("P03") && x.getFcltSeCd().equals("D")).collect(toList()), 4, highlightKeys));
    	result.putAll(makeReplaceMapDetail(list.stream().filter(x -> x.getTmnlSeCd().equals("P03") && x.getFcltSeCd().equals("T")).collect(toList()), 5, highlightKeys));
    	return result;
    }

    private Map<String, String> makeReplaceMapDetail(List<AdtOperHrMngDto> filteredList, int tableIdx, Set<String> highlightKeys) {
    	Map<Integer, List<AdtOperHrMngDto>> groupMap = filteredList.stream().collect(Collectors.groupingBy(AdtOperHrMngDto::getStrgSn));
    	List<Integer> sortedKeys = groupMap.keySet().stream().sorted().limit(MAX_TABLE_ROW_CNT).collect(Collectors.toList());

    	Map<String, String> result = new HashMap<>();
    	Map<Integer, String> firstOperHrByCol = new HashMap<>(); // 열 → 첫 행의 운영시간
    	Map<Integer, String> prevOperHrByCol = new HashMap<>(); // 열 → 직전 차수의 운영시간
    	int rowIndex = -1;

    	for (Integer key : sortedKeys) {
    		List<AdtOperHrMngDto> groupFiltered = groupMap.get(key);
    		rowIndex++;

    		for (AdtOperHrMngDto item : groupFiltered) {
    			int col = resolveColumn(item);
    			if (col != -1) {
    				processTimeData(result, tableIdx, col, rowIndex, item);
    				markChangedTime(highlightKeys, firstOperHrByCol, prevOperHrByCol, tableIdx, col, rowIndex, item);
    			}
    		}

    		if (rowIndex >= 1) {
    			processDateData(result, groupFiltered, tableIdx, rowIndex);
    		}
    	}
    	return result;
    }

    private void markChangedTime(Set<String> highlightKeys, Map<Integer, String> firstOperHrByCol, Map<Integer, String> prevOperHrByCol,
    		int tableIdx, int col, int rowIndex, AdtOperHrMngDto item) {
    	String operHr = item.getOperBgng1Hr() + "-" + item.getOperEnd1Hr();
    	String prevOperHr = prevOperHrByCol.put(col, operHr);

    	if (rowIndex == 0) {
    		firstOperHrByCol.put(col, operHr);
    		return;
    	}

    	if (prevOperHr != null && !prevOperHr.equals(operHr) && !operHr.equals(firstOperHrByCol.get(col))) {
    		String baseKey = tableIdx + "-" + rowIndex + "-" + col + "-";
    		highlightKeys.add(baseKey + 0);
    		highlightKeys.add(baseKey + 1);
    	}
    }

    private int resolveColumn(AdtOperHrMngDto item) {
    	String tmnl = item.getTmnlSeCd();
    	String fclt = item.getFcltSeCd();
    	String type = item.getFcltyTypeId();

    	if ("A".equals(fclt)) {
    		return "P03".equals(tmnl) ? getP03AColumn(type) : getAColumn(type);
    	} else if ("D".equals(fclt)) {
    		return getDColumn(type);
    	} else if ("T".equals(fclt)) {
    		return "P03".equals(tmnl) ? getP03TColumn(type) : getTColumn(type);
    	}
    	return -1;
    }

	private int getAColumn(String type) { // T1 입국장 : A/B/C/D/E/F 입국장
		if ("A".equals(type)) return 1;
		if ("B".equals(type)) return 2;
		if ("C".equals(type)) return 3;
		if ("D".equals(type)) return 4;
		if ("E".equals(type)) return 5;
		if ("F".equals(type)) return 6;
		return -1;
	}

	private int getP03AColumn(String type) { // T2 입국장 : A/B 입국장
		if ("A".equals(type)) return 1;
		if ("B".equals(type)) return 2;
		return -1;
	}

	private int getDColumn(String type) { // 출국장 : 出 번호 = 컬럼 번호
		try {
			return Integer.parseInt(type);
		} catch (NumberFormatException e) {
			return -1;
		}
	}

	private int getTColumn(String type) { // T1 환승장 : 동편(E)/서편(W)
		if ("E".equals(type)) return 1;
		if ("W".equals(type)) return 2;
		return -1;
	}

	private int getP03TColumn(String type) { // T2 환승장 : 서편(W)/동편(E)
		if ("W".equals(type)) return 1;
		if ("E".equals(type)) return 2;
		return -1;
	}

	private void processTimeData(Map<String, String> result, int table, int col, int row, AdtOperHrMngDto item) {
		String baseKey = table + "-" + row + "-" + col + "-";

		if (item.getOperBgng1Hr().equals("0000") && item.getOperEnd1Hr().equals("2359")) { // 24시간
			result.put(baseKey + 0, "24시간");
			result.put(baseKey + 1, "");
		} else {
			result.put(baseKey + 0, DateUtils.timeFormat(item.getOperBgng1Hr()) + "~");
			result.put(baseKey + 1, DateUtils.timeFormat(item.getOperEnd1Hr()));
		}
	}

	private void processDateData(Map<String, String> result, List<AdtOperHrMngDto> group, int table, int row) {
		AdtOperHrMngDto firstItem = group.get(0);
		String bgngYmd = firstItem.getBgngYmd();
		String endYmd = firstItem.getEndYmd();
		boolean openEnded = firstItem.isOpenEnded();

		String key = table + "-" + row + "-0-";
		if (openEnded || bgngYmd.equals(endYmd)) {
			result.put(key + 0, DateUtils.toKoreanShortDate(bgngYmd) + (openEnded ? "~" : ""));
			result.put(key + 1, "");
		} else {
			result.put(key + 0, DateUtils.toKoreanShortDate(bgngYmd) + "~");
			result.put(key + 1, DateUtils.toKoreanShortDate(endYmd));
		}
	}

	private void deleteTemplateRows(HWPXFile hwpxFile, List<AdtOperHrMngDto> list, boolean arrCheck, boolean depCheck, boolean tsCheck) throws Exception {
    	int p01ADelCnt = getAdtRowCount(list.stream().filter(x -> x.getTmnlSeCd().equals("P01") && x.getFcltSeCd().equals("A")).collect(toList()));
    	int p01DDelCnt = getAdtRowCount(list.stream().filter(x -> x.getTmnlSeCd().equals("P01") && x.getFcltSeCd().equals("D")).collect(toList()));
    	int p01TDelCnt = getAdtRowCount(list.stream().filter(x -> x.getTmnlSeCd().equals("P01") && x.getFcltSeCd().equals("T")).collect(toList()));
    	int p03ADelCnt = getAdtRowCount(list.stream().filter(x -> x.getTmnlSeCd().equals("P03") && x.getFcltSeCd().equals("A")).collect(toList()));
    	int p03DDelCnt = getAdtRowCount(list.stream().filter(x -> x.getTmnlSeCd().equals("P03") && x.getFcltSeCd().equals("D")).collect(toList()));
    	int p03TDelCnt = getAdtRowCount(list.stream().filter(x -> x.getTmnlSeCd().equals("P03") && x.getFcltSeCd().equals("T")).collect(toList()));

    	int i = 1;
    	if (arrCheck) {
    		HwpxUtils.deleteLastN(HwpxUtils.findTable(hwpxFile, i++), p01ADelCnt);
    	}
    	if (depCheck) {
    		HwpxUtils.deleteLastN(HwpxUtils.findTable(hwpxFile, i++), p01DDelCnt);
    	}
    	if (tsCheck) {
    		HwpxUtils.deleteLastN(HwpxUtils.findTable(hwpxFile, i++), p01TDelCnt);
    	}
    	if (arrCheck) {
    		HwpxUtils.deleteLastN(HwpxUtils.findTable(hwpxFile, i++), p03ADelCnt);
    	}
    	if (depCheck) {
    		HwpxUtils.deleteLastN(HwpxUtils.findTable(hwpxFile, i++), p03DDelCnt);
    	}
    	if (tsCheck) {
    		HwpxUtils.deleteLastN(HwpxUtils.findTable(hwpxFile, i), p03TDelCnt);
    	}
	}

    private int getAdtRowCount(List<AdtOperHrMngDto> filteredList) {
    	Map<Integer, List<AdtOperHrMngDto>> groupMap = filteredList.stream().collect(Collectors.groupingBy(AdtOperHrMngDto::getStrgSn));
    	return Math.max(0, MAX_TABLE_ROW_CNT - groupMap.size());
    }
}
