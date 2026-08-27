package aoms.pm.cast.mapper;

import java.time.LocalDateTime;
import java.util.List;

import org.apache.ibatis.annotations.Param;
import org.egovframe.rte.psl.dataaccess.mapper.Mapper;

import aoms.pm.cast.dto.BdpsgAnceRawDto;
import aoms.pm.cast.dto.ChknAlnAssignmentRawDto;
import aoms.pm.cast.dto.FcltUnitRawDto;
import aoms.pm.cast.dto.FltSmryRawDto;
import aoms.pm.cast.dto.PsgDptcnyTrnsPrfmncRawDto;
import aoms.pm.cast.dto.PsgPrcsGradeRawDto;
import aoms.pm.cast.dto.PsgWtngRawDto;
import aoms.pm.cast.dto.SmltRsltRawDto;
import aoms.pm.cast.dto.WeatherDto;

@Mapper
public interface CastDsbdMapper {
	String retrieveSmltIdByYmd(@Param("ymd") String ymd, @Param("smltType") String smltType);

	String retrieveLastCalcDt(@Param("smltId") String smltId);

	List<String> retrieveAvlTimeList(@Param("smltId") String smltId);

	/** tmnlIdList 가 비면 공항 전체, bgnHhmm/endHhmm 이 null 이면 하루 전체를 집계한다. */
	FltSmryRawDto retrieveFltSmry(
			@Param("ymd") String ymd,
			@Param("tmnlIdList") List<String> tmnlIdList,
			@Param("bgnHhmm") String bgnHhmm,
			@Param("endHhmm") String endHhmm
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

	/** smltActlDt 를 주면 그 시각 한 칸만, 주지 않으면 [bgnDt, endDt) 구간을 읽는다. */
	List<SmltRsltRawDto> retrieveRsltByUnitList(
			@Param("smltId") String smltId,
			@Param("tmnlId") String tmnlId,
			@Param("bgnDt") LocalDateTime bgnDt,
			@Param("endDt") LocalDateTime endDt,
			@Param("smltActlDt") LocalDateTime smltActlDt,
			@Param("upPsgFcltCdList") List<String> upPsgFcltCdList
	);

	List<PsgPrcsGradeRawDto> retrievePsgPrcsGradeList(@Param("fcltGroupCd") String fcltGroupCd);

	List<ChknAlnAssignmentRawDto> retrieveChknAlnAssignmentList(
			@Param("excnYmd") String excnYmd,
			@Param("tmnlId") String tmnlId,
			@Param("bgnDt") LocalDateTime bgnDt,
			@Param("cknctAlctnRsrcId") String cknctAlctnRsrcId
	);

	List<FcltUnitRawDto> retrieveScrtyOpenCountList(
			@Param("tmnlId") String tmnlId,
			@Param("scrtyCntrlRsrcId") String scrtyCntrlRsrcId
	);

	List<FcltUnitRawDto> retrieveFcltUnitList(
			@Param("tmnlId") String tmnlId,
			@Param("upPsgFcltCdList") List<String> upPsgFcltCdList
	);

	WeatherDto retrieveWeather(@Param("ymd") String ymd);
}
