package aoms.pm.cast.mapper;

import org.apache.ibatis.annotations.Param;
import org.egovframe.rte.psl.dataaccess.mapper.Mapper;
import aoms.pm.cast.dto.UserSmltCurrentDto;

@Mapper
public interface CastExecutionMapper {
    aoms.pm.cast.dto.SmltStngDto retrieveInputBase(@Param("ymd") String ymd);
    void syncHistory(@Param("smltId") String smltId);
    String nextSmltId();
    String retrieveSaveDt(UserSmltCurrentDto scope);
    int hasCurrentConditions(@Param("scope") UserSmltCurrentDto scope, @Param("area") String area);
    aoms.pm.cast.dto.SmltStngDto retrieveExecutionResources(@Param("smltId") String smltId, @Param("tmnlId") String tmnlId);
    aoms.pm.cast.dto.UserSmltReqDto retrievePropertySetRequest(@Param("resourceId") String resourceId);
    String retrieveBaseSmltId(@Param("ymd") String ymd);
    String reserveRsrcNo(@Param("kind") String kind, @Param("minNo") int minNo, @Param("maxNo") int maxNo);
    int hasModel(@Param("smltId") String smltId, @Param("mdlSn") String mdlSn);
}
