package aoms.pm.cast.mapper;

import org.apache.ibatis.annotations.Param;
import org.egovframe.rte.psl.dataaccess.mapper.Mapper;

import aoms.pm.cast.dto.UserSmltRsrcSnapshotDto;

@Mapper
public interface CastUserSnapshotMapper {



    void insertRsrcMstr(
            @Param("rsrcTable") String rsrcTable,
            @Param("snapshot") UserSmltRsrcSnapshotDto snapshot
    );

    void insertSchdlAtrbFromDaily(UserSmltRsrcSnapshotDto dto);

    void insertSchdlAtrbFromSrc(UserSmltRsrcSnapshotDto dto);

    void insertCknctAtrb(UserSmltRsrcSnapshotDto dto);

    void insertSbdAtrb(UserSmltRsrcSnapshotDto dto);

    void insertSbdAtrbKiosk(UserSmltRsrcSnapshotDto dto);

    void insertDptgtAtrb(UserSmltRsrcSnapshotDto dto);

    void insertScrtyCntrlAtrb(UserSmltRsrcSnapshotDto dto);

    void insertEntcnyAtrb(UserSmltRsrcSnapshotDto dto);

    void insertTrnstScrtyCntrlAtrb(UserSmltRsrcSnapshotDto dto);
}
