package aoms.pm.cast.mapper;

import org.apache.ibatis.annotations.Param;
import org.egovframe.rte.psl.dataaccess.mapper.Mapper;

import aoms.pm.cast.dto.UserSmltRsrcSnapshotDto;

/**
 * @Classname   : CastUserSnapshotMapper.java
 * @Description : 사용자 조건 → CAST 입력 리소스 snapshot 발행 Mapper
 *
 * @Copyright (c) 인천국제공항 통합정보시스템 아시아나IDT 컨소시엄 All right reserved.
 * <pre>
 *------------------------------------------------------------------------------
 * Modification Information
 *------------------------------------------------------------------------------
 * 수정일 / 수정자 /수정내용
 * ----------  ------  ---------------------------------------------------------
 * 2026. 08. 27 / 노세찬 / 최초작성
 *------------------------------------------------------------------------------
 *
 * </pre>
 */
@Mapper
public interface CastUserSnapshotMapper {
	String retrieveNextRsrcNo();

	void deleteSchdlAtrb(@Param("rsrcNo") String rsrcNo);

	void deleteSchdlMstr(@Param("rsrcNo") String rsrcNo);

	void insertSchdlMstr(UserSmltRsrcSnapshotDto dto);

	void insertSchdlAtrbFromDaily(UserSmltRsrcSnapshotDto dto);

	void insertSchdlAtrbFromSrc(UserSmltRsrcSnapshotDto dto);

	void deleteCknctAtrb(@Param("rsrcNo") String rsrcNo);

	void deleteCknctMstr(@Param("rsrcNo") String rsrcNo);

	void insertCknctMstr(UserSmltRsrcSnapshotDto dto);

	void insertCknctAtrb(UserSmltRsrcSnapshotDto dto);

	void deleteSbdAtrb(@Param("rsrcNo") String rsrcNo);

	void deleteSbdMstr(@Param("rsrcNo") String rsrcNo);

	void insertSbdMstr(UserSmltRsrcSnapshotDto dto);

	void insertSbdAtrb(UserSmltRsrcSnapshotDto dto);

	void deleteDptgtAtrb(@Param("rsrcNo") String rsrcNo);

	void deleteDptgtMstr(@Param("rsrcNo") String rsrcNo);

	void insertDptgtMstr(UserSmltRsrcSnapshotDto dto);

	void insertDptgtAtrb(UserSmltRsrcSnapshotDto dto);

	void deleteScrtyCntrlAtrb(@Param("rsrcNo") String rsrcNo);

	void deleteScrtyCntrlMstr(@Param("rsrcNo") String rsrcNo);

	void insertScrtyCntrlMstr(UserSmltRsrcSnapshotDto dto);

	void insertScrtyCntrlAtrb(UserSmltRsrcSnapshotDto dto);
}
