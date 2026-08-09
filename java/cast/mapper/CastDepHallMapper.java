package aoms.pm.cast.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Param;
import org.egovframe.rte.psl.dataaccess.mapper.Mapper;

import aoms.pm.cast.dto.SmltRsltRawDto;

/**
 * @Classname   : CastDepHallMapper.java
 * @Description :  일일 시뮬레이션 결과 조회 - 출국장 Mapper
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
 *
 * 한 시각의 값은 맵형태보기와 같은 statement(CastMapMapper.retrieveMapRsltList)를 쓴다.
 * 여기에는 <b>하루 전체</b>가 필요한 차트 보기용 statement 만 둔다.
 */
@Mapper
public interface CastDepHallMapper {
	/**
	 * 하루치 출국장 결과를 30분 버킷으로 접어 돌려준다.
	 * 결과 상세는 10분 간격이라 한 버킷에 3행이 들어온다.
	 */
	List<SmltRsltRawDto> retrieveDepHallTrendList(
			@Param("smltId") String smltId,
			@Param("tmnlId") String tmnlId,
			@Param("upPsgFcltCdList") List<String> upPsgFcltCdList
	);
}
