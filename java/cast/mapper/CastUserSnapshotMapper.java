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

	void deleteRsrcAtrb(
			@Param("atrbTableNm") String atrbTableNm,
			@Param("atrbIdColumnNm") String atrbIdColumnNm,
			@Param("rsrcNo") String rsrcNo
	);

	void deleteRsrcMstr(
			@Param("mstrTableNm") String mstrTableNm,
			@Param("mstrIdColumnNm") String mstrIdColumnNm,
			@Param("rsrcNo") String rsrcNo
	);

	void insertRsrcMstr(
			@Param("mstrTableNm") String mstrTableNm,
			@Param("mstrIdColumnNm") String mstrIdColumnNm,
			@Param("mstrNmColumnNm") String mstrNmColumnNm,
			@Param("snapshot") UserSmltRsrcSnapshotDto snapshot
	);

	void insertSchdlAtrbFromDaily(UserSmltRsrcSnapshotDto dto);

	void insertSchdlAtrbFromSrc(UserSmltRsrcSnapshotDto dto);

	void insertCknctAtrb(UserSmltRsrcSnapshotDto dto);

	void insertSbdAtrb(UserSmltRsrcSnapshotDto dto);

	void insertSbdAtrbKiosk(UserSmltRsrcSnapshotDto dto);

	void insertDptgtAtrb(UserSmltRsrcSnapshotDto dto);

	void insertScrtyCntrlAtrb(UserSmltRsrcSnapshotDto dto);
}
