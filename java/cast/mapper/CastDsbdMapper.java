package aoms.pm.cast.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Param;
import org.egovframe.rte.psl.dataaccess.mapper.Mapper;

import aoms.pm.cast.dto.BdpsgAnceRawDto;
import aoms.pm.cast.dto.FcltUnitRawDto;
import aoms.pm.cast.dto.FltPsgRawDto;
import aoms.pm.cast.dto.FltSmryRawDto;
import aoms.pm.cast.dto.PsgDptcnyTrnsPrfmncRawDto;
import aoms.pm.cast.dto.PsgWtngRawDto;
import aoms.pm.cast.dto.SmltRsltRawDto;
import aoms.pm.cast.dto.WeatherDto;

/**
 * @Classname   : CastDsbdMapper.java
 * @Description :  일일 시뮬레이션 요약보기(대시보드) Mapper
 *
 * @Copyright (c) 인천국제공항 통합정보시스템 아시아나IDT 컨소시엄 All right reserved.
 * <pre>
 *------------------------------------------------------------------------------
 * Modification Information
 *------------------------------------------------------------------------------
 * 수정일 / 수정자 /수정내용
 * ----------  ------  ---------------------------------------------------------
 * 2026. 08. 09 / 노세찬 / 최초작성
 *------------------------------------------------------------------------------
 *
 * </pre>
 */
@Mapper
public interface CastDsbdMapper {
	String retrieveSmltIdByYmd(@Param("ymd") String ymd, @Param("smltType") String smltType);

	String retrieveLastCalcDt(@Param("smltId") String smltId);

	List<String> retrieveAvlTimeList(@Param("smltId") String smltId);

	FltSmryRawDto retrieveFltSmry(@Param("ymd") String ymd, @Param("tmnlIdList") List<String> tmnlIdList);

	FltSmryRawDto retrieveFltSmryByTime(
			@Param("ymd") String ymd,
			@Param("tmnlIdList") List<String> tmnlIdList,
			@Param("bgnHhmm") String bgnHhmm,
			@Param("endHhmm") String endHhmm
	);

	List<FltPsgRawDto> retrieveHourlyFltPsgList(
			@Param("ymd") String ymd,
			@Param("tmnlIdList") List<String> tmnlIdList
	);

	List<BdpsgAnceRawDto> retrieveHourlyBdpsgAnceList(
			@Param("ymd") String ymd,
			@Param("tmnlIdList") List<String> tmnlIdList
	);

	List<PsgDptcnyTrnsPrfmncRawDto> retrieveHourlyPsgDptcnyTrnsPrfmncList(
			@Param("ymd") String ymd,
			@Param("tmnlIdList") List<String> tmnlIdList
	);

	List<SmltRsltRawDto> retrieveRsltByHourList(
			@Param("smltId") String smltId,
			@Param("tmnlId") String tmnlId,
			@Param("upPsgFcltCdList") List<String> upPsgFcltCdList
	);

	List<PsgWtngRawDto> retrievePsgWtngByHourList(
			@Param("ymd") String ymd,
			@Param("tmnlId") String tmnlId,
			@Param("fcltTypeCdList") List<String> fcltTypeCdList
	);

	List<SmltRsltRawDto> retrieveRsltByUnitList(
			@Param("smltId") String smltId,
			@Param("tmnlId") String tmnlId,
			@Param("hhmm") String hhmm,
			@Param("upPsgFcltCdList") List<String> upPsgFcltCdList
	);

	List<FcltUnitRawDto> retrieveFcltUnitList(
			@Param("tmnlId") String tmnlId,
			@Param("upPsgFcltCdList") List<String> upPsgFcltCdList
	);

	WeatherDto retrieveWeather(@Param("ymd") String ymd);
}
