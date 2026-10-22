package aoms.pm.castapi.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Param;
import org.egovframe.rte.psl.dataaccess.mapper.Mapper;

import aoms.pm.castapi.log.CastApiLogEntry;
import aoms.pm.castapi.log.CastApiLogSetting;

@Mapper
public interface CastApiLogMapper {
    List<CastApiLogSetting> retrieveSettings(@Param("apiTypeCd") String apiTypeCd);
    int insertLog(CastApiLogEntry entry);
}
