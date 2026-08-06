package aoms.pm.cast.service.impl;

import static java.util.stream.Collectors.toList;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.TreeMap;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import aoms.pm.cast.domains.AggData;
import aoms.pm.cast.dto.PsgPrcsGrd;
import aoms.pm.cast.dto.SmltKpiDto;
import aoms.pm.cast.dto.SmltKpiRawDto;
import aoms.pm.cast.dto.SmltSmryDepSearchDto;
import aoms.pm.cast.dto.SmltSmryDto;
import aoms.pm.cast.dto.SmltSmryMapSearchDto;
import aoms.pm.cast.dto.SmltStngDto;
import aoms.pm.cast.dto.SmltStngSearchDto;
import aoms.pm.cast.dto.SmryChknDto;
import aoms.pm.cast.dto.SmryDepDto;
import aoms.pm.cast.dto.SmryScDto;
import aoms.pm.cast.dto.SummaryFlightDto;
import aoms.pm.cast.dto.SummaryMapDto;
import aoms.pm.cast.dto.SummaryRsltDto;
import aoms.pm.cast.dto.WaitPsgDto;
import aoms.pm.cast.enums.CongestionStatus;
import aoms.pm.cast.enums.CongestionType;
import aoms.pm.cast.enums.PrcsGrdType;
import aoms.pm.cast.mapper.CastSmltMapper;
import aoms.pm.cast.service.CastSmltService;
import aoms.pm.utils.DateUtils;
import aoms.pm.utils.SmltUtils;
import aoms.pm.utils.StringUtils;
import aoms.pm.utils.TimeBucketUtils;

import lombok.RequiredArgsConstructor;

/**
 * @Classname : CastSmltServiceImpl.java
 * @Description : Cast 시뮬레이션 ServiceImpl
 *
 * @Copyright (c) 인천국제공항 통합정보시스템 아시아나IDT 컨소시엄 All right reserved.
 * <pre>
 * -----------------------------------------------------------------------------------
 * Modification Information
 * -----------------------------------------------------------------------------------
 * 수정일 / 수정자 / 수정내용
 * 2026. 03. 12. / 노세찬 / 최초작성
 * -----------------------------------------------------------------------------------
 * 
 * </pre> 
 */
@Service("castSmltService")
@RequiredArgsConstructor	
public class CastSmltServiceImpl implements CastSmltService {
	private static final int SEC_PER_MIN = 60; // _HR 컬럼(초) → 화면 표시 단위(분)

	private final CastSmltMapper castSmltMapper;
	private final List<String> islandList = List.of("A", "B", "C", "D", "E", "F", "G", "H", "J", "K", "L", "M", "N");
	private final List<String> depT1List = List.of("1", "2", "3", "4", "5", "6");
	private final List<String> depT2List = List.of("1", "2");
	private final List<String> scT1List = List.of("1", "2", "3", "4", "5", "6");
	private final List<String> scT2List = List.of("1", "2");

	@Override
	public String retrieveRecentSmltId(String ymd) {
		SmltStngSearchDto stngSearchDto = new SmltStngSearchDto();
		stngSearchDto.setSmltType("AUTO"); // 일일 시뮬레이션
		stngSearchDto.setExcnYmd(ymd);
		
		Optional<SmltStngDto> currentSmltStng = castSmltMapper.retrieveSmltStng(stngSearchDto)
				.stream().sorted((a, b) -> b.getSmltId().compareTo(a.getSmltId()))
				.findFirst();
		
		return currentSmltStng.isPresent() ? currentSmltStng.get().getSmltId() : "-1";
	}
	
