package aoms.pm.cast.mapper;

import org.apache.ibatis.annotations.Param;
import org.egovframe.rte.psl.dataaccess.mapper.Mapper;

import aoms.pm.cast.dto.UserSmltReqDto;

@Mapper
public interface CastUserReqMapper {
    void insertUserReq(UserSmltReqDto dto);

    UserSmltReqDto retrieveUserReqByKey(@Param("smltReqId") String smltReqId);
}
