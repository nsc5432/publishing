package aoms.pm.castrest.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Param;
import org.egovframe.rte.psl.dataaccess.mapper.Mapper;

import aoms.pm.castrest.log.CastRestLogEntry;
import aoms.pm.castrest.log.CastRestLogSetting;

@Mapper
public interface CastRestLogMapper {
    List<CastRestLogSetting> retrieveSettings(@Param("apiTypeCd") String apiTypeCd);
    int insertLog(CastRestLogEntry entry);
}