	@Override
	public SmltSmryDto retrieveDailySmltSmry(String smltId, CongestionType congestionType) {
		SmltSmryDto result = new SmltSmryDto();
		
		SmltStngDto retrieveSmltStng = retrieveSmltStngByKey(smltId);
		String ymd = retrieveSmltStng.getExcnYmd();
		
		result.setSmltId(smltId);
		result.setYmd(ymd);
		result.setSummaryFlight(getSummaryFlight(ymd));
		
		result.setXovisT1Datas(getXovisDatas(ymd, congestionType, "P01", null, 30));
		result.setXovisT2Datas(getXovisDatas(ymd, congestionType, "P03", null, 30));
		
		List<SummaryRsltDto> castDatasT1 = getCastDatas(smltId, ymd, congestionType, "P01");
		List<SummaryRsltDto> castDatasT2 = getCastDatas(smltId, ymd, congestionType, "P03");
		
		result.setCastT1Datas(castDatasT1);
		result.setCastT2Datas(castDatasT2);
		
		String peakTimeT1 = getPeakTime(castDatasT1);
		String peakTimeT2 = getPeakTime(castDatasT2);
		
		result.setPeakTimeT1(peakTimeT1);
		result.setPeakTimeT2(peakTimeT2);
		
		String t1Dt = String.format("%s/%s/%s %s", ymd.substring(0, 4), ymd.substring(4, 6), ymd.substring(6), peakTimeT1.substring(0, 2));
		String t2Dt = String.format("%s/%s/%s %s", ymd.substring(0, 4), ymd.substring(4, 6), ymd.substring(6), peakTimeT2.substring(0, 2));
		
		result.setChknT1Datas(chknGrouping(getChknDatas(smltId, t1Dt, "P01"), 60, null));
		result.setChknT2Datas(chknGrouping(getChknDatas(smltId, t2Dt, "P03"), 60, null));
		
		result.setDepT1Datas(depGrouping(getDepDatas(smltId, t1Dt, "P01"), "P01", 60));
		result.setDepT2Datas(depGrouping(getDepDatas(smltId, t2Dt, "P03"), "P03", 60));
		
		return result;
	}

	@Override
	public List<SummaryRsltDto> retrieveDailySmltSmryDepChart(SmltSmryDepSearchDto searchDto) {
		SmltStngDto smltStng = retrieveSmltStngByKey(searchDto.getSmltId());
		return getDatasByFcltCd(smltStng.getSmltId(), smltStng.getExcnYmd(), searchDto.getTmnlId(), searchDto.getPsgFcltCdPrefix());
	}
	
	@Override
	public Map<String, SummaryMapDto> retrieveSmltSmryMap(SmltSmryMapSearchDto searchDto) {
		Map<String, SummaryMapDto> result = new TreeMap<>();
		
		List<SummaryRsltDto> chknDatas = getChknDatas(searchDto.getSmltId(), null, searchDto.getTmnlId());
		List<SummaryRsltDto> depDatas = getDepDatas(searchDto.getSmltId(), null, searchDto.getTmnlId());
		List<SummaryRsltDto> scDatas = getScDatas(searchDto.getSmltId(), null, searchDto.getTmnlId());
		
		Map<CongestionStatus, PsgPrcsGrd> prcsGrdMap = retrievePrcsGrdMap(PrcsGrdType.CHKN);
		
		for (String hour : TimeBucketUtils.hourList()) {
			List<SmryChknDto> chknGrouping = chknGrouping(chknDatas.stream().filter(x -> StringUtils.isMatchPatternLike(hour + "%", x.getTime())).collect(toList()), 30, prcsGrdMap);
			List<SmryDepDto> depGrouping = depGrouping(depDatas.stream().filter(x -> StringUtils.isMatchPatternLike(hour + "%", x.getTime())).collect(toList()), searchDto.getTmnlId(), 30);
			List<SmryScDto> scGrouping = scGrouping(scDatas.stream().filter(x -> StringUtils.isMatchPatternLike(hour + "%", x.getTime())).collect(toList()), searchDto.getTmnlId(), 30);

			for (String bucket : TimeBucketUtils.bucketList(hour)) {
				SummaryMapDto subResult = new SummaryMapDto();
				subResult.setChknList(chknGrouping.stream().filter(x -> bucket.equals(x.getTime())).collect(toList()));
				subResult.setDepList(depGrouping.stream().filter(x -> bucket.equals(x.getTime())).collect(toList()));
				subResult.setScList(scGrouping.stream().filter(x -> bucket.equals(x.getTime())).collect(toList()));
				result.put(bucket, subResult);
			}
		}

		return result;
	}
	
	private SummaryFlightDto getSummaryFlight(String ymd) {
		SummaryFlightDto result = new SummaryFlightDto();

		SummaryFlightDto summaryP01 = castSmltMapper.retrieveSummaryFlight(ymd, "P01");
		SummaryFlightDto summaryP02 = castSmltMapper.retrieveSummaryFlight(ymd, "P02");
		result.setT1FltCnt(summaryP01.getFltCnt() + summaryP02.getFltCnt());
		result.setT1PsgCnt(summaryP01.getPsgCnt() + summaryP02.getPsgCnt());
		
		SummaryFlightDto summaryP03 = castSmltMapper.retrieveSummaryFlight(ymd, "P03");
		result.setT2FltCnt(summaryP03.getFltCnt());
		result.setT2PsgCnt(summaryP03.getPsgCnt());
		
		String beforeYmd = DateUtils.dateToStr(DateUtils.strToDate(ymd).minusDays(1));
		SummaryFlightDto summaryBeforeP01 = castSmltMapper.retrieveSummaryFlight(beforeYmd, "P01");
		SummaryFlightDto summaryBeforeP02 = castSmltMapper.retrieveSummaryFlight(beforeYmd, "P02");
		result.setT1BeforeFltCnt(summaryBeforeP01.getFltCnt() + summaryBeforeP02.getFltCnt());
		result.setT1BeforePsgCnt(summaryBeforeP01.getPsgCnt() + summaryBeforeP02.getPsgCnt());
		
		SummaryFlightDto summaryBeforeP03 = castSmltMapper.retrieveSummaryFlight(beforeYmd, "P03");
		result.setT2BeforeFltCnt(summaryBeforeP03.getFltCnt());
		result.setT2BeforePsgCnt(summaryBeforeP03.getPsgCnt());
		
		return result;
	}
	
