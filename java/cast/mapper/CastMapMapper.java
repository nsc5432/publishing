package aoms.pm.cast.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Param;
import org.egovframe.rte.psl.dataaccess.mapper.Mapper;

import aoms.pm.cast.dto.SmltRsltRawDto;

/**
 * @Classname   : CastMapMapper.java
 * @Description :  일일 시뮬레이션 맵형태보기 Mapper
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
public interface CastMapMapper {
	/**
	 * 타임라인 시각의 시설 묶음 단위 결과.
	 * 도면 마커 · 상단 혼잡 알림 · 상세 팝업이 <b>이 한 건</b>을 나눠 쓴다.
	 * 타임라인이 30분 단위라 결과(10분 간격)를 30분 버킷으로 접어 집계한다.
	 */
	List<SmltRsltRawDto> retrieveMapRsltList(
			@Param("smltId") String smltId,
			@Param("tmnlId") String tmnlId,
			@Param("hhmm") String hhmm,
			@Param("upPsgFcltCdList") List<String> upPsgFcltCdList
	);
}
