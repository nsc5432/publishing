package aoms.pm.cast.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Param;
import org.egovframe.rte.psl.dataaccess.mapper.Mapper;

import aoms.pm.cast.dto.BdpsgAnceRawDto;
import aoms.pm.cast.dto.FcltUnitRawDto;
import aoms.pm.cast.dto.FltPsgRawDto;
import aoms.pm.cast.dto.FltSmryRawDto;
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
	/** 기준일자의 시뮬레이션 ID. 같은 날 여러 건이면 가장 최근 것을 쓴다 */
	String retrieveSmltIdByYmd(@Param("ymd") String ymd, @Param("smltType") String smltType);

	/** 마지막 계산 시각 — 결과 상세의 최신 실행일시 yyyyMMddHHmmss */
	String retrieveLastCalcDt(@Param("smltId") String smltId);

	/** 결과가 존재하는 기준 시각 목록 HHmm — 상단 바의 시/분 선택 박스 */
	List<String> retrieveAvlTimeList(@Param("smltId") String smltId);

	/** 운항 요약 — 기준일 / 전일 / 지난주 同요일에 같은 statement 를 3번 쓴다 */
	FltSmryRawDto retrieveFltSmry(@Param("ymd") String ymd, @Param("tmnlIdList") List<String> tmnlIdList);

	/** 시간대별 출발 운항편·여객 */
	List<FltPsgRawDto> retrieveHourlyFltPsgList(
			@Param("ymd") String ymd,
			@Param("tmnlIdList") List<String> tmnlIdList
	);

	/** 시간대별 승객예고 (출발) — 승객예고/실적 비교 카드의 예고 막대 원천 */
	List<BdpsgAnceRawDto> retrieveHourlyBdpsgAnceList(
			@Param("ymd") String ymd,
			@Param("tmnlIdList") List<String> tmnlIdList
	);

	/** 시간대별 시뮬레이션 결과 (1시간 단위 집계) */
	List<SmltRsltRawDto> retrieveRsltByHourList(
			@Param("smltId") String smltId,
			@Param("tmnlId") String tmnlId,
			@Param("upPsgFcltCdList") List<String> upPsgFcltCdList
	);

	/** 시간대별 Xovis 실측 대기인원 (1시간 단위 집계) — 차트의 실적선 */
	List<PsgWtngRawDto> retrievePsgWtngByHourList(
			@Param("ymd") String ymd,
			@Param("tmnlId") String tmnlId,
			@Param("fcltTypeCdList") List<String> fcltTypeCdList
	);

	/** 기준 시각의 시설 묶음 단위(아일랜드 · 출국장) 결과 — 게이트 카드 원형 */
	List<SmltRsltRawDto> retrieveRsltByUnitList(
			@Param("smltId") String smltId,
			@Param("tmnlId") String tmnlId,
			@Param("hhmm") String hhmm,
			@Param("upPsgFcltCdList") List<String> upPsgFcltCdList
	);

	/** 시설 묶음 단위별 보유·운영 대수 — 게이트 카드의 전체/운영 */
	List<FcltUnitRawDto> retrieveFcltUnitList(
			@Param("tmnlId") String tmnlId,
			@Param("upPsgFcltCdList") List<String> upPsgFcltCdList
	);

	/** 기상정보 — 그날 가장 최근 발표 1건 (없으면 전 필드 기본값 1행) */
	WeatherDto retrieveWeather(@Param("ymd") String ymd);
}