	@Override
	public List<SummaryRsltDto> getXovisDatas(String ymd, CongestionType congestionType, String tmnlId, String island, int interval) {
		List<String> fcltTypeCdList = new ArrayList<>();
		
		// Queue 체크인카운터 줄, DG 출국장, SC 보안검색대 
		if (congestionType.equals(CongestionType.PEAK_PSG)) {
			fcltTypeCdList.add("Queue");
			fcltTypeCdList.add("DG");
			fcltTypeCdList.add("SC");
		} else if (congestionType.equals(CongestionType.PEAK_CHKN)) {
			fcltTypeCdList.add("Queue");
		} else if (congestionType.equals(CongestionType.PEAK_DEP)) {
			fcltTypeCdList.add("DG");
		} else if (congestionType.equals(CongestionType.PEAK_SC)) {
			fcltTypeCdList.add("SC");
		}
		
		List<SummaryRsltDto> rsltDtls = castSmltMapper.retrieveXovisRsltDtl(ymd, tmnlId, island, fcltTypeCdList);
		return SmltUtils.aggregate(rsltDtls, interval, SummaryRsltDto::new);
	}
	
	private List<SummaryRsltDto> getCastDatas(String smltId, String ymd, CongestionType congestionType, String tmnlId) {
		List<String> upPsgFcltCdList = new ArrayList<>();
		String formatYmd = String.format("%s/%s/%s", ymd.substring(0, 4), ymd.substring(4, 6), ymd.substring(6)); // 2026/03/20
		
		// LS 랜드사이드 좌석, CC 체크인카운터, CK 셀프체크인, SBD 셀프백드랍, LGT 출국장, SC 보안검색대, SR 보안검색대RED
		if (congestionType.equals(CongestionType.PEAK_PSG)) {
		    upPsgFcltCdList.add("LS");
		    upPsgFcltCdList.add("CC");
		    upPsgFcltCdList.add("CK");
		    upPsgFcltCdList.add("SBD");
		    upPsgFcltCdList.add("LGT");
		    upPsgFcltCdList.add("SC");
		    upPsgFcltCdList.add("SR");
		} else if (congestionType.equals(CongestionType.PEAK_CHKN)) {
		    upPsgFcltCdList.add("LS");
		    upPsgFcltCdList.add("CC");
		    upPsgFcltCdList.add("CK");
		    upPsgFcltCdList.add("SBD");
		} else if (congestionType.equals(CongestionType.PEAK_DEP)) {
		    upPsgFcltCdList.add("LGT");
		} else if (congestionType.equals(CongestionType.PEAK_SC)) {
		    upPsgFcltCdList.add("SC");
		    upPsgFcltCdList.add("SR");
		}
		
		List<SummaryRsltDto> datas = castSmltMapper.retrieveCastRsltDtl(smltId, formatYmd, tmnlId, upPsgFcltCdList, null);
		return SmltUtils.aggregate(datas, 30, SummaryRsltDto::new);
	}
	
	private List<SummaryRsltDto> getDatasByFcltCd(String smltId, String ymd, String tmnlId, String psgFcltCdPrefix) {
		List<String> upPsgFcltCdList = List.of("LGT");
		String formatYmd = String.format("%s/%s/%s", ymd.substring(0, 4), ymd.substring(4, 6), ymd.substring(6)); // 2026/03/20
		List<SummaryRsltDto> datas = castSmltMapper.retrieveCastRsltDtl(smltId, formatYmd, tmnlId, upPsgFcltCdList, psgFcltCdPrefix);
		return SmltUtils.aggregate(datas, 60, SummaryRsltDto::new);
	}
	
