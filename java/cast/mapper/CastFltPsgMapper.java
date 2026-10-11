package aoms.pm.cast.mapper;

import java.util.List;
import aoms.pm.cast.dto.UserSmltCurrentDto;

import org.apache.ibatis.annotations.Param;
import org.egovframe.rte.psl.dataaccess.mapper.Mapper;

import aoms.pm.cast.dto.FltPsgRawDto;
import aoms.pm.cast.dto.UserFltPsgRawDto;
import aoms.pm.cast.dto.UserSmltFltPsgSaveDto;

@Mapper
public interface CastFltPsgMapper {

    List<FltPsgRawDto> retrieveFltPsgHourList(
            @Param("ymd") String ymd, @Param("tmnlIdList") List<String> tmnlIdList
    );

    UserFltPsgRawDto retrieveUserFltPsg(UserSmltCurrentDto scope);

    void insertUserFltPsg(UserSmltFltPsgSaveDto saveDto);

    int updateUserFltPsg(UserSmltFltPsgSaveDto saveDto);
}
