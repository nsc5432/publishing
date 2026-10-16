package aoms.pm.cast.mapper;

import java.util.List;
import org.apache.ibatis.annotations.Param;
import org.egovframe.rte.psl.dataaccess.mapper.Mapper;
import aoms.pm.cast.dto.ChknBoothDto;
import aoms.pm.cast.dto.ChknIslandDto;
import aoms.pm.cast.dto.DepGateDto;
import aoms.pm.cast.dto.FltPsgRawDto;
import aoms.pm.cast.dto.OprTimeDto;

@Mapper
public interface CastResourceConditionMapper {
    List<FltPsgRawDto> retrieveFlightHours(@Param("resourceId") String resourceId, @Param("tmnlIds") List<String> tmnlIds);
    List<ChknIslandDto> retrieveIslands(@Param("caId") String caId, @Param("sbdId") String sbdId, @Param("tmnlId") String tmnlId);
    List<ChknBoothDto> retrieveBooths(@Param("caId") String caId, @Param("tmnlId") String tmnlId, @Param("island") String island);
    List<OprTimeDto> retrieveCheckinHours(@Param("caId") String caId, @Param("sbdId") String sbdId, @Param("tmnlId") String tmnlId, @Param("island") String island);
    List<DepGateDto> retrieveGates(@Param("depId") String depId, @Param("scId") String scId, @Param("tmnlId") String tmnlId);
    List<OprTimeDto> retrieveDepartureHours(@Param("depId") String depId, @Param("tmnlId") String tmnlId, @Param("gateNo") String gateNo);
}
