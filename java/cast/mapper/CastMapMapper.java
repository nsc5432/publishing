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
 * 2026. 08. 12 / 노세찬 / 한 시각 조회 → 하루치 조회로 변경 (출국장 화면도 함께 쓴다)
 *------------------------------------------------------------------------------
 *
 * </pre>
 */
@Mapper
public interface CastMapMapper {
	/**
	 * 하루치 시설 묶음 단위 결과를 30분 버킷으로 접어 돌려준다.
	 * 도면 마커 · 상단 혼잡 알림 · 상세 팝업 · 출국장 추이가 <b>이 한 건</b>을 나눠 쓴다.
	 * 결과 상세는 10분 간격이라 한 버킷에 3행이 들어온다.
	 */
	List<SmltRsltRawDto> retrieveMapRsltDayList(
			@Param("smltId") String smltId,
			@Param("tmnlId") String tmnlId,
			@Param("upPsgFcltCdList") List<String> upPsgFcltCdList
	);
}
