package aoms.pm.cast.mapper;

import org.apache.ibatis.annotations.Param;
import org.egovframe.rte.psl.dataaccess.mapper.Mapper;
import aoms.pm.cast.dto.SmltMasterDto;
import aoms.pm.cast.dto.UserSmltCurrentDto;

@Mapper
public interface CastExecutionMapper {
    int isResultGroupingVerified();
    aoms.pm.cast.dto.SmltStngDto retrieveInputBase(@Param("ymd") String ymd);
    void archiveInput(@Param("smltId") String smltId, @Param("type") String type, @Param("resourceId") String resourceId, @Param("sourceId") String sourceId, @Param("payload") String payload);
    String retrieveInput(@Param("type") String type, @Param("resourceId") String resourceId);
    String retrieveResultGroup(@Param("groupKey") String groupKey);
    void insertResultGroup(@Param("groupKey") String groupKey, @Param("smltId") String smltId);
    void syncHistory(@Param("smltId") String smltId);
    String lockAllocator();
    String nextSmltId();
    void insertMaster(SmltMasterDto dto);
    String retrieveSaveDt(UserSmltCurrentDto scope);
    int hasSaved(@Param("scope") UserSmltCurrentDto scope, @Param("area") String area);
    void markSaved(@Param("scope") UserSmltCurrentDto scope, @Param("area") String area);
    void storeCondition(@Param("smltId") String smltId, @Param("tmnlId") String tmnlId, @Param("area") String area, @Param("payload") String payload);
    String retrieveCondition(@Param("smltId") String smltId, @Param("tmnlId") String tmnlId, @Param("area") String area);
    String retrieveBaseSmltId(@Param("ymd") String ymd);
    String reserveRsrcNo(@Param("kind") String kind, @Param("minNo") int minNo, @Param("maxNo") int maxNo);
    void assignRsrcNo(@Param("kind") String kind, @Param("rsrcNo") String rsrcNo, @Param("smltId") String smltId);
    int updateLastRsrcNo(@Param("kind") String kind, @Param("rsrcNo") String rsrcNo);
    String retrieveResultId(@Param("sourceKey") String sourceKey);
    void insertResultIdentity(@Param("sourceKey") String sourceKey, @Param("smltId") String smltId, @Param("payloadHash") String payloadHash);
    String retrieveResultHash(@Param("sourceKey") String sourceKey);
    int hasModel(@Param("smltId") String smltId, @Param("mdlSn") String mdlSn);
    void completeMaster(@Param("smltId") String smltId, @Param("startTime") String startTime, @Param("stopTime") String stopTime);
    void updateStatus(@Param("smltId") String smltId, @Param("status") String status);
}
