package aoms.pm.cast.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Param;
import org.egovframe.rte.psl.dataaccess.mapper.Mapper;

import aoms.pm.cast.dto.SmltExcnCntRawDto;
import aoms.pm.cast.dto.SmltExcnDto;
import aoms.pm.cast.dto.SmltKpiRawDto;
import aoms.pm.cast.dto.SmltStngDto;
import aoms.pm.cast.dto.SmltStngSearchDto;
import aoms.pm.cast.dto.WaitPsgDto;

@Mapper
public interface CastSmltMapper {
    int deleteWaitingUserSmlt(@Param("smltId") String smltId, @Param("userId") String userId);

    List<SmltStngDto> retrieveSmltStng(SmltStngSearchDto searchDto);

    List<WaitPsgDto> retrieveWaitPsgList(@Param("smltId") String smltId, @Param("tmnlId") String tmnlId, @Param("upPsgFcltCdList") List<String> upPsgFcltCdList);

    SmltKpiRawDto retrieveSmltKpiRaw(@Param("smltId") String smltId, @Param("tmnlId") String tmnlId, @Param("upPsgFcltCdList") List<String> upPsgFcltCdList);

    SmltExcnDto retrieveSmltFlfmt(@Param("smltId") String smltId);

    List<SmltExcnDto> retrieveSmltFlfmtList(@Param("bgnDt") String bgnDt, @Param("endDt") String endDt);

    SmltExcnCntRawDto retrieveSmltFlfmtSmry(@Param("bgnDt") String bgnDt, @Param("endDt") String endDt);
}
