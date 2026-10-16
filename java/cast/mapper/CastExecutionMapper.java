package aoms.pm.cast.mapper;

import org.apache.ibatis.annotations.Param;
import org.egovframe.rte.psl.dataaccess.mapper.Mapper;
import aoms.pm.cast.dto.UserSmltCurrentDto;

@Mapper
public interface CastExecutionMapper {
    int isResultGroupingVerified();
    aoms.pm.cast.dto.SmltStngDto retrieveInputBase(@Param("ymd") String ymd);
    String retrieveResultGroup(@Param("groupKey") String groupKey);
    void insertResultGroup(@Param("groupKey") String groupKey, @Param("smltId") String smltId);
    void syncHistory(@Param("smltId") String smltId);
    String lockAllocator();
    String nextSmltId();
    String retrieveSaveDt(UserSmltCurrentDto scope);
    int hasSaved(@Param("scope") UserSmltCurrentDto scope, @Param("area") String area);
    void markSaved(@Param("scope") UserSmltCurrentDto scope, @Param("area") String area);
    aoms.pm.cast.dto.SmltStngDto retrieveExecutionResources(@Param("smltId") String smltId, @Param("tmnlId") String tmnlId);
    aoms.pm.cast.dto.UserSmltReqDto retrievePropertySetRequest(@Param("resourceId") String resourceId);
    String retrieveBaseSmltId(@Param("ymd") String ymd);
    String reserveRsrcNo(@Param("kind") String kind, @Param("minNo") int minNo, @Param("maxNo") int maxNo);
    int updateLastRsrcNo(@Param("kind") String kind, @Param("rsrcNo") String rsrcNo);
    String retrieveResultId(@Param("sourceKey") String sourceKey);
    void insertResultIdentity(@Param("sourceKey") String sourceKey, @Param("smltId") String smltId, @Param("payloadHash") String payloadHash);
    String retrieveResultHash(@Param("sourceKey") String sourceKey);
    int hasModel(@Param("smltId") String smltId, @Param("mdlSn") String mdlSn);
}
