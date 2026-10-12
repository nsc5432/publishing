package aoms.pm.cast.mapper;

import java.util.List;
import aoms.pm.cast.dto.UserSmltCurrentDto;

import org.apache.ibatis.annotations.Param;
import org.egovframe.rte.psl.dataaccess.mapper.Mapper;

import aoms.pm.cast.dto.DepFcltRawDto;
import aoms.pm.cast.dto.DepGateDto;
import aoms.pm.cast.dto.ScCntRawDto;
import aoms.pm.cast.dto.UserDepOperHrRawDto;
import aoms.pm.cast.dto.UserSmltDepSaveDto;

@Mapper
public interface CastDepMapper {
    List<DepFcltRawDto> retrieveDepFcltList(@Param("tmnlId") String tmnlId);

    List<ScCntRawDto> retrieveScCntList(
        @Param("tmnlId") String tmnlId, @Param("scRsrcId") String scRsrcId
    );

    List<DepGateDto> retrieveUserDepList(UserSmltCurrentDto scope);

    List<UserDepOperHrRawDto> retrieveUserDepOperHrList(UserSmltCurrentDto scope);

    void deleteUserDepList(UserSmltDepSaveDto saveDto);

    void deleteUserDepOperHrList(UserSmltDepSaveDto saveDto);

    void insertUserDepList(UserSmltDepSaveDto saveDto);

    void insertUserDepOperHrList(UserSmltDepSaveDto saveDto);
}