	private List<SummaryRsltDto> getChknDatas(String smltId, String dt, String tmnlId) {
		List<String> upPsgFcltCdList = List.of("CC");
		return castSmltMapper.retrieveCastRsltDtl(smltId, dt, tmnlId, upPsgFcltCdList, null);
	}
	
	private List<SmryChknDto> chknGrouping(List<SummaryRsltDto> datas, int interval, Map<CongestionStatus, PsgPrcsGrd> prcsGrdMap) {
		List<SmryChknDto> result = new ArrayList<>();
		
		Map<CongestionStatus, PsgPrcsGrd> prcsGrdMapNew;
		if (prcsGrdMap == null) {
			prcsGrdMapNew = retrievePrcsGrdMap(PrcsGrdType.CHKN);	
		}else {
			prcsGrdMapNew = prcsGrdMap;
		}
		
		for (String island : islandList) {
			List<SummaryRsltDto> filtered = SmltUtils.aggregate(
				datas.stream().filter(x -> x.getPsgFcltCd().contains(island)).collect(toList()), 
				interval, 
				SummaryRsltDto::new
			);
			
			for (SummaryRsltDto target : filtered) {
				SmryChknDto item = new SmryChknDto();
				item.setTime(target.getTime());
				item.setIsland(island);
				item.setCgnStatus(SmltUtils.getCongestionStatus(prcsGrdMapNew, target.getWtngPsgCnt()));
				item.setOperCnt(10);
				item.setWtngPsgCnt(target.getWtngPsgCnt());
				item.setPrcsHr(target.getPrcsHr());
				item.setWtngHr(target.getWtngHr());
				
				result.add(item);	
			}
		}
		
		return result;
	}
	
	private List<SummaryRsltDto> getDepDatas(String smltId, String dt, String tmnlId) {
		List<String> upPsgFcltCdList = List.of("LGT");
		return castSmltMapper.retrieveCastRsltDtl(smltId, dt, tmnlId, upPsgFcltCdList, null);
	}
	
	private List<SmryDepDto> depGrouping(List<SummaryRsltDto> datas, String tmnlId, int interval) {
		List<SmryDepDto> result = new ArrayList<>();
		
		if (tmnlId.equals("P01")) {
			for (String depNum : depT1List) {
				List<SummaryRsltDto> filtered = SmltUtils.aggregate(datas.stream().filter(x -> StringUtils.isMatchPatternLike("T1_" + depNum + "%", x.getPsgFcltCd())).collect(toList()), interval, SummaryRsltDto::new);
				
				for (SummaryRsltDto target : filtered) {
					SmryDepDto item = new SmryDepDto();
					item.setTime(target.getTime());
					item.setDepNum(depNum);
					item.setCgnStatus(CongestionStatus.BUSY);
					item.setOper(true);
					item.setWtngPsgCnt(target.getWtngPsgCnt());
					item.setPrcsHr(target.getPrcsHr());
					item.setWtngHr(target.getWtngHr());
					result.add(item);
				}
				
			}
		} else if (tmnlId.equals("P03")) {
			for (String depNum : depT2List) {
				List<SummaryRsltDto> filtered = SmltUtils.aggregate(datas.stream().filter(x -> StringUtils.isMatchPatternLike("T2_" + depNum + "%", x.getPsgFcltCd())).collect(toList()), interval, SummaryRsltDto::new);
				
				for (SummaryRsltDto target : filtered) {
					SmryDepDto item = new SmryDepDto();
					item.setDepNum(depNum);
					item.setCgnStatus(CongestionStatus.BUSY);
					item.setOper(true);
					item.setWtngPsgCnt(target.getWtngPsgCnt());
					item.setPrcsHr(target.getPrcsHr());
					item.setWtngHr(target.getWtngHr());
					
					result.add(item);
				}
			}
		}
		
		return result;
	}
	
	private List<SummaryRsltDto> getScDatas(String smltId, String dt, String tmnlId) {
		List<String> upPsgFcltCdList = List.of("SC", "SR");
		return castSmltMapper.retrieveCastRsltDtl(smltId, dt, tmnlId, upPsgFcltCdList, null);
	}
	
	private List<SmryScDto> scGrouping(List<SummaryRsltDto> datas, String tmnlId, int interval) {
		List<SmryScDto> result = new ArrayList<>();
		
		if (tmnlId.equals("P01")) {
			for (String scNum : scT1List) {
				List<SummaryRsltDto> filtered = SmltUtils.aggregate(datas.stream().filter(x -> StringUtils.isMatchPatternLike("T1__" +  scNum +"%", x.getPsgFcltCd())).collect(toList()), interval, SummaryRsltDto::new);
				
				for (SummaryRsltDto target : filtered) {
					SmryScDto item = new SmryScDto();
					item.setTime(target.getTime());
					item.setScNum(scNum);
					item.setCgnStatus(CongestionStatus.BUSY);
					item.setWtngPsgCnt(target.getWtngPsgCnt());
					item.setPrcsHr(target.getPrcsHr());
					item.setWtngHr(target.getWtngHr());
					result.add(item);
				}	
			}
		} else {
			for (String scNum : scT2List) {
				List<SummaryRsltDto> filtered = SmltUtils.aggregate(datas.stream().filter(x -> StringUtils.isMatchPatternLike("T2__" +  scNum +"%", x.getPsgFcltCd())).collect(toList()), interval, SummaryRsltDto::new);
				
				for (SummaryRsltDto target : filtered) {
					SmryScDto item = new SmryScDto();
					item.setTime(target.getTime());
					item.setScNum(scNum);
					item.setCgnStatus(CongestionStatus.BUSY);
					item.setWtngPsgCnt(target.getWtngPsgCnt());
					item.setPrcsHr(target.getPrcsHr());
					item.setWtngHr(target.getWtngHr());
					result.add(item);
				}	
			}
		}

		return result;
	}
	
	@Override
	public SmltStngDto retrieveSmltStngByKey(String smltId) {
		SmltStngSearchDto stngSearchDto = new SmltStngSearchDto();
		stngSearchDto.setSmltId(smltId);
		return castSmltMapper.retrieveSmltStng(stngSearchDto).get(0);
	}
	
	@Override
	public Map<CongestionStatus, PsgPrcsGrd> retrievePrcsGrdMap(PrcsGrdType prcsGrdType) {
		String psgPrcsGrdCd = ""; 
		
		if (prcsGrdType.equals(PrcsGrdType.SLFCHKN)) {
			psgPrcsGrdCd = "01";
		} else if (prcsGrdType.equals(PrcsGrdType.CHKN)) {
			psgPrcsGrdCd = "02";
		} else if (prcsGrdType.equals(PrcsGrdType.DEP)) {
			psgPrcsGrdCd = "03";
		} else if (prcsGrdType.equals(PrcsGrdType.SC)) {
			psgPrcsGrdCd = "04";
		}
		
		List<PsgPrcsGrd> list = castSmltMapper.retrievePrcsGrd(psgPrcsGrdCd);
		return list.stream().collect(Collectors.toMap(PsgPrcsGrd::getCgnStatus, Function.identity()));
	}
	
	private String getPeakTime(List<? extends AggData> castDatas) {
		Optional<? extends AggData> peak = castDatas.stream().sorted((a, b) -> b.getWtngPsgCnt() - a.getWtngPsgCnt()).findFirst();
		return peak.isPresent() ? peak.get().getTime() : "0000";
	}

	@Override
	public List<WaitPsgDto> retrieveWaitPsgList(String smltId, String tmnlId, List<String> upPsgFcltCdList) {
		Map<Integer, WaitPsgDto> retrieved = castSmltMapper.retrieveWaitPsgList(smltId, tmnlId, upPsgFcltCdList)
				.stream().collect(Collectors.toMap(WaitPsgDto::getHour, Function.identity(), (a, b) -> a));

		List<WaitPsgDto> result = new ArrayList<>();

		// 결과가 없는 시간대(WTNG_PSG_CNT = 0)는 행이 없다. 24시간 축은 애플리케이션이 채운다
		for (String hour : TimeBucketUtils.hourList()) {
			int hourValue = Integer.parseInt(hour);
			WaitPsgDto item = retrieved.get(hourValue);
			result.add(item != null ? item : new WaitPsgDto().withHour(hourValue).withWaitPsgCnt(0));
		}

		return result;
	}

	@Override
	public SmltKpiDto retrieveSmltKpi(String smltId, String tmnlId, List<String> upPsgFcltCdList) {
		SmltKpiDto result = new SmltKpiDto();
		SmltKpiRawDto raw = castSmltMapper.retrieveSmltKpiRaw(smltId, tmnlId, upPsgFcltCdList);

		if (raw == null) {
			return result;
		}

		// _HR 컬럼은 초 단위다 (API_SPEC.md 5.2 대기시간(초)). 화면은 분으로 표시한다
		result.setAvgWaitMin(raw.getAvgWtngHr() / SEC_PER_MIN);
		result.setP95WaitMin(raw.getP95WtngHr() / SEC_PER_MIN);
		result.setMaxQueuePsgCnt(raw.getMaxWtngPsgCnt());

		return result;
	}
}
